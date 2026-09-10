extends "res://scripts/cluster_safe_chaos_order_spatial_layout_dock_ui.gd"

const TrayReflowCanvasScript = preload("res://scripts/tray_reflow_play_canvas.gd")
const FixedSurfaceRailCanvasScript = preload("res://scripts/fixed_surface_optimized_rail_canvas.gd")
const FIXED_SURFACE_SIZE := Vector2(720.0, 720.0)

var fixed_surface_virtual_size := FIXED_SURFACE_SIZE


func _build_ui() -> void:
	super._build_ui()
	_install_reflow_tray_canvas()
	_apply_fixed_surface_ui_transform()


func set_fixed_surface_virtual_size(next_size: Vector2) -> void:
	if next_size.x <= 1.0 or next_size.y <= 1.0:
		return
	fixed_surface_virtual_size = next_size
	_apply_fixed_surface_ui_transform()
	_layout_ui()
	# viewport+ignore intentionally keeps the root render target fixed, so a
	# physical mobile rotation may not emit the legacy Window.size_changed signal.
	# Main supplies every observed physical aspect here; restart the existing Tray
	# settle timer so orientation-aware mini-table reflow still happens once the
	# browser/device stops sending intermediate sizes.
	if reflow_settle_timer != null:
		reflow_settle_timer.start()


func _viewport_size() -> Vector2:
	return fixed_surface_virtual_size


func _apply_fixed_surface_ui_transform() -> void:
	if ui_layer == null:
		return
	var scale := Vector2(
		FIXED_SURFACE_SIZE.x / maxf(fixed_surface_virtual_size.x, 1.0),
		FIXED_SURFACE_SIZE.y / maxf(fixed_surface_virtual_size.y, 1.0)
	)
	ui_layer.transform = Transform2D(
		Vector2(scale.x, 0.0),
		Vector2(0.0, scale.y),
		Vector2.ZERO
	)


func _install_scrollable_rail_canvas() -> void:
	if rail_canvas == null:
		return
	var rail_box: Node = rail_canvas.get_parent() as Node
	if rail_box == null:
		return
	var old_index: int = int(rail_canvas.get_index())
	var old_canvas: Node = rail_canvas as Node
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

	rail_canvas = FixedSurfaceRailCanvasScript.new()
	rail_canvas.name = "LoosePieceRailCanvas"
	rail_canvas.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	rail_canvas.size_flags_vertical = Control.SIZE_EXPAND_FILL
	rail_canvas.group_dragged_out.connect(_on_rail_group_dragged_out)
	rail_scroll.add_child(rail_canvas)


func _install_reflow_tray_canvas() -> void:
	if tray_play_canvas == null:
		return
	var parent: Node = tray_play_canvas.get_parent() as Node
	if parent == null:
		return
	var old_index: int = int(tray_play_canvas.get_index())
	var old_canvas: Node = tray_play_canvas as Node
	parent.remove_child(old_canvas)
	old_canvas.queue_free()

	tray_play_canvas = TrayReflowCanvasScript.new()
	tray_play_canvas.name = "TrayPlayCanvas"
	tray_play_canvas.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	tray_play_canvas.size_flags_vertical = Control.SIZE_EXPAND_FILL
	tray_play_canvas.custom_minimum_size = Vector2(280.0, 190.0)
	tray_play_canvas.group_dragged_out.connect(_on_tray_group_dragged_out)
	tray_play_canvas.tray_cluster_changed.connect(_on_tray_cluster_changed)
	parent.add_child(tray_play_canvas)
	parent.move_child(tray_play_canvas, old_index)


func _store_groups_in_tray(groups: Array, tray_id: String) -> bool:
	# A Tray can be inactive when pieces are dropped onto its manager row. Reflow
	# its existing coordinate space to the current mini-table size before mixing
	# newly-created positions into that state.
	_prepare_tray_for_current_canvas(tray_id)
	var stored: bool = super._store_groups_in_tray(groups, tray_id)
	if stored:
		_prepare_tray_for_current_canvas(tray_id)
	return stored


