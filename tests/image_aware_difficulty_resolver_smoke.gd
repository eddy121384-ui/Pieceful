extends SceneTree

const ResolverScript = preload("res://scripts/puzzle_layout_resolver.gd")
const MainScene = preload("res://main.tscn")
const SAVE_DIR := "user://saves"
const LEGACY_SAVE := "user://pieceful_autosave_v1.json"


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	if not _check_resolver_geometry():
		return
	_clear_test_saves()

	var main = MainScene.instantiate()
	root.add_child(main)
	for _frame in range(14):
		await process_frame

	var board = main.get_node_or_null("PuzzleBoard")
	var coordinator = main.get_node_or_null("SaveCoordinator")
	if board == null or coordinator == null:
		_fail("runtime nodes missing")
		return

	var player_presets: Array = board.difficulty_presets()
	if player_presets.size() != 3:
		_fail("player-facing difficulty list is not exactly Relaxed / Standard / Hard")
		return
	for preset_value in player_presets:
		if not (preset_value is Dictionary):
			_fail("player difficulty preset is malformed")
			return
		var difficulty_id := str((preset_value as Dictionary).get("id", ""))
		if difficulty_id.begins_with("stress_"):
			_fail("stress fixture leaked into player-facing difficulty list")
			return

	if not board.difficulty_available("stress_576"):
		_fail("stress fixture is no longer callable by developer/CI paths")
		return

	var expected_legacy := {
		"relaxed": [8, 5, 40],
		"standard": [15, 10, 150],
		"hard": [22, 13, 286],
	}
	for difficulty_id_value in expected_legacy.keys():
		var difficulty_id := str(difficulty_id_value)
		var layout: Dictionary = board.resolved_layout_for_aspect(1.6, difficulty_id)
		var expected: Array = expected_legacy[difficulty_id]
		if (
			int(layout.get("columns", -1)) != int(expected[0])
			or int(layout.get("rows", -1)) != int(expected[1])
			or int(layout.get("piece_count", -1)) != int(expected[2])
		):
			_fail("1.6:1 compatibility mapping changed for %s: %s" % [difficulty_id, layout])
			return

	# Start the first real slot as Hard. The 1.6:1 built-in art must preserve the
	# approved Classic_286_A die so pre-#37 saves remain resumable.
	main.call("_on_content_card_pressed", "garden")
	_select_picker_difficulty(main, "hard")
	main.call("_start_selected_puzzle")
	for _frame in range(6):
		await process_frame
	if int(board.active_piece_count()) != 286:
		_fail("Garden Hard no longer resolves to 286 pieces")
		return
	if str(board.active_pattern_id()) != "Classic_286_A":
		_fail("legacy 1.6:1 Hard did not keep approved Classic_286_A")
		return

	var game_id := str(coordinator.active_game())
	var snapshot = _read_json(SAVE_DIR.path_join("%s.json" % game_id))
	if not (snapshot is Dictionary):
		_fail("could not read image-aware save")
		return
	var puzzle = snapshot.get("puzzle", {})
	if not (puzzle is Dictionary):
		_fail("save puzzle metadata missing")
		return
	if int(puzzle.get("grid_columns", -1)) != 22 or int(puzzle.get("grid_rows", -1)) != 13:
		_fail("save did not persist resolved 22x13 grid identity")
		return
	if str(puzzle.get("pattern_id", "")) != "Classic_286_A":
		_fail("save did not persist resolved CutPattern identity")
		return

	main.queue_free()
	await process_frame
	_clear_test_saves()
	print("PASS image_aware_difficulty_resolver_smoke")
	quit(0)


func _check_resolver_geometry() -> bool:
	var resolver = ResolverScript.new()
	var aspects: Array[float] = [
		1.0,
		4.0 / 3.0,
		3.0 / 4.0,
		16.0 / 9.0,
		9.0 / 16.0,
		4.0,
		0.25,
	]
	for aspect in aspects:
		var board_size := _board_size_for_aspect(aspect)
		var layout: Dictionary = resolver.resolve(aspect, 288, board_size, 24.0)
		if layout.is_empty():
			_fail("resolver returned no Hard layout for aspect %.4f" % aspect)
			return false
		if not bool(layout.get("touch_floor_satisfied", false)):
			_fail("touch floor failed for supported aspect %.4f" % aspect)
			return false
		if float(layout.get("piece_short_edge", 0.0)) < 23.999:
			_fail("resolver produced sub-touch piece at aspect %.4f" % aspect)
			return false
		var columns := int(layout.get("columns", 0))
		var rows := int(layout.get("rows", 0))
		if aspect >= 1.0 and columns < rows:
			_fail("landscape aspect resolved to portrait grid %.4f: %dx%d" % [aspect, columns, rows])
			return false
		if aspect < 1.0 and rows < columns:
			_fail("portrait aspect resolved to landscape grid %.4f: %dx%d" % [aspect, columns, rows])
			return false

	var panorama: Dictionary = resolver.resolve(4.0, 288, _board_size_for_aspect(4.0), 24.0)
	if int(panorama.get("piece_count", 9999)) >= 288:
		_fail("4:1 panorama did not reduce density to protect touch size")
		return false
	return true


func _board_size_for_aspect(aspect: float) -> Vector2:
	if aspect >= 1.0:
		return Vector2(600.0, 600.0 / aspect)
	return Vector2(600.0 * aspect, 600.0)


func _select_picker_difficulty(main, difficulty_id: String) -> void:
	var picker = main.puzzle_selection_difficulty
	if picker == null:
		return
	for index in range(picker.get_item_count()):
		if str(picker.get_item_metadata(index)) == difficulty_id:
			picker.select(index)
			return


func _read_json(path: String):
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return null
	var value: Variant = JSON.parse_string(file.get_as_text())
	file.close()
	return value


func _clear_test_saves() -> void:
	if FileAccess.file_exists(LEGACY_SAVE):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(LEGACY_SAVE))
	var dir := DirAccess.open(SAVE_DIR)
	if dir == null:
		return
	for filename in dir.get_files():
		DirAccess.remove_absolute(ProjectSettings.globalize_path(SAVE_DIR.path_join(filename)))


func _fail(message: String) -> void:
	push_error("FAIL image_aware_difficulty_resolver_smoke: %s" % message)
	quit(1)
