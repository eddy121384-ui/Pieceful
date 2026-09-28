class_name PuzzlePieceVisualFactory
extends RefCounted

# #55 physical model:
# - ContactShadow answers "is this loose piece lifted from the table?"
# - Thickness answers "is this a thin cardboard object?"
# - Face carries the artwork.
# - Seam keeps joined/solved cuts legible without becoming the depth cue.
#
# Keep the renderer cheap: three Polygon2D items + one subtle Seam per piece.
const LOOSE_SHADOW_OFFSET_PX := Vector2(1.75, 2.10)
const LOOSE_THICKNESS_OFFSET_PX := Vector2(1.05, 1.28)
const JOINED_THICKNESS_OFFSET_PX := Vector2(0.78, 0.92)
const SOLVED_THICKNESS_OFFSET_PX := Vector2(0.46, 0.54)

const LOOSE_SHADOW_COLOR := Color(0.055, 0.060, 0.065, 0.10)
const LOOSE_THICKNESS_COLOR := Color(0.46, 0.455, 0.44, 0.92)
const JOINED_THICKNESS_COLOR := Color(0.43, 0.425, 0.41, 0.64)
const SOLVED_THICKNESS_COLOR := Color(0.40, 0.395, 0.38, 0.34)

# Directional edge relief: one antialiased Line2D still doubles as the cut seam.
# The contour brightens only where its outward normal faces the fixed upper-left
# light, and darkens on the opposite side. This avoids a continuous white outline
# and does not add another CanvasItem per piece.
const EDGE_LIGHT_DIRECTION := Vector2(-0.70710678, -0.70710678)
const EDGE_HIGHLIGHT_COLOR := Color(0.96, 0.97, 0.98, 0.22)
const EDGE_NEUTRAL_COLOR := Color(0.40, 0.41, 0.42, 0.025)
const EDGE_SHADOW_COLOR := Color(0.055, 0.060, 0.065, 0.11)
const EDGE_RELIEF_WIDTH_PX := 0.68
const EDGE_RELIEF_INSET_PX := 0.58
const EDGE_GRADIENT_MAX_STOPS := 20
const LOOSE_EDGE_RELIEF_ALPHA := 1.0
const JOINED_EDGE_RELIEF_ALPHA := 0.78
const SOLVED_EDGE_RELIEF_ALPHA := 0.58


static func add_piece_visuals(
	parent: Node,
	points: PackedVector2Array,
	uvs: PackedVector2Array,
	texture: Texture2D,
	visual_scale: float = 1.0
) -> Dictionary:
	var safe_scale := maxf(visual_scale, 0.01)
	var pixel_scale := 1.0 / safe_scale
	var result := {}

	# This is deliberately weak and detached from the cardboard edge. It should
	# read as table contact, never as the piece's thickness.
	var contact_shadow := Polygon2D.new()
	contact_shadow.name = "ContactShadow"
	contact_shadow.polygon = points
	contact_shadow.position = LOOSE_SHADOW_OFFSET_PX * pixel_scale
	contact_shadow.color = LOOSE_SHADOW_COLOR
	# All visual children stay inside the piece parent's z band. Their fixed
	# creation order supplies the internal stack without leaking into another piece.
	contact_shadow.z_index = 0
	contact_shadow.z_as_relative = true
	parent.add_child(contact_shadow)
	result["contact_shadow"] = contact_shadow

	# The visible side wall is neutral grey cardboard, not a black shadow or a
	# warm/brown rim. A lower-right offset lets the artwork face cover the
	# top-left portion, leaving an exposed edge that reads as physical thickness.
	var thickness := Polygon2D.new()
	thickness.name = "Thickness"
	thickness.polygon = points
	thickness.position = LOOSE_THICKNESS_OFFSET_PX * pixel_scale
	thickness.color = LOOSE_THICKNESS_COLOR
	thickness.z_index = 0
	thickness.z_as_relative = true
	parent.add_child(thickness)
	result["thickness"] = thickness

	var face := Polygon2D.new()
	face.name = "Face"
	face.polygon = points
	face.uv = uvs
	face.texture = texture
	face.color = Color.WHITE
	face.z_index = 0
	face.z_as_relative = true
	parent.add_child(face)
	result["face"] = face

	var seam := Line2D.new()
	seam.name = "Seam"
	var seam_points := _build_inset_edge_points(
		points,
		EDGE_RELIEF_INSET_PX * pixel_scale
	)
	if not seam_points.is_empty():
		seam_points.append(seam_points[0])
	seam.points = seam_points
	seam.width = EDGE_RELIEF_WIDTH_PX * pixel_scale
	seam.default_color = Color.WHITE
	seam.gradient = _build_directional_edge_gradient(seam_points)
	seam.self_modulate = Color(1.0, 1.0, 1.0, LOOSE_EDGE_RELIEF_ALPHA)
	seam.antialiased = true
	seam.z_index = 0
	seam.z_as_relative = true
	parent.add_child(seam)
	result["seam"] = seam

	return result


static func apply_joined_state(parent: Node, visual_scale: float = 1.0) -> void:
	var pixel_scale := 1.0 / maxf(visual_scale, 0.01)
	var contact_shadow := parent.get_node_or_null("ContactShadow") as Polygon2D
	var thickness := parent.get_node_or_null("Thickness") as Polygon2D
	var seam := parent.get_node_or_null("Seam") as Line2D

	# Joined islands should no longer look like independent tiles floating on
	# separate shadows. Thickness remains because the island is still cardboard.
	if contact_shadow != null:
		contact_shadow.visible = false
	if thickness != null:
		thickness.position = JOINED_THICKNESS_OFFSET_PX * pixel_scale
		thickness.color = JOINED_THICKNESS_COLOR
	if seam != null:
		seam.self_modulate = Color(1.0, 1.0, 1.0, JOINED_EDGE_RELIEF_ALPHA)


