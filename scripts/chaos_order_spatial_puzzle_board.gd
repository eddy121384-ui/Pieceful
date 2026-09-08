class_name ChaosOrderSpatialPuzzleBoard
extends "res://scripts/runtime_puzzle_board_multiselect.gd"

const SPATIAL_MIN_PIECES := 250
const PICK_CELL_SIZE := 72.0

var spatial_mode_active := false
var spatial_active_piece_index := -1
var pending_spatial_pick_index := -1
var spatial_pick_buckets: Dictionary = {}
var spatial_pick_index_dirty := true
var spatial_pick_rebuild_ms := 0


func start_new_game() -> void:
	super.start_new_game()
	_configure_spatial_runtime()


func spatial_mode_enabled() -> bool:
	return spatial_mode_active


func spatial_diagnostics() -> Dictionary:
	return {
		"enabled": spatial_mode_active,
		"piece_count": active_piece_count(),
		"pick_buckets": spatial_pick_buckets.size(),
		"pick_rebuild_ms": spatial_pick_rebuild_ms,
	}


func mark_spatial_index_dirty() -> void:
	if spatial_mode_active:
		spatial_pick_index_dirty = true


func spatial_piece_at_screen(screen_position: Vector2):
	if not spatial_mode_active:
		return null
	if spatial_pick_index_dirty:
		_rebuild_spatial_pick_index()

	var world_position: Vector2 = (
		get_viewport().get_canvas_transform().affine_inverse() * screen_position
	)
	var center_cell := Vector2i(
		floori(world_position.x / PICK_CELL_SIZE),
		floori(world_position.y / PICK_CELL_SIZE)
	)
	var candidate_indexes: Dictionary = {}
	for y_offset in range(-1, 2):
		for x_offset in range(-1, 2):
			var key := center_cell + Vector2i(x_offset, y_offset)
			var bucket = spatial_pick_buckets.get(key, [])
			if not (bucket is Array):
				continue
			for value in bucket:
				candidate_indexes[int(value)] = true

	var top_piece = null
	var top_z := -2147483648
	var top_order := -1
	for value in candidate_indexes.keys():
		var piece_index: int = int(value)
		if piece_index < 0 or piece_index >= pieces.size():
			continue
		var piece = pieces[piece_index]
		if (
			not is_instance_valid(piece)
			or bool(piece.solved)
			or not bool(piece.visible)
		):
			continue
		var local_point: Vector2 = piece.to_local(world_position)
		if not Geometry2D.is_point_in_polygon(local_point, piece.polygon_points):
			continue
		var candidate_z: int = int(piece.z_index)
		var candidate_order: int = int(piece.get_index())
		if (
			top_piece == null
			or candidate_z > top_z
			or (candidate_z == top_z and candidate_order > top_order)
		):
			top_piece = piece
			top_z = candidate_z
			top_order = candidate_order
	return top_piece


func can_begin_piece_drag(piece, pointer_screen_position: Vector2) -> bool:
	if not spatial_mode_active:
		return super.can_begin_piece_drag(piece, pointer_screen_position)
	if piece == null or bool(piece.solved) or not bool(piece.visible):
		return false
	var piece_index: int = int(piece.piece_index)
	if pending_spatial_pick_index == piece_index:
		return true
	return spatial_piece_at_screen(pointer_screen_position) == piece


func _unhandled_input(event: InputEvent) -> void:
	if not spatial_mode_active or spatial_active_piece_index >= 0:
		return
	if event is InputEventMouseButton:
		var mouse_button := event as InputEventMouseButton
		if mouse_button.button_index == MOUSE_BUTTON_LEFT and mouse_button.pressed:
			_try_begin_spatial_drag(-1, mouse_button.position)
	elif event is InputEventScreenTouch:
		var touch := event as InputEventScreenTouch
		if touch.pressed:
			_try_begin_spatial_drag(touch.index, touch.position)


