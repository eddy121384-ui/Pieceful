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
	var relief := piece.get_node_or_null("EdgeRelief")

	if contact_shadow == null or thickness == null or face == null or relief == null:
		_fail("cardboard visual stack is incomplete")
		return
	if not (
		contact_shadow is Polygon2D
		and thickness is Polygon2D
		and face is Polygon2D
		and relief is Line2D
	):
		_fail("cardboard stack left the expected Polygon2D + EdgeRelief path")
		return
	# "Seam" was the rejected stroked contour; the rim is now face relief.
	for legacy_name in ["Seam", "Shadow", "WarmRim", "DarkRelief", "Bevel", "Outline", "EdgeLighting"]:
		if piece.get_node_or_null(legacy_name) != null:
			_fail("legacy depth renderer returned: %s" % legacy_name)
			return
	for child in piece.get_children():
		if child is MeshInstance2D:
			_fail("runtime piece depth created a mesh render item")
			return
		if child is Line2D and child.name != "EdgeRelief":
			_fail("unexpected line renderer returned: %s" % child.name)
			return

	var render_item_count := 0
	for child in piece.get_children():
		if child is CanvasItem and not (child is CollisionPolygon2D):
			render_item_count += 1
	if render_item_count != 4:
		_fail("expected 3 relief layers plus 1 EdgeRelief, got %d render items" % render_item_count)
		return
	if not _assert_edge_relief_material(piece, relief as Line2D, VisualFactoryScript.STATE_LOOSE):
		return

	# The band is face relief, not a stroke: it paints no colour of its own.
	var relief_line := relief as Line2D
	if relief_line.default_color != Color.WHITE or relief_line.texture != null:
		_fail("EdgeRelief started painting its own colour/texture")
		return
	if relief_line.gradient != null:
		_fail("EdgeRelief gained a colour gradient stroke")
		return
	if relief_line.texture_mode == Line2D.LINE_TEXTURE_NONE:
		_fail("EdgeRelief lost the across-cut UV its shader lights")
		return
	if not relief_line.closed:
		_fail("EdgeRelief contour is not closed")
		return
	var relief_points := relief_line.points
	if relief_points.size() >= 2 and relief_points[0].is_equal_approx(relief_points[relief_points.size() - 1]):
		_fail("EdgeRelief kept a zero-length closing segment (band spike)")
		return
	var extent := minf(piece.piece_size.x, piece.piece_size.y)
	var expected_half_width := clampf(
		extent * VisualFactoryScript.EDGE_RELIEF_WIDTH_RATIO,
		VisualFactoryScript.EDGE_RELIEF_MIN_HALF_WIDTH_PX,
		VisualFactoryScript.EDGE_RELIEF_MAX_HALF_WIDTH_PX
	)
	if not is_equal_approx(relief_line.width, expected_half_width * 2.0):
		_fail("EdgeRelief width %.3f drifted from %.3f" % [relief_line.width, expected_half_width * 2.0])
		return
	if relief_line.width > extent * 0.05:
		_fail("EdgeRelief band became wide enough to read as a border")
		return

	# A second piece must reuse the exact same material instance.
	var sibling = PuzzlePieceScript.new()
	root.add_child(sibling)
	sibling.configure(
		1,
		texture,
		Vector2(200.0, 100.0),
		Vector2(64.0, 64.0),
		Vector2.ZERO,
		Vector2(64.0, 64.0),
		points,
		Vector2(140.0, 40.0)
	)
	var sibling_relief := sibling.get_node_or_null("EdgeRelief") as Line2D
	if sibling_relief == null or sibling_relief.material != relief_line.material:
		_fail("pieces stopped sharing one EdgeRelief material")
		return
	sibling.queue_free()

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
	for cardboard_color in [
		VisualFactoryScript.LOOSE_THICKNESS_COLOR,
		VisualFactoryScript.JOINED_THICKNESS_COLOR,
		VisualFactoryScript.SOLVED_THICKNESS_COLOR,
	]:
		var channel_spread := maxf(
			cardboard_color.r,
			maxf(cardboard_color.g, cardboard_color.b)
		) - minf(
			cardboard_color.r,
			minf(cardboard_color.g, cardboard_color.b)
		)
		if channel_spread > 0.04:
			_fail("cardboard side wall drifted away from neutral grey")
			return
	if VisualFactoryScript.LOOSE_SHADOW_COLOR.r > 0.10:
		_fail("contact shadow became too bright to read as faint charcoal")
		return
	if VisualFactoryScript.LOOSE_THICKNESS_COLOR.a <= VisualFactoryScript.LOOSE_SHADOW_COLOR.a:
		_fail("shadow became visually stronger than the cardboard thickness")
		return

	var loose_thickness_offset := (thickness as Polygon2D).position.length()

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
	if not _assert_edge_relief_material(piece, relief_line, VisualFactoryScript.STATE_JOINED):
		return
	if not _assert_relief_quieter(VisualFactoryScript.STATE_JOINED, VisualFactoryScript.STATE_LOOSE):
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
	if not relief_line.visible:
		_fail("solved piece lost its rolled cut edge")
		return
	if not _assert_edge_relief_material(piece, relief_line, VisualFactoryScript.STATE_SOLVED):
		return
	if not _assert_relief_quieter(VisualFactoryScript.STATE_SOLVED, VisualFactoryScript.STATE_JOINED):
		return

	piece.queue_free()
	await process_frame
	print("PASS puzzle_piece_depth_smoke")
	quit(0)


