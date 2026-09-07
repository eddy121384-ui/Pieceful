extends "res://scripts/sorting_workspace_floating_manager_ui.gd"

const LoosePieceRailCanvasScript = preload("res://scripts/loose_piece_rail_canvas.gd")

const LAYOUT_SCATTER := "scatter"
const LAYOUT_RAIL := "rail"
const RAIL_MARGIN := 16.0
const RAIL_LANDSCAPE_WIDTH := 228.0
const RAIL_PORTRAIT_HEIGHT := 164.0

var loose_layout_mode := LAYOUT_SCATTER
var rail_cluster_ids: Dictionary = {}

var layout_mode_row: HBoxContainer
var scatter_mode_button: Button
var rail_mode_button: Button
var rail_panel: PanelContainer
var rail_title: Label
var rail_count_label: Label
var rail_canvas = null


func _build_ui() -> void:
	super._build_ui()
	_build_layout_mode_controls()
	_build_loose_piece_rail()


func _build_layout_mode_controls() -> void:
	if summary_label == null:
		return
	var box = summary_label.get_parent()
	if box == null:
		return

	layout_mode_row = HBoxContainer.new()
	layout_mode_row.name = "LoosePieceLayoutModeRow"
	layout_mode_row.add_theme_constant_override("separation", 7)

	var caption := Label.new()
	caption.text = "Loose pieces"
	caption.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	caption.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	caption.modulate = Color(1.0, 1.0, 1.0, 0.70)
	layout_mode_row.add_child(caption)

	scatter_mode_button = Button.new()
	scatter_mode_button.text = "Scatter"
	scatter_mode_button.toggle_mode = true
	scatter_mode_button.custom_minimum_size = Vector2(76.0, 36.0)
	scatter_mode_button.tooltip_text = "Keep loose pieces scattered on the main table"
	scatter_mode_button.pressed.connect(_set_loose_layout_mode.bind(LAYOUT_SCATTER))
	layout_mode_row.add_child(scatter_mode_button)

	rail_mode_button = Button.new()
	rail_mode_button.text = "Rail"
	rail_mode_button.toggle_mode = true
	rail_mode_button.custom_minimum_size = Vector2(62.0, 36.0)
	rail_mode_button.tooltip_text = "Stage loose pieces in the Side Rail"
	rail_mode_button.pressed.connect(_set_loose_layout_mode.bind(LAYOUT_RAIL))
	layout_mode_row.add_child(rail_mode_button)

	box.add_child(layout_mode_row)
	box.move_child(layout_mode_row, summary_label.get_index() + 1)
	_refresh_layout_mode_controls()


func _build_loose_piece_rail() -> void:
	if ui_layer == null:
		return

	rail_panel = PanelContainer.new()
	rail_panel.name = "LoosePieceSideRail"
	rail_panel.visible = false
	rail_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	ui_layer.add_child(rail_panel)

	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.035, 0.04, 0.052, 0.93)
	style.border_color = Color(1.0, 1.0, 1.0, 0.12)
	style.set_border_width_all(1)
	style.set_corner_radius_all(16)
	style.shadow_color = Color(0.0, 0.0, 0.0, 0.28)
	style.shadow_size = 9
	style.content_margin_left = 10.0
	style.content_margin_top = 10.0
	style.content_margin_right = 10.0
	style.content_margin_bottom = 10.0
	rail_panel.add_theme_stylebox_override("panel", style)

	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 6)
	rail_panel.add_child(box)

	var header := HBoxContainer.new()
	header.add_theme_constant_override("separation", 6)
	box.add_child(header)

	rail_title = Label.new()
	rail_title.text = "Side Rail"
	rail_title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	rail_title.add_theme_font_size_override("font_size", 16)
	header.add_child(rail_title)

	rail_count_label = Label.new()
	rail_count_label.text = "0"
	rail_count_label.modulate = Color(1.0, 1.0, 1.0, 0.58)
	header.add_child(rail_count_label)

	rail_canvas = LoosePieceRailCanvasScript.new()
	rail_canvas.name = "LoosePieceRailCanvas"
	rail_canvas.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	rail_canvas.size_flags_vertical = Control.SIZE_EXPAND_FILL
	rail_canvas.group_dragged_out.connect(_on_rail_group_dragged_out)
	box.add_child(rail_canvas)


func _ensure_piece_bindings() -> bool:
	var changed: bool = super._ensure_piece_bindings()
	if not changed:
		return false

	rail_cluster_ids.clear()
	if loose_layout_mode == LAYOUT_RAIL:
		_capture_all_loose_groups_to_rail()
	_refresh_loose_piece_layout()
	return true


