class_name RuntimeReshufflePolicy
extends RefCounted

var rng := RandomNumberGenerator.new()


func reshuffle_piece_positions(board) -> void:
	if board == null or board.pieces.is_empty():
		return

	var positions: Array[Vector2] = []
	for piece in board.pieces:
		positions.append(piece.position)

	# Runtime reshuffles should feel new every time. Keep the already validated
	# scatter slots/exclusion geometry from PuzzleBoard, but randomize which piece
	# starts in which slot instead of replaying the fixed regression seed mapping.
	rng.randomize()
	for index in range(positions.size() - 1, 0, -1):
		var swap_index := rng.randi_range(0, index)
		var tmp := positions[index]
		positions[index] = positions[swap_index]
		positions[swap_index] = tmp

	for index in range(board.pieces.size()):
		board.pieces[index].position = positions[index]
