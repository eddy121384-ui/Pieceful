extends SceneTree

const MainScene = preload("res://main.tscn")
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
	if coordinator == null or not main.has_method("journal_presentation_snapshot"):
		_fail("Puzzle Journal presentation is not wired")
		return

	coordinator.active_elapsed_seconds = 185.0
	coordinator.active_hints_used = 0
	main.call("_on_completed")
	await process_frame
	main.call("_toggle_journal")
	await process_frame

	var snapshot: Dictionary = main.journal_presentation_snapshot()
	if not bool(snapshot.get("visible", false)):
		_fail("Puzzle Journal did not open")
		return
	if not str(snapshot.get("today", "")).contains("1 completed"):
		_fail("Today summary did not include the completed puzzle")
		return
	if not str(snapshot.get("today", "")).contains("3m 05s"):
		_fail("Today summary did not include elapsed puzzle time")
		return
	if not str(snapshot.get("week", "")).contains("1 completed"):
		_fail("This week summary did not include the completed puzzle")
		return
	if int(snapshot.get("recent_count", 0)) != 1:
		_fail("recent completion history did not render one card")
		return
	if bool(snapshot.get("empty_visible", true)):
		_fail("empty Journal state remained visible with history")
		return

	main.call("_close_journal")
	await process_frame
	if bool(main.journal_presentation_snapshot().get("visible", true)):
		_fail("Puzzle Journal did not close")
		return

	main.queue_free()
	await process_frame
	_clear_test_state()
	print("PASS puzzle_journal_ui_smoke")
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
	push_error("FAIL puzzle_journal_ui_smoke: %s" % message)
	_clear_test_state()
	quit(1)
