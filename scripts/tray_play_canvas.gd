class_name TrayPlayCanvas
extends Control

signal group_dragged_out(
	member_indexes: Array,
	anchor_piece_index: int,
	screen_position: Vector2,
	anchor_pointer_offset: Vector2
)
signal tray_cluster_changed

const TARGET_PIECE_SHORT_EDGE := 52.0
const MIN_VISUAL_SCALE := 0.62
const MAX_VISUAL_SCALE := 1.28
const EDGE_PADDING := 10.0

var board = null
var state = null
var tray_id := ""
var content_root: Node2D = null
var visual_nodes: Dictionary = {}
var piece_z: Dictionary = {}
var z_counter := 1

var dragging := false
var drag_pointer_id := -999
var drag_anchor_piece_index := -1
var drag_member_indexes: Array = []
var drag_last_screen_position := Vector2.ZERO
var drag_anchor_pointer_offset := Vector2.ZERO


func _ready() -> void:
	clip_contents = true
	mouse_filter = Control.MOUSE_FILTER_STOP
	custom_minimum_size = Vector2(280.0, 190.0)
	set_process_input(false)
	_ensure_content_root()
	queue_redraw()


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED:
		queue_redraw()
		_clamp_all_groups_inside()
		_sync_visual_positions()


func configure(p_board, p_state, p_tray_id: String) -> void:
	board = p_board
	state = p_state
	tray_id = p_tray_id
	_ensure_content_root()
	refresh()


func refresh() -> void:
	if board == null or state == null or tray_id.is_empty():
		_clear_visuals()
		queue_redraw()
		return
	_ensure_missing_positions()
	_rebuild_visuals()
	queue_redraw()


func visual_scale() -> float:
	if board == null or board.definition == null:
		return 1.0
	var piece_size: Vector2 = Vector2(board.definition.piece_size)
	var short_edge: float = maxf(1.0, minf(piece_size.x, piece_size.y))
	return clampf(TARGET_PIECE_SHORT_EDGE / short_edge, MIN_VISUAL_SCALE, MAX_VISUAL_SCALE)


func accept_world_drop(
	member_indexes: Array,
	anchor_piece_index: int,
	screen_position: Vector2
) -> void:
	if board == null or state == null or member_indexes.is_empty():
		return
	if anchor_piece_index < 0 or anchor_piece_index >= board.pieces.size():
		return

	var scale_factor: float = visual_scale()
	var local_drop: Vector2 = _screen_to_local(screen_position)
	var anchor_piece = board.pieces[anchor_piece_index]
	var anchor_position: Vector2 = (
		local_drop - Vector2(anchor_piece.piece_size) * scale_factor * 0.5
	)

	for value in member_indexes:
		var piece_index := int(value)
		if piece_index < 0 or piece_index >= board.pieces.size():
			continue
		var member = board.pieces[piece_index]
		var relative_target: Vector2 = (
			Vector2(member.target_position) - Vector2(anchor_piece.target_position)
		) * scale_factor
		state.set_tray_piece_position(
			tray_id,
			piece_index,
			anchor_position + relative_target
		)

	_raise_group(member_indexes)
	_clamp_group_inside(member_indexes)
	refresh()


func _draw() -> void:
	var rect := Rect2(Vector2.ZERO, size)
	draw_rect(rect, Color(0.018, 0.021, 0.028, 0.34), true)
	draw_rect(rect.grow(-1.0), Color(1.0, 1.0, 1.0, 0.12), false, 1.0)

	if state == null or tray_id.is_empty() or state.tray_piece_count(tray_id) > 0:
		return
	var label_position := Vector2(18.0, maxf(34.0, size.y * 0.5))
	draw_string(
		ThemeDB.fallback_font,
		label_position,
		"Drop pieces here — this tray is a playable mini table",
		HORIZONTAL_ALIGNMENT_LEFT,
		-1.0,
		14,
		Color(1.0, 1.0, 1.0, 0.46)
	)


