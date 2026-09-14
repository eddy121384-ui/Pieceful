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

	# The global Journal destination must be recognizable without guessing an
	# icon, and it must occupy its own slot beside Unfinished puzzles.
	var entry_snapshot: Dictionary = main.journal_presentation_snapshot()
	if str(entry_snapshot.get("entry_text", "")) != "Journal":
		_fail("Journal top-bar entry is not explicitly labeled")
		return
	var entry_rect: Rect2 = entry_snapshot.get("entry_rect", Rect2())
	var games_rect: Rect2 = entry_snapshot.get("games_rect", Rect2())
	if entry_rect.size.x < 90.0 or entry_rect.size.y < 40.0:
		_fail("Journal top-bar entry is too small to discover/tap: %s" % entry_rect)
		return
	if games_rect.size.x > 0.0 and entry_rect.intersects(games_rect):
		_fail("Journal top-bar entry overlaps Unfinished puzzles: journal=%s games=%s" % [
			entry_rect,
			games_rect,
		])
		return
	if games_rect.size.x > 0.0 and entry_rect.position.x <= games_rect.end.x:
		_fail("Journal top-bar entry is not laid out after Unfinished puzzles")
		return

	coordinator.active_elapsed_seconds = 185.0
	coordinator.active_hints_used = 1
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
	var recent_text := str(snapshot.get("recent_text", ""))
	if not recent_text.contains("Hint used"):
		_fail("Journal did not use hint-assist wording: %s" % recent_text)
		return
	if recent_text.contains("1 hints") or recent_text.contains("hints used"):
		_fail("Journal leaked legacy numeric hint wording: %s" % recent_text)
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
