class_name CutPatternGenerator
extends RefCounted

# Developer authoring generator only.
# Runtime gameplay loads approved CutPattern JSON assets instead.
#
# V11 preserves V9's construction model: each complete horizontal / vertical
# ribbon is designed as one global C2-continuous natural cubic spline and then
# split back into per-cell cubic Bezier chains for the CutPattern asset format.
# V10 rounded the cap; V11 lifts the whole rounded crown together so the
# mushroom reads taller without bringing back a pointed diamond silhouette.

const GENERATOR_VERSION := 11
const TEMPLATE_NAME := "classic_cardboard_v11_taller_round_caps"

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
			"type": "cubic_bezier_chain",
			"version": 1,
			"samples_per_span": 10,
		},
		"authoring": {
			"generator_version": GENERATOR_VERSION,
			"seed": seed,
			"template": TEMPLATE_NAME,
			"construction": "global_natural_cubic_c2",
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

	# Keep a recognisable ribbon lattice, but avoid CAD-perfect crosses.
	# Most organic quality comes from the global ribbon spline rather than from
	# aggressively displaced intersections.
	var jitter_x: float = cell_size.x * 0.034
	var jitter_y: float = cell_size.y * 0.034

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
		var junctions := PackedVector2Array()
		for column in range(columns + 1):
			junctions.append(_grid_point(boundary_row, column))

		if boundary_row == 0 or boundary_row == rows:
			for column in range(columns):
				horizontal_segments.append(
					PackedVector2Array([junctions[column], junctions[column + 1]])
				)
			continue

		var ribbon_segments := _build_global_ribbon(junctions)
		for segment in ribbon_segments:
			horizontal_segments.append(segment)


func _build_vertical_segments() -> void:
	vertical_segments.clear()
	vertical_segments.resize(rows * (columns + 1))

	for boundary_column in range(columns + 1):
		var junctions := PackedVector2Array()
		for row in range(rows + 1):
			junctions.append(_grid_point(row, boundary_column))

		if boundary_column == 0 or boundary_column == columns:
			for row in range(rows):
				vertical_segments[row * (columns + 1) + boundary_column] = PackedVector2Array([
					junctions[row],
					junctions[row + 1],
				])
			continue

		var ribbon_segments := _build_global_ribbon(junctions)
		for row in range(rows):
			vertical_segments[row * (columns + 1) + boundary_column] = ribbon_segments[row]


func _build_global_ribbon(junctions: PackedVector2Array) -> Array:
	var cell_count: int = junctions.size() - 1
	var min_cell: float = minf(cell_size.x, cell_size.y)
	var profile := _make_ribbon_profile(min_cell)

	var guides := PackedVector2Array([junctions[0]])
	var cell_ranges: Array[Vector2i] = []

	for cell_index in range(cell_count):
		var range_start: int = guides.size() - 1
		var interior := _make_cell_guides(
			junctions[cell_index],
			junctions[cell_index + 1],
			cell_index,
			cell_count,
			profile
		)
		guides.append_array(interior)
		guides.append(junctions[cell_index + 1])
		cell_ranges.append(Vector2i(range_start, guides.size() - 1))

	return _natural_cubic_bezier_ranges(guides, cell_ranges)


func _make_ribbon_profile(min_cell: float) -> Dictionary:
	return {
		"amplitude": min_cell * rng.randf_range(0.010, 0.020),
		"phase": rng.randf_range(0.0, 1.0),
		"secondary_amplitude": min_cell * rng.randf_range(0.0015, 0.0040),
		"secondary_phase": rng.randf_range(0.0, 1.0),
	}


func _make_cell_guides(
	start: Vector2,
	finish: Vector2,
	cell_index: int,
	cell_count: int,
	ribbon_profile: Dictionary
) -> PackedVector2Array:
	var delta := finish - start
	var length: float = delta.length()
	if length <= 0.000001:
		return PackedVector2Array()

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

	var left_gate: float = clampf(
		center - shoulder_left * 1.16,
		length * 0.12,
		length * 0.22
	)
	var right_gate: float = clampf(
		center + shoulder_right * 1.16,
		length * 0.78,
		length * 0.88
	)

	# Taller rounded crown. Lift cheek, upper-cheek, crown, and broad-top levels
	# together instead of only lifting the centre peak; that preserves the V10
	# round cap while adding the requested mushroom height.
	var local_guides := PackedVector2Array([
		Vector2(left_gate * 0.44, 0.0),
		Vector2(left_gate * 0.76, -left_dip * 0.04),
		Vector2(left_gate, -left_dip * 0.14),
		Vector2(center - shoulder_left, -left_dip * 0.34),
		Vector2(center - (head_left + neck_left) * 0.58, -left_dip),
		Vector2(center - neck_left, 0.135 * depth),
		Vector2(center - head_left * 0.91, 0.480 * depth),
		Vector2(center - head_left, 0.690 * depth),
		Vector2(center - head_left * 0.91, 0.855 * depth),
		Vector2(center - head_left * 0.70, 0.990 * depth),
		Vector2(center - head_left * 0.42, 1.075 * depth),
		Vector2(center - head_left * 0.17 + peak_shift * 0.35, 1.120 * depth),
		Vector2(center + peak_shift, 1.135 * depth),
		Vector2(center + head_right * 0.17 + peak_shift * 0.35, 1.120 * depth),
		Vector2(center + head_right * 0.42, 1.075 * depth),
		Vector2(center + head_right * 0.70, 0.990 * depth),
		Vector2(center + head_right * 0.91, 0.855 * depth),
		Vector2(center + head_right, 0.690 * depth),
		Vector2(center + head_right * 0.91, 0.480 * depth),
		Vector2(center + neck_right, 0.135 * depth),
		Vector2(center + (head_right + neck_right) * 0.58, -right_dip),
		Vector2(center + shoulder_right, -right_dip * 0.34),
		Vector2(right_gate, -right_dip * 0.14),
		Vector2(right_gate + (length - right_gate) * 0.24, -right_dip * 0.04),
		Vector2(right_gate + (length - right_gate) * 0.56, 0.0),
	])

	var result := PackedVector2Array()
	for local_point in local_guides:
		var local_ratio: float = clampf(local_point.x / length, 0.0, 1.0)
		var global_ratio: float = (
			float(cell_index) + local_ratio
		) / maxf(float(cell_count), 1.0)
		var body_offset: float = _ribbon_offset(ribbon_profile, global_ratio)
		result.append(
			start
			+ tangent * local_point.x
			+ normal * (body_offset + local_point.y * tab_sign)
		)

	var neck_width: float = neck_left + neck_right
	var head_width: float = head_left + head_right
	segment_metrics.append({
		"neck_width_ratio": neck_width / length,
		"depth_ratio": depth * 1.135 / min_cell,
		"center_ratio": center_ratio,
		"head_to_neck_ratio": head_width / maxf(neck_width, 0.000001),
		"archetype": character["archetype"],
	})

	return result


func _ribbon_offset(profile: Dictionary, global_ratio: float) -> float:
	var amplitude: float = float(profile["amplitude"])
	var phase: float = float(profile["phase"])
	var secondary_amplitude: float = float(profile["secondary_amplitude"])
	var secondary_phase: float = float(profile["secondary_phase"])
	return (
		amplitude * sin(TAU * (global_ratio + phase))
		+ secondary_amplitude * sin(2.0 * TAU * (global_ratio + secondary_phase))
	)


func _pick_edge_character(length: float, min_cell: float) -> Dictionary:
	var roll: float = rng.randf()
	var archetype := "standard_round"
	var depth_multiplier := 1.0
	var head_multiplier := 1.0
	var neck_multiplier := 1.0
	var shoulder_multiplier := 1.0

	if roll < 0.16:
		archetype = "broad_round"
		depth_multiplier = 0.98
		head_multiplier = 1.045
		shoulder_multiplier = 1.02
	elif roll < 0.30:
		archetype = "compact_round"
		depth_multiplier = 1.015
		head_multiplier = 0.975
		neck_multiplier = 0.98
		shoulder_multiplier = 0.97

	var center_ratio: float = rng.randf_range(0.468, 0.532)
	var depth_ratio: float = rng.randf_range(0.222, 0.250) * depth_multiplier

	var shoulder_left: float = rng.randf_range(0.252, 0.292) * length * shoulder_multiplier
	var shoulder_right: float = rng.randf_range(0.252, 0.292) * length * shoulder_multiplier
	var neck_left: float = rng.randf_range(0.062, 0.073) * length * neck_multiplier
	var neck_right: float = rng.randf_range(0.062, 0.073) * length * neck_multiplier
	var head_left: float = rng.randf_range(0.154, 0.176) * length * head_multiplier
	var head_right: float = rng.randf_range(0.154, 0.176) * length * head_multiplier

	shoulder_left *= rng.randf_range(0.990, 1.010)
	shoulder_right *= rng.randf_range(0.990, 1.010)
	neck_left *= rng.randf_range(0.990, 1.010)
	neck_right *= rng.randf_range(0.990, 1.010)
	head_left *= rng.randf_range(0.990, 1.010)
	head_right *= rng.randf_range(0.990, 1.010)

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
		"peak_shift": rng.randf_range(-0.005, 0.005) * length,
		"left_dip": rng.randf_range(0.026, 0.043) * depth,
		"right_dip": rng.randf_range(0.026, 0.043) * depth,
	}


