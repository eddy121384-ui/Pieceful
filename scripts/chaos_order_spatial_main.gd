extends "res://scripts/chaos_order_main.gd"


func _randomize_runtime_scatter() -> void:
	super._randomize_runtime_scatter()
	_mark_spatial_dirty()


func _spread_at_screen(screen_position: Vector2, step_screen: float) -> void:
	super._spread_at_screen(screen_position, step_screen)
	_mark_spatial_dirty()


func _screen_hits_playable_piece(screen_position: Vector2) -> bool:
	if (
		board != null
		and board.has_method("spatial_mode_enabled")
		and board.spatial_mode_enabled()
		and board.has_method("spatial_piece_at_screen")
	):
		return board.spatial_piece_at_screen(screen_position) != null
	return super._screen_hits_playable_piece(screen_position)


func _mark_spatial_dirty() -> void:
	if board != null and board.has_method("mark_spatial_index_dirty"):
		board.mark_spatial_index_dirty()