static func apply_solved_state(parent: Node, visual_scale: float = 1.0) -> void:
	var pixel_scale := 1.0 / maxf(visual_scale, 0.01)
	var contact_shadow := parent.get_node_or_null("ContactShadow") as Polygon2D
	var thickness := parent.get_node_or_null("Thickness") as Polygon2D
	var seam := parent.get_node_or_null("Seam") as Line2D

	# Once anchored to the board there is no floating contact shadow at all.
	# Keep only a very shallow cardboard side cue and a quiet cut seam.
	if contact_shadow != null:
		contact_shadow.visible = false
	if thickness != null:
		thickness.position = SOLVED_THICKNESS_OFFSET_PX * pixel_scale
		thickness.color = SOLVED_THICKNESS_COLOR
	if seam != null:
		seam.self_modulate = Color(1.0, 1.0, 1.0, SOLVED_EDGE_RELIEF_ALPHA)


static func _build_directional_edge_gradient(points: PackedVector2Array) -> Gradient:
	var gradient := Gradient.new()
	if points.size() < 3:
		gradient.set_color(0, EDGE_NEUTRAL_COLOR)
		gradient.set_color(1, EDGE_NEUTRAL_COLOR)
		return gradient

	var cumulative := PackedFloat32Array()
	cumulative.append(0.0)
	var total_length := 0.0
	for index in range(1, points.size()):
		total_length += points[index - 1].distance_to(points[index])
		cumulative.append(total_length)
	total_length += points[points.size() - 1].distance_to(points[0])

	if total_length <= 0.001:
		gradient.set_color(0, EDGE_NEUTRAL_COLOR)
		gradient.set_color(1, EDGE_NEUTRAL_COLOR)
		return gradient

	var signed_area := _signed_polygon_area(points)
	var first_color := _directional_edge_color(points, 0, signed_area)
	gradient.set_offset(0, 0.0)
	gradient.set_color(0, first_color)
	gradient.set_offset(1, 1.0)
	gradient.set_color(1, first_color)

	# Cap unique stops so high-piece-count puzzles do not create huge per-piece
	# gradients. Jigsaw contours are already densely sampled, so this preserves
	# the curved light roll while keeping construction bounded.
	var stride := maxi(
		1,
		ceili(float(points.size()) / float(maxi(EDGE_GRADIENT_MAX_STOPS - 1, 1)))
	)
	for index in range(1, points.size()):
		if index % stride != 0:
			continue
		gradient.add_point(
			float(cumulative[index]) / total_length,
			_directional_edge_color(points, index, signed_area)
		)

	return gradient


static func _directional_edge_color(
	points: PackedVector2Array,
	index: int,
	signed_area: float
) -> Color:
	var count := points.size()
	if count < 3:
		return EDGE_NEUTRAL_COLOR

	var previous := points[(index - 1 + count) % count]
	var current := points[index]
	var following := points[(index + 1) % count]

	var incoming := (current - previous).normalized()
	var outgoing := (following - current).normalized()

	var incoming_normal := _outward_normal(incoming, signed_area)
	var outgoing_normal := _outward_normal(outgoing, signed_area)
	var normal := incoming_normal + outgoing_normal
	if normal.length_squared() <= 0.000001:
		normal = outgoing_normal
	else:
		normal = normal.normalized()

	var facing := clampf(normal.dot(EDGE_LIGHT_DIRECTION), -1.0, 1.0)
	if facing >= 0.0:
		return EDGE_NEUTRAL_COLOR.lerp(EDGE_HIGHLIGHT_COLOR, pow(facing, 0.72))
	return EDGE_NEUTRAL_COLOR.lerp(EDGE_SHADOW_COLOR, pow(-facing, 0.72))


static func _outward_normal(direction: Vector2, signed_area: float) -> Vector2:
	# Piece contours use screen-space coordinates (Y grows downward). Positive
	# signed area therefore traverses visually clockwise, whose outward normal is
	# the right-hand perpendicular.
	if signed_area >= 0.0:
		return Vector2(direction.y, -direction.x)
	return Vector2(-direction.y, direction.x)


static func _signed_polygon_area(points: PackedVector2Array) -> float:
	var twice_area := 0.0
	for index in range(points.size()):
		var current := points[index]
		var following := points[(index + 1) % points.size()]
		twice_area += current.x * following.y - following.x * current.y
	return twice_area * 0.5


static func _build_inset_edge_points(
	points: PackedVector2Array,
	inset: float
) -> PackedVector2Array:
	var inset_points := PackedVector2Array()
	if points.size() < 3 or inset <= 0.0:
		return points.duplicate()

	var signed_area := _signed_polygon_area(points)
	var count := points.size()
	for index in range(count):
		var previous := points[(index - 1 + count) % count]
		var current := points[index]
		var following := points[(index + 1) % count]

		var incoming := (current - previous).normalized()
		var outgoing := (following - current).normalized()
		var incoming_normal := _outward_normal(incoming, signed_area)
		var outgoing_normal := _outward_normal(outgoing, signed_area)
		var outward := incoming_normal + outgoing_normal
		if outward.length_squared() <= 0.000001:
			outward = outgoing_normal
		else:
			outward = outward.normalized()

		# Pull the relief line into the artwork so the antialiased stroke reads
		# as a tiny face bevel instead of a halo around the cardboard silhouette.
		inset_points.append(current - outward * inset)

	return inset_points
