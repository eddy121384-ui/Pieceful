extends SceneTree

const MainScene = preload("res://main.tscn")
const SAVE_DIR := "user://saves"
const LEGACY_SAVE := "user://pieceful_autosave_v1.json"


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	_clear_test_saves()

	var main = MainScene.instantiate()
	root.add_child(main)
	for _frame in range(12):
		await process_frame

	var coordinator = main.get_node_or_null("SaveCoordinator")
	var board = main.get_node_or_null("PuzzleBoard")
	if coordinator == null or board == null:
		_fail("runtime nodes missing")
		return

	var first_id := str(coordinator.active_game())
	if first_id.is_empty() or not coordinator.save_now(true):
		_fail("could not persist first identity-bound slot")
		return
	var first_path := _slot_path(first_id)
	var first_snapshot = _read_json(first_path)
	if not (first_snapshot is Dictionary):
		_fail("first slot JSON missing")
		return
	var first_puzzle = first_snapshot.get("puzzle", {})
	var first_identity = first_puzzle.get("content_identity", {}) if first_puzzle is Dictionary else {}
	if not board.content_identity_structurally_valid(first_identity):
		_fail("new slot did not persist a structurally valid content identity")
		return
	if not board.content_identity_matches(first_identity):
		_fail("new slot identity does not match the active artwork")
		return
	if str(first_identity.get("sha256", "")).length() != 64:
		_fail("content SHA-256 is not 64 hex characters")
		return
	var first_meta := _metadata_for(coordinator.list_unfinished_games(), first_id)
	if str(first_meta.get("content_key", "")) != str(first_identity.get("content_key", "")):
		_fail("index metadata did not inherit the durable content key")
		return

	# Create a second healthy slot so startup has a safe fallback after the first
	# slot is deliberately made content-incompatible.
	main.call("_start_new_game_slot")
	for _frame in range(4):
		await process_frame
	var second_id := str(coordinator.active_game())
	if second_id.is_empty() or second_id == first_id or not coordinator.save_now(true):
		_fail("could not create second identity-bound slot")
		return

	main.queue_free()
	await process_frame

	# Keep every old compatibility field unchanged and tamper only the artwork
	# fingerprint. A save system that keys on difficulty/pattern/piece count would
	# incorrectly accept this; #3-E must reject it before applying piece state.
	first_snapshot = _read_json(first_path)
	first_puzzle = first_snapshot.get("puzzle", {})
	var fake_digest := "0".repeat(64)
	first_identity = first_puzzle.get("content_identity", {})
	first_identity["sha256"] = fake_digest
	first_identity["content_key"] = "sha256:%s" % fake_digest
	first_puzzle["content_identity"] = first_identity
	first_snapshot["puzzle"] = first_puzzle
	if not _write_json(first_path, first_snapshot):
		_fail("could not inject mismatched content identity")
		return
	var index = _read_json(SAVE_DIR.path_join("index.json"))
	if not (index is Dictionary):
		_fail("save index missing before mismatch relaunch")
		return
	index["active_game_id"] = first_id
	if not _write_json(SAVE_DIR.path_join("index.json"), index):
		_fail("could not point index at mismatched slot")
		return

	main = MainScene.instantiate()
	root.add_child(main)
	for _frame in range(14):
		await process_frame
	coordinator = main.get_node_or_null("SaveCoordinator")
	board = main.get_node_or_null("PuzzleBoard")
	if coordinator == null or board == null:
		_fail("runtime missing after mismatch relaunch")
		return
	if str(coordinator.active_game()) != second_id:
		_fail("content-mismatched active slot did not fall back to healthy slot")
		return
	if coordinator.list_unfinished_games().size() != 1:
		_fail("mismatched content slot remained in unfinished games")
		return
	if FileAccess.file_exists(first_path):
		_fail("mismatched content slot was not removed from active save storage")
		return
	if not _quarantine_contains(first_id, "content-identity-mismatch"):
		_fail("mismatched slot was not preserved in quarantine")
		return

	# Build a real pre-#3-E fixture from the healthy current slot. Old saves never
	# had content_identity because every historical build used demo_garden.svg.
	if not coordinator.save_now(true):
		_fail("could not persist legacy-upgrade fixture")
		return
	var legacy_fixture = _read_json(_slot_path(second_id))
	if not (legacy_fixture is Dictionary):
		_fail("legacy fixture slot missing")
		return
	var legacy_puzzle = legacy_fixture.get("puzzle", {})
	if not (legacy_puzzle is Dictionary):
		_fail("legacy fixture puzzle metadata missing")
		return
	legacy_puzzle.erase("content_identity")
	legacy_fixture["puzzle"] = legacy_puzzle

	main.queue_free()
	await process_frame
	_clear_test_saves()
	if not _write_json(LEGACY_SAVE, legacy_fixture):
		_fail("could not write pre-identity legacy fixture")
		return

	main = MainScene.instantiate()
	root.add_child(main)
	for _frame in range(14):
		await process_frame
	coordinator = main.get_node_or_null("SaveCoordinator")
	board = main.get_node_or_null("PuzzleBoard")
	if coordinator == null or board == null:
		_fail("runtime missing after legacy identity migration")
		return
	var migrated_id := str(coordinator.active_game())
	if migrated_id.is_empty():
		_fail("legacy identity migration did not create an active durable slot")
		return
	var migrated = _read_json(_slot_path(migrated_id))
	var migrated_puzzle = migrated.get("puzzle", {}) if migrated is Dictionary else {}
	var migrated_identity = migrated_puzzle.get("content_identity", {}) if migrated_puzzle is Dictionary else {}
	if not board.content_identity_matches(migrated_identity):
		_fail("legacy save was not upgraded to the active content fingerprint")
		return
	var migrated_meta := _metadata_for(coordinator.list_unfinished_games(), migrated_id)
	if str(migrated_meta.get("content_key", "")).is_empty():
		_fail("legacy migration did not upgrade index content metadata")
		return

	main.queue_free()
	await process_frame
	_clear_test_saves()
	print("PASS content_identity_save_smoke")
	quit(0)


