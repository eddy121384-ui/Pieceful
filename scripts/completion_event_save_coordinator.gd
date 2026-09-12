class_name CompletionEventSaveCoordinator
extends "res://scripts/image_aware_puzzle_catalog_save_coordinator.gd"

const CompletionRecordScript = preload("res://scripts/completion_record_v1.gd")

var active_elapsed_seconds := 0.0
var active_hints_used := 0
var last_completion_record: Dictionary = {}


func _process(delta: float) -> void:
	if _completion_metrics_should_run():
		active_elapsed_seconds += maxf(delta, 0.0)


func _capture_snapshot() -> Dictionary:
	var snapshot: Dictionary = super._capture_snapshot()
	snapshot["completion_session"] = {
		"elapsed_seconds": maxi(0, int(round(active_elapsed_seconds))),
		"hints_used": maxi(0, active_hints_used),
	}
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
	if snapshot is Dictionary:
		var raw_session = snapshot.get("completion_session", {})
		if raw_session is Dictionary:
			session = raw_session

	var restored: bool = await super._resume_game_from_disk(game_id)
	if restored:
		active_elapsed_seconds = maxf(0.0, float(session.get("elapsed_seconds", 0.0)))
		active_hints_used = maxi(0, int(session.get("hints_used", 0)))
		last_completion_record = {}
		# Parent resume snapshots are captured before this additive V0-08 session
		# state is restored. Refresh the stable comparison baseline so the next
		# autosave only writes when gameplay time/state actually advances.
		last_snapshot_json = JSON.stringify(_capture_snapshot())
	return restored


func record_hint_use(_piece_index: int) -> void:
	if not _completion_metrics_should_run():
		return
	active_hints_used += 1


func complete_active_game_once() -> Dictionary:
	# The board completion signal can be delivered through multiple presentation
	# layers. The durable game id is the idempotency key: after the first successful
	# retirement runtime_completed=true and active_game_id="", so no second event
	# can be manufactured for the same game.
	if runtime_completed or active_game_id.is_empty():
		return {}

	var record := _build_active_completion_record()
	if not CompletionRecordScript.structurally_valid(record):
		last_save_error = "Completion record is structurally invalid"
		return {}
	if not mark_active_completed():
		return {}

	last_completion_record = record.duplicate(true)
	return record.duplicate(true)


func latest_completion_record() -> Dictionary:
	return last_completion_record.duplicate(true)


func completion_session_metrics() -> Dictionary:
	return {
		"elapsed_seconds": active_elapsed_seconds,
		"hints_used": active_hints_used,
	}


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

	return CompletionRecordScript.build(
		active_game_id,
		content_id,
		identity,
		str(board.active_difficulty_id()),
		str(board.active_pattern_id()),
		int(board.active_piece_count()),
		active_elapsed_seconds,
		active_hints_used,
		int(Time.get_unix_time_from_system())
	)


func _reset_completion_session() -> void:
	active_elapsed_seconds = 0.0
	active_hints_used = 0
	last_completion_record = {}


func _completion_metrics_should_run() -> bool:
	if bootstrapping or runtime_completed or active_game_id.is_empty():
		return false
	var main = get_parent()
	if main != null and main.has_method("completion_metrics_should_run"):
		return bool(main.call("completion_metrics_should_run"))
	return true