func _gui_input(event: InputEvent) -> void:
	if dragging:
		return
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
			_begin_piece_drag(-1, get_viewport().get_mouse_position())
	elif event is InputEventScreenTouch:
		if event.pressed:
			_begin_piece_drag(event.index, event.position)


func _input(event: InputEvent) -> void:
	if not dragging:
		return

	if drag_pointer_id == -1:
		if event is InputEventMouseMotion:
			if (event.button_mask & MOUSE_BUTTON_MASK_LEFT) != 0:
				_move_piece_drag(get_viewport().get_mouse_position())
				get_viewport().set_input_as_handled()
		elif event is InputEventMouseButton:
			if event.button_index == MOUSE_BUTTON_LEFT and not event.pressed:
				_finish_piece_drag(get_viewport().get_mouse_position())
				get_viewport().set_input_as_handled()
	else:
		if event is InputEventScreenDrag and event.index == drag_pointer_id:
			_move_piece_drag(event.position)
			get_viewport().set_input_as_handled()
		elif event is InputEventScreenTouch:
			if event.index == drag_pointer_id and not event.pressed:
				_finish_piece_drag(event.position)
				get_viewport().set_input_as_handled()


func _begin_piece_drag(pointer_id: int, screen_position: Vector2) -> void:
	var piece_index := _top_piece_at(screen_position)
	if piece_index < 0:
		return
	var members := _group_members_for_piece(piece_index)
	if members.is_empty():
		return

	dragging = true
	drag_pointer_id = pointer_id
	drag_anchor_piece_index = piece_index
	drag_member_indexes = members
	drag_last_screen_position = screen_position
	drag_anchor_pointer_offset = (
		_screen_to_local(screen_position)
		- state.tray_piece_position(tray_id, piece_index)
	)
	_raise_group(members)
	set_process_input(true)
	get_viewport().set_input_as_handled()


func _move_piece_drag(screen_position: Vector2) -> void:
	var delta := screen_position - drag_last_screen_position
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
	var released_inside := get_global_rect().has_point(screen_position)

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


func _try_snap_group_in_tray(anchor_piece_index: int) -> void:
	if board == null or state == null or anchor_piece_index < 0:
		return
	var moving_cluster_id := int(
		board.cluster_for_piece.get(anchor_piece_index, anchor_piece_index)
	)
	var merged_again := true
	var snap_radius := _tray_snap_radius()

	while merged_again:
		merged_again = false
		var moving_members := _cluster_members_for_id(moving_cluster_id)
		for member_value in moving_members:
			var member_index := int(member_value)
			if state.tray_id_for(member_index) != tray_id:
				continue
			var member = board.pieces[member_index]

			for neighbor_index in board.definition.neighbor_indexes_for(member_index):
				if state.tray_id_for(neighbor_index) != tray_id:
					continue
				var other_cluster_id := int(
					board.cluster_for_piece.get(neighbor_index, neighbor_index)
				)
				if other_cluster_id == moving_cluster_id:
					continue

				var neighbor = board.pieces[neighbor_index]
				var correct_offset := (
					Vector2(member.target_position)
					- Vector2(neighbor.target_position)
				) * visual_scale()
				var desired_member_position := (
					state.tray_piece_position(tray_id, neighbor_index)
					+ correct_offset
				)
				var correction := (
					desired_member_position
					- state.tray_piece_position(tray_id, member_index)
				)

				if correction.length() <= snap_radius:
					_translate_group(moving_members, correction)
					_merge_board_clusters(moving_cluster_id, other_cluster_id)
					_raise_group(_cluster_members_for_id(moving_cluster_id))
					merged_again = true
					tray_cluster_changed.emit()
					break
			if merged_again:
				break


