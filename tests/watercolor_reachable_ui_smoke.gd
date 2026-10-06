extends SceneTree

const MainScene = preload("res://main.tscn")
const Paper = preload("res://scripts/watercolor_gameplay_style.gd")
var failures: Array[String] = []

func _init() -> void:
	call_deferred("_run")

func _check(ok: bool, message: String) -> void:
	if not ok:
		failures.append(message)

func _paper(panel: Node, label: String) -> void:
	var box = panel.get_theme_stylebox("panel") as StyleBoxFlat
	_check(box != null and box.bg_color.r > 0.9, label + " must use light paper")

func _press_text(node: Node, text: String) -> bool:
	if node is Button and node.text == text:
		node.pressed.emit()
		return true
	for child in node.get_children():
		if _press_text(child, text):
			return true
	return false

func _run() -> void:
	var main = MainScene.instantiate()
	root.add_child(main)
	for _i in range(20):
		await process_frame
	main._hide_puzzle_selection()
	main.album_more_button.pressed.emit()
	_check(_press_text(main.album_overflow_panel, "Unfinished puzzles"), "More saved-games binding")
	_check(main.sessions_panel.visible, "More opens actual saved-games panel")
	_check(main.sessions_panel.get_parent().layer > main.get_node("SortingWorkspace").ui_layer.layer, "Saved games open above an existing tray manager")
	_paper(main.sessions_panel, "Saved games")
	_check(_press_text(main.sessions_panel, "Start new"), "Saved games selection binding")
	_check(main.puzzle_selection_overlay.visible, "Start new opens Gallery")
	_paper(main.puzzle_selection_panel, "Gallery")
	_check(main.puzzle_selection_overlay.color.r > 0.9, "Gallery scrim")
	for option in [main.album_overflow_difficulty, main.gallery_category_filter, main.gallery_status_filter, main.puzzle_selection_difficulty]:
		_paper(option.get_popup(), "Detached option popup")
		_check(option.get_popup().get_theme_constant("v_separation") >= 54, "Dropdown touch row spacing")
	_paper(main.gallery_search.get_menu(), "Search context popup")
	_check(Paper.theme().default_font.has_char(0x7b8f), "Catalog Japanese title glyph is bundled")
	var body = main.puzzle_selection_panel.get_child(0).get_node_or_null("PaperSelectionBody")
	_check(body is ScrollContainer, "Selection body scrolls independently of footer")
	_check(not body.is_ancestor_of(main.puzzle_selection_start), "Start action stays outside scroll")
	main.gallery_search.text = "zzzzzzzz"
	main._on_gallery_search_changed("zzzzzzzz")
	_check(body.get_child(0).get_node("PaperGalleryEmpty").visible, "Search no-results state is explicit")
	_check(not main.gallery_scroll.visible, "Empty search hides blank card viewport")
	main.gallery_search.text = ""
	main._on_gallery_search_changed("")
	main._hide_puzzle_selection()
	main._toggle_journal()
	_paper(main.journal_panel, "Journal")
	_check(main.journal_overlay.color.r > 0.9, "Journal scrim")
	main._close_journal()
	main._show_loading_curtain("Loading saved puzzle…")
	_check(main.startup_curtain.color.r > 0.9, "Recreated resume curtain")
	main._release_loading_curtain()
	main._apply_portrait_export_layout(Vector2(720, 1558))
	_check(main.timelapse_overlay.color.r > 0.9, "Recording layout")
	main._restore_standard_replay_layout()
	_check(main.timelapse_overlay.color.r > 0.9, "Restored replay layout")
	_check(main.get_node("PaperSheetsLayer").layer > main.get_node("SortingWorkspace").ui_layer.layer, "Modal scrims cover the sorting dock")
	main._on_completed()
	var completion_body = main.completion_panel.get_child(0).get_node_or_null("PaperCompletionBody")
	_check(completion_body is ScrollContainer, "Completion artwork and facts can scroll")
	_check(not completion_body.is_ancestor_of(main.completion_share_button), "Completion actions stay reachable outside scroll")
	for viewport in [Vector2(720, 1558), Vector2(1558, 720)]:
		root.size = Vector2i(viewport)
		# Open the ancestors through the real flow: hidden Containers do not
		# lay out wrapped labels, even when their child panel is shown directly.
		main._show_puzzle_selection(true)
		main._close_journal()
		main._toggle_journal()
		_check(main.puzzle_selection_panel.is_visible_in_tree(), "Gallery bounds are checked in its open state")
		_check(main.journal_panel.is_visible_in_tree(), "Journal bounds are checked in its open state")
		main._layout_ui(main._sync_content_scale_to_window())
		for _i in range(5):
			await process_frame
		main._layout_ui(main._sync_content_scale_to_window())
		main._apply_completion_layout_for_orientation(viewport, viewport)
		for panel in [main.puzzle_selection_panel, main.journal_panel, main.completion_panel]:
			print("SHEET ", panel.name, " viewport=", viewport, " position=", panel.position, " size=", panel.size, " minimum=", panel.get_combined_minimum_size())
			_check(panel.position.x >= 0 and panel.position.y >= 0, "Sheet starts within viewport")
			_check(panel.position.x + panel.size.x <= viewport.x + 1, "Sheet width fits viewport")
			_check(panel.position.y + panel.size.y <= viewport.y + 1, "Sheet height fits viewport")
		for button in [main.timelapse_close_button, main.timelapse_again_button, main.timelapse_export_button]:
			_check(button.position.x >= 0 and button.position.x + button.size.x <= viewport.x + 1, "Replay actions fit width")
			_check(button.position.y >= 0 and button.position.y + button.size.y <= viewport.y + 1, "Replay actions fit height")
			_check(button.size.y >= 80, "Replay actions retain mobile touch height")
	if failures.is_empty():
		print("PASS watercolor_reachable_ui_smoke")
		main.queue_free()
		await process_frame
		quit(0)
	else:
		for failure in failures:
			push_error("FAIL watercolor_reachable_ui_smoke: " + failure)
		quit(1)
