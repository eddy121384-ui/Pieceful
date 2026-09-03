class_name CutPatternValidator
extends RefCounted

const MAX_DEPTH_RATIO := 0.34
const MIN_PROFILE_WIDTH_RATIO := 0.18
const MIN_CORNER_CLEARANCE_RATIO := 0.14
const MIN_PIECE_AREA_RATIO := 0.35
const MIN_TANGENT_DOT := 0.998


func validate(pattern: CutPatternAsset) -> Dictionary:
	var errors: Array[String] = []
	var warnings: Array[String] = []

	if pattern == null or not pattern.is_structurally_valid():
		errors.append("Pattern failed structural validation.")
		return {"valid": false, "errors": errors, "warnings": warnings}

	var design_size := Vector2(pattern.aspect_ratio, 1.0)
	var cell_size := design_size / Vector2(float(pattern.columns), float(pattern.rows))
	var min_cell: float = minf(cell_size.x, cell_size.y)

	_validate_shared_junctions(pattern, errors)
	if str(pattern.curve.get("type", "")) == "cubic_bezier_chain":
		_validate_bezier_continuity(pattern, errors)
	_validate_segments(pattern, design_size, min_cell, errors, warnings)
	_validate_pieces(pattern, design_size, cell_size, errors)

	return {
		"valid": errors.is_empty(),
		"errors": errors,
		"warnings": warnings,
	}


func _validate_shared_junctions(pattern: CutPatternAsset, errors: Array[String]) -> void:
	for row in range(pattern.rows + 1):
		for column in range(pattern.columns + 1):
			var expected := pattern.intersections[row * (pattern.columns + 1) + column]

			if column < pattern.columns:
				var h: PackedVector2Array = pattern.horizontal_segments[row * pattern.columns + column]
				if not h[0].is_equal_approx(expected):
					errors.append("Horizontal segment start misses intersection (%d,%d)." % [row, column])

			if column > 0:
				var h_left: PackedVector2Array = pattern.horizontal_segments[row * pattern.columns + column - 1]
				if not h_left[h_left.size() - 1].is_equal_approx(expected):
					errors.append("Horizontal segment end misses intersection (%d,%d)." % [row, column])

			if row < pattern.rows:
				var v: PackedVector2Array = pattern.vertical_segments[row * (pattern.columns + 1) + column]
				if not v[0].is_equal_approx(expected):
					errors.append("Vertical segment start misses intersection (%d,%d)." % [row, column])

			if row > 0:
				var v_up: PackedVector2Array = pattern.vertical_segments[(row - 1) * (pattern.columns + 1) + column]
				if not v_up[v_up.size() - 1].is_equal_approx(expected):
					errors.append("Vertical segment end misses intersection (%d,%d)." % [row, column])


func _validate_bezier_continuity(pattern: CutPatternAsset, errors: Array[String]) -> void:
	for boundary_row in range(1, pattern.rows):
		for column in range(pattern.columns):
			var segment: PackedVector2Array = pattern.horizontal_segments[
				boundary_row * pattern.columns + column
			]
			_validate_bezier_chain_tangents(
				segment,
				"H[%d][%d]" % [boundary_row, column],
				errors
			)

		for junction_column in range(1, pattern.columns):
			var left: PackedVector2Array = pattern.horizontal_segments[
				boundary_row * pattern.columns + junction_column - 1
			]
			var right: PackedVector2Array = pattern.horizontal_segments[
				boundary_row * pattern.columns + junction_column
			]
			_validate_shared_bezier_tangent(
				left,
				right,
				"Horizontal ribbon junction (%d,%d)" % [boundary_row, junction_column],
				errors
			)

	for boundary_column in range(1, pattern.columns):
		for row in range(pattern.rows):
			var segment: PackedVector2Array = pattern.vertical_segments[
				row * (pattern.columns + 1) + boundary_column
			]
			_validate_bezier_chain_tangents(
				segment,
				"V[%d][%d]" % [row, boundary_column],
				errors
			)

		for junction_row in range(1, pattern.rows):
			var above: PackedVector2Array = pattern.vertical_segments[
				(junction_row - 1) * (pattern.columns + 1) + boundary_column
			]
			var below: PackedVector2Array = pattern.vertical_segments[
				junction_row * (pattern.columns + 1) + boundary_column
			]
			_validate_shared_bezier_tangent(
				above,
				below,
				"Vertical ribbon junction (%d,%d)" % [junction_row, boundary_column],
				errors
			)


