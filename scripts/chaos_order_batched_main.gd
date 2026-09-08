extends "res://scripts/chaos_order_main.gd"


func _randomize_runtime_scatter() -> void:
	super._randomize_runtime_scatter()
	_sync_main_table_batch(true)


func _spread_at_screen(screen_position: Vector2, step_screen: float) -> void:
	super._spread_at_screen(screen_position, step_screen)
	_sync_main_table_batch(true)


func _screen_hits_playable_piece(screen_position: Vector2) -> bool:
	if (
		board != null
		and board.has_method("batch_mode_enabled")
		and board.batch_mode_enabled()
		and board.has_method("batched_piece_at_screen")
	):
		return board.batched_piece_at_screen(screen_position) != null
	return super._screen_hits_playable_piece(screen_position)


func _sync_main_table_batch(spatial_dirty: bool) -> void:
	if board == null:
		return
	if board.has_method("request_batched_redraw"):
		board.request_batched_redraw(spatial_dirty)
