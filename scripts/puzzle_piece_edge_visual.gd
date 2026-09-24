class_name PuzzlePieceEdgeVisual
extends Node2D

# A real bevel band, not an outline. The band is built from the puzzle contour
# itself and fades back into the artwork over several pixels. Directional
# lighting makes top-left edges catch light while bottom-right edges fall into
# shade, which reads as a shallow chamfered cardboard surface.

const BEVEL_WIDTH_PX := 3.4
const AMBIENT_EDGE_ALPHA := 0.11
const SHADE_ALPHA := 0.34
const HIGHLIGHT_ALPHA := 0.30
const INNER_CATCHLIGHT_ALPHA := 0.07
const LIGHT_DIRECTION := Vector2(-0.72, -0.69)

var polygon_points := PackedVector2Array()
var pixel_scale := 1.0
var inner_ring := PackedVector2Array()
var outward_normals := PackedVector2Array()


func configure(points: PackedVector2Array, p_pixel_scale: float = 1.0) -> void:
	polygon_points = points.duplicate()
	pixel_scale = maxf(p_pixel_scale, 0.01)
	_rebuild_geometry()
	queue_redraw()


func _rebuild_geometry() -> void:
	inner_ring = PackedVector2Array()
	outward_normals = PackedVector2Array()
	if polygon_points.size() < 3:
		return

	var centroid := _centroid(polygon_points)
	for index in range(polygon_points.size()):
		var a: Vector2 = polygon_points[index]
		var b: Vector2 = polygon_points[(index + 1) % polygon_points.size()]
		var tangent := (b - a).normalized()
		var outward := Vector2(-tangent.y, tangent.x)
		var midpoint := (a + b) * 0.5
		if outward.dot(midpoint - centroid) < 0.0:
			outward = -outward
		outward_normals.append(outward)

	var bevel_width := BEVEL_WIDTH_PX * pixel_scale
	for index in range(polygon_points.size()):
		var previous_index := (index - 1 + polygon_points.size()) % polygon_points.size()
		var previous_outward: Vector2 = outward_normals[previous_index]
		var next_outward: Vector2 = outward_normals[index]
		var inward := -(previous_outward + next_outward)
		if inward.length_squared() < 0.0001:
			inward = -next_outward
		inward = inward.normalized()

		# Miter correction keeps the apparent bevel width close to constant around
		# tabs and sockets while clamping acute corners so they never spike.
		var edge_inward := -next_outward
		var denominator := maxf(absf(inward.dot(edge_inward)), 0.46)
		var miter := minf(bevel_width / denominator, bevel_width * 1.85)
		inner_ring.append(polygon_points[index] + inward * miter)


func _draw() -> void:
	if polygon_points.size() < 3 or inner_ring.size() != polygon_points.size():
		return

	var light := LIGHT_DIRECTION.normalized()
	for index in range(polygon_points.size()):
		var next_index := (index + 1) % polygon_points.size()
		var a: Vector2 = polygon_points[index]
		var b: Vector2 = polygon_points[next_index]
		var ia: Vector2 = inner_ring[index]
		var ib: Vector2 = inner_ring[next_index]
		var outward: Vector2 = outward_normals[index]
		var facing := clampf(outward.dot(light), -1.0, 1.0)

		# Ambient occlusion/shade band. This is a surface with width, not a line:
		# the outer edge is darkest and it dissolves into the artwork inward.
		var shade_strength := AMBIENT_EDGE_ALPHA + maxf(-facing, 0.0) * SHADE_ALPHA
		var shade_outer := Color(0.018, 0.020, 0.022, shade_strength)
		var shade_inner := Color(0.018, 0.020, 0.022, 0.0)
		draw_polygon(
			PackedVector2Array([a, b, ib, ia]),
			PackedColorArray([shade_outer, shade_outer, shade_inner, shade_inner])
		)

		# Lit bevel face. Only surfaces facing the top-left key light receive it.
		# The highlight also fades inward, so there is no continuous white stroke.
		var lit := maxf(facing, 0.0)
		if lit > 0.04:
			var highlight_alpha := HIGHLIGHT_ALPHA * pow(lit, 0.72)
			var highlight_outer := Color(1.0, 0.985, 0.94, highlight_alpha)
			var highlight_inner := Color(1.0, 0.985, 0.94, 0.0)
			draw_polygon(
				PackedVector2Array([a, b, ib, ia]),
				PackedColorArray([
					highlight_outer,
					highlight_outer,
					highlight_inner,
					highlight_inner,
				])
			)

	# A very faint inner catchlight prevents dark artwork from swallowing the
	# chamfer. It is intentionally much weaker than the bevel itself.
	var closed_inner := inner_ring.duplicate()
	closed_inner.append(inner_ring[0])
	draw_polyline(
		closed_inner,
		Color(1.0, 0.99, 0.96, INNER_CATCHLIGHT_ALPHA),
		0.7 * pixel_scale,
		true
	)


func _centroid(points: PackedVector2Array) -> Vector2:
	var result := Vector2.ZERO
	for point in points:
		result += point
	return result / maxf(float(points.size()), 1.0)
