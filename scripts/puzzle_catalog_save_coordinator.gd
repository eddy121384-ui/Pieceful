class_name PuzzleCatalogSaveCoordinator
extends "res://scripts/durable_content_save_coordinator.gd"

var waiting_for_new_game_selection := false


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
		_remove_game_metadata(game_id)
		_save_index()

	bootstrapping = false
	_start_autosave_timer()

	if resume_succeeded:
		waiting_for_new_game_selection = false
		last_snapshot_json = JSON.stringify(_capture_snapshot())
	else:
		# Product flow now starts with artwork + difficulty selection. Do not create
		# a phantom Garden save merely because the empty app runtime exists behind
		# the chooser. The first durable slot is allocated only after Start Puzzle.
		active_game_id = ""
		waiting_for_new_game_selection = true
		last_snapshot_json = ""


func _write_stable_snapshot(stable_snapshot: Dictionary, force_write: bool) -> bool:
	if waiting_for_new_game_selection and active_game_id.is_empty():
		return true
	return super._write_stable_snapshot(stable_snapshot, force_write)


func create_slot_for_current_runtime() -> String:
	waiting_for_new_game_selection = false
	return super.create_slot_for_current_runtime()


func needs_new_game_selection() -> bool:
	return waiting_for_new_game_selection and active_game_id.is_empty()


func _resume_game_from_disk(game_id: String) -> bool:
	var snapshot = _read_json_dictionary(_slot_path(game_id))
	if snapshot is Dictionary:
		var puzzle = snapshot.get("puzzle", {})
		if puzzle is Dictionary:
			if puzzle.has("content_identity"):
				var identity = puzzle.get("content_identity", {})
				if (
					board.has_method("select_content_by_identity")
					and not board.select_content_by_identity(identity)
				):
					last_resume_error = "Saved puzzle artwork is not available: %s" % game_id
					_retire_broken_slot(game_id, _slot_path(game_id), "content-unavailable")
					return false
			else:
				# Every pre-#3-E save belongs to the original built-in Garden artwork.
				if board.has_method("select_content"):
					board.select_content("garden")

	var restored: bool = await super._resume_game_from_disk(game_id)
	if restored:
		waiting_for_new_game_selection = false
	return restored