func _natural_cubic_bezier_ranges(
	points: PackedVector2Array,
	ranges: Array[Vector2i]
) -> Array:
	var result: Array = []
	if points.size() < 2:
		return result

	var params := _centripetal_parameters(points)
	var second_derivatives := _natural_second_derivatives(points, params)

	for cell_range in ranges:
		var start_index: int = cell_range.x
		var end_index: int = cell_range.y
		var controls := PackedVector2Array([points[start_index]])

		for index in range(start_index, end_index):
			var h: float = params[index + 1] - params[index]
			if h <= 0.000001:
				continue

			var p0 := points[index]
			var p1 := points[index + 1]
			var m0 := second_derivatives[index]
			var m1 := second_derivatives[index + 1]
			var slope := (p1 - p0) / h
			var d0 := slope - h * (2.0 * m0 + m1) / 6.0
			var d1 := slope + h * (m0 + 2.0 * m1) / 6.0

			controls.append(p0 + d0 * h / 3.0)
			controls.append(p1 - d1 * h / 3.0)
			controls.append(p1)

		result.append(controls)

	return result


func _centripetal_parameters(points: PackedVector2Array) -> Array[float]:
	var params: Array[float] = [0.0]
	for index in range(points.size() - 1):
		var chord: float = maxf((points[index + 1] - points[index]).length(), 0.000001)
		params.append(params[params.size() - 1] + sqrt(chord))
	return params


