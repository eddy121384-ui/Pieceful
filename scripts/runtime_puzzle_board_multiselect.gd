class_name RuntimePuzzleBoardMultiSelect
extends "res://scripts/runtime_puzzle_board.gd"


func can_begin_piece_drag(piece, pointer_screen_position: Vector2) -> bool:
	if not super.can_begin_piece_drag(piece, pointer_screen_position):
		return false

	var sorting_workspace := get_parent().get_node_or_null("SortingWorkspace")
	if (
		sorting_workspace != null
		and sorting_workspace.has_method("try_handle_piece_select_tap")
		and sorting_workspace.try_handle_piece_select_tap(piece)
	):
		return false

	return true
