extends SceneTree

func _initialize() -> void:
	call_deferred("_run")

func _ms(start_usec: int) -> float:
	return float(Time.get_ticks_usec() - start_usec) / 1000.0

func _run() -> void:
	var packed := load("res://main.tscn") as PackedScene
	if packed == null:
		push_error("Hard orientation profile: main.tscn failed to load")
		quit(150)
		return

	var scene = packed.instantiate()
	get_root().add_child(scene)
	await create_timer(0.45).timeout
	var board = scene.get_node("PuzzleBoard")
	var workspace = scene.get_node("SortingWorkspace")
	var save = scene.get_node("SaveCoordinator")
	save.clear_save()
	if not board.request_difficulty("hard"):
		push_error("Hard orientation profile: Hard failed")
		quit(151)
		return
	await process_frame
	await process_frame
	await create_timer(0.15).timeout

	print("Pieceful orientation profile · Hard %d" % board.active_piece_count())

	var window := get_root().get_window()
	var original_scale_size: Vector2i = window.content_scale_size
	var t := Time.get_ticks_usec()
	window.content_scale_size = Vector2i(720, 1280)
	print("PROFILE content-scale setter landscape→portrait %.3f ms" % _ms(t))
	t = Time.get_ticks_usec()
	await process_frame
	print("PROFILE first frame after portrait scale %.3f ms" % _ms(t))

	t = Time.get_ticks_usec()
	window.content_scale_size = Vector2i(1280, 720)
	print("PROFILE content-scale setter portrait→landscape %.3f ms" % _ms(t))
	t = Time.get_ticks_usec()
	await process_frame
	print("PROFILE first frame after landscape scale %.3f ms" % _ms(t))
	window.content_scale_size = original_scale_size
	await process_frame

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
	scene._apply_preview_mode()
	print("PROFILE preview %.3f ms" % _ms(t))

	t = Time.get_ticks_usec()
	scene._layout_ui(Vector2(720.0, 1280.0))
	print("PROFILE main UI layout %.3f ms" % _ms(t))

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

	t = Time.get_ticks_usec()
	workspace._after_window_reflow()
	print("PROFILE sorting settle open tray %.3f ms" % _ms(t))

	workspace._close_tray_detail()
	t = Time.get_ticks_usec()
	workspace._set_loose_layout_mode("rail")
	print("PROFILE enter Rail %.3f ms · %d members" % [_ms(t), workspace._rail_member_indexes().size()])
	await create_timer(0.15).timeout

	t = Time.get_ticks_usec()
	workspace._refresh_loose_piece_layout()
	print("PROFILE dense Rail refresh %.3f ms" % _ms(t))

	t = Time.get_ticks_usec()
	workspace._after_window_reflow()
	print("PROFILE sorting settle Rail %.3f ms" % _ms(t))

	save.clear_save()
	quit(0)
