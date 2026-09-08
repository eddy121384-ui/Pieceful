class_name ChaosOrderBatchedPuzzleBoard
extends "res://scripts/runtime_puzzle_board_multiselect.gd"

const BatchRendererScript = preload("res://scripts/chaos_order_batch_renderer.gd")

const BATCH_DIFFICULTY_ID := "hard"
const BATCH_MIN_PIECES := 250
const PICK_CELL_SIZE := 72.0

var batch_renderer: Node2D = null
var batch_mode_active := false
var batch_active_piece_index := -1
var pending_batch_pick_index := -1
var batch_pick_buckets: Dictionary = {}
var batch_pick_index_dirty := true
var batch_pick_rebuild_ms := 0


func start_new_game() -> void:
	super.start_new_game()
	_configure_batch_runtime()


func batch_mode_enabled() -> bool:
	return batch_mode_active


func batch_diagnostics() -> Dictionary:
	var drawn := 0
	if batch_renderer != null and is_instance_valid(batch_renderer):
		drawn = int(batch_renderer.get("last_drawn_count"))
	return {
		"enabled": batch_mode_active,
		"piece_count": active_piece_count(),
		"drawn_passive": drawn,
		"pick_buckets": batch_pick_buckets.size(),
		"pick_rebuild_ms": batch_pick_rebuild_ms,
	}


func should_batch_draw_piece(piece) -> bool:
	if not batch_mode_active:
		return false
	if piece == null or not is_instance_valid(piece):
		return false
	if bool(piece.solved) or not bool(piece.visible):
		return false
	return int(piece.piece_index) != batch_active_piece_index


func sync_batched_passive_state() -> void:
	if not batch_mode_active:
		return
	for piece_value in pieces:
		var piece = piece_value
		if not is_instance_valid(piece):
			continue
		var piece_index: int = int(piece.piece_index)
		if bool(piece.solved):
			_set_piece_native_passive(piece, false)
		elif piece_index == batch_active_piece_index:
			_set_piece_native_passive(piece, false)
		else:
			_set_piece_native_passive(piece, true)
	request_batched_redraw(true)


func request_batched_redraw(spatial_dirty: bool = true) -> void:
	if not batch_mode_active:
		return
	if spatial_dirty:
		batch_pick_index_dirty = true
	if batch_renderer != null and is_instance_valid(batch_renderer):
		batch_renderer.call("request_refresh")


func batched_piece_at_screen(screen_position: Vector2):
	if not batch_mode_active:
		return null
	if batch_pick_index_dirty:
		_rebuild_batch_pick_index()

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
			var bucket = batch_pick_buckets.get(key, [])
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
	if not batch_mode_active:
		return super.can_begin_piece_drag(piece, pointer_screen_position)
	if piece == null or bool(piece.solved) or not bool(piece.visible):
		return false
	var piece_index: int = int(piece.piece_index)
	if pending_batch_pick_index == piece_index:
		return true
	return batched_piece_at_screen(pointer_screen_position) == piece


func _unhandled_input(event: InputEvent) -> void:
	if not batch_mode_active or batch_active_piece_index >= 0:
		return
	if event is InputEventMouseButton:
		var mouse_button := event as InputEventMouseButton
		if mouse_button.button_index == MOUSE_BUTTON_LEFT and mouse_button.pressed:
			_try_begin_batched_drag(-1, mouse_button.position)
	elif event is InputEventScreenTouch:
		var touch := event as InputEventScreenTouch
		if touch.pressed:
			_try_begin_batched_drag(touch.index, touch.position)


func _try_begin_batched_drag(pointer_id: int, screen_position: Vector2) -> void:
	var piece = batched_piece_at_screen(screen_position)
	if piece == null or not is_instance_valid(piece):
		return

	var piece_index: int = int(piece.piece_index)
	pending_batch_pick_index = piece_index
	batch_active_piece_index = piece_index
	_set_piece_native_passive(piece, false)
	piece.input_pickable = true
	request_batched_redraw(false)

	piece._begin_drag(pointer_id, screen_position)
	pending_batch_pick_index = -1
	if not bool(piece.dragging):
		batch_active_piece_index = -1
		_set_piece_native_passive(piece, true)
		request_batched_redraw(true)
		return
	get_viewport().set_input_as_handled()


func _on_piece_picked(piece) -> void:
	super._on_piece_picked(piece)
	if batch_mode_active:
		request_batched_redraw(false)


