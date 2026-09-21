extends SceneTree

const MainScene = preload("res://main.tscn")
const RECOMMENDATION_STATE := "user://pieceful_recommendation_v1.json"


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	_clear_recommendation_state()
	var main = MainScene.instantiate()
	root.add_child(main)
	for _frame in range(20):
		await process_frame

	var analytics = main.get_node_or_null("Analytics")
	var coordinator = main.get_node_or_null("SaveCoordinator")
	var workspace = main.get_node_or_null("SortingWorkspace")
	if analytics == null or coordinator == null or workspace == null:
		_fail("Analytics integration nodes are not wired")
		return
	if not main.has_method("analytics_contract_snapshot"):
		_fail("AnalyticsMain wrapper is not active")
		return

	var contract: Dictionary = main.analytics_contract_snapshot()
	if int(contract.get("schema_version", 0)) != 1:
		_fail("Analytics schema version is not V1")
		return
	if bool(contract.get("remote_provider_enabled", true)):
		_fail("Remote analytics must remain disabled in foundation slice")
		return

	if _event_count(main, "app_open") != 1:
		_fail("app_open was not emitted exactly once")
		return

	var private_props: Dictionary = main.call("_analytics_content_properties", "local_photo:test-private")
	if str(private_props.get("content_kind", "")) != "puzzle_me":
		_fail("AnalyticsMain did not classify Puzzle Me content as private")
		return
	if private_props.has("content_id"):
		_fail("AnalyticsMain exposed private Puzzle Me content id")
		return

	# Exercise Sorting Workspace signal sources through their real user-action
	# handlers. These should describe usage, never tray names or piece image data.
	workspace.call("_on_sort_toggled", true)
	if _event_count(main, "sorting_table_opened") != 1:
		_fail("opening Sorting Workspace did not emit analytics")
		return
	var new_tray_name = workspace.get("new_tray_name")
	if new_tray_name is LineEdit:
		(new_tray_name as LineEdit).text = "Edges"
	workspace.call("_create_tray_from_field")
	if _event_count(main, "tray_created") != 1:
		_fail("creating a tray did not emit analytics")
		return
	workspace.emit_signal("analytics_piece_moved_to_tray", 2, 1, _piece_count(main))
	if _event_count(main, "piece_moved_to_tray") != 1:
		_fail("piece-to-tray analytics signal is not wired")
		return

	# The hint signal must reflect first assist, not renderer exposure count.
	var selection_overlay = main.get("puzzle_selection_overlay")
	if selection_overlay is Control:
		(selection_overlay as Control).visible = false
	var completion_panel = main.get("completion_panel")
	if completion_panel is Control:
		(completion_panel as Control).visible = false
	var sessions_panel = main.get("sessions_panel")
	if sessions_panel is Control:
		(sessions_panel as Control).visible = false
	coordinator.call("record_hint_use", 0)
	coordinator.call("record_hint_use", 0)
	if _event_count(main, "hint_used") != 1:
		_fail("hint-assisted analytics was not exactly-once per game")
		return
	var recommendation_snapshot: Dictionary = main.recommendation_profile_snapshot()
	var recommendation_events: Dictionary = recommendation_snapshot.get("event_counts", {})
	if int(recommendation_events.get("hint", 0)) != 1:
		_fail("first hint was not forwarded to the local recommendation profile")
		return

	# Create a second durable slot, resume the first, then explicitly delete the
	# inactive second slot. Explicit deletion is the V0-09 definition of abandon;
	# backgrounding or simply switching puzzles is not.
	var first_game_id := str(coordinator.call("active_game"))
	if first_game_id.is_empty():
		_fail("clean bootstrap did not own an active game id")
		return
	var second_game_id := str(coordinator.call("create_slot_for_current_runtime"))
	if second_game_id.is_empty() or second_game_id == first_game_id:
		_fail("could not create a second game slot for analytics resume test")
		return
	await main.call("_on_resume_game_pressed", first_game_id)
	if str(coordinator.call("active_game")) != first_game_id:
		_fail("resume analytics fixture did not restore the first game")
		return
	if _event_count(main, "puzzle_resume") < 1:
		_fail("successful resume did not emit puzzle_resume")
		return
	main.call("_on_delete_game_pressed", second_game_id)
	if _event_count(main, "puzzle_abandon") != 1:
		_fail("explicit unfinished-puzzle deletion did not emit puzzle_abandon")
		return
	recommendation_snapshot = main.recommendation_profile_snapshot()
	recommendation_events = recommendation_snapshot.get("event_counts", {})
	if int(recommendation_events.get("abandon", 0)) != 1:
		_fail("explicit abandon was not forwarded to the local recommendation profile")
		return

	# A real completion prepares a semantic replay. Pressing Replay should become
	# a positive local-preference signal only when replay actually starts.
	coordinator.call("ensure_timelapse_started")
	main.call("_on_completed")
	await process_frame
	var before_replay_serial := int(main.timelapse_play_serial)
	main.call("_on_timelapse_replay_pressed")
	if int(main.timelapse_play_serial) <= before_replay_serial:
		_fail("replay integration fixture did not start a replay")
		return
	recommendation_snapshot = main.recommendation_profile_snapshot()
	recommendation_events = recommendation_snapshot.get("event_counts", {})
	if int(recommendation_events.get("replay", 0)) != 1:
		_fail("replay was not forwarded to the local recommendation profile")
		return
	main.call("_close_timelapse_replay")

	if str(main.call("_analytics_progress_bucket", 0, 100)) != "0":
		_fail("0%% progress bucket is wrong")
		return
	if str(main.call("_analytics_progress_bucket", 24, 100)) != "1-24":
		_fail("1-24%% progress bucket is wrong")
		return
	if str(main.call("_analytics_progress_bucket", 50, 100)) != "50-74":
		_fail("50-74%% progress bucket is wrong")
		return
	if str(main.call("_analytics_progress_bucket", 100, 100)) != "100":
		_fail("100%% progress bucket is wrong")
		return

	main.queue_free()
	await process_frame
	_clear_recommendation_state()
	print("PASS analytics_integration_smoke")
	quit(0)


func _event_count(main, event_name: String) -> int:
	var count := 0
	var events: Array = main.analytics_events_snapshot()
	for event_value in events:
		if event_value is Dictionary and str(event_value.get("name", "")) == event_name:
			count += 1
	return count


func _piece_count(main) -> int:
	var board = main.get_node_or_null("PuzzleBoard")
	if board == null:
		return 0
	var pieces = board.get("pieces")
	return pieces.size() if pieces is Array else 0


func _clear_recommendation_state() -> void:
	if FileAccess.file_exists(RECOMMENDATION_STATE):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(RECOMMENDATION_STATE))


func _fail(message: String) -> void:
	push_error("FAIL analytics_integration_smoke: %s" % message)
	_clear_recommendation_state()
	quit(1)
