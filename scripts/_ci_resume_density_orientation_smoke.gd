extends SceneTree

const LANDSCAPE_SIZE := Vector2(1280.0, 720.0)
const PORTRAIT_SIZE := Vector2(720.0, 1280.0)


func _initialize() -> void:
	call_deferred("_run")


func _fail(message: String, code: int) -> void:
	push_error(message)
	quit(code)


func _run() -> void:
	var packed := load("res://main.tscn") as PackedScene
	if packed == null:
		_fail("Resume density/orientation smoke: main.tscn failed to load", 90)
		return

	if not await _run_hard_spatial_resume(packed):
		return
	if not await _run_cross_orientation_cluster_resume(packed):
		return

	print("Pieceful resume density/orientation smoke · Hard 286 spatial + landscape→portrait rigid cluster OK")
	quit(0)


func _run_hard_spatial_resume(packed: PackedScene) -> bool:
	var first = packed.instantiate()
	get_root().add_child(first)
	await create_timer(0.35).timeout
	var board = first.get_node("PuzzleBoard")
	var workspace = first.get_node("SortingWorkspace")
	var save = first.get_node("SaveCoordinator")
	save.clear_save()

	if not board.request_difficulty("hard"):
		_fail("Hard resume smoke: Hard difficulty failed", 91)
		return false
	await process_frame
	await process_frame
	if board.active_piece_count() != 286 or not board.spatial_mode_enabled():
		_fail("Hard resume smoke: 286/spatial mode did not activate", 92)
		return false

	workspace._set_loose_layout_mode("rail")
	await create_timer(0.50).timeout
	if str(workspace.loose_layout_mode) != "rail":
		_fail("Hard resume smoke: Rail mode did not activate", 93)
		return false
	if not save.save_now(true):
		_fail("Hard resume smoke: save failed: %s" % save.last_save_error, 94)
		return false

	first.queue_free()
	await process_frame
	await process_frame

	var second = packed.instantiate()
	get_root().add_child(second)
	await create_timer(0.80).timeout
	var board2 = second.get_node("PuzzleBoard")
	var workspace2 = second.get_node("SortingWorkspace")
	var save2 = second.get_node("SaveCoordinator")
	if not save2.resume_attempted or not save2.resume_succeeded:
		_fail("Hard resume smoke: resume failed: %s" % save2.last_resume_error, 95)
		return false
	if board2.active_piece_count() != 286 or not board2.spatial_mode_enabled():
		_fail("Hard resume smoke: 286/spatial mode not restored", 96)
		return false
	if str(workspace2.loose_layout_mode) != "rail":
		_fail("Hard resume smoke: saved Rail mode not restored", 97)
		return false

	workspace2._set_loose_layout_mode("scatter")
	await create_timer(0.60).timeout
	var candidate = null
	for piece_value in board2.pieces:
		var piece = piece_value
		if is_instance_valid(piece) and not bool(piece.solved) and bool(piece.visible) and float(piece.modulate.a) > 0.9:
			candidate = piece
			break
	if candidate == null:
		_fail("Hard resume smoke: no visible Scatter piece after Rail restore", 98)
		return false

	var local_probe := Vector2.ZERO
	for point in candidate.polygon_points:
		local_probe += Vector2(point)
	local_probe /= float(maxi(candidate.polygon_points.size(), 1))
	var world_probe: Vector2 = candidate.to_global(local_probe)
	var screen_probe: Vector2 = get_root().get_canvas_transform() * world_probe
	if board2.spatial_piece_at_screen(screen_probe) != candidate:
		_fail("Hard resume smoke: spatial picker could not resolve resumed piece", 99)
		return false
	board2._try_begin_spatial_drag(-1, screen_probe)
	if not bool(candidate.dragging) or int(board2.spatial_active_piece_index) != int(candidate.piece_index):
		_fail("Hard resume smoke: resumed spatial piece could not begin drag", 100)
		return false
	candidate._finish_drag(screen_probe)
	await process_frame

	save2.clear_save()
	second.queue_free()
	await process_frame
	await process_frame
	return true