func _validate_bezier_chain_tangents(
	controls: PackedVector2Array,
	label: String,
	errors: Array[String]
) -> void:
	if controls.size() <= 4:
		return

	var join_index := 3
	while join_index + 1 < controls.size():
		var incoming := controls[join_index] - controls[join_index - 1]
		var outgoing := controls[join_index + 1] - controls[join_index]
		if not _tangents_match(incoming, outgoing):
			errors.append("%s has a tangent kink at Bézier join %d." % [label, join_index])
		join_index += 3


func _validate_shared_bezier_tangent(
	first: PackedVector2Array,
	second: PackedVector2Array,
	label: String,
	errors: Array[String]
) -> void:
	if first.size() < 4 or second.size() < 4:
		return

	var incoming := first[first.size() - 1] - first[first.size() - 2]
	var outgoing := second[1] - second[0]
	if not _tangents_match(incoming, outgoing):
		errors.append("%s is not tangent-continuous." % label)


func _tangents_match(incoming: Vector2, outgoing: Vector2) -> bool:
	if incoming.length() <= 0.000001 or outgoing.length() <= 0.000001:
		return false
	return incoming.normalized().dot(outgoing.normalized()) >= MIN_TANGENT_DOT


func _validate_segments(
	pattern: CutPatternAsset,
	design_size: Vector2,
	min_cell: float,
	errors: Array[String],
	warnings: Array[String]
) -> void:
	for boundary_row in range(pattern.rows + 1):
		for column in range(pattern.columns):
			var segment := pattern.render_horizontal_segment(boundary_row, column, design_size)
			_validate_single_segment(
				segment,
				boundary_row > 0 and boundary_row < pattern.rows,
				min_cell,
				"H[%d][%d]" % [boundary_row, column],
				errors,
				warnings
			)

	for row in range(pattern.rows):
		for boundary_column in range(pattern.columns + 1):
			var segment := pattern.render_vertical_segment(row, boundary_column, design_size)
			_validate_single_segment(
				segment,
				boundary_column > 0 and boundary_column < pattern.columns,
				min_cell,
				"V[%d][%d]" % [row, boundary_column],
				errors,
				warnings
			)


func _validate_single_segment(
	segment: PackedVector2Array,
	internal: bool,
	min_cell: float,
	label: String,
	errors: Array[String],
	warnings: Array[String]
) -> void:
	if _has_self_intersection(segment, false):
		errors.append("%s self-intersects." % label)

	if not internal:
		if _max_distance_from_chord(segment) > 0.0001:
			errors.append("%s is an outer edge but is not flat." % label)
		return

	var chord := segment[segment.size() - 1] - segment[0]
	var chord_length: float = chord.length()
	if chord_length <= 0.000001:
		errors.append("%s is degenerate." % label)
		return

	var peak_distance: float = _max_distance_from_chord(segment)
	var depth_ratio: float = peak_distance / min_cell
	if depth_ratio > MAX_DEPTH_RATIO:
		errors.append("%s knob depth %.3f exceeds %.3f." % [label, depth_ratio, MAX_DEPTH_RATIO])

	var active_range := _active_profile_range(segment, peak_distance)
	if active_range.x < MIN_PROFILE_WIDTH_RATIO:
		errors.append("%s neck/profile is too narrow (%.3f)." % [label, active_range.x])

	if active_range.y < MIN_CORNER_CLEARANCE_RATIO:
		warnings.append("%s profile starts close to a corner." % label)
	if active_range.z > 1.0 - MIN_CORNER_CLEARANCE_RATIO:
		warnings.append("%s profile ends close to a corner." % label)


