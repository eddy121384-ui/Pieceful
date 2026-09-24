class_name PuzzlePieceVisualFactory
extends RefCounted

const ShadowVisualScript = preload("res://scripts/puzzle_piece_shadow_visual.gd")
const ThicknessVisualScript = preload("res://scripts/puzzle_piece_thickness_visual.gd")
const EdgeVisualScript = preload("res://scripts/puzzle_piece_edge_visual.gd")


static func add_piece_visuals(
	parent: Node,
	points: PackedVector2Array,
	uvs: PackedVector2Array,
	texture: Texture2D,
	visual_scale: float = 1.0,
	include_shadow: bool = true
) -> Dictionary:
	var safe_scale := maxf(visual_scale, 0.01)
	var pixel_scale := 1.0 / safe_scale
	var result := {}

	if include_shadow:
		var shadow = ShadowVisualScript.new()
		shadow.name = "Shadow"
		shadow.z_index = -3
		shadow.configure(points, pixel_scale)
		parent.add_child(shadow)
		result["shadow"] = shadow

	var thickness = ThicknessVisualScript.new()
	thickness.name = "Thickness"
	thickness.z_index = -2
	thickness.configure(points, pixel_scale)
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

	var bevel = EdgeVisualScript.new()
	bevel.name = "Bevel"
	bevel.z_index = 1
	bevel.configure(points, pixel_scale)
	parent.add_child(bevel)
	result["bevel"] = bevel

	return result