func _refresh_ui() -> void:
	super._refresh_ui()
	_refresh_layout_mode_controls()
	_refresh_loose_piece_layout()


func _layout_ui() -> void:
	super._layout_ui()
	_layout_loose_piece_rail()


func _after_window_reflow() -> void:
	super._after_window_reflow()
	_layout_loose_piece_rail()
	_refresh_loose_piece_layout()


func _set_loose_layout_mode(mode: String) -> void:
	if mode != LAYOUT_SCATTER and mode != LAYOUT_RAIL:
		return
	if mode == loose_layout_mode:
		_refresh_layout_mode_controls()
		return

	_exit_selection_mode()
	loose_layout_mode = mode
	if loose_layout_mode == LAYOUT_RAIL:
		_capture_all_loose_groups_to_rail()
	else:
		_restore_all_loose_groups_to_scatter()

	_refresh_layout_mode_controls()
	_refresh_ui()
	_layout_ui()


func _refresh_layout_mode_controls() -> void:
	if scatter_mode_button != null:
		scatter_mode_button.set_pressed_no_signal(
			loose_layout_mode == LAYOUT_SCATTER
		)
		scatter_mode_button.modulate = (
			Color.WHITE
			if loose_layout_mode == LAYOUT_SCATTER
			else Color(1.0, 1.0, 1.0, 0.58)
		)
	if rail_mode_button != null:
		rail_mode_button.set_pressed_no_signal(loose_layout_mode == LAYOUT_RAIL)
		rail_mode_button.modulate = (
			Color.WHITE
			if loose_layout_mode == LAYOUT_RAIL
			else Color(1.0, 1.0, 1.0, 0.58)
		)


func _capture_all_loose_groups_to_rail() -> void:
	if board == null:
		return
	rail_cluster_ids.clear()
	var seen: Dictionary = {}
	for piece in board.pieces:
		if not is_instance_valid(piece) or piece.solved:
			continue
		var piece_index := int(piece.piece_index)
		if state.location_for(piece_index) != "loose":
			continue
		var cluster_id := int(board.cluster_for_piece.get(piece_index, piece_index))
		if seen.has(cluster_id):
			continue
		seen[cluster_id] = true
		var members := _loose_members_for_cluster(cluster_id)
		if members.is_empty():
			continue
		rail_cluster_ids[cluster_id] = true
		for value in members:
			_stash_piece(int(value))


func _restore_all_loose_groups_to_scatter() -> void:
	if board == null:
		return
	rail_cluster_ids.clear()
	var starts: Array = []
	if board.has_method("_scatter_positions"):
		starts = board._scatter_positions()
	if starts.is_empty():
		return

	var seen: Dictionary = {}
	var group_ordinal := 0
	for piece in board.pieces:
		if not is_instance_valid(piece) or piece.solved:
			continue
		var piece_index := int(piece.piece_index)
		if state.location_for(piece_index) != "loose":
			continue
		var cluster_id := int(board.cluster_for_piece.get(piece_index, piece_index))
		if seen.has(cluster_id):
			continue
		seen[cluster_id] = true
		var members := _loose_members_for_cluster(cluster_id)
		if members.is_empty():
			continue
		var anchor_index := int(members[0])
		var anchor_piece = board.pieces[anchor_index]
		var anchor_position := Vector2(starts[group_ordinal % starts.size()])
		group_ordinal += 1
		board.z_counter += 1
		var group_z: int = int(board.z_counter)
		for value in members:
			var member_index := int(value)
			var member = board.pieces[member_index]
			member.position = (
				anchor_position
				+ Vector2(member.target_position)
				- Vector2(anchor_piece.target_position)
			)
			member.visible = true
			member.input_pickable = true
			member.z_index = group_z


func _loose_members_for_cluster(cluster_id: int) -> Array:
	if board == null:
		return []
	var raw_members = board.cluster_members.get(cluster_id, [])
	if not (raw_members is Array) or raw_members.is_empty():
		return []
	var members: Array = []
	for value in raw_members:
		var piece_index := int(value)
		if piece_index < 0 or piece_index >= board.pieces.size():
			return []
		var piece = board.pieces[piece_index]
		if (
			not is_instance_valid(piece)
			or piece.solved
			or state.location_for(piece_index) != "loose"
		):
			return []
		members.append(piece_index)
	return members


