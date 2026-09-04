class_name PuzzleDefinition
extends RefCounted

const CutPatternAssetScript = preload("res://scripts/cut_pattern_asset.gd")

var texture: Texture2D
var columns: int
var rows: int
var board_rect: Rect2
var piece_size: Vector2
var source_cell_size: Vector2
var cut_pattern: CutPatternAsset
var cut_pattern_load_ms := 0
var outline_build_ms_total := 0


func _init(
	p_texture: Texture2D,
	p_board_rect: Rect2,
	p_cut_pattern_path: String
) -> void:
	texture = p_texture
	board_rect = p_board_rect
	var load_started := Time.get_ticks_msec()
	cut_pattern = CutPatternAssetScript.load_json(p_cut_pattern_path)
	cut_pattern_load_ms = int(Time.get_ticks_msec() - load_started)
	assert(cut_pattern != null, "Failed to load CutPattern: %s" % p_cut_pattern_path)

	columns = cut_pattern.columns
	rows = cut_pattern.rows
	piece_size = board_rect.size / Vector2(float(columns), float(rows))
	source_cell_size = texture.get_size() / Vector2(float(columns), float(rows))


func piece_count() -> int:
	return columns * rows


func row_for(index: int) -> int:
	return index / columns


func column_for(index: int) -> int:
	return index % columns


func neighbor_indexes_for(index: int) -> Array[int]:
	var result: Array[int] = []
	var row := row_for(index)
	var column := column_for(index)

	if column > 0:
		result.append(index - 1)
	if column < columns - 1:
		result.append(index + 1)
	if row > 0:
		result.append(index - columns)
	if row < rows - 1:
		result.append(index + columns)

	return result


func target_position_for(index: int) -> Vector2:
	return board_rect.position + Vector2(
		float(column_for(index)) * piece_size.x,
		float(row_for(index)) * piece_size.y
	)


func source_origin_for(index: int) -> Vector2:
	return Vector2(
		float(column_for(index)) * source_cell_size.x,
		float(row_for(index)) * source_cell_size.y
	)


func outline_for(index: int) -> PackedVector2Array:
	var started := Time.get_ticks_msec()
	var outline := cut_pattern.outline_for(
		row_for(index),
		column_for(index),
		board_rect.size
	)
	outline_build_ms_total += int(Time.get_ticks_msec() - started)
	return outline
