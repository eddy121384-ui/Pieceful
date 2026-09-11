class_name RobustMultiSlotSaveCoordinator
extends "res://scripts/multi_slot_save_coordinator.gd"

const QUARANTINE_DIR := "user://saves/quarantine"

var lifecycle_flush_in_progress := false


func _notification(what: int) -> void:
	# The periodic autosave is intentionally conservative, but an app suspension /
	# close boundary should not leave the most recent interaction waiting for the
	# next 2.5-second tick. These notifications are synchronous while the runtime
	# state is still available, so save the dirty snapshot before control leaves.
	if (
		what == NOTIFICATION_APPLICATION_PAUSED
		or what == NOTIFICATION_APPLICATION_FOCUS_OUT
		or what == NOTIFICATION_WM_CLOSE_REQUEST
	):
		_flush_pending_runtime("lifecycle")


func _exit_tree() -> void:
	# Also cover scene-tree teardown. This is useful on desktop quit and protects
	# callers/tests that free the product scene without first emitting a platform
	# application notification.
	_flush_pending_runtime("exit_tree")


func _flush_pending_runtime(reason: String) -> bool:
	if lifecycle_flush_in_progress:
		return true
	if bootstrapping or runtime_completed or active_game_id.is_empty():
		return true
	if board == null or workspace == null or board.definition == null:
		return true

	lifecycle_flush_in_progress = true
	var saved := save_now(false)
	lifecycle_flush_in_progress = false
	if not saved:
		push_warning(
			"Pieceful final save failed (%s): %s" % [reason, last_save_error]
		)
	return saved


func _load_index() -> bool:
	# A previous process may have stopped after writing a validated temp file or
	# after moving the old file aside as a backup. Repair those transactions before
	# interpreting the index or any individual game slot.
	_recover_interrupted_transactions()

	var index_existed := FileAccess.file_exists(INDEX_PATH)
	var loaded := super._load_index()
	if not loaded:
		if index_existed and FileAccess.file_exists(INDEX_PATH):
			_quarantine_path(INDEX_PATH, "invalid-index")
		games_index = _blank_index()
		active_game_id = ""

	var reconciled := _reconcile_index_with_slots()
	if not loaded or reconciled:
		_save_index()

	# Startup is allowed to continue after a damaged index. Valid slot files are
	# reconstructed into a new index; if none survive, base bootstrap creates a
	# fresh runtime slot instead of trapping the app at launch.
	return true


func _resume_game_from_disk(game_id: String) -> bool:
	var path := _slot_path(game_id)
	var snapshot = _read_json_dictionary(path)
	if not _slot_snapshot_is_supported(snapshot):
		last_resume_error = "Game slot is invalid or unsupported: %s" % game_id
		_retire_broken_slot(game_id, path, "invalid-slot")
		return false

	var restored: bool = await super._resume_game_from_disk(game_id)
	if restored:
		return true

	# JSON can be structurally valid yet still be unusable by the current runtime
	# (for example a piece-count/content mismatch). Preserve the bytes in
	# quarantine, remove the bad index row, and allow the next valid candidate to
	# resume instead of repeatedly failing on every launch.
	_retire_broken_slot(game_id, path, "resume-rejected")
	return false


func _write_text_file(path: String, encoded: String) -> bool:
	# All multi-slot files are JSON dictionaries. Reject a bad payload before it
	# can touch the currently durable copy.
	var parsed = JSON.parse_string(encoded)
	if not (parsed is Dictionary):
		return false

	var temp_path := path + ".tmp"
	var backup_path := path + ".bak"
	_remove_file_if_exists(temp_path)

	var temp_file := FileAccess.open(temp_path, FileAccess.WRITE)
	if temp_file == null:
		return false
	temp_file.store_string(encoded)
	temp_file.flush()
	temp_file.close()

	# Validate the exact bytes written to disk, not only the in-memory source.
	if not _json_dictionary_is_valid(temp_path):
		_quarantine_path(temp_path, "invalid-temp")
		return false

	_remove_file_if_exists(backup_path)
	if FileAccess.file_exists(path):
		var backup_error := _rename_file(path, backup_path)
		if backup_error != OK:
			_remove_file_if_exists(temp_path)
			return false

	var promote_error := _rename_file(temp_path, path)
	if promote_error != OK:
		if FileAccess.file_exists(backup_path) and not FileAccess.file_exists(path):
			_rename_file(backup_path, path)
		return false

	# The temp was already parsed successfully, but verify the promoted target too.
	# If storage produced an invalid final file, restore the previous durable copy.
	if not _json_dictionary_is_valid(path):
		_quarantine_path(path, "invalid-promoted")
		if FileAccess.file_exists(backup_path):
			_rename_file(backup_path, path)
		return false

	_remove_file_if_exists(backup_path)
	return true


