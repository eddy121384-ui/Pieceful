extends SceneTree

const MainScene = preload("res://main.tscn")
const PieceVisuals = preload("res://scripts/puzzle_piece_visual_factory.gd")


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
	if not _check_transition_visuals(workspace, board):
		return
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
	if not _check_transition_visuals(workspace, board):
		return
	if not await _wait_for_layout_transition(workspace):
		_fail("Rail -> Scatter transition did not finish")
		return

	# Connected islands stay on the table during automatic layout switches.
	var first = board.pieces[0]
	var second = board.pieces[1]
	second.position = first.position + second.target_position - first.target_position
	board._merge_cluster_into(board._cluster_id_for(0), board._cluster_id_for(1))
	var joined_position: Vector2 = first.position
	for mode in ["rail", "scatter", "rail", "scatter"]:
		workspace.call("_set_loose_layout_mode", mode)
		if not _check_transition_visuals(workspace, board):
			return
		if not await _wait_for_layout_transition(workspace):
			_fail("joined repeated transition did not finish")
			return
		if workspace.layout_mode_button.disabled:
			_fail("layout input stayed disabled after transition")
			return
		if first.position != joined_position or not first.visible or not first.input_pickable:
			_fail("automatic toggle disturbed the joined table island")
			return
		if mode == "scatter":
			for piece in board.pieces:
				if not piece.solved and (not piece.visible or not piece.input_pickable):
					_fail("Scatter did not restore loose-piece interaction")
					return

	print("RAIL_SMOKE phase=roundtrip_back_to_rail")
	workspace.call("_set_loose_layout_mode", "rail")
	if not _check_transition_visuals(workspace, board):
		return
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

	# Explicit storage is the existing route by which joined islands enter Rail.
	first.last_pointer_screen_position = rail_canvas.get_global_rect().get_center()
	if not workspace.try_store_rail_drop(first):
		_fail("joined Rail storage fixture failed")
		return
	workspace.call("_set_loose_layout_mode", "scatter")
	if not _check_transition_visuals(workspace, board, true):
		return
	if not await _wait_for_layout_transition(workspace):
		_fail("joined Rail -> Scatter did not finish")
		return
	# Dense sampling must share the same stack, rather than a flat face fallback.
	var sample = workspace._create_dense_sample_ghost({
		"anchor": 0, "members": [0, 1], "start_position": Vector2.ZERO, "start_scale": 0.75,
	})
	workspace.layout_transition_active = true
	if sample == null or not _check_transition_visuals(workspace, board, true, false):
		return
	workspace.layout_transition_active = false
	workspace._clear_layout_transition_ghosts()

	main.queue_free()
	await process_frame
	print("PASS rail_layout_visibility_smoke")
	quit(0)


func _check_transition_visuals(workspace, board, expect_joined: bool = false, expect_single: bool = true) -> bool:
	var transition_root = workspace.layout_transition_root
	if not workspace.layout_transition_active or transition_root.get_child_count() == 0:
		_fail("transition ghosts missing")
		return false
	if transition_root.z_index != 4096:
		_fail("transition z band changed")
		return false
	var joined_seen := false
	var single_seen := false
	for group in transition_root.get_children():
		if group.is_queued_for_deletion():
			continue
		var joined: bool = group.get_child_count() > 1
		joined_seen = joined_seen or joined
		single_seen = single_seen or not joined
		for holder in group.get_children():
			var names: Array = []
			for layer in holder.get_children():
				names.append(str(layer.name))
				if layer.z_index != 0 or not layer.z_as_relative:
					_fail("ghost layer escaped its piece z band")
					return false
			if names != ["ContactShadow", "Thickness", "Face", "EdgeRelief"]:
				_fail("ghost reverted to a legacy/flat visual stack: %s" % str(names))
				return false
			var relief = holder.get_node("EdgeRelief")
			var state = PieceVisuals.STATE_JOINED if joined else PieceVisuals.STATE_LOOSE
			if relief.material != PieceVisuals.edge_relief_material(state):
				_fail("ghost is missing the shared relief material/state")
				return false
			if relief.width <= 0.0 or not relief.closed:
				_fail("ghost relief band missing")
				return false
			if holder.get_node("ContactShadow").visible == joined:
				_fail("joined ghost shadow state incorrect")
				return false
			var face = holder.get_node("Face")
			if face.texture != board.pieces[0].source_texture or face.polygon.is_empty() or face.uv.is_empty():
				_fail("ghost artwork/geometry missing")
				return false
			if holder.get_node("Thickness").position.is_zero_approx():
				_fail("ghost thickness missing")
				return false
	if (expect_single and not single_seen) or (expect_joined and not joined_seen):
		_fail("expected single/joined ghost coverage missing")
		return false
	return true


func _wait_for_layout_transition(workspace, max_frames: int = 120) -> bool:
	for _frame in range(max_frames):
		if not bool(workspace.get("layout_transition_active")):
			return true
		await process_frame
	return false


func _fail(message: String) -> void:
	push_error("FAIL rail_layout_visibility_smoke: %s" % message)
	quit(1)
