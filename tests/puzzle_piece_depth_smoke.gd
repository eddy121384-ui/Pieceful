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
	var edge = piece.get_node_or_null("EdgeLighting")
	var legacy_outline = piece.get_node_or_null("Outline")

	if shadow == null or thickness == null or face == null or edge == null:
		_fail("cardboard visual stack is incomplete")
		return
	if legacy_outline != null:
		_fail("legacy white Outline node returned")
		return
	if not (edge is EdgeVisualScript):
		_fail("EdgeLighting is not the shared directional renderer")
		return
	if Vector2(thickness.position).x <= 0.0 or Vector2(thickness.position).y <= 0.0:
		_fail("thickness silhouette is not offset toward the lower-right")
		return
	if EdgeVisualScript.BASE_EDGE_COLOR.r > 0.15:
		_fail("base edge is too bright; expected a dark neutral outline")
		return
	if EdgeVisualScript.HIGHLIGHT_COLOR.a > 0.25:
		_fail("edge highlight is too strong for the quiet cardboard treatment")
		return

	piece.snap_to_target()
	await process_frame
	if shadow.visible:
		_fail("solved piece retained the floating drop shadow")
		return
	if not thickness.visible or not edge.visible:
		_fail("solved piece lost its subtle cardboard edge treatment")
		return

	piece.queue_free()
	await process_frame
	print("PASS puzzle_piece_depth_smoke")
	quit(0)


func _fail(message: String) -> void:
	push_error("FAIL puzzle_piece_depth_smoke: %s" % message)
	quit(1)
