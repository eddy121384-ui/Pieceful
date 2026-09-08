extends SceneTree


func _initialize() -> void:
	call_deferred("_run")


func _run() -> void:
	var packed := load("res://main.tscn") as PackedScene
	if packed == null:
		push_error("Stress 400 smoke: main.tscn failed to load")
		quit(40)
		return

	var scene := packed.instantiate()
	get_root().add_child(scene)
	await process_frame
	await process_frame

	var board = scene.get_node_or_null("PuzzleBoard")
	var workspace = scene.get_node_or_null("SortingWorkspace")
	if board == null or workspace == null:
		push_error("Stress 400 smoke: runtime nodes missing")
		quit(41)
		return

	var started_ms: int = Time.get_ticks_msec()
	if not board.request_difficulty("stress_400"):
		push_error("Stress 400 smoke: difficulty request failed: %s" % str(board.last_difficulty_error))
		quit(42)
		return
	await process_frame
	await process_frame

	if board.active_piece_count() != 400:
		push_error("Stress 400 smoke: expected 400 pieces, got %d" % board.active_piece_count())
		quit(43)
		return
	if not board.has_method("spatial_mode_enabled") or not board.spatial_mode_enabled():
		push_error("Stress 400 smoke: spatial picker did not activate")
		quit(44)
		return

	workspace._set_loose_layout_mode("rail")
	await create_timer(0.55).timeout
	if str(workspace.loose_layout_mode) != "rail":
		push_error("Stress 400 smoke: Rail switch failed")
		quit(45)
		return

	workspace._set_loose_layout_mode("scatter")
	await create_timer(0.65).timeout
	if str(workspace.loose_layout_mode) != "scatter":
		push_error("Stress 400 smoke: Scatter switch failed")
		quit(46)
		return

	var restored := 0
	for piece_value in board.pieces:
		var piece = piece_value
		if not is_instance_valid(piece) or bool(piece.solved):
			continue
		if bool(piece.visible) and float(piece.modulate.a) > 0.99:
			restored += 1
	if restored < 390:
		push_error("Stress 400 smoke: only %d pieces restored to Scatter" % restored)
		quit(47)
		return

	print(
		"Pieceful Stress 400 smoke · %d pieces · Rail/Scatter restored %d · total %d ms"
		% [board.active_piece_count(), restored, Time.get_ticks_msec() - started_ms]
	)
	quit(0)
