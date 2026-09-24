class_name PuzzlePieceEdgeVisual
extends Node2D

# WebGL-safe bevel renderer. It draws several translucent contour bands rather
# than a Line2D or per-vertex gradient polygon. The result is a chamfered
# surface: top-left edges catch warm light, bottom-right edges receive shade,
# and both fade inward into the artwork.

const BEVEL_WIDTH_PX := 3.6
const BAND_FRACTIONS := [1.0, 0.66, 0.36]
const BAND_ALPHA := [1.0, 0.52, 0.20]
const AMBIENT_SHADE_ALPHA := 0.10
const SHADE_ALPHA := 0.30
const HIGHLIGHT_ALPHA := 0.27
const LIGHT_DIRECTION := Vector2(-0.72, -0.69)

var polygon_points := PackedVector2Array()
var pixel_scale := 1.0
var rings: Array[PackedVector2Array] = []
var outward_normals := PackedVector2Array()


func configure(points: PackedVector2Array, p_pixel_scale: float = 1.0) -> void:
	polygon_points = points.duplicate()
	pixel_scale = maxf(p_pixel_scale, 0.01)
	_rebuild_geometry()
	queue_redraw()


func _rebuild_geometry() -> void:
	rings.clear()
	outward_normals = PackedVector2Array()
	if polygon_points.size() < 3:
		return

	var centroid := _centroid(polygon_points)
	for index in range(polygon_points.size()):
		var a := polygon_points[index]
		var b := polygon_points[(index + 1) % polygon_points.size()]
		var tangent := (b - a).normalized()
		var outward := Vector2(-tangent.y, tangent.x)
		if outward.dot(((a + b) * 0.5) - centroid) < 0.0:
			outward = -outward
		outward_normals.append(outward)

	for fraction_value in BAND_FRACTIONS:
		rings.append(_inset_ring(BEVEL_WIDTH_PX * float(fraction_value) * pixel_scale))


func _draw() -> void:
	if polygon_points.size() < 3 or rings.size() != BAND_FRACTIONS.size():
		return

	var light := LIGHT_DIRECTION.normalized()
	for band_index in range(rings.size()):
		var inner: PackedVector2Array = rings[band_index]
		var outer: PackedVector2Array = (
			polygon_points if band_index == 0 else rings[band_index - 1]
		)
		for edge_index in range(polygon_points.size()):
			var next_index := (edge_index + 1) % polygon_points.size()
			var facing := clampf(outward_normals[edge_index].dot(light), -1.0, 1.0)
			var alpha_scale := float(BAND_ALPHA[band_index])

			var shade_alpha := (
				AMBIENT_SHADE_ALPHA
				+ maxf(-facing, 0.0) * SHADE_ALPHA
			) * alpha_scale
			if shade_alpha > 0.004:
				draw_colored_polygon(
					PackedVector2Array([
						outer[edge_index],
						outer[next_index],
						inner[next_index],
						inner[edge_index],
					]),
					Color(0.018, 0.020, 0.023, shade_alpha)
				)

			var lit := maxf(facing, 0.0)
			if lit > 0.06:
				var highlight_alpha := HIGHLIGHT_ALPHA * pow(lit, 0.72) * alpha_scale
				draw_colored_polygon(
					PackedVector2Array([
						outer[edge_index],
						outer[next_index],
						inner[next_index],
						inner[edge_index],
					]),
					Color(1.0, 0.985, 0.94, highlight_alpha)
				)


func _inset_ring(distance: float) -> PackedVector2Array:
	var result := PackedVector2Array()
	for index in range(polygon_points.size()):
		var previous := (index - 1 + polygon_points.size()) % polygon_points.size()
		var inward := -(outward_normals[previous] + outward_normals[index])
		if inward.length_squared() < 0.0001:
			inward = -outward_normals[index]
		inward = inward.normalized()
		var denominator := maxf(absf(inward.dot(-outward_normals[index])), 0.46)
		var miter := minf(distance / denominator, distance * 1.8)
		result.append(polygon_points[index] + inward * miter)
	return result


func _centroid(points: PackedVector2Array) -> Vector2:
	var result := Vector2.ZERO
	for point in points:
		result += point
	return result / maxf(float(points.size()), 1.0)
