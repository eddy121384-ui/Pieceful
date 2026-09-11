class_name ImageAwarePuzzleSelectionMain
extends "res://scripts/puzzle_selection_multi_slot_main.gd"


func _on_content_card_pressed(content_id: String) -> void:
	var preferred_difficulty := _picker_selected_difficulty_id()
	pending_content_id = content_id
	_refresh_picker_difficulties(content_id, preferred_difficulty)
	_refresh_content_card_state()


func _show_puzzle_selection(can_cancel: bool) -> void:
	super._show_puzzle_selection(can_cancel)
	if puzzle_selection_overlay == null:
		return
	_refresh_picker_difficulties(pending_content_id, str(board.active_difficulty_id()))


func _refresh_picker_difficulties(content_id: String, preferred_difficulty: String) -> void:
	if puzzle_selection_difficulty == null or board == null:
		return

	var presets: Array = []
	if board.has_method("difficulty_presets_for_content"):
		presets = board.difficulty_presets_for_content(content_id)
	else:
		presets = board.difficulty_presets()

	puzzle_selection_difficulty.clear()
	for preset_value in presets:
		if not (preset_value is Dictionary):
			continue
		var preset: Dictionary = preset_value
		var difficulty_id := str(preset.get("id", ""))
		if difficulty_id.is_empty():
			continue
		var count := int(preset.get("resolved_piece_count", 0))
		if count <= 0:
			continue
		puzzle_selection_difficulty.add_item(
			"%s · %d pieces" % [preset.get("label", difficulty_id), count]
		)
		puzzle_selection_difficulty.set_item_metadata(
			puzzle_selection_difficulty.get_item_count() - 1,
			difficulty_id
		)

	_select_picker_difficulty(preferred_difficulty)


func _picker_selected_difficulty_id() -> String:
	if puzzle_selection_difficulty == null:
		return str(board.active_difficulty_id()) if board != null else "relaxed"
	if puzzle_selection_difficulty.get_item_count() <= 0:
		return str(board.active_difficulty_id()) if board != null else "relaxed"
	return str(
		puzzle_selection_difficulty.get_item_metadata(puzzle_selection_difficulty.selected)
	)
