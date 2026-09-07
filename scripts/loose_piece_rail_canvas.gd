class_name LoosePieceRailCanvas
extends Control

signal group_dragged_out(
	member_indexes: Array,
	anchor_piece_index: int,
	screen_position: Vector2,
	anchor_pointer_offset: Vector2
)

const TARGET_PIECE_SHORT_EDGE := 48.0
const MIN_VISUAL_SCALE := 0.48
const MAX_VISUAL_SCALE := 1.10
const EDGE_PADDING := 10.0
const CELL_GAP := 8.0

var board = null
var member_indexes: Array = []
var content_root: Node2D = null
var empty_hint: Label = null
var positions: Dictionary = {}
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
	custom_minimum_size = Vector2(180.0, 120.0)
	set_process_input(false)
	_ensure_content_root()
	_ensure_empty_hint()
	queue_redraw()


func _notification(what: int) -> void:
	if what == NOTIFICATION_RESIZED:
		_layout_groups()
		_rebuild_visuals()
		queue_redraw()


func configure(p_board, p_member_indexes: Array) -> void:
	board = p_board
	member_indexes = p_member_indexes.duplicate()
	_layout_groups()
	_rebuild_visuals()
	_update_empty_hint()
	queue_redraw()


func refresh(p_member_indexes: Array) -> void:
	member_indexes = p_member_indexes.duplicate()
	_layout_groups()
	_rebuild_visuals()
	_update_empty_hint()
	queue_redraw()


func visual_scale() -> float:
	if board == null or board.definition == null:
		return 1.0
	var piece_size: Vector2 = Vector2(board.definition.piece_size)
	var short_edge: float = maxf(1.0, minf(piece_size.x, piece_size.y))
	return clampf(
		TARGET_PIECE_SHORT_EDGE / short_edge,
		MIN_VISUAL_SCALE,
		MAX_VISUAL_SCALE
	)


func _draw() -> void:
	var rect := Rect2(Vector2.ZERO, size)
	draw_rect(rect, Color(0.018, 0.021, 0.028, 0.30), true)
	draw_rect(rect.grow(-1.0), Color(1.0, 1.0, 1.0, 0.10), false, 1.0)


func _ensure_content_root() -> void:
	if content_root != null and is_instance_valid(content_root):
		return
	content_root = Node2D.new()
	content_root.name = "LooseRailPieces"
	add_child(content_root)


func _ensure_empty_hint() -> void:
	if empty_hint != null and is_instance_valid(empty_hint):
		return
	empty_hint = Label.new()
	empty_hint.text = "Loose pieces will wait here"
	empty_hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	empty_hint.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	empty_hint.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	empty_hint.mouse_filter = Control.MOUSE_FILTER_IGNORE
	empty_hint.modulate = Color(1.0, 1.0, 1.0, 0.42)
	empty_hint.add_theme_font_size_override("font_size", 13)
	add_child(empty_hint)


func _update_empty_hint() -> void:
	if empty_hint != null:
		empty_hint.visible = member_indexes.is_empty()


func _gui_input(event: InputEvent) -> void:
	if dragging:
		return
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
			_begin_piece_drag(-1, get_viewport().get_mouse_position())
	elif event is InputEventScreenTouch:
		if event.pressed:
			_begin_piece_drag(event.index, _local_to_screen(event.position))


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
		_screen_to_local(screen_position) - _piece_position(piece_index)
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
	_sync_visual_positions()
	queue_redraw()


func _top_piece_at(screen_position: Vector2) -> int:
	if board == null:
		return -1
	var local_point := _screen_to_local(screen_position)
	var scale_factor := visual_scale()
	var winner := -1
	var winner_z := -2147483648

	for value in member_indexes:
		var piece_index := int(value)
		if piece_index < 0 or piece_index >= board.pieces.size():
			continue
		var piece = board.pieces[piece_index]
		if not is_instance_valid(piece):
			continue
		var piece_local := (
			local_point - _piece_position(piece_index)
		) / maxf(scale_factor, 0.01)
		if not Geometry2D.is_point_in_polygon(piece_local, piece.polygon_points):
			continue
		var candidate_z := int(piece_z.get(piece_index, 0))
		if winner < 0 or candidate_z >= winner_z:
			winner = piece_index
			winner_z = candidate_z
	return winner


func _group_members_for_piece(piece_index: int) -> Array:
	if board == null:
		return []
	var cluster_id := int(board.cluster_for_piece.get(piece_index, piece_index))
	var raw_members = board.cluster_members.get(cluster_id, [piece_index])
	if not (raw_members is Array):
		return []
	var members: Array = []
	for value in raw_members:
		var member_index := int(value)
		if not member_indexes.has(member_index):
			return []
		members.append(member_index)
	return members