func _merge_board_clusters(survivor_id: int, absorbed_id: int) -> void:
	if survivor_id == absorbed_id:
		return
	if not board.cluster_members.has(survivor_id):
		return
	if not board.cluster_members.has(absorbed_id):
		return

	var survivor_members := _cluster_members_for_id(survivor_id)
	var absorbed_members := _cluster_members_for_id(absorbed_id)
	for value in absorbed_members:
		var piece_index := int(value)
		if not survivor_members.has(piece_index):
			survivor_members.append(piece_index)
		board.cluster_for_piece[piece_index] = survivor_id
	board.cluster_members[survivor_id] = survivor_members
	board.cluster_members.erase(absorbed_id)


func _tray_snap_radius() -> float:
	if board == null or board.definition == null:
		return 14.0
	var short_edge := minf(
		float(board.definition.piece_size.x),
		float(board.definition.piece_size.y)
	) * visual_scale()
	return clampf(short_edge * 0.18, 10.0, 20.0)


func _group_members_for_piece(piece_index: int) -> Array:
	if board == null or state == null:
		return []
	var cluster_id := int(board.cluster_for_piece.get(piece_index, piece_index))
	var members := _cluster_members_for_id(cluster_id)
	if members.is_empty():
		return []
	for value in members:
		if state.tray_id_for(int(value)) != tray_id:
			return []
	return members


func _cluster_members_for_id(cluster_id: int) -> Array:
	if board == null:
		return []
	var members = board.cluster_members.get(cluster_id, [])
	if members is Array:
		return members.duplicate()
	return []


func _top_piece_at(screen_position: Vector2) -> int:
	if board == null or state == null:
		return -1
	var local_point := _screen_to_local(screen_position)
	var scale_factor := visual_scale()
	var winner := -1
	var winner_z := -2147483648

	for value in state.tray_piece_indexes(tray_id):
		var piece_index := int(value)
		if piece_index < 0 or piece_index >= board.pieces.size():
			continue
		var piece = board.pieces[piece_index]
		var piece_position := state.tray_piece_position(tray_id, piece_index)
		var piece_local := (local_point - piece_position) / scale_factor
		if not Geometry2D.is_point_in_polygon(piece_local, piece.polygon_points):
			continue
		var candidate_z := int(piece_z.get(piece_index, 0))
		if winner < 0 or candidate_z >= winner_z:
			winner = piece_index
			winner_z = candidate_z
	return winner


func _translate_group(member_indexes: Array, delta: Vector2) -> void:
	if state == null or delta.is_zero_approx():
		return
	for value in member_indexes:
		var piece_index := int(value)
		if state.tray_id_for(piece_index) != tray_id:
			continue
		var next_position := state.tray_piece_position(tray_id, piece_index) + delta
		state.set_tray_piece_position(tray_id, piece_index, next_position)


func _raise_group(member_indexes: Array) -> void:
	z_counter += 1
	for value in member_indexes:
		piece_z[int(value)] = z_counter
	_sync_visual_z()


func _clamp_all_groups_inside() -> void:
	if board == null or state == null or tray_id.is_empty():
		return
	var seen: Dictionary = {}
	for value in state.tray_piece_indexes(tray_id):
		var piece_index := int(value)
		var cluster_id := int(board.cluster_for_piece.get(piece_index, piece_index))
		if seen.has(cluster_id):
			continue
		seen[cluster_id] = true
		_clamp_group_inside(_cluster_members_for_id(cluster_id))


func _clamp_group_inside(member_indexes: Array) -> void:
	if member_indexes.is_empty() or size.x <= 1.0 or size.y <= 1.0:
		return
	var bounds := _group_bounds(member_indexes)
	if bounds.size.x <= 0.0 or bounds.size.y <= 0.0:
		return
	var min_position := Vector2(EDGE_PADDING, EDGE_PADDING)
	var max_position := Vector2(
		maxf(EDGE_PADDING, size.x - EDGE_PADDING - bounds.size.x),
		maxf(EDGE_PADDING, size.y - EDGE_PADDING - bounds.size.y)
	)
	var target := Vector2(
		clampf(bounds.position.x, min_position.x, max_position.x),
		clampf(bounds.position.y, min_position.y, max_position.y)
	)
	_translate_group(member_indexes, target - bounds.position)


