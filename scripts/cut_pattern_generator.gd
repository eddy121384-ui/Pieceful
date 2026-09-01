class_name CutPatternGenerator
extends RefCounted

var columns: int
var rows: int
var board_size: Vector2
var cell_size: Vector2

var grid_points: Array[Vector2] = []
var horizontal_segments: Array = []
var vertical_segments: Array = []

var rng := RandomNumberGenerator.new()


func _init(
	p_columns: int,
	p_rows: int,
	p_board_size: Vector2,
	p_seed: int
) -> void:
	columns = p_columns
	rows = p_rows
	board_size = p_board_size
	cell_size = board_size / Vector2(float(columns), float(rows))
	rng.seed = p_seed

	_build_grid_points()
	_build_horizontal_segments()
	_build_vertical_segments()


func outline_for(row: int, column: int) -> PackedVector2Array:
	var outline := PackedVector2Array()
	var nominal_origin := Vector2(
		float(column) * cell_size.x,
		float(row) * cell_size.y
	)

	_append_segment(outline, _horizontal_segment(row, column), false, nominal_origin)
	_append_segment(outline, _vertical_segment(row, column + 1), false, nominal_origin)
	_append_segment(outline, _horizontal_segment(row + 1, column), true, nominal_origin)
	_append_segment(outline, _vertical_segment(row, column), true, nominal_origin)

	return outline


func _build_grid_points() -> void:
	grid_points.clear()

	# Real die-cut puzzles are still based on a fairly regular lattice.
	# Keep the drift subtle; large jitter makes pieces look hand-torn.
	var jitter_x: float = cell_size.x * 0.028
	var jitter_y: float = cell_size.y * 0.028

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
			var start := _grid_point(boundary_row, column)
			var finish := _grid_point(boundary_row, column + 1)
			var internal := boundary_row > 0 and boundary_row < rows
			horizontal_segments.append(_make_segment(start, finish, internal))


func _build_vertical_segments() -> void:
	vertical_segments.clear()

	for row in range(rows):
		for boundary_column in range(columns + 1):
			var start := _grid_point(row, boundary_column)
			var finish := _grid_point(row + 1, boundary_column)
			var internal := boundary_column > 0 and boundary_column < columns
			vertical_segments.append(_make_segment(start, finish, internal))


