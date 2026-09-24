class_name PuzzlePieceVisualFactory
extends RefCounted

const EdgeVisualScript = preload("res://scripts/puzzle_piece_edge_visual.gd")

const SHADOW_COLOR := Color(0.0, 0.0, 0.0, 0.24)
const THICKNESS_COLOR := Color(0.035, 0.040, 0.047, 0.92)


static func add_piece_visuals(
	parent: Node,
	points: PackedVector2Array,
	uvs: PackedVector2Array,
	texture: Texture2D,
	visual_scale: float = 1.0,
	include_shadow: bool = true
) -> Dictionary:
	var safe_scale := maxf(visual_scale, 0.01)
	var inverse_scale := 1.0 / safe_scale
	var result := {}

	if include_shadow:
		var shadow := Polygon2D.new()
		shadow.name = "Shadow"
		shadow.polygon = points
		shadow.color = SHADOW_COLOR
		shadow.position = Vector2(3.0, 4.5) * inverse_scale
		shadow.z_index = -2
		parent.add_child(shadow)
		result["shadow"] = shadow

	# A slightly offset dark silhouette is visible mainly along the lower-right
	# edge and gives the piece a thin cardboard thickness instead of a white
	# sticker-like border.
	var thickness := Polygon2D.new()
	thickness.name = "Thickness"
	thickness.polygon = points
	thickness.color = THICKNESS_COLOR
	thickness.position = Vector2(1.45, 1.85) * inverse_scale
	thickness.z_index = -1
	parent.add_child(thickness)
	result["thickness"] = thickness

	var face := Polygon2D.new()
	face.name = "Face"
	face.polygon = points
	face.uv = uvs
	face.texture = texture
	face.color = Color.WHITE
	parent.add_child(face)
	result["face"] = face

	var edge = EdgeVisualScript.new()
	edge.name = "EdgeLighting"
	edge.configure(points, inverse_scale)
	parent.add_child(edge)
	result["edge"] = edge

	return result
