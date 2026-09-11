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
	for _frame in range(14):
		await process_frame

	var coordinator = main.get_node_or_null("SaveCoordinator")
	var board = main.get_node_or_null("PuzzleBoard")
	if coordinator == null or board == null:
		_fail("main runtime nodes missing")
		return
	if not coordinator.needs_new_game_selection():
		_fail("clean boot did not enter first-puzzle selection state")
		return
	if main.puzzle_selection_overlay == null or not main.puzzle_selection_overlay.visible:
		_fail("clean boot chooser is not visible")
		return
	if main.content_buttons.size() != 2:
		_fail("chooser does not expose exactly two built-in artworks")
		return
	if not main.content_buttons.has("garden") or not main.content_buttons.has("twilight_lake"):
		_fail("expected Garden and Twilight Lake cards")
		return

	var provisional_id := str(coordinator.active_game())
	if provisional_id.is_empty() or coordinator.list_unfinished_games().size() != 1:
		_fail("clean boot provisional slot invariant changed")
		return

	# First selection: turn the provisional Garden runtime into Twilight Lake.
	main.call("_on_content_card_pressed", "twilight_lake")
	main.call("_start_selected_puzzle")
	for _frame in range(5):
		await process_frame
	if main.puzzle_selection_overlay.visible:
		_fail("chooser did not close after starting first puzzle")
		return
	if str(coordinator.active_game()) != provisional_id:
		_fail("first selection created a phantom second slot instead of reusing provisional id")
		return
	if coordinator.list_unfinished_games().size() != 1:
		_fail("first selection left more than one unfinished puzzle")
		return
	if str(board.active_content_id()) != "twilight_lake":
		_fail("Twilight Lake did not become active artwork")
		return
	var twilight_snapshot = _read_json(SAVE_DIR.path_join("%s.json" % provisional_id))
	var twilight_identity := _identity_from_snapshot(twilight_snapshot)
	if str(twilight_identity.get("source_id", "")) != "builtin:demo_twilight_lake":
		_fail("first slot did not persist Twilight Lake identity")
		return
	var twilight_sha := str(twilight_identity.get("sha256", ""))
	if twilight_sha.length() != 64:
		_fail("Twilight Lake identity did not persist a SHA-256")
		return

	# Start New now uses the same chooser but preserves the first unfinished game.
	main.call("_on_start_new_pressed")
	if not main.puzzle_selection_overlay.visible or not main.puzzle_selection_cancel.visible:
		_fail("Start new did not open a cancellable chooser")
		return
	main.call("_on_content_card_pressed", "garden")
	main.call("_start_selected_puzzle")
	for _frame in range(5):
		await process_frame
	var garden_id := str(coordinator.active_game())
	if garden_id.is_empty() or garden_id == provisional_id:
		_fail("second artwork did not allocate a new unfinished game")
		return
	if coordinator.list_unfinished_games().size() != 2:
		_fail("two artwork choices did not coexist as two unfinished games")
		return
	if str(board.active_content_id()) != "garden":
		_fail("Garden did not become active artwork")
		return
	var garden_snapshot = _read_json(SAVE_DIR.path_join("%s.json" % garden_id))
	var garden_identity := _identity_from_snapshot(garden_snapshot)
	if str(garden_identity.get("source_id", "")) != "builtin:demo_garden":
		_fail("second slot did not persist Garden identity")
		return
	var garden_sha := str(garden_identity.get("sha256", ""))
	if garden_sha.length() != 64 or garden_sha == twilight_sha:
		_fail("two different artworks do not have distinct durable fingerprints")
		return

	# Resume the older Twilight slot. Content selection must happen before the
	# durable-identity guard, otherwise a valid Twilight save would be rejected
	# merely because Garden happens to be the current runtime.
	if not await coordinator.resume_game(provisional_id):
		_fail("could not resume Twilight slot while Garden was active")
		return
	if str(board.active_content_id()) != "twilight_lake":
		_fail("resume did not switch runtime artwork back to Twilight Lake")
		return
	if str(coordinator.active_game()) != provisional_id:
		_fail("resume did not restore Twilight slot identity")
		return

	# Destroy the whole product scene and recreate it. Startup must read the save's
	# artwork identity, select Twilight first, then restore pieces/difficulty.
	main.queue_free()
	await process_frame
	main = MainScene.instantiate()
	root.add_child(main)
	for _frame in range(14):
		await process_frame
	coordinator = main.get_node_or_null("SaveCoordinator")
	board = main.get_node_or_null("PuzzleBoard")
	if coordinator == null or board == null:
		_fail("runtime nodes missing after relaunch")
		return
	if str(coordinator.active_game()) != provisional_id:
		_fail("relaunch did not resume the last active artwork slot")
		return
	if str(board.active_content_id()) != "twilight_lake":
		_fail("relaunch resumed slot state onto the wrong artwork")
		return
	if main.puzzle_selection_overlay.visible:
		_fail("existing unfinished game should resume directly instead of reopening chooser")
		return
	if coordinator.list_unfinished_games().size() != 2:
		_fail("relaunch did not preserve both artwork saves")
		return

	main.queue_free()
	await process_frame
	_clear_test_saves()
	print("PASS puzzle_selection_flow_smoke")
	quit(0)


func _identity_from_snapshot(snapshot) -> Dictionary:
	if not (snapshot is Dictionary):
		return {}
	var puzzle = snapshot.get("puzzle", {})
	if not (puzzle is Dictionary):
		return {}
	var identity = puzzle.get("content_identity", {})
	if identity is Dictionary:
		return identity
	return {}


func _read_json(path: String):
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return null
	var value: Variant = JSON.parse_string(file.get_as_text())
	file.close()
	return value


func _clear_test_saves() -> void:
	if FileAccess.file_exists(LEGACY_SAVE):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(LEGACY_SAVE))
	var dir := DirAccess.open(SAVE_DIR)
	if dir == null:
		return
	for filename in dir.get_files():
		DirAccess.remove_absolute(ProjectSettings.globalize_path(SAVE_DIR.path_join(filename)))


func _fail(message: String) -> void:
	push_error("FAIL puzzle_selection_flow_smoke: %s" % message)
	quit(1)
