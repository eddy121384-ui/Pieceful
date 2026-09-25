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
		_fail("Bevel is not the shared mesh renderer")
		return
	if bevel.mesh == null or bevel.mesh.get_surface_count() < 1:
		_fail("bevel mesh was not generated")
		return
	if shadow.get_child_count() != 2:
		_fail("expected two lightweight shadow layers")
		return
	if EdgeVisualScript.BEVEL_WIDTH_PX < 2.5:
		_fail("bevel surface is too narrow")
		return

	var bevel_arrays := bevel.mesh.surface_get_arrays(0)
	var bevel_colors: PackedColorArray = bevel_arrays[Mesh.ARRAY_COLOR]
	var has_warm_lit_edge := false
	var has_shaded_edge := false
	for edge_color in bevel_colors:
		if edge_color.a < 0.5:
			continue
		if edge_color.r - edge_color.b > 0.015:
			has_warm_lit_edge = true
		if maxf(edge_color.r, maxf(edge_color.g, edge_color.b)) < 0.92:
			has_shaded_edge = true
	if not has_warm_lit_edge:
		_fail("bevel has no warm lit edge")
		return
	if not has_shaded_edge:
		_fail("bevel has no directional shaded edge")
		return
	if not (thickness is Polygon2D):
		_fail("cardboard thickness is not using the standard Polygon2D path")
		return
	if not (shadow.get_child(0) is Polygon2D and shadow.get_child(1) is Polygon2D):
		_fail("contact shadow is not using the standard Polygon2D path")
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
