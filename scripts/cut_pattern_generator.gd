class_name CutPatternGenerator
extends RefCounted

# Developer authoring generator only.
# Runtime gameplay loads approved CutPattern JSON assets instead.

const GENERATOR_VERSION := 8
const TEMPLATE_NAME := "classic_cardboard_v8_curved_junctions"

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

	# Commercial ribbon-cut puzzles keep the grid readable. Intersection drift
	# is present, but subtle; most of the character should come from flowing
	# linework around the junctions rather than from a warped lattice.
	var jitter_x: float = cell_size.x * 0.040
	var jitter_y: float = cell_size.y * 0.040

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
			var internal := boundary_row > 0 and boundary_row < rows
			horizontal_segments.append(
				_make_segment(
					_grid_point(boundary_row, column),
					_grid_point(boundary_row, column + 1),
					internal,
					_horizontal_grid_tangent(boundary_row, column),
					_horizontal_grid_tangent(boundary_row, column + 1)
				)
			)


func _build_vertical_segments() -> void:
	vertical_segments.clear()

	for row in range(rows):
		for boundary_column in range(columns + 1):
			var internal := boundary_column > 0 and boundary_column < columns
			vertical_segments.append(
				_make_segment(
					_grid_point(row, boundary_column),
					_grid_point(row + 1, boundary_column),
					internal,
					_vertical_grid_tangent(row, boundary_column),
					_vertical_grid_tangent(row + 1, boundary_column)
				)
			)


func _make_segment(
	start: Vector2,
	finish: Vector2,
	internal: bool,
	start_direction: Vector2,
	finish_direction: Vector2
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

	# V8 focuses on the junction zones: the ribbon should already be curving as
	# it leaves or approaches a cross, instead of running straight and only
	# bending near the knob. One coherent bow sign keeps the span flowing.
	var ribbon_sign: float = 1.0 if rng.randi_range(0, 1) == 0 else -1.0
	var junction_curve: float = ribbon_sign * min_cell * rng.randf_range(0.014, 0.026)
	var baseline_bend: float = ribbon_sign * min_cell * rng.randf_range(0.010, 0.018)
	var baseline_wave: float = min_cell * rng.randf_range(-0.0025, 0.0025)

	var left_gate: float = center - shoulder_left * 1.18
	var right_gate: float = center + shoulder_right * 1.18
	var entry_outer_x: float = left_gate * 0.42
	var entry_inner_x: float = left_gate * 0.78
	var exit_inner_x: float = right_gate + (length - right_gate) * 0.22
	var exit_outer_x: float = right_gate + (length - right_gate) * 0.58

	# Extra knots before and after the main knob make the red-circled cross
	# junctions read as flowing ribbons instead of a rigid plus sign.
	var local_knots := PackedVector2Array([
		Vector2(0.0, 0.0),
		Vector2(entry_outer_x, 0.18 * junction_curve),
		Vector2(entry_inner_x, 0.60 * junction_curve),
		Vector2(left_gate, 0.96 * junction_curve),
		Vector2(center - shoulder_left, 0.42 * junction_curve - left_dip * 0.10),
		Vector2(center - (head_left + neck_left) * 0.56, -left_dip),
		Vector2(center - neck_left, 0.150 * depth),
		Vector2(center - head_left, 0.585 * depth),
		Vector2(center - head_left * 0.55, 0.940 * depth),
		Vector2(center + peak_shift, 1.045 * depth),
		Vector2(center + head_right * 0.55, 0.940 * depth),
		Vector2(center + head_right, 0.585 * depth),
		Vector2(center + neck_right, 0.150 * depth),
		Vector2(center + (head_right + neck_right) * 0.56, -right_dip),
		Vector2(center + shoulder_right, 0.42 * junction_curve - right_dip * 0.10),
		Vector2(right_gate, 0.96 * junction_curve),
		Vector2(exit_inner_x, 0.60 * junction_curve),
		Vector2(exit_outer_x, 0.18 * junction_curve),
		Vector2(length, 0.0),
	])

	var world_knots := PackedVector2Array()
	for local_point in local_knots:
		var x_ratio: float = clampf(local_point.x / length, 0.0, 1.0)
		var body_offset: float = (
			baseline_bend * sin(PI * x_ratio)
			+ baseline_wave * sin(TAU * x_ratio)
		)
		world_knots.append(
			start
			+ tangent * local_point.x
			+ normal * (body_offset + local_point.y * tab_sign)
		)

	world_knots[0] = start
	world_knots[world_knots.size() - 1] = finish

	var result := _bezier_chain_from_knots(
		world_knots,
		start_direction,
		finish_direction
	)

	var neck_width: float = neck_left + neck_right
	var head_width: float = head_left + head_right
	segment_metrics.append({
		"neck_width_ratio": neck_width / length,
		"depth_ratio": depth * 1.045 / min_cell,
		"center_ratio": center_ratio,
		"head_to_neck_ratio": head_width / maxf(neck_width, 0.000001),
		"archetype": character["archetype"],
	})

	return result


func _pick_edge_character(length: float, min_cell: float) -> Dictionary:
	# Keep the mature commercial family language: mostly standard cuts, with only
	# a small amount of closely related variety.
	var roll: float = rng.randf()
	var archetype := "standard_round"
	var depth_multiplier := 1.0
	var head_multiplier := 1.0
	var neck_multiplier := 1.0
	var shoulder_multiplier := 1.0

	if roll < 0.16:
		archetype = "broad_round"
		depth_multiplier = 0.97
		head_multiplier = 1.05
		neck_multiplier = 1.00
		shoulder_multiplier = 1.02
	elif roll < 0.30:
		archetype = "compact_round"
		depth_multiplier = 1.02
		head_multiplier = 0.96
		neck_multiplier = 0.97
		shoulder_multiplier = 0.96

	var center_ratio: float = rng.randf_range(0.465, 0.535)
	var depth_ratio: float = rng.randf_range(0.220, 0.248) * depth_multiplier

	var shoulder_left: float = rng.randf_range(0.250, 0.290) * length * shoulder_multiplier
	var shoulder_right: float = rng.randf_range(0.250, 0.290) * length * shoulder_multiplier
	var neck_left: float = rng.randf_range(0.066, 0.078) * length * neck_multiplier
	var neck_right: float = rng.randf_range(0.066, 0.078) * length * neck_multiplier
	var head_left: float = rng.randf_range(0.145, 0.164) * length * head_multiplier
	var head_right: float = rng.randf_range(0.145, 0.164) * length * head_multiplier

	shoulder_left *= rng.randf_range(0.985, 1.015)
	shoulder_right *= rng.randf_range(0.985, 1.015)
	neck_left *= rng.randf_range(0.985, 1.015)
	neck_right *= rng.randf_range(0.985, 1.015)
	head_left *= rng.randf_range(0.985, 1.015)
	head_right *= rng.randf_range(0.985, 1.015)

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
		"peak_shift": rng.randf_range(-0.008, 0.008) * length,
		"left_dip": rng.randf_range(0.030, 0.050) * depth,
		"right_dip": rng.randf_range(0.030, 0.050) * depth,
	}


