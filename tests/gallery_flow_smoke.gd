extends SceneTree

const MainScene = preload("res://main.tscn")
const GalleryStateStoreScript = preload("res://scripts/gallery_state_store.gd")
const SAVE_DIR := "user://saves"
const LEGACY_SAVE := "user://pieceful_autosave_v1.json"
const GALLERY_STATE := "user://pieceful_gallery_state_v1.json"


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	_clear_test_state()
	var main = MainScene.instantiate()
	root.add_child(main)
	for _frame in range(16):
		await process_frame

	var board = main.get_node_or_null("PuzzleBoard")
	var coordinator = main.get_node_or_null("SaveCoordinator")
	if board == null or coordinator == null:
		_fail("gallery runtime nodes missing")
		return

	var presets: Array = board.content_presets()
	if presets.size() != 3:
		_fail("metadata catalog did not expose three official fixtures")
		return
	var crane: Dictionary = board.content_metadata("crane_pine_scroll")
	if str(crane.get("category", "")) != "culture":
		_fail("portrait fixture metadata category missing")
		return
	if not str(board.content_search_text("crane_pine_scroll")).contains("japan"):
		_fail("search text did not include weighted/tag metadata")
		return

	var aspect := float(board.content_aspect_ratio("crane_pine_scroll"))
	if absf(aspect - 0.75) > 0.001:
		_fail("portrait fixture aspect is not 3:4: %.4f" % aspect)
		return
	var portrait_layout: Dictionary = board.resolved_layout_for_aspect(aspect, "standard")
	if portrait_layout.is_empty():
		_fail("resolver returned no portrait Standard layout")
		return
	if int(portrait_layout.get("rows", 0)) <= int(portrait_layout.get("columns", 0)):
		_fail("3:4 artwork did not resolve to a portrait grid: %s" % portrait_layout)
		return

	# Search is metadata-backed, not title-only.
	main.gallery_search.text = "japan"
	main.call("_on_gallery_search_changed", "japan")
	if not bool(main.gallery_cards["crane_pine_scroll"].visible):
		_fail("metadata search hid the matching Crane & Pine card")
		return
	if bool(main.gallery_cards["garden"].visible):
		_fail("metadata search did not filter unrelated Garden card")
		return
	main.gallery_search.text = ""
	main.call("_on_gallery_search_changed", "")

	# Favorite state must survive a fresh store instance.
	main.call("_on_favorite_pressed", "crane_pine_scroll")
	var reloaded_store = GalleryStateStoreScript.new()
	if not reloaded_store.is_favorite("crane_pine_scroll"):
		_fail("favorite did not persist locally")
		return

	# Start the portrait artwork through the real chooser and confirm #37 now
	# resolves a real non-1.6 runtime rather than falling back to Classic_150_A.
	main.call("_on_content_card_pressed", "crane_pine_scroll")
	_select_picker_difficulty(main, "standard")
	main.call("_start_selected_puzzle")
	for _frame in range(7):
		await process_frame
	if str(board.active_content_id()) != "crane_pine_scroll":
		_fail("portrait gallery selection did not become active content")
		return
	var grid: Dictionary = board.active_grid_resolution()
	if int(grid.get("rows", 0)) <= int(grid.get("columns", 0)):
		_fail("active portrait puzzle grid is not portrait: %s" % grid)
		return
	if str(board.active_pattern_id()) == "Classic_150_A":
		_fail("portrait puzzle incorrectly reused the 1.6:1 Standard die")
		return

	main.call("_on_start_new_pressed")
	main.call("_refresh_gallery_cards")
	if str(main.call("_gallery_status_for", "crane_pine_scroll")) != "continue":
		_fail("unfinished portrait puzzle did not surface Continue state")
		return

	# Completion history is intentionally independent from the unfinished save.
	# Retire this slot and record a completion exactly as the product completion
	# callback does, then verify a fresh store sees Completed.
	coordinator.mark_active_completed()
	main.gallery_state.mark_completed("crane_pine_scroll", "standard")
	main.call("_refresh_gallery_cards")
	if str(main.call("_gallery_status_for", "crane_pine_scroll")) != "completed":
		_fail("completed content did not surface Completed state")
		return
	var completed_store = GalleryStateStoreScript.new()
	if not completed_store.is_completed("crane_pine_scroll"):
		_fail("completion history did not persist locally")
		return

	main.queue_free()
	await process_frame
	_clear_test_state()
	print("PASS gallery_flow_smoke")
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
	push_error("FAIL gallery_flow_smoke: %s" % message)
	quit(1)
