extends SceneTree

const MainScene = preload("res://main.tscn")


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	var main = MainScene.instantiate()
	root.add_child(main)
	for _frame in range(28):
		await process_frame
	print("RAIL_SMOKE phase=boot_ready")

	var board = main.get_node_or_null("PuzzleBoard")
	if board == null or board.pieces.is_empty():
		_fail("runtime board/pieces missing")
		return
	var rail_canvas = main.get("rail_canvas")
	var rail_panel = main.get("rail_panel")
	if rail_canvas == null or rail_panel == null:
		_fail("rail UI missing")
		return

	# Use the same public-in-practice layout path the mobile toolbar triggers.
	print("RAIL_SMOKE phase=switch_to_rail")
	main.call("_set_loose_layout_mode", "rail")
	for _frame in range(30):
		await process_frame

	if not rail_panel.visible:
		_fail("Scatter -> Rail left the rail panel hidden")
		return
	if float(rail_canvas.modulate.a) < 0.95:
		_fail("Scatter -> Rail left the rail canvas transparent")
		return
	if (rail_canvas.get("member_indexes") as Array).is_empty():
		_fail("Rail has no loose-piece members after layout switch")
		return
	if (rail_canvas.get("visual_nodes") as Dictionary).is_empty():
		_fail("Rail members exist but no visuals were instantiated")
		return

	print("RAIL_SMOKE phase=rail_visible visuals=%d" % int((rail_canvas.get("visual_nodes") as Dictionary).size()))
	var before_count := int((rail_canvas.get("visual_nodes") as Dictionary).size())
	var original_size := Vector2(rail_canvas.size)
	rail_canvas.size = Vector2(
		maxf(original_size.x + 48.0, 220.0),
		maxf(original_size.y, 96.0)
	)
	for _frame in range(3):
		await process_frame

	if (rail_canvas.get("visual_nodes") as Dictionary).is_empty():
		_fail("Rail resize destroyed all piece visuals")
		return
	if int((rail_canvas.get("visual_nodes") as Dictionary).size()) != before_count:
		_fail(
			"non-dense Rail resize changed visual count from %d to %d"
			% [before_count, int((rail_canvas.get("visual_nodes") as Dictionary).size())]
		)
		return

	# A second mode round-trip catches stale transition alpha/state.
	print("RAIL_SMOKE phase=resize_ok")
	main.call("_set_loose_layout_mode", "scatter")
	for _frame in range(30):
		await process_frame
	print("RAIL_SMOKE phase=roundtrip_back_to_rail")
	main.call("_set_loose_layout_mode", "rail")
	for _frame in range(30):
		await process_frame

	if not rail_panel.visible or float(rail_canvas.modulate.a) < 0.95:
		_fail("Scatter -> Rail round-trip did not restore visible rail")
		return
	if (rail_canvas.get("visual_nodes") as Dictionary).is_empty():
		_fail("Scatter -> Rail round-trip lost rail visuals")
		return

	main.queue_free()
	await process_frame
	print("PASS rail_layout_visibility_smoke")
	quit(0)


func _fail(message: String) -> void:
	push_error("FAIL rail_layout_visibility_smoke: %s" % message)
	quit(1)
