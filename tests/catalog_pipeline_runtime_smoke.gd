extends SceneTree

const MainScene = preload("res://main.tscn")
const SAMPLE := "pipeline_sample_met_10181"


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	var main = MainScene.instantiate()
	root.add_child(main)
	for _frame in range(20):
		await process_frame
	var board = main.get_node("PuzzleBoard")
	var entry: Dictionary = board.content_metadata(SAMPLE)
	if entry.is_empty() or not main.content_buttons.has(SAMPLE):
		_fail("generated catalog entry is absent from the actual Gallery")
		return
	var thumb = load(str(entry["thumbnail_path"]))
	if not thumb is Texture2D or maxf(thumb.get_width(), thumb.get_height()) != 420.0:
		_fail("generated contain thumbnail is not a runtime resource")
		return
	main._on_content_card_pressed(SAMPLE)
	main._select_picker_difficulty("relaxed")
	main._start_selected_puzzle()
	for _frame in range(10):
		await process_frame
	if board.active_content_id() != SAMPLE or board.active_puzzle_texture().get_width() != 1800:
		_fail("new puzzle loaded thumbnail/incorrect artwork")
		return
	var identity: Dictionary = board.active_content_identity()
	if identity["sha256"] != "04801cd56e23594e2ec51c2fb6a80d86f608c47fcf6f122e61d7e90cd6dcf6e1" or identity["source_id"] != "example:met_10181":
		_fail("new catalog original-byte identity changed")
		return
	if int(board.active_grid_resolution().get("piece_count", 0)) <= 0:
		_fail("new artwork cannot resolve accepted cut/layout gameplay")
		return
	main._leave_puzzle_for_gallery()
	main.queue_free()
	await process_frame
	print("PASS catalog_pipeline_runtime_smoke: generated sample visible/selectable/playable; source quality and identity preserved")
	quit(0)


func _fail(message: String) -> void:
	push_error("FAIL catalog_pipeline_runtime_smoke: " + message)
	quit(1)
