extends SceneTree

const LANDSCAPE := Vector2i(1280, 720)
const PORTRAIT := Vector2i(720, 1280)
const FIXED_SURFACE := Vector2(720.0, 720.0)
const MAX_ROTATION_FRAME_MS := 250.0


func _initialize() -> void:
	call_deferred("_run")


func _fail(message: String, code: int) -> void:
	push_error(message)
	quit(code)


func _near_vec(a: Vector2, b: Vector2, tolerance := 1.5) -> bool:
	return a.distance_to(b) <= tolerance


func _piece_center(piece) -> Vector2:
	return Vector2(piece.piece_size) * 0.5


func _first_visible_loose_piece(board, workspace):
	for piece in board.pieces:
		if (
			is_instance_valid(piece)
			and not bool(piece.solved)
			and bool(piece.visible)
			and workspace.state.location_for(int(piece.piece_index)) == "loose"
		):
			return piece
	return null


func _surface_point_for_world_piece(piece) -> Vector2:
	return piece.get_global_transform_with_canvas() * _piece_center(piece)


func _run() -> void:
	var packed := load("res://main.tscn") as PackedScene
	if packed == null:
		_fail("Fixed-surface smoke: main.tscn failed to load", 180)
		return

	var window := get_root().get_window()
	window.size = LANDSCAPE
	await process_frame

	var scene = packed.instantiate()
	get_root().add_child(scene)
	await create_timer(0.55).timeout

	var board = scene.get_node("PuzzleBoard")
	var camera = scene.get_node("PuzzleCamera")
	var workspace = scene.get_node("SortingWorkspace")
	var save = scene.get_node("SaveCoordinator")
	save.clear_save()

	if not camera.has_method("set_virtual_viewport_size"):
		_fail("Fixed-surface smoke: fixed camera is not installed", 181)
		return
	if not workspace.has_method("set_fixed_surface_virtual_size"):
		_fail("Fixed-surface smoke: SortingUI compensation is not installed", 182)
		return
	if not board.request_difficulty("hard"):
		_fail("Fixed-surface smoke: Hard failed to load", 183)
		return
	scene._randomize_runtime_scatter()
	await process_frame
	await process_frame
	await create_timer(0.16).timeout

	if board.active_piece_count() != 286:
		_fail("Fixed-surface smoke: expected Hard 286", 184)
		return
	if Vector2(window.content_scale_size) != FIXED_SURFACE:
		_fail("Fixed-surface smoke: render target is not fixed at 720x720", 185)
		return

	var virtual_landscape: Vector2 = scene._sync_content_scale_to_window()
	if not _near_vec(virtual_landscape, Vector2(1280.0, 720.0)):
		_fail("Fixed-surface smoke: landscape virtual workspace is wrong: %s" % virtual_landscape, 186)
		return
	var main_ui = scene.get_node("UI") as CanvasLayer
	if main_ui == null or not _near_vec(main_ui.transform.get_scale(), Vector2(0.5625, 1.0), 0.02):
		_fail("Fixed-surface smoke: landscape Main UI compensation is wrong", 187)
		return
	if not _near_vec(workspace._viewport_size(), virtual_landscape):
		_fail("Fixed-surface smoke: SortingUI did not receive landscape virtual size", 188)
		return

	var piece = _first_visible_loose_piece(board, workspace)
	if piece == null:
		_fail("Fixed-surface smoke: no visible Hard loose piece", 189)
		return
	var pick_landscape = board.spatial_piece_at_screen(_surface_point_for_world_piece(piece))
	if pick_landscape != piece:
		_fail("Fixed-surface smoke: Hard spatial picker misses in landscape", 190)
		return

	var rotate_started := Time.get_ticks_usec()
	window.size = PORTRAIT
	await process_frame
	var portrait_first_frame_ms := float(Time.get_ticks_usec() - rotate_started) / 1000.0
	await process_frame
	await process_frame
	await create_timer(0.12).timeout

	var virtual_portrait: Vector2 = scene._sync_content_scale_to_window()
	if not _near_vec(virtual_portrait, Vector2(720.0, 1280.0)):
		_fail("Fixed-surface smoke: portrait virtual workspace is wrong: %s" % virtual_portrait, 191)
		return
	if not _near_vec(main_ui.transform.get_scale(), Vector2(1.0, 0.5625), 0.02):
		_fail("Fixed-surface smoke: portrait Main UI compensation is wrong", 192)
		return
	if not _near_vec(workspace._viewport_size(), virtual_portrait):
		_fail("Fixed-surface smoke: SortingUI did not receive portrait virtual size", 193)
		return
	if portrait_first_frame_ms > MAX_ROTATION_FRAME_MS:
		_fail("Fixed-surface smoke: portrait first frame still stalls: %.2f ms" % portrait_first_frame_ms, 194)
		return

	piece = _first_visible_loose_piece(board, workspace)
	if piece == null:
		_fail("Fixed-surface smoke: no portrait loose piece", 195)
		return
	var pick_portrait = board.spatial_piece_at_screen(_surface_point_for_world_piece(piece))
	if pick_portrait != piece:
		_fail("Fixed-surface smoke: Hard spatial picker misses after rotation", 196)
		return

	# Rail integration: enter dense Rail, wait for post-layout virtualization, and
	# prove that a point transformed through SortingUI resolves back to the same
	# logical piece without requiring a scroll gesture.
	workspace._set_loose_layout_mode("rail")
	await create_timer(0.48).timeout
	var rail = workspace.rail_canvas
	if rail == null or rail.visual_nodes.is_empty():
		_fail("Fixed-surface smoke: dense Rail has no initial visuals", 197)
		return
	var rail_piece_index := int(rail.visual_nodes.keys()[0])
	var rail_piece = board.pieces[rail_piece_index]
	var rail_local := Vector2(rail._piece_position(rail_piece_index))
	rail_local += _piece_center(rail_piece) * float(rail.visual_scale())
	var rail_surface: Vector2 = rail.get_global_transform_with_canvas() * rail_local
	if int(rail._top_piece_at(rail_surface)) != rail_piece_index:
		_fail("Fixed-surface smoke: Rail hit-test is offset after portrait compensation", 198)
		return
	if not _near_vec(rail._screen_to_local(rail_surface), rail_local, 0.8):
		_fail("Fixed-surface smoke: Rail surface/local transform is not reversible", 199)
		return

	# Tray integration: move one canonical loose Rail singleton into a Tray, open
	# it, and verify the same surface/local hit path in the mini-table.
	var tray_id: String = workspace.state.create_tray("Fixed Surface Smoke")
	if not workspace.state.assign_pieces_to_tray([rail_piece_index], tray_id):
		_fail("Fixed-surface smoke: could not assign Rail piece to Tray", 200)
		return
	var cluster_id := int(board.cluster_for_piece.get(rail_piece_index, rail_piece_index))
	workspace.rail_cluster_ids.erase(cluster_id)
	workspace._stash_piece(rail_piece_index)
	workspace._open_tray(tray_id)
	await process_frame
	await create_timer(0.12).timeout
	var tray = workspace.tray_play_canvas
	if tray == null or not workspace.state.has_tray_piece_position(tray_id, rail_piece_index):
		_fail("Fixed-surface smoke: Tray did not materialize assigned piece", 201)
		return
	var tray_local := Vector2(workspace.state.tray_piece_position(tray_id, rail_piece_index))
	tray_local += _piece_center(rail_piece) * float(tray.visual_scale())
	var tray_surface: Vector2 = tray.get_global_transform_with_canvas() * tray_local
	if int(tray._top_piece_at(tray_surface)) != rail_piece_index:
		_fail("Fixed-surface smoke: Tray hit-test is offset after portrait compensation", 202)
		return
	if not workspace._control_contains_surface_point(tray, tray_surface):
		_fail("Fixed-surface smoke: Tray drop hit-test rejects transformed point", 203)
		return

	var reverse_started := Time.get_ticks_usec()
	window.size = LANDSCAPE
	await process_frame
	var landscape_first_frame_ms := float(Time.get_ticks_usec() - reverse_started) / 1000.0
	await process_frame
	await create_timer(0.34).timeout
	if landscape_first_frame_ms > MAX_ROTATION_FRAME_MS:
		_fail("Fixed-surface smoke: landscape first frame still stalls: %.2f ms" % landscape_first_frame_ms, 204)
		return
	if not _near_vec(scene._sync_content_scale_to_window(), Vector2(1280.0, 720.0)):
		_fail("Fixed-surface smoke: reverse rotation virtual size is wrong", 205)
		return

	print(
		"Pieceful fixed-surface smoke · Hard 286 · portrait %.3f ms · landscape %.3f ms · spatial/Rail/Tray PASS"
		% [portrait_first_frame_ms, landscape_first_frame_ms]
	)
	save.clear_save()
	quit(0)
