extends SceneTree

var profile_board = null
var callback_hide_count := 0

func _initialize() -> void:
	call_deferred("_run")

func _ms(start_usec: int) -> float:
	return float(Time.get_ticks_usec() - start_usec) / 1000.0

func _fail(message: String, code: int) -> void:
	push_error(message)
	quit(code)

func _count_canvas_items(root: Node) -> int:
	var total := 1 if root is CanvasItem else 0
	for child in root.get_children():
		total += _count_canvas_items(child)
	return total

func _hide_board_on_window_resize() -> void:
	if profile_board != null and is_instance_valid(profile_board):
		profile_board.visible = false
		callback_hide_count += 1

func _run() -> void:
	var packed := load("res://main.tscn") as PackedScene
	if packed == null:
		_fail("Hard orientation freeze profile: main.tscn failed to load", 170)
		return

	var window := get_root().get_window()
	window.size = Vector2i(1280, 720)
	await process_frame

	var scene = packed.instantiate()
	get_root().add_child(scene)
	await create_timer(0.45).timeout
	var board = scene.get_node("PuzzleBoard")
	var save = scene.get_node("SaveCoordinator")
	save.clear_save()
	if not board.request_difficulty("hard"):
		_fail("Hard orientation freeze profile: Hard failed", 171)
		return
	await process_frame
	await process_frame
	await create_timer(0.15).timeout
	profile_board = board

	print(
		"Pieceful orientation freeze profile · Hard %d · board CanvasItems %d"
		% [board.active_piece_count(), _count_canvas_items(board)]
	)

	# Baseline: ordinary visible-tree resize.
	var t := Time.get_ticks_usec()
	window.size = Vector2i(720, 1280)
	await process_frame
	var baseline_ms := _ms(t)
	await create_timer(0.12).timeout
	print("PROFILE baseline visible resize first-frame %.3f ms" % baseline_ms)

	# Return to landscape, then arm a real size_changed callback. This is the
	# product-shaped experiment: nothing is pre-hidden before Window.size changes.
	window.size = Vector2i(1280, 720)
	await process_frame
	await create_timer(0.12).timeout

	callback_hide_count = 0
	window.size_changed.connect(_hide_board_on_window_resize)
	t = Time.get_ticks_usec()
	window.size = Vector2i(720, 1280)
	await process_frame
	var callback_resize_ms := _ms(t)
	window.size_changed.disconnect(_hide_board_on_window_resize)
	if callback_hide_count <= 0:
		_fail("Hard orientation freeze profile: size_changed hide callback never fired", 172)
		return
	if board.visible:
		_fail("Hard orientation freeze profile: Board was not hidden by callback", 173)
		return
	print(
		"PROFILE size_changed immediate-hide first-frame %.3f ms · callbacks %d"
		% [callback_resize_ms, callback_hide_count]
	)

	# Let the normal 60 ms responsive reflow settle while the heavy world is
	# hidden, then measure the cost of bringing the already-laid-out tree back.
	await create_timer(0.12).timeout
	t = Time.get_ticks_usec()
	board.visible = true
	await process_frame
	var restore_ms := _ms(t)
	print("PROFILE post-settle Board restore first-frame %.3f ms" % restore_ms)

	# One reverse direction as a sanity check using the same pattern.
	callback_hide_count = 0
	window.size_changed.connect(_hide_board_on_window_resize)
	t = Time.get_ticks_usec()
	window.size = Vector2i(1280, 720)
	await process_frame
	var reverse_hide_ms := _ms(t)
	window.size_changed.disconnect(_hide_board_on_window_resize)
	await create_timer(0.12).timeout
	t = Time.get_ticks_usec()
	board.visible = true
	await process_frame
	var reverse_restore_ms := _ms(t)
	print(
		"PROFILE reverse immediate-hide %.3f ms · restore %.3f ms"
		% [reverse_hide_ms, reverse_restore_ms]
	)

	save.clear_save()
	print("Pieceful orientation freeze profile · PASS")
	quit(0)
