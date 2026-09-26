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

	var contact_shadow := piece.get_node_or_null("ContactShadow")
	var thickness := piece.get_node_or_null("Thickness")
	var face := piece.get_node_or_null("Face")
	var seam := piece.get_node_or_null("Seam")

	if contact_shadow == null or thickness == null or face == null or seam == null:
		_fail("cardboard visual stack is incomplete")
		return
	if not (
		contact_shadow is Polygon2D
		and thickness is Polygon2D
		and face is Polygon2D
		and seam is Line2D
	):
		_fail("cardboard stack left the expected Polygon2D + seam path")
		return
	for legacy_name in ["Shadow", "WarmRim", "DarkRelief", "Bevel", "Outline", "EdgeLighting"]:
		if piece.get_node_or_null(legacy_name) != null:
			_fail("legacy depth renderer returned: %s" % legacy_name)
			return
	for child in piece.get_children():
		if child is MeshInstance2D:
			_fail("runtime piece depth created a mesh render item")
			return
		if child is Line2D and child.name != "Seam":
			_fail("unexpected line renderer returned: %s" % child.name)
			return

	var render_item_count := 0
	for child in piece.get_children():
		if child is CanvasItem and not (child is CollisionPolygon2D):
			render_item_count += 1
	if render_item_count != 4:
		_fail("expected 3 relief layers plus 1 seam, got %d render items" % render_item_count)
		return
	if (seam as Line2D).width < 0.6 or (seam as Line2D).width > 1.1:
		_fail("seam width drifted outside the subtle cut-line range")
		return
	if (seam as Line2D).default_color.a <= 0.0:
		_fail("loose piece seam is invisible")
		return

	if not (
		(contact_shadow as Polygon2D).position.x > 0.0
		and (contact_shadow as Polygon2D).position.y > 0.0
	):
		_fail("contact shadow is not offset toward the lower-right")
		return
	if not (
		(thickness as Polygon2D).position.x > 0.0
		and (thickness as Polygon2D).position.y > 0.0
	):
		_fail("cardboard thickness is not offset toward the lower-right")
		return
	if (contact_shadow as Polygon2D).position.length() <= (thickness as Polygon2D).position.length():
		_fail("contact shadow is not separated beyond the cardboard side wall")
		return
	if VisualFactoryScript.LOOSE_SHADOW_COLOR.a >= 0.18:
		_fail("loose contact shadow became too strong and may read as floating")
		return
	if VisualFactoryScript.LOOSE_THICKNESS_COLOR.r <= VisualFactoryScript.LOOSE_THICKNESS_COLOR.b:
		_fail("cardboard side wall lost its warm material tint")
		return
	if VisualFactoryScript.LOOSE_THICKNESS_COLOR.a <= VisualFactoryScript.LOOSE_SHADOW_COLOR.a:
		_fail("shadow became visually stronger than the cardboard thickness")
		return

	var loose_thickness_offset := (thickness as Polygon2D).position.length()
	var loose_seam_alpha := (seam as Line2D).default_color.a

	piece.apply_joined_visual()
	await process_frame

	if (contact_shadow as Polygon2D).visible:
		_fail("joined cluster retained per-piece floating contact shadow")
		return
	var joined_thickness_offset := (thickness as Polygon2D).position.length()
	if joined_thickness_offset >= loose_thickness_offset:
		_fail("joined cluster did not settle its cardboard thickness")
		return
	if not (thickness as Polygon2D).visible or (thickness as Polygon2D).color.a <= 0.0:
		_fail("joined cluster lost cardboard thickness completely")
		return
	var joined_seam_alpha := (seam as Line2D).default_color.a
	if joined_seam_alpha <= 0.0 or joined_seam_alpha >= loose_seam_alpha:
		_fail("joined seam did not become quieter while remaining visible")
		return

	piece.snap_to_target()
	await process_frame

	if (contact_shadow as Polygon2D).visible:
		_fail("solved piece retained floating contact shadow")
		return
	var solved_thickness_offset := (thickness as Polygon2D).position.length()
	if solved_thickness_offset >= joined_thickness_offset:
		_fail("solved piece did not settle below joined-cluster thickness")
		return
	if (thickness as Polygon2D).color.a >= VisualFactoryScript.JOINED_THICKNESS_COLOR.a:
		_fail("solved piece retained joined-cluster thickness strength")
		return
	if not (seam as Line2D).visible or (seam as Line2D).default_color.a <= 0.0:
		_fail("solved piece lost its subtle seam")
		return
	if (seam as Line2D).default_color.a >= joined_seam_alpha:
		_fail("solved seam did not soften relative to joined state")
		return

	piece.queue_free()
	await process_frame
	print("PASS puzzle_piece_depth_smoke")
	quit(0)


func _fail(message: String) -> void:
	push_error("FAIL puzzle_piece_depth_smoke: %s" % message)
	quit(1)
