class_name CompletionEventSaveCoordinator
extends "res://scripts/image_aware_puzzle_catalog_save_coordinator.gd"

const CompletionRecordScript = preload("res://scripts/completion_record_v1.gd")
const PuzzleJournalStoreScript = preload("res://scripts/puzzle_journal_store.gd")
const TimelapseTraceScript = preload("res://scripts/timelapse_trace_v1.gd")

var journal_store = PuzzleJournalStoreScript.new()
var active_elapsed_seconds := 0.0
# CompletionRecord V1 keeps the legacy `hints_used` field, but V0-08 product
# semantics are assist/no-assist rather than renderer exposure counts. Keep this
# value normalized to 0/1 so repeated per-piece hint rendering cannot create
# meaningless numbers such as "50 hints used".
var active_hints_used := 0
var active_timelapse_trace: Dictionary = {}
var last_completion_record: Dictionary = {}
var last_completion_was_new := false


func _process(delta: float) -> void:
	if _completion_metrics_should_run():
		active_elapsed_seconds += maxf(delta, 0.0)


func _capture_snapshot() -> Dictionary:
	var snapshot: Dictionary = super._capture_snapshot()
	snapshot["completion_session"] = {
		"elapsed_seconds": maxi(0, int(round(active_elapsed_seconds))),
		"hints_used": 1 if active_hints_used > 0 else 0,
	}
	if not active_timelapse_trace.is_empty():
		snapshot["timelapse_session"] = active_timelapse_trace.duplicate(true)
	return snapshot


func create_slot_for_current_runtime() -> String:
	_reset_completion_session()
	return super.create_slot_for_current_runtime()


func commit_initial_selection() -> bool:
	_reset_completion_session()
	return super.commit_initial_selection()


func _resume_game_from_disk(game_id: String) -> bool:
	var snapshot = _read_json_dictionary(_slot_path(game_id))
	var session := {}
	var saved_trace := {}
	if snapshot is Dictionary:
		var raw_session = snapshot.get("completion_session", {})
		if raw_session is Dictionary:
			session = raw_session
		var raw_trace = snapshot.get("timelapse_session", {})
		if raw_trace is Dictionary:
			saved_trace = raw_trace

	var restored: bool = await super._resume_game_from_disk(game_id)
	if restored:
		active_elapsed_seconds = maxf(0.0, float(session.get("elapsed_seconds", 0.0)))
		# Older V0-08 saves may contain renderer exposure counts > 1. Normalize
		# them on resume into the new assist/no-assist contract.
		active_hints_used = 1 if int(session.get("hints_used", 0)) > 0 else 0
		active_timelapse_trace = {}
		if (
			TimelapseTraceScript.structurally_valid(saved_trace)
			and str(saved_trace.get("game_id", "")) == game_id
		):
			active_timelapse_trace = saved_trace.duplicate(true)
		last_completion_record = {}
		last_completion_was_new = false
		# Parent resume snapshots are captured before this additive V0-08 session
		# state is restored. Refresh the stable comparison baseline so the next
		# autosave only writes when gameplay time/state actually advances.
		last_snapshot_json = JSON.stringify(_capture_snapshot())
	return restored


func record_hint_use(_piece_index: int) -> void:
	if not _completion_metrics_should_run():
		return
	# `_show_hint_for_piece()` may run repeatedly while the player works. For the
	# Journal/completion contract we only care whether the game was hint-assisted.
	active_hints_used = 1


func ensure_timelapse_started() -> bool:
	if not active_timelapse_trace.is_empty():
		return true
	if board == null or active_game_id.is_empty() or runtime_completed:
		return false

	active_timelapse_trace = TimelapseTraceScript.build_trace(active_game_id)
	var piece_indexes: Array = []
	if board.get("pieces") is Array:
		for piece in board.pieces:
			if is_instance_valid(piece):
				piece_indexes.append(int(piece.piece_index))
	var events: Array = active_timelapse_trace["events"]
	events.append(TimelapseTraceScript.build_event(
		0,
		"start",
		0,
		piece_indexes,
		{"positions": _timelapse_positions_for(piece_indexes)}
	))
	active_timelapse_trace["events"] = events
	return true


func record_timelapse_event(
	kind: String,
	piece_indexes: Array = [],
	payload: Dictionary = {},
	capture_positions: bool = false
) -> bool:
	if not _completion_metrics_should_run():
		return false
	if not TimelapseTraceScript.ALLOWED_KINDS.has(kind) or kind == "start":
		return false
	if not ensure_timelapse_started():
		return false

	var events_value = active_timelapse_trace.get("events", [])
	if not (events_value is Array):
		return false
	var events: Array = events_value
	if events.size() >= TimelapseTraceScript.MAX_EVENTS:
		return false

	var event_payload: Dictionary = payload.duplicate(true)
	if capture_positions:
		event_payload["positions"] = _timelapse_positions_for(piece_indexes)
	var t_ms := maxi(0, int(round(active_elapsed_seconds * 1000.0)))
	if not events.is_empty():
		t_ms = maxi(t_ms, int(events[-1].get("t_ms", 0)))
	events.append(TimelapseTraceScript.build_event(
		events.size(),
		kind,
		t_ms,
		piece_indexes,
		event_payload
	))
	active_timelapse_trace["events"] = events
	return true


