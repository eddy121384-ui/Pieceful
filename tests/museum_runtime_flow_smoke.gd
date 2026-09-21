extends SceneTree

const MainScene = preload("res://main.tscn")
const MUSEUM_ID := "met_10181"


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	var main = MainScene.instantiate()
	root.add_child(main)
	for _frame in range(18):
		await process_frame

	var board = main.get_node_or_null("PuzzleBoard")
	if board == null:
		_fail("PuzzleBoard missing")
		return
	if not board.has_method("content_metadata"):
		_fail("Gallery catalog API missing")
		return

	var metadata: Dictionary = board.content_metadata(MUSEUM_ID)
	if metadata.is_empty():
		_fail("museum runtime entry missing")
		return
	var puzzle_path := str(metadata.get("path", ""))
	var thumb_path := str(metadata.get("thumbnail_path", ""))
	if not ResourceLoader.exists(puzzle_path):
		_fail("museum puzzle resource is not importable: %s" % puzzle_path)
		return
	if not ResourceLoader.exists(thumb_path):
		_fail("museum thumbnail resource is not importable: %s" % thumb_path)
		return

	main.call("_on_content_card_pressed", MUSEUM_ID)
	if str(main.get("_pending_content_id")) != MUSEUM_ID:
		_fail("museum card did not become pending selection")
		return

	_select_picker_difficulty(main, "hard")
	main.call("_start_selected_puzzle")
	for _frame in range(10):
		await process_frame

	if str(board.active_content_id()) != MUSEUM_ID:
		_fail("museum content did not become active")
		return
	if str(board.active_content_identity().get("source_id", "")) != "met:10181":
		_fail("museum durable source identity was not preserved")
		return

	var texture = board.active_puzzle_texture()
	if not (texture is Texture2D):
		_fail("museum puzzle texture did not load")
		return
	var size: Vector2 = texture.get_size()
	if maxf(size.x, size.y) < 1700.0:
		_fail("museum runtime loaded a thumbnail instead of the puzzle derivative: %s" % size)
		return

	var grid: Dictionary = board.active_grid_resolution()
	if int(grid.get("piece_count", 0)) <= 0:
		_fail("museum puzzle did not resolve a playable cut pattern")
		return
	if not bool(board.difficulty_available("hard")):
		_fail("museum puzzle lost normal player difficulty selection")
		return

	main.queue_free()
	await process_frame
	print(
		"PASS museum_runtime_flow_smoke: %s loaded at %dx%d with %d pieces"
		% [MUSEUM_ID, int(size.x), int(size.y), int(grid.get("piece_count", 0))]
	)
	quit(0)


func _select_picker_difficulty(main, difficulty_id: String) -> void:
	var picker = main.puzzle_selection_difficulty
	if picker == null:
		return
	for index in range(picker.get_item_count()):
		if str(picker.get_item_metadata(index)) == difficulty_id:
			picker.select(index)
			return


func _fail(message: String) -> void:
	push_error("FAIL museum_runtime_flow_smoke: %s" % message)
	quit(1)
