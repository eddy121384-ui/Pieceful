extends SceneTree

const MainScene = preload("res://main.tscn")
const TimelapseTraceScript = preload("res://scripts/timelapse_trace_v1.gd")
const TimelapseReplayPlanScript = preload("res://scripts/timelapse_replay_plan.gd")


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	var main = MainScene.instantiate()
	root.add_child(main)
	for _frame in range(12):
		await process_frame

	if not main.has_method("replay_presentation_snapshot"):
		_fail("timelapse replay main is not wired")
		return
	var snapshot: Dictionary = main.replay_presentation_snapshot()
	if not bool(snapshot.get("button_exists", false)):
		_fail("completion replay action is missing")
		return

	var trace: Dictionary = TimelapseTraceScript.build_trace("game-replay-smoke")
	var events: Array = trace["events"]
	events.append(TimelapseTraceScript.build_event(
		0, "start", 0, [0],
		{"positions": [{"piece_index": 0, "x": 0.08, "y": 0.12}]}
	))
	events.append(TimelapseTraceScript.build_event(
		1, "move", 12000, [0],
		{"positions": [{"piece_index": 0, "x": 0.28, "y": 0.34}]}
	))
	events.append(TimelapseTraceScript.build_event(2, "tray_in", 18000, [0], {"tray_id": "edges"}))
	events.append(TimelapseTraceScript.build_event(
		3, "tray_sort", 24000, [0],
		{"tray_id": "edges", "positions": [{"piece_index": 0, "x": 0.35, "y": 0.42}]}
	))
	events.append(TimelapseTraceScript.build_event(
		4, "tray_out", 30000, [0],
		{"tray_id": "edges", "positions": [{"piece_index": 0, "x": 0.52, "y": 0.46}]}
	))
	events.append(TimelapseTraceScript.build_event(5, "merge", 36000, [0, 1], {"cluster_size": 2}))
	events.append(TimelapseTraceScript.build_event(
		6, "snap", 44000, [0, 1],
		{"positions": [{"piece_index": 0, "x": 0.38, "y": 0.31}], "solved_count": 2}
	))
	events.append(TimelapseTraceScript.build_event(7, "complete", 72000, [], {"solved_count": 40}))
	trace["events"] = events

	if not TimelapseTraceScript.structurally_valid(trace):
		_fail("synthetic replay trace is structurally invalid")
		return

	main.call("_prepare_timelapse_replay", {"timelapse_trace": trace})
	snapshot = main.replay_presentation_snapshot()
	if bool(snapshot.get("button_disabled", true)):
		_fail("valid trace did not enable Replay")
		return
	if int(snapshot.get("trace_event_count", 0)) != events.size():
		_fail("Replay lost trace events")
		return
	if int(snapshot.get("plan_step_count", 0)) != events.size():
		_fail("Replay plan did not preserve semantic events")
		return
	var duration_ms := int(snapshot.get("plan_duration_ms", 0))
	if duration_ms < 8000 or duration_ms > 15000:
		_fail("Replay plan escaped the 8–15 second product envelope")
		return

	var plan: Dictionary = TimelapseReplayPlanScript.build(trace)
	var steps: Array = plan.get("steps", [])
	var move_hold := 0
	var complete_hold := 0
	for step_value in steps:
		if not (step_value is Dictionary):
			continue
		var event_value = step_value.get("event", {})
		if not (event_value is Dictionary):
			continue
		var kind := str(event_value.get("kind", ""))
		if kind == "move":
			move_hold = int(step_value.get("hold_ms", 0))
		elif kind == "complete":
			complete_hold = int(step_value.get("hold_ms", 0))
	if complete_hold <= move_hold:
		_fail("Final-piece beat is not weighted above routine movement")
		return

	main.call("_build_replay_piece_visuals")
	snapshot = main.replay_presentation_snapshot()
	var board = main.get_node_or_null("PuzzleBoard")
	if board == null or int(snapshot.get("visual_count", 0)) != board.pieces.size():
		_fail("Replay did not reconstruct one visual per runtime piece")
		return

	main.queue_free()
	await process_frame
	print("PASS timelapse_replay_smoke")
	quit(0)


func _fail(message: String) -> void:
	push_error("FAIL timelapse_replay_smoke: %s" % message)
	quit(1)
