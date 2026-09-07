extends "res://scripts/sorting_workspace_icon_ui.gd"

const ManagementState = preload("res://scripts/sorting_workspace_management_state.gd")
const Icons = preload("res://scripts/ui_icon_catalog.gd")

const SELECTED_OUTLINE_COLOR := Color(1.0, 0.82, 0.30, 1.0)
const NORMAL_OUTLINE_COLOR := Color(1.0, 1.0, 1.0, 0.66)
const SELECTED_OUTLINE_WIDTH := 3.4
const NORMAL_OUTLINE_WIDTH := 1.35
const COLLAPSED_TRAY_HEIGHT := 94.0

var selection_mode := false
var selected_clusters: Dictionary = {}
var selection_mode_button: Button
var clear_selection_button: Button
var selection_count_label: Label
var collapse_detail_button: Button


func _ready() -> void:
	state = ManagementState.new()
	super._ready()


func _build_ui() -> void:
	super._build_ui()
	_build_selection_controls()
	_build_collapse_control()


func _build_selection_controls() -> void:
	var box = summary_label.get_parent()
	if box == null:
		return

	var row := HBoxContainer.new()
	row.name = "MultiSelectRow"
	row.add_theme_constant_override("separation", 8)

	selection_mode_button = Button.new()
	selection_mode_button.toggle_mode = true
	Icons.apply_button(
		selection_mode_button,
		Icons.IconId.SELECT,
		"Select multiple pieces / clusters",
		Vector2(40.0, 40.0),
		20
	)
	selection_mode_button.toggled.connect(_on_selection_mode_toggled)
	row.add_child(selection_mode_button)

	selection_count_label = Label.new()
	selection_count_label.text = "0 selected"
	selection_count_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	selection_count_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	selection_count_label.modulate = Color(1.0, 1.0, 1.0, 0.70)
	row.add_child(selection_count_label)

	clear_selection_button = Button.new()
	Icons.apply_button(
		clear_selection_button,
		Icons.IconId.CLOSE,
		"Clear selection",
		Vector2(36.0, 36.0),
		18
	)
	clear_selection_button.visible = false
	clear_selection_button.pressed.connect(_clear_selection)
	row.add_child(clear_selection_button)

	box.add_child(row)
	var summary_index: int = summary_label.get_index()
	box.move_child(row, summary_index + 1)


func _build_collapse_control() -> void:
	var header = close_detail_button.get_parent()
	if header == null:
		return
	collapse_detail_button = Button.new()
	Icons.apply_button(
		collapse_detail_button,
		Icons.IconId.COLLAPSE,
		"Collapse tray",
		Vector2(40.0, 40.0),
		20
	)
	collapse_detail_button.pressed.connect(_toggle_active_tray_collapsed)
	header.add_child(collapse_detail_button)
	header.move_child(collapse_detail_button, maxi(0, close_detail_button.get_index()))


func _ensure_piece_bindings() -> bool:
	var changed: bool = super._ensure_piece_bindings()
	if changed:
		selection_mode = false
		selected_clusters.clear()
		if selection_mode_button != null:
			selection_mode_button.set_pressed_no_signal(false)
		_apply_selection_visuals()
	return changed


func _on_selection_mode_toggled(enabled: bool) -> void:
	selection_mode = enabled
	if not selection_mode:
		_clear_selection()
	else:
		_refresh_selection_controls()
		_apply_selection_visuals()


func try_handle_piece_select_tap(piece) -> bool:
	if not selection_mode:
		return false
	if piece == null or not is_instance_valid(piece) or piece.solved:
		return true

	var members: Array = _loose_group_members_for_piece(int(piece.piece_index))
	if members.is_empty():
		return true

	var cluster_id: int = int(
		board.cluster_for_piece.get(int(piece.piece_index), int(piece.piece_index))
	)
	if selected_clusters.has(cluster_id):
		selected_clusters.erase(cluster_id)
	else:
		selected_clusters[cluster_id] = members.duplicate()

	_apply_selection_visuals()
	_refresh_ui()
	return true


func _clear_selection() -> void:
	selected_clusters.clear()
	_apply_selection_visuals()
	_refresh_selection_controls()
	_refresh_ui()


func _refresh_selection_controls() -> void:
	if selection_count_label == null:
		return
	var group_count: int = selected_clusters.size()
	var piece_count: int = _selected_members().size()
	selection_count_label.text = (
		"%d selected · %d piece%s" % [
			group_count,
			piece_count,
			"" if piece_count == 1 else "s",
		]
		if group_count > 0
		else "Tap pieces to select"
		if selection_mode
		else "Multi-select"
	)
	clear_selection_button.visible = group_count > 0
	if selection_mode_button != null:
		selection_mode_button.set_pressed_no_signal(selection_mode)
		selection_mode_button.modulate = (
			Color.WHITE if selection_mode else Color(1.0, 1.0, 1.0, 0.62)
		)


