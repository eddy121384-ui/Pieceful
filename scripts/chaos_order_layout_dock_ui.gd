extends "res://scripts/loose_piece_layout_dock_ui.gd"

const OptimizedRailCanvasScript = preload("res://scripts/chaos_order_optimized_rail_canvas.gd")

const DENSE_LAYOUT_THRESHOLD := 120
const DENSE_TRANSITION_SAMPLE_COUNT := 18
const DENSE_TRANSITION_DURATION := 0.30
const DENSE_TRANSITION_STAGGER := 0.010
const DENSE_TRANSITION_STAGGER_CAP := 0.07
const DENSE_RAIL_START_ALPHA := 0.16

var dense_scatter_cache: Array = []
var dense_scatter_cache_definition_id := -1
var dense_scatter_cache_navigation_rect := Rect2()


func _install_scrollable_rail_canvas() -> void:
	if rail_canvas == null:
		return
	var rail_box: Node = rail_canvas.get_parent() as Node
	if rail_box == null:
		return
	var old_index: int = int(rail_canvas.get_index())
	var old_canvas: Node = rail_canvas as Node
	if old_canvas == null:
		return
	rail_box.remove_child(old_canvas)
	old_canvas.queue_free()

	rail_scroll = ScrollContainer.new()
	rail_scroll.name = "LoosePieceRailScroll"
	rail_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	rail_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	rail_scroll.mouse_filter = Control.MOUSE_FILTER_STOP
	rail_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	rail_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	rail_box.add_child(rail_scroll)
	rail_box.move_child(rail_scroll, old_index)

	rail_canvas = OptimizedRailCanvasScript.new()
	rail_canvas.name = "LoosePieceRailCanvas"
	rail_canvas.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	rail_canvas.size_flags_vertical = Control.SIZE_EXPAND_FILL
	rail_canvas.group_dragged_out.connect(_on_rail_group_dragged_out)
	rail_scroll.add_child(rail_canvas)


func _set_loose_layout_mode(mode: String) -> void:
	if not _dense_runtime_active():
		super._set_loose_layout_mode(mode)
		return
	if mode != LAYOUT_SCATTER and mode != LAYOUT_RAIL:
		return
	if layout_transition_active:
		_refresh_layout_mode_controls()
		return
	if mode == loose_layout_mode:
		_refresh_layout_mode_controls()
		return

	var started_ms: int = Time.get_ticks_msec()
	var loose_count: int = _dense_loose_member_count()
	var transition_sources: Array = _sample_dense_transition_sources(
		_capture_layout_transition_sources()
	)

	layout_transition_active = true
	layout_transition_target_mode = mode
	if layout_mode_button != null:
		layout_mode_button.disabled = true

	_exit_selection_mode()
	loose_layout_mode = mode

	# Dense mode still uses the optimized canonical switch, but no longer throws
	# away the motion cue entirely. Instead of creating a ghost for all 286 loose
	# groups, keep only a small representative sample. Eighteen lightweight face
	# ghosts are enough for the eye to read "pieces flowing into/out of the Rail"
	# while avoiding hundreds of Polygon2D/Line2D nodes and ~800 tweens.
	if loose_layout_mode == LAYOUT_RAIL:
		_capture_all_loose_groups_to_rail()
	else:
		_restore_dense_loose_groups_to_scatter()

	_refresh_layout_mode_controls()
	_refresh_ui()
	_layout_ui()

	if transition_sources.is_empty():
		_finish_layout_transition()
	else:
		_play_dense_sample_transition(transition_sources, mode)

	var elapsed_ms: int = Time.get_ticks_msec() - started_ms
	print(
		"Pieceful dense layout switch · %d loose · %s · %d ms · %d motion samples"
		% [loose_count, loose_layout_mode, elapsed_ms, transition_sources.size()]
	)


func _dense_runtime_active() -> bool:
	return (
		board != null
		and board.active_piece_count() >= DENSE_LAYOUT_THRESHOLD
	)


