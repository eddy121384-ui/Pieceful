class_name RuntimePuzzleBoard
extends "res://scripts/puzzle_board.gd"

const RuntimeDifficultyCatalogScript = preload("res://scripts/runtime_difficulty_catalog.gd")

var difficulty_catalog = RuntimeDifficultyCatalogScript.new()
var selected_difficulty_id := "relaxed"
var last_difficulty_error := ""


func difficulty_presets() -> Array:
	return RuntimeDifficultyCatalogScript.PRESETS


func difficulty_available(difficulty_id: String) -> bool:
	return difficulty_catalog.is_available(difficulty_id)


func active_difficulty_id() -> String:
	if active_cut_pattern_path == REGRESSION_CUT_PATTERN_PATH:
		return "regression"
	return selected_difficulty_id


func active_difficulty_label() -> String:
	var preset := difficulty_catalog.preset_for(selected_difficulty_id)
	if preset.is_empty():
		return "Unknown"
	return str(preset["label"])


func request_difficulty(difficulty_id: String) -> bool:
	last_difficulty_error = ""
	var preset := difficulty_catalog.preset_for(difficulty_id)
	if preset.is_empty():
		last_difficulty_error = "Unknown difficulty: %s" % difficulty_id
		return false

	var path := str(preset["cut_pattern_path"])
	if not FileAccess.file_exists(path):
		last_difficulty_error = "%s needs approved %s" % [
			str(preset["label"]),
			path.get_file(),
		]
		return false

	selected_difficulty_id = difficulty_id
	start_new_game()
	return true


func _select_runtime_cut_pattern() -> String:
	var preset := difficulty_catalog.preset_for(selected_difficulty_id)
	if not preset.is_empty():
		var path := str(preset["cut_pattern_path"])
		if FileAccess.file_exists(path):
			return path

	# Preserve the tiny regression fixture as a startup safety net only. Player
	# difficulty changes never silently fall back: request_difficulty() rejects a
	# missing curated asset before restarting the current game.
	return REGRESSION_CUT_PATTERN_PATH
