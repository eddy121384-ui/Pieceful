extends "res://scripts/chaos_order_layout_dock_ui.gd"


func _set_loose_layout_mode(mode: String) -> void:
	super._set_loose_layout_mode(mode)
	_mark_spatial_dirty()


func _finish_layout_transition() -> void:
	super._finish_layout_transition()
	_mark_spatial_dirty()


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
	_mark_spatial_dirty()


func _mark_spatial_dirty() -> void:
	if board != null and board.has_method("mark_spatial_index_dirty"):
		board.mark_spatial_index_dirty()
