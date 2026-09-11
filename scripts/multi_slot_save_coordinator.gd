class_name MultiSlotSaveCoordinator
extends "res://scripts/tray_reflow_single_slot_save_coordinator.gd"

const SAVE_DIR := "user://saves"
const INDEX_PATH := "user://saves/index.json"
const INDEX_VERSION := 1

var active_game_id := ""
var games_index: Dictionary = {}
var runtime_completed := false


func _bootstrap() -> void:
	board = get_parent().get_node_or_null("PuzzleBoard")
	workspace = get_parent().get_node_or_null("SortingWorkspace")
	if board == null or workspace == null:
		last_resume_error = "Save coordinator could not find PuzzleBoard / SortingWorkspace"
		bootstrapping = false
		return

	await get_tree().process_frame
	await get_tree().process_frame
	await get_tree().process_frame

	_ensure_save_directory()
	_load_index()
	_import_legacy_single_slot_if_needed()

	resume_attempted = true
	for game_id_value in _candidate_game_ids():
		var game_id := str(game_id_value)
		if await _resume_game_from_disk(game_id):
			resume_succeeded = true
			break
		# A broken slot must not trap startup forever. Keep the file on disk for a
		# later quarantine/migration pass, but remove its broken index reference.
		_remove_game_metadata(game_id)
		_save_index()

	bootstrapping = false
	_start_autosave_timer()

	if resume_succeeded:
		last_snapshot_json = JSON.stringify(_capture_snapshot())
	else:
		active_game_id = ""
		create_slot_for_current_runtime()


func _capture_snapshot() -> Dictionary:
	var snapshot: Dictionary = super._capture_snapshot()
	snapshot["slot"] = active_game_id
	return snapshot


func _write_stable_snapshot(stable_snapshot: Dictionary, force_write: bool) -> bool:
	# Completion retires the unfinished slot. The autosave timer keeps running,
	# so explicitly suppress writes until a new runtime/slot is created; otherwise
	# the next 2.5-second tick would resurrect the completed puzzle as unfinished.
	if runtime_completed and active_game_id.is_empty():
		return true
	if active_game_id.is_empty():
		active_game_id = _new_game_id()

	var stable_for_slot: Dictionary = stable_snapshot.duplicate(true)
	stable_for_slot["slot"] = active_game_id
	var stable_encoded := JSON.stringify(stable_for_slot)
	if not force_write and stable_encoded == last_snapshot_json:
		return true

	_ensure_save_directory()
	var now := int(Time.get_unix_time_from_system())
	var persisted_snapshot: Dictionary = stable_for_slot.duplicate(true)
	persisted_snapshot["captured_at_unix"] = now
	if not _write_text_file(_slot_path(active_game_id), JSON.stringify(persisted_snapshot)):
		last_save_error = "Could not write game slot: %s" % active_game_id
		return false

	last_snapshot_json = stable_encoded
	_upsert_metadata(_metadata_from_snapshot(active_game_id, persisted_snapshot, now))
	games_index["active_game_id"] = active_game_id
	if not _save_index():
		last_save_error = "Game slot saved but index update failed"
		return false
	return true


func create_slot_for_current_runtime() -> String:
	runtime_completed = false
	active_game_id = _new_game_id()
	last_snapshot_json = ""
	if not save_now(true):
		var failed_id := active_game_id
		active_game_id = ""
		return failed_id
	return active_game_id


func has_active_game() -> bool:
	return not active_game_id.is_empty()


func active_game() -> String:
	return active_game_id


func list_unfinished_games() -> Array:
	var rows: Array = []
	for entry_value in _game_entries():
		if not (entry_value is Dictionary):
			continue
		var entry: Dictionary = entry_value.duplicate(true)
		entry["is_active"] = str(entry.get("game_id", "")) == active_game_id
		rows.append(entry)
	rows.sort_custom(_metadata_newer)
	return rows


func resume_game(game_id: String) -> bool:
	if game_id.is_empty() or game_id == active_game_id:
		return not game_id.is_empty()
	if not _metadata_exists(game_id):
		last_resume_error = "Unknown game slot: %s" % game_id
		return false

	var previous_game_id := active_game_id
	if not previous_game_id.is_empty() and not save_now(true):
		return false

	if await _resume_game_from_disk(game_id):
		return true

	# Best-effort rollback if the target slot could not be restored after the
	# current slot had already been preserved.
	if not previous_game_id.is_empty() and previous_game_id != game_id:
		await _resume_game_from_disk(previous_game_id)
	return false


