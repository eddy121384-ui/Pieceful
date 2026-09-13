class_name CompletionEventPuzzleBoard
extends "res://scripts/touch_priority_puzzle_me_gallery_board.gd"


func _show_hint_for_piece(piece) -> void:
	var should_record := (
		hint_is_enabled()
		and piece != null
		and not bool(piece.solved)
	)
	super._show_hint_for_piece(piece)
	if not should_record:
		return
	var coordinator = get_parent().get_node_or_null("SaveCoordinator")
	if coordinator != null and coordinator.has_method("record_hint_use"):
		coordinator.call("record_hint_use", int(piece.piece_index))