func _try_begin_spatial_drag(pointer_id: int, screen_position: Vector2) -> void:
	var piece = spatial_piece_at_screen(screen_position)
	if piece == null or not is_instance_valid(piece):
		return

	var piece_index: int = int(piece.piece_index)
	pending_spatial_pick_index = piece_index
	spatial_active_piece_index = piece_index
	piece._begin_drag(pointer_id, screen_position)
	pending_spatial_pick_index = -1
	if not bool(piece.dragging):
		spatial_active_piece_index = -1
		return
	get_viewport().set_input_as_handled()


func _on_piece_picked(piece) -> void:
	super._on_piece_picked(piece)
	if spatial_mode_active:
		spatial_pick_index_dirty = true


func _on_piece_dragged(piece, delta: Vector2) -> void:
	super._on_piece_dragged(piece, delta)
	if spatial_mode_active:
		# Do not rebuild during motion. Any passive cluster members moved by the
		# inherited drag path merely invalidate the lookup for the next pointer-down.
		spatial_pick_index_dirty = true


func _on_piece_released(piece) -> void:
	super._on_piece_released(piece)
	if not spatial_mode_active:
		return
	spatial_active_piece_index = -1
	pending_spatial_pick_index = -1
	spatial_pick_index_dirty = true


func _reflow_existing_state(
	previous_board_rect: Rect2,
	previous_navigation_rect: Rect2
) -> void:
	super._reflow_existing_state(previous_board_rect, previous_navigation_rect)
	if spatial_mode_active:
		spatial_pick_index_dirty = true


func _configure_spatial_runtime() -> void:
	# Spatial picking is a density optimization, not a Hard-only gameplay rule.
	# Any 250+ runtime, including the experimental Stress 400 preset, should avoid
	# maintaining hundreds of PhysicsServer pick polygons.
	spatial_mode_active = active_piece_count() >= SPATIAL_MIN_PIECES
	spatial_active_piece_index = -1
	pending_spatial_pick_index = -1
	spatial_pick_buckets.clear()
	spatial_pick_index_dirty = true

	for piece_value in pieces:
		var piece = piece_value
		if not is_instance_valid(piece):
			continue
		var hit_area := piece.get_node_or_null("HitArea") as CollisionPolygon2D
		if spatial_mode_active:
			# Keep the proven native Polygon2D/Line2D visuals untouched. Only remove
			# PhysicsServer picking cost; pointer-down is resolved through buckets.
			if hit_area != null:
				hit_area.disabled = true
			piece.input_pickable = false
		else:
			if hit_area != null:
				hit_area.disabled = false
			piece.input_pickable = not bool(piece.solved) and bool(piece.visible)

	set_process_unhandled_input(spatial_mode_active)
	if spatial_mode_active:
		print(
			"Pieceful Main Table spatial picker · enabled · %d native visuals · physics picking disabled"
			% active_piece_count()
		)


func _rebuild_spatial_pick_index() -> void:
	var started_ms: int = Time.get_ticks_msec()
	spatial_pick_buckets.clear()
	for piece_value in pieces:
		var piece = piece_value
		if (
			not is_instance_valid(piece)
			or bool(piece.solved)
			or not bool(piece.visible)
			or int(piece.piece_index) == spatial_active_piece_index
		):
			continue
		var origin := Vector2(piece.position)
		var cell := Vector2i(
			floori(origin.x / PICK_CELL_SIZE),
			floori(origin.y / PICK_CELL_SIZE)
		)
		var bucket = spatial_pick_buckets.get(cell, [])
		if not (bucket is Array):
			bucket = []
		bucket.append(int(piece.piece_index))
		spatial_pick_buckets[cell] = bucket

	spatial_pick_index_dirty = false
	spatial_pick_rebuild_ms = Time.get_ticks_msec() - started_ms
	print(
		"Pieceful spatial pick index · %d buckets · %d ms"
		% [spatial_pick_buckets.size(), spatial_pick_rebuild_ms]
	)
