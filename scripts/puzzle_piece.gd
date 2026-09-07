class_name PuzzlePiece
extends Area2D

signal released(piece)
signal picked(piece)
signal dragged(piece, delta: Vector2)

var piece_index: int = -1
var target_position: Vector2
var piece_size: Vector2
var source_origin: Vector2
var source_cell_size: Vector2
var source_texture: Texture2D

var solved := false
var dragging := false
var drag_pointer_id := -999
var drag_offset := Vector2.ZERO
var last_pointer_screen_position := Vector2.ZERO

var polygon_points := PackedVector2Array()
var uv_points := PackedVector2Array()


func configure(
	p_index: int,
	p_texture: Texture2D,
	p_target_position: Vector2,
	p_piece_size: Vector2,
	p_source_origin: Vector2,
	p_source_cell_size: Vector2,
	p_outline: PackedVector2Array,
	p_start_position: Vector2
) -> void:
	piece_index = p_index
	source_texture = p_texture
	target_position = p_target_position
	piece_size = p_piece_size
	source_origin = p_source_origin
	source_cell_size = p_source_cell_size
	position = p_start_position
	last_pointer_screen_position = Vector2.ZERO

	# Runtime assembly never asks PhysicsServer for Area2D↔Area2D overlaps.
	# The collision polygon exists only so the viewport can pick the visible piece.
	monitoring = false
	monitorable = false
	collision_layer = 1
	collision_mask = 0

	polygon_points = p_outline
	uv_points = _build_uvs()
	_build_visuals()
	input_pickable = true
	set_process_input(false)


func snap_to_target() -> void:
	if solved:
		return

	solved = true
	dragging = false
	drag_pointer_id = -999
	set_process_input(false)
	input_pickable = false
	z_index = 1

	var shadow := get_node_or_null("Shadow")
	if shadow != null:
		shadow.visible = false

	var tween := create_tween()
	tween.set_trans(Tween.TRANS_QUAD)
	tween.set_ease(Tween.EASE_OUT)
	tween.tween_property(self, "position", target_position, 0.12)


func _input_event(_viewport: Node, event: InputEvent, _shape_idx: int) -> void:
	if solved:
		return

	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
			_begin_drag(-1, event.position)
	elif event is InputEventScreenTouch:
		if event.pressed:
			_begin_drag(event.index, event.position)


func _input(event: InputEvent) -> void:
	if not dragging:
		return

	if drag_pointer_id == -1:
		if event is InputEventMouseMotion:
			if (event.button_mask & MOUSE_BUTTON_MASK_LEFT) != 0:
				_move_drag_to_screen(event.position)
				get_viewport().set_input_as_handled()
		elif event is InputEventMouseButton:
			if event.button_index == MOUSE_BUTTON_LEFT and not event.pressed:
				_finish_drag(event.position)
	else:
		if event is InputEventScreenDrag and event.index == drag_pointer_id:
			_move_drag_to_screen(event.position)
			get_viewport().set_input_as_handled()
		elif event is InputEventScreenTouch:
			if event.index == drag_pointer_id and not event.pressed:
				_finish_drag(event.position)


func _begin_drag(pointer_id: int, pointer_screen_position: Vector2) -> void:
	if dragging or solved:
		return

	var board := get_parent()
	if board != null and board.has_method("can_begin_piece_drag"):
		if not board.can_begin_piece_drag(self, pointer_screen_position):
			return

	dragging = true
	drag_pointer_id = pointer_id
	last_pointer_screen_position = pointer_screen_position
	drag_offset = _screen_to_world(pointer_screen_position) - global_position
	set_process_input(true)
	picked.emit(self)
	get_viewport().set_input_as_handled()


func _move_drag_to_screen(pointer_screen_position: Vector2) -> void:
	last_pointer_screen_position = pointer_screen_position
	var next_position := _screen_to_world(pointer_screen_position) - drag_offset
	var delta := next_position - global_position
	if delta.is_zero_approx():
		return

	global_position = next_position
	dragged.emit(self, delta)


func _finish_drag(pointer_screen_position: Vector2) -> void:
	if not dragging:
		return

	last_pointer_screen_position = pointer_screen_position
	dragging = false
	drag_pointer_id = -999
	set_process_input(false)
	released.emit(self)
	get_viewport().set_input_as_handled()


func _screen_to_world(screen_position: Vector2) -> Vector2:
	return get_viewport().get_canvas_transform().affine_inverse() * screen_position


func _build_visuals() -> void:
	var shadow := Polygon2D.new()
	shadow.name = "Shadow"
	shadow.polygon = polygon_points
	shadow.color = Color(0.0, 0.0, 0.0, 0.26)
	shadow.position = Vector2(4.0, 6.0)
	shadow.z_index = -1
	add_child(shadow)

	var face := Polygon2D.new()
	face.name = "Face"
	face.polygon = polygon_points
	face.uv = uv_points
	face.texture = source_texture
	face.color = Color.WHITE
	add_child(face)

	var outline := Line2D.new()
	outline.name = "Outline"
	var outline_points := polygon_points.duplicate()
	outline_points.append(polygon_points[0])
	outline.points = outline_points
	outline.width = 1.35
	outline.default_color = Color(1.0, 1.0, 1.0, 0.66)
	outline.antialiased = true
	add_child(outline)

	var collision := CollisionPolygon2D.new()
	collision.name = "HitArea"
	collision.polygon = _pick_bounds_polygon()
	add_child(collision)


func _pick_bounds_polygon() -> PackedVector2Array:
	if polygon_points.is_empty():
		return PackedVector2Array()

	var bounds := Rect2(polygon_points[0], Vector2.ZERO)
	for point in polygon_points:
		bounds = bounds.expand(point)

	return PackedVector2Array([
		bounds.position,
		Vector2(bounds.end.x, bounds.position.y),
		bounds.end,
		Vector2(bounds.position.x, bounds.end.y),
	])


func _build_uvs() -> PackedVector2Array:
	var result := PackedVector2Array()
	var display_to_source := Vector2(
		source_cell_size.x / piece_size.x,
		source_cell_size.y / piece_size.y
	)

	for point in polygon_points:
		result.append(source_origin + point * display_to_source)

	return result