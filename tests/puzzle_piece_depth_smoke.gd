extends SceneTree

const PuzzlePieceScript = preload("res://scripts/puzzle_piece.gd")
const VisualFactoryScript = preload("res://scripts/puzzle_piece_visual_factory.gd")


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

	var warm_rim := piece.get_node_or_null("WarmRim")
	var dark_relief := piece.get_node_or_null("DarkRelief")
	var face := piece.get_node_or_null("Face")

	if warm_rim == null or dark_relief == null or face == null:
		_fail("paper-relief visual stack is incomplete")
		return
	if not (warm_rim is Polygon2D and dark_relief is Polygon2D and face is Polygon2D):
		_fail("paper-relief stack left the standard Polygon2D path")
		return
	for legacy_name in ["Shadow", "Thickness", "Bevel", "Outline", "EdgeLighting"]:
		if piece.get_node_or_null(legacy_name) != null:
			_fail("legacy depth renderer returned: %s" % legacy_name)
			return
	for child in piece.get_children():
		if child is MeshInstance2D or child is Line2D:
			_fail("runtime piece depth created a mesh or line render item")
			return

	var render_item_count := 0
	for child in piece.get_children():
		if child is CanvasItem and not (child is CollisionPolygon2D):
			render_item_count += 1
	if render_item_count != 3:
		_fail("expected exactly 3 paper-relief render items, got %d" % render_item_count)
		return

	if not (
		(warm_rim as Polygon2D).position.x < 0.0
		and (warm_rim as Polygon2D).position.y < 0.0
	):
		_fail("warm rim is not offset toward the upper-left")
		return
	if not (
		(dark_relief as Polygon2D).position.x > 0.0
		and (dark_relief as Polygon2D).position.y > 0.0
	):
		_fail("dark relief is not offset toward the lower-right")
		return
	if VisualFactoryScript.LOOSE_LIGHT_COLOR.r <= VisualFactoryScript.LOOSE_LIGHT_COLOR.b:
		_fail("warm rim lost its warm tint")
		return

	var loose_dark_offset := (dark_relief as Polygon2D).position.length()
	piece.snap_to_target()
	await process_frame

	var solved_dark_offset := (dark_relief as Polygon2D).position.length()
	if solved_dark_offset >= loose_dark_offset:
		_fail("solved piece retained the loose floating relief offset")
		return
	if (dark_relief as Polygon2D).color.a >= VisualFactoryScript.LOOSE_DARK_COLOR.a:
		_fail("solved piece retained the loose dark-relief strength")
		return
	if not (warm_rim as Polygon2D).visible or not (dark_relief as Polygon2D).visible:
		_fail("solved piece lost its subtle paper relief")
		return

	piece.queue_free()
	await process_frame
	print("PASS puzzle_piece_depth_smoke")
	quit(0)


func _fail(message: String) -> void:
	push_error("FAIL puzzle_piece_depth_smoke: %s" % message)
	quit(1)
