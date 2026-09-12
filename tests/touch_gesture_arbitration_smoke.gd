extends SceneTree

const MainScene = preload("res://main.tscn")


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	var main = MainScene.instantiate()
	root.add_child(main)
	for _frame in range(28):
		await process_frame

	var board = main.get_node_or_null("PuzzleBoard")
	var camera = main.get_node_or_null("PuzzleCamera")
	if board == null or camera == null:
		_fail("workspace nodes missing")
		return
	if not board.has_method("try_begin_touch_piece_drag"):
		_fail("touch-priority board adapter is not wired")
		return
	if not camera.has_method("_try_claim_piece_touch"):
		_fail("touch-priority camera adapter is not wired")
		return
	if board.pieces.is_empty():
		_fail("no runtime pieces available")
		return

	# Isolate one loose piece so a finger-friendly padded hit can be tested without
	# overlap ambiguity. The probe is outside the actual polygon/bounds but within
	# the 28 screen-pixel touch envelope.
	var target = board.pieces[0]
	for piece in board.pieces:
		piece.visible = piece == target
	if target.solved or target.polygon_points.is_empty():
		_fail("touch fixture piece is not draggable")
		return

	var bounds := Rect2(target.polygon_points[0], Vector2.ZERO)
	for point in target.polygon_points:
		bounds = bounds.expand(point)
	var zoom_scale := maxf(float(camera.zoom.x), 0.01)
	var padding_world := 28.0 / zoom_scale
	var local_probe := Vector2(bounds.end.x + padding_world * 0.45, bounds.get_center().y)
	if Geometry2D.is_point_in_polygon(local_probe, target.polygon_points):
		_fail("padded touch probe unexpectedly landed inside exact polygon")
		return
	var probe_world: Vector2 = target.to_global(local_probe)
	var probe_screen: Vector2 = get_viewport().get_canvas_transform() * probe_world
	if not bool(board.try_begin_touch_piece_drag(3, probe_screen)):
		_fail("finger-friendly padded hit did not claim the puzzle piece")
		return
	if not target.dragging or int(target.drag_pointer_id) != 3:
		_fail("padded touch claim did not start a real piece drag")
		return
	target._finish_drag(probe_screen)
	await process_frame

	# A real touch that starts on artwork must be claimed before the camera ever
	# registers it as a one-finger pan candidate.
	if target.solved:
		_fail("touch fixture unexpectedly solved after padded-hit release")
		return
	var center_world: Vector2 = target.to_global(bounds.get_center())
	var center_screen: Vector2 = get_viewport().get_canvas_transform() * center_world
	var piece_touch := InputEventScreenTouch.new()
	piece_touch.index = 4
	piece_touch.position = center_screen
	piece_touch.pressed = true
	camera._handle_screen_touch(piece_touch)
	if not target.dragging or int(target.drag_pointer_id) != 4:
		_fail("camera did not yield a direct artwork touch to the piece")
		return
	if camera.touch_points.has(4):
		_fail("piece-owned touch leaked into camera pan tracking")
		return
	target._finish_drag(center_screen)
	await process_frame

	# iOS/Web can synthesize a mouse press from the same finger. A mouse-owned
	# piece drag reports pointer -1, so cancel_pointer(-1) must clear the sole
	# provisional touch instead of letting the camera move underneath the piece.
	for piece in board.pieces:
		piece.visible = false
	var empty_touch := InputEventScreenTouch.new()
	empty_touch.index = 9
	empty_touch.position = Vector2(60.0, 60.0)
	empty_touch.pressed = true
	camera._handle_screen_touch(empty_touch)
	if not camera.touch_points.has(9):
		_fail("empty-space touch was not registered as a pan candidate")
		return
	camera.cancel_pointer(-1)
	if not camera.touch_points.is_empty():
		_fail("emulated-mouse piece claim left provisional touch in camera")
		return

	# Empty-space single-finger pan needs deliberate intent. Small finger jitter
	# should leave the workspace fixed; crossing the slop commits normal panning.
	camera.set_content_rect(Rect2(Vector2.ZERO, Vector2(2200.0, 1400.0)), false)
	camera.zoom = Vector2.ONE
	camera.global_position = Vector2(1100.0, 700.0)
	var pan_start_position := Vector2(camera.global_position)
	var pan_press := InputEventScreenTouch.new()
	pan_press.index = 10
	pan_press.position = Vector2(640.0, 360.0)
	pan_press.pressed = true
	camera._handle_screen_touch(pan_press)

	var jitter := InputEventScreenDrag.new()
	jitter.index = 10
	jitter.position = Vector2(650.0, 365.0)
	jitter.relative = Vector2(10.0, 5.0)
	camera._handle_screen_drag(jitter)
	if not Vector2(camera.global_position).is_equal_approx(pan_start_position):
		_fail("sub-threshold finger jitter moved the workspace")
		return

	var deliberate_pan := InputEventScreenDrag.new()
	deliberate_pan.index = 10
	deliberate_pan.position = Vector2(690.0, 365.0)
	deliberate_pan.relative = Vector2(40.0, 0.0)
	camera._handle_screen_drag(deliberate_pan)
	if Vector2(camera.global_position).is_equal_approx(pan_start_position):
		_fail("deliberate empty-space drag did not pan after intent threshold")
		return

	var pan_release := InputEventScreenTouch.new()
	pan_release.index = 10
	pan_release.position = deliberate_pan.position
	pan_release.pressed = false
	camera._handle_screen_touch(pan_release)

	# Two-finger pinch/pan remains immediate and bypasses the one-finger slop.
	camera.global_position = Vector2(1100.0, 700.0)
	camera.zoom = Vector2.ONE
	var pinch_a := InputEventScreenTouch.new()
	pinch_a.index = 20
	pinch_a.position = Vector2(520.0, 360.0)
	pinch_a.pressed = true
	camera._handle_screen_touch(pinch_a)
	var pinch_b := InputEventScreenTouch.new()
	pinch_b.index = 21
	pinch_b.position = Vector2(720.0, 360.0)
	pinch_b.pressed = true
	camera._handle_screen_touch(pinch_b)
	var zoom_before := float(camera.zoom.x)
	var pinch_drag := InputEventScreenDrag.new()
	pinch_drag.index = 21
	pinch_drag.position = Vector2(760.0, 360.0)
	pinch_drag.relative = Vector2(40.0, 0.0)
	camera._handle_screen_drag(pinch_drag)
	if is_equal_approx(float(camera.zoom.x), zoom_before):
		_fail("two-finger pinch stopped working after touch arbitration")
		return

	main.queue_free()
	await process_frame
	print("PASS touch_gesture_arbitration_smoke")
	quit(0)


func _fail(message: String) -> void:
	push_error("FAIL touch_gesture_arbitration_smoke: %s" % message)
	quit(1)
