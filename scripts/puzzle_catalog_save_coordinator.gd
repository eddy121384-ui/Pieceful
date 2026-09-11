class_name PuzzleCatalogSaveCoordinator
extends "res://scripts/durable_content_save_coordinator.gd"

var waiting_for_new_game_selection := false


func _bootstrap() -> void:
	var had_existing_save := _had_existing_save_before_boot()
	await super._bootstrap()
	# Keep the established multi-slot invariant that a clean boot owns one durable
	# slot, but mark that automatically-created Garden slot as provisional. The
	# chooser will rewrite this same slot with the player's actual artwork and
	# difficulty rather than creating a second phantom game.
	waiting_for_new_game_selection = (
		not had_existing_save
		and not resume_succeeded
		and not active_game_id.is_empty()
	)


func needs_new_game_selection() -> bool:
	return waiting_for_new_game_selection and not active_game_id.is_empty()


func commit_initial_selection() -> bool:
	if not waiting_for_new_game_selection:
		return false
	waiting_for_new_game_selection = false
	last_snapshot_json = ""
	return save_now(true)


func create_slot_for_current_runtime() -> String:
	waiting_for_new_game_selection = false
	return super.create_slot_for_current_runtime()


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


func _had_existing_save_before_boot() -> bool:
	if FileAccess.file_exists(SAVE_PATH) or FileAccess.file_exists(INDEX_PATH):
		return true
	var dir := DirAccess.open(SAVE_DIR)
	if dir == null:
		return false
	for filename in dir.get_files():
		if filename.begins_with("game_") and filename.ends_with(".json"):
			return true
	return false