func _prune_selection() -> void:
	var remove_ids: Array = []
	for cluster_id in selected_clusters.keys():
		var members = selected_clusters[cluster_id]
		if not (members is Array) or members.is_empty():
			remove_ids.append(cluster_id)
			continue
		for value in members:
			if state.location_for(int(value)) != ManagementState.LOCATION_LOOSE:
				remove_ids.append(cluster_id)
				break
	for cluster_id in remove_ids:
		selected_clusters.erase(cluster_id)


func _selected_members() -> Array:
	var result: Array = []
	for members in selected_clusters.values():
		if not (members is Array):
			continue
		for value in members:
			var piece_index: int = int(value)
			if not result.has(piece_index):
				result.append(piece_index)
	return result


func _apply_selection_visuals() -> void:
	if board == null:
		return
	var selected_members: Array = _selected_members()
	for piece in board.pieces:
		if not is_instance_valid(piece):
			continue
		var outline := piece.get_node_or_null("Outline") as Line2D
		if outline == null:
			continue
		var selected: bool = selected_members.has(int(piece.piece_index))
		outline.default_color = SELECTED_OUTLINE_COLOR if selected else NORMAL_OUTLINE_COLOR
		outline.width = SELECTED_OUTLINE_WIDTH if selected else NORMAL_OUTLINE_WIDTH


func _refresh_ui() -> void:
	super._refresh_ui()
	if tray_list_box == null:
		return

	_prune_selection()
	_refresh_selection_controls()
	_apply_selection_visuals()
	_rebuild_management_tray_rows()


func _rebuild_management_tray_rows() -> void:
	_clear_container(tray_list_box)
	var tray_ids: Array[String] = state.tray_ids()
	if tray_ids.is_empty():
		var empty_label := Label.new()
		empty_label.text = "No trays yet"
		empty_label.modulate = Color(1.0, 1.0, 1.0, 0.52)
		tray_list_box.add_child(empty_label)
		return

	for index in range(tray_ids.size()):
		var tray_id: String = tray_ids[index]
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 4)
		tray_list_box.add_child(row)

		var open_button := Button.new()
		var count: int = state.tray_piece_count(tray_id)
		open_button.text = "%s · %d" % [state.tray_name(tray_id), count]
		open_button.alignment = HORIZONTAL_ALIGNMENT_LEFT
		open_button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		open_button.custom_minimum_size = Vector2(0.0, 42.0)
		open_button.tooltip_text = "Open %s" % state.tray_name(tray_id)
		open_button.pressed.connect(_open_tray.bind(tray_id))
		row.add_child(open_button)

		if not selected_clusters.is_empty():
			var send_button := Button.new()
			Icons.apply_button(
				send_button,
				Icons.IconId.SEND,
				"Move selected to %s" % state.tray_name(tray_id),
				Vector2(38.0, 38.0),
				18
			)
			send_button.pressed.connect(_move_selected_to_tray.bind(tray_id))
			row.add_child(send_button)

		var up_button := Button.new()
		Icons.apply_button(up_button, Icons.IconId.MOVE_UP, "Move tray up", Vector2(34.0, 38.0), 16)
		up_button.disabled = index == 0
		up_button.pressed.connect(_move_tray.bind(tray_id, -1))
		row.add_child(up_button)

		var down_button := Button.new()
		Icons.apply_button(down_button, Icons.IconId.MOVE_DOWN, "Move tray down", Vector2(34.0, 38.0), 16)
		down_button.disabled = index == tray_ids.size() - 1
		down_button.pressed.connect(_move_tray.bind(tray_id, 1))
		row.add_child(down_button)

		var delete_button := Button.new()
		Icons.apply_button(delete_button, Icons.IconId.DELETE, "Delete tray · return pieces to table", Vector2(36.0, 38.0), 17)
		delete_button.pressed.connect(_delete_tray.bind(tray_id))
		row.add_child(delete_button)


func _move_tray(tray_id: String, delta: int) -> void:
	if state.move_tray(tray_id, delta):
		_refresh_ui()


func _delete_tray(tray_id: String) -> void:
	var members: Array = state.tray_piece_indexes(tray_id)
	if tray_id == active_tray_id:
		_close_tray_detail()
	tray_window_positions.erase(tray_id)
	var returned: Array = state.delete_tray(tray_id)
	if returned.is_empty() and not members.is_empty():
		returned = members
	_return_deleted_tray_members(returned)
	_refresh_ui()


