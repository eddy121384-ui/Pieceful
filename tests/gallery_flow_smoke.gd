extends SceneTree

const MainScene = preload("res://main.tscn")
const GalleryStateStoreScript = preload("res://scripts/gallery_state_store.gd")
const AppUiMetricsScript = preload("res://scripts/app_ui_metrics.gd")
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
	if main.gallery_scroll == null:
		_fail("Gallery scroll container missing")
		return
	if int(main.gallery_scroll.scroll_deadzone) < 8:
		_fail("Gallery touch scroll deadzone is too small for reliable card taps")
		return

	# Real-device regression: portrait phones are a two-column vertical artwork
	# wall, not a desktop horizontal strip squeezed into a narrow viewport. The
	# artwork itself must forward touch drags to the ScrollContainer because that
	# is where a human naturally starts a swipe.
	main.call("_layout_ui", Vector2(390.0, 844.0))
	if str(main.call("gallery_layout_mode")) != "portrait_grid":
		_fail("390x844 did not switch Gallery to portrait grid")
		return
	if main.gallery_grid == null or int(main.gallery_grid.columns) != 2:
		_fail("portrait Gallery is not a two-column grid")
		return
	if main.gallery_scroll.horizontal_scroll_mode != ScrollContainer.SCROLL_MODE_DISABLED:
		_fail("portrait Gallery still allows horizontal scrolling")
		return
	if main.gallery_scroll.vertical_scroll_mode != ScrollContainer.SCROLL_MODE_SHOW_NEVER:
		_fail("portrait Gallery did not enable hidden-scrollbar vertical swiping")
		return
	if bool(main.gallery_scroll.scroll_horizontal_by_default):
		_fail("portrait Gallery kept desktop horizontal wheel behavior")
		return
	var garden_picture = main.content_buttons.get("garden")
	if not (garden_picture is TextureButton):
		_fail("Garden artwork button missing")
		return
	if (garden_picture as TextureButton).mouse_filter != Control.MOUSE_FILTER_PASS:
		_fail("artwork still consumes swipe input instead of forwarding it to Gallery scroll")
		return
	if main.gallery_cards["garden"].get_parent() != main.gallery_grid:
		_fail("portrait Gallery cards were not reparented into the two-column grid")
		return

	# Wide layouts retain the efficient horizontal rail and hidden scrollbar.
	main.call("_layout_ui", Vector2(1024.0, 640.0))
	if str(main.call("gallery_layout_mode")) != "wide_rail":
		_fail("wide viewport did not restore Gallery rail")
		return
	if main.gallery_scroll.horizontal_scroll_mode != ScrollContainer.SCROLL_MODE_SHOW_NEVER:
		_fail("wide Gallery rail exposed a desktop-style horizontal scrollbar")
		return
	if main.gallery_scroll.vertical_scroll_mode != ScrollContainer.SCROLL_MODE_DISABLED:
		_fail("wide Gallery rail unexpectedly kept vertical scrolling")
		return
	if not bool(main.gallery_scroll.scroll_horizontal_by_default):
		_fail("wide Gallery rail lost desktop wheel fallback")
		return
	if main.gallery_cards["garden"].get_parent() != main.puzzle_selection_cards:
		_fail("wide Gallery cards did not return to the horizontal rail")
		return

	# Restore the actual headless viewport before the remaining runtime geometry
	# checks so fake responsive dimensions cannot affect camera/chrome assertions.
	main.call("_layout_ui", main.get_viewport().get_visible_rect().size)

	if str(main.call("_gallery_status_for", "garden")) != "new":
		_fail("clean bootstrap provisional Garden slot leaked as Continue")
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

	# Category filter is independent from search.
	_select_option_metadata(main.gallery_category_filter, "culture")
	main.call("_on_gallery_filter_changed", main.gallery_category_filter.selected)
	if not bool(main.gallery_cards["crane_pine_scroll"].visible) or bool(main.gallery_cards["garden"].visible):
		_fail("culture category filter did not isolate cultural artwork")
		return
	_select_option_metadata(main.gallery_category_filter, "all")
	main.call("_on_gallery_filter_changed", main.gallery_category_filter.selected)

	# Favorite state must survive a fresh store instance and drive state filtering.
	main.call("_on_favorite_pressed", "crane_pine_scroll")
	var reloaded_store = GalleryStateStoreScript.new()
	if not reloaded_store.is_favorite("crane_pine_scroll"):
		_fail("favorite did not persist locally")
		return
	_select_option_metadata(main.gallery_status_filter, "favorites")
	main.call("_on_gallery_filter_changed", main.gallery_status_filter.selected)
	if not bool(main.gallery_cards["crane_pine_scroll"].visible) or bool(main.gallery_cards["twilight_lake"].visible):
		_fail("Favorites filter did not use persisted favorite state")
		return
	_select_option_metadata(main.gallery_status_filter, "all")
	main.call("_on_gallery_filter_changed", main.gallery_status_filter.selected)

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

	# A tall artwork must fit between the product chrome at the default fitted
	# view. This is the regression caught by real-device/desktop validation: the
	# top row used to sit underneath the translucent progress banner.
	var viewport_size: Vector2 = main.get_viewport().get_visible_rect().size
	var canvas_transform: Transform2D = main.get_viewport().get_canvas_transform()
	var board_top_left: Vector2 = canvas_transform * board.board_rect.position
	var board_bottom_right: Vector2 = canvas_transform * board.board_rect.end
	var top_bar: Rect2 = AppUiMetricsScript.top_bar_rect(viewport_size)
	var dock: Rect2 = AppUiMetricsScript.dock_rect(viewport_size)
	if board_top_left.y < top_bar.end.y + 12.0:
		_fail("portrait board still overlaps top app chrome: %.1f < %.1f" % [board_top_left.y, top_bar.end.y + 12.0])
		return
	if board_bottom_right.y > dock.position.y - 12.0:
		_fail("portrait board overlaps bottom dock: %.1f > %.1f" % [board_bottom_right.y, dock.position.y - 12.0])
		return

	# The persistent runtime Difficulty control must report the same resolved
	# count as the actual puzzle, not the legacy target/catalog count (150).
	var expected_count := int(grid.get("piece_count", 0))
	var difficulty_text := ""
	if main.difficulty_select != null and main.difficulty_select.get_item_count() > 0:
		difficulty_text = main.difficulty_select.get_item_text(main.difficulty_select.selected)
	if not difficulty_text.ends_with("· %d" % expected_count):
		_fail("runtime difficulty selector is stale: '%s' vs %d pieces" % [difficulty_text, expected_count])
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


func _select_option_metadata(button: OptionButton, value: String) -> void:
	if button == null:
		return
	for index in range(button.get_item_count()):
		if str(button.get_item_metadata(index)) == value:
			button.select(index)
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