func _slot_path(game_id: String) -> String:
	return SAVE_DIR.path_join("%s.json" % game_id)


func _metadata_for(rows: Array, game_id: String) -> Dictionary:
	for value in rows:
		if value is Dictionary and str(value.get("game_id", "")) == game_id:
			return value
	return {}


func _read_json(path: String):
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return null
	var encoded := file.get_as_text()
	file.close()
	return JSON.parse_string(encoded)


func _write_json(path: String, value: Dictionary) -> bool:
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(JSON.stringify(value, "  "))
	file.flush()
	file.close()
	return true


func _quarantine_contains(game_id: String, reason: String) -> bool:
	var quarantine := DirAccess.open(SAVE_DIR.path_join("quarantine"))
	if quarantine == null:
		return false
	for filename in quarantine.get_files():
		if filename.begins_with("%s.json." % game_id) and filename.ends_with(reason):
			return true
	return false


func _clear_test_saves() -> void:
	if FileAccess.file_exists(LEGACY_SAVE):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(LEGACY_SAVE))
	_remove_tree(SAVE_DIR)


func _remove_tree(path: String) -> void:
	var dir := DirAccess.open(path)
	if dir == null:
		return
	for child_dir in dir.get_directories():
		_remove_tree(path.path_join(child_dir))
	for filename in dir.get_files():
		DirAccess.remove_absolute(ProjectSettings.globalize_path(path.path_join(filename)))
	DirAccess.remove_absolute(ProjectSettings.globalize_path(path))


func _fail(message: String) -> void:
	push_error("FAIL content_identity_save_smoke: %s" % message)
	quit(1)