func _recover_interrupted_transactions() -> void:
	_ensure_save_directory()
	var dir := DirAccess.open(SAVE_DIR)
	if dir == null:
		return

	var targets: Dictionary = {}
	for filename in dir.get_files():
		if filename.ends_with(".tmp"):
			targets[SAVE_DIR.path_join(filename.trim_suffix(".tmp"))] = true
		elif filename.ends_with(".bak"):
			targets[SAVE_DIR.path_join(filename.trim_suffix(".bak"))] = true

	for target_value in targets.keys():
		_recover_interrupted_transaction(str(target_value))


func _recover_interrupted_transaction(path: String) -> void:
	var temp_path := path + ".tmp"
	var backup_path := path + ".bak"
	var final_exists := FileAccess.file_exists(path)
	var temp_exists := FileAccess.file_exists(temp_path)
	var backup_exists := FileAccess.file_exists(backup_path)
	var final_valid := final_exists and _json_dictionary_is_valid(path)
	var temp_valid := temp_exists and _json_dictionary_is_valid(temp_path)
	var backup_valid := backup_exists and _json_dictionary_is_valid(backup_path)

	# A complete validated temp file represents the newest attempted write. Promote
	# it even when the previous final still exists: the process may have died after
	# fsync/validation but before the replace step.
	if temp_valid:
		if final_exists and not final_valid:
			_quarantine_path(path, "interrupted-invalid-final")
			final_exists = false
		if FileAccess.file_exists(backup_path):
			_remove_file_if_exists(backup_path)
		if FileAccess.file_exists(path):
			if _rename_file(path, backup_path) != OK:
				return
		if _rename_file(temp_path, path) == OK:
			_remove_file_if_exists(backup_path)
			return
		if FileAccess.file_exists(backup_path) and not FileAccess.file_exists(path):
			_rename_file(backup_path, path)
		return

	# No usable temp exists. A valid final is already authoritative; quarantine an
	# incomplete temp and discard only the stale backup left by an interrupted
	# cleanup step.
	if final_valid:
		if temp_exists:
			_quarantine_path(temp_path, "interrupted-invalid-temp")
		_remove_file_if_exists(backup_path)
		return

	if final_exists:
		_quarantine_path(path, "interrupted-invalid-final")
	if temp_exists:
		_quarantine_path(temp_path, "interrupted-invalid-temp")

	# The dangerous crash window is after final -> backup but before temp -> final.
	# Restore a validated backup so the user keeps the previous complete save.
	if backup_valid and FileAccess.file_exists(backup_path):
		_rename_file(backup_path, path)
		return
	if backup_exists:
		_quarantine_path(backup_path, "interrupted-invalid-backup")


