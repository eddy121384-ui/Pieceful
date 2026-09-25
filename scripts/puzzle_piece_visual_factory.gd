class_name PuzzlePieceVisualFactory
extends RefCounted

# Commercial-reference direction for #55:
# create the perception of thin cardboard with three cheap standard 2D layers.
# No per-piece bevel mesh, custom draw path, or line renderer is required.
const LOOSE_LIGHT_OFFSET_PX := Vector2(-0.72, -0.62)
const LOOSE_DARK_OFFSET_PX := Vector2(2.15, 2.55)
const SOLVED_LIGHT_OFFSET_PX := Vector2(-0.28, -0.24)
const SOLVED_DARK_OFFSET_PX := Vector2(0.72, 0.86)

const LOOSE_LIGHT_COLOR := Color(1.0, 0.94, 0.80, 0.24)
const LOOSE_DARK_COLOR := Color(0.085, 0.069, 0.047, 0.82)
const SOLVED_LIGHT_COLOR := Color(1.0, 0.95, 0.84, 0.08)
const SOLVED_DARK_COLOR := Color(0.09, 0.075, 0.052, 0.42)


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

	var warm_rim := Polygon2D.new()
	warm_rim.name = "WarmRim"
	warm_rim.polygon = points
	warm_rim.position = LOOSE_LIGHT_OFFSET_PX * pixel_scale
	warm_rim.color = LOOSE_LIGHT_COLOR
	warm_rim.z_index = -2
	parent.add_child(warm_rim)
	result["warm_rim"] = warm_rim

	var dark_relief := Polygon2D.new()
	dark_relief.name = "DarkRelief"
	dark_relief.polygon = points
	dark_relief.position = LOOSE_DARK_OFFSET_PX * pixel_scale
	dark_relief.color = LOOSE_DARK_COLOR
	dark_relief.z_index = -1
	parent.add_child(dark_relief)
	result["dark_relief"] = dark_relief

	var face := Polygon2D.new()
	face.name = "Face"
	face.polygon = points
	face.uv = uvs
	face.texture = texture
	face.color = Color.WHITE
	face.z_index = 0
	parent.add_child(face)
	result["face"] = face

	return result


static func apply_solved_state(parent: Node, visual_scale: float = 1.0) -> void:
	var pixel_scale := 1.0 / maxf(visual_scale, 0.01)
	var warm_rim := parent.get_node_or_null("WarmRim") as Polygon2D
	var dark_relief := parent.get_node_or_null("DarkRelief") as Polygon2D

	if warm_rim != null:
		warm_rim.position = SOLVED_LIGHT_OFFSET_PX * pixel_scale
		warm_rim.color = SOLVED_LIGHT_COLOR
	if dark_relief != null:
		dark_relief.position = SOLVED_DARK_OFFSET_PX * pixel_scale
		dark_relief.color = SOLVED_DARK_COLOR
