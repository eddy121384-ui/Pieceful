extends SceneTree

const MainScene = preload("res://main.tscn")
var failures: Array[String] = []


func _init() -> void:
	call_deferred("_run")


func _check(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)


func _settle(frames := 8) -> void:
	for _frame in range(frames):
		await process_frame


func _run() -> void:
	# This suite uses its own XDG_DATA_HOME in CI/the local runner.
	var main = MainScene.instantiate()
	root.add_child(main)
	await _settle(24)
	var board = main.get_node("PuzzleBoard")
	var saves = main.get_node("SaveCoordinator")
	_check(main.puzzle_selection_overlay.visible, "first launch opens Gallery")
	_check(not main.puzzle_selection_start.visible, "browse does not start a hidden default picture")
	_check(not main.product_resume_box.visible, "provisional bootstrap puzzle is not advertised as progress")
	var first_id: String = saves.active_game()
	main._on_content_card_pressed("crane_pine_scroll")
	_check(main.product_setup_open, "artwork tap opens focused piece-count setup")
	await _settle()
	_check(not main.gallery_scroll.is_visible_in_tree(), "setup stays focused after shared paper relayout")
	_check(board.active_content_id() == "garden", "browsing a picture does not replace the runtime")
	main._product_back()
	_check(not main.product_setup_open and main.puzzle_selection_overlay.visible, "setup Back returns to Gallery")
	_check(saves.active_game() == first_id, "cancelled selection keeps the provisional slot")
	main._on_content_card_pressed("garden")
	main._select_picker_difficulty("relaxed")
	main._start_selected_puzzle()
	await _settle()
	_check(not main.puzzle_selection_overlay.visible, "Start opens gameplay")
	_check(saves.active_game() == first_id, "first Start commits one slot without a phantom game")
	board._solve_cluster(0)
	_check(board.solved_count == 1, "progress fixture places a real cluster")
	main._leave_puzzle_for_gallery()
	_check(main.product_resume_box.visible, "leaving gameplay surfaces prominent Continue")
	_check(main.product_saved_copy.text.contains("1 / 40"), "Gallery reports the saved progress")
	var first_snapshot: Dictionary = saves._read_json_dictionary("user://saves/%s.json" % first_id)
	main._on_content_card_pressed("twilight_lake")
	main._select_picker_difficulty("relaxed")
	main._start_selected_puzzle()
	await _settle()
	var second_id: String = saves.active_game()
	_check(second_id != first_id, "another picture gets a separate save")
	_check(saves.list_unfinished_games().size() == 2, "switching preserves both unfinished games")
	await main._on_resume_game_pressed(first_id)
	await _settle()
	_check(board.active_content_id() == "garden" and board.solved_count == 1, "Continue restores the original picture and placed piece")
	_check(not main.puzzle_selection_overlay.visible, "Continue returns to gameplay")
	_check(saves._read_json_dictionary("user://saves/%s.json" % first_id).get("puzzle") == first_snapshot.get("puzzle"), "navigation preserves saved puzzle identity and piece state")

	# Destructive actions must not execute at prompt-open or cancellation.
	main._on_album_reshuffle_pressed()
	_check(main.product_confirmation_overlay.visible and board.solved_count == 1, "reshuffle waits for a decision")
	await _settle()
	_check(main.product_confirmation_panel.size.x >= 600, "confirmation copy has a readable sheet width")
	_check(main.product_confirmation_panel.get_rect().end.y <= main.get_viewport().get_visible_rect().size.y, "confirmation remains within viewport")
	main._product_back()
	_check(board.solved_count == 1, "cancelled reshuffle preserves progress")
	for index in range(main.album_overflow_difficulty.item_count):
		if str(main.album_overflow_difficulty.get_item_metadata(index)) == "standard":
			main._on_album_difficulty_selected(index)
			break
	_check(main.product_confirmation_overlay.visible and saves.active_game() == first_id, "mid-game piece count waits for a decision")
	main._product_back()
	_check(board.solved_count == 1 and board.active_difficulty_id() == "relaxed", "cancelled piece count preserves original game")
	main._on_delete_game_pressed(second_id)
	_check(saves.list_unfinished_games().size() == 2, "delete prompt preserves saved games")
	main._product_back()
	_check(saves.list_unfinished_games().size() == 2, "cancelled delete preserves saved games")
	main._on_delete_game_pressed(second_id)
	main._confirm_product_action()
	_check(saves.list_unfinished_games().size() == 1, "confirmed deletion removes only the selected other slot")
	_check(saves.active_game() == first_id, "confirmed deletion preserves active game")

	main._leave_puzzle_for_gallery()
	main._on_favorite_pressed("garden")
	main._select_product_collection("favorites")
	_check(main.gallery_cards.garden.visible and not main.gallery_cards.twilight_lake.visible, "Favorites destination respects saved favorites")
	main._select_product_collection("photos")
	_check(main.puzzle_me_button.is_visible_in_tree(), "My photos exposes the private photo entry")
	var image := Image.create(96, 144, false, Image.FORMAT_RGB8)
	image.fill(Color(0.42, 0.58, 0.69))
	await main._prepare_puzzle_me_import(image.save_png_to_buffer(), "Personal study.png")
	await _settle()
	_check(main.pending_content_id.begins_with("photo_") and main.product_setup_open, "photo import enters picture setup")
	_check(board.active_content_id() == "garden" and board.solved_count == 1, "photo setup preserves current board identity and progress")
	_check(saves.save_now(true), "autosave remains usable during photo setup")
	var after_photo: Dictionary = saves._read_json_dictionary("user://saves/%s.json" % first_id)
	_check(after_photo.get("puzzle") == first_snapshot.get("puzzle"), "photo candidate cannot contaminate the active save")
	main._product_back()
	main._product_back()
	_check(board.active_content_id() == "garden", "photo setup Back keeps the original game")
	main._leave_puzzle_for_gallery()
	main._open_product_settings()
	_check(main.product_settings_overlay.visible, "Settings is reachable from discovery")
	main._product_back()
	_check(not main.product_settings_overlay.visible and main.puzzle_selection_overlay.visible, "Settings Back returns to Gallery")
	main._toggle_sessions_panel()
	await _settle()
	var continue_button = main.sessions_list.get_child(0).get_child(0).get_child(1)
	_check(not continue_button.disabled, "active unfinished puzzle can be continued from its list")
	main._product_back()
	main._continue_product_session()
	await _settle()
	for cluster_id in board.cluster_members.keys():
		board._solve_cluster(int(cluster_id))
	await _settle()
	_check(main.completion_panel.visible and board.solved_count == board.pieces.size(), "real solved clusters lead to completion")
	_check(main.completion_next_button.text == "Choose next puzzle", "completion has one explicit next destination")
	main._on_completion_next_pressed()
	_check(main.puzzle_selection_overlay.visible and not main.puzzle_selection_start.visible, "completion returns to discovery without prestarting a puzzle")
	main.queue_free()
	await _settle(2)
	if failures.is_empty():
		print("PASS commercial_product_navigation_smoke: first session, saved progress, switching, confirmation, favorites, photo isolation, settings, completion")
		quit(0)
	else:
		for failure in failures:
			push_error("FAIL commercial_product_navigation_smoke: " + failure)
		quit(1)
