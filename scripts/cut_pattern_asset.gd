class_name CutPatternAsset
extends RefCounted

var pattern_id: String = ""
var version: int = 0
var columns: int = 0
var rows: int = 0
var aspect_ratio: float = 1.0
var aspect_ratio_class: String = "custom"
var style: String = ""
var curve: Dictionary = {}
var authoring: Dictionary = {}
var validation_metadata: Dictionary = {}

var intersections: PackedVector2Array = PackedVector2Array()
var horizontal_segments: Array = []
var vertical_segments: Array = []

# A physical cut edge is shared by two neighboring pieces, but piece outline
# assembly historically sampled that same cubic ribbon independently for each
# side. Keep one transient render cache per CutPattern instance and board size so
# every unique horizontal / vertical boundary is sampled at most once per game.
# This avoids a heavy cross-difficulty asset cache while removing duplicated
# curve work during 150 / 286-piece construction.
var _render_cache_board_size := Vector2.ZERO
var _horizontal_render_cache: Dictionary = {}
var _vertical_render_cache: Dictionary = {}
var _render_cache_hits := 0
var _render_cache_misses := 0


static func load_json(path: String) -> CutPatternAsset:
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		push_error("CutPatternAsset: failed to open %s" % path)
		return null

	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		push_error("CutPatternAsset: invalid JSON root in %s" % path)
		return null

	return from_dict(parsed)


static func from_dict(data: Dictionary) -> CutPatternAsset:
	var asset := CutPatternAsset.new()
	asset.pattern_id = str(data.get("pattern_id", ""))
	asset.version = int(data.get("version", 0))
	asset.columns = int(data.get("columns", 0))
	asset.rows = int(data.get("rows", 0))
	asset.aspect_ratio = float(data.get("aspect_ratio", 1.0))
	asset.aspect_ratio_class = str(data.get("aspect_ratio_class", "custom"))
	asset.style = str(data.get("style", ""))
	asset.curve = data.get("curve", {}).duplicate(true)
	asset.authoring = data.get("authoring", {}).duplicate(true)
	asset.validation_metadata = data.get("validation_metadata", {}).duplicate(true)
	asset.intersections = _decode_points(data.get("intersections", []))
	asset.horizontal_segments = _decode_segments(data.get("horizontal_segments", []))
	asset.vertical_segments = _decode_segments(data.get("vertical_segments", []))

	if not asset.is_structurally_valid():
		push_error("CutPatternAsset: malformed pattern %s" % asset.pattern_id)
		return null

	return asset


func is_structurally_valid() -> bool:
	if pattern_id.is_empty() or version <= 0:
		return false
	if columns <= 0 or rows <= 0:
		return false
	if style != "classic_ribbon":
		return false

	var curve_type := str(curve.get("type", ""))
	if curve_type != "catmull_rom" and curve_type != "cubic_bezier_chain":
		return false
	if int(curve.get("version", 0)) != 1:
		return false
	if int(curve.get("samples_per_span", 0)) < 1:
		return false
	if horizontal_segments.size() != (rows + 1) * columns:
		return false
	if vertical_segments.size() != rows * (columns + 1):
		return false
	if intersections.size() != (rows + 1) * (columns + 1):
		return false

	for segment in horizontal_segments:
		if not _segment_structure_is_valid(segment, curve_type):
			return false
	for segment in vertical_segments:
		if not _segment_structure_is_valid(segment, curve_type):
			return false

	return true


func piece_count() -> int:
	return columns * rows


func render_cache_diagnostics() -> Dictionary:
	return {
		"hits": _render_cache_hits,
		"misses": _render_cache_misses,
		"horizontal_cached": _horizontal_render_cache.size(),
		"vertical_cached": _vertical_render_cache.size(),
	}


func outline_for(row: int, column: int, board_size: Vector2) -> PackedVector2Array:
	var outline := PackedVector2Array()
	var nominal_origin := Vector2(
		float(column) * board_size.x / float(columns),
		float(row) * board_size.y / float(rows)
	)

	_append_segment(outline, render_horizontal_segment(row, column, board_size), false, nominal_origin)
	_append_segment(outline, render_vertical_segment(row, column + 1, board_size), false, nominal_origin)
	_append_segment(outline, render_horizontal_segment(row + 1, column, board_size), true, nominal_origin)
	_append_segment(outline, render_vertical_segment(row, column, board_size), true, nominal_origin)

	return outline


