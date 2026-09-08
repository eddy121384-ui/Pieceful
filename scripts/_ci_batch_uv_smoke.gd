extends SceneTree


func _initialize() -> void:
	call_deferred("_run")


func _run() -> void:
	var packed := load("res://main.tscn") as PackedScene
	if packed == null:
		push_error("Batch UV smoke: main.tscn failed to load")
		quit(20)
		return

	var scene := packed.instantiate()
	get_root().add_child(scene)
	await process_frame
	await process_frame

	var board = scene.get_node_or_null("PuzzleBoard")
	if board == null or not board.request_difficulty("hard"):
		push_error("Batch UV smoke: Hard runtime unavailable")
		quit(21)
		return
	await process_frame

	var renderer = board.get_node_or_null("ChaosOrderBatchRenderer")
	if renderer == null or not renderer.has_method("normalized_uvs_for_piece"):
		push_error("Batch UV smoke: renderer/helper missing")
		quit(22)
		return

	var checked := 0
	var distinct := false
	for piece_value in board.pieces:
		var piece = piece_value
		if not is_instance_valid(piece) or bool(piece.solved):
			continue
		var uvs: PackedVector2Array = renderer.normalized_uvs_for_piece(piece)
		if uvs.size() != piece.polygon_points.size() or uvs.is_empty():
			push_error("Batch UV smoke: UV count mismatch")
			quit(23)
			return
		var first: Vector2 = uvs[0]
		for uv in uvs:
			if uv.x < -0.001 or uv.y < -0.001 or uv.x > 1.001 or uv.y > 1.001:
				push_error("Batch UV smoke: UV out of normalized range: %s" % uv)
				quit(24)
				return
			if not Vector2(uv).is_equal_approx(first):
				distinct = true
		checked += 1
		if checked >= 32:
			break

	if checked < 1 or not distinct:
		push_error("Batch UV smoke: UVs collapsed or no pieces checked")
		quit(25)
		return

	print("Pieceful batch UV smoke · %d pieces checked · normalized UVs valid" % checked)
	quit(0)
