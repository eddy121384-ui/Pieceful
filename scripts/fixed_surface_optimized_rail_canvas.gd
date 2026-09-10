class_name FixedSurfaceOptimizedRailCanvas
extends "res://scripts/chaos_order_optimized_rail_canvas.gd"

# SortingUI is laid out in the familiar virtual portrait/landscape coordinate
# space, then compressed into the fixed 720x720 render surface. GUI events still
# arrive in render-surface coordinates, so manual Rail dragging must explicitly
# cross that CanvasLayer transform instead of comparing raw pixels to local UI
# positions.


func _gui_input(event: InputEvent) -> void:
	if dragging:
		return
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
			_begin_piece_drag(-1, get_viewport().get_mouse_position())
	elif event is InputEventScreenTouch:
		if event.pressed:
			_begin_piece_drag(event.index, _local_to_screen(event.position))


func _move_piece_drag(screen_position: Vector2) -> void:
	var current_local := _screen_to_local(screen_position)
	var previous_local := _screen_to_local(drag_last_screen_position)
	var delta := current_local - previous_local
	if delta.is_zero_approx():
		return
	drag_last_screen_position = screen_position
	_translate_group(drag_member_indexes, delta)
	_sync_visual_positions()


func _finish_piece_drag(screen_position: Vector2) -> void:
	if not dragging:
		return

	var released_members := drag_member_indexes.duplicate()
	var released_anchor := drag_anchor_piece_index
	var released_offset := drag_anchor_pointer_offset
	var released_inside := Rect2(Vector2.ZERO, size).has_point(
		_screen_to_local(screen_position)
	)

	dragging = false
	drag_pointer_id = -999
	drag_anchor_piece_index = -1
	drag_member_indexes.clear()
	drag_last_screen_position = Vector2.ZERO
	drag_anchor_pointer_offset = Vector2.ZERO
	set_process_input(false)

	if not released_inside:
		group_dragged_out.emit(
			released_members,
			released_anchor,
			screen_position,
			released_offset
		)
		return

	_clamp_group_inside(released_members)
	_sync_visual_positions()
	queue_redraw()


func _screen_to_local(screen_position: Vector2) -> Vector2:
	return get_global_transform_with_canvas().affine_inverse() * screen_position


func _local_to_screen(local_position: Vector2) -> Vector2:
	return get_global_transform_with_canvas() * local_position