func delete_game(game_id: String) -> bool:
	last_save_error = ""
	if game_id.is_empty():
		return false
	# Deleting the runtime currently on screen would leave the visible board with
	# no durable identity. The product UI disables this action for the active row.
	if game_id == active_game_id:
		last_save_error = "Cannot delete the active game slot"
		return false

	var path := _slot_path(game_id)
	if FileAccess.file_exists(path):
		var error := DirAccess.remove_absolute(ProjectSettings.globalize_path(path))
		if error != OK:
			last_save_error = "Could not delete game slot: %s" % error_string(error)
			return false
	_remove_game_metadata(game_id)
	return _save_index()


func mark_active_completed() -> bool:
	runtime_completed = true
	if active_game_id.is_empty():
		return true
	var completed_id := active_game_id
	active_game_id = ""
	last_snapshot_json = ""
	games_index["active_game_id"] = ""
	_remove_game_metadata(completed_id)

	var path := _slot_path(completed_id)
	if FileAccess.file_exists(path):
		var error := DirAccess.remove_absolute(ProjectSettings.globalize_path(path))
		if error != OK:
			last_save_error = "Could not retire completed game slot: %s" % error_string(error)
			return false
	return _save_index()


func _resume_game_from_disk(game_id: String) -> bool:
	last_resume_error = ""
	var path := _slot_path(game_id)
	var snapshot = _read_json_dictionary(path)
	if not (snapshot is Dictionary):
		last_resume_error = "Game slot JSON is invalid: %s" % game_id
		return false
	if int(snapshot.get("schema_version", -1)) != SCHEMA_VERSION:
		last_resume_error = "Unsupported save schema in slot: %s" % game_id
		return false

	var puzzle = snapshot.get("puzzle", {})
	if not (puzzle is Dictionary):
		last_resume_error = "Save puzzle metadata missing: %s" % game_id
		return false
	var difficulty_id := str(puzzle.get("difficulty_id", ""))
	if difficulty_id.is_empty() or not board.request_difficulty(difficulty_id):
		last_resume_error = "Could not restore difficulty: %s" % difficulty_id
		return false

	await get_tree().process_frame
	await get_tree().process_frame

	var expected_count := int(puzzle.get("piece_count", -1))
	if expected_count != board.active_piece_count():
		last_resume_error = "Piece-count mismatch: save %d runtime %d" % [
			expected_count,
			board.active_piece_count(),
		]
		return false

	var board_state = snapshot.get("board", {})
	var workspace_state = snapshot.get("workspace", {})
	if not (board_state is Dictionary) or not (workspace_state is Dictionary):
		last_resume_error = "Save runtime state missing: %s" % game_id
		return false

	runtime_completed = false
	active_game_id = game_id
	_restore_clusters(board_state)
	_restore_piece_runtime(board_state, workspace_state)
	_restore_workspace_state(workspace_state)

	if board.has_method("_configure_spatial_runtime"):
		board._configure_spatial_runtime()
	if board.has_method("mark_spatial_index_dirty"):
		board.mark_spatial_index_dirty()

	workspace._refresh_ui()
	workspace._layout_ui()
	board.progress_changed.emit(board.solved_count, board.active_piece_count())
	_sync_parent_presentation_after_resume()

	var now := int(Time.get_unix_time_from_system())
	_upsert_metadata(_metadata_from_snapshot(game_id, snapshot, now))
	games_index["active_game_id"] = game_id
	_save_index()
	last_snapshot_json = JSON.stringify(_capture_snapshot())
	print(
		"Pieceful resume · slot %s · schema %d · %s · %d pieces · %d solved"
		% [
			game_id,
			SCHEMA_VERSION,
			difficulty_id,
			board.active_piece_count(),
			board.solved_count,
		]
	)
	return true


func _blank_index() -> Dictionary:
	return {
		"index_version": INDEX_VERSION,
		"active_game_id": "",
		"games": [],
	}


func _load_index() -> bool:
	games_index = _blank_index()
	if not FileAccess.file_exists(INDEX_PATH):
		return true
	var parsed = _read_json_dictionary(INDEX_PATH)
	if not (parsed is Dictionary):
		last_resume_error = "Save index JSON is invalid; starting with a clean index"
		return false
	if int(parsed.get("index_version", -1)) != INDEX_VERSION:
		last_resume_error = "Unsupported save index version; starting with a clean index"
		return false
	var games = parsed.get("games", [])
	if not (games is Array):
		last_resume_error = "Save index games list is invalid; starting with a clean index"
		return false
	games_index = parsed
	active_game_id = str(games_index.get("active_game_id", ""))
	return true


func _save_index() -> bool:
	_ensure_save_directory()
	games_index["index_version"] = INDEX_VERSION
	games_index["active_game_id"] = active_game_id
	if not _write_text_file(INDEX_PATH, JSON.stringify(games_index, "  ")):
		last_save_error = "Could not write save index"
		return false
	return true


