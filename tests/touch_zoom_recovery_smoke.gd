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

	# Keep the probe away from piece-claiming behavior. We want to exercise the
	# camera's touch lifecycle only.
	for piece in board.pieces:
		piece.visible = false

	camera.set_content_rect(Rect2(Vector2.ZERO, Vector2(2400.0, 1600.0)), false)
	camera.zoom = Vector2.ONE
	camera.global_position = Vector2(1200.0, 800.0)

	# Repeated pinch cycles must continue to work when releases are observed only
	# by the global _input cleanup path (the case _unhandled_input can miss).
	for cycle in range(6):
		var a_id := 100 + cycle * 2
		var b_id := a_id + 1
		var a := InputEventScreenTouch.new()
		a.index = a_id
		a.position = Vector2(520.0, 360.0)
		a.pressed = true
		camera._handle_screen_touch(a)

		var b := InputEventScreenTouch.new()
		b.index = b_id
		b.position = Vector2(720.0, 360.0)
		b.pressed = true
		camera._handle_screen_touch(b)

		var before := float(camera.zoom.x)
		var drag := InputEventScreenDrag.new()
		drag.index = b_id
		drag.position = Vector2(760.0 + cycle * 2.0, 360.0)
		drag.relative = Vector2(40.0 + cycle * 2.0, 0.0)
		camera._handle_screen_drag(drag)
		if is_equal_approx(float(camera.zoom.x), before):
			_fail("pinch cycle %d did not change zoom" % cycle)
			return

		var release_a := InputEventScreenTouch.new()
		release_a.index = a_id
		release_a.position = a.position
		release_a.pressed = false
		camera._input(release_a)

		var release_b := InputEventScreenTouch.new()
		release_b.index = b_id
		release_b.position = drag.position
		release_b.pressed = false
		camera._input(release_b)

		if not camera.touch_points.is_empty():
			_fail("global release cleanup left touch state after cycle %d" % cycle)
			return

	# Simulate Safari/Web losing both releases completely. Fresh presses must win
	# pinch pairing over those stale IDs.
	var ghost_a := InputEventScreenTouch.new()
	ghost_a.index = 900
	ghost_a.position = Vector2(120.0, 120.0)
	ghost_a.pressed = true
	camera._handle_screen_touch(ghost_a)

	var ghost_b := InputEventScreenTouch.new()
	ghost_b.index = 901
	ghost_b.position = Vector2(160.0, 120.0)
	ghost_b.pressed = true
	camera._handle_screen_touch(ghost_b)

	var fresh_a := InputEventScreenTouch.new()
	fresh_a.index = 902
	fresh_a.position = Vector2(500.0, 360.0)
	fresh_a.pressed = true
	camera._handle_screen_touch(fresh_a)

	var fresh_b := InputEventScreenTouch.new()
	fresh_b.index = 903
	fresh_b.position = Vector2(700.0, 360.0)
	fresh_b.pressed = true
	camera._handle_screen_touch(fresh_b)

	var ghost_recovery_before := float(camera.zoom.x)
	var fresh_drag := InputEventScreenDrag.new()
	fresh_drag.index = 903
	fresh_drag.position = Vector2(750.0, 360.0)
	fresh_drag.relative = Vector2(50.0, 0.0)
	camera._handle_screen_drag(fresh_drag)

	if is_equal_approx(float(camera.zoom.x), ghost_recovery_before):
		_fail("fresh pinch could not recover from stale ghost touch IDs")
		return

	# Explicit cancellation must also remove recency metadata.
	camera.cancel_pointer(900)
	camera.cancel_pointer(901)
	camera.cancel_pointer(902)
	camera.cancel_pointer(903)
	if not camera.touch_points.is_empty():
		_fail("cancel_pointer did not clear all tracked touches")
		return
	if not camera.touch_press_sequence.is_empty():
		_fail("cancel_pointer left touch press metadata behind")
		return

	main.queue_free()
	await process_frame
	print("PASS touch_zoom_recovery_smoke")
	quit(0)


func _fail(message: String) -> void:
	push_error("FAIL touch_zoom_recovery_smoke: %s" % message)
	quit(1)
