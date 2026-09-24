class_name PuzzlePieceShadowVisual
extends Node2D

# Mobile/Web-safe soft contact shadow. All feather layers are cached into one
# CanvasItem instead of creating four Polygon2D child nodes per puzzle piece.

const LAYER_COUNT := 4
const SHADOW_DIRECTION := Vector2(0.66, 0.75)
const OFFSETS_PX := [2.4, 3.8, 5.4, 7.2]
const GROW_PX := [0.5, 1.05, 1.7, 2.45]
const ALPHAS := [0.12, 0.075, 0.038, 0.016]

var polygon_points := PackedVector2Array()
var pixel_scale := 1.0


func configure(points: PackedVector2Array, p_pixel_scale: float) -> void:
	polygon_points = points.duplicate()
	pixel_scale = maxf(p_pixel_scale, 0.01)
	queue_redraw()


func _draw() -> void:
	if polygon_points.size() < 3:
		return
	var direction := SHADOW_DIRECTION.normalized()
	for index in range(LAYER_COUNT - 1, -1, -1):
		var contour := _expanded_contour(
			polygon_points,
			float(GROW_PX[index]) * pixel_scale
		)
		var offset := direction * float(OFFSETS_PX[index]) * pixel_scale
		var shifted := PackedVector2Array()
		for point in contour:
			shifted.append(point + offset)
		draw_colored_polygon(
			shifted,
			Color(0.0, 0.0, 0.0, float(ALPHAS[index]))
		)


func _expanded_contour(points: PackedVector2Array, distance: float) -> PackedVector2Array:
	if points.size() < 3 or distance <= 0.0:
		return points.duplicate()
	var centroid := _centroid(points)
	var normals := PackedVector2Array()
	for index in range(points.size()):
		var a := points[index]
		var b := points[(index + 1) % points.size()]
		var tangent := (b - a).normalized()
		var outward := Vector2(-tangent.y, tangent.x)
		if outward.dot(((a + b) * 0.5) - centroid) < 0.0:
			outward = -outward
		normals.append(outward)
	var result := PackedVector2Array()
	for index in range(points.size()):
		var previous := (index - 1 + points.size()) % points.size()
		var outward := normals[previous] + normals[index]
		if outward.length_squared() < 0.0001:
			outward = normals[index]
		result.append(points[index] + outward.normalized() * distance)
	return result


func _centroid(points: PackedVector2Array) -> Vector2:
	var result := Vector2.ZERO
	for point in points:
		result += point
	return result / maxf(float(points.size()), 1.0)