func _prepare_tray_for_current_canvas(tray_id: String) -> void:
	if (
		tray_play_canvas == null
		or tray_id.is_empty()
		or not tray_play_canvas.has_method("prepare_tray_for_size")
	):
		return
	var target_size: Vector2 = Vector2(tray_play_canvas.size)
	if target_size.x <= 1.0 or target_size.y <= 1.0:
		return
	tray_play_canvas.prepare_tray_for_size(
		board,
		state,
		tray_id,
		target_size
	)


func _control_contains_surface_point(control: Control, surface_point: Vector2) -> bool:
	if control == null or not is_instance_valid(control):
		return false
	var local_point := control.get_global_transform_with_canvas().affine_inverse() * surface_point
	return Rect2(Vector2.ZERO, control.size).has_point(local_point)


func try_store_drag_release(piece) -> bool:
	if (
		active_tray_id.is_empty()
		or tray_play_canvas == null
		or not detail_panel.visible
		or piece == null
		or not is_instance_valid(piece)
	):
		return false

	var drop_position := Vector2(piece.last_pointer_screen_position)
	if not _control_contains_surface_point(tray_play_canvas, drop_position):
		return false

	var members: Array = _loose_group_members_for_piece(int(piece.piece_index))
	if members.is_empty():
		return false
	if not state.assign_pieces_to_tray(members, active_tray_id):
		return false

	for value in members:
		_stash_piece(int(value))
	tray_play_canvas.accept_world_drop(
		members,
		int(piece.piece_index),
		drop_position
	)
	_refresh_ui()
	_refresh_tray_detail()
	return true


func _tray_id_at_screen_point(screen_position: Vector2) -> String:
	for tray_id_value in tray_drop_targets.keys():
		var target = tray_drop_targets[tray_id_value]
		if not is_instance_valid(target) or not target.visible:
			continue
		if _control_contains_surface_point(target, screen_position):
			return str(tray_id_value)
	return ""


func try_store_rail_drop(piece) -> bool:
	if (
		loose_layout_mode != LAYOUT_RAIL
		or rail_panel == null
		or rail_canvas == null
		or not rail_panel.visible
		or piece == null
		or not is_instance_valid(piece)
		or piece.solved
	):
		return false

	var drop_position := Vector2(piece.last_pointer_screen_position)
	if not _control_contains_surface_point(rail_canvas, drop_position):
		return false

	var groups: Array = []
	if selection_mode_active() and is_piece_selected(int(piece.piece_index)):
		groups = _selected_groups()
	else:
		var members := _loose_group_members_for_piece(int(piece.piece_index))
		if members.is_empty():
			return false
		groups.append(members)

	var moved_any := false
	for group in groups:
		if not (group is Array) or group.is_empty():
			continue
		var anchor_index := int(group[0])
		var cluster_id := int(
			board.cluster_for_piece.get(anchor_index, anchor_index)
		)
		var members := _loose_members_for_cluster(cluster_id)
		if members.is_empty():
			continue
		rail_cluster_ids[cluster_id] = true
		for value in members:
			_stash_piece(int(value))
		moved_any = true

	if not moved_any:
		return false
	selected_clusters.clear()
	_apply_selection_visuals()
	_refresh_ui()
	return true


func _on_rail_group_dragged_out(
	member_indexes: Array,
	anchor_piece_index: int,
	screen_position: Vector2,
	anchor_pointer_offset: Vector2
) -> void:
	if member_indexes.is_empty():
		return
	if anchor_piece_index < 0 or anchor_piece_index >= board.pieces.size():
		return

	var cluster_id := int(
		board.cluster_for_piece.get(anchor_piece_index, anchor_piece_index)
	)
	rail_cluster_ids.erase(cluster_id)

	if (
		not active_tray_id.is_empty()
		and detail_panel != null
		and detail_panel.visible
		and tray_play_canvas != null
		and _control_contains_surface_point(tray_play_canvas, screen_position)
	):
		if state.assign_pieces_to_tray(member_indexes, active_tray_id):
			for value in member_indexes:
				_stash_piece(int(value))
			tray_play_canvas.accept_world_drop(
				member_indexes,
				anchor_piece_index,
				screen_position
			)
			_refresh_ui()
			_refresh_tray_detail()
		return

	_release_rail_group_to_main_table(
		member_indexes,
		anchor_piece_index,
		screen_position,
		anchor_pointer_offset
	)
