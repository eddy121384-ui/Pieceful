class_name CutPatternGenerator
extends RefCounted

# Developer authoring generator only.
# Runtime gameplay loads approved CutPattern JSON assets instead.
#
# V13 keeps V9-V11's global C2 ribbon construction and rounded taller caps.
# V12 introduced a board-level tab/blank topology, but treated 0-tab / 4-tab
# interior pieces as illegal. Real commercial puzzles do use those silhouettes,
# so V13 changes topology from a hard constraint to a weighted distribution:
# 2/2 remains most likely, 1/3 and 3/1 are common secondary shapes, and 0/4 or
# 4/0 are rare but explicitly allowed.

const GENERATOR_VERSION := 13
const TEMPLATE_NAME := "classic_cardboard_v13_weighted_topology"
const EXTREME_TOPOLOGY_WEIGHT := 0.10
const ONE_THREE_TOPOLOGY_WEIGHT := 0.72

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
var horizontal_polarities := PackedInt32Array()
var vertical_polarities := PackedInt32Array()

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
	_build_edge_polarities()
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
			"topology_rule": "weighted_mix_with_rare_extremes",
			"topology_weights": {
				"zero_tabs": EXTREME_TOPOLOGY_WEIGHT,
				"one_tab": ONE_THREE_TOPOLOGY_WEIGHT,
				"two_tabs": 1.0,
				"three_tabs": ONE_THREE_TOPOLOGY_WEIGHT,
				"four_tabs": EXTREME_TOPOLOGY_WEIGHT,
			},
			"topology_distribution": _topology_distribution(),
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


func _build_edge_polarities() -> void:
	# Canonical sign semantics:
	# H +1 bulges downward => tab for the piece above, blank for the piece below.
	# V +1 bulges left     => blank for the piece left, tab for the piece right.
	# Outer edges remain 0 / flat.
	horizontal_polarities.resize((rows + 1) * columns)
	vertical_polarities.resize(rows * (columns + 1))
	for index in range(horizontal_polarities.size()):
		horizontal_polarities[index] = 0
	for index in range(vertical_polarities.size()):
		vertical_polarities[index] = 0

	# A checker orientation gives a calm 2-tab / 2-blank starting point. The
	# weighted randomizer then perturbs it; extremes are possible, not forbidden.
	for boundary_row in range(1, rows):
		for column in range(columns):
			horizontal_polarities[boundary_row * columns + column] = (
				1 if (boundary_row + column) % 2 == 0 else -1
			)

	for row in range(rows):
		for boundary_column in range(1, columns):
			vertical_polarities[row * (columns + 1) + boundary_column] = (
				1 if (row + boundary_column) % 2 == 0 else -1
			)

	_randomize_edge_polarities()


func _randomize_edge_polarities() -> void:
	# Keep topology RNG independent from geometry RNG so visual tuning remains
	# seed-comparable across generator revisions.
	var topology_rng := RandomNumberGenerator.new()
	topology_rng.seed = seed + 104729

	var horizontal_count: int = maxi(0, rows - 1) * columns
	var vertical_count: int = rows * maxi(0, columns - 1)
	var total_internal_edges: int = horizontal_count + vertical_count
	if total_internal_edges <= 0:
		return

	# Unique accepted flips make the checker base less repetitive. Acceptance is
	# weighted by the resulting interior-piece silhouettes instead of rejecting
	# 0/4 or 4/0 outright. This makes extremes genuinely possible but uncommon.
	var target_successes: int = maxi(1, int(round(float(total_internal_edges) * 0.28)))
	var max_attempts: int = maxi(32, total_internal_edges * 14)
	var successes := 0
	var touched := {}

	for _attempt in range(max_attempts):
		if successes >= target_successes:
			break

		var pick: int = topology_rng.randi_range(0, total_internal_edges - 1)
		if touched.has(pick):
			continue

		if pick < horizontal_count:
			var boundary_row: int = 1 + int(pick / columns)
			var column: int = pick % columns
			var index: int = boundary_row * columns + column
			var old_sign: int = horizontal_polarities[index]
			horizontal_polarities[index] = -old_sign

			var acceptance: float = (
				_piece_topology_weight(boundary_row - 1, column)
				* _piece_topology_weight(boundary_row, column)
			)
			if topology_rng.randf() <= acceptance:
				touched[pick] = true
				successes += 1
			else:
				horizontal_polarities[index] = old_sign
		else:
			var vertical_pick: int = pick - horizontal_count
			var inner_columns: int = maxi(columns - 1, 1)
			var row: int = int(vertical_pick / inner_columns)
			var boundary_column: int = 1 + vertical_pick % inner_columns
			var index: int = row * (columns + 1) + boundary_column
			var old_sign: int = vertical_polarities[index]
			vertical_polarities[index] = -old_sign

			var acceptance: float = (
				_piece_topology_weight(row, boundary_column - 1)
				* _piece_topology_weight(row, boundary_column)
			)
			if topology_rng.randf() <= acceptance:
				touched[pick] = true
				successes += 1
			else:
				vertical_polarities[index] = old_sign


