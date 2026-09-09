extends SceneTree

const SQUARE_BASE := Vector2i(720, 720)

func _initialize() -> void:
	call_deferred("_run")

func _ms(start_usec: int) -> float:
	return float(Time.get_ticks_usec() - start_usec) / 1000.0

func _fail(message: String, code: int) -> void:
	push_error(message)
	quit(code)

func _resize_first_frame(window: Window, next_size: Vector2i) -> float:
	var t := Time.get_ticks_usec()
	window.size = next_size
	await process_frame
	return _ms(t)

func _count_canvas_items(root: Node) -> int:
	var total := 1 if root is CanvasItem else 0
	for child in root.get_children():
		total += _count_canvas_items(child)
	return total

func _set_piece_decor_visible(board, shown: bool) -> void:
	for piece in board.pieces:
		if not is_instance_valid(piece):
			continue
		var shadow = piece.get_node_or_null("Shadow")
		var outline = piece.get_node_or_null("Outline")
		if shadow is CanvasItem:
			shadow.visible = shown
		if outline is CanvasItem:
			outline.visible = shown

func _run() -> void:
	var packed := load("res://main.tscn") as PackedScene
	if packed == null:
		_fail("Hard render-tree profile: main.tscn failed to load", 160)
		return

	var window := get_root().get_window()
	window.size = Vector2i(1280, 720)
	await process_frame

	var scene = packed.instantiate()
	get_root().add_child(scene)
	await create_timer(0.45).timeout
	var board = scene.get_node("PuzzleBoard")
	var save = scene.get_node("SaveCoordinator")
	save.clear_save()
	if not board.request_difficulty("hard"):
		_fail("Hard render-tree profile: Hard failed", 161)
		return
	await process_frame
	await process_frame
	await create_timer(0.15).timeout

	print(
		"Pieceful render-tree profile · Hard %d · board CanvasItems %d · base %s"
		% [board.active_piece_count(), _count_canvas_items(board), window.content_scale_size]
	)

	var baseline_p := await _resize_first_frame(window, Vector2i(720, 1280))
	await create_timer(0.12).timeout
	var baseline_l := await _resize_first_frame(window, Vector2i(1280, 720))
	await create_timer(0.12).timeout
	print("PROFILE baseline visible tree · portrait %.3f ms · landscape %.3f ms" % [baseline_p, baseline_l])

	_set_piece_decor_visible(board, false)
	await process_frame
	await create_timer(0.08).timeout
	var lite_p := await _resize_first_frame(window, Vector2i(720, 1280))
	await create_timer(0.12).timeout
	var lite_l := await _resize_first_frame(window, Vector2i(1280, 720))
	await create_timer(0.12).timeout
	print("PROFILE faces-only (Shadow+Outline hidden) · portrait %.3f ms · landscape %.3f ms" % [lite_p, lite_l])

	board.visible = false
	await process_frame
	await create_timer(0.08).timeout
	var hidden_p := await _resize_first_frame(window, Vector2i(720, 1280))
	await create_timer(0.12).timeout
	var hidden_l := await _resize_first_frame(window, Vector2i(1280, 720))
	await create_timer(0.12).timeout
	print("PROFILE PuzzleBoard hidden · portrait %.3f ms · landscape %.3f ms" % [hidden_p, hidden_l])

	board.visible = true
	_set_piece_decor_visible(board, true)
	await process_frame

	save.clear_save()
	print("Pieceful render-tree profile · PASS")
	quit(0)
