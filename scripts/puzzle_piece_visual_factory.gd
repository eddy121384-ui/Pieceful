class_name PuzzlePieceVisualFactory
extends RefCounted

const EdgeVisualScript = preload("res://scripts/puzzle_piece_edge_visual.gd")

const DETAIL_LITE := 0
const DETAIL_FULL := 1

const THICKNESS_OFFSET_PX := Vector2(1.75, 2.15)
const NEAR_SHADOW_OFFSET_PX := Vector2(3.2, 4.0)
const FAR_SHADOW_OFFSET_PX := Vector2(5.6, 7.0)


static func add_piece_visuals(
	parent: Node,
	points: PackedVector2Array,
	uvs: PackedVector2Array,
	texture: Texture2D,
	visual_scale: float = 1.0,
	include_shadow: bool = true,
	detail: int = DETAIL_FULL
) -> Dictionary:
	var safe_scale := maxf(visual_scale, 0.01)
	var pixel_scale := 1.0 / safe_scale
	var result := {}

	if include_shadow:
		var shadow := Node2D.new()
		shadow.name = "Shadow"
		shadow.z_index = -3
		parent.add_child(shadow)

		if detail == DETAIL_FULL:
			var far_shadow := Polygon2D.new()
			far_shadow.name = "Far"
			far_shadow.polygon = points
			far_shadow.position = FAR_SHADOW_OFFSET_PX * pixel_scale
			far_shadow.color = Color(0.0, 0.0, 0.0, 0.055)
			shadow.add_child(far_shadow)

		var near_shadow := Polygon2D.new()
		near_shadow.name = "Near"
		near_shadow.polygon = points
		near_shadow.position = NEAR_SHADOW_OFFSET_PX * pixel_scale
		near_shadow.color = Color(0.0, 0.0, 0.0, 0.14)
		shadow.add_child(near_shadow)
		result["shadow"] = shadow

	var thickness := Polygon2D.new()
	thickness.name = "Thickness"
	thickness.polygon = points
	thickness.position = THICKNESS_OFFSET_PX * pixel_scale
	thickness.color = Color(0.095, 0.082, 0.066, 0.98)
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

	if detail == DETAIL_FULL:
		var bevel = EdgeVisualScript.new()
		bevel.name = "Bevel"
		bevel.z_index = 1
		bevel.configure(points, uvs, texture, pixel_scale)
		parent.add_child(bevel)
		result["bevel"] = bevel

	return result
