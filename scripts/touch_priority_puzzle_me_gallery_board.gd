class_name TouchPriorityPuzzleMeGalleryBoard
extends "res://scripts/puzzle_me_gallery_board.gd"

const TOUCH_PICK_PADDING_SCREEN_PX := 28.0

var pending_touch_pick_index := -1


func try_begin_touch_piece_drag(pointer_id: int, screen_position: Vector2) -> bool:
	if pointer_id < 0:
		return false
	if active_drag_piece != null and is_instance_valid(active_drag_piece):
		return false

	var piece = _touch_piece_candidate_at_screen(screen_position)
	if piece == null or not is_instance_valid(piece):
		return false

	pending_touch_pick_index = int(piece.piece_index)
	piece._begin_drag(pointer_id, screen_position)
	pending_touch_pick_index = -1
	return bool(piece.dragging)


func can_begin_piece_drag(piece, pointer_screen_position: Vector2) -> bool:
	if (
		piece != null
		and int(piece.piece_index) == pending_touch_pick_index
		and not bool(piece.solved)
		and bool(piece.visible)
	):
		return true
	return super.can_begin_piece_drag(piece, pointer_screen_position)


func _touch_piece_candidate_at_screen(screen_position: Vector2):
	var pointer_world: Vector2 = (
		get_viewport().get_canvas_transform().affine_inverse() * screen_position
	)
	var padding_world := TOUCH_PICK_PADDING_SCREEN_PX / maxf(_runtime_zoom_scale(), 0.01)
	var exact_candidate = null
	var padded_candidate = null

	for piece_value in pieces:
		var piece = piece_value
		if (
			not is_instance_valid(piece)
			or bool(piece.solved)
			or not bool(piece.visible)
			or piece.polygon_points.is_empty()
		):
			continue

		var local_point: Vector2 = piece.to_local(pointer_world)
		if Geometry2D.is_point_in_polygon(local_point, piece.polygon_points):
			if _touch_candidate_is_above(piece, exact_candidate):
				exact_candidate = piece
			continue

		var bounds := Rect2(piece.polygon_points[0], Vector2.ZERO)
		for point in piece.polygon_points:
			bounds = bounds.expand(point)
		if bounds.grow(padding_world).has_point(local_point):
			if _touch_candidate_is_above(piece, padded_candidate):
				padded_candidate = piece

	return exact_candidate if exact_candidate != null else padded_candidate


func _touch_candidate_is_above(candidate, current) -> bool:
	if current == null:
		return true
	var candidate_z := int(candidate.z_index)
	var current_z := int(current.z_index)
	if candidate_z != current_z:
		return candidate_z > current_z
	return int(candidate.get_index()) > int(current.get_index())
