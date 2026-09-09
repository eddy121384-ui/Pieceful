extends SceneTree

const LANDSCAPE_TRAY := Vector2(420.0, 260.0)
const PORTRAIT_TRAY := Vector2(260.0, 420.0)
const EPS := 0.03


func _initialize() -> void:
	call_deferred("_run")


func _fail(message: String, code: int) -> void:
	push_error(message)
	quit(code)


func _run() -> void:
	var packed := load("res://main.tscn") as PackedScene
	if packed == null:
		_fail("Tray reflow smoke: main.tscn failed to load", 130)
		return

	var first = packed.instantiate()
	get_root().add_child(first)
	await create_timer(0.45).timeout
	var board = first.get_node("PuzzleBoard")
	var workspace = first.get_node("SortingWorkspace")
	var save = first.get_node("SaveCoordinator")
	save.clear_save()

	if not board.request_difficulty("relaxed"):
		_fail("Tray reflow smoke: Relaxed difficulty failed", 131)
		return
	await process_frame
	await process_frame
	await create_timer(0.15).timeout

	var tray_id: String = workspace.state.create_tray("Reflow")
	var piece0 = board.pieces[0]
	var piece1 = board.pieces[1]
	board._merge_cluster_into(0, 1)
	if not workspace.state.assign_pieces_to_tray([0, 1], tray_id):
		_fail("Tray reflow smoke: could not assign cluster to Tray", 132)
		return

	var canvas = workspace.tray_play_canvas
	var scale_factor: float = float(canvas._visual_scale_for_board(board))
	var anchor := Vector2(286.0, 154.0)
	workspace.state.set_tray_piece_position(tray_id, 0, anchor)
	workspace.state.set_tray_piece_position(
		tray_id,
		1,
		anchor + (Vector2(piece1.target_position) - Vector2(piece0.target_position)) * scale_factor
	)
	workspace.state.set_tray_position_reference_size(tray_id, LANDSCAPE_TRAY)

	var before_relative: Vector2 = (
		Vector2(workspace.state.tray_piece_position(tray_id, 1))
		- Vector2(workspace.state.tray_piece_position(tray_id, 0))
	)
	var before_bounds: Rect2 = canvas._group_bounds_for(
		board,
		workspace.state,
		tray_id,
		[0, 1]
	)
	var before_norm: Vector2 = _normalized_top_left(before_bounds, LANDSCAPE_TRAY)

	canvas.prepare_tray_for_size(board, workspace.state, tray_id, PORTRAIT_TRAY)
	var after_relative: Vector2 = (
		Vector2(workspace.state.tray_piece_position(tray_id, 1))
		- Vector2(workspace.state.tray_piece_position(tray_id, 0))
	)
	if after_relative.distance_to(before_relative) > EPS:
		_fail("Tray reflow smoke: cluster geometry stretched during direct reflow", 133)
		return
	var after_bounds: Rect2 = canvas._group_bounds_for(
		board,
		workspace.state,
		tray_id,
		[0, 1]
	)
	var after_norm: Vector2 = _normalized_top_left(after_bounds, PORTRAIT_TRAY)
	if after_norm.distance_to(before_norm) > 0.015:
		_fail(
			"Tray reflow smoke: normalized placement drifted %s -> %s"
			% [before_norm, after_norm],
			134
		)
		return
	if not _bounds_inside(after_bounds, PORTRAIT_TRAY):
		_fail("Tray reflow smoke: direct reflow left cluster outside portrait Tray", 135)
		return

	# Save a landscape-coordinate version and prove the reference survives the
	# disk round trip. The second scene then lazily projects it to portrait space.
	workspace.state.set_tray_piece_position(tray_id, 0, anchor)
	workspace.state.set_tray_piece_position(
		tray_id,
		1,
		anchor + before_relative
	)
	workspace.state.set_tray_position_reference_size(tray_id, LANDSCAPE_TRAY)
	if not save.save_now(true):
		_fail("Tray reflow smoke: save failed: %s" % save.last_save_error, 136)
		return

	first.queue_free()
	await process_frame
	await process_frame

	var second = packed.instantiate()
	get_root().add_child(second)
	await create_timer(0.85).timeout
	var board2 = second.get_node("PuzzleBoard")
	var workspace2 = second.get_node("SortingWorkspace")
	var save2 = second.get_node("SaveCoordinator")
	if not save2.resume_attempted or not save2.resume_succeeded:
		_fail("Tray reflow smoke: disk resume failed: %s" % save2.last_resume_error, 137)
		return
	if workspace2.state.tray_id_for(0) != tray_id or workspace2.state.tray_id_for(1) != tray_id:
		_fail("Tray reflow smoke: Tray ownership was lost on resume", 138)
		return
	if int(board2.cluster_for_piece.get(0, -1)) != int(board2.cluster_for_piece.get(1, -2)):
		_fail("Tray reflow smoke: cluster membership was lost on resume", 139)
		return
	var restored_reference: Vector2 = Vector2(
		workspace2.state.tray_position_reference_size(tray_id)
	)
	if restored_reference.distance_to(LANDSCAPE_TRAY) > EPS:
		_fail(
			"Tray reflow smoke: saved reference size was not restored: %s"
			% restored_reference,
			140
		)
		return

	var canvas2 = workspace2.tray_play_canvas
	canvas2.prepare_tray_for_size(board2, workspace2.state, tray_id, PORTRAIT_TRAY)
	var restored_relative: Vector2 = (
		Vector2(workspace2.state.tray_piece_position(tray_id, 1))
		- Vector2(workspace2.state.tray_piece_position(tray_id, 0))
	)
	if restored_relative.distance_to(before_relative) > EPS:
		_fail("Tray reflow smoke: resumed cluster stretched in portrait Tray", 141)
		return
	var restored_bounds: Rect2 = canvas2._group_bounds_for(
		board2,
		workspace2.state,
		tray_id,
		[0, 1]
	)
	if not _bounds_inside(restored_bounds, PORTRAIT_TRAY):
		_fail("Tray reflow smoke: resumed cluster is outside portrait Tray", 142)
		return
	var restored_norm: Vector2 = _normalized_top_left(restored_bounds, PORTRAIT_TRAY)
	if restored_norm.distance_to(before_norm) > 0.015:
		_fail(
			"Tray reflow smoke: resumed normalized placement drifted %s -> %s"
			% [before_norm, restored_norm],
			143
		)
		return
	if Vector2(workspace2.state.tray_position_reference_size(tray_id)).distance_to(PORTRAIT_TRAY) > EPS:
		_fail("Tray reflow smoke: portrait reference was not adopted after lazy reflow", 144)
		return

	# Finally bind the real Container-owned canvas. It may choose a different
	# runtime size than the synthetic portrait benchmark, but it must preserve the
	# same rigid cluster and keep the group inside its actual mini-table.
	canvas2.configure(board2, workspace2.state, tray_id)
	await process_frame
	var ui_relative: Vector2 = (
		Vector2(workspace2.state.tray_piece_position(tray_id, 1))
		- Vector2(workspace2.state.tray_piece_position(tray_id, 0))
	)
	if ui_relative.distance_to(before_relative) > EPS:
		_fail("Tray reflow smoke: real UI configure stretched resumed cluster", 145)
		return
	var ui_bounds: Rect2 = canvas2._group_bounds_for(
		board2,
		workspace2.state,
		tray_id,
		[0, 1]
	)
	var actual_size: Vector2 = Vector2(canvas2.size)
	if actual_size.x > 1.0 and actual_size.y > 1.0 and not _bounds_inside(ui_bounds, actual_size):
		_fail(
			"Tray reflow smoke: real UI configure left cluster outside actual Tray %s"
			% actual_size,
			146
		)
		return

	save2.clear_save()
	print(
		"Pieceful Tray reflow smoke · rigid cluster + normalized placement + disk reference OK · %s -> %s"
		% [LANDSCAPE_TRAY, PORTRAIT_TRAY]
	)
	quit(0)


func _normalized_top_left(bounds: Rect2, reference_size: Vector2) -> Vector2:
	var min_position := Vector2(10.0, 10.0)
	var max_position := Vector2(
		maxf(10.0, reference_size.x - 10.0 - bounds.size.x),
		maxf(10.0, reference_size.y - 10.0 - bounds.size.y)
	)
	var movement_range := Vector2(
		maxf(1.0, max_position.x - min_position.x),
		maxf(1.0, max_position.y - min_position.y)
	)
	return Vector2(
		clampf((bounds.position.x - min_position.x) / movement_range.x, 0.0, 1.0),
		clampf((bounds.position.y - min_position.y) / movement_range.y, 0.0, 1.0)
	)


func _bounds_inside(bounds: Rect2, reference_size: Vector2) -> bool:
	return (
		bounds.position.x >= 9.9
		and bounds.position.y >= 9.9
		and bounds.end.x <= reference_size.x - 9.9
		and bounds.end.y <= reference_size.y - 9.9
	)
