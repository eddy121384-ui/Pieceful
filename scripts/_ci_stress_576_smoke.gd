extends SceneTree


func _initialize() -> void:
	call_deferred("_run")


func _run() -> void:
	var packed := load("res://main.tscn") as PackedScene
	if packed == null:
		push_error("Stress 576 smoke: main.tscn failed to load")
		quit(60)
		return

	var scene := packed.instantiate()
	get_root().add_child(scene)
	await process_frame
	await process_frame

	var board = scene.get_node_or_null("PuzzleBoard")
	var workspace = scene.get_node_or_null("SortingWorkspace")
	if board == null or workspace == null:
		push_error("Stress 576 smoke: runtime nodes missing")
		quit(61)
		return

	var started_ms: int = Time.get_ticks_msec()
	if not board.request_difficulty("stress_576"):
		push_error("Stress 576 smoke: difficulty request failed: %s" % str(board.last_difficulty_error))
		quit(62)
		return
	await process_frame
	await process_frame

	if board.active_piece_count() != 576:
		push_error("Stress 576 smoke: expected 576 pieces, got %d" % board.active_piece_count())
		quit(63)
		return
	if not board.has_method("spatial_mode_enabled") or not board.spatial_mode_enabled():
		push_error("Stress 576 smoke: spatial picker did not activate")
		quit(64)
		return

	var picked = null
	for piece_value in board.pieces:
		var piece = piece_value
		if not is_instance_valid(piece) or bool(piece.solved):
			continue
		var world_point: Vector2 = Vector2(piece.position) + Vector2(piece.piece_size) * 0.5
		var screen_point: Vector2 = get_root().get_canvas_transform() * world_point
		picked = board.spatial_piece_at_screen(screen_point)
		if picked != null:
			break
	if picked == null:
		push_error("Stress 576 smoke: spatial picker could not resolve a piece")
		quit(65)
		return

	for round_index in range(2):
		workspace._set_loose_layout_mode("rail")
		await create_timer(0.55).timeout
		if str(workspace.loose_layout_mode) != "rail":
			push_error("Stress 576 smoke: Rail switch failed in round %d" % round_index)
			quit(66)
			return

		workspace._set_loose_layout_mode("scatter")
		await create_timer(0.70).timeout
		if str(workspace.loose_layout_mode) != "scatter":
			push_error("Stress 576 smoke: Scatter switch failed in round %d" % round_index)
			quit(67)
			return

	var restored := 0
	for piece_value in board.pieces:
		var piece = piece_value
		if not is_instance_valid(piece) or bool(piece.solved):
			continue
		if bool(piece.visible) and float(piece.modulate.a) > 0.99:
			restored += 1
	if restored < 566:
		push_error("Stress 576 smoke: only %d pieces restored to Scatter" % restored)
		quit(68)
		return

	print(
		"Pieceful Stress 576 smoke · %d pieces · picker OK · 2 Rail/Scatter rounds · restored %d · total %d ms"
		% [board.active_piece_count(), restored, Time.get_ticks_msec() - started_ms]
	)
	quit(0)
