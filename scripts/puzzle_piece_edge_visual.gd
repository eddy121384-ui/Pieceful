class_name PuzzlePieceEdgeVisual
extends Node2D

# Quiet cardboard edge treatment.
# One cached draw node replaces the old bright white Line2D and adds directional
# lighting without creating one child node per polygon segment.

const BASE_EDGE_COLOR := Color(0.025, 0.032, 0.040, 0.82)
const HIGHLIGHT_COLOR := Color(1.0, 1.0, 1.0, 0.18)
const SHADE_COLOR := Color(0.0, 0.0, 0.0, 0.22)
const LIGHT_DIRECTION := Vector2(-0.72, -0.69)

var polygon_points := PackedVector2Array()
var width_scale := 1.0


func configure(points: PackedVector2Array, p_width_scale: float = 1.0) -> void:
	polygon_points = points.duplicate()
	width_scale = maxf(p_width_scale, 0.01)
	queue_redraw()


func _draw() -> void:
	if polygon_points.size() < 2:
		return

	var closed := polygon_points.duplicate()
	closed.append(polygon_points[0])
	draw_polyline(
		closed,
		BASE_EDGE_COLOR,
		1.35 * width_scale,
		true
	)

	var centroid := Vector2.ZERO
	for point in polygon_points:
		centroid += point
	centroid /= float(polygon_points.size())

	var light := LIGHT_DIRECTION.normalized()
	for index in range(polygon_points.size()):
		var a: Vector2 = polygon_points[index]
		var b: Vector2 = polygon_points[(index + 1) % polygon_points.size()]
		var tangent := (b - a).normalized()
		if tangent.is_zero_approx():
			continue

		# Pick the perpendicular that points away from the piece centroid so the
		# light response is independent of polygon winding.
		var outward := Vector2(-tangent.y, tangent.x)
		var midpoint := (a + b) * 0.5
		if outward.dot(midpoint - centroid) < 0.0:
			outward = -outward

		var facing := outward.dot(light)
		if facing > 0.12:
			var highlight := HIGHLIGHT_COLOR
			highlight.a *= clampf((facing - 0.12) / 0.88, 0.0, 1.0)
			draw_line(a, b, highlight, 0.82 * width_scale, true)
		elif facing < -0.12:
			var shade := SHADE_COLOR
			shade.a *= clampf((-facing - 0.12) / 0.88, 0.0, 1.0)
			draw_line(a, b, shade, 0.95 * width_scale, true)