func _import_legacy_single_slot_if_needed() -> bool:
	if not _game_entries().is_empty() or not FileAccess.file_exists(SAVE_PATH):
		return false
	var snapshot = _read_json_dictionary(SAVE_PATH)
	if not (snapshot is Dictionary):
		return false
	if int(snapshot.get("schema_version", -1)) != SCHEMA_VERSION:
		return false

	var game_id := _new_game_id()
	var persisted: Dictionary = snapshot.duplicate(true)
	persisted["slot"] = game_id
	if not _write_text_file(_slot_path(game_id), JSON.stringify(persisted)):
		return false

	var legacy_time := int(
		persisted.get("captured_at_unix", Time.get_unix_time_from_system())
	)
	active_game_id = game_id
	_upsert_metadata(_metadata_from_snapshot(game_id, persisted, legacy_time))
	games_index["active_game_id"] = game_id
	_save_index()
	print("Pieceful save migration · imported legacy autosave as %s" % game_id)
	return true


func _candidate_game_ids() -> Array:
	var ids: Array = []
	if not active_game_id.is_empty() and _metadata_exists(active_game_id):
		ids.append(active_game_id)
	for entry_value in list_unfinished_games():
		var game_id := str(entry_value.get("game_id", ""))
		if not game_id.is_empty() and not ids.has(game_id):
			ids.append(game_id)
	return ids


func _metadata_from_snapshot(
	game_id: String,
	snapshot: Dictionary,
	last_played_unix: int
) -> Dictionary:
	var existing := _metadata_for(game_id)
	var created_at := int(existing.get("created_at_unix", last_played_unix))
	var puzzle = snapshot.get("puzzle", {})
	if not (puzzle is Dictionary):
		puzzle = {}
	var board_state = snapshot.get("board", {})
	if not (board_state is Dictionary):
		board_state = {}
	var piece_count := int(puzzle.get("piece_count", 0))
	var solved_count := int(board_state.get("solved_count", 0))
	var progress := 0.0
	if piece_count > 0:
		progress = float(solved_count) / float(piece_count)
	return {
		"game_id": game_id,
		"schema_version": int(snapshot.get("schema_version", SCHEMA_VERSION)),
		"difficulty_id": str(puzzle.get("difficulty_id", "")),
		"pattern_id": str(puzzle.get("pattern_id", "")),
		"piece_count": piece_count,
		"solved_count": solved_count,
		"progress": progress,
		"created_at_unix": created_at,
		"last_played_unix": last_played_unix,
	}


func _game_entries() -> Array:
	var games = games_index.get("games", [])
	if games is Array:
		return games
	return []


func _metadata_for(game_id: String) -> Dictionary:
	for entry_value in _game_entries():
		if entry_value is Dictionary and str(entry_value.get("game_id", "")) == game_id:
			return entry_value
	return {}


func _metadata_exists(game_id: String) -> bool:
	return not _metadata_for(game_id).is_empty()


func _upsert_metadata(metadata: Dictionary) -> void:
	var game_id := str(metadata.get("game_id", ""))
	if game_id.is_empty():
		return
	var games: Array = _game_entries().duplicate(true)
	for index in range(games.size()):
		var entry = games[index]
		if entry is Dictionary and str(entry.get("game_id", "")) == game_id:
			games[index] = metadata
			games_index["games"] = games
			return
	games.append(metadata)
	games_index["games"] = games


func _remove_game_metadata(game_id: String) -> void:
	var games: Array = []
	for entry_value in _game_entries():
		if not (entry_value is Dictionary):
			continue
		if str(entry_value.get("game_id", "")) == game_id:
			continue
		games.append(entry_value)
	games_index["games"] = games
	if str(games_index.get("active_game_id", "")) == game_id:
		games_index["active_game_id"] = ""


func _metadata_newer(a, b) -> bool:
	return int(a.get("last_played_unix", 0)) > int(b.get("last_played_unix", 0))


func _new_game_id() -> String:
	var base := int(Time.get_unix_time_from_system())
	for _attempt in range(100):
		var candidate := "game_%d_%06d" % [base, randi_range(0, 999999)]
		if not _metadata_exists(candidate) and not FileAccess.file_exists(_slot_path(candidate)):
			return candidate
	return "game_%d_%d" % [base, Time.get_ticks_usec()]


func _slot_path(game_id: String) -> String:
	return SAVE_DIR.path_join("%s.json" % game_id)


func _ensure_save_directory() -> bool:
	var absolute_dir := ProjectSettings.globalize_path(SAVE_DIR)
	var error := DirAccess.make_dir_recursive_absolute(absolute_dir)
	return error == OK or error == ERR_ALREADY_EXISTS


func _read_json_dictionary(path: String):
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return null
	var encoded := file.get_as_text()
	file.close()
	return JSON.parse_string(encoded)


func _write_text_file(path: String, encoded: String) -> bool:
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(encoded)
	file.flush()
	file.close()
	return true
