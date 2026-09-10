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

	main.queue_free()
	await process_frame
	_clear_test_saves()
	print("PASS multi_slot_save_smoke")
	quit(0)


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
