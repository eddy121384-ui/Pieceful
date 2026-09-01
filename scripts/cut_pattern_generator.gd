class_name CutPatternGenerator
extends RefCounted

# Developer authoring generator only.
# Runtime gameplay loads approved CutPattern JSON assets instead.

const GENERATOR_VERSION := 5
const TEMPLATE_NAME := "classic_cardboard_v5_standard_organic"

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
			"samples_per_span": 8,
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

	# Commercial ribbon dies still read as a grid, but their intersections are
	# not CAD-perfect. V5 deliberately lets the whole piece body breathe a bit
	# instead of putting all variation into the knob itself.
	var jitter_x: float = cell_size.x * 0.055
	var jitter_y: float = cell_size.y * 0.055

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

	var shoulder_left: float = float(character["shoulder_left"])
	var shoulder_right: float = float(character["shoulder_right"])
	var neck_left: float = float(character["neck_left"])
	var neck_right: float = float(character["neck_right"])
	var head_left: float = float(character["head_left"])
	var head_right: float = float(character["head_right"])
	var peak_shift: float = float(character["peak_shift"])
	var left_dip: float = float(character["left_dip"])
	var right_dip: float = float(character["right_dip"])

	# A small whole-edge bow is important: without it the piece body reads as
	# a rectangle with a knob glued onto the middle. Two low-frequency terms
	# keep endpoints exact while giving the ribbon a subtle manufactured sway.
	var baseline_bend: float = min_cell * rng.randf_range(-0.035, 0.035)
	var baseline_wave: float = min_cell * rng.randf_range(-0.012, 0.012)

	# V5 target: mature commercial jigsaw grammar.
	# baseline -> rounded shoulder -> narrow neck -> round mushroom cap ->
	# narrow neck -> rounded shoulder -> baseline.
	# The cap is pronounced, but asymmetry is intentionally restrained.
	var anchors := PackedVector2Array([
		Vector2(0.0, 0.0),
		Vector2(center - shoulder_left, 0.0),
		Vector2(center - shoulder_left * 0.80, -left_dip * 0.25),
		Vector2(center - shoulder_left * 0.62, -left_dip),
		Vector2(center - neck_left * 1.45, -left_dip * 0.65),
		Vector2(center - neck_left, 0.060 * depth),
		Vector2(center - neck_left * 0.94, 0.270 * depth),
		Vector2(center - head_left * 0.96, 0.540 * depth),
		Vector2(center - head_left, 0.700 * depth),
		Vector2(center - head_left * 0.82, 0.860 * depth),
		Vector2(center - head_left * 0.48, 0.990 * depth),
		Vector2(center + peak_shift, 1.055 * depth),
		Vector2(center + head_right * 0.48, 1.000 * depth),
		Vector2(center + head_right * 0.82, 0.870 * depth),
		Vector2(center + head_right, 0.700 * depth),
		Vector2(center + head_right * 0.96, 0.540 * depth),
		Vector2(center + neck_right * 0.94, 0.270 * depth),
		Vector2(center + neck_right, 0.060 * depth),
		Vector2(center + neck_right * 1.45, -right_dip * 0.65),
		Vector2(center + shoulder_right * 0.62, -right_dip),
		Vector2(center + shoulder_right * 0.80, -right_dip * 0.25),
		Vector2(center + shoulder_right, 0.0),
		Vector2(length, 0.0),
	])

	var result := PackedVector2Array()
	for local_point in anchors:
		var x_ratio: float = clampf(local_point.x / length, 0.0, 1.0)
		var body_offset: float = (
			baseline_bend * sin(PI * x_ratio)
			+ baseline_wave * sin(TAU * x_ratio)
		)
		var normal_offset: float = body_offset + local_point.y * tab_sign
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
		"depth_ratio": depth * 1.055 / min_cell,
		"center_ratio": center_ratio,
		"head_to_neck_ratio": head_width / maxf(neck_width, 0.000001),
		"archetype": character["archetype"],
	})

	return result


func _pick_edge_character(length: float, min_cell: float) -> Dictionary:
	# V5 deliberately narrows the family. Most cuts are the standard profile;
	# broad and compact are close cousins rather than radically different tabs.
	var roll: float = rng.randf()
	var archetype := "standard_round"
	var depth_multiplier := 1.0
	var head_multiplier := 1.0
	var neck_multiplier := 1.0
	var shoulder_multiplier := 1.0

	if roll < 0.20:
		archetype = "broad_round"
		depth_multiplier = 0.96
		head_multiplier = 1.06
		neck_multiplier = 0.98
		shoulder_multiplier = 1.02
	elif roll < 0.35:
		archetype = "compact_round"
		depth_multiplier = 1.02
		head_multiplier = 0.96
		neck_multiplier = 0.96
		shoulder_multiplier = 0.94

	var center_ratio: float = rng.randf_range(0.455, 0.545)
	var depth_ratio: float = rng.randf_range(0.235, 0.270) * depth_multiplier

	var shoulder_left: float = rng.randf_range(0.250, 0.300) * length * shoulder_multiplier
	var shoulder_right: float = rng.randf_range(0.250, 0.300) * length * shoulder_multiplier
	var neck_left: float = rng.randf_range(0.060, 0.075) * length * neck_multiplier
	var neck_right: float = rng.randf_range(0.060, 0.075) * length * neck_multiplier
	var head_left: float = rng.randf_range(0.150, 0.175) * length * head_multiplier
	var head_right: float = rng.randf_range(0.150, 0.175) * length * head_multiplier

	# Small independent differences prevent copy-paste symmetry while keeping
	# the profile recognisably standard across the whole die.
	shoulder_left *= rng.randf_range(0.97, 1.03)
	shoulder_right *= rng.randf_range(0.97, 1.03)
	neck_left *= rng.randf_range(0.97, 1.03)
	neck_right *= rng.randf_range(0.97, 1.03)
	head_left *= rng.randf_range(0.97, 1.03)
	head_right *= rng.randf_range(0.97, 1.03)

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
		"peak_shift": rng.randf_range(-0.012, 0.012) * length,
		"left_dip": rng.randf_range(0.025, 0.055) * depth,
		"right_dip": rng.randf_range(0.025, 0.055) * depth,
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
