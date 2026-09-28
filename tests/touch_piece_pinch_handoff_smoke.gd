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
	if board.pieces.size() < 2:
		_fail("two-piece gesture fixture unavailable")
		return

	var first = board.pieces[0]
	var second = board.pieces[1]
	for piece in board.pieces:
		piece.visible = piece == first or piece == second

	if first.solved or second.solved:
		_fail("gesture fixture contains solved piece")
		return

	# Keep the two pieces well separated and away from snap targets.
	first.position = Vector2(760.0, 660.0)
	second.position = Vector2(1120.0, 660.0)
	await process_frame

	var first_center := _piece_screen_center(first)
	var second_center := _piece_screen_center(second)
	var camera_before := Vector2(camera.global_position)

	# First finger: normal piece drag must still win and move only the piece.
	var first_press := InputEventScreenTouch.new()
	first_press.index = 70
	first_press.position = first_center
	first_press.pressed = true
	camera._handle_screen_touch(first_press)
	if not first.dragging or int(first.drag_pointer_id) != 70:
		_fail("first finger did not start a piece drag")
		return
	if camera.touch_points.has(70):
		_fail("piece-owned first finger leaked into camera tracking")
		return

	var first_piece_before := Vector2(first.global_position)
	var first_drag := InputEventScreenDrag.new()
	first_drag.index = 70
	first_drag.position = first_center + Vector2(32.0, 0.0)
	first_drag.relative = Vector2(32.0, 0.0)
	first._input(first_drag)
	if Vector2(first.global_position).is_equal_approx(first_piece_before):
		_fail("single-finger piece drag did not move the piece")
		return
	if not Vector2(camera.global_position).is_equal_approx(camera_before):
		_fail("single-finger piece drag moved the camera")
		return

	var first_after_single_drag := Vector2(first.global_position)
	var second_before_pinch := Vector2(second.global_position)

	# Second finger: immediately transfer ownership to camera pinch. It may land
	# directly on another piece; that second piece must never begin dragging.
	var second_press := InputEventScreenTouch.new()
	second_press.index = 71
	second_press.position = second_center
	second_press.pressed = true
	camera._handle_screen_touch(second_press)

	if first.dragging:
		_fail("first piece kept dragging after second finger arrived")
		return
	if second.dragging:
		_fail("second piece began dragging instead of camera pinch")
		return
	if not camera.touch_points.has(70) or not camera.touch_points.has(71):
		_fail("pinch handoff did not seed both physical touch IDs")
		return
	if first.solved or second.solved:
		_fail("pinch handoff triggered an unintended snap/solve")
		return

	var zoom_before := float(camera.zoom.x)
	var second_pinch_drag := InputEventScreenDrag.new()
	second_pinch_drag.index = 71
	second_pinch_drag.position = second_center + Vector2(56.0, 0.0)
	second_pinch_drag.relative = Vector2(56.0, 0.0)
	camera._handle_screen_drag(second_pinch_drag)

	if is_equal_approx(float(camera.zoom.x), zoom_before):
		_fail("two-finger gesture over pieces did not zoom the camera")
		return
	if not Vector2(first.global_position).is_equal_approx(first_after_single_drag):
		_fail("first piece continued moving during pinch")
		return
	if not Vector2(second.global_position).is_equal_approx(second_before_pinch):
		_fail("second piece moved during pinch")
		return

	# Release and verify the next single-finger piece drag still works normally.
	var release_first := InputEventScreenTouch.new()
	release_first.index = 70
	release_first.position = first_drag.position
	release_first.pressed = false
	camera._input(release_first)
	camera._handle_screen_touch(release_first)

	var release_second := InputEventScreenTouch.new()
	release_second.index = 71
	release_second.position = second_pinch_drag.position
	release_second.pressed = false
	camera._input(release_second)
	camera._handle_screen_touch(release_second)

	if not camera.touch_points.is_empty():
		_fail("pinch release left camera touch state behind")
		return

	await process_frame
	var fresh_center := _piece_screen_center(first)
	var fresh_press := InputEventScreenTouch.new()
	fresh_press.index = 72
	fresh_press.position = fresh_center
	fresh_press.pressed = true
	camera._handle_screen_touch(fresh_press)
	if not first.dragging or int(first.drag_pointer_id) != 72:
		_fail("piece drag did not recover after pinch handoff")
		return

	first._finish_drag(fresh_center)
	main.queue_free()
	await process_frame
	print("PASS touch_piece_pinch_handoff_smoke")
	quit(0)


func _piece_screen_center(piece) -> Vector2:
	var bounds := Rect2(piece.polygon_points[0], Vector2.ZERO)
	for point in piece.polygon_points:
		bounds = bounds.expand(point)
	var world: Vector2 = piece.to_global(bounds.get_center())
	return piece.get_viewport().get_canvas_transform() * world


func _fail(message: String) -> void:
	push_error("FAIL touch_piece_pinch_handoff_smoke: %s" % message)
	quit(1)
