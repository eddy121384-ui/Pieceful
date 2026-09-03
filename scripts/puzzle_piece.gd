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

	# Runtime assembly never asks PhysicsServer for Area2D↔Area2D overlaps.
	# The collision polygon exists only so the viewport can pick the visible piece.
	# Disable monitoring before adding the shape so moving a cluster across a pile
	# does not create broadphase overlap bookkeeping for every crossed piece pair.
	monitoring = false
	monitorable = false
	collision_layer = 1
	collision_mask = 0

	polygon_points = p_outline
	uv_points = _build_uvs()
	_build_visuals()
	input_pickable = true

	# Area2D picking still delivers _input_event(), so idle pieces do not need to
	# receive every viewport input event. Enable _input() only while this specific
	# piece owns an active drag; this keeps mouse/touch motion cost independent of
	# the total loose-piece count instead of dispatching through every piece.
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

	# A solved piece is seated on the puzzle board rather than floating above it.
	# Keeping its per-piece drop shadow visible lets the offset shadow of one solved
	# neighbor leak across another solved face, creating intermittent dark seams.
	# Loose pieces and off-board clusters keep their shadows; only anchored pieces
	# become visually flat with the completed image.
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
	# This callback is enabled only for the currently dragged piece. Idle pieces
	# never enter this hot path.
	if not dragging:
		return

	if drag_pointer_id == -1:
		if event is InputEventMouseMotion:
			if (event.button_mask & MOUSE_BUTTON_MASK_LEFT) != 0:
				_move_drag_to_screen(event.position)
				get_viewport().set_input_as_handled()
		elif event is InputEventMouseButton:
			if event.button_index == MOUSE_BUTTON_LEFT and not event.pressed:
				_finish_drag()
	else:
		if event is InputEventScreenDrag and event.index == drag_pointer_id:
			_move_drag_to_screen(event.position)
			get_viewport().set_input_as_handled()
		elif event is InputEventScreenTouch:
			if event.index == drag_pointer_id and not event.pressed:
				_finish_drag()


func _begin_drag(pointer_id: int, pointer_screen_position: Vector2) -> void:
	if dragging or solved:
		return

	dragging = true
	drag_pointer_id = pointer_id
	drag_offset = _screen_to_world(pointer_screen_position) - global_position
	set_process_input(true)
	picked.emit(self)
	get_viewport().set_input_as_handled()


func _move_drag_to_screen(pointer_screen_position: Vector2) -> void:
	var next_position := _screen_to_world(pointer_screen_position) - drag_offset
	var delta := next_position - global_position
	if delta.is_zero_approx():
		return

	global_position = next_position
	dragged.emit(self, delta)


func _finish_drag() -> void:
	if not dragging:
		return

	dragging = false
	drag_pointer_id = -999
	set_process_input(false)
	released.emit(self)
	get_viewport().set_input_as_handled()


func _screen_to_world(screen_position: Vector2) -> Vector2:
	# InputEvent positions are viewport-space. Once Camera2D zoom/pan is active,
	# writing those coordinates directly into global_position makes pieces jump.
	# Convert through the live canvas transform so dragging stays exact at every
	# camera scale and offset.
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
