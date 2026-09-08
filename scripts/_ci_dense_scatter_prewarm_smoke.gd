extends SceneTree


func _initialize() -> void:
	call_deferred("_run")


func _run() -> void:
	var packed := load("res://main.tscn") as PackedScene
	if packed == null:
		push_error("Prewarm smoke: main.tscn failed to load")
		quit(40)
		return

	var scene := packed.instantiate()
	get_root().add_child(scene)
	await process_frame
	await process_frame

	var board = scene.get_node_or_null("PuzzleBoard")
	var workspace = scene.get_node_or_null("SortingWorkspace")
	if board == null or workspace == null:
		push_error("Prewarm smoke: required nodes missing")
		quit(41)
		return
	if not board.request_difficulty("hard"):
		push_error("Prewarm smoke: Hard difficulty failed")
		quit(42)
		return
	await process_frame

	workspace._set_loose_layout_mode("rail")
	await create_timer(0.45).timeout
	workspace._set_loose_layout_mode("scatter")
	await process_frame

	if workspace.layout_transition_target_mode != "scatter":
		push_error("Prewarm smoke: Scatter transition did not start")
		quit(43)
		return
	if workspace.dense_prewarm_members.size() < 250:
		push_error("Prewarm smoke: insufficient prewarm members: %d" % workspace.dense_prewarm_members.size())
		quit(44)
		return

	await create_timer(0.40).timeout
	var visible_loose := 0
	var opaque_loose := 0
	for piece_value in board.pieces:
		var piece = piece_value
		if not is_instance_valid(piece) or bool(piece.solved):
			continue
		if piece.visible:
			visible_loose += 1
			if piece.modulate.a > 0.99:
				opaque_loose += 1

	if visible_loose < 250 or opaque_loose < 250:
		push_error("Prewarm smoke: Scatter restore incomplete: visible=%d opaque=%d" % [visible_loose, opaque_loose])
		quit(45)
		return

	print("Pieceful prewarm smoke · visible %d · opaque %d" % [visible_loose, opaque_loose])
	quit(0)
