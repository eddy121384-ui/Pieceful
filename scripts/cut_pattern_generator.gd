class_name CutPatternGenerator
extends RefCounted

# Developer authoring generator only.
# Runtime gameplay loads approved CutPattern JSON assets instead.

const GENERATOR_VERSION := 2
const TEMPLATE_NAME := "classic_cardboard_v2"

var columns: int
var rows: int
var aspect_ratio: float
var seed: int
var design_size: Vector2
var cell_size: Vector2

var grid_points: Array[Vector2] = []
var horizontal_segments: Array = []
var vertical_segments: Array = []
var segment_metrics: Array[Dictionary] = []

var rng := RandomNumberGenerator.new()


func _init(
	p_columns: int,
	p_rows: int,
	p_aspect_ratio: float,
	p_seed: int
) -> void:
	columns = p_columns
	rows = p_rows
	aspect_ratio = p_aspect_ratio
	seed = p_seed
	design_size = Vector2(aspect_ratio, 1.0)
	cell_size = design_size / Vector2(float(columns), float(rows))
	rng.seed = seed

	_build_grid_points()
	_build_horizontal_segments()
	_build_vertical_segments()


func generate_pattern_dict(
	pattern_id: String,
	version: int = 1,
	aspect_ratio_class: String = "custom"
) -> Dictionary:
	return {
		"pattern_id": pattern_id,
		"version": version,
		"columns": columns,
		"rows": rows,
		"aspect_ratio": aspect_ratio,
		"aspect_ratio_class": aspect_ratio_class,
		"style": "classic_ribbon",
		"curve": {
			"type": "catmull_rom",
			"version": 1,
			"samples_per_span": 4,
		},
		"authoring": {
			"generator_version": GENERATOR_VERSION,
			"seed": seed,
			"template": TEMPLATE_NAME,
			"curated": false,
		},
		"intersections": _serialize_points(grid_points),
		"horizontal_segments": _serialize_segments(horizontal_segments),
		"vertical_segments": _serialize_segments(vertical_segments),
		"validation_metadata": {
			"validated": false,
			"min_neck_width_ratio": _metric_min("neck_width_ratio"),
			"max_knob_depth_ratio": _metric_max("depth_ratio"),
			"min_knob_center_ratio": _metric_min("center_ratio"),
			"max_knob_center_ratio": _metric_max("center_ratio"),
		},
	}


func _build_grid_points() -> void:
	grid_points.clear()

	# Keep the ribbon grid obvious. Real die sheets are not perfectly square,
	# but the intersection drift is small compared with the piece dimensions.
	var jitter_x: float = cell_size.x * 0.018
	var jitter_y: float = cell_size.y * 0.018

	for row in range(rows + 1):
		for column in range(columns + 1):
			var point := Vector2(
				float(column) * cell_size.x,
				float(row) * cell_size.y
			)

			if column > 0 and column < columns:
				point.x += rng.randf_range(-jitter_x, jitter_x)
			if row > 0 and row < rows:
				point.y += rng.randf_range(-jitter_y, jitter_y)

			grid_points.append(point)


func _build_horizontal_segments() -> void:
	horizontal_segments.clear()

	for boundary_row in range(rows + 1):
		for column in range(columns):
			horizontal_segments.append(
				_make_segment(
					_grid_point(boundary_row, column),
					_grid_point(boundary_row, column + 1),
					boundary_row > 0 and boundary_row < rows
				)
			)


func _build_vertical_segments() -> void:
	vertical_segments.clear()

	for row in range(rows):
		for boundary_column in range(columns + 1):
			vertical_segments.append(
				_make_segment(
					_grid_point(row, boundary_column),
					_grid_point(row + 1, boundary_column),
					boundary_column > 0 and boundary_column < columns
				)
			)


