class_name PuzzlePieceVisualFactory
extends RefCounted

const EdgeVisualScript = preload("res://scripts/puzzle_piece_edge_visual.gd")

# The visual stack is intentionally painterly/physical rather than UI-like:
# soft contact shadow -> thin cardboard side wall -> artwork -> bevel band.
const SHADOW_DIRECTION := Vector2(0.66, 0.75)
const THICKNESS_DIRECTION := Vector2(0.62, 0.78)
const SHADOW_OFFSETS_PX := [2.4, 3.8, 5.4, 7.2]
const SHADOW_GROW_PX := [0.6, 1.25, 2.1, 3.0]
const SHADOW_ALPHA := [0.13, 0.085, 0.047, 0.022]
const THICKNESS_STEPS := 4
const THICKNESS_STEP_PX := 0.72


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
		var shadow_root := Node2D.new()
		shadow_root.name = "Shadow"
		shadow_root.z_index = -3
		parent.add_child(shadow_root)
		_build_soft_shadow(shadow_root, points, pixel_scale)
		result["shadow"] = shadow_root

	var thickness_root := Node2D.new()
	thickness_root.name = "Thickness"
	thickness_root.z_index = -2
	parent.add_child(thickness_root)
	_build_cardboard_thickness(thickness_root, points, pixel_scale)
	result["thickness"] = thickness_root

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


static func _build_soft_shadow(
	host: Node2D,
	points: PackedVector2Array,
	pixel_scale: float
) -> void:
	var direction := SHADOW_DIRECTION.normalized()
	for index in range(SHADOW_OFFSETS_PX.size()):
		var layer := Polygon2D.new()
		layer.name = "SoftShadow%d" % (index + 1)
		layer.polygon = _expanded_contour(
			points,
			float(SHADOW_GROW_PX[index]) * pixel_scale
		)
		layer.position = (
			direction
			* float(SHADOW_OFFSETS_PX[index])
			* pixel_scale
		)
		layer.color = Color(0.0, 0.0, 0.0, float(SHADOW_ALPHA[index]))
		host.add_child(layer)


static func _build_cardboard_thickness(
	host: Node2D,
	points: PackedVector2Array,
	pixel_scale: float
) -> void:
	var direction := THICKNESS_DIRECTION.normalized()
	for step in range(THICKNESS_STEPS, 0, -1):
		var depth := float(step) * THICKNESS_STEP_PX
		var layer := Polygon2D.new()
		layer.name = "CardboardSide%d" % step
		layer.polygon = points
		layer.position = direction * depth * pixel_scale
		var t := float(step - 1) / maxf(float(THICKNESS_STEPS - 1), 1.0)
		layer.color = Color(
			lerpf(0.16, 0.055, t),
			lerpf(0.145, 0.050, t),
			lerpf(0.12, 0.045, t),
			0.96
		)
		host.add_child(layer)


static func _expanded_contour(
	points: PackedVector2Array,
	distance: float
) -> PackedVector2Array:
	if points.size() < 3 or distance <= 0.0:
		return points.duplicate()

	var centroid := _centroid(points)
	var outward_normals := PackedVector2Array()
	for index in range(points.size()):
		var a: Vector2 = points[index]
		var b: Vector2 = points[(index + 1) % points.size()]
		var tangent := (b - a).normalized()
		var outward := Vector2(-tangent.y, tangent.x)
		var midpoint := (a + b) * 0.5
		if outward.dot(midpoint - centroid) < 0.0:
			outward = -outward
		outward_normals.append(outward)

	var expanded := PackedVector2Array()
	for index in range(points.size()):
		var previous_index := (index - 1 + points.size()) % points.size()
		var outward := outward_normals[previous_index] + outward_normals[index]
		if outward.length_squared() < 0.0001:
			outward = outward_normals[index]
		outward = outward.normalized()
		expanded.append(points[index] + outward * distance)
	return expanded


static func _centroid(points: PackedVector2Array) -> Vector2:
	var result := Vector2.ZERO
	for point in points:
		result += point
	return result / maxf(float(points.size()), 1.0)
