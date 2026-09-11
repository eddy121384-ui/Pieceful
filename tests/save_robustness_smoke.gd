extends SceneTree

const MainScene = preload("res://main.tscn")
const SAVE_DIR := "user://saves"
const INDEX_PATH := "user://saves/index.json"
const QUARANTINE_DIR := "user://saves/quarantine"
const LEGACY_SAVE := "user://pieceful_autosave_v1.json"


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	_clear_test_saves()
	if not await _test_lifecycle_and_exit_flush():
		return

	_clear_test_saves()
	if not await _test_corrupt_index_rebuild():
		return

	_clear_test_saves()
	if not await _test_corrupt_active_slot_fallback():
		return

	_clear_test_saves()
	if not await _test_interrupted_replace_backup_recovery():
		return

	_clear_test_saves()
	print("PASS save_robustness_smoke")
	quit(0)


func _test_lifecycle_and_exit_flush() -> bool:
	var main = await _spawn_main()
	var coordinator = main.get_node_or_null("SaveCoordinator")
	var board = main.get_node_or_null("PuzzleBoard")
	if coordinator == null or board == null:
		return _fail_bool("lifecycle test runtime missing")
	var game_id := str(coordinator.active_game())
	if game_id.is_empty():
		return _fail_bool("lifecycle test has no active game")
	var slot_path := SAVE_DIR.path_join("%s.json" % game_id)

	# Simulate app backgrounding before the 2.5-second timer can run.
	var paused_z := int(board.z_counter) + 137
	board.z_counter = paused_z
	coordinator.notification(MainLoop.NOTIFICATION_APPLICATION_PAUSED)
	var paused_snapshot = _read_json_dictionary(slot_path)
	if not (paused_snapshot is Dictionary):
		return _fail_bool("pause notification did not leave a readable slot")
	if int(paused_snapshot.get("board", {}).get("z_counter", -1)) != paused_z:
		return _fail_bool("pause notification did not flush dirty runtime state")

	# Then dirty the runtime again and tear down the whole product scene. _exit_tree
	# must close the second gap even without another platform notification.
	var exit_z := paused_z + 211
	board.z_counter = exit_z
	main.queue_free()
	await process_frame
	await process_frame
	var exit_snapshot = _read_json_dictionary(slot_path)
	if not (exit_snapshot is Dictionary):
		return _fail_bool("exit-tree flush did not leave a readable slot")
	if int(exit_snapshot.get("board", {}).get("z_counter", -1)) != exit_z:
		return _fail_bool("exit-tree flush missed the last dirty state")
	if FileAccess.file_exists(slot_path + ".tmp") or FileAccess.file_exists(slot_path + ".bak"):
		return _fail_bool("normal atomic slot write left transaction debris")
	if FileAccess.file_exists(INDEX_PATH + ".tmp") or FileAccess.file_exists(INDEX_PATH + ".bak"):
		return _fail_bool("normal atomic index write left transaction debris")
	return true


func _test_corrupt_index_rebuild() -> bool:
	var main = await _spawn_main()
	var coordinator = main.get_node_or_null("SaveCoordinator")
	if coordinator == null:
		return _fail_bool("index rebuild coordinator missing")
	var first_id := str(coordinator.active_game())
	main.call("_start_new_game_slot")
	for _frame in range(3):
		await process_frame
	var second_id := str(coordinator.active_game())
	if first_id.is_empty() or second_id.is_empty() or first_id == second_id:
		return _fail_bool("index rebuild fixture did not create two games")
	if not coordinator.save_now(true):
		return _fail_bool("index rebuild fixture could not save active slot")
	main.queue_free()
	await process_frame
	await process_frame

	# Destroy only the index. The per-game payloads remain valid and must be
	# rediscovered instead of disappearing from the product.
	if not _write_raw_text(INDEX_PATH, "{ definitely-not-json"):
		return _fail_bool("could not corrupt index fixture")
	main = await _spawn_main()
	coordinator = main.get_node_or_null("SaveCoordinator")
	if coordinator == null:
		return _fail_bool("index rebuild coordinator missing after relaunch")
	var rows: Array = coordinator.list_unfinished_games()
	if rows.size() != 2:
		return _fail_bool("corrupt index did not rebuild both valid game rows")
	var recovered_ids := _game_ids(rows)
	if not recovered_ids.has(first_id) or not recovered_ids.has(second_id):
		return _fail_bool("rebuilt index lost a valid game id")
	if not _quarantine_contains_prefix("index.json."):
		return _fail_bool("corrupt index was not preserved in quarantine")
	main.queue_free()
	await process_frame
	await process_frame
	return true