func _return_deleted_tray_members(member_indexes: Array) -> void:
	if board == null or member_indexes.is_empty():
		return
	var starts: Array = []
	if board.has_method("_scatter_positions"):
		starts = board._scatter_positions()
	var handled_clusters: Dictionary = {}
	var group_ordinal := 0

	for value in member_indexes:
		var piece_index: int = int(value)
		var cluster_id: int = int(board.cluster_for_piece.get(piece_index, piece_index))
		if handled_clusters.has(cluster_id):
			continue
		handled_clusters[cluster_id] = true

		var raw_members = board.cluster_members.get(cluster_id, [piece_index])
		var group_members: Array = raw_members.duplicate() if raw_members is Array else [piece_index]
		var anchor_index: int = piece_index
		var anchor_piece = board.pieces[anchor_index]
		var anchor_position: Vector2 = (
			Vector2(starts[anchor_index])
			if anchor_index < starts.size()
			else board.navigation_rect.position + Vector2(24.0 + group_ordinal * 18.0, 96.0 + group_ordinal * 12.0)
		)

		board.z_counter += 1
		var group_z: int = board.z_counter
		for member_value in group_members:
			var member_index: int = int(member_value)
			if not member_indexes.has(member_index):
				continue
			var member = board.pieces[member_index]
			member.position = (
				anchor_position
				+ Vector2(member.target_position)
				- Vector2(anchor_piece.target_position)
			)
			member.visible = true
			member.input_pickable = true
			member.z_index = group_z
		group_ordinal += 1


func _move_selected_to_tray(tray_id: String) -> void:
	if selected_clusters.is_empty() or not state.tray_ids().has(tray_id):
		return
	var groups: Array = []
	for members in selected_clusters.values():
		if members is Array and not members.is_empty():
			groups.append(members.duplicate())
	var all_members: Array = _selected_members()
	if all_members.is_empty():
		return

	var existing_count: int = state.tray_piece_count(tray_id)
	if not state.assign_pieces_to_tray(all_members, tray_id):
		return

	var scale_factor: float = _tray_visual_scale()
	var piece_size: Vector2 = Vector2(board.definition.piece_size) * scale_factor
	var step_x: float = maxf(64.0, piece_size.x * 1.25)
	var step_y: float = maxf(64.0, piece_size.y * 1.25)
	var columns := 4
	var group_index := 0
	for members in groups:
		var anchor_index: int = int(members[0])
		var anchor_piece = board.pieces[anchor_index]
		var ordinal: int = existing_count + group_index
		var anchor_local := Vector2(
			14.0 + float(ordinal % columns) * step_x,
			14.0 + float(ordinal / columns) * step_y
		)
		for value in members:
			var member_index: int = int(value)
			var member = board.pieces[member_index]
			var relative_target: Vector2 = (
				Vector2(member.target_position) - Vector2(anchor_piece.target_position)
			) * scale_factor
			state.set_tray_piece_position(tray_id, member_index, anchor_local + relative_target)
			_stash_piece(member_index)
		group_index += 1

	selected_clusters.clear()
	selection_mode = false
	selection_mode_button.set_pressed_no_signal(false)
	_apply_selection_visuals()
	if tray_id == active_tray_id and tray_play_canvas != null:
		tray_play_canvas.refresh()
	_refresh_ui()


func _tray_visual_scale() -> float:
	if board == null or board.definition == null:
		return 1.0
	var piece_size: Vector2 = Vector2(board.definition.piece_size)
	var short_edge: float = maxf(1.0, minf(piece_size.x, piece_size.y))
	return clampf(52.0 / short_edge, 0.62, 1.28)


func _open_tray(tray_id: String) -> void:
	super._open_tray(tray_id)
	_apply_detail_collapsed_state()


func _toggle_active_tray_collapsed() -> void:
	if active_tray_id.is_empty():
		return
	var next_state: bool = not state.tray_is_collapsed(active_tray_id)
	if state.set_tray_collapsed(active_tray_id, next_state):
		_apply_detail_collapsed_state()
		_layout_ui()


func _apply_detail_collapsed_state() -> void:
	if active_tray_id.is_empty() or collapse_detail_button == null:
		return
	var collapsed: bool = state.tray_is_collapsed(active_tray_id)
	var rename_row = detail_name_edit.get_parent()
	if rename_row != null:
		rename_row.visible = not collapsed
	tray_play_canvas.visible = not collapsed
	collapse_detail_button.icon = Icons.texture(
		Icons.IconId.EXPAND if collapsed else Icons.IconId.COLLAPSE
	)
	collapse_detail_button.tooltip_text = "Expand tray" if collapsed else "Collapse tray"
	detail_panel.custom_minimum_size = (
		Vector2(260.0, COLLAPSED_TRAY_HEIGHT)
		if collapsed
		else Vector2(320.0, 300.0)
	)
	if collapsed:
		detail_panel.size.y = COLLAPSED_TRAY_HEIGHT


func try_store_drag_release(piece) -> bool:
	if (
		not active_tray_id.is_empty()
		and state.tray_is_collapsed(active_tray_id)
	):
		return false
	return super.try_store_drag_release(piece)


func _layout_ui() -> void:
	super._layout_ui()
	if (
		detail_panel != null
		and detail_panel.visible
		and not active_tray_id.is_empty()
		and state.tray_is_collapsed(active_tray_id)
	):
		detail_panel.size.y = COLLAPSED_TRAY_HEIGHT
		detail_panel.position = _clamp_detail_position(detail_panel.position)
