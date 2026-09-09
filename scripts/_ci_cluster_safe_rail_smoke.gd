extends SceneTree


func _initialize() -> void:
	call_deferred("_run")


func _fail(message: String, code: int) -> void:
	push_error(message)
	quit(code)


func _run() -> void:
	var packed := load("res://main.tscn") as PackedScene
	if packed == null:
		_fail("Cluster-safe Rail smoke: main.tscn failed to load", 110)
		return

	if not await _run_case(packed, "relaxed", 40, 38, false):
		return
	if not await _run_case(packed, "hard", 286, 284, true):
		return

	print("Pieceful cluster-safe Rail smoke · Relaxed 40 + Hard 286 workspace islands stay pinned OK")
	quit(0)


func _run_case(
	packed: PackedScene,
	difficulty_id: String,
	expected_count: int,
	expected_rail_members: int,
	expect_spatial: bool
) -> bool:
	var scene = packed.instantiate()
	get_root().add_child(scene)
	await create_timer(0.40).timeout

	var board = scene.get_node("PuzzleBoard")
	var workspace = scene.get_node("SortingWorkspace")
	var save = scene.get_node("SaveCoordinator")
	save.clear_save()

	if not board.request_difficulty(difficulty_id):
		_fail("Cluster-safe Rail smoke: difficulty failed: %s" % difficulty_id, 111)
		return false
	await process_frame
	await process_frame
	await create_timer(0.15).timeout

	if board.active_piece_count() != expected_count:
		_fail("Cluster-safe Rail smoke: wrong piece count for %s" % difficulty_id, 112)
		return false
	if bool(board.spatial_mode_enabled()) != expect_spatial:
		_fail("Cluster-safe Rail smoke: spatial mode mismatch for %s" % difficulty_id, 113)
		return false

	if str(workspace.loose_layout_mode) != "scatter":
		workspace._set_loose_layout_mode("scatter")
		await create_timer(0.55).timeout

	var piece0 = board.pieces[0]
	var piece1 = board.pieces[1]
	var anchor := Vector2(430.0, 250.0)
	piece0.position = anchor
	piece1.position = (
		anchor
		+ Vector2(piece1.target_position)
		- Vector2(piece0.target_position)
	)
	board._merge_cluster_into(0, 1)
	board._raise_cluster(0)
	if board.has_method("mark_spatial_index_dirty"):
		board.mark_spatial_index_dirty()

	var cluster_id := int(board.cluster_for_piece.get(0, -1))
	if cluster_id < 0 or int(board.cluster_for_piece.get(1, -2)) != cluster_id:
		_fail("Cluster-safe Rail smoke: source cluster did not form for %s" % difficulty_id, 114)
		return false
	var before0 := Vector2(piece0.position)
	var before1 := Vector2(piece1.position)

	workspace._set_loose_layout_mode("rail")
	await create_timer(0.65).timeout

	if workspace.rail_cluster_ids.has(cluster_id):
		_fail("Cluster-safe Rail smoke: assembled island was auto-captured in %s" % difficulty_id, 115)
		return false
	if workspace._rail_member_indexes().size() != expected_rail_members:
		_fail(
			"Cluster-safe Rail smoke: expected %d Rail members, got %d for %s"
			% [expected_rail_members, workspace._rail_member_indexes().size(), difficulty_id],
			116
		)
		return false
	if not bool(piece0.visible) or not bool(piece1.visible):
		_fail("Cluster-safe Rail smoke: Main island became invisible in %s" % difficulty_id, 117)
		return false
	if float(piece0.modulate.a) < 0.99 or float(piece1.modulate.a) < 0.99:
		_fail("Cluster-safe Rail smoke: Main island alpha changed in %s" % difficulty_id, 118)
		return false
	if Vector2(piece0.position).distance_to(before0) > 0.01 or Vector2(piece1.position).distance_to(before1) > 0.01:
		_fail("Cluster-safe Rail smoke: Main island moved when entering Rail in %s" % difficulty_id, 119)
		return false
	if int(board.cluster_for_piece.get(1, -2)) != cluster_id:
		_fail("Cluster-safe Rail smoke: cluster membership changed in Rail for %s" % difficulty_id, 120)
		return false

	workspace._set_loose_layout_mode("scatter")
	await create_timer(0.65).timeout

	if Vector2(piece0.position).distance_to(before0) > 0.01 or Vector2(piece1.position).distance_to(before1) > 0.01:
		_fail("Cluster-safe Rail smoke: Main island moved when returning Scatter in %s" % difficulty_id, 121)
		return false
	if int(board.cluster_for_piece.get(0, -1)) != int(board.cluster_for_piece.get(1, -2)):
		_fail("Cluster-safe Rail smoke: cluster membership lost after Scatter in %s" % difficulty_id, 122)
		return false
	if not bool(piece0.visible) or not bool(piece1.visible):
		_fail("Cluster-safe Rail smoke: Main island disappeared after Scatter in %s" % difficulty_id, 123)
		return false

	save.clear_save()
	scene.queue_free()
	await process_frame
	await process_frame
	return true