func _rail_member_indexes() -> Array:
	var result: Array = []
	if board == null:
		return result

	var stale_ids: Array = []
	for cluster_id_value in rail_cluster_ids.keys():
		var cluster_id := int(cluster_id_value)
		var members := _loose_members_for_cluster(cluster_id)
		if members.is_empty():
			stale_ids.append(cluster_id)
			continue
		for value in members:
			var piece_index := int(value)
			if not result.has(piece_index):
				result.append(piece_index)
	for cluster_id in stale_ids:
		rail_cluster_ids.erase(cluster_id)
	result.sort()
	return result


func _refresh_loose_piece_layout() -> void:
	if rail_panel == null or rail_canvas == null:
		return
	var rail_enabled := loose_layout_mode == LAYOUT_RAIL
	rail_panel.visible = rail_enabled
	if not rail_enabled:
		return
	var members := _rail_member_indexes()
	rail_count_label.text = "%d" % members.size()
	rail_canvas.configure(board, members)
	for value in members:
		_stash_piece(int(value))


func _layout_loose_piece_rail() -> void:
	if rail_panel == null or loose_layout_mode != LAYOUT_RAIL:
		return
	var viewport_size := _viewport_size()
	var width := maxf(viewport_size.x, 1.0)
	var height := maxf(viewport_size.y, 1.0)
	var portrait := height > width
	var dock := AppUiMetrics.dock_rect(viewport_size)

	if portrait:
		var rail_height := minf(
			RAIL_PORTRAIT_HEIGHT,
			maxf(118.0, dock.position.y - 92.0)
		)
		rail_panel.position = Vector2(
			RAIL_MARGIN,
			maxf(76.0, dock.position.y - rail_height - 10.0)
		)
		rail_panel.size = Vector2(
			maxf(220.0, width - RAIL_MARGIN * 2.0),
			rail_height
		)
	else:
		var rail_top := 78.0
		var rail_bottom := dock.position.y - 10.0
		rail_panel.position = Vector2(RAIL_MARGIN, rail_top)
		rail_panel.size = Vector2(
			minf(RAIL_LANDSCAPE_WIDTH, maxf(180.0, width * 0.22)),
			maxf(180.0, rail_bottom - rail_top)
		)


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
	if not rail_canvas.get_global_rect().has_point(drop_position):
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
		and tray_play_canvas.get_global_rect().has_point(screen_position)
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


func _release_rail_group_to_main_table(
	member_indexes: Array,
	anchor_piece_index: int,
	screen_position: Vector2,
	anchor_pointer_offset: Vector2
) -> void:
	var scale_factor := maxf(rail_canvas.visual_scale(), 0.01)
	var pointer_world := (
		get_viewport().get_canvas_transform().affine_inverse() * screen_position
	)
	var anchor_world_position := (
		pointer_world - anchor_pointer_offset / scale_factor
	)
	var anchor_piece = board.pieces[anchor_piece_index]

	board.z_counter += 1
	var group_z: int = int(board.z_counter)
	for value in member_indexes:
		var piece_index := int(value)
		if piece_index < 0 or piece_index >= board.pieces.size():
			continue
		var piece = board.pieces[piece_index]
		state.move_piece_to_loose(piece_index)
		piece.position = (
			anchor_world_position
			+ Vector2(piece.target_position)
			- Vector2(anchor_piece.target_position)
		)
		piece.visible = true
		piece.input_pickable = true
		piece.z_index = group_z

	if board.has_method("_merge_nearby_clusters"):
		var cluster_id := int(
			board.cluster_for_piece.get(anchor_piece_index, anchor_piece_index)
		)
		cluster_id = int(board._merge_nearby_clusters(cluster_id))
		if board.has_method("_snap_cluster_to_board_if_close"):
			board._snap_cluster_to_board_if_close(cluster_id)

	_refresh_ui()


func _on_tray_group_dragged_out(
	member_indexes: Array,
	anchor_piece_index: int,
	screen_position: Vector2,
	anchor_pointer_offset: Vector2
) -> void:
	super._on_tray_group_dragged_out(
		member_indexes,
		anchor_piece_index,
		screen_position,
		anchor_pointer_offset
	)
	for value in member_indexes:
		var piece_index := int(value)
		var cluster_id := int(board.cluster_for_piece.get(piece_index, piece_index))
		rail_cluster_ids.erase(cluster_id)
	_refresh_loose_piece_layout()


func _return_deleted_tray_members(member_indexes: Array) -> void:
	super._return_deleted_tray_members(member_indexes)
	for value in member_indexes:
		var piece_index := int(value)
		var cluster_id := int(board.cluster_for_piece.get(piece_index, piece_index))
		rail_cluster_ids.erase(cluster_id)
	_refresh_loose_piece_layout()