func _dense_loose_member_count() -> int:
	if board == null:
		return 0
	var count := 0
	for piece_value in board.pieces:
		var piece = piece_value
		if not is_instance_valid(piece) or bool(piece.solved):
			continue
		var piece_index: int = int(piece.piece_index)
		if state.location_for(piece_index) == "loose":
			count += 1
	return count


func _sample_dense_transition_sources(sources: Array) -> Array:
	if sources.size() <= DENSE_TRANSITION_SAMPLE_COUNT:
		return sources.duplicate()

	var result: Array = []
	var step: float = float(sources.size()) / float(DENSE_TRANSITION_SAMPLE_COUNT)
	for sample_index in range(DENSE_TRANSITION_SAMPLE_COUNT):
		var source_index: int = mini(
			sources.size() - 1,
			floori((float(sample_index) + 0.5) * step)
		)
		result.append(sources[source_index])
	return result


func _play_dense_sample_transition(sources: Array, mode: String) -> void:
	_ensure_layout_transition_root()
	_clear_layout_transition_ghosts()
	if layout_transition_root == null:
		_finish_layout_transition()
		return

	if rail_panel != null:
		rail_panel.visible = true
		rail_panel.modulate = Color.WHITE
	if rail_canvas != null:
		rail_canvas.modulate = (
			Color(1.0, 1.0, 1.0, DENSE_RAIL_START_ALPHA)
			if mode == LAYOUT_RAIL
			else Color.WHITE
		)

	var tween: Tween = create_tween()
	tween.set_parallel(true)
	var ghost_count := 0

	for ordinal in range(sources.size()):
		var source_value = sources[ordinal]
		if not (source_value is Dictionary):
			continue
		var source: Dictionary = source_value
		var anchor_index: int = int(source.get("anchor", -1))
		if anchor_index < 0 or board == null or anchor_index >= board.pieces.size():
			continue

		var ghost: Node2D = _create_dense_sample_ghost(source)
		if ghost == null:
			continue

		var target_position: Vector2
		var target_scale: float
		if mode == LAYOUT_RAIL:
			target_position = _rail_piece_origin_in_ui_canvas(anchor_index, true)
			target_scale = _rail_piece_scale_in_ui_canvas()
		else:
			target_position = _world_piece_origin_in_ui_canvas(anchor_index)
			target_scale = _world_piece_scale_in_ui_canvas(anchor_index)

		var delay: float = minf(
			float(ordinal) * DENSE_TRANSITION_STAGGER,
			DENSE_TRANSITION_STAGGER_CAP
		)
		var position_tweener: PropertyTweener = tween.tween_property(
			ghost,
			"position",
			target_position,
			DENSE_TRANSITION_DURATION
		)
		position_tweener.set_delay(delay)
		position_tweener.set_trans(Tween.TRANS_QUINT)
		position_tweener.set_ease(Tween.EASE_IN_OUT)

		var scale_tweener: PropertyTweener = tween.tween_property(
			ghost,
			"scale",
			Vector2(target_scale, target_scale),
			DENSE_TRANSITION_DURATION
		)
		scale_tweener.set_delay(delay)
		scale_tweener.set_trans(Tween.TRANS_QUINT)
		scale_tweener.set_ease(Tween.EASE_IN_OUT)
		ghost_count += 1

	if ghost_count <= 0:
		tween.kill()
		_finish_layout_transition()
		return

	if mode == LAYOUT_RAIL and rail_canvas != null:
		var canvas_fade: PropertyTweener = tween.tween_property(
			rail_canvas,
			"modulate",
			Color.WHITE,
			DENSE_TRANSITION_DURATION
		)
		canvas_fade.set_trans(Tween.TRANS_QUAD)
		canvas_fade.set_ease(Tween.EASE_OUT)
	elif mode == LAYOUT_SCATTER and rail_panel != null:
		var panel_fade: PropertyTweener = tween.tween_property(
			rail_panel,
			"modulate",
			Color(1.0, 1.0, 1.0, 0.0),
			DENSE_TRANSITION_DURATION
		)
		panel_fade.set_trans(Tween.TRANS_QUAD)
		panel_fade.set_ease(Tween.EASE_IN_OUT)

	tween.chain().tween_callback(_finish_layout_transition)


