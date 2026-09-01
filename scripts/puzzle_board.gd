class_name PuzzleBoard
extends Node2D

signal progress_changed(solved_count: int, total_count: int)
signal completed

const PuzzleDefinitionScript = preload("res://scripts/puzzle_definition.gd")
const PuzzlePieceScript = preload("res://scripts/puzzle_piece.gd")
const DEMO_TEXTURE: Texture2D = preload("res://assets/demo_garden.svg")

var board_rect := Rect2(Vector2(340.0, 105.0), Vector2(600.0, 375.0))
var definition
var pieces: Array[Node] = []
var board_visuals: Array[Node] = []
var solved_count := 0
var z_counter := 10


func start_new_game() -> void:
	_clear_previous_game()
	solved_count = 0
	z_counter = 10

	definition = PuzzleDefinitionScript.new(
		DEMO_TEXTURE,
		4,
		3,
		board_rect,
		424242
	)

	_build_board_visuals()
	_build_pieces()
	progress_changed.emit(solved_count, definition.piece_count())


func _clear_previous_game() -> void:
	for piece in pieces:
		if is_instance_valid(piece):
			remove_child(piece)
			piece.queue_free()
	pieces.clear()

	for visual in board_visuals:
		if is_instance_valid(visual):
			remove_child(visual)
			visual.queue_free()
	board_visuals.clear()


func _build_board_visuals() -> void:
	var background := Polygon2D.new()
	background.name = "BoardBackground"
	background.polygon = PackedVector2Array([
		board_rect.position,
		board_rect.position + Vector2(board_rect.size.x, 0.0),
		board_rect.end,
		board_rect.position + Vector2(0.0, board_rect.size.y),
	])
	background.color = Color(0.11, 0.12, 0.135, 1.0)
	background.z_index = -2
	add_child(background)
	board_visuals.append(background)

	var preview := Sprite2D.new()
	preview.name = "SolvedPreview"
	preview.texture = DEMO_TEXTURE
	preview.position = board_rect.get_center()
	preview.scale = board_rect.size / DEMO_TEXTURE.get_size()
	preview.modulate = Color(1.0, 1.0, 1.0, 0.13)
	preview.z_index = -1
	add_child(preview)
	board_visuals.append(preview)

	var frame := Line2D.new()
	frame.name = "BoardFrame"
	frame.points = PackedVector2Array([
		board_rect.position,
		board_rect.position + Vector2(board_rect.size.x, 0.0),
		board_rect.end,
		board_rect.position + Vector2(0.0, board_rect.size.y),
		board_rect.position,
	])
	frame.width = 2.0
	frame.default_color = Color(1.0, 1.0, 1.0, 0.25)
	frame.antialiased = true
	frame.z_index = 0
	add_child(frame)
	board_visuals.append(frame)


func _build_pieces() -> void:
	var starts := _scatter_positions()

	for index in range(definition.piece_count()):
		var piece = PuzzlePieceScript.new()
		piece.name = "Piece_%02d" % index
		add_child(piece)
		piece.configure(
			index,
			DEMO_TEXTURE,
			definition.target_position_for(index),
			definition.piece_size,
			definition.source_origin_for(index),
			definition.source_cell_size,
			definition.outline_for(index),
			starts[index]
		)
		piece.z_index = z_counter + index
		piece.picked.connect(_on_piece_picked)
		piece.released.connect(_on_piece_released)
		pieces.append(piece)

	z_counter += definition.piece_count()


func _on_piece_picked(piece) -> void:
	z_counter += 1
	piece.z_index = z_counter


func _on_piece_released(piece) -> void:
	if piece.solved:
		return

	var snap_radius: float = minf(definition.piece_size.x, definition.piece_size.y) * 0.18
	if piece.position.distance_to(piece.target_position) <= snap_radius:
		piece.snap_to_target()
		solved_count += 1
		progress_changed.emit(solved_count, definition.piece_count())

		if solved_count == definition.piece_count():
			completed.emit()


func _scatter_positions() -> Array[Vector2]:
	var positions: Array[Vector2] = [
		Vector2(38.0, 90.0),
		Vector2(182.0, 70.0),
		Vector2(40.0, 250.0),
		Vector2(185.0, 255.0),
		Vector2(42.0, 438.0),
		Vector2(188.0, 465.0),
		Vector2(972.0, 88.0),
		Vector2(1110.0, 72.0),
		Vector2(974.0, 250.0),
		Vector2(1110.0, 260.0),
		Vector2(974.0, 438.0),
		Vector2(1106.0, 468.0),
	]

	var rng := RandomNumberGenerator.new()
	rng.seed = 20260831

	for index in range(positions.size()):
		positions[index] += Vector2(
			rng.randf_range(-10.0, 10.0),
			rng.randf_range(-10.0, 10.0)
		)

	positions.shuffle()
	return positions
