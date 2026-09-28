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
	if bool(main.get("board_lines_enabled")):
		_fail("white board guide lines unexpectedly defaulted on")
		return

	var board = main.get_node_or_null("PuzzleBoard")
	var workspace = main.get_node_or_null("SortingWorkspace")
	if board == null or board.pieces.is_empty():
		_fail("runtime board/pieces missing")
		return
	if workspace == null:
		_fail("SortingWorkspace node missing")
		return

	var rail_canvas = workspace.get("rail_canvas")
	var rail_panel = workspace.get("rail_panel")
	if rail_canvas == null or rail_panel == null:
		_fail("rail UI missing from SortingWorkspace")
		return

	# Normalize to the product's Scatter baseline, then take the same layout path
	# the mobile dock button triggers.
	workspace.call("_set_loose_layout_mode", "scatter")
	for _frame in range(4):
		await process_frame

	print("RAIL_SMOKE phase=switch_to_rail")
	workspace.call("_set_loose_layout_mode", "rail")
	if not await _wait_for_layout_transition(workspace):
		_fail("Scatter -> Rail transition did not finish")
		return

	if not rail_panel.visible:
		_fail("Scatter -> Rail left the rail panel hidden")
		return
	if float(rail_canvas.modulate.a) < 0.95:
		_fail("Scatter -> Rail left the rail canvas transparent")
		return

	var members = rail_canvas.get("member_indexes")
	var visuals = rail_canvas.get("visual_nodes")
	if not (members is Array) or (members as Array).is_empty():
		_fail("Rail has no loose-piece members after layout switch")
		return
	if not (visuals is Dictionary) or (visuals as Dictionary).is_empty():
		_fail("Rail members exist but no visuals were instantiated")
		return

	print("RAIL_SMOKE phase=rail_visible visuals=%d" % int((visuals as Dictionary).size()))
	var before_count := int((visuals as Dictionary).size())
	var original_size := Vector2(rail_canvas.size)
	rail_canvas.size = Vector2(
		maxf(original_size.x + 48.0, 220.0),
		maxf(original_size.y, 96.0)
	)
	for _frame in range(4):
		await process_frame

	visuals = rail_canvas.get("visual_nodes")
	if not (visuals is Dictionary) or (visuals as Dictionary).is_empty():
		_fail("Rail resize destroyed all piece visuals")
		return
	if int((visuals as Dictionary).size()) != before_count:
		_fail(
			"non-dense Rail resize changed visual count from %d to %d"
			% [before_count, int((visuals as Dictionary).size())]
		)
		return

	print("RAIL_SMOKE phase=resize_ok")
	workspace.call("_set_loose_layout_mode", "scatter")
	if not await _wait_for_layout_transition(workspace):
		_fail("Rail -> Scatter transition did not finish")
		return

	print("RAIL_SMOKE phase=roundtrip_back_to_rail")
	workspace.call("_set_loose_layout_mode", "rail")
	if not await _wait_for_layout_transition(workspace):
		_fail("second Scatter -> Rail transition did not finish")
		return

	visuals = rail_canvas.get("visual_nodes")
	if not rail_panel.visible or float(rail_canvas.modulate.a) < 0.95:
		_fail("Scatter -> Rail round-trip did not restore visible rail")
		return
	if not (visuals is Dictionary) or (visuals as Dictionary).is_empty():
		_fail("Scatter -> Rail round-trip lost rail visuals")
		return

	main.queue_free()
	await process_frame
	print("PASS rail_layout_visibility_smoke")
	quit(0)


func _wait_for_layout_transition(workspace, max_frames: int = 120) -> bool:
	for _frame in range(max_frames):
		if not bool(workspace.get("layout_transition_active")):
			return true
		await process_frame
	return false


func _fail(message: String) -> void:
	push_error("FAIL rail_layout_visibility_smoke: %s" % message)
	quit(1)
