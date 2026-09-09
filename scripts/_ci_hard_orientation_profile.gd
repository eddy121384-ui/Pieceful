extends SceneTree

const SQUARE_BASE := Vector2i(720, 720)

func _initialize() -> void:
	call_deferred("_run")

func _ms(start_usec: int) -> float:
	return float(Time.get_ticks_usec() - start_usec) / 1000.0

func _fail(message: String, code: int) -> void:
	push_error(message)
	quit(code)

func _run() -> void:
	var packed := load("res://main.tscn") as PackedScene
	if packed == null:
		_fail("Hard orientation profile: main.tscn failed to load", 150)
		return

	var window := get_root().get_window()
	window.size = Vector2i(1280, 720)
	await process_frame

	var scene = packed.instantiate()
	get_root().add_child(scene)
	await create_timer(0.45).timeout
	var board = scene.get_node("PuzzleBoard")
	var workspace = scene.get_node("SortingWorkspace")
	var save = scene.get_node("SaveCoordinator")
	save.clear_save()
	if not board.request_difficulty("hard"):
		_fail("Hard orientation profile: Hard failed", 151)
		return
	await process_frame
	await process_frame
	await create_timer(0.15).timeout

	if window.content_scale_size != SQUARE_BASE:
		_fail("Hard orientation profile: base is not stable square: %s" % window.content_scale_size, 152)
		return
	print("Pieceful orientation stable profile · Hard %d · base %s" % [board.active_piece_count(), window.content_scale_size])

	var t := Time.get_ticks_usec()
	window.size = Vector2i(720, 1280)
	await process_frame
	var portrait_first_frame_ms := _ms(t)
	await create_timer(0.10).timeout
	if window.content_scale_size != SQUARE_BASE:
		_fail("Hard orientation profile: portrait changed content-scale base", 153)
		return
	if board.workspace_orientation_label().to_lower() != "portrait":
		_fail("Hard orientation profile: board did not settle portrait", 154)
		return
	print(
		"PROFILE stable physical landscape→portrait first-frame %.3f ms · logical %s · base %s"
		% [portrait_first_frame_ms, get_viewport().get_visible_rect().size, window.content_scale_size]
	)

	t = Time.get_ticks_usec()
	window.size = Vector2i(1280, 720)
	await process_frame
	var landscape_first_frame_ms := _ms(t)
	await create_timer(0.10).timeout
	if window.content_scale_size != SQUARE_BASE:
		_fail("Hard orientation profile: landscape changed content-scale base", 155)
		return
	if board.workspace_orientation_label().to_lower() != "landscape":
		_fail("Hard orientation profile: board did not settle landscape", 156)
		return
	print(
		"PROFILE stable physical portrait→landscape first-frame %.3f ms · logical %s · base %s"
		% [landscape_first_frame_ms, get_viewport().get_visible_rect().size, window.content_scale_size]
	)

	t = Time.get_ticks_usec()
	board.apply_viewport_layout(Vector2(720.0, 1280.0))
	print("PROFILE board landscape→portrait %.3f ms" % _ms(t))
	t = Time.get_ticks_usec()
	board.apply_viewport_layout(Vector2(1280.0, 720.0))
	print("PROFILE board portrait→landscape %.3f ms" % _ms(t))

	var overlay = scene.get("board_lines_overlay")
	if overlay == null:
		scene._refresh_board_lines_overlay()
		overlay = scene.get("board_lines_overlay")
	if overlay != null:
		t = Time.get_ticks_usec()
		overlay.configure(board)
		print("PROFILE board-lines configure %.3f ms · %d segments" % [_ms(t), overlay.segments.size()])

	t = Time.get_ticks_usec()
	workspace._after_window_reflow()
	print("PROFILE sorting settle scatter %.3f ms" % _ms(t))

	var tray_id: String = workspace.state.create_tray("Profile")
	board._merge_cluster_into(0, 1)
	workspace.state.assign_pieces_to_tray([0, 1], tray_id)
	workspace.state.set_tray_piece_position(tray_id, 0, Vector2(120.0, 80.0))
	workspace.state.set_tray_piece_position(tray_id, 1, Vector2(180.0, 80.0))
	workspace.state.set_tray_position_reference_size(tray_id, Vector2(420.0, 260.0))
	workspace._open_tray(tray_id)
	await process_frame
	t = Time.get_ticks_usec()
	workspace.tray_play_canvas.prepare_tray_for_size(board, workspace.state, tray_id, Vector2(260.0, 420.0))
	print("PROFILE tray rigid reflow 2-piece %.3f ms" % _ms(t))

	save.clear_save()
	print("Pieceful orientation stable profile · PASS")
	quit(0)
