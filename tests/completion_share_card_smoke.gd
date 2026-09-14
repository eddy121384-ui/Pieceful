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

	if not main.has_method("share_card_presentation_snapshot"):
		_fail("Completion share-card presentation is not wired")
		return
	var initial: Dictionary = main.share_card_presentation_snapshot()
	if not bool(initial.get("button_exists", false)):
		_fail("Share result button was not created")
		return
	if str(initial.get("button_text", "")) != "Share result":
		_fail("Share result action is not discoverable")
		return

	var coordinator = main.get_node_or_null("SaveCoordinator")
	if coordinator == null:
		_fail("SaveCoordinator missing")
		return
	coordinator.active_elapsed_seconds = 125.0
	coordinator.active_hints_used = 0
	main.call("_on_completed")
	await process_frame

	var record: Dictionary = coordinator.latest_completion_record()
	var expected_pieces := int(record.get("pieces_placed", record.get("piece_count", 0)))
	if expected_pieces <= 0:
		_fail("Completion record did not expose a valid piece count")
		return

	var snapshot: Dictionary = main.share_card_presentation_snapshot()
	var payload_value = snapshot.get("payload", {})
	if not (payload_value is Dictionary):
		_fail("Share-card payload was not created")
		return
	var payload: Dictionary = payload_value
	if str(payload.get("title", "")) != "Puzzle complete":
		_fail("Share-card title drifted")
		return
	if not str(payload.get("primary", "")).contains("%d pieces" % expected_pieces):
		_fail("Share-card primary stats omitted image-aware piece count")
		return
	if not str(payload.get("primary", "")).contains("2m 05s"):
		_fail("Share-card primary stats omitted elapsed time")
		return
	if not str(payload.get("primary", "")).contains("Relaxed"):
		_fail("Share-card primary stats omitted difficulty")
		return
	if not str(payload.get("secondary", "")).contains("Hint-free"):
		_fail("Share-card hint-free semantics drifted")
		return
	if not bool(payload.get("explicit_only", false)):
		_fail("Private Puzzle Me sharing must remain explicit-only")
		return
	if int(snapshot.get("share_invocation_count", -1)) != 0:
		_fail("Completion automatically invoked sharing without user action")
		return
	if not str(payload.get("filename", "")).ends_with(".png"):
		_fail("Share-card filename is not PNG")
		return

	main.queue_free()
	await process_frame
	_clear_test_state()
	print("PASS completion_share_card_smoke")
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
	push_error("FAIL completion_share_card_smoke: %s" % message)
	_clear_test_state()
	quit(1)
