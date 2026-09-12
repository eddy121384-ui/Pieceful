class_name PuzzleJournalStore
extends RefCounted

const CompletionRecordScript = preload("res://scripts/completion_record_v1.gd")
const JOURNAL_VERSION := 1
const JOURNAL_PATH := "user://pieceful_journal_v1.json"

var state: Dictionary = _blank_state()
var last_error := ""
var last_append_added := false


func _init() -> void:
	_load()


func append_completion(record: Dictionary) -> bool:
	last_error = ""
	last_append_added = false
	if not CompletionRecordScript.structurally_valid(record):
		last_error = "Completion record is structurally invalid"
		return false

	var game_id := str(record.get("game_id", ""))
	if has_game(game_id):
		# A game id is an immutable journal fact. Retrying the same completion is an
		# idempotent success and never replaces the first durable record.
		return true

	var previous: Dictionary = state.duplicate(true)
	var completions: Array = _completion_rows().duplicate(true)
	completions.append(record.duplicate(true))
	state["completions"] = completions
	if not _save():
		state = previous
		return false
	last_append_added = true
	return true


func has_game(game_id: String) -> bool:
	return not game_id.is_empty() and not completion_for_game(game_id).is_empty()


func completion_for_game(game_id: String) -> Dictionary:
	if game_id.is_empty():
		return {}
	for value in _completion_rows():
		if value is Dictionary and str(value.get("game_id", "")) == game_id:
			return (value as Dictionary).duplicate(true)
	return {}


func recent_completions(limit: int = 20) -> Array:
	var rows: Array = []
	for value in _completion_rows():
		if value is Dictionary:
			rows.append((value as Dictionary).duplicate(true))
	rows.sort_custom(_newer_completion)
	if limit >= 0 and rows.size() > limit:
		rows.resize(limit)
	return rows


func completion_count() -> int:
	return _completion_rows().size()


func today_summary(now_unix: int = 0) -> Dictionary:
	var now := _resolve_now(now_unix)
	var start := _local_day_start_unix(now)
	return _aggregate_range(start, start + 86400)


func this_week_summary(now_unix: int = 0) -> Dictionary:
	var now := _resolve_now(now_unix)
	var day_start := _local_day_start_unix(now)
	var offset := _timezone_offset_seconds()
	var local_now := Time.get_datetime_dict_from_unix_time(now + offset)
	# Godot weekday uses Sunday=0 ... Saturday=6. Pieceful's week begins Monday.
	var weekday := int(local_now.get("weekday", 0))
	var days_since_monday := (weekday + 6) % 7
	var week_start := day_start - days_since_monday * 86400
	return _aggregate_range(week_start, week_start + 7 * 86400)


func _aggregate_range(start_unix: int, end_unix: int) -> Dictionary:
	var count := 0
	var elapsed_seconds := 0
	var pieces_placed := 0
	var hint_free_count := 0
	for value in _completion_rows():
		if not (value is Dictionary):
			continue
		var record: Dictionary = value
		var completed_at := int(record.get("completed_at_unix", 0))
		if completed_at < start_unix or completed_at >= end_unix:
			continue
		count += 1
		elapsed_seconds += maxi(0, int(record.get("elapsed_seconds", 0)))
		pieces_placed += maxi(
			0,
			int(record.get("pieces_placed", record.get("piece_count", 0)))
		)
		if bool(record.get("hint_free", false)):
			hint_free_count += 1
	return {
		"completion_count": count,
		"elapsed_seconds": elapsed_seconds,
		"pieces_placed": pieces_placed,
		"hint_free_count": hint_free_count,
		"start_unix": start_unix,
		"end_unix": end_unix,
	}


func _blank_state() -> Dictionary:
	return {
		"journal_version": JOURNAL_VERSION,
		"completions": [],
	}


func _completion_rows() -> Array:
	var rows = state.get("completions", [])
	return rows if rows is Array else []


func _load() -> void:
	state = _blank_state()
	_recover_transaction()
	if not FileAccess.file_exists(JOURNAL_PATH):
		return
	var parsed = _read_json_dictionary(JOURNAL_PATH)
	if not _journal_state_valid(parsed):
		last_error = "Puzzle Journal is invalid; starting with a clean in-memory view"
		return
	state = parsed


func _save() -> bool:
	state["journal_version"] = JOURNAL_VERSION
	if not _journal_state_valid(state):
		last_error = "Puzzle Journal state is invalid"
		return false
	if not _write_json_transaction(JOURNAL_PATH, JSON.stringify(state, "  ")):
		last_error = "Could not persist Puzzle Journal"
		return false
	return true