func _run_cross_orientation_cluster_resume(packed: PackedScene) -> bool:
	var first = packed.instantiate()
	get_root().add_child(first)
	await create_timer(0.35).timeout
	var board = first.get_node("PuzzleBoard")
	var workspace = first.get_node("SortingWorkspace")
	var save = first.get_node("SaveCoordinator")
	save.clear_save()

	board.apply_viewport_layout(LANDSCAPE_SIZE)
	if not board.request_difficulty("relaxed"):
		_fail("Orientation resume smoke: Relaxed difficulty failed", 101)
		return false
	await process_frame
	await process_frame
	if str(workspace.loose_layout_mode) != "scatter":
		workspace._set_loose_layout_mode("scatter")
		await create_timer(0.45).timeout

	var anchor_norm := Vector2(0.23, 0.64)
	var navigation := Rect2(board.navigation_rect)
	var piece0 = board.pieces[0]
	var piece1 = board.pieces[1]
	piece0.position = navigation.position + anchor_norm * navigation.size
	piece1.position = (
		Vector2(piece0.position)
		+ Vector2(piece1.target_position)
		- Vector2(piece0.target_position)
	)
	board._merge_cluster_into(0, 1)
	board._raise_cluster(0)

	var expected_relative := Vector2(piece1.target_position) - Vector2(piece0.target_position)
	if Vector2(piece1.position - piece0.position).distance_to(expected_relative) > 0.01:
		_fail("Orientation resume smoke: source cluster was not rigid before save", 102)
		return false
	if not save.save_now(true):
		_fail("Orientation resume smoke: save failed: %s" % save.last_save_error, 103)
		return false

	first.queue_free()
	await process_frame
	await process_frame

	var second = packed.instantiate()
	get_root().add_child(second)
	var board2 = second.get_node("PuzzleBoard")
	# The SaveCoordinator waits three process frames before reading disk, so set
	# the destination logical workspace to Portrait immediately after _ready().
	board2.apply_viewport_layout(PORTRAIT_SIZE)
	await create_timer(0.80).timeout
	var save2 = second.get_node("SaveCoordinator")
	if not save2.resume_attempted or not save2.resume_succeeded:
		_fail("Orientation resume smoke: resume failed: %s" % save2.last_resume_error, 104)
		return false
	if str(board2.workspace_orientation) != "portrait":
		_fail("Orientation resume smoke: destination board is not Portrait", 105)
		return false

	var nav2 := Rect2(board2.navigation_rect)
	var restored0 = board2.pieces[0]
	var restored1 = board2.pieces[1]
	var actual_norm := Vector2(
		(restored0.position.x - nav2.position.x) / maxf(nav2.size.x, 1.0),
		(restored0.position.y - nav2.position.y) / maxf(nav2.size.y, 1.0)
	)
	if actual_norm.distance_to(anchor_norm) > 0.002:
		_fail(
			"Orientation resume smoke: anchor normalized position drifted: %s vs %s"
			% [actual_norm, anchor_norm],
			106
		)
		return false

	var restored_relative := Vector2(restored1.position) - Vector2(restored0.position)
	var target_relative := Vector2(restored1.target_position) - Vector2(restored0.target_position)
	if restored_relative.distance_to(target_relative) > 0.02:
		_fail(
			"Orientation resume smoke: rigid cluster distorted: %s vs %s"
			% [restored_relative, target_relative],
			107
		)
		return false
	if int(board2.cluster_for_piece.get(0, -1)) != int(board2.cluster_for_piece.get(1, -2)):
		_fail("Orientation resume smoke: cluster membership was lost", 108)
		return false

	save2.clear_save()
	second.queue_free()
	await process_frame
	return true