func _reconcile_index_with_slots() -> bool:
	var changed := false
	var cleaned_games: Array = []
	var known_ids: Dictionary = {}

	# First reconcile every row already referenced by the index.
	for entry_value in _game_entries():
		if not (entry_value is Dictionary):
			changed = true
			continue
		var entry: Dictionary = entry_value
		var game_id := str(entry.get("game_id", ""))
		if game_id.is_empty():
			changed = true
			continue
		var path := _slot_path(game_id)
		if not FileAccess.file_exists(path):
			changed = true
			continue
		var snapshot = _read_json_dictionary(path)
		if not _slot_snapshot_is_supported(snapshot):
			_quarantine_path(path, "invalid-slot")
			changed = true
			continue

		var last_played := int(
			snapshot.get("captured_at_unix", entry.get("last_played_unix", 0))
		)
		var refreshed := _metadata_from_snapshot(game_id, snapshot, last_played)
		cleaned_games.append(refreshed)
		known_ids[game_id] = true
		if JSON.stringify(refreshed) != JSON.stringify(entry):
			changed = true

	games_index["games"] = cleaned_games

	# Then discover valid orphan slot files. This repairs the other half of a crash
	# where a slot replace completed but the following index update did not.
	var dir := DirAccess.open(SAVE_DIR)
	if dir != null:
		for filename in dir.get_files():
			if not filename.begins_with("game_") or not filename.ends_with(".json"):
				continue
			var game_id := filename.trim_suffix(".json")
			if known_ids.has(game_id):
				continue
			var path := SAVE_DIR.path_join(filename)
			var snapshot = _read_json_dictionary(path)
			if not _slot_snapshot_is_supported(snapshot):
				_quarantine_path(path, "orphan-invalid-slot")
				changed = true
				continue
			var last_played := int(
				snapshot.get("captured_at_unix", Time.get_unix_time_from_system())
			)
			_upsert_metadata(_metadata_from_snapshot(game_id, snapshot, last_played))
			known_ids[game_id] = true
			changed = true

	# A corrupt/missing active slot should fall back to the newest surviving game.
	if active_game_id.is_empty() or not _metadata_exists(active_game_id):
		var previous_active := active_game_id
		active_game_id = ""
		var rows: Array = _game_entries().duplicate(true)
		rows.sort_custom(_metadata_newer)
		if not rows.is_empty():
			active_game_id = str(rows[0].get("game_id", ""))
		if active_game_id != previous_active:
			changed = true

	games_index["active_game_id"] = active_game_id
	return changed


func _slot_snapshot_is_supported(snapshot) -> bool:
	if not (snapshot is Dictionary):
		return false
	if int(snapshot.get("schema_version", -1)) != SCHEMA_VERSION:
		return false
	var puzzle = snapshot.get("puzzle", {})
	var board_state = snapshot.get("board", {})
	var workspace_state = snapshot.get("workspace", {})
	if not (puzzle is Dictionary):
		return false
	if not (board_state is Dictionary) or not (workspace_state is Dictionary):
		return false
	if str(puzzle.get("difficulty_id", "")).is_empty():
		return false
	if int(puzzle.get("piece_count", 0)) <= 0:
		return false
	if not (board_state.get("pieces", []) is Array):
		return false
	if not (board_state.get("clusters", []) is Array):
		return false
	if not (workspace_state.get("trays", []) is Array):
		return false
	return true


func _retire_broken_slot(game_id: String, path: String, reason: String) -> void:
	if FileAccess.file_exists(path):
		_quarantine_path(path, reason)
	_remove_game_metadata(game_id)
	if active_game_id == game_id:
		active_game_id = ""
	games_index["active_game_id"] = active_game_id
	_save_index()


func _json_dictionary_is_valid(path: String) -> bool:
	if not FileAccess.file_exists(path):
		return false
	return _read_json_dictionary(path) is Dictionary


func _quarantine_path(path: String, reason: String) -> String:
	if not FileAccess.file_exists(path):
		return ""
	_ensure_quarantine_directory()
	var destination := QUARANTINE_DIR.path_join(
		"%s.%d.%d.%s" % [
			path.get_file(),
			int(Time.get_unix_time_from_system()),
			int(Time.get_ticks_usec()),
			reason,
		]
	)
	if _rename_file(path, destination) != OK:
		return ""
	print("Pieceful save quarantine · %s -> %s" % [path, destination])
	return destination


func _ensure_quarantine_directory() -> bool:
	var absolute_dir := ProjectSettings.globalize_path(QUARANTINE_DIR)
	var error := DirAccess.make_dir_recursive_absolute(absolute_dir)
	return error == OK or error == ERR_ALREADY_EXISTS


func _remove_file_if_exists(path: String) -> bool:
	if not FileAccess.file_exists(path):
		return true
	return DirAccess.remove_absolute(ProjectSettings.globalize_path(path)) == OK


func _rename_file(from_path: String, to_path: String) -> Error:
	return DirAccess.rename_absolute(
		ProjectSettings.globalize_path(from_path),
		ProjectSettings.globalize_path(to_path)
	)
