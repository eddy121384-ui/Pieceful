extends SceneTree


func _initialize() -> void:
	call_deferred("_run")


func _run() -> void:
	var packed := load("res://main.tscn") as PackedScene
	if packed == null:
		push_error("Dense Rail initial-view smoke: main.tscn failed to load")
		quit(70)
		return

	var scene := packed.instantiate()
	get_root().add_child(scene)
	await process_frame
	await process_frame

	var board = scene.get_node_or_null("PuzzleBoard")
	var workspace = scene.get_node_or_null("SortingWorkspace")
	if board == null or workspace == null:
		push_error("Dense Rail initial-view smoke: runtime nodes missing")
		quit(71)
		return

	if not board.request_difficulty("stress_576"):
		push_error("Dense Rail initial-view smoke: Stress 576 request failed")
		quit(72)
		return
	await process_frame
	await process_frame

	workspace._set_loose_layout_mode("rail")
	# Deliberately do not scroll. The regression was that only ~4 pieces appeared
	# on first entry and the rest materialized only after a scrollbar value change.
	await create_timer(0.45).timeout

	var rail_canvas = workspace.rail_canvas
	if rail_canvas == null:
		push_error("Dense Rail initial-view smoke: rail canvas missing")
		quit(73)
		return
	var visual_count: int = int(rail_canvas.visual_nodes.size())
	if visual_count <= 4:
		push_error(
			"Dense Rail initial-view smoke: only %d visuals without scrolling" % visual_count
		)
		quit(74)
		return

	print(
		"Pieceful dense Rail initial-view smoke · 576 members · %d visuals without scrolling"
		% visual_count
	)
	quit(0)