func _assert_edge_relief_material(piece: Node, relief: Line2D, state: StringName) -> bool:
	var material := relief.material as ShaderMaterial
	if material == null:
		_fail("EdgeRelief has no ShaderMaterial in %s state" % state)
		return false
	if material != VisualFactoryScript.edge_relief_material(state):
		_fail("EdgeRelief is not using the shared %s material" % state)
		return false
	if material.shader != VisualFactoryScript.EdgeReliefShader:
		_fail("EdgeRelief material lost the relief shader")
		return false
	var code := material.shader.code
	if code.find("blend_premul_alpha") < 0:
		_fail("relief shader no longer modulates the artwork (premultiplied shade + sheen)")
		return false
	for texture_hint in ["hint_screen_texture", "SCREEN_TEXTURE", "sampler2D"]:
		if code.find(texture_hint) >= 0:
			_fail("relief shader started sampling textures (%s)" % texture_hint)
			return false
	var params: Dictionary = VisualFactoryScript.EDGE_RELIEF_STATE_PARAMS[state]
	for key in params:
		if not is_equal_approx(float(material.get_shader_parameter(key)), float(params[key])):
			_fail("%s material parameter %s drifted" % [state, key])
			return false
	if state != VisualFactoryScript.STATE_LOOSE and float(params["crease_strength"]) != 0.0:
		_fail("%s pieces must not draw an outside crease over neighbour faces" % state)
		return false
	if piece.get_node_or_null("EdgeRelief") != relief:
		_fail("EdgeRelief node was replaced during a state change")
		return false
	return true


func _assert_relief_quieter(state: StringName, than_state: StringName) -> bool:
	var params: Dictionary = VisualFactoryScript.EDGE_RELIEF_STATE_PARAMS[state]
	var louder: Dictionary = VisualFactoryScript.EDGE_RELIEF_STATE_PARAMS[than_state]
	for key in ["sheen_strength", "gloss_strength", "shade_strength"]:
		if float(params[key]) <= 0.0:
			_fail("%s lost its %s entirely" % [state, key])
			return false
		if float(params[key]) > float(louder[key]):
			_fail("%s %s is stronger than %s" % [state, key, than_state])
			return false
	return true


func _fail(message: String) -> void:
	push_error("FAIL puzzle_piece_depth_smoke: %s" % message)
	quit(1)
