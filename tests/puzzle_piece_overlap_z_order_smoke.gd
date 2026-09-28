extends SceneTree

const PuzzlePieceScript = preload("res://scripts/puzzle_piece.gd")
const VISUAL_NAMES := ["ContactShadow", "Thickness", "Face", "EdgeRelief"]


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

	var lower = _make_piece("LowerPiece", 0, texture, points)
	var upper = _make_piece("UpperPiece", 1, texture, points)
	root.add_child(lower)
	root.add_child(upper)

	# Deliberately use adjacent parent z values and identical positions. The
	# renderer must not require a giant per-piece stride to keep overlap correct.
	lower.position = Vector2(80.0, 80.0)
	upper.position = lower.position
	lower.z_index = 200
	upper.z_index = 201
	await process_frame

	if upper.z_index - lower.z_index != 1:
		_fail("fixture no longer exercises adjacent piece z bands")
		return

	for piece in [lower, upper]:
		if not _assert_piece_local_stack(piece):
			return

	var upper_face := upper.get_node_or_null("Face") as CanvasItem
	if upper_face == null:
		_fail("upper piece Face missing")
		return
	var upper_face_z := _effective_child_z(upper, upper_face)

	for lower_name in ["ContactShadow", "Thickness", "EdgeRelief"]:
		var lower_visual := lower.get_node_or_null(lower_name) as CanvasItem
		if lower_visual == null:
			_fail("lower piece %s missing" % lower_name)
			return
		if _effective_child_z(lower, lower_visual) >= upper_face_z:
			_fail(
				"lower %s escaped its piece z band (%d >= upper Face %d)"
				% [lower_name, _effective_child_z(lower, lower_visual), upper_face_z]
			)
			return

	lower.queue_free()
	upper.queue_free()
	await process_frame
	print("PASS puzzle_piece_overlap_z_order_smoke")
	quit(0)


func _make_piece(
	piece_name: String,
	piece_index: int,
	texture: Texture2D,
	points: PackedVector2Array
):
	var piece = PuzzlePieceScript.new()
	piece.name = piece_name
	piece.configure(
		piece_index,
		texture,
		Vector2(300.0, 220.0),
		Vector2(64.0, 64.0),
		Vector2.ZERO,
		Vector2(64.0, 64.0),
		points,
		Vector2.ZERO
	)
	return piece


func _assert_piece_local_stack(piece) -> bool:
	var previous_index := -1
	for visual_name in VISUAL_NAMES:
		var visual := piece.get_node_or_null(visual_name) as CanvasItem
		if visual == null:
			_fail("%s missing %s" % [piece.name, visual_name])
			return false
		if visual.z_index != 0:
			_fail(
				"%s %s escaped parent z band with local z=%d"
				% [piece.name, visual_name, visual.z_index]
			)
			return false
		if not visual.z_as_relative:
			_fail("%s %s stopped inheriting parent z" % [piece.name, visual_name])
			return false
		if visual.top_level or visual.show_behind_parent:
			_fail("%s %s can escape the parent draw band" % [piece.name, visual_name])
			return false
		if visual.get_index() <= previous_index:
			_fail("%s internal draw order changed at %s" % [piece.name, visual_name])
			return false
		previous_index = visual.get_index()
	return true


func _effective_child_z(piece: CanvasItem, child: CanvasItem) -> int:
	if child.z_as_relative:
		return piece.z_index + child.z_index
	return child.z_index


func _fail(message: String) -> void:
	push_error("FAIL puzzle_piece_overlap_z_order_smoke: %s" % message)
	quit(1)