func _journal_state_valid(value) -> bool:
	if not (value is Dictionary):
		return false
	if int(value.get("journal_version", -1)) != JOURNAL_VERSION:
		return false
	var rows = value.get("completions", [])
	if not (rows is Array):
		return false
	var seen: Dictionary = {}
	for row_value in rows:
		if not CompletionRecordScript.structurally_valid(row_value):
			return false
		var game_id := str(row_value.get("game_id", ""))
		if seen.has(game_id):
			return false
		seen[game_id] = true
	return true


func _write_json_transaction(path: String, encoded: String) -> bool:
	var temp_path := path + ".tmp"
	var backup_path := path + ".bak"
	_remove_file_if_exists(temp_path)

	var temp_file := FileAccess.open(temp_path, FileAccess.WRITE)
	if temp_file == null:
		return false
	temp_file.store_string(encoded)
	temp_file.flush()
	temp_file.close()
	if not _journal_state_valid(_read_json_dictionary(temp_path)):
		_remove_file_if_exists(temp_path)
		return false

	_remove_file_if_exists(backup_path)
	if FileAccess.file_exists(path):
		if _rename_file(path, backup_path) != OK:
			_remove_file_if_exists(temp_path)
			return false

	if _rename_file(temp_path, path) != OK:
		if FileAccess.file_exists(backup_path) and not FileAccess.file_exists(path):
			_rename_file(backup_path, path)
		return false

	if not _journal_state_valid(_read_json_dictionary(path)):
		_remove_file_if_exists(path)
		if FileAccess.file_exists(backup_path):
			_rename_file(backup_path, path)
		return false

	_remove_file_if_exists(backup_path)
	return true


func _recover_transaction() -> void:
	var temp_path := JOURNAL_PATH + ".tmp"
	var backup_path := JOURNAL_PATH + ".bak"
	var final_valid := (
		FileAccess.file_exists(JOURNAL_PATH)
		and _journal_state_valid(_read_json_dictionary(JOURNAL_PATH))
	)
	var temp_valid := (
		FileAccess.file_exists(temp_path)
		and _journal_state_valid(_read_json_dictionary(temp_path))
	)
	var backup_valid := (
		FileAccess.file_exists(backup_path)
		and _journal_state_valid(_read_json_dictionary(backup_path))
	)

	# A validated temp is the newest attempted journal write and wins recovery.
	if temp_valid:
		_remove_file_if_exists(backup_path)
		if FileAccess.file_exists(JOURNAL_PATH):
			if _rename_file(JOURNAL_PATH, backup_path) != OK:
				return
		if _rename_file(temp_path, JOURNAL_PATH) == OK:
			_remove_file_if_exists(backup_path)
			return
		if FileAccess.file_exists(backup_path) and not FileAccess.file_exists(JOURNAL_PATH):
			_rename_file(backup_path, JOURNAL_PATH)
		return

	if final_valid:
		_remove_file_if_exists(temp_path)
		_remove_file_if_exists(backup_path)
		return

	_remove_file_if_exists(temp_path)
	if FileAccess.file_exists(JOURNAL_PATH):
		_remove_file_if_exists(JOURNAL_PATH)
	if backup_valid:
		_rename_file(backup_path, JOURNAL_PATH)
	else:
		_remove_file_if_exists(backup_path)


func _read_json_dictionary(path: String):
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return null
	var parsed = JSON.parse_string(file.get_as_text())
	file.close()
	return parsed


func _remove_file_if_exists(path: String) -> bool:
	if not FileAccess.file_exists(path):
		return true
	return DirAccess.remove_absolute(ProjectSettings.globalize_path(path)) == OK


func _rename_file(from_path: String, to_path: String) -> Error:
	return DirAccess.rename_absolute(
		ProjectSettings.globalize_path(from_path),
		ProjectSettings.globalize_path(to_path)
	)


func _resolve_now(now_unix: int) -> int:
	return now_unix if now_unix > 0 else int(Time.get_unix_time_from_system())


func _timezone_offset_seconds() -> int:
	var timezone := Time.get_time_zone_from_system()
	return int(timezone.get("bias", 0)) * 60


func _local_day_start_unix(unix_time: int) -> int:
	var offset := _timezone_offset_seconds()
	var local := Time.get_datetime_dict_from_unix_time(unix_time + offset)
	var midnight := {
		"year": int(local.get("year", 1970)),
		"month": int(local.get("month", 1)),
		"day": int(local.get("day", 1)),
		"hour": 0,
		"minute": 0,
		"second": 0,
	}
	return int(Time.get_unix_time_from_datetime_dict(midnight)) - offset


func _newer_completion(a, b) -> bool:
	return int(a.get("completed_at_unix", 0)) > int(b.get("completed_at_unix", 0))
