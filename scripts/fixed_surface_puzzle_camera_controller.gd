class_name FixedSurfacePuzzleCameraController
extends "res://scripts/puzzle_camera_controller.gd"

const FIXED_SURFACE_SIZE := Vector2(720.0, 720.0)

var virtual_viewport_size := FIXED_SURFACE_SIZE
var logical_zoom_scale := 1.0


func set_virtual_viewport_size(next_size: Vector2) -> void:
	if next_size.x <= 1.0 or next_size.y <= 1.0:
		return
	virtual_viewport_size = next_size
	_apply_render_zoom()
	_clamp_camera_position()


func logical_zoom() -> float:
	return logical_zoom_scale


func surface_scale() -> Vector2:
	return Vector2(
		FIXED_SURFACE_SIZE.x / maxf(virtual_viewport_size.x, 1.0),
		FIXED_SURFACE_SIZE.y / maxf(virtual_viewport_size.y, 1.0)
	)


func fit_to_content() -> void:
	if virtual_viewport_size.x <= 0.001 or virtual_viewport_size.y <= 0.001:
		return
	var fit_scale := minf(
		virtual_viewport_size.x / content_rect.size.x,
		virtual_viewport_size.y / content_rect.size.y
	)
	logical_zoom_scale = clampf(fit_scale, MIN_ZOOM, MAX_ZOOM)
	_apply_render_zoom()
	global_position = content_rect.get_center()
	_clamp_camera_position()
	zoom_changed.emit(logical_zoom_scale)


func zoom_step(direction: int) -> void:
	if direction == 0:
		return
	var factor := WHEEL_ZOOM_FACTOR if direction > 0 else 1.0 / WHEEL_ZOOM_FACTOR
	zoom_at_screen(FIXED_SURFACE_SIZE * 0.5, factor)


func zoom_at_screen(screen_position: Vector2, factor: float) -> void:
	var old_scale := logical_zoom_scale
	var new_scale := clampf(old_scale * factor, MIN_ZOOM, MAX_ZOOM)
	if is_equal_approx(old_scale, new_scale):
		return

	var virtual_position := _surface_to_virtual(screen_position)
	var virtual_center := virtual_viewport_size * 0.5
	var virtual_offset := virtual_position - virtual_center
	var world_anchor := global_position + virtual_offset / maxf(old_scale, 0.0001)

	logical_zoom_scale = new_scale
	_apply_render_zoom()
	global_position = world_anchor - virtual_offset / maxf(new_scale, 0.0001)
	_clamp_camera_position()
	zoom_changed.emit(logical_zoom_scale)


func pan_by_screen_delta(screen_delta: Vector2) -> void:
	if screen_delta.is_zero_approx():
		return
	var scale := surface_scale()
	var virtual_delta := Vector2(
		screen_delta.x / maxf(scale.x, 0.0001),
		screen_delta.y / maxf(scale.y, 0.0001)
	)
	global_position -= virtual_delta / maxf(logical_zoom_scale, 0.0001)
	_clamp_camera_position()


func _clamp_camera_position() -> void:
	var safe_zoom := maxf(logical_zoom_scale, 0.0001)
	var half_view := virtual_viewport_size / (safe_zoom * 2.0)
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
	# The root render surface is intentionally fixed. Physical-window aspect is
	# observed by Main and supplied through set_virtual_viewport_size().
	_clamp_camera_position()


func _apply_render_zoom() -> void:
	var scale := surface_scale()
	zoom = Vector2(
		logical_zoom_scale * scale.x,
		logical_zoom_scale * scale.y
	)


func _surface_to_virtual(surface_position: Vector2) -> Vector2:
	var scale := surface_scale()
	return Vector2(
		surface_position.x / maxf(scale.x, 0.0001),
		surface_position.y / maxf(scale.y, 0.0001)
	)
