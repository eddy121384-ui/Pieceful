class_name BoardCutLinesOverlay
extends Node2D

const LINE_COLOR := Color(0.84, 0.86, 0.90, 0.15)
const LINE_WIDTH := 1.15

var segments: Array[PackedVector2Array] = []


func configure(board) -> void:
	segments.clear()
	if board == null or board.definition == null or board.definition.cut_pattern == null:
		queue_redraw()
		return

	position = board.board_rect.position
	z_index = -1
	var pattern = board.definition.cut_pattern
	var board_size: Vector2 = board.board_rect.size
	var rows: int = board.definition.rows
	var columns: int = board.definition.columns

	# Only draw internal shared boundaries. The existing BoardFrame already owns
	# the outer rectangle, so this reads as a subtle die-cut / pressed-board guide
	# rather than a doubled border.
	for boundary_row in range(1, rows):
		for column in range(columns):
			var horizontal: PackedVector2Array = pattern.render_horizontal_segment(
				boundary_row,
				column,
				board_size
			)
			if horizontal.size() >= 2:
				segments.append(horizontal)

	for row in range(rows):
		for boundary_column in range(1, columns):
			var vertical: PackedVector2Array = pattern.render_vertical_segment(
				row,
				boundary_column,
				board_size
			)
			if vertical.size() >= 2:
				segments.append(vertical)

	queue_redraw()


func _draw() -> void:
	for segment in segments:
		if segment.size() < 2:
			continue
		draw_polyline(segment, LINE_COLOR, LINE_WIDTH, true)
