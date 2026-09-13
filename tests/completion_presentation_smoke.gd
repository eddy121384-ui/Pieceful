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
	if coordinator == null or not main.has_method("completion_presentation_snapshot"):
		_fail("completion presentation runtime is not wired")
		return

	coordinator.active_elapsed_seconds = 3661.0
	coordinator.active_hints_used = 0
	main.call("_on_completed")
	await process_frame

	var snapshot: Dictionary = main.completion_presentation_snapshot()
	if not bool(snapshot.get("visible", false)):
		_fail("completion summary is not visible")
		return
	if str(snapshot.get("heading", "")) != "Puzzle complete":
		_fail("completion heading mismatch")
		return
	if str(snapshot.get("artwork_label", "")).is_empty():
		_fail("completion artwork label is empty")
		return
	if not bool(snapshot.get("has_artwork", false)):
		_fail("completion card has no finished artwork")
		return
	var primary := str(snapshot.get("primary_stats", ""))
	if not primary.contains("40 pieces") or not primary.contains("1h 01m"):
		_fail("completion primary facts are incomplete: %s" % primary)
		return
	var secondary := str(snapshot.get("secondary_stats", ""))
	if not secondary.contains("Hint-free"):
		_fail("hint-free completion fact is not presented")
		return
	if not secondary.contains("."):
		_fail("completion date is not presented")
		return

	# Regression for iPhone Safari: Pieceful intentionally keeps a 1280x720
	# logical Godot viewport, so the completion card must use browser orientation
	# rather than assume this logical rectangle means landscape. The reveal should
	# also stay generous enough that the finished artwork feels like the reward,
	# not a tiny thumbnail.
	main.call(
		"_apply_completion_layout_for_orientation",
		Vector2(1280.0, 720.0),
		Vector2(390.0, 844.0)
	)
	snapshot = main.completion_presentation_snapshot()
	var portrait_panel: Vector2 = snapshot.get("panel_size", Vector2.ZERO)
	var portrait_artwork: Vector2 = snapshot.get("artwork_minimum_size", Vector2.ZERO)
	if portrait_panel.x < 356.0 or portrait_panel.x > 364.0:
		_fail("portrait Safari completion card width drifted: %s" % portrait_panel)
		return
	if portrait_panel.y < 546.0 or portrait_panel.y > 554.0:
		_fail("portrait Safari completion card height drifted: %s" % portrait_panel)
		return
	if portrait_artwork.x < 332.0 or portrait_artwork.x > 340.0:
		_fail("portrait Safari completion artwork is not prominent enough: %s" % portrait_artwork)
		return
	if portrait_artwork.y < 238.0 or portrait_artwork.y > 248.0:
		_fail("portrait Safari completion artwork height drifted: %s" % portrait_artwork)
		return

	# Landscape / desktop keeps the larger presentation rather than permanently
	# inheriting the portrait metrics after an orientation change.
	main.call(
		"_apply_completion_layout_for_orientation",
		Vector2(1280.0, 720.0),
		Vector2(844.0, 390.0)
	)
	snapshot = main.completion_presentation_snapshot()
	var landscape_panel: Vector2 = snapshot.get("panel_size", Vector2.ZERO)
	if landscape_panel.x < 500.0:
		_fail("landscape completion card did not restore wide layout")
		return

	main.call("_on_completion_next_pressed")
	await process_frame
	if main.completion_panel.visible:
		_fail("completion card remained visible after choosing the next puzzle")
		return
	if main.puzzle_selection_overlay == null or not main.puzzle_selection_overlay.visible:
		_fail("next-puzzle action did not open Gallery")
		return
	if main.puzzle_selection_cancel != null and main.puzzle_selection_cancel.visible:
		_fail("post-completion Gallery should not cancel back into a retired game")
		return

	main.queue_free()
	await process_frame
	_clear_test_state()
	print("PASS completion_presentation_smoke")
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
	push_error("FAIL completion_presentation_smoke: %s" % message)
	_clear_test_state()
	quit(1)