func _layout_groups() -> void:
	positions.clear()
	if board == null or board.definition == null or member_indexes.is_empty():
		return

	var groups := _groups_in_display_order()
	var scale_factor := visual_scale()
	var piece_size := Vector2(board.definition.piece_size) * scale_factor
	var cell := Vector2(
		maxf(64.0, piece_size.x + CELL_GAP),
		maxf(64.0, piece_size.y + CELL_GAP)
	)
	var usable_width := maxf(cell.x, size.x - EDGE_PADDING * 2.0)
	var columns := maxi(1, floori(usable_width / maxf(cell.x, 1.0)))
	var ordinal := 0

	for group in groups:
		if not (group is Array) or group.is_empty():
			continue
		var anchor_index := int(group[0])
		var anchor_piece = board.pieces[anchor_index]
		var column := ordinal % columns
		var row := floori(float(ordinal) / float(columns))
		var anchor_position := Vector2(
			EDGE_PADDING + float(column) * cell.x,
			EDGE_PADDING + float(row) * cell.y
		)
		for value in group:
			var member_index := int(value)
			var member = board.pieces[member_index]
			positions[member_index] = (
				anchor_position
				+ (Vector2(member.target_position) - Vector2(anchor_piece.target_position))
				* scale_factor
			)
		ordinal += 1


func _groups_in_display_order() -> Array:
	var groups: Array = []
	var seen: Dictionary = {}
	if board == null:
		return groups
	for value in member_indexes:
		var piece_index := int(value)
		var cluster_id := int(board.cluster_for_piece.get(piece_index, piece_index))
		if seen.has(cluster_id):
			continue
		seen[cluster_id] = true
		var raw_members = board.cluster_members.get(cluster_id, [piece_index])
		var group: Array = []
		if raw_members is Array:
			for member_value in raw_members:
				var member_index := int(member_value)
				if member_indexes.has(member_index):
					group.append(member_index)
		if not group.is_empty():
			groups.append(group)
	return groups


func _rebuild_visuals() -> void:
	_ensure_content_root()
	_clear_visuals()
	if board == null:
		return
	var scale_factor := visual_scale()
	for value in member_indexes:
		var piece_index := int(value)
		if piece_index < 0 or piece_index >= board.pieces.size():
			continue
		var source_piece = board.pieces[piece_index]
		if not is_instance_valid(source_piece):
			continue

		var holder := Node2D.new()
		holder.name = "RailPiece_%03d" % piece_index
		holder.position = _piece_position(piece_index)
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
		outline.default_color = Color(1.0, 1.0, 1.0, 0.58)
		outline.antialiased = true
		holder.add_child(outline)


func _piece_position(piece_index: int) -> Vector2:
	return Vector2(positions.get(piece_index, Vector2.ZERO))


func _translate_group(members: Array, delta: Vector2) -> void:
	if delta.is_zero_approx():
		return
	for value in members:
		var piece_index := int(value)
		positions[piece_index] = _piece_position(piece_index) + delta


func _raise_group(members: Array) -> void:
	z_counter += 1
	for value in members:
		piece_z[int(value)] = z_counter
	_sync_visual_z()


func _clamp_group_inside(members: Array) -> void:
	if members.is_empty() or size.x <= 1.0 or size.y <= 1.0:
		return
	var bounds := _group_bounds(members)
	if bounds.size.x <= 0.0 or bounds.size.y <= 0.0:
		return
	var target := Vector2(
		clampf(
			bounds.position.x,
			EDGE_PADDING,
			maxf(EDGE_PADDING, size.x - EDGE_PADDING - bounds.size.x)
		),
		clampf(
			bounds.position.y,
			EDGE_PADDING,
			maxf(EDGE_PADDING, size.y - EDGE_PADDING - bounds.size.y)
		)
	)
	_translate_group(members, target - bounds.position)


func _group_bounds(members: Array) -> Rect2:
	var result := Rect2()
	var has_bounds := false
	var scale_factor := visual_scale()
	for value in members:
		var piece_index := int(value)
		if not positions.has(piece_index):
			continue
		var piece = board.pieces[piece_index]
		var piece_rect := Rect2(
			_piece_position(piece_index),
			Vector2(piece.piece_size) * scale_factor
		)
		if not has_bounds:
			result = piece_rect
			has_bounds = true
		else:
			result = result.merge(piece_rect)
	return result


func _sync_visual_positions() -> void:
	for piece_index in visual_nodes.keys():
		var node = visual_nodes[piece_index]
		if is_instance_valid(node):
			node.position = _piece_position(int(piece_index))
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


func _local_to_screen(local_position: Vector2) -> Vector2:
	return get_global_rect().position + local_position
