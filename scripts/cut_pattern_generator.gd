class_name CutPatternGenerator
extends RefCounted

# Developer authoring generator only.
# Runtime gameplay loads approved CutPattern JSON assets instead.

const GENERATOR_VERSION := 4
const TEMPLATE_NAME := "classic_cardboard_v4_mushroom"

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
			"samples_per_span": 6,
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
			"max_head_to_neck_ratio": _metric_max("head_to_neck_ratio"),
		},
	}


func _build_grid_points() -> void:
	grid_points.clear()

	# Keep the ribbon lattice readable. V4 moves the organic character into
	# the cut profile rather than warping the whole grid.
	var jitter_x: float = cell_size.x * 0.012
	var jitter_y: float = cell_size.y * 0.012

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
	var baseline_bend: float = min_cell * rng.randf_range(-0.004, 0.004)

	var shoulder_left: float = float(character["shoulder_left"])
	var shoulder_right: float = float(character["shoulder_right"])
	var neck_left: float = float(character["neck_left"])
	var neck_right: float = float(character["neck_right"])
	var head_left: float = float(character["head_left"])
	var head_right: float = float(character["head_right"])
	var peak_shift: float = float(character["peak_shift"])
	var left_dip: float = float(character["left_dip"])
	var right_dip: float = float(character["right_dip"])
	var left_neck_height: float = float(character["left_neck_height"])
	var right_neck_height: float = float(character["right_neck_height"])
	var left_cap_height: float = float(character["left_cap_height"])
	var right_cap_height: float = float(character["right_cap_height"])

	# V4 target: commercial classic cardboard.
	# Long baseline -> soft inward shoulder -> visibly narrow neck ->
	# wide rounded mushroom cap -> narrow neck -> soft shoulder -> baseline.
	# Left and right are independently varied so the cut reads as a real die,
	# not a mirrored mathematical icon.
	var anchors := PackedVector2Array([
		Vector2(0.0, 0.0),
		Vector2(center - shoulder_left, 0.0),
		Vector2(center - shoulder_left * 0.82, 0.0),
		Vector2(center - shoulder_left * 0.67, -left_dip),
		Vector2(center - (head_left + neck_left) * 0.50, -left_dip * 0.80),
		Vector2(center - neck_left, left_neck_height),
		Vector2(center - head_left * 0.95, 0.43 * depth),
		Vector2(center - head_left, 0.62 * depth),
		Vector2(center - head_left * 0.80, 0.85 * depth),
		Vector2(center - head_left * 0.42, left_cap_height),
		Vector2(center + peak_shift, 1.08 * depth),
		Vector2(center + head_right * 0.42, right_cap_height),
		Vector2(center + head_right * 0.80, 0.85 * depth),
		Vector2(center + head_right, 0.62 * depth),
		Vector2(center + head_right * 0.95, 0.43 * depth),
		Vector2(center + neck_right, right_neck_height),
		Vector2(center + (head_right + neck_right) * 0.50, -right_dip * 0.80),
		Vector2(center + shoulder_right * 0.67, -right_dip),
		Vector2(center + shoulder_right * 0.82, 0.0),
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

	var neck_width: float = neck_left + neck_right
	var head_width: float = head_left + head_right
	segment_metrics.append({
		"neck_width_ratio": neck_width / length,
		"depth_ratio": depth * 1.08 / min_cell,
		"center_ratio": center_ratio,
		"head_to_neck_ratio": head_width / maxf(neck_width, 0.000001),
		"archetype": character["archetype"],
	})

	return result


func _pick_edge_character(length: float, min_cell: float) -> Dictionary:
	# Four close relatives of the same commercial-cardboard grammar.
	# Differences are proportional only; topology never changes.
	var roll: float = rng.randf()
	var archetype := "mushroom_standard"
	var depth_multiplier := 1.0
	var head_multiplier := 1.0
	var neck_multiplier := 1.0
	var shoulder_multiplier := 1.0

	if roll < 0.24:
		archetype = "mushroom_broad"
		depth_multiplier = 0.96
		head_multiplier = 1.08
		neck_multiplier = 0.98
		shoulder_multiplier = 1.04
	elif roll < 0.42:
		archetype = "mushroom_tall"
		depth_multiplier = 1.07
		head_multiplier = 0.96
		neck_multiplier = 0.96
		shoulder_multiplier = 0.98
	elif roll < 0.56:
		archetype = "mushroom_compact"
		depth_multiplier = 1.01
		head_multiplier = 1.02
		neck_multiplier = 0.92
		shoulder_multiplier = 0.93

	var center_ratio: float = rng.randf_range(0.44, 0.56)
	var depth_ratio: float = rng.randf_range(0.240, 0.285) * depth_multiplier
	depth_ratio = minf(depth_ratio, 0.305)

	var shoulder_left: float = rng.randf_range(0.270, 0.330) * length * shoulder_multiplier
	var shoulder_right: float = rng.randf_range(0.270, 0.330) * length * shoulder_multiplier
	var neck_left: float = rng.randf_range(0.065, 0.085) * length * neck_multiplier
	var neck_right: float = rng.randf_range(0.065, 0.085) * length * neck_multiplier
	var head_left: float = rng.randf_range(0.170, 0.205) * length * head_multiplier
	var head_right: float = rng.randf_range(0.170, 0.205) * length * head_multiplier

	# Mild independent organic variation: enough to break mirror symmetry, not
	# enough to leave the classic die-cut family.
	shoulder_left *= rng.randf_range(0.97, 1.03)
	shoulder_right *= rng.randf_range(0.97, 1.03)
	neck_left *= rng.randf_range(0.96, 1.04)
	neck_right *= rng.randf_range(0.96, 1.04)
	head_left *= rng.randf_range(0.96, 1.04)
	head_right *= rng.randf_range(0.96, 1.04)

	var depth: float = min_cell * depth_ratio

	return {
		"archetype": archetype,
		"center_ratio": center_ratio,
		"depth": depth,
		"shoulder_left": shoulder_left,
		"shoulder_right": shoulder_right,
		"neck_left": neck_left,
		"neck_right": neck_right,
		"head_left": head_left,
		"head_right": head_right,
		"peak_shift": rng.randf_range(-0.020, 0.020) * length,
		"left_dip": rng.randf_range(0.060, 0.100) * depth,
		"right_dip": rng.randf_range(0.060, 0.100) * depth,
		"left_neck_height": rng.randf_range(0.120, 0.180) * depth,
		"right_neck_height": rng.randf_range(0.120, 0.180) * depth,
		"left_cap_height": rng.randf_range(0.980, 1.040) * depth,
		"right_cap_height": rng.randf_range(0.980, 1.040) * depth,
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