func _piece_topology_weight(row: int, column: int) -> float:
	# Border pieces have flat sides, so the 0..4 interior-tab distribution does
	# not describe them cleanly; do not bias a candidate flip because of them.
	if row <= 0 or row >= rows - 1 or column <= 0 or column >= columns - 1:
		return 1.0

	match _piece_tab_count(row, column):
		0, 4:
			return EXTREME_TOPOLOGY_WEIGHT
		1, 3:
			return ONE_THREE_TOPOLOGY_WEIGHT
		2:
			return 1.0
		_:
			return 0.0


func _piece_tab_count(row: int, column: int) -> int:
	var tabs := 0

	if row > 0:
		# Piece is below the canonical horizontal cut.
		if horizontal_polarities[row * columns + column] < 0:
			tabs += 1
	if row < rows - 1:
		# Piece is above the canonical horizontal cut.
		if horizontal_polarities[(row + 1) * columns + column] > 0:
			tabs += 1
	if column > 0:
		# Piece is right of the canonical vertical cut.
		if vertical_polarities[row * (columns + 1) + column] > 0:
			tabs += 1
	if column < columns - 1:
		# Piece is left of the canonical vertical cut.
		if vertical_polarities[row * (columns + 1) + column + 1] < 0:
			tabs += 1

	return tabs


func _topology_distribution() -> Dictionary:
	var distribution := {
		"zero_tabs": 0,
		"one_tab": 0,
		"two_tabs": 0,
		"three_tabs": 0,
		"four_tabs": 0,
	}

	for row in range(1, rows - 1):
		for column in range(1, columns - 1):
			var tabs: int = _piece_tab_count(row, column)
			match tabs:
				0:
					distribution["zero_tabs"] += 1
				1:
					distribution["one_tab"] += 1
				2:
					distribution["two_tabs"] += 1
				3:
					distribution["three_tabs"] += 1
				4:
					distribution["four_tabs"] += 1

	return distribution


func _horizontal_polarity(boundary_row: int, column: int) -> int:
	return horizontal_polarities[boundary_row * columns + column]


func _vertical_polarity(row: int, boundary_column: int) -> int:
	return vertical_polarities[row * (columns + 1) + boundary_column]


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

		var polarities := PackedInt32Array()
		for column in range(columns):
			polarities.append(_horizontal_polarity(boundary_row, column))
		var ribbon_segments := _build_global_ribbon(junctions, polarities)
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

		var polarities := PackedInt32Array()
		for row in range(rows):
			polarities.append(_vertical_polarity(row, boundary_column))
		var ribbon_segments := _build_global_ribbon(junctions, polarities)
		for row in range(rows):
			vertical_segments[row * (columns + 1) + boundary_column] = ribbon_segments[row]


func _build_global_ribbon(
	junctions: PackedVector2Array,
	polarities: PackedInt32Array
) -> Array:
	var cell_count: int = junctions.size() - 1
	var min_cell: float = minf(cell_size.x, cell_size.y)
	var profile := _make_ribbon_profile(min_cell)

	var guides := PackedVector2Array([junctions[0]])
	var cell_ranges: Array[Vector2i] = []

	for cell_index in range(cell_count):
		var range_start: int = guides.size() - 1
		var tab_sign: float = float(polarities[cell_index])
		var interior := _make_cell_guides(
			junctions[cell_index],
			junctions[cell_index + 1],
			cell_index,
			cell_count,
			profile,
			tab_sign
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
	ribbon_profile: Dictionary,
	tab_sign: float
) -> PackedVector2Array:
	var delta := finish - start
	var length: float = delta.length()
	if length <= 0.000001:
		return PackedVector2Array()

	var tangent := delta / length
	var normal := Vector2(-tangent.y, tangent.x)
	var min_cell: float = minf(cell_size.x, cell_size.y)
	var character := _pick_edge_character(length, min_cell)

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

	# Taller rounded crown inherited from V11.
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
