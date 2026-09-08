extends SceneTree


func _initialize() -> void:
	call_deferred("_run")


func _run() -> void:
	var packed := load("res://main.tscn") as PackedScene
	if packed == null:
		push_error("Spatial smoke: main.tscn failed to load")
		quit(30)
		return

	var scene := packed.instantiate()
	get_root().add_child(scene)
	await process_frame
	await process_frame

	var board = scene.get_node_or_null("PuzzleBoard")
	if board == null:
		push_error("Spatial smoke: PuzzleBoard missing")
		quit(31)
		return
	if not board.request_difficulty("hard"):
		push_error("Spatial smoke: Hard difficulty failed")
		quit(32)
		return
	await process_frame

	if not board.has_method("spatial_mode_enabled") or not board.spatial_mode_enabled():
		push_error("Spatial smoke: spatial mode did not activate")
		quit(33)
		return

	var native_faces := 0
	var disabled_hits := 0
	for piece_value in board.pieces:
		var piece = piece_value
		if not is_instance_valid(piece) or bool(piece.solved):
			continue
		var face := piece.get_node_or_null("Face") as CanvasItem
		var hit := piece.get_node_or_null("HitArea") as CollisionPolygon2D
		if face != null and face.visible:
			native_faces += 1
		if hit != null and hit.disabled:
			disabled_hits += 1

	if native_faces < 250:
		push_error("Spatial smoke: native visuals missing: %d" % native_faces)
		quit(34)
		return
	if disabled_hits < 250:
		push_error("Spatial smoke: physics picking still active: %d" % disabled_hits)
		quit(35)
		return

	var test_piece = board.pieces[board.pieces.size() - 1]
	var world_probe: Vector2 = Vector2(test_piece.position) + Vector2(test_piece.piece_size) * 0.5
	var screen_probe: Vector2 = get_root().get_canvas_transform() * world_probe
	var picked = board.spatial_piece_at_screen(screen_probe)
	if picked == null:
		push_error("Spatial smoke: spatial picker returned no piece")
		quit(36)
		return

	board._try_begin_spatial_drag(-1, screen_probe)
	if int(board.spatial_active_piece_index) < 0:
		push_error("Spatial smoke: direct drag path did not activate")
		quit(37)
		return

	print(
		"Pieceful spatial smoke · %d pieces · %d native faces · %d collisions disabled · active %d"
		% [board.active_piece_count(), native_faces, disabled_hits, int(board.spatial_active_piece_index)]
	)
	quit(0)