func render_horizontal_segment(
	boundary_row: int,
	column: int,
	board_size: Vector2
) -> PackedVector2Array:
	_ensure_render_cache_for(board_size)
	var segment_index := boundary_row * columns + column
	if _horizontal_render_cache.has(segment_index):
		_render_cache_hits += 1
		return _horizontal_render_cache[segment_index]

	var rendered := _render_segment(horizontal_segments[segment_index], board_size)
	_horizontal_render_cache[segment_index] = rendered
	_render_cache_misses += 1
	return rendered


func render_vertical_segment(
	row: int,
	boundary_column: int,
	board_size: Vector2
) -> PackedVector2Array:
	_ensure_render_cache_for(board_size)
	var segment_index := row * (columns + 1) + boundary_column
	if _vertical_render_cache.has(segment_index):
		_render_cache_hits += 1
		return _vertical_render_cache[segment_index]

	var rendered := _render_segment(vertical_segments[segment_index], board_size)
	_vertical_render_cache[segment_index] = rendered
	_render_cache_misses += 1
	return rendered


func _ensure_render_cache_for(board_size: Vector2) -> void:
	if _render_cache_board_size.is_equal_approx(board_size):
		return

	_render_cache_board_size = board_size
	_horizontal_render_cache.clear()
	_vertical_render_cache.clear()
	_render_cache_hits = 0
	_render_cache_misses = 0


func _render_segment(
	control_points: PackedVector2Array,
	board_size: Vector2
) -> PackedVector2Array:
	var scaled := PackedVector2Array()
	for point in control_points:
		scaled.append(Vector2(point.x * board_size.x, point.y * board_size.y))

	if scaled.size() <= 2:
		return scaled

	var samples_per_span := int(curve.get("samples_per_span", 4))
	var curve_type := str(curve.get("type", "catmull_rom"))
	if curve_type == "cubic_bezier_chain":
		return _sample_cubic_bezier_chain(scaled, samples_per_span)

	return _sample_catmull_rom(scaled, samples_per_span)


func _sample_cubic_bezier_chain(
	controls: PackedVector2Array,
	samples_per_span: int
) -> PackedVector2Array:
	var result := PackedVector2Array([controls[0]])
	var index := 0

	while index + 3 < controls.size():
		var p0 := controls[index]
		var p1 := controls[index + 1]
		var p2 := controls[index + 2]
		var p3 := controls[index + 3]

		for sample in range(1, samples_per_span + 1):
			var t: float = float(sample) / float(samples_per_span)
			var one_minus_t: float = 1.0 - t
			result.append(
				one_minus_t * one_minus_t * one_minus_t * p0
				+ 3.0 * one_minus_t * one_minus_t * t * p1
				+ 3.0 * one_minus_t * t * t * p2
				+ t * t * t * p3
			)

		index += 3

	return result


func _sample_catmull_rom(
	anchors: PackedVector2Array,
	samples_per_span: int
) -> PackedVector2Array:
	var result := PackedVector2Array([anchors[0]])
	var padded := PackedVector2Array()
	padded.append(anchors[0])
	padded.append_array(anchors)
	padded.append(anchors[anchors.size() - 1])

	for index in range(1, padded.size() - 2):
		var p0 := padded[index - 1]
		var p1 := padded[index]
		var p2 := padded[index + 1]
		var p3 := padded[index + 2]

		for sample in range(1, samples_per_span + 1):
			var t: float = float(sample) / float(samples_per_span)
			var t2: float = t * t
			var t3: float = t2 * t
			result.append(
				0.5 * (
					2.0 * p1
					+ (-p0 + p2) * t
					+ (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t2
					+ (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t3
				)
			)

	return result


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


static func _segment_structure_is_valid(
	segment: PackedVector2Array,
	curve_type: String
) -> bool:
	if segment.size() < 2:
		return false
	if curve_type == "cubic_bezier_chain" and segment.size() > 2:
		return segment.size() >= 4 and (segment.size() - 1) % 3 == 0
	return true


static func _decode_segments(raw_segments: Array) -> Array:
	var result: Array = []
	for raw_segment in raw_segments:
		if typeof(raw_segment) != TYPE_ARRAY:
			continue
		result.append(_decode_points(raw_segment))
	return result


static func _decode_points(raw_points: Array) -> PackedVector2Array:
	var result := PackedVector2Array()
	for raw_point in raw_points:
		if typeof(raw_point) != TYPE_ARRAY or raw_point.size() != 2:
			continue
		result.append(Vector2(float(raw_point[0]), float(raw_point[1])))
	return result