func _on_piece_dragged(piece, delta: Vector2) -> void:
	super._on_piece_dragged(piece, delta)
	if batch_mode_active:
		request_batched_redraw(true)


func _on_piece_released(piece) -> void:
	super._on_piece_released(piece)
	if not batch_mode_active:
		return
	batch_active_piece_index = -1
	pending_batch_pick_index = -1
	if is_instance_valid(piece) and not bool(piece.solved):
		_set_piece_native_passive(piece, true)
	request_batched_redraw(true)


func _solve_cluster(cluster_id: int) -> void:
	if batch_mode_active:
		for member_value in _cluster_members_for(cluster_id):
			var member_index: int = int(member_value)
			if member_index < 0 or member_index >= pieces.size():
				continue
			var member = pieces[member_index]
			if is_instance_valid(member) and not bool(member.solved):
				_set_piece_native_passive(member, false)
	super._solve_cluster(cluster_id)
	if batch_mode_active:
		request_batched_redraw(true)


func _reflow_existing_state(
	previous_board_rect: Rect2,
	previous_navigation_rect: Rect2
) -> void:
	super._reflow_existing_state(previous_board_rect, previous_navigation_rect)
	if batch_mode_active:
		sync_batched_passive_state()


func _configure_batch_runtime() -> void:
	_ensure_batch_renderer()
	batch_mode_active = (
		active_difficulty_id() == BATCH_DIFFICULTY_ID
		and active_piece_count() >= BATCH_MIN_PIECES
	)
	batch_active_piece_index = -1
	pending_batch_pick_index = -1
	batch_pick_buckets.clear()
	batch_pick_index_dirty = true

	if batch_renderer != null:
		batch_renderer.visible = batch_mode_active
	if batch_mode_active:
		sync_batched_passive_state()
		print(
			"Pieceful Main Table batch renderer · enabled · %d passive-capable pieces"
			% active_piece_count()
		)
	else:
		for piece_value in pieces:
			var piece = piece_value
			if is_instance_valid(piece):
				_set_piece_native_passive(piece, false)

	set_process_unhandled_input(batch_mode_active)


func _ensure_batch_renderer() -> void:
	if batch_renderer != null and is_instance_valid(batch_renderer):
		batch_renderer.call("configure", self)
		return
	batch_renderer = BatchRendererScript.new()
	batch_renderer.name = "ChaosOrderBatchRenderer"
	add_child(batch_renderer)
	batch_renderer.call("configure", self)


func _set_piece_native_passive(piece, passive: bool) -> void:
	if piece == null or not is_instance_valid(piece):
		return
	var shadow := piece.get_node_or_null("Shadow") as CanvasItem
	var face := piece.get_node_or_null("Face") as CanvasItem
	var outline := piece.get_node_or_null("Outline") as CanvasItem
	if shadow != null:
		shadow.visible = not passive and not bool(piece.solved)
	if face != null:
		face.visible = not passive
	if outline != null:
		outline.visible = not passive

	var hit_area := piece.get_node_or_null("HitArea") as CollisionPolygon2D
	if hit_area != null:
		hit_area.disabled = passive

	if passive:
		piece.input_pickable = false
	else:
		piece.input_pickable = not bool(piece.solved) and bool(piece.visible)


func _rebuild_batch_pick_index() -> void:
	var started_ms: int = Time.get_ticks_msec()
	batch_pick_buckets.clear()
	for piece_value in pieces:
		var piece = piece_value
		if (
			not is_instance_valid(piece)
			or bool(piece.solved)
			or not bool(piece.visible)
			or int(piece.piece_index) == batch_active_piece_index
		):
			continue
		var origin := Vector2(piece.position)
		var cell := Vector2i(
			floori(origin.x / PICK_CELL_SIZE),
			floori(origin.y / PICK_CELL_SIZE)
		)
		var bucket = batch_pick_buckets.get(cell, [])
		if not (bucket is Array):
			bucket = []
		bucket.append(int(piece.piece_index))
		batch_pick_buckets[cell] = bucket

	batch_pick_index_dirty = false
	batch_pick_rebuild_ms = Time.get_ticks_msec() - started_ms
	print(
		"Pieceful batch pick index · %d buckets · %d ms"
		% [batch_pick_buckets.size(), batch_pick_rebuild_ms]
	)