func _test_corrupt_active_slot_fallback() -> bool:
	var main = await _spawn_main()
	var coordinator = main.get_node_or_null("SaveCoordinator")
	if coordinator == null:
		return _fail_bool("slot fallback coordinator missing")
	var first_id := str(coordinator.active_game())
	main.call("_start_new_game_slot")
	for _frame in range(3):
		await process_frame
	var broken_id := str(coordinator.active_game())
	if first_id.is_empty() or broken_id.is_empty() or first_id == broken_id:
		return _fail_bool("slot fallback fixture did not create two games")
	if not coordinator.save_now(true):
		return _fail_bool("slot fallback fixture could not save")
	main.queue_free()
	await process_frame
	await process_frame

	var broken_path := SAVE_DIR.path_join("%s.json" % broken_id)
	if not _write_raw_text(broken_path, "{ broken-slot"):
		return _fail_bool("could not corrupt active slot fixture")

	main = await _spawn_main()
	coordinator = main.get_node_or_null("SaveCoordinator")
	if coordinator == null:
		return _fail_bool("slot fallback coordinator missing after relaunch")
	var rows: Array = coordinator.list_unfinished_games()
	if rows.size() != 1:
		return _fail_bool("corrupt active slot did not fall back to one surviving game")
	if str(coordinator.active_game()) != first_id:
		return _fail_bool("corrupt active slot did not resume the surviving game")
	if not _quarantine_contains_prefix("%s.json." % broken_id):
		return _fail_bool("corrupt game slot was not preserved in quarantine")
	main.queue_free()
	await process_frame
	await process_frame
	return true


func _test_interrupted_replace_backup_recovery() -> bool:
	var main = await _spawn_main()
	var coordinator = main.get_node_or_null("SaveCoordinator")
	if coordinator == null:
		return _fail_bool("transaction recovery coordinator missing")
	var game_id := str(coordinator.active_game())
	if game_id.is_empty() or not coordinator.save_now(true):
		return _fail_bool("transaction recovery fixture could not save")
	main.queue_free()
	await process_frame
	await process_frame

	var slot_path := SAVE_DIR.path_join("%s.json" % game_id)
	var backup_path := slot_path + ".bak"
	var temp_path := slot_path + ".tmp"
	if _rename_raw(slot_path, backup_path) != OK:
		return _fail_bool("could not simulate final-to-backup crash window")
	if not _write_raw_text(temp_path, "{ incomplete-temp"):
		return _fail_bool("could not simulate incomplete temp write")
	if FileAccess.file_exists(slot_path):
		return _fail_bool("transaction fixture unexpectedly still has final file")

	main = await _spawn_main()
	coordinator = main.get_node_or_null("SaveCoordinator")
	if coordinator == null:
		return _fail_bool("transaction recovery coordinator missing after relaunch")
	if str(coordinator.active_game()) != game_id:
		return _fail_bool("validated backup did not restore the interrupted active game")
	if not FileAccess.file_exists(slot_path):
		return _fail_bool("validated backup was not promoted back to final path")
	if FileAccess.file_exists(backup_path):
		return _fail_bool("transaction recovery left stale backup file")
	if not _quarantine_contains_prefix("%s.json.tmp." % game_id):
		return _fail_bool("invalid interrupted temp was not quarantined")
	main.queue_free()
	await process_frame
	await process_frame
	return true


func _spawn_main():
	var main = MainScene.instantiate()
	root.add_child(main)
	for _frame in range(10):
		await process_frame
	return main


func _game_ids(rows: Array) -> Array:
	var ids: Array = []
	for row_value in rows:
		if row_value is Dictionary:
			ids.append(str(row_value.get("game_id", "")))
	return ids


func _quarantine_contains_prefix(prefix: String) -> bool:
	var dir := DirAccess.open(QUARANTINE_DIR)
	if dir == null:
		return false
	for filename in dir.get_files():
		if filename.begins_with(prefix):
			return true
	return false


func _read_json_dictionary(path: String):
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return null
	var encoded := file.get_as_text()
	file.close()
	return JSON.parse_string(encoded)


func _write_raw_text(path: String, value: String) -> bool:
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(value)
	file.flush()
	file.close()
	return true


func _rename_raw(from_path: String, to_path: String) -> Error:
	return DirAccess.rename_absolute(
		ProjectSettings.globalize_path(from_path),
		ProjectSettings.globalize_path(to_path)
	)


func _clear_test_saves() -> void:
	if FileAccess.file_exists(LEGACY_SAVE):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(LEGACY_SAVE))

	var quarantine := DirAccess.open(QUARANTINE_DIR)
	if quarantine != null:
		for filename in quarantine.get_files():
			DirAccess.remove_absolute(
				ProjectSettings.globalize_path(QUARANTINE_DIR.path_join(filename))
			)
		DirAccess.remove_absolute(ProjectSettings.globalize_path(QUARANTINE_DIR))

	var dir := DirAccess.open(SAVE_DIR)
	if dir == null:
		return
	for filename in dir.get_files():
		DirAccess.remove_absolute(ProjectSettings.globalize_path(SAVE_DIR.path_join(filename)))


func _fail_bool(message: String) -> bool:
	push_error("FAIL save_robustness_smoke: %s" % message)
	quit(1)
	return false