func _bezier_chain_from_knots(
	knots: PackedVector2Array,
	start_direction: Vector2,
	finish_direction: Vector2
) -> PackedVector2Array:
	if knots.size() < 2:
		return knots

	var tangents := PackedVector2Array()
	for index in range(knots.size()):
		var tangent_vector := Vector2.ZERO

		if index == 0:
			var first_length: float = (knots[1] - knots[0]).length()
			tangent_vector = start_direction.normalized() * first_length
		elif index == knots.size() - 1:
			var last_length: float = (knots[index] - knots[index - 1]).length()
			tangent_vector = finish_direction.normalized() * last_length
		else:
			var before := knots[index] - knots[index - 1]
			var after := knots[index + 1] - knots[index]
			var through := knots[index + 1] - knots[index - 1]
			if through.length() > 0.000001:
				var tangent_length: float = minf(before.length(), after.length()) * 1.22
				tangent_vector = through.normalized() * tangent_length

		tangents.append(tangent_vector)

	var result := PackedVector2Array([knots[0]])
	for index in range(knots.size() - 1):
		var span_length: float = (knots[index + 1] - knots[index]).length()
		var outgoing := tangents[index]
		var incoming := tangents[index + 1]

		if outgoing.length() > span_length * 1.45:
			outgoing = outgoing.normalized() * span_length * 1.45
		if incoming.length() > span_length * 1.45:
			incoming = incoming.normalized() * span_length * 1.45

		result.append(knots[index] + outgoing / 3.0)
		result.append(knots[index + 1] - incoming / 3.0)
		result.append(knots[index + 1])

	return result


func _horizontal_grid_tangent(boundary_row: int, column: int) -> Vector2:
	if column <= 0:
		return (_grid_point(boundary_row, 1) - _grid_point(boundary_row, 0)).normalized()
	if column >= columns:
		return (
			_grid_point(boundary_row, columns)
			- _grid_point(boundary_row, columns - 1)
		).normalized()
	return (
		_grid_point(boundary_row, column + 1)
		- _grid_point(boundary_row, column - 1)
	).normalized()


func _vertical_grid_tangent(row: int, boundary_column: int) -> Vector2:
	if row <= 0:
		return (_grid_point(1, boundary_column) - _grid_point(0, boundary_column)).normalized()
	if row >= rows:
		return (
			_grid_point(rows, boundary_column)
			- _grid_point(rows - 1, boundary_column)
		).normalized()
	return (
		_grid_point(row + 1, boundary_column)
		- _grid_point(row - 1, boundary_column)
	).normalized()


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