func _make_segment(
	start: Vector2,
	finish: Vector2,
	internal: bool
) -> PackedVector2Array:
	if not internal:
		return PackedVector2Array([start, finish])

	var delta := finish - start
	var length: float = delta.length()
	if length <= 0.001:
		return PackedVector2Array([start, finish])

	var tangent := delta / length
	var normal := Vector2(-tangent.y, tangent.x)
	var min_cell: float = minf(cell_size.x, cell_size.y)

	# Classic die-cut language: a broad neck, rounded cap and shallow depth.
	# Variation is intentionally modest. The previous prototype randomized
	# too aggressively and produced keyhole-shaped fantasy pieces.
	var tab_sign: float = 1.0 if rng.randi_range(0, 1) == 0 else -1.0
	var center: float = rng.randf_range(0.46, 0.54) * length
	var neck_half: float = rng.randf_range(0.060, 0.078) * length
	var head_half: float = rng.randf_range(0.098, 0.118) * length
	var shoulder_half: float = rng.randf_range(0.185, 0.215) * length
	var depth: float = min_cell * rng.randf_range(0.112, 0.145)
	var shoulder_dip: float = depth * rng.randf_range(0.035, 0.065)
	var asymmetry: float = rng.randf_range(-0.045, 0.045)
	var baseline_bend: float = min_cell * rng.randf_range(-0.010, 0.010)

	var left_scale: float = 1.0 + asymmetry
	var right_scale: float = 1.0 - asymmetry

	var a := Vector2(0.0, 0.0)
	var b := Vector2(center - shoulder_half * left_scale, 0.0)
	var c := Vector2(center - neck_half * left_scale, -shoulder_dip)
	var d := Vector2(center - neck_half * left_scale, depth * 0.24)
	var e := Vector2(center - head_half * left_scale, depth * 0.57)
	var f := Vector2(center - head_half * 0.67 * left_scale, depth * 0.90)
	var g := Vector2(center, depth)
	var h := Vector2(center + head_half * 0.67 * right_scale, depth * 0.90)
	var i := Vector2(center + head_half * right_scale, depth * 0.57)
	var j := Vector2(center + neck_half * right_scale, depth * 0.24)
	var k := Vector2(center + neck_half * right_scale, -shoulder_dip)
	var l := Vector2(center + shoulder_half * right_scale, 0.0)
	var m := Vector2(length, 0.0)

	var local_points := PackedVector2Array([a])

	# Baseline → gentle inward shoulder.
	_append_cubic(local_points, a, a + Vector2(length * 0.08, 0.0), b - Vector2(length * 0.05, 0.0), b, 3)
	_append_cubic(local_points, b, b + Vector2(shoulder_half * 0.18, 0.0), c - Vector2(neck_half * 0.15, -shoulder_dip * 0.20), c, 3)

	# Shoulder → neck → overhanging round head.
	_append_cubic(local_points, c, c + Vector2(neck_half * 0.04, depth * 0.09), d - Vector2(neck_half * 0.03, depth * 0.07), d, 3)
	_append_cubic(local_points, d, d + Vector2(0.0, depth * 0.17), e + Vector2(head_half * 0.18, -depth * 0.10), e, 4)
	_append_cubic(local_points, e, e + Vector2(-head_half * 0.10, depth * 0.14), f - Vector2(head_half * 0.07, depth * 0.05), f, 3)
	_append_cubic(local_points, f, f + Vector2(head_half * 0.18, depth * 0.08), g - Vector2(head_half * 0.22, 0.0), g, 4)

	# Mirror the cap back down the other side.
	_append_cubic(local_points, g, g + Vector2(head_half * 0.22, 0.0), h - Vector2(head_half * 0.18, -depth * 0.08), h, 4)
	_append_cubic(local_points, h, h + Vector2(head_half * 0.07, -depth * 0.05), i + Vector2(head_half * 0.10, depth * 0.14), i, 3)
	_append_cubic(local_points, i, i - Vector2(head_half * 0.18, depth * 0.10), j + Vector2(0.0, depth * 0.17), j, 4)
	_append_cubic(local_points, j, j + Vector2(neck_half * 0.03, -depth * 0.07), k - Vector2(neck_half * 0.04, -depth * 0.09), k, 3)
	_append_cubic(local_points, k, k + Vector2(neck_half * 0.15, -shoulder_dip * 0.20), l - Vector2(shoulder_half * 0.18, 0.0), l, 3)
	_append_cubic(local_points, l, l + Vector2(length * 0.05, 0.0), m - Vector2(length * 0.08, 0.0), m, 3)

	var result := PackedVector2Array()
	for local_point in local_points:
		var x_ratio: float = clampf(local_point.x / length, 0.0, 1.0)
		var bend: float = baseline_bend * sin(PI * x_ratio)
		var normal_offset: float = bend + local_point.y * tab_sign
		result.append(
			start
			+ tangent * local_point.x
			+ normal * normal_offset
		)

	# Both neighbouring pieces reuse this exact array in opposite directions.
	result[0] = start
	result[result.size() - 1] = finish
	return result


func _append_cubic(
	points: PackedVector2Array,
	p0: Vector2,
	p1: Vector2,
	p2: Vector2,
	p3: Vector2,
	samples: int
) -> void:
	for sample in range(1, samples + 1):
		var t: float = float(sample) / float(samples)
		var one_minus_t: float = 1.0 - t
		var point := (
			one_minus_t * one_minus_t * one_minus_t * p0
			+ 3.0 * one_minus_t * one_minus_t * t * p1
			+ 3.0 * one_minus_t * t * t * p2
			+ t * t * t * p3
		)
		points.append(point)


func _append_segment(
	outline: PackedVector2Array,
	segment: PackedVector2Array,
	reverse: bool,
	nominal_origin: Vector2
) -> void:
	if reverse:
		for index in range(segment.size() - 1, -1, -1):
			if not outline.is_empty() and index == segment.size() - 1:
				continue
			outline.append(segment[index] - nominal_origin)
	else:
		for index in range(segment.size()):
			if not outline.is_empty() and index == 0:
				continue
			outline.append(segment[index] - nominal_origin)


func _grid_point(row: int, column: int) -> Vector2:
	return grid_points[row * (columns + 1) + column]


func _horizontal_segment(boundary_row: int, column: int) -> PackedVector2Array:
	return horizontal_segments[boundary_row * columns + column]


func _vertical_segment(row: int, boundary_column: int) -> PackedVector2Array:
	return vertical_segments[row * (columns + 1) + boundary_column]
