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

const LOOSE_SHADOW_COLOR := Color(0.0, 0.0, 0.0, 0.10)
const LOOSE_THICKNESS_COLOR := Color(0.30, 0.215, 0.125, 0.92)
const JOINED_THICKNESS_COLOR := Color(0.285, 0.205, 0.12, 0.64)
const SOLVED_THICKNESS_COLOR := Color(0.26, 0.19, 0.115, 0.34)

const LOOSE_SEAM_COLOR := Color(0.055, 0.050, 0.044, 0.28)
const JOINED_SEAM_COLOR := Color(0.055, 0.050, 0.044, 0.22)
const SOLVED_SEAM_COLOR := Color(0.055, 0.050, 0.044, 0.16)
const SEAM_WIDTH_PX := 0.82


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
	contact_shadow.z_index = -3
	parent.add_child(contact_shadow)
	result["contact_shadow"] = contact_shadow

	# The visible side wall is warm cardboard, not black. A lower-right offset
	# lets the artwork face cover the top-left portion, leaving an exposed edge
	# that reads as physical thickness under the fixed upper-left light.
	var thickness := Polygon2D.new()
	thickness.name = "Thickness"
	thickness.polygon = points
	thickness.position = LOOSE_THICKNESS_OFFSET_PX * pixel_scale
	thickness.color = LOOSE_THICKNESS_COLOR
	thickness.z_index = -2
	parent.add_child(thickness)
	result["thickness"] = thickness

	var face := Polygon2D.new()
	face.name = "Face"
	face.polygon = points
	face.uv = uvs
	face.texture = texture
	face.color = Color.WHITE
	face.z_index = 0
	parent.add_child(face)
	result["face"] = face

	var seam := Line2D.new()
	seam.name = "Seam"
	var seam_points := points.duplicate()
	if not seam_points.is_empty():
		seam_points.append(seam_points[0])
	seam.points = seam_points
	seam.width = SEAM_WIDTH_PX * pixel_scale
	seam.default_color = LOOSE_SEAM_COLOR
	seam.antialiased = true
	seam.z_index = 1
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
		seam.default_color = JOINED_SEAM_COLOR


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
		seam.default_color = SOLVED_SEAM_COLOR
