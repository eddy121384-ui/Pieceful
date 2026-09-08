extends SceneTree


func _initialize() -> void:
	call_deferred("_run")


func _run() -> void:
	var packed := load("res://main.tscn") as PackedScene
	if packed == null:
		push_error("Batch smoke: main.tscn failed to load")
		quit(10)
		return

	var scene := packed.instantiate()
	get_root().add_child(scene)
	await process_frame
	await process_frame

	var board = scene.get_node_or_null("PuzzleBoard")
	if board == null:
		push_error("Batch smoke: PuzzleBoard missing")
		quit(11)
		return
	if not board.request_difficulty("hard"):
		push_error("Batch smoke: Hard difficulty failed")
		quit(12)
		return
	await process_frame

	if board.active_piece_count() < 250:
		push_error("Batch smoke: Hard piece count too low")
		quit(13)
		return
	if not board.has_method("batch_mode_enabled") or not board.batch_mode_enabled():
		push_error("Batch smoke: batch mode did not activate")
		quit(14)
		return

	var passive_count := 0
	for piece_value in board.pieces:
		var piece = piece_value
		if not is_instance_valid(piece) or bool(piece.solved):
			continue
		var face := piece.get_node_or_null("Face") as CanvasItem
		var hit := piece.get_node_or_null("HitArea") as CollisionPolygon2D
		if face != null and not face.visible and hit != null and hit.disabled:
			passive_count += 1
	if passive_count < 250:
		push_error("Batch smoke: passive piece conversion incomplete: %d" % passive_count)
		quit(15)
		return

	var test_piece = board.pieces[board.pieces.size() - 1]
	var world_probe: Vector2 = Vector2(test_piece.position) + Vector2(test_piece.piece_size) * 0.5
	var screen_probe: Vector2 = get_root().get_canvas_transform() * world_probe
	var picked = board.batched_piece_at_screen(screen_probe)
	if picked == null:
		push_error("Batch smoke: spatial picker returned no piece")
		quit(16)
		return

	print(
		"Pieceful batch smoke · %d pieces · %d passive · picked %d"
		% [board.active_piece_count(), passive_count, int(picked.piece_index)]
	)
	quit(0)
