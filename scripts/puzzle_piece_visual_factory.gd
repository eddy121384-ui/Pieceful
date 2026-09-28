class_name PuzzlePieceVisualFactory
extends RefCounted

# #55 physical model:
# - ContactShadow answers "is this loose piece lifted from the table?"
# - Thickness answers "is this a thin cardboard object?"
# - Face carries the artwork.
# - EdgeRelief is the rounded die-cut rim of the printed face itself: a band
#   centred on the cut whose shared shader re-lights the artwork underneath
#   (sheen on upper-left rims, shade on lower-right rims, nothing on rims
#   perpendicular to the light). It never paints a colour of its own, so the
#   piece has no outline; it also keeps joined/solved cuts legible as a groove.
#
# Keep the renderer cheap: three Polygon2D items + one Line2D per piece, one
# shared ShaderMaterial per piece state, no per-piece textures or meshes, and
# no CPU walk over the (1k+ point) contour.
const EdgeReliefShader: Shader = preload("res://scripts/puzzle_piece_edge_relief.gdshader")

const LOOSE_SHADOW_OFFSET_PX := Vector2(1.75, 2.10)
const LOOSE_THICKNESS_OFFSET_PX := Vector2(1.05, 1.28)
const JOINED_THICKNESS_OFFSET_PX := Vector2(0.78, 0.92)
const SOLVED_THICKNESS_OFFSET_PX := Vector2(0.46, 0.54)

const LOOSE_SHADOW_COLOR := Color(0.055, 0.060, 0.065, 0.10)
const LOOSE_THICKNESS_COLOR := Color(0.37, 0.365, 0.355, 0.96)
const JOINED_THICKNESS_COLOR := Color(0.43, 0.425, 0.41, 0.64)
const SOLVED_THICKNESS_COLOR := Color(0.40, 0.395, 0.38, 0.34)

# Half of the relief band on each side of the cut, in piece-local units at
# visual_scale 1: a fixed fraction of the piece so the rolled edge reads the
# same on 40 and 286 pieces, clamped so it stays below the tight tab-neck
# radii of dense cut patterns (a wider band would fold at cusps).
const EDGE_RELIEF_WIDTH_RATIO := 0.018
const EDGE_RELIEF_MIN_HALF_WIDTH_PX := 0.45
const EDGE_RELIEF_MAX_HALF_WIDTH_PX := 1.35
const EDGE_RELIEF_DEFAULT_HALF_WIDTH_PX := 1.1

# Side-wall / table-shadow offsets are authored for the 40-piece reference cell.
const DEPTH_REFERENCE_EXTENT_PX := 75.0
const DEPTH_MIN_SCALE := 0.45
const DEPTH_WALL_SCALE := 0.85
const EDGE_RELIEF_SHARP_LIMIT := 1.08

const STATE_LOOSE := &"loose"
const STATE_JOINED := &"joined"
const STATE_SOLVED := &"solved"

# Shader parameters per piece state. Every piece in a state shares one
# ShaderMaterial, so this never grows with piece count.
const EDGE_RELIEF_STATE_PARAMS := {
	STATE_LOOSE: {
		"sheen_strength": 0.55,
		"gloss_strength": 0.26,
		"shade_strength": 0.58,
		"crease_strength": 0.45,
	},
	STATE_JOINED: {
		"sheen_strength": 0.30,
		"gloss_strength": 0.12,
		"shade_strength": 0.36,
		"crease_strength": 0.0,
	},
	STATE_SOLVED: {
		"sheen_strength": 0.18,
		"gloss_strength": 0.08,
		"shade_strength": 0.26,
		"crease_strength": 0.0,
	},
}

static var _edge_relief_materials := {}
# Rail / replay holders render the same puzzle's outlines without a piece_size
# of their own; they reuse the extent of the last real piece built.
static var _last_piece_extent := 0.0


# Smaller side of the nominal piece cell, in piece-local units (0 if unknown).
# O(1): read from the PuzzlePiece parent, never derived from the contour.
static func piece_extent(parent: Node) -> float:
	var size_value = parent.get("piece_size") if parent != null else null
	if size_value is Vector2 and minf(size_value.x, size_value.y) > 0.0:
		_last_piece_extent = minf(size_value.x, size_value.y)
	return _last_piece_extent


static func edge_relief_half_width(parent: Node) -> float:
	var extent := piece_extent(parent)
	if extent <= 0.0:
		return EDGE_RELIEF_DEFAULT_HALF_WIDTH_PX
	return clampf(
		extent * EDGE_RELIEF_WIDTH_RATIO,
		EDGE_RELIEF_MIN_HALF_WIDTH_PX,
		EDGE_RELIEF_MAX_HALF_WIDTH_PX
	)