func _create_dense_sample_ghost(source: Dictionary) -> Node2D:
	if layout_transition_root == null or board == null:
		return null
	var anchor_index: int = int(source.get("anchor", -1))
	if anchor_index < 0 or anchor_index >= board.pieces.size():
		return null
	var source_piece = board.pieces[anchor_index]
	if not is_instance_valid(source_piece):
		return null

	var ghost := Node2D.new()
	ghost.name = "DenseLayoutMotion_%03d" % anchor_index
	ghost.position = Vector2(source.get("start_position", Vector2.ZERO))
	var start_scale: float = maxf(float(source.get("start_scale", 1.0)), 0.01)
	ghost.scale = Vector2(start_scale, start_scale)
	layout_transition_root.add_child(ghost)

	# Dense ghosts intentionally render only one representative face and no
	# Line2D outline. The transition is a directional motion cue, not a second
	# fully rendered Rail, and this keeps the temporary node count tiny.
	var face := Polygon2D.new()
	face.polygon = source_piece.polygon_points
	face.uv = source_piece.uv_points
	face.texture = source_piece.source_texture
	face.modulate = Color(1.0, 1.0, 1.0, 0.92)
	ghost.add_child(face)
	return ghost


func _restore_dense_loose_groups_to_scatter() -> void:
	if board == null:
		return
	rail_cluster_ids.clear()
	var starts: Array = _dense_scatter_positions()
	if starts.is_empty():
		return

	var seen: Dictionary = {}
	var group_ordinal := 0
	for piece_value in board.pieces:
		var piece = piece_value
		if not is_instance_valid(piece) or bool(piece.solved):
			continue
		var piece_index: int = int(piece.piece_index)
		if state.location_for(piece_index) != "loose":
			continue
		var cluster_id: int = int(
			board.cluster_for_piece.get(piece_index, piece_index)
		)
		if seen.has(cluster_id):
			continue
		seen[cluster_id] = true
		var members: Array = _loose_members_for_cluster(cluster_id)
		if members.is_empty():
			continue

		var anchor_index: int = int(members[0])
		var anchor_piece = board.pieces[anchor_index]
		var anchor_position: Vector2 = Vector2(
			starts[group_ordinal % starts.size()]
		)
		group_ordinal += 1
		board.z_counter += 1
		var group_z: int = int(board.z_counter)
		for value in members:
			var member_index: int = int(value)
			var member = board.pieces[member_index]
			member.position = (
				anchor_position
				+ Vector2(member.target_position)
				- Vector2(anchor_piece.target_position)
			)
			member.visible = true
			member.input_pickable = true
			member.z_index = group_z


func _dense_scatter_positions() -> Array:
	if board == null or board.definition == null:
		return []
	var definition_id: int = int(board.definition.get_instance_id())
	var navigation: Rect2 = Rect2(board.navigation_rect)
	if (
		dense_scatter_cache_definition_id == definition_id
		and dense_scatter_cache_navigation_rect == navigation
		and dense_scatter_cache.size() >= board.active_piece_count()
	):
		return dense_scatter_cache

	var started_ms: int = Time.get_ticks_msec()
	var starts: Array = []
	if board.has_method("_scatter_positions"):
		starts = board._scatter_positions()
	dense_scatter_cache = starts.duplicate()
	dense_scatter_cache_definition_id = definition_id
	dense_scatter_cache_navigation_rect = navigation
	print(
		"Pieceful dense scatter slots · %d positions · %d ms"
		% [dense_scatter_cache.size(), Time.get_ticks_msec() - started_ms]
	)
	return dense_scatter_cache
