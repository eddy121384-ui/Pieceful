extends SceneTree

const MainScene = preload("res://main.tscn")
const SAVE_DIR := "user://saves"
const LEGACY_SAVE := "user://pieceful_autosave_v1.json"
const GALLERY_STATE := "user://pieceful_gallery_state_v1.json"


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	_clear_test_state()

	# First launch: choose a non-default portrait puzzle and persist it so the
	# second launch must restore something visibly different from provisional
	# Garden/Relaxed.
	var first = MainScene.instantiate()
	root.add_child(first)
	for _frame in range(24):
		await process_frame

	var first_board = first.get_node_or_null("PuzzleBoard")
	var first_coordinator = first.get_node_or_null("SaveCoordinator")
	if first_board == null or first_coordinator == null:
		_fail("first launch runtime nodes missing")
		return
	first.call("_on_content_card_pressed", "crane_pine_scroll")
	_select_picker_difficulty(first, "standard")
	first.call("_start_selected_puzzle")
	for _frame in range(8):
		await process_frame
	if str(first_board.active_content_id()) != "crane_pine_scroll":
		_fail("could not prepare portrait save fixture")
		return
	if str(first_board.active_difficulty_id()) != "standard":
		_fail("portrait save fixture did not use Standard")
		return
	if not first_coordinator.save_now(true):
		_fail("could not persist portrait save fixture")
		return
	var saved_game_id := str(first_coordinator.active_game())
	var saved_pattern_id := str(first_board.active_pattern_id())
	var saved_piece_count := int(first_board.active_piece_count())
	if saved_game_id.is_empty() or saved_pattern_id.is_empty() or saved_piece_count <= 0:
		_fail("portrait save fixture identity incomplete")
		return

	first.queue_free()
	for _frame in range(4):
		await process_frame

	# Second launch: the inherited runtime may construct a provisional puzzle
	# underneath, but it must never be presented. The opaque startup curtain has
	# to exist in the very same _ready frame before the first rendered frame.
	var second = MainScene.instantiate()
	root.add_child(second)
	if second.startup_curtain == null or not second.startup_curtain.visible:
		_fail("startup curtain was not present before first resume frame")
		return

	var second_board = second.get_node_or_null("PuzzleBoard")
	var second_coordinator = second.get_node_or_null("SaveCoordinator")
	if second_board == null or second_coordinator == null:
		_fail("second launch runtime nodes missing")
		return

	for _frame in range(180):
		if not bool(second_coordinator.get("bootstrapping")):
			break
		await process_frame
	if bool(second_coordinator.get("bootstrapping")):
		_fail("resume bootstrap did not finish")
		return
	for _frame in range(16):
		await process_frame

	if not bool(second_coordinator.get("resume_succeeded")):
		_fail("saved portrait puzzle did not resume")
		return
	if str(second_coordinator.active_game()) != saved_game_id:
		_fail("resume changed active game id")
		return
	if str(second_board.active_content_id()) != "crane_pine_scroll":
		_fail("resume restored wrong artwork")
		return
	if str(second_board.active_difficulty_id()) != "standard":
		_fail("resume restored wrong difficulty")
		return
	if str(second_board.active_pattern_id()) != saved_pattern_id:
		_fail("resume restored wrong CutPattern")
		return
	if int(second_board.active_piece_count()) != saved_piece_count:
		_fail("resume restored wrong piece count")
		return
	if int(second_board.get("resume_runtime_reuse_hits")) != 1:
		_fail(
			"resume runtime was rebuilt instead of reused exactly once: %s"
			% second_board.get("resume_runtime_reuse_hits")
		)
		return
	if second.startup_curtain_layer != null:
		_fail("startup curtain did not release after resolved resume")
		return

	second.queue_free()
	await process_frame
	_clear_test_state()
	print("PASS startup_resume_presentation_smoke")
	quit(0)


func _select_picker_difficulty(main, difficulty_id: String) -> void:
	var picker = main.puzzle_selection_difficulty
	if picker == null:
		return
	for index in range(picker.get_item_count()):
		if str(picker.get_item_metadata(index)) == difficulty_id:
			picker.select(index)
			return


func _clear_test_state() -> void:
	for path in [LEGACY_SAVE, GALLERY_STATE]:
		if FileAccess.file_exists(path):
			DirAccess.remove_absolute(ProjectSettings.globalize_path(path))
	var dir := DirAccess.open(SAVE_DIR)
	if dir != null:
		for filename in dir.get_files():
			DirAccess.remove_absolute(ProjectSettings.globalize_path(SAVE_DIR.path_join(filename)))


func _fail(message: String) -> void:
	push_error("FAIL startup_resume_presentation_smoke: %s" % message)
	quit(1)
