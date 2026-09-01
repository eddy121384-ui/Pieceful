class_name CutPatternGenerator
extends RefCounted

# Developer authoring generator only.
# Runtime gameplay loads approved CutPattern JSON assets instead.

const GENERATOR_VERSION := 3
const TEMPLATE_NAME := "classic_cardboard_v3_organic"

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

	# Keep the ribbon lattice obvious, but avoid CAD-perfect intersections.
	# The amount is intentionally tiny; personality belongs in the cuts.
	var jitter_x: float = cell_size.x * 0.014
	var jitter_y: float = cell_size.y * 0.014

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
	var character := _pick_edge_character(length, min_cell)

	var tab_sign: float = 1.0 if rng.randi_range(0, 1) == 0 else -1.0
	var center_ratio: float = float(character["center_ratio"])
	var center: float = center_ratio * length
	var depth: float = float(character["depth"])
	var baseline_bend: float = min_cell * rng.randf_range(-0.007, 0.007)

	var shoulder_left: float = float(character["shoulder_left"])
	var shoulder_right: float = float(character["shoulder_right"])
	var neck_left: float = float(character["neck_left"])
	var neck_right: float = float(character["neck_right"])
	var head_left: float = float(character["head_left"])
	var head_right: float = float(character["head_right"])
	var peak_shift: float = float(character["peak_shift"])
	var left_dip: float = float(character["left_dip"])
	var right_dip: float = float(character["right_dip"])

	# V3 intentionally avoids mirror symmetry. The two shoulders, necks and
	# lobes are independently varied inside a classic cardboard grammar.
	# This creates the slightly hand-designed character visible in real dies
	# without turning the puzzle into a random-cut / whimsy puzzle.
	var anchors := PackedVector2Array([
		Vector2(0.0, 0.0),
		Vector2(center - shoulder_left, 0.0),
		Vector2(center - shoulder_left * 0.82, -left_dip),
		Vector2(center - neck_left * 1.34, -0.045 * depth),
		Vector2(center - neck_left, 0.170 * depth),
		Vector2(center - head_left, 0.520 * depth),
		Vector2(center - head_left * 0.82, 0.810 * depth),
		Vector2(center + peak_shift, 1.035 * depth),
		Vector2(center + head_right * 0.82, 0.820 * depth),
		Vector2(center + head_right, 0.535 * depth),
		Vector2(center + neck_right, 0.175 * depth),
		Vector2(center + neck_right * 1.34, -0.040 * depth),
		Vector2(center + shoulder_right * 0.82, -right_dip),
		Vector2(center + shoulder_right, 0.0),
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
		"neck_width_ratio": (neck_left + neck_right) / length,
		"depth_ratio": depth * 1.035 / min_cell,
		"center_ratio": center_ratio,
		"archetype": character["archetype"],
	})

	return result


func _pick_edge_character(length: float, min_cell: float) -> Dictionary:
	# Weighted family selection. All families are recognisably classic ribbon
	# cuts; they differ in proportion rather than in basic topology.
	var roll: float = rng.randf()
	var archetype := "round_standard"
	var depth_ratio := rng.randf_range(0.215, 0.238)
	var center_ratio := rng.randf_range(0.435, 0.565)
	var shoulder_range := Vector2(0.255, 0.315)
	var neck_range := Vector2(0.085, 0.112)
	var head_range := Vector2(0.142, 0.176)

	if roll < 0.24:
		archetype = "broad_round"
		depth_ratio = rng.randf_range(0.205, 0.228)
		center_ratio = rng.randf_range(0.445, 0.555)
		shoulder_range = Vector2(0.275, 0.335)
		neck_range = Vector2(0.095, 0.120)
		head_range = Vector2(0.158, 0.190)
	elif roll < 0.42:
		archetype = "tall_offset"
		depth_ratio = rng.randf_range(0.232, 0.252)
		center_ratio = rng.randf_range(0.410, 0.590)
		shoulder_range = Vector2(0.245, 0.305)
		neck_range = Vector2(0.080, 0.105)
		head_range = Vector2(0.138, 0.168)
	elif roll < 0.56:
		archetype = "compact_round"
		depth_ratio = rng.randf_range(0.210, 0.232)
		center_ratio = rng.randf_range(0.425, 0.575)
		shoulder_range = Vector2(0.235, 0.285)
		neck_range = Vector2(0.082, 0.108)
		head_range = Vector2(0.145, 0.174)

	var shoulder_left: float = rng.randf_range(shoulder_range.x, shoulder_range.y) * length
	var shoulder_right: float = rng.randf_range(shoulder_range.x, shoulder_range.y) * length
	var neck_left: float = rng.randf_range(neck_range.x, neck_range.y) * length
	var neck_right: float = rng.randf_range(neck_range.x, neck_range.y) * length
	var head_left: float = rng.randf_range(head_range.x, head_range.y) * length
	var head_right: float = rng.randf_range(head_range.x, head_range.y) * length

	# Apply a mild correlated lean so asymmetry feels intentional rather than
	# noisy. One side becomes slightly longer while the opposite side tightens.
	var lean: float = rng.randf_range(-0.055, 0.055)
	shoulder_left *= 1.0 + lean
	shoulder_right *= 1.0 - lean
	head_left *= 1.0 + lean * 0.55
	head_right *= 1.0 - lean * 0.55

	return {
		"archetype": archetype,
		"center_ratio": center_ratio,
		"depth": min_cell * depth_ratio,
		"shoulder_left": shoulder_left,
		"shoulder_right": shoulder_right,
		"neck_left": neck_left,
		"neck_right": neck_right,
		"head_left": head_left,
		"head_right": head_right,
		"peak_shift": rng.randf_range(-0.030, 0.030) * length,
		"left_dip": min_cell * rng.randf_range(0.020, 0.038),
		"right_dip": min_cell * rng.randf_range(0.020, 0.038),
	}


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