# Cardboard is thin: the exposed wall and table shadow shrink with small
# pieces so a 286-piece tile does not sit on a slab that reads as a drop
# shadow. Relative order loose > joined > solved is unchanged.
static func depth_scale(parent: Node) -> float:
	var extent := piece_extent(parent)
	if extent <= 0.0:
		return DEPTH_WALL_SCALE
	return clampf(extent / DEPTH_REFERENCE_EXTENT_PX, DEPTH_MIN_SCALE, 1.0) * DEPTH_WALL_SCALE


static func edge_relief_material(state: StringName) -> ShaderMaterial:
	var cached: ShaderMaterial = _edge_relief_materials.get(state)
	if cached != null:
		return cached
	var material := ShaderMaterial.new()
	material.resource_name = "PuzzlePieceEdgeRelief_%s" % state
	material.shader = EdgeReliefShader
	var params: Dictionary = EDGE_RELIEF_STATE_PARAMS[state]
	for key in params:
		material.set_shader_parameter(key, params[key])
	_edge_relief_materials[state] = material
	return material


static func add_piece_visuals(
	parent: Node,
	points: PackedVector2Array,
	uvs: PackedVector2Array,
	texture: Texture2D,
	visual_scale: float = 1.0
) -> Dictionary:
	var safe_scale := maxf(visual_scale, 0.01)
	var pixel_scale := 1.0 / safe_scale
	var depth_px := pixel_scale * depth_scale(parent)
	var result := {}

	# This is deliberately weak and detached from the cardboard edge. It should
	# read as table contact, never as the piece's thickness.
	var contact_shadow := Polygon2D.new()
	contact_shadow.name = "ContactShadow"
	contact_shadow.polygon = points
	contact_shadow.position = LOOSE_SHADOW_OFFSET_PX * depth_px
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
	thickness.position = LOOSE_THICKNESS_OFFSET_PX * depth_px
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

	# Line2D builds the band in C++ at draw time and its UV.y is the across-cut
	# coordinate the relief shader lights. Cut outlines repeat their first point
	# at the end; a zero-length closing segment would collapse the band into a
	# spike, so drop it (O(1) check + native slice) and let Line2D close the loop.
	var relief_points := points
	if points.size() > 3 and points[0].is_equal_approx(points[points.size() - 1]):
		relief_points = points.slice(0, points.size() - 1)
	var relief := Line2D.new()
	relief.name = "EdgeRelief"
	relief.points = relief_points
	relief.closed = true
	relief.width = edge_relief_half_width(parent) * 2.0 * pixel_scale
	relief.texture_mode = Line2D.LINE_TEXTURE_STRETCH
	# Smooth sampled curves keep cheap shared-edge miters; genuine kinks (tab
	# bases, piece corners) fall back to a bevel instead of a long miter wedge.
	relief.joint_mode = Line2D.LINE_JOINT_SHARP
	relief.sharp_limit = EDGE_RELIEF_SHARP_LIMIT
	relief.default_color = Color.WHITE
	relief.antialiased = false
	relief.material = edge_relief_material(STATE_LOOSE)
	relief.z_index = 0
	relief.z_as_relative = true
	parent.add_child(relief)
	result["edge_relief"] = relief

	return result


static func apply_joined_state(parent: Node, visual_scale: float = 1.0) -> void:
	var depth_px := depth_scale(parent) / maxf(visual_scale, 0.01)
	var contact_shadow := parent.get_node_or_null("ContactShadow") as Polygon2D
	var thickness := parent.get_node_or_null("Thickness") as Polygon2D
	var relief := parent.get_node_or_null("EdgeRelief") as Line2D

	# Joined islands should no longer look like independent tiles floating on
	# separate shadows. Thickness remains because the island is still cardboard.
	if contact_shadow != null:
		contact_shadow.visible = false
	if thickness != null:
		thickness.position = JOINED_THICKNESS_OFFSET_PX * depth_px
		thickness.color = JOINED_THICKNESS_COLOR
	if relief != null:
		relief.material = edge_relief_material(STATE_JOINED)


static func apply_solved_state(parent: Node, visual_scale: float = 1.0) -> void:
	var depth_px := depth_scale(parent) / maxf(visual_scale, 0.01)
	var contact_shadow := parent.get_node_or_null("ContactShadow") as Polygon2D
	var thickness := parent.get_node_or_null("Thickness") as Polygon2D
	var relief := parent.get_node_or_null("EdgeRelief") as Line2D

	# Once anchored to the board there is no floating contact shadow at all.
	# Keep only a very shallow cardboard side cue and a quiet rolled cut edge.
	if contact_shadow != null:
		contact_shadow.visible = false
	if thickness != null:
		thickness.position = SOLVED_THICKNESS_OFFSET_PX * depth_px
		thickness.color = SOLVED_THICKNESS_COLOR
	if relief != null:
		relief.material = edge_relief_material(STATE_SOLVED)
