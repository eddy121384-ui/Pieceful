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

	var jitter_x: float = cell_size.x * 0.065
	var jitter_y: float = cell_size.y * 0.065

	for row in range(rows + 1):
		for column in range(columns + 1):
			var point := Vector2(
				float(column) * cell_size.x,
				float(row) * cell_size.y
			)

			# The outside remains rectangular. Internal intersections and the
			# division points along the border slide a little, so neighbouring
			# pieces do not all inherit identical rectangular bodies.
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

	var tab_sign: float = 1.0 if rng.randi_range(0, 1) == 0 else -1.0
	var center: float = rng.randf_range(0.43, 0.57)
	var neck_width: float = rng.randf_range(0.090, 0.125)
	var head_width: float = rng.randf_range(0.245, 0.315)
	var depth: float = min_cell * rng.randf_range(0.155, 0.215)
	var asymmetry: float = rng.randf_range(-0.10, 0.10)
	var baseline_bend: float = min_cell * rng.randf_range(-0.028, 0.028)

	var neck_half: float = neck_width * 0.5
	var head_half: float = head_width * 0.5
	var left_scale: float = 1.0 + asymmetry
	var right_scale: float = 1.0 - asymmetry
	var anchors: Array[Vector2] = []

	# A classic jigsaw knob is not monotonic along the edge: the narrow neck
	# rises first, then the rounded head overhangs past it. That small return
	# in X is what makes the silhouette read as a physical die-cut instead
	# of a smooth teardrop or sine wave.
	anchors.append(Vector2(0.0, 0.0))
	anchors.append(Vector2(center - neck_half * 1.55 * left_scale, 0.0))
	anchors.append(Vector2(center - neck_half * left_scale, depth * 0.08))
	anchors.append(Vector2(center - neck_half * 0.86 * left_scale, depth * 0.34))
	anchors.append(Vector2(center - head_half * left_scale, depth * 0.76))
	anchors.append(Vector2(center - head_half * 0.46 * left_scale, depth * 0.94))
	anchors.append(Vector2(center, depth))
	anchors.append(Vector2(center + head_half * 0.46 * right_scale, depth * 0.94))
	anchors.append(Vector2(center + head_half * right_scale, depth * 0.76))
	anchors.append(Vector2(center + neck_half * 0.86 * right_scale, depth * 0.34))
	anchors.append(Vector2(center + neck_half * right_scale, depth * 0.08))
	anchors.append(Vector2(center + neck_half * 1.55 * right_scale, 0.0))
	anchors.append(Vector2(1.0, 0.0))

	var sampled_local := _sample_catmull_rom(anchors, 4)
	var result := PackedVector2Array()

	for local_point in sampled_local:
		var x_ratio: float = clampf(local_point.x, 0.0, 1.0)
		var bend: float = baseline_bend * sin(PI * x_ratio)
		var normal_offset: float = bend + local_point.y * tab_sign
		result.append(
			start
			+ tangent * (x_ratio * length)
			+ normal * normal_offset
		)

	# Shared segments end at exactly the same grid intersections for both
	# neighbouring pieces, regardless of floating-point interpolation.
	result[0] = start
	result[result.size() - 1] = finish
	return result


func _sample_catmull_rom(
	anchors: Array[Vector2],
	samples_per_section: int
) -> PackedVector2Array:
	var result := PackedVector2Array()
	result.append(anchors[0])

	for section in range(anchors.size() - 1):
		var p0: Vector2 = anchors[maxi(section - 1, 0)]
		var p1: Vector2 = anchors[section]
		var p2: Vector2 = anchors[section + 1]
		var p3: Vector2 = anchors[mini(section + 2, anchors.size() - 1)]

		for sample in range(1, samples_per_section + 1):
			var t: float = float(sample) / float(samples_per_section)
			result.append(_catmull_rom_point(p0, p1, p2, p3, t))

	return result


func _catmull_rom_point(
	p0: Vector2,
	p1: Vector2,
	p2: Vector2,
	p3: Vector2,
	t: float
) -> Vector2:
	var t2: float = t * t
	var t3: float = t2 * t
	return 0.5 * (
		2.0 * p1
		+ (-p0 + p2) * t
		+ (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t2
		+ (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t3
	)


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
