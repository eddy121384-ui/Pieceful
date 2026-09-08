extends "res://scripts/loose_piece_layout_dock_ui.gd"

const OptimizedRailCanvasScript = preload("res://scripts/chaos_order_optimized_rail_canvas.gd")

const DENSE_LAYOUT_THRESHOLD := 120
const DENSE_BULK_FADE_DURATION := 0.16

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
	_exit_selection_mode()
	loose_layout_mode = mode

	# The normal app path animates each loose cluster with a dedicated ghost made
	# of Polygon2D + Line2D nodes. That is delightful at 40 pieces but pathological
	# at 286: hundreds of temporary nodes and tweens are created at once. Dense
	# mode performs the same canonical state transition without per-piece ghosts.
	if loose_layout_mode == LAYOUT_RAIL:
		_capture_all_loose_groups_to_rail()
	else:
		_restore_dense_loose_groups_to_scatter()

	_refresh_layout_mode_controls()
	_refresh_ui()
	_layout_ui()

	if loose_layout_mode == LAYOUT_RAIL:
		_play_dense_rail_fade()

	var elapsed_ms: int = Time.get_ticks_msec() - started_ms
	print(
		"Pieceful dense layout switch · %d loose · %s · %d ms"
		% [loose_count, loose_layout_mode, elapsed_ms]
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


func _play_dense_rail_fade() -> void:
	if rail_panel == null:
		return
	rail_panel.modulate = Color(1.0, 1.0, 1.0, 0.35)
	var tween: Tween = create_tween()
	var fade: PropertyTweener = tween.tween_property(
		rail_panel,
		"modulate",
		Color.WHITE,
		DENSE_BULK_FADE_DURATION
	)
	fade.set_trans(Tween.TRANS_QUAD)
	fade.set_ease(Tween.EASE_OUT)


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
