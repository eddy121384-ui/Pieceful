class_name PuzzleDefinition
extends RefCounted

const CutPatternGeneratorScript = preload("res://scripts/cut_pattern_generator.gd")

var texture: Texture2D
var columns: int
var rows: int
var board_rect: Rect2
var piece_size: Vector2
var source_cell_size: Vector2
var cut_pattern


func _init(
	p_texture: Texture2D,
	p_columns: int,
	p_rows: int,
	p_board_rect: Rect2,
	p_seed: int = 424242
) -> void:
	texture = p_texture
	columns = p_columns
	rows = p_rows
	board_rect = p_board_rect
	piece_size = board_rect.size / Vector2(float(columns), float(rows))
	source_cell_size = texture.get_size() / Vector2(float(columns), float(rows))
	cut_pattern = CutPatternGeneratorScript.new(
		columns,
		rows,
		board_rect.size,
		p_seed
	)


func piece_count() -> int:
	return columns * rows


func row_for(index: int) -> int:
	return index / columns


func column_for(index: int) -> int:
	return index % columns


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
	return cut_pattern.outline_for(row_for(index), column_for(index))
