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
	if str(curve.get("type", "")) != "catmull_rom":
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
		if segment.size() < 2:
			return false
	for segment in vertical_segments:
		if segment.size() < 2:
			return false

	return true


func piece_count() -> int:
	return columns * rows


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
	return _render_segment(
		horizontal_segments[boundary_row * columns + column],
		board_size
	)


func render_vertical_segment(
	row: int,
	boundary_column: int,
	board_size: Vector2
) -> PackedVector2Array:
	return _render_segment(
		vertical_segments[row * (columns + 1) + boundary_column],
		board_size
	)


func _render_segment(
	control_points: PackedVector2Array,
	board_size: Vector2
) -> PackedVector2Array:
	var scaled := PackedVector2Array()
	for point in control_points:
		scaled.append(Vector2(point.x * board_size.x, point.y * board_size.y))

	if scaled.size() <= 2:
		return scaled

	return _sample_catmull_rom(
		scaled,
		int(curve.get("samples_per_span", 4))
	)


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