func _natural_second_derivatives(
	points: PackedVector2Array,
	params: Array[float]
) -> PackedVector2Array:
	var count: int = points.size()
	var second := PackedVector2Array()
	second.resize(count)
	for index in range(count):
		second[index] = Vector2.ZERO

	if count <= 2:
		return second

	var internal_count: int = count - 2
	var lower: Array[float] = []
	var diagonal: Array[float] = []
	var upper: Array[float] = []
	var rhs: Array[Vector2] = []
	lower.resize(internal_count)
	diagonal.resize(internal_count)
	upper.resize(internal_count)
	rhs.resize(internal_count)

	for internal_index in range(internal_count):
		var point_index: int = internal_index + 1
		var h_before: float = params[point_index] - params[point_index - 1]
		var h_after: float = params[point_index + 1] - params[point_index]
		lower[internal_index] = h_before if internal_index > 0 else 0.0
		diagonal[internal_index] = 2.0 * (h_before + h_after)
		upper[internal_index] = h_after if internal_index < internal_count - 1 else 0.0
		rhs[internal_index] = 6.0 * (
			(points[point_index + 1] - points[point_index]) / h_after
			- (points[point_index] - points[point_index - 1]) / h_before
		)

	for internal_index in range(1, internal_count):
		var factor: float = lower[internal_index] / diagonal[internal_index - 1]
		diagonal[internal_index] -= factor * upper[internal_index - 1]
		rhs[internal_index] -= factor * rhs[internal_index - 1]

	var solved: Array[Vector2] = []
	solved.resize(internal_count)
	solved[internal_count - 1] = rhs[internal_count - 1] / diagonal[internal_count - 1]
	for internal_index in range(internal_count - 2, -1, -1):
		solved[internal_index] = (
			rhs[internal_index]
			- upper[internal_index] * solved[internal_index + 1]
		) / diagonal[internal_index]

	for internal_index in range(internal_count):
		second[internal_index + 1] = solved[internal_index]

	return second


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