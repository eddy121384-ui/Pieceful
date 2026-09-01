class_name PuzzlePiece
extends Area2D

signal released(piece)
signal picked(piece)

var piece_index: int = -1
var target_position: Vector2
var piece_size: Vector2
var source_origin: Vector2
var source_cell_size: Vector2
var source_texture: Texture2D
var edge_data: Dictionary

var solved := false
var dragging := false
var drag_pointer_id := -999
var drag_offset := Vector2.ZERO

var polygon_points := PackedVector2Array()
var uv_points := PackedVector2Array()


func configure(
	p_index: int,
	p_texture: Texture2D,
	p_target_position: Vector2,
	p_piece_size: Vector2,
	p_source_origin: Vector2,
	p_source_cell_size: Vector2,
	p_edges: Dictionary,
	p_start_position: Vector2
) -> void:
	piece_index = p_index
	source_texture = p_texture
	target_position = p_target_position
	piece_size = p_piece_size
	source_origin = p_source_origin
	source_cell_size = p_source_cell_size
	edge_data = p_edges
	position = p_start_position

	polygon_points = _build_outline()
	uv_points = _build_uvs()
	_build_visuals()
	input_pickable = true


func snap_to_target() -> void:
	if solved:
		return

	solved = true
	dragging = false
	input_pickable = false
	z_index = 1

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
				global_position = event.position - drag_offset
				get_viewport().set_input_as_handled()
		elif event is InputEventMouseButton:
			if event.button_index == MOUSE_BUTTON_LEFT and not event.pressed:
				_finish_drag()
	else:
		if event is InputEventScreenDrag and event.index == drag_pointer_id:
			global_position = event.position - drag_offset
			get_viewport().set_input_as_handled()
		elif event is InputEventScreenTouch:
			if event.index == drag_pointer_id and not event.pressed:
				_finish_drag()


func _begin_drag(pointer_id: int, pointer_position: Vector2) -> void:
	if dragging or solved:
		return

	dragging = true
	drag_pointer_id = pointer_id
	drag_offset = pointer_position - global_position
	picked.emit(self)
	get_viewport().set_input_as_handled()


func _finish_drag() -> void:
	if not dragging:
		return

	dragging = false
	drag_pointer_id = -999
	released.emit(self)
	get_viewport().set_input_as_handled()


func _build_visuals() -> void:
	var shadow := Polygon2D.new()
	shadow.name = "Shadow"
	shadow.polygon = polygon_points
	shadow.color = Color(0.0, 0.0, 0.0, 0.28)
	shadow.position = Vector2(5.0, 7.0)
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
	outline.width = 2.0
	outline.default_color = Color(1.0, 1.0, 1.0, 0.78)
	outline.antialiased = true
	add_child(outline)

	var collision := CollisionPolygon2D.new()
	collision.name = "HitArea"
	collision.polygon = polygon_points
	add_child(collision)


func _build_uvs() -> PackedVector2Array:
	var result := PackedVector2Array()
	var display_to_source := Vector2(
		source_cell_size.x / piece_size.x,
		source_cell_size.y / piece_size.y
	)

	for point in polygon_points:
		result.append(source_origin + point * display_to_source)

	return result


func _build_outline() -> PackedVector2Array:
	var result := PackedVector2Array()
	var amplitude: float = minf(piece_size.x, piece_size.y) * 0.20

	var top_left := Vector2.ZERO
	var top_right := Vector2(piece_size.x, 0.0)
	var bottom_right := piece_size
	var bottom_left := Vector2(0.0, piece_size.y)

	result.append(top_left)
	result.append_array(_edge_points(
		top_left,
		top_right,
		Vector2.UP,
		int(edge_data["top"]),
		amplitude
	))
	result.append_array(_edge_points(
		top_right,
		bottom_right,
		Vector2.RIGHT,
		int(edge_data["right"]),
		amplitude
	))
	result.append_array(_edge_points(
		bottom_right,
		bottom_left,
		Vector2.DOWN,
		int(edge_data["bottom"]),
		amplitude
	))
	result.append_array(_edge_points(
		bottom_left,
		top_left,
		Vector2.LEFT,
		int(edge_data["left"]),
		amplitude
	))

	return result


func _edge_points(
	start: Vector2,
	finish: Vector2,
	outward: Vector2,
	edge_value: int,
	amplitude: float
) -> PackedVector2Array:
	var result := PackedVector2Array()

	if edge_value == 0:
		result.append(finish)
		return result

	var delta := finish - start
	var normal := outward * float(edge_value)

	result.append(start + delta * 0.30)
	result.append(start + delta * 0.36)
	result.append(start + delta * 0.40 + normal * amplitude * 0.32)
	result.append(start + delta * 0.44 + normal * amplitude * 0.78)
	result.append(start + delta * 0.50 + normal * amplitude)
	result.append(start + delta * 0.56 + normal * amplitude * 0.78)
	result.append(start + delta * 0.60 + normal * amplitude * 0.32)
	result.append(start + delta * 0.64)
	result.append(start + delta * 0.70)
	result.append(finish)

	return result
