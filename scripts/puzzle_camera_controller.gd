class_name PuzzleCameraController
extends Camera2D

signal zoom_changed(zoom_scale: float)

const MIN_ZOOM := 0.10
const MAX_ZOOM := 6.00
const WHEEL_ZOOM_FACTOR := 1.12

var content_rect := Rect2(Vector2.ZERO, Vector2(1280.0, 720.0))

var mouse_panning := false
var mouse_pan_button := MOUSE_BUTTON_NONE

var touch_points: Dictionary = {}
var pan_touch_id := -1
var touch_pan_last := Vector2.ZERO
var pinch_last_center := Vector2.ZERO
var pinch_last_distance := 0.0


func _ready() -> void:
	add_to_group("puzzle_camera_controller")
	enabled = true
	get_viewport().size_changed.connect(_on_viewport_size_changed)
	_clamp_camera_position()
	zoom_changed.emit(zoom.x)


func set_content_rect(rect: Rect2, fit_now: bool = false) -> void:
	content_rect = rect.abs()
	if content_rect.size.x <= 0.001 or content_rect.size.y <= 0.001:
		content_rect = Rect2(Vector2.ZERO, Vector2(1280.0, 720.0))

	if fit_now:
		fit_to_content()
	else:
		_clamp_camera_position()


func fit_to_content() -> void:
	var viewport_size := get_viewport_rect().size
	if viewport_size.x <= 0.001 or viewport_size.y <= 0.001:
		return

	var fit_scale := minf(
		viewport_size.x / content_rect.size.x,
		viewport_size.y / content_rect.size.y
	)
	fit_scale = clampf(fit_scale, MIN_ZOOM, MAX_ZOOM)
	zoom = Vector2.ONE * fit_scale
	global_position = content_rect.get_center()
	_clamp_camera_position()
	zoom_changed.emit(fit_scale)


func zoom_step(direction: int) -> void:
	if direction == 0:
		return
	var factor := WHEEL_ZOOM_FACTOR if direction > 0 else 1.0 / WHEEL_ZOOM_FACTOR
	zoom_at_screen(get_viewport_rect().size * 0.5, factor)


func zoom_at_screen(screen_position: Vector2, factor: float) -> void:
	var old_scale := zoom.x
	var new_scale := clampf(old_scale * factor, MIN_ZOOM, MAX_ZOOM)
	if is_equal_approx(old_scale, new_scale):
		return

	var viewport_center := get_viewport_rect().size * 0.5
	var screen_offset := screen_position - viewport_center
	var world_anchor := global_position + screen_offset / old_scale

	zoom = Vector2.ONE * new_scale
	global_position = world_anchor - screen_offset / new_scale
	_clamp_camera_position()
	zoom_changed.emit(new_scale)


func pan_by_screen_delta(screen_delta: Vector2) -> void:
	if screen_delta.is_zero_approx():
		return
	global_position -= screen_delta / maxf(zoom.x, 0.0001)
	_clamp_camera_position()


func cancel_pointer(pointer_id: int) -> void:
	# Mouse piece dragging uses the left button and never starts camera panning.
	# Touch presses reach _unhandled_input before physics picking, so a piece that
	# claims a pointer asks the camera to discard that provisional touch.
	if pointer_id < 0:
		return
	touch_points.erase(pointer_id)
	_reseed_touch_mode()


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		_handle_mouse_button(event)
	elif event is InputEventMouseMotion:
		_handle_mouse_motion(event)
	elif event is InputEventScreenTouch:
		_handle_screen_touch(event)
	elif event is InputEventScreenDrag:
		_handle_screen_drag(event)
	elif event is InputEventMagnifyGesture:
		zoom_at_screen(event.position, event.factor)
		get_viewport().set_input_as_handled()
	elif event is InputEventPanGesture:
		pan_by_screen_delta(event.delta)
		get_viewport().set_input_as_handled()


