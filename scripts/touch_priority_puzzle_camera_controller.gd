class_name TouchPriorityPuzzleCameraController
extends "res://scripts/puzzle_camera_controller.gd"

const SINGLE_TOUCH_PAN_SLOP_PX := 28.0

var touch_pan_start := Vector2.ZERO
var single_touch_pan_committed := false


func cancel_pointer(pointer_id: int) -> void:
	# iOS/Web can emit an emulated mouse press for the same finger while
	# pointing/emulate_mouse_from_touch is enabled. If a piece is claimed through
	# that mouse path it reports pointer -1; discard the sole provisional touch so
	# the camera cannot pan under the same finger.
	if pointer_id < 0:
		if touch_points.size() == 1:
			touch_points.clear()
			_reseed_touch_mode()
		return
	super.cancel_pointer(pointer_id)


func _handle_screen_touch(event: InputEventScreenTouch) -> void:
	if event.pressed:
		if _try_claim_piece_touch(event.index, event.position):
			get_viewport().set_input_as_handled()
			return
		touch_points[event.index] = event.position
		_reseed_touch_mode()
		return

	touch_points.erase(event.index)
	_reseed_touch_mode()


func _handle_screen_drag(event: InputEventScreenDrag) -> void:
	if not touch_points.has(event.index):
		return

	touch_points[event.index] = event.position

	if touch_points.size() >= 2:
		super._handle_screen_drag(event)
		return

	if touch_points.size() == 1 and event.index == pan_touch_id:
		if not single_touch_pan_committed:
			var travel := event.position.distance_to(touch_pan_start)
			var previous := touch_pan_last
			touch_pan_last = event.position
			if travel < SINGLE_TOUCH_PAN_SLOP_PX:
				return
			single_touch_pan_committed = true
			pan_by_screen_delta(event.position - previous)
			get_viewport().set_input_as_handled()
			return

		var delta := event.position - touch_pan_last
		touch_pan_last = event.position
		pan_by_screen_delta(delta)
		get_viewport().set_input_as_handled()


func _reseed_touch_mode() -> void:
	super._reseed_touch_mode()
	single_touch_pan_committed = false
	if touch_points.size() == 1 and pan_touch_id >= 0:
		touch_pan_start = Vector2(touch_points[pan_touch_id])
		touch_pan_last = touch_pan_start
	else:
		touch_pan_start = Vector2.ZERO


func _try_claim_piece_touch(pointer_id: int, screen_position: Vector2) -> bool:
	var board := get_parent().get_node_or_null("PuzzleBoard")
	if board == null or not board.has_method("try_begin_touch_piece_drag"):
		return false
	return bool(board.try_begin_touch_piece_drag(pointer_id, screen_position))
