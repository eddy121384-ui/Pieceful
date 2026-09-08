extends SceneTree


func _initialize() -> void:
	call_deferred("_run")


func _run() -> void:
	var packed := load("res://main.tscn") as PackedScene
	if packed == null:
		push_error("Resume smoke: main.tscn failed to load")
		quit(80)
		return

	var first = packed.instantiate()
	get_root().add_child(first)
	await create_timer(0.25).timeout
	var board = first.get_node("PuzzleBoard")
	var workspace = first.get_node("SortingWorkspace")
	var save = first.get_node("SaveCoordinator")
	save.clear_save()
	if not board.request_difficulty("relaxed"):
		push_error("Resume smoke: relaxed difficulty failed")
		quit(81)
		return
	await process_frame
	await process_frame

	# Build a deterministic two-piece island away from its target.
	var piece0 = board.pieces[0]
	var piece1 = board.pieces[1]
	piece0.position = Vector2(180.0, 170.0)
	piece1.position = piece0.position + Vector2(piece1.target_position) - Vector2(piece0.target_position)
	board._merge_cluster_into(0, 1)
	board.z_counter += 5
	piece0.z_index = board.z_counter
	piece1.z_index = board.z_counter

	# Solve one independent piece so solved state is part of the round-trip.
	board._solve_cluster(2)
	await create_timer(0.18).timeout

	# Put another piece in a named Tray; exact tray mini-table position is retained
	# as local data even though cross-orientation tray reflow is a later phase.
	var tray_id: String = workspace.state.create_tray("Edges")
	workspace.state.assign_pieces_to_tray([3], tray_id)
	workspace.state.set_tray_piece_position(tray_id, 3, Vector2(96.0, 72.0))
	workspace._stash_piece(3)
	workspace._refresh_ui()

	var saved_piece0 := Vector2(piece0.position)
	if not save.save_now(true):
		push_error("Resume smoke: save failed: %s" % save.last_save_error)
		quit(82)
		return

	first.queue_free()
	await process_frame
	await process_frame

	var second = packed.instantiate()
	get_root().add_child(second)
	await create_timer(0.50).timeout
	var board2 = second.get_node("PuzzleBoard")
	var workspace2 = second.get_node("SortingWorkspace")
	var save2 = second.get_node("SaveCoordinator")

	if not save2.resume_attempted or not save2.resume_succeeded:
		push_error("Resume smoke: resume failed: %s" % save2.last_resume_error)
		quit(83)
		return
	if board2.active_difficulty_id() != "relaxed" or board2.active_piece_count() != 40:
		push_error("Resume smoke: difficulty/piece count not restored")
		quit(84)
		return
	if not bool(board2.pieces[2].solved) or int(board2.solved_count) != 1:
		push_error("Resume smoke: solved state not restored")
		quit(85)
		return
	if int(board2.cluster_for_piece.get(0, -1)) != int(board2.cluster_for_piece.get(1, -2)):
		push_error("Resume smoke: cluster membership not restored")
		quit(86)
		return
	if Vector2(board2.pieces[0].position).distance_to(saved_piece0) > 0.75:
		push_error("Resume smoke: loose position not restored")
		quit(87)
		return
	if workspace2.state.tray_name(tray_id) != "Edges" or not workspace2.state.tray_piece_indexes(tray_id).has(3):
		push_error("Resume smoke: tray membership not restored")
		quit(88)
		return
	if workspace2.state.tray_piece_position(tray_id, 3).distance_to(Vector2(96.0, 72.0)) > 0.1:
		push_error("Resume smoke: tray local position not restored")
		quit(89)
		return

	print("Pieceful single-slot resume smoke · difficulty + position + cluster + solved + tray OK")
	save2.clear_save()
	quit(0)
