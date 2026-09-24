extends SceneTree

const PuzzlePieceScript = preload("res://scripts/puzzle_piece.gd")
const EdgeVisualScript = preload("res://scripts/puzzle_piece_edge_visual.gd")


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	var image := Image.create(64, 64, false, Image.FORMAT_RGBA8)
	image.fill(Color(0.35, 0.55, 0.75, 1.0))
	var texture := ImageTexture.create_from_image(image)

	var points := PackedVector2Array([
		Vector2(0.0, 0.0),
		Vector2(64.0, 0.0),
		Vector2(64.0, 64.0),
		Vector2(0.0, 64.0),
	])

	var piece = PuzzlePieceScript.new()
	root.add_child(piece)
	piece.configure(
		0,
		texture,
		Vector2(100.0, 100.0),
		Vector2(64.0, 64.0),
		Vector2.ZERO,
		Vector2(64.0, 64.0),
		points,
		Vector2(40.0, 40.0)
	)
	await process_frame

	var shadow = piece.get_node_or_null("Shadow")
	var thickness = piece.get_node_or_null("Thickness")
	var face = piece.get_node_or_null("Face")
	var bevel = piece.get_node_or_null("Bevel")
	var legacy_outline = piece.get_node_or_null("Outline")
	var legacy_edge = piece.get_node_or_null("EdgeLighting")

	if shadow == null or thickness == null or face == null or bevel == null:
		_fail("2.5D cardboard visual stack is incomplete")
		return
	if legacy_outline != null or legacy_edge != null:
		_fail("legacy line-based edge renderer returned")
		return
	if not (bevel is EdgeVisualScript):
		_fail("Bevel is not the shared contour bevel renderer")
		return
	if not shadow.has_method("configure"):
		_fail("soft shadow renderer is missing")
		return
	if not thickness.has_method("configure"):
		_fail("cardboard thickness renderer is missing")
		return
	if EdgeVisualScript.BEVEL_WIDTH_PX < 2.5:
		_fail("bevel is too narrow to read as a surface")
		return
	if EdgeVisualScript.HIGHLIGHT_ALPHA <= EdgeVisualScript.INNER_CATCHLIGHT_ALPHA:
		_fail("directional bevel highlight is not stronger than the inner catchlight")
		return

	piece.snap_to_target()
	await process_frame
	if shadow.visible:
		_fail("solved piece retained the floating contact shadow")
		return
	if not thickness.visible or not bevel.visible:
		_fail("solved piece lost its cardboard depth")
		return

	piece.queue_free()
	await process_frame
	print("PASS puzzle_piece_depth_smoke")
	quit(0)


func _fail(message: String) -> void:
	push_error("FAIL puzzle_piece_depth_smoke: %s" % message)
	quit(1)
