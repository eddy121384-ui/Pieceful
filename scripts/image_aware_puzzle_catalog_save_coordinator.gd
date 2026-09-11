class_name ImageAwarePuzzleCatalogSaveCoordinator
extends "res://scripts/puzzle_catalog_save_coordinator.gd"


func _capture_snapshot() -> Dictionary:
	var snapshot: Dictionary = super._capture_snapshot()
	var puzzle = snapshot.get("puzzle", {})
	if puzzle is Dictionary and board != null and board.has_method("active_grid_resolution"):
		var grid = board.active_grid_resolution()
		if grid is Dictionary and not grid.is_empty():
			puzzle["grid_columns"] = int(grid.get("columns", 0))
			puzzle["grid_rows"] = int(grid.get("rows", 0))
			snapshot["puzzle"] = puzzle
	return snapshot


func _resume_game_from_disk(game_id: String) -> bool:
	# Resolve artwork first, then preflight the deterministic difficulty/grid before
	# any saved piece positions are applied. Existing pre-#37 saves omit grid rows
	# but still carry pattern_id + piece_count and remain compatible when they use
	# the historical 1.6:1 approved dies.
	var snapshot = _read_json_dictionary(_slot_path(game_id))
	if snapshot is Dictionary:
		var puzzle = snapshot.get("puzzle", {})
		if puzzle is Dictionary:
			if not _preflight_content_selection(puzzle):
				return await super._resume_game_from_disk(game_id)
			var difficulty_id := str(puzzle.get("difficulty_id", ""))
			if not difficulty_id.is_empty() and board.request_difficulty(difficulty_id):
				await get_tree().process_frame
				await get_tree().process_frame
				if not _resolved_puzzle_identity_matches(puzzle):
					last_resume_error = "Saved puzzle grid / CutPattern no longer matches: %s" % game_id
					_retire_broken_slot(
						game_id,
						_slot_path(game_id),
						"resolved-pattern-mismatch"
					)
					return false

	return await super._resume_game_from_disk(game_id)


func _preflight_content_selection(puzzle: Dictionary) -> bool:
	if puzzle.has("content_identity"):
		var identity = puzzle.get("content_identity", {})
		if board.has_method("select_content_by_identity"):
			return bool(board.select_content_by_identity(identity))
		return false
	if board.has_method("select_content"):
		return bool(board.select_content("garden"))
	return true


func _resolved_puzzle_identity_matches(puzzle: Dictionary) -> bool:
	var expected_count := int(puzzle.get("piece_count", -1))
	if expected_count >= 0 and expected_count != int(board.active_piece_count()):
		return false

	var expected_pattern_id := str(puzzle.get("pattern_id", ""))
	if not expected_pattern_id.is_empty() and expected_pattern_id != str(board.active_pattern_id()):
		return false

	if not puzzle.has("grid_columns") and not puzzle.has("grid_rows"):
		return true
	if not board.has_method("active_grid_resolution"):
		return false
	var grid = board.active_grid_resolution()
	if not (grid is Dictionary):
		return false
	if int(puzzle.get("grid_columns", -1)) != int(grid.get("columns", -2)):
		return false
	if int(puzzle.get("grid_rows", -1)) != int(grid.get("rows", -2)):
		return false
	return true