func _handle_mouse_button(event: InputEventMouseButton) -> void:
	if event.button_index == MOUSE_BUTTON_WHEEL_UP and event.pressed:
		zoom_at_screen(event.position, WHEEL_ZOOM_FACTOR)
		get_viewport().set_input_as_handled()
		return
	if event.button_index == MOUSE_BUTTON_WHEEL_DOWN and event.pressed:
		zoom_at_screen(event.position, 1.0 / WHEEL_ZOOM_FACTOR)
		get_viewport().set_input_as_handled()
		return

	if event.button_index != MOUSE_BUTTON_MIDDLE and event.button_index != MOUSE_BUTTON_RIGHT:
		return

	if event.pressed:
		mouse_panning = true
		mouse_pan_button = event.button_index
	else:
		mouse_panning = false
		mouse_pan_button = MOUSE_BUTTON_NONE
	get_viewport().set_input_as_handled()


func _handle_mouse_motion(event: InputEventMouseMotion) -> void:
	if not mouse_panning:
		return

	var expected_mask := (
		MOUSE_BUTTON_MASK_MIDDLE
		if mouse_pan_button == MOUSE_BUTTON_MIDDLE
		else MOUSE_BUTTON_MASK_RIGHT
	)
	if (event.button_mask & expected_mask) == 0:
		mouse_panning = false
		mouse_pan_button = MOUSE_BUTTON_NONE
		return

	pan_by_screen_delta(event.relative)
	get_viewport().set_input_as_handled()


func _handle_screen_touch(event: InputEventScreenTouch) -> void:
	if event.pressed:
		touch_points[event.index] = event.position
		_reseed_touch_mode()
		# Do not mark the initial press handled. Area2D physics picking still needs
		# the chance to claim this pointer for a puzzle-piece drag.
		return

	touch_points.erase(event.index)
	_reseed_touch_mode()


func _handle_screen_drag(event: InputEventScreenDrag) -> void:
	if not touch_points.has(event.index):
		return

	touch_points[event.index] = event.position

	if touch_points.size() >= 2:
		var pair := _first_two_touch_points()
		if pair.size() < 2:
			return
		var p0: Vector2 = pair[0]
		var p1: Vector2 = pair[1]
		var center := (p0 + p1) * 0.5
		var distance := p0.distance_to(p1)

		if pinch_last_distance > 0.001:
			pan_by_screen_delta(center - pinch_last_center)
			zoom_at_screen(center, distance / pinch_last_distance)

		pinch_last_center = center
		pinch_last_distance = distance
		get_viewport().set_input_as_handled()
		return

	if touch_points.size() == 1 and event.index == pan_touch_id:
		var delta := event.position - touch_pan_last
		touch_pan_last = event.position
		pan_by_screen_delta(delta)
		get_viewport().set_input_as_handled()


func _reseed_touch_mode() -> void:
	pinch_last_distance = 0.0

	if touch_points.size() >= 2:
		pan_touch_id = -1
		var pair := _first_two_touch_points()
		if pair.size() >= 2:
			var p0: Vector2 = pair[0]
			var p1: Vector2 = pair[1]
			pinch_last_center = (p0 + p1) * 0.5
			pinch_last_distance = p0.distance_to(p1)
		return

	if touch_points.size() == 1:
		var keys := touch_points.keys()
		pan_touch_id = int(keys[0])
		touch_pan_last = touch_points[pan_touch_id]
		return

	pan_touch_id = -1


func _first_two_touch_points() -> Array[Vector2]:
	var result: Array[Vector2] = []
	var keys := touch_points.keys()
	if keys.size() < 2:
		return result
	result.append(touch_points[keys[0]])
	result.append(touch_points[keys[1]])
	return result


func _clamp_camera_position() -> void:
	var viewport_size := get_viewport_rect().size
	var safe_zoom := maxf(zoom.x, 0.0001)
	var half_view := viewport_size / (safe_zoom * 2.0)
	var center := content_rect.get_center()
	var next_position := global_position

	if content_rect.size.x <= half_view.x * 2.0:
		next_position.x = center.x
	else:
		next_position.x = clampf(
			next_position.x,
			content_rect.position.x + half_view.x,
			content_rect.end.x - half_view.x
		)

	if content_rect.size.y <= half_view.y * 2.0:
		next_position.y = center.y
	else:
		next_position.y = clampf(
			next_position.y,
			content_rect.position.y + half_view.y,
			content_rect.end.y - half_view.y
		)

	global_position = next_position


func _on_viewport_size_changed() -> void:
	_clamp_camera_position()