func _group_bounds(member_indexes: Array) -> Rect2:
	var result := Rect2()
	var has_bounds := false
	var scale_factor := visual_scale()
	for value in member_indexes:
		var piece_index := int(value)
		if state.tray_id_for(piece_index) != tray_id:
			continue
		var piece = board.pieces[piece_index]
		var piece_position := state.tray_piece_position(tray_id, piece_index)
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


func _ensure_missing_positions() -> void:
	if board == null or state == null or tray_id.is_empty():
		return
	var scale_factor := visual_scale()
	var piece_size := Vector2(board.definition.piece_size) * scale_factor
	var step := Vector2(
		maxf(48.0, piece_size.x * 0.86),
		maxf(48.0, piece_size.y * 0.86)
	)
	var columns: int = maxi(
		1,
		floori(maxf(1.0, size.x - 24.0) / maxf(step.x, 1.0))
	)
	var ordinal := 0
	for value in state.tray_piece_indexes(tray_id):
		var piece_index := int(value)
		if state.has_tray_piece_position(tray_id, piece_index):
			continue
		var column: int = ordinal % columns
		var row: int = floori(float(ordinal) / float(columns))
		state.set_tray_piece_position(
			tray_id,
			piece_index,
			Vector2(
				12.0 + float(column) * step.x,
				12.0 + float(row) * step.y
			)
		)
		ordinal += 1


func _ensure_content_root() -> void:
	if content_root != null and is_instance_valid(content_root):
		return
	content_root = Node2D.new()
	content_root.name = "TrayPieces"
	add_child(content_root)


func _rebuild_visuals() -> void:
	_ensure_content_root()
	_clear_visuals()
	if board == null or state == null:
		return
	var scale_factor := visual_scale()
	for value in state.tray_piece_indexes(tray_id):
		var piece_index := int(value)
		if piece_index < 0 or piece_index >= board.pieces.size():
			continue
		var source_piece = board.pieces[piece_index]
		var holder := Node2D.new()
		holder.name = "TrayPiece_%03d" % piece_index
		holder.position = state.tray_piece_position(tray_id, piece_index)
		holder.scale = Vector2(scale_factor, scale_factor)
		holder.z_index = int(piece_z.get(piece_index, 0))
		content_root.add_child(holder)
		visual_nodes[piece_index] = holder

		var face := Polygon2D.new()
		face.polygon = source_piece.polygon_points
		face.uv = source_piece.uv_points
		face.texture = source_piece.source_texture
		holder.add_child(face)

		var outline := Line2D.new()
		var outline_points: PackedVector2Array = source_piece.polygon_points.duplicate()
		if not outline_points.is_empty():
			outline_points.append(outline_points[0])
		outline.points = outline_points
		outline.width = 1.1 / maxf(scale_factor, 0.01)
		outline.default_color = Color(1.0, 1.0, 1.0, 0.56)
		outline.antialiased = true
		holder.add_child(outline)


func _sync_visual_positions() -> void:
	if state == null:
		return
	for piece_index in visual_nodes.keys():
		var node = visual_nodes[piece_index]
		if (
			is_instance_valid(node)
			and state.has_tray_piece_position(tray_id, int(piece_index))
		):
			node.position = state.tray_piece_position(tray_id, int(piece_index))
	_sync_visual_z()


func _sync_visual_z() -> void:
	for piece_index in visual_nodes.keys():
		var node = visual_nodes[piece_index]
		if is_instance_valid(node):
			node.z_index = int(piece_z.get(piece_index, 0))


func _clear_visuals() -> void:
	visual_nodes.clear()
	if content_root == null or not is_instance_valid(content_root):
		return
	for child in content_root.get_children():
		content_root.remove_child(child)
		child.queue_free()


func _screen_to_local(screen_position: Vector2) -> Vector2:
	return screen_position - get_global_rect().position
