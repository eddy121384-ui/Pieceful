class_name TrayReflowPlayCanvas
extends "res://scripts/tray_play_canvas.gd"

# Tray piece coordinates live in the mini-table's local space. When the window
# changes orientation the mini-table changes shape, but a connected cluster must
# remain rigid. Reflow therefore preserves each group's top-left position as a
# normalized value inside its *available movement area* and translates the whole
# group into the new Tray size. Internal piece offsets are never scaled.


func _notification(what: int) -> void:
	if what != NOTIFICATION_RESIZED:
		super._notification(what)
		return

	queue_redraw()
	if board == null or state == null or tray_id.is_empty():
		return
	_reflow_tray_positions(board, state, tray_id, size)
	_clamp_all_groups_inside()
	_sync_visual_positions()


func configure(p_board, p_state, p_tray_id: String) -> void:
	board = p_board
	state = p_state
	tray_id = p_tray_id
	_ensure_content_root()
	_ensure_empty_hint()
	_reflow_tray_positions(board, state, tray_id, size)
	refresh()


func prepare_tray_for_size(
	p_board,
	p_state,
	p_tray_id: String,
	target_size: Vector2
) -> void:
	_reflow_tray_positions(p_board, p_state, p_tray_id, target_size)


func _reflow_tray_positions(
	p_board,
	p_state,
	p_tray_id: String,
	target_size: Vector2
) -> void:
	if (
		p_board == null
		or p_state == null
		or p_tray_id.is_empty()
		or target_size.x <= 1.0
		or target_size.y <= 1.0
		or not p_state.has_method("tray_position_reference_size")
		or not p_state.has_method("set_tray_position_reference_size")
	):
		return

	var old_size: Vector2 = Vector2(
		p_state.tray_position_reference_size(p_tray_id)
	)
	if old_size.x <= 1.0 or old_size.y <= 1.0:
		# Legacy V1 data did not carry a reference size. Adopt the current size and
		# let the inherited clamp keep it safe; subsequent reflows are normalized.
		p_state.set_tray_position_reference_size(p_tray_id, target_size)
		return
	if old_size.distance_to(target_size) <= 0.5:
		p_state.set_tray_position_reference_size(p_tray_id, target_size)
		return

	var seen: Dictionary = {}
	for piece_value in p_state.tray_piece_indexes(p_tray_id):
		var piece_index: int = int(piece_value)
		var cluster_id: int = int(
			p_board.cluster_for_piece.get(piece_index, piece_index)
		)
		if seen.has(cluster_id):
			continue
		seen[cluster_id] = true

		var group: Array = _tray_members_for_cluster(
			p_board,
			p_state,
			p_tray_id,
			cluster_id
		)
		if group.is_empty():
			continue

		var bounds: Rect2 = _group_bounds_for(
			p_board,
			p_state,
			p_tray_id,
			group
		)
		if bounds.size.x <= 0.0 or bounds.size.y <= 0.0:
			continue

		var old_min := Vector2(EDGE_PADDING, EDGE_PADDING)
		var old_max := Vector2(
			maxf(EDGE_PADDING, old_size.x - EDGE_PADDING - bounds.size.x),
			maxf(EDGE_PADDING, old_size.y - EDGE_PADDING - bounds.size.y)
		)
		var old_range := Vector2(
			maxf(1.0, old_max.x - old_min.x),
			maxf(1.0, old_max.y - old_min.y)
		)
		var normalized := Vector2(
			clampf((bounds.position.x - old_min.x) / old_range.x, 0.0, 1.0),
			clampf((bounds.position.y - old_min.y) / old_range.y, 0.0, 1.0)
		)

		var new_min := Vector2(EDGE_PADDING, EDGE_PADDING)
		var new_max := Vector2(
			maxf(EDGE_PADDING, target_size.x - EDGE_PADDING - bounds.size.x),
			maxf(EDGE_PADDING, target_size.y - EDGE_PADDING - bounds.size.y)
		)
		var target_top_left := Vector2(
			lerpf(new_min.x, new_max.x, normalized.x),
			lerpf(new_min.y, new_max.y, normalized.y)
		)
		_translate_group_for_state(
			p_state,
			p_tray_id,
			group,
			target_top_left - bounds.position
		)

	p_state.set_tray_position_reference_size(p_tray_id, target_size)


func _tray_members_for_cluster(
	p_board,
	p_state,
	p_tray_id: String,
	cluster_id: int
) -> Array:
	var result: Array = []
	var raw_members = p_board.cluster_members.get(cluster_id, [])
	if not (raw_members is Array):
		return result
	for value in raw_members:
		var piece_index: int = int(value)
		if p_state.tray_id_for(piece_index) == p_tray_id:
			result.append(piece_index)
	return result


func _group_bounds_for(
	p_board,
	p_state,
	p_tray_id: String,
	member_indexes: Array
) -> Rect2:
	var result := Rect2()
	var has_bounds := false
	var scale_factor: float = _visual_scale_for_board(p_board)
	for value in member_indexes:
		var piece_index: int = int(value)
		if (
			piece_index < 0
			or piece_index >= p_board.pieces.size()
			or p_state.tray_id_for(piece_index) != p_tray_id
		):
			continue
		var piece = p_board.pieces[piece_index]
		if not is_instance_valid(piece):
			continue
		var piece_position: Vector2 = Vector2(
			p_state.tray_piece_position(p_tray_id, piece_index)
		)
		var piece_rect := Rect2(
			piece_position,
			Vector2(piece.piece_size) * scale_factor
		)
		if not has_bounds:
			result = piece_rect
			has_bounds = true
		else:
			result = result.merge(piece_rect)
	return result


func _visual_scale_for_board(p_board) -> float:
	if p_board == null or p_board.definition == null:
		return 1.0
	var piece_size: Vector2 = Vector2(p_board.definition.piece_size)
	var short_edge: float = maxf(1.0, minf(piece_size.x, piece_size.y))
	return clampf(
		TARGET_PIECE_SHORT_EDGE / short_edge,
		MIN_VISUAL_SCALE,
		MAX_VISUAL_SCALE
	)


func _translate_group_for_state(
	p_state,
	p_tray_id: String,
	member_indexes: Array,
	delta: Vector2
) -> void:
	if delta.is_zero_approx():
		return
	for value in member_indexes:
		var piece_index: int = int(value)
		if p_state.tray_id_for(piece_index) != p_tray_id:
			continue
		p_state.set_tray_piece_position(
			p_tray_id,
			piece_index,
			Vector2(p_state.tray_piece_position(p_tray_id, piece_index)) + delta
		)


# Fixed-surface input --------------------------------------------------------
# The Tray lives under a non-uniformly transformed CanvasLayer. Keep every
# public drag signal in render-surface coordinates, while all placement deltas
# are measured in Tray-local virtual coordinates.

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

	var released_members: Array = drag_member_indexes.duplicate()
	var released_anchor: int = drag_anchor_piece_index
	var released_offset: Vector2 = drag_anchor_pointer_offset
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
	_try_snap_group_in_tray(released_anchor)
	_sync_visual_positions()
	queue_redraw()


func _screen_to_local(screen_position: Vector2) -> Vector2:
	return get_global_transform_with_canvas().affine_inverse() * screen_position


func _local_to_screen(local_position: Vector2) -> Vector2:
	return get_global_transform_with_canvas() * local_position