func _validate_pieces(
	pattern: CutPatternAsset,
	design_size: Vector2,
	cell_size: Vector2,
	errors: Array[String]
) -> void:
	var nominal_area: float = cell_size.x * cell_size.y

	for row in range(pattern.rows):
		for column in range(pattern.columns):
			var outline := pattern.outline_for(row, column, design_size)
			if _has_self_intersection(outline, true):
				errors.append("Piece (%d,%d) self-intersects." % [row, column])
				continue

			var area: float = absf(_polygon_area(outline))
			if area < nominal_area * MIN_PIECE_AREA_RATIO:
				errors.append("Piece (%d,%d) is degenerate." % [row, column])


func _active_profile_range(segment: PackedVector2Array, peak_distance: float) -> Vector3:
	if peak_distance <= 0.000001:
		return Vector3(1.0, 0.0, 1.0)

	var start := segment[0]
	var chord := segment[segment.size() - 1] - start
	var length: float = chord.length()
	var tangent := chord / length
	var threshold: float = peak_distance * 0.20
	var first_ratio := 1.0
	var last_ratio := 0.0

	for point in segment:
		var along: float = clampf((point - start).dot(tangent) / length, 0.0, 1.0)
		var distance: float = absf(_signed_distance_to_chord(point, segment[0], segment[segment.size() - 1]))
		if distance >= threshold:
			first_ratio = minf(first_ratio, along)
			last_ratio = maxf(last_ratio, along)

	return Vector3(maxf(0.0, last_ratio - first_ratio), first_ratio, last_ratio)


func _max_distance_from_chord(segment: PackedVector2Array) -> float:
	if segment.size() < 2:
		return 0.0

	var start := segment[0]
	var finish := segment[segment.size() - 1]
	var max_distance := 0.0

	for point in segment:
		max_distance = maxf(max_distance, absf(_signed_distance_to_chord(point, start, finish)))

	return max_distance


func _signed_distance_to_chord(point: Vector2, start: Vector2, finish: Vector2) -> float:
	var chord := finish - start
	var length: float = chord.length()
	if length <= 0.000001:
		return 0.0
	return chord.cross(point - start) / length


func _polygon_area(points: PackedVector2Array) -> float:
	var area := 0.0
	for index in range(points.size()):
		var a := points[index]
		var b := points[(index + 1) % points.size()]
		area += a.x * b.y - b.x * a.y
	return area * 0.5


func _has_self_intersection(points: PackedVector2Array, closed: bool) -> bool:
	if points.size() < 4:
		return false

	var segment_count: int = points.size() if closed else points.size() - 1
	for first in range(segment_count):
		var a0 := points[first]
		var a1 := points[(first + 1) % points.size()]

		for second in range(first + 1, segment_count):
			if second == first + 1:
				continue
			if closed and first == 0 and second == segment_count - 1:
				continue

			var b0 := points[second]
			var b1 := points[(second + 1) % points.size()]
			if _segments_cross(a0, a1, b0, b1):
				return true

	return false


func _segments_cross(a: Vector2, b: Vector2, c: Vector2, d: Vector2) -> bool:
	const EPSILON := 0.0000001
	var o1: float = (b - a).cross(c - a)
	var o2: float = (b - a).cross(d - a)
	var o3: float = (d - c).cross(a - c)
	var o4: float = (d - c).cross(b - c)

	return (
		((o1 > EPSILON and o2 < -EPSILON) or (o1 < -EPSILON and o2 > EPSILON))
		and
		((o3 > EPSILON and o4 < -EPSILON) or (o3 < -EPSILON and o4 > EPSILON))
	)
