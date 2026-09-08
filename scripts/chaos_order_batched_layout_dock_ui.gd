extends "res://scripts/chaos_order_layout_dock_ui.gd"


func _set_loose_layout_mode(mode: String) -> void:
	super._set_loose_layout_mode(mode)
	_sync_board_batch()


func _finish_layout_transition() -> void:
	super._finish_layout_transition()
	_sync_board_batch()


func _on_rail_group_dragged_out(
	member_indexes: Array,
	anchor_piece_index: int,
	screen_position: Vector2,
	anchor_pointer_offset: Vector2
) -> void:
	super._on_rail_group_dragged_out(
		member_indexes,
		anchor_piece_index,
		screen_position,
		anchor_pointer_offset
	)
	_sync_board_batch()


func _sync_board_batch() -> void:
	if board == null:
		return
	if board.has_method("sync_batched_passive_state"):
		board.sync_batched_passive_state()
