class_name ChaosOrderBatchRenderer
extends Node2D

var board: Node = null
var last_drawn_count := 0


func configure(p_board: Node) -> void:
	board = p_board
	z_index = 0
	queue_redraw()


func request_refresh() -> void:
	queue_redraw()


func _draw() -> void:
	last_drawn_count = 0
	if board == null or not is_instance_valid(board):
		return
	if not board.has_method("batch_mode_enabled") or not board.batch_mode_enabled():
		return

	var face_color := PackedColorArray([Color.WHITE])
	for piece_value in board.pieces:
		var piece = piece_value
		if not is_instance_valid(piece):
			continue
		if (
			board.has_method("should_batch_draw_piece")
			and not board.should_batch_draw_piece(piece)
		):
			continue

		draw_set_transform(
			Vector2(piece.position),
			float(piece.rotation),
			Vector2(piece.scale)
		)
		draw_polygon(
			piece.polygon_points,
			face_color,
			piece.uv_points,
			piece.source_texture
		)

		# Preserve multi-select feedback without paying the per-piece Line2D cost.
		# The existing selection layer changes the hidden Outline node's width/color;
		# only selected passive pieces get an extra batched polyline command.
		var outline := piece.get_node_or_null("Outline") as Line2D
		if outline != null and outline.width > 2.0 and not outline.points.is_empty():
			draw_polyline(
				outline.points,
				outline.default_color,
				outline.width,
				true
			)
		last_drawn_count += 1

	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
