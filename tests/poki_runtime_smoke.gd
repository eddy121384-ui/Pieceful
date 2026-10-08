extends SceneTree


func _initialize() -> void:
	call_deferred("_run")


func _run() -> void:
	var main = load("res://poki/main.tscn").instantiate()
	root.add_child(main)
	for frame in range(80):
		await process_frame
	assert(main.poki_ready)
	assert(main.board.content_presets().size() >= 30)
	assert(main.pending_content_id == "met_10181")
	assert(main.product_setup_open)
	assert(main.poki_thumb_cache.size() <= 12)
	assert(main.board._texture_cache.size() <= 1)
	assert(not main.product_collection_row.visible)
	assert(not main.product_header.get_child(1).visible)
	assert(not main.completion_share_button.visible)
	for difficulty in ["poki_quick", "relaxed", "standard", "hard"]:
		assert(main.board.request_difficulty(difficulty))
		assert(main.board.active_piece_count() > 0)
		if difficulty == "poki_quick":
			assert(main.board.active_piece_count() == 12)
		assert(main.board.active_difficulty_id() == difficulty)
		var piece = main.board.pieces[0]
		assert(piece.get_node_or_null("ContactShadow") != null)
		assert(piece.get_node_or_null("Thickness") != null)
		assert(piece.get_node_or_null("Face") != null)
		assert(piece.get_node_or_null("EdgeRelief") != null)
	assert(main.board.request_difficulty("poki_quick"))
	main._leave_puzzle_for_gallery()
	main._on_content_card_pressed("met_10181")
	main._select_picker_difficulty("poki_quick")
	main._start_selected_puzzle()
	assert(main.save_coordinator.save_now(true))
	var coordinator = main.save_coordinator
	var game := "poki-unavailable-fixture"
	var path: String = coordinator._slot_path(game)
	var snapshot: Dictionary = coordinator._capture_snapshot()
	snapshot["slot"] = game
	snapshot["puzzle"]["content_identity"]["source_id"] = "builtin:demo_garden"
	assert(coordinator._write_text_file(path, JSON.stringify(snapshot)))
	coordinator._upsert_metadata(coordinator._metadata_from_snapshot(game, snapshot, int(Time.get_unix_time_from_system())))
	assert(coordinator._save_index())
	var bytes: PackedByteArray = FileAccess.get_file_as_bytes(path)
	assert(not await coordinator._resume_game_from_disk(game))
	assert(FileAccess.get_file_as_bytes(path) == bytes)
	assert(not coordinator._candidate_game_ids().has(game))
	assert(not coordinator.last_resume_error.contains("corrupt"))
	var active_path: String = coordinator._slot_path(coordinator.active_game())
	var active_bytes := FileAccess.get_file_as_bytes(active_path)
	coordinator.bootstrapping = true
	main.board.pieces[0].position += Vector2(15, 8)
	main._poki_save_before_interruption()
	assert(FileAccess.get_file_as_bytes(active_path) == active_bytes)
	coordinator.bootstrapping = false
	coordinator.resume_in_progress = true
	main._poki_save_before_interruption()
	assert(FileAccess.get_file_as_bytes(active_path) == active_bytes)
	coordinator.resume_in_progress = false
	AudioServer.set_bus_mute(0, true)
	main._sync_poki_pause(true)
	assert(paused)
	main._sync_poki_pause(false)
	assert(not paused)
	assert(AudioServer.is_bus_mute(0))
	main.queue_free()
	await process_frame
	assert(FileAccess.get_file_as_bytes(path) == bytes)
	print("PASS poki_runtime_smoke: catalog, featured setup, four difficulty tiers, shared renderer, unavailable-save preservation and pause/audio ownership")
	quit()
