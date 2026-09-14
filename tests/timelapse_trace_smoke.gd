extends SceneTree

const MainScene = preload("res://main.tscn")
const TimelapseTraceScript = preload("res://scripts/timelapse_trace_v1.gd")
const JournalStoreScript = preload("res://scripts/puzzle_journal_store.gd")
const SAVE_DIR := "user://saves"
const LEGACY_SAVE := "user://pieceful_autosave_v1.json"
const GALLERY_STATE := "user://pieceful_gallery_state_v1.json"
const JOURNAL_PATH := "user://pieceful_journal_v1.json"


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	_clear_test_state()
	var main = MainScene.instantiate()
	root.add_child(main)
	for _frame in range(14):
		await process_frame

	var coordinator = main.get_node_or_null("SaveCoordinator")
	var board = main.get_node_or_null("PuzzleBoard")
	if coordinator == null or board == null:
		_fail("timelapse runtime nodes missing")
		return
	var game_id := str(coordinator.active_game())
	if game_id.is_empty():
		_fail("timelapse trace has no durable game id")
		return
	if not coordinator.ensure_timelapse_started():
		_fail("could not seed timelapse start state")
		return

	var trace: Dictionary = coordinator.timelapse_trace_snapshot()
	if not TimelapseTraceScript.structurally_valid(trace):
		_fail("seeded timelapse trace is structurally invalid")
		return
	var events: Array = trace.get("events", [])
	if events.size() != 1 or str(events[0].get("kind", "")) != "start":
		_fail("timelapse did not begin with exactly one start event")
		return
	var start_positions = events[0].get("payload", {}).get("positions", [])
	if not (start_positions is Array) or start_positions.size() != board.pieces.size():
		_fail("start event did not capture the initial chaos state")
		return

	coordinator.active_elapsed_seconds = 12.25
	if not coordinator.record_timelapse_event("move", [0], {}, true):
		_fail("could not record release-level move event")
		return
	if not coordinator.record_timelapse_event("merge", [0, 1], {"cluster_size": 2}):
		_fail("could not record cluster merge event")
		return
	if coordinator.timelapse_event_count() != 3:
		_fail("timelapse unexpectedly records more than semantic key events")
		return
	if not coordinator.save_now(true):
		_fail("could not persist timelapse session")
		return

	main.queue_free()
	await process_frame
	main = MainScene.instantiate()
	root.add_child(main)
	for _frame in range(14):
		await process_frame

	coordinator = main.get_node_or_null("SaveCoordinator")
	board = main.get_node_or_null("PuzzleBoard")
	if str(coordinator.active_game()) != game_id:
		_fail("timelapse resume changed durable game identity")
		return
	trace = coordinator.timelapse_trace_snapshot()
	if not TimelapseTraceScript.structurally_valid(trace):
		_fail("timelapse trace did not survive save/resume")
		return
	if coordinator.timelapse_event_count() != 3:
		_fail("timelapse event count changed across resume")
		return

	coordinator.active_elapsed_seconds = 22.0
	coordinator.record_timelapse_event("tray_in", [0, 1], {"tray_id": "tray_test"})
	coordinator.record_timelapse_event("tray_out", [0, 1], {"tray_id": "tray_test"}, true)
	coordinator.active_elapsed_seconds = 30.5
	main.call("_on_completed")
	await process_frame

	var record: Dictionary = coordinator.latest_completion_record()
	var completed_trace = record.get("timelapse_trace", {})
	if not TimelapseTraceScript.structurally_valid(completed_trace):
		_fail("immutable completion record did not retain timelapse trace")
		return
	var completed_events: Array = completed_trace.get("events", [])
	if completed_events.is_empty() or str(completed_events[-1].get("kind", "")) != "complete":
		_fail("completed timelapse trace does not end at final-piece completion")
		return
	if int(completed_events[-1].get("t_ms", 0)) < 30000:
		_fail("timelapse event time did not follow active elapsed play time")
		return

	var reloaded_journal = JournalStoreScript.new()
	var journal_record: Dictionary = reloaded_journal.completion_for_game(game_id)
	var journal_trace = journal_record.get("timelapse_trace", {})
	if not TimelapseTraceScript.structurally_valid(journal_trace):
		_fail("Puzzle Journal did not persist completed timelapse trace")
		return
	if journal_trace.get("events", []).size() != completed_events.size():
		_fail("Puzzle Journal timelapse trace changed after durable reload")
		return

	main.queue_free()
	await process_frame
	_clear_test_state()
	print("PASS timelapse_trace_smoke")
	quit(0)


func _clear_test_state() -> void:
	if FileAccess.file_exists(LEGACY_SAVE):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(LEGACY_SAVE))
	if FileAccess.file_exists(GALLERY_STATE):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(GALLERY_STATE))
	for suffix in ["", ".tmp", ".bak"]:
		var journal_path: String = JOURNAL_PATH + str(suffix)
		if FileAccess.file_exists(journal_path):
			DirAccess.remove_absolute(ProjectSettings.globalize_path(journal_path))
	var dir := DirAccess.open(SAVE_DIR)
	if dir == null:
		return
	for filename in dir.get_files():
		DirAccess.remove_absolute(ProjectSettings.globalize_path(SAVE_DIR.path_join(filename)))


func _fail(message: String) -> void:
	push_error("FAIL timelapse_trace_smoke: %s" % message)
	_clear_test_state()
	quit(1)
