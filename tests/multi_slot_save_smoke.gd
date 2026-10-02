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
	for _frame in range(10):
		await process_frame

	var coordinator = main.get_node_or_null("SaveCoordinator")
	if coordinator == null:
		_fail("SaveCoordinator missing")
		return
	var first_id := str(coordinator.active_game())
	if first_id.is_empty():
		_fail("startup did not create an active game slot")
		return
	if coordinator.list_unfinished_games().size() != 1:
		_fail("startup should expose exactly one unfinished game")
		return

	# Reshuffle resets the current puzzle in place. It must not manufacture a new
	# unfinished save row just because the board was restarted.
	main.call("_restart")
	for _frame in range(3):
		await process_frame
	if str(coordinator.active_game()) != first_id:
		_fail("Reshuffle unexpectedly changed the active game id")
		return
	if coordinator.list_unfinished_games().size() != 1:
		_fail("Reshuffle unexpectedly created another unfinished game")
		return

	# Switching slots while Pieces is in rail mode rebuilds the board while the
	# workspace is still stashing loose pieces. Restored solved pieces must be
	# visible on the board, not left hidden with their former rail state.
	var board = main.get_node("PuzzleBoard")
	var workspace = main.get_node("SortingWorkspace")
	board._solve_cluster(int(board.cluster_for_piece[0]))
	await create_timer(0.2).timeout
	workspace._set_loose_layout_mode("rail")
	if not coordinator.save_now(true):
		_fail("could not save solved progress in rail mode")
		return

	# Start New is the explicit multi-slot boundary: preserve the current puzzle,
	# create a fresh runtime, and allocate a second durable game id.
	main.call("_start_new_game_slot")
	for _frame in range(3):
		await process_frame
	var second_id := str(coordinator.active_game())
	if second_id.is_empty() or second_id == first_id:
		_fail("Start new did not allocate a second game id")
		return
	if coordinator.list_unfinished_games().size() != 2:
		_fail("previous unfinished game was not preserved after Start new")
		return
	board.select_content("twilight_lake")
	board.request_difficulty("relaxed")
	for _frame in range(3):
		await process_frame
	if not coordinator.save_now(true):
		_fail("could not save the separate Twilight puzzle")
		return
	var second_snapshot = JSON.parse_string(_read_text(SAVE_DIR.path_join("%s.json" % second_id)))
	var second_identity = second_snapshot["puzzle"]["content_identity"]
	# Force the real autosave callback while the target board is being rebuilt,
	# before its saved progress and active slot identity have been restored.
	var autosave_during_rebuild := func(_solved: int, _total: int) -> void:
		coordinator._on_autosave_timeout()
		coordinator._flush_pending_runtime("resume-test")
	board.progress_changed.connect(autosave_during_rebuild)
	if not await coordinator.resume_game(first_id):
		_fail("could not resume rail-mode saved progress")
		return
	board.progress_changed.disconnect(autosave_during_rebuild)
	var preserved_second = JSON.parse_string(_read_text(SAVE_DIR.path_join("%s.json" % second_id)))
	if preserved_second["puzzle"]["content_identity"] != second_identity:
		_fail("autosave during resume overwrote the other puzzle's artwork identity")
		return
	board = main.get_node("PuzzleBoard")
	if board.solved_count != 1 or not board.pieces[0].is_visible_in_tree():
		_fail("rail-mode slot resume hid the restored solved piece")
		return
	if board.pieces[0].position != board.pieces[0].target_position:
		_fail("rail-mode slot resume moved the solved piece away from its target")
		return
	if not await coordinator.resume_game(second_id):
		_fail("could not switch back to the second slot")
		return
	if str(board.active_content_id()) != "twilight_lake" or board.solved_count != 0:
		_fail("switching back did not preserve the other puzzle's artwork and progress")
		return

	# Kill the entire product scene and rebuild it from disk. Multi-slot only
	# counts if both unfinished puzzles and the active identity survive relaunch.
	main.queue_free()
	await process_frame
	main = MainScene.instantiate()
	root.add_child(main)
	for _frame in range(10):
		await process_frame
	coordinator = main.get_node_or_null("SaveCoordinator")
	if coordinator == null:
		_fail("SaveCoordinator missing after relaunch")
		return
	if coordinator.list_unfinished_games().size() != 2:
		_fail("relaunch did not preserve both unfinished games")
		return
	if str(coordinator.active_game()) != second_id:
		_fail("relaunch did not resume the previously active game")
		return

	if not await coordinator.resume_game(first_id):
		_fail("could not resume the first unfinished game")
		return
	if str(coordinator.active_game()) != first_id:
		_fail("resume did not switch active game id")
		return
	if coordinator.list_unfinished_games().size() != 2:
		_fail("resume unexpectedly changed slot count")
		return

	if not coordinator.delete_game(second_id):
		_fail("could not delete inactive unfinished game")
		return
	if coordinator.list_unfinished_games().size() != 1:
		_fail("delete did not remove inactive unfinished game")
		return

	# Device users already have the #3-A/#3-B single-slot file. Reuse the current
	# valid Schema V1 payload as a legacy autosave fixture for the migration check.
	if not coordinator.save_now(true):
		_fail("could not create migration fixture")
		return
	var legacy_fixture := _read_text(SAVE_DIR.path_join("%s.json" % first_id))
	if legacy_fixture.is_empty():
		_fail("migration fixture slot is empty")
		return

	# Completion must remove the unfinished game and keep it removed. The autosave
	# timer still exists after completion, so simulate its next write immediately.
	if not coordinator.mark_active_completed():
		_fail("could not retire completed game")
		return
	if not coordinator.save_now(false):
		_fail("post-completion autosave call failed")
		return
	if not str(coordinator.active_game()).is_empty():
		_fail("post-completion autosave resurrected an active game id")
		return
	if not coordinator.list_unfinished_games().is_empty():
		_fail("completed puzzle returned to unfinished games after autosave")
		return
	if FileAccess.file_exists(SAVE_DIR.path_join("%s.json" % first_id)):
		_fail("completed unfinished-slot file still exists")
		return

	# Erase the new index and feed the valid V1 payload through the actual legacy
	# path. A fresh boot must import it into one durable multi-slot game.
	main.queue_free()
	await process_frame
	_clear_test_saves()
	if not _write_text(LEGACY_SAVE, legacy_fixture):
		_fail("could not write legacy autosave fixture")
		return

	main = MainScene.instantiate()
	root.add_child(main)
	for _frame in range(10):
		await process_frame
	coordinator = main.get_node_or_null("SaveCoordinator")
	if coordinator == null:
		_fail("SaveCoordinator missing after legacy migration boot")
		return
	var migrated_games: Array = coordinator.list_unfinished_games()
	if migrated_games.size() != 1:
		_fail("legacy autosave did not migrate into exactly one unfinished slot")
		return
	var migrated_id := str(coordinator.active_game())
	if migrated_id.is_empty() or migrated_id == "autosave":
		_fail("legacy autosave did not receive a durable game id")
		return
	if not FileAccess.file_exists(SAVE_DIR.path_join("%s.json" % migrated_id)):
		_fail("migrated game slot file is missing")
		return

	main.queue_free()
	await process_frame
	_clear_test_saves()
	print("PASS multi_slot_save_smoke")
	quit(0)


func _read_text(path: String) -> String:
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return ""
	var value := file.get_as_text()
	file.close()
	return value


func _write_text(path: String, value: String) -> bool:
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(value)
	file.flush()
	file.close()
	return true


func _clear_test_saves() -> void:
	if FileAccess.file_exists(LEGACY_SAVE):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(LEGACY_SAVE))
	var dir := DirAccess.open(SAVE_DIR)
	if dir == null:
		return
	for filename in dir.get_files():
		DirAccess.remove_absolute(ProjectSettings.globalize_path(SAVE_DIR.path_join(filename)))


func _fail(message: String) -> void:
	push_error("FAIL multi_slot_save_smoke: %s" % message)
	quit(1)
