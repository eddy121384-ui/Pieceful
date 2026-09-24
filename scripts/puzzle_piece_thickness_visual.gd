class_name PuzzlePieceThicknessVisual
extends Node2D

# One cached CanvasItem draws all cardboard side-wall slices. Keeping the slices
# in a single node avoids multiplying scene-tree nodes for high-piece-count
# puzzles on mobile Safari/WebGL.

const LAYER_COUNT := 4
const DEPTH_DIRECTION := Vector2(0.62, 0.78)
const STEP_PX := 0.72

var polygon_points := PackedVector2Array()
var pixel_scale := 1.0


func configure(points: PackedVector2Array, p_pixel_scale: float) -> void:
	polygon_points = points.duplicate()
	pixel_scale = maxf(p_pixel_scale, 0.01)
	queue_redraw()


func _draw() -> void:
	if polygon_points.size() < 3:
		return
	var direction := DEPTH_DIRECTION.normalized()
	for step in range(LAYER_COUNT, 0, -1):
		var depth := float(step) * STEP_PX
		var shifted := PackedVector2Array()
		for point in polygon_points:
			shifted.append(point + direction * depth * pixel_scale)
		var t := float(step - 1) / maxf(float(LAYER_COUNT - 1), 1.0)
		draw_colored_polygon(
			shifted,
			Color(
				lerpf(0.16, 0.055, t),
				lerpf(0.145, 0.050, t),
				lerpf(0.12, 0.045, t),
				0.96
			)
		)