func timelapse_trace_snapshot() -> Dictionary:
	return active_timelapse_trace.duplicate(true)


func timelapse_event_count() -> int:
	var events = active_timelapse_trace.get("events", [])
	return events.size() if events is Array else 0


func complete_active_game_once() -> Dictionary:
	last_completion_was_new = false
	if runtime_completed or active_game_id.is_empty():
		return {}

	var game_id := active_game_id
	var record: Dictionary = journal_store.completion_for_game(game_id)
	if record.is_empty():
		ensure_timelapse_started()
		record_timelapse_event(
			"complete",
			[],
			{"solved_count": int(board.active_piece_count()) if board != null else 0}
		)
		record = _build_active_completion_record()
		if not CompletionRecordScript.structurally_valid(record):
			last_save_error = "Completion record is structurally invalid"
			return {}
		if not journal_store.append_completion(record):
			last_save_error = "Could not append Puzzle Journal: %s" % journal_store.last_error
			return {}
		last_completion_was_new = journal_store.last_append_added

	# Journal is the durable fact. Retire the unfinished slot only after that fact
	# exists; retries see the same game_id and therefore cannot append it twice.
	if not mark_active_completed():
		return {}

	last_completion_record = record.duplicate(true)
	return record.duplicate(true)


func mark_active_completed() -> bool:
	last_save_error = ""
	if active_game_id.is_empty():
		runtime_completed = true
		return true

	var completed_id := active_game_id
	var path := _slot_path(completed_id)
	# Remove the slot before clearing the in-memory id. If deletion fails, the
	# runtime remains retryable instead of entering a half-retired state.
	if FileAccess.file_exists(path):
		var error := DirAccess.remove_absolute(ProjectSettings.globalize_path(path))
		if error != OK:
			last_save_error = "Could not retire completed game slot: %s" % error_string(error)
			return false

	runtime_completed = true
	active_game_id = ""
	last_snapshot_json = ""
	games_index["active_game_id"] = ""
	_remove_game_metadata(completed_id)
	return _save_index()


func latest_completion_record() -> Dictionary:
	return last_completion_record.duplicate(true)


func completion_session_metrics() -> Dictionary:
	return {
		"elapsed_seconds": active_elapsed_seconds,
		"hints_used": 1 if active_hints_used > 0 else 0,
	}


func journal_recent(limit: int = 20) -> Array:
	return journal_store.recent_completions(limit)


func journal_today_summary(now_unix: int = 0) -> Dictionary:
	return journal_store.today_summary(now_unix)


func journal_week_summary(now_unix: int = 0) -> Dictionary:
	return journal_store.this_week_summary(now_unix)


func journal_completion_count() -> int:
	return journal_store.completion_count()


func _build_active_completion_record() -> Dictionary:
	if board == null or active_game_id.is_empty():
		return {}
	var identity := {}
	if board.has_method("active_content_identity"):
		var raw_identity = board.active_content_identity()
		if raw_identity is Dictionary:
			identity = raw_identity.duplicate(true)
	var content_id := ""
	if board.has_method("active_content_id"):
		content_id = str(board.active_content_id())

	var record: Dictionary = CompletionRecordScript.build(
		active_game_id,
		content_id,
		identity,
		str(board.active_difficulty_id()),
		str(board.active_pattern_id()),
		int(board.active_piece_count()),
		active_elapsed_seconds,
		1 if active_hints_used > 0 else 0,
		int(Time.get_unix_time_from_system())
	)
	if TimelapseTraceScript.structurally_valid(active_timelapse_trace):
		record["timelapse_trace"] = active_timelapse_trace.duplicate(true)
	return record


func _timelapse_positions_for(piece_indexes: Array) -> Array:
	var result: Array = []
	if board == null:
		return result
	var navigation := Rect2(Vector2.ZERO, Vector2(1280.0, 720.0))
	if board.has_method("navigation_bounds"):
		navigation = Rect2(board.navigation_bounds())
	var width := maxf(navigation.size.x, 1.0)
	var height := maxf(navigation.size.y, 1.0)
	for value in piece_indexes:
		var piece_index := int(value)
		if piece_index < 0 or piece_index >= board.pieces.size():
			continue
		var piece = board.pieces[piece_index]
		if not is_instance_valid(piece):
			continue
		var normalized := Vector2(
			(float(piece.position.x) - navigation.position.x) / width,
			(float(piece.position.y) - navigation.position.y) / height
		)
		result.append({
			"piece_index": piece_index,
			"x": snappedf(normalized.x, 0.0001),
			"y": snappedf(normalized.y, 0.0001),
		})
	return result


func _reset_completion_session() -> void:
	active_elapsed_seconds = 0.0
	active_hints_used = 0
	active_timelapse_trace = {}
	last_completion_record = {}
	last_completion_was_new = false


func _completion_metrics_should_run() -> bool:
	if bootstrapping or runtime_completed or active_game_id.is_empty():
		return false
	var main = get_parent()
	if main != null and main.has_method("completion_metrics_should_run"):
		return bool(main.call("completion_metrics_should_run"))
	return true