func _make_segment(
	start: Vector2,
	finish: Vector2,
	internal: bool
) -> PackedVector2Array:
	if not internal:
		return PackedVector2Array([start, finish])

	var delta := finish - start
	var length: float = delta.length()
	if length <= 0.000001:
		return PackedVector2Array([start, finish])

	var tangent := delta / length
	var normal := Vector2(-tangent.y, tangent.x)
	var min_cell: float = minf(cell_size.x, cell_size.y)

	# V2 deliberately uses one strong classic cardboard grammar.
	# Variation changes character slightly; it does not invent a new shape.
	var tab_sign: float = 1.0 if rng.randi_range(0, 1) == 0 else -1.0
	var center_ratio: float = rng.randf_range(0.46, 0.54)
	var center: float = center_ratio * length
	var shape_scale: float = rng.randf_range(0.97, 1.03)
	var asymmetry: float = rng.randf_range(-0.020, 0.020)
	var depth_ratio: float = rng.randf_range(0.178, 0.202)
	var depth: float = min_cell * depth_ratio
	var baseline_bend: float = min_cell * rng.randf_range(-0.006, 0.006)

	var left_scale: float = 1.0 + asymmetry
	var right_scale: float = 1.0 - asymmetry

	# The silhouette is intentionally built as:
	# long baseline -> soft inward shoulder -> broad neck -> round cap
	# -> broad neck -> soft inward shoulder -> long baseline.
	# This is much closer to a stamped cardboard jigsaw than the shallow U-slot
	# profile used by classic_cardboard_v1.
	var anchors := PackedVector2Array([
		Vector2(0.0, 0.0),
		Vector2(center - 0.310 * shape_scale * length * left_scale, 0.0),
		Vector2(center - 0.255 * shape_scale * length * left_scale, 0.0),
		Vector2(center - 0.215 * shape_scale * length * left_scale, -0.080 * depth),
		Vector2(center - 0.165 * shape_scale * length * left_scale, -0.100 * depth),
		Vector2(center - 0.125 * shape_scale * length * left_scale, 0.050 * depth),
		Vector2(center - 0.115 * shape_scale * length * left_scale, 0.280 * depth),
		Vector2(center - 0.165 * shape_scale * length * left_scale, 0.580 * depth),
		Vector2(center - 0.145 * shape_scale * length * left_scale, 0.820 * depth),
		Vector2(center - 0.085 * shape_scale * length * left_scale, 1.000 * depth),
		Vector2(center, 1.060 * depth),
		Vector2(center + 0.085 * shape_scale * length * right_scale, 1.000 * depth),
		Vector2(center + 0.145 * shape_scale * length * right_scale, 0.820 * depth),
		Vector2(center + 0.165 * shape_scale * length * right_scale, 0.580 * depth),
		Vector2(center + 0.115 * shape_scale * length * right_scale, 0.280 * depth),
		Vector2(center + 0.125 * shape_scale * length * right_scale, 0.050 * depth),
		Vector2(center + 0.165 * shape_scale * length * right_scale, -0.100 * depth),
		Vector2(center + 0.215 * shape_scale * length * right_scale, -0.080 * depth),
		Vector2(center + 0.255 * shape_scale * length * right_scale, 0.0),
		Vector2(center + 0.310 * shape_scale * length * right_scale, 0.0),
		Vector2(length, 0.0),
	])

	var result := PackedVector2Array()
	for local_point in anchors:
		var x_ratio: float = clampf(local_point.x / length, 0.0, 1.0)
		var bend: float = baseline_bend * sin(PI * x_ratio)
		var normal_offset: float = bend + local_point.y * tab_sign
		result.append(
			start
			+ tangent * local_point.x
			+ normal * normal_offset
		)

	result[0] = start
	result[result.size() - 1] = finish

	segment_metrics.append({
		"neck_width_ratio": 2.0 * 0.115 * shape_scale,
		"depth_ratio": depth_ratio * 1.060,
		"center_ratio": center_ratio,
	})

	return result


func _serialize_segments(segments: Array) -> Array:
	var result: Array = []
	for segment in segments:
		result.append(_serialize_points(segment))
	return result


func _serialize_points(points) -> Array:
	var result: Array = []
	for point in points:
		result.append([
			point.x / design_size.x,
			point.y / design_size.y,
		])
	return result


func _metric_min(key: String) -> float:
	if segment_metrics.is_empty():
		return 0.0

	var value: float = INF
	for metric in segment_metrics:
		value = minf(value, float(metric[key]))
	return value


func _metric_max(key: String) -> float:
	if segment_metrics.is_empty():
		return 0.0

	var value: float = -INF
	for metric in segment_metrics:
		value = maxf(value, float(metric[key]))
	return value


func _grid_point(row: int, column: int) -> Vector2:
	return grid_points[row * (columns + 1) + column]
