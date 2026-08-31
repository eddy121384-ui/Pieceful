class_name PuzzleDefinition
extends RefCounted

var texture: Texture2D
var columns: int
var rows: int
var board_rect: Rect2
var piece_size: Vector2
var source_cell_size: Vector2
var edges: Array[Dictionary] = []


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
	_build_edges(p_seed)


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


func edges_for(index: int) -> Dictionary:
	return edges[index]


func _build_edges(seed_value: int) -> void:
	edges.clear()
	for _index in range(piece_count()):
		edges.append({
			"top": 0,
			"right": 0,
			"bottom": 0,
			"left": 0,
		})

	var rng := RandomNumberGenerator.new()
	rng.seed = seed_value

	for row in range(rows):
		for column in range(columns):
			var index := row * columns + column

			if column < columns - 1:
				var horizontal_sign := 1 if rng.randi_range(0, 1) == 0 else -1
				edges[index]["right"] = horizontal_sign
				edges[index + 1]["left"] = -horizontal_sign

			if row < rows - 1:
				var vertical_sign := 1 if rng.randi_range(0, 1) == 0 else -1
				edges[index]["bottom"] = vertical_sign
				edges[index + columns]["top"] = -vertical_sign
