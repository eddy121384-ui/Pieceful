class_name SortingWorkspaceController
extends Node

const SortingWorkspaceStateScript = preload("res://scripts/sorting_workspace_state.gd")
const TrayItemPreviewScript = preload("res://scripts/tray_item_preview.gd")
const STASH_ORIGIN := Vector2(-1000000.0, -1000000.0)
const PANEL_WIDTH := 360.0
const PANEL_HEIGHT := 440.0
const DETAIL_WIDTH := 430.0
const DETAIL_HEIGHT := 500.0
const REFLOW_SETTLE_SECONDS := 0.09
const FLOATING_MARGIN := 16.0

var board = null
var state = SortingWorkspaceStateScript.new()
var bound_piece_instance_ids: Array = []
var return_positions: Dictionary = {}
var drag_origin_positions: Dictionary = {}
var tray_window_positions: Dictionary = {}
var active_tray_id := ""
var detail_dragging := false
var detail_drag_pointer_id := -999
var detail_drag_offset := Vector2.ZERO
var detail_user_positioned := false

var ui_layer: CanvasLayer
var sort_button: Button
var panel: PanelContainer
var summary_label: Label
var new_tray_name: LineEdit
var add_tray_button: Button
var tray_scroll: ScrollContainer
var tray_list_box: VBoxContainer
var note_label: Label
var detail_panel: PanelContainer
var detail_drag_handle: Label
var detail_title: Label
var detail_name_edit: LineEdit
var rename_button: Button
var drop_hint_label: Label
var detail_scroll: ScrollContainer
var detail_grid: GridContainer
var close_detail_button: Button
var reflow_settle_timer: Timer


func _ready() -> void:
	board = get_parent().get_node_or_null("PuzzleBoard")
	if board == null:
		push_warning("SortingWorkspaceController: PuzzleBoard not found")
		return
	_build_ui()
	_build_reflow_settle_timer()
	board.progress_changed.connect(_on_progress_changed)
	get_window().size_changed.connect(_schedule_layout_refresh)
	call_deferred("_apply_after_parent_ready")


func _input(event: InputEvent) -> void:
	if not detail_dragging:
		return

	if detail_drag_pointer_id == -1:
		if event is InputEventMouseMotion:
			if (event.button_mask & MOUSE_BUTTON_MASK_LEFT) != 0:
				_move_detail_panel(event.position)
				get_viewport().set_input_as_handled()
		elif event is InputEventMouseButton:
			if event.button_index == MOUSE_BUTTON_LEFT and not event.pressed:
				_finish_detail_drag()
				get_viewport().set_input_as_handled()
	else:
		if event is InputEventScreenDrag and event.index == detail_drag_pointer_id:
			_move_detail_panel(event.position)
			get_viewport().set_input_as_handled()
		elif event is InputEventScreenTouch:
			if event.index == detail_drag_pointer_id and not event.pressed:
				_finish_detail_drag()
				get_viewport().set_input_as_handled()


func _build_reflow_settle_timer() -> void:
	reflow_settle_timer = Timer.new()
	reflow_settle_timer.one_shot = true
	reflow_settle_timer.wait_time = REFLOW_SETTLE_SECONDS
	reflow_settle_timer.timeout.connect(_after_window_reflow)
	add_child(reflow_settle_timer)


func _build_ui() -> void:
	ui_layer = CanvasLayer.new()
	ui_layer.name = "SortingUI"
	ui_layer.layer = 20
	add_child(ui_layer)

	sort_button = Button.new()
	sort_button.text = "Sort · 0 trays"
	sort_button.toggle_mode = true
	sort_button.size = Vector2(136.0, 44.0)
	sort_button.tooltip_text = "Open Sorting Workspace"
	sort_button.toggled.connect(_on_sort_toggled)
	ui_layer.add_child(sort_button)

	panel = PanelContainer.new()
	panel.visible = false
	panel.custom_minimum_size = Vector2(PANEL_WIDTH, PANEL_HEIGHT)
	panel.size = Vector2(PANEL_WIDTH, PANEL_HEIGHT)
	ui_layer.add_child(panel)

	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 9)
	panel.add_child(box)

	var title := Label.new()
	title.text = "Sorting Workspace"
	title.add_theme_font_size_override("font_size", 20)
	box.add_child(title)

	summary_label = Label.new()
	summary_label.modulate = Color(1.0, 1.0, 1.0, 0.72)
	box.add_child(summary_label)

	var create_row := HBoxContainer.new()
	create_row.add_theme_constant_override("separation", 8)
	box.add_child(create_row)

	new_tray_name = LineEdit.new()
	new_tray_name.placeholder_text = "New tray name…"
	new_tray_name.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	new_tray_name.text_submitted.connect(_on_new_tray_submitted)
	create_row.add_child(new_tray_name)

	add_tray_button = Button.new()
	add_tray_button.text = "+ Tray"
	add_tray_button.custom_minimum_size = Vector2(86.0, 40.0)
	add_tray_button.pressed.connect(_create_tray_from_field)
	create_row.add_child(add_tray_button)

	var tray_caption := Label.new()
	tray_caption.text = "Your trays"
	tray_caption.modulate = Color(1.0, 1.0, 1.0, 0.62)
	box.add_child(tray_caption)

	tray_scroll = ScrollContainer.new()
	tray_scroll.custom_minimum_size = Vector2(0.0, 240.0)
	tray_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	box.add_child(tray_scroll)

	tray_list_box = VBoxContainer.new()
	tray_list_box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	tray_list_box.add_theme_constant_override("separation", 7)
	tray_scroll.add_child(tray_list_box)

	note_label = Label.new()
	note_label.text = "Open a tray, then drag a loose piece or cluster directly into it."
	note_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	note_label.modulate = Color(1.0, 1.0, 1.0, 0.58)
	note_label.add_theme_font_size_override("font_size", 12)
	box.add_child(note_label)
	_build_tray_detail_window()


func _build_tray_detail_window() -> void:
	detail_panel = PanelContainer.new()
	detail_panel.visible = false
	detail_panel.custom_minimum_size = Vector2(DETAIL_WIDTH, DETAIL_HEIGHT)
	detail_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	ui_layer.add_child(detail_panel)

	var floating_style := StyleBoxFlat.new()
	floating_style.bg_color = Color(0.055, 0.06, 0.075, 0.80)
	floating_style.border_color = Color(1.0, 1.0, 1.0, 0.18)
	floating_style.set_border_width_all(1)
	floating_style.set_corner_radius_all(14)
	floating_style.shadow_color = Color(0.0, 0.0, 0.0, 0.34)
	floating_style.shadow_size = 12
	floating_style.content_margin_left = 12.0
	floating_style.content_margin_top = 10.0
	floating_style.content_margin_right = 12.0
	floating_style.content_margin_bottom = 12.0
	detail_panel.add_theme_stylebox_override("panel", floating_style)

	var detail_box := VBoxContainer.new()
	detail_box.add_theme_constant_override("separation", 9)
	detail_panel.add_child(detail_box)

	detail_drag_handle = Label.new()
	detail_drag_handle.text = "⋮⋮  Drag tray"
	detail_drag_handle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	detail_drag_handle.custom_minimum_size = Vector2(0.0, 30.0)
	detail_drag_handle.mouse_filter = Control.MOUSE_FILTER_STOP
	detail_drag_handle.mouse_default_cursor_shape = Control.CURSOR_MOVE
	detail_drag_handle.modulate = Color(1.0, 1.0, 1.0, 0.55)
	detail_drag_handle.gui_input.connect(_on_detail_drag_handle_gui_input)
	detail_box.add_child(detail_drag_handle)

	var header := HBoxContainer.new()
	header.add_theme_constant_override("separation", 8)
	detail_box.add_child(header)

	detail_title = Label.new()
	detail_title.text = "Tray"
	detail_title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	detail_title.add_theme_font_size_override("font_size", 22)
	header.add_child(detail_title)

	close_detail_button = Button.new()
	close_detail_button.text = "Back"
	close_detail_button.pressed.connect(_close_tray_detail)
	header.add_child(close_detail_button)

	var rename_row := HBoxContainer.new()
	rename_row.add_theme_constant_override("separation", 8)
	detail_box.add_child(rename_row)

	detail_name_edit = LineEdit.new()
	detail_name_edit.placeholder_text = "Tray name"
	detail_name_edit.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	detail_name_edit.text_submitted.connect(_on_rename_submitted)
	rename_row.add_child(detail_name_edit)

	rename_button = Button.new()
	rename_button.text = "Rename"
	rename_button.pressed.connect(_rename_active_tray)
	rename_row.add_child(rename_button)

	drop_hint_label = Label.new()
	drop_hint_label.text = "↓ Drag pieces or a joined cluster into this tray"
	drop_hint_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	drop_hint_label.custom_minimum_size = Vector2(0.0, 38.0)
	drop_hint_label.modulate = Color(1.0, 1.0, 1.0, 0.78)
	drop_hint_label.add_theme_font_size_override("font_size", 14)
	detail_box.add_child(drop_hint_label)

	detail_scroll = ScrollContainer.new()
	detail_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	detail_scroll.custom_minimum_size = Vector2(0.0, 260.0)
	detail_box.add_child(detail_scroll)

	detail_grid = GridContainer.new()
	detail_grid.columns = 2
	detail_grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	detail_grid.add_theme_constant_override("h_separation", 10)
	detail_grid.add_theme_constant_override("v_separation", 10)
	detail_scroll.add_child(detail_grid)


func _apply_after_parent_ready() -> void:
	var subtitle = get_parent().get("subtitle_label")
	if subtitle is Label:
		subtitle.text = "V0-03 · Sorting Workspace"
	_ensure_piece_bindings()
	_refresh_ui()
	_layout_ui()


func _on_progress_changed(_solved_count: int, _total_count: int) -> void:
	var generation_changed: bool = _ensure_piece_bindings()
	if not generation_changed:
		_sync_solved_locations()
	_refresh_ui()


func _ensure_piece_bindings() -> bool:
	if board == null:
		return false
	var current_ids: Array = []
	for piece in board.pieces:
		if is_instance_valid(piece):
			current_ids.append(piece.get_instance_id())
	if current_ids == bound_piece_instance_ids:
		return false

	bound_piece_instance_ids = current_ids
	state.reset(board.pieces.size())
	return_positions.clear()
	drag_origin_positions.clear()
	tray_window_positions.clear()
	active_tray_id = ""
	detail_user_positioned = false
	_close_tray_detail()
	for piece in board.pieces:
		if is_instance_valid(piece) and not piece.picked.is_connected(_on_piece_picked):
			piece.picked.connect(_on_piece_picked)
	return true


func _sync_solved_locations() -> void:
	for piece in board.pieces:
		if is_instance_valid(piece) and piece.solved:
			state.mark_piece_on_board(piece.piece_index)


func _on_piece_picked(piece) -> void:
	drag_origin_positions.clear()
	if piece == null or piece.solved or not piece.visible:
		return
	for value in _group_members_for_piece(int(piece.piece_index)):
		var piece_index := int(value)
		var member = board.pieces[piece_index]
		drag_origin_positions[piece_index] = Vector2(member.position)


func _on_sort_toggled(enabled: bool) -> void:
	if not enabled:
		_close_tray_detail()
	panel.visible = enabled and active_tray_id.is_empty()
	_refresh_ui()
	_layout_ui()


func _on_new_tray_submitted(_submitted_text: String) -> void:
	_create_tray_from_field()


func _create_tray_from_field() -> void:
	var tray_id: String = state.create_tray(new_tray_name.text)
	new_tray_name.clear()
	_refresh_ui()
	_open_tray(tray_id)


func _open_tray(tray_id: String) -> void:
	if not state.tray_ids().has(tray_id):
		return
	active_tray_id = tray_id
	panel.visible = false
	detail_panel.visible = true
	detail_name_edit.text = state.tray_name(tray_id)
	detail_user_positioned = tray_window_positions.has(tray_id)
	_refresh_tray_detail()
	_layout_ui()
	if detail_user_positioned:
		detail_panel.position = _clamp_detail_position(Vector2(tray_window_positions[tray_id]))


func _close_tray_detail() -> void:
	_finish_detail_drag()
	if detail_panel != null:
		detail_panel.visible = false
	active_tray_id = ""
	detail_user_positioned = false
	if panel != null and sort_button != null:
		panel.visible = sort_button.button_pressed


func _on_rename_submitted(_submitted_text: String) -> void:
	_rename_active_tray()


func _rename_active_tray() -> void:
	if active_tray_id.is_empty():
		return
	if state.rename_tray(active_tray_id, detail_name_edit.text):
		detail_name_edit.text = state.tray_name(active_tray_id)
		_refresh_ui()
		_refresh_tray_detail()


func _on_detail_drag_handle_gui_input(event: InputEvent) -> void:
	if detail_panel == null or not detail_panel.visible:
		return
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
			_begin_detail_drag(-1, event.position + detail_drag_handle.global_position)
	elif event is InputEventScreenTouch:
		if event.pressed:
			_begin_detail_drag(event.index, event.position)


func _begin_detail_drag(pointer_id: int, pointer_screen_position: Vector2) -> void:
	detail_dragging = true
	detail_drag_pointer_id = pointer_id
	detail_drag_offset = pointer_screen_position - detail_panel.position
	detail_user_positioned = true
	get_viewport().set_input_as_handled()


func _move_detail_panel(pointer_screen_position: Vector2) -> void:
	if not detail_dragging:
		return
	detail_panel.position = _clamp_detail_position(pointer_screen_position - detail_drag_offset)
	if not active_tray_id.is_empty():
		tray_window_positions[active_tray_id] = detail_panel.position


func _finish_detail_drag() -> void:
	if detail_dragging and not active_tray_id.is_empty() and detail_panel != null:
		tray_window_positions[active_tray_id] = detail_panel.position
	detail_dragging = false
	detail_drag_pointer_id = -999
	detail_drag_offset = Vector2.ZERO


func try_store_drag_release(piece) -> bool:
	if (
		active_tray_id.is_empty()
		or detail_panel == null
		or not detail_panel.visible
		or piece == null
		or not is_instance_valid(piece)
	):
		drag_origin_positions.clear()
		return false

	var drop_position: Vector2 = Vector2(piece.last_pointer_screen_position)
	if not detail_panel.get_global_rect().has_point(drop_position):
		drag_origin_positions.clear()
		return false

	var members: Array = _group_members_for_piece(int(piece.piece_index))
	if members.is_empty():
		drag_origin_positions.clear()
		return false

	for value in members:
		var piece_index := int(value)
		var member = board.pieces[piece_index]
		return_positions[piece_index] = Vector2(drag_origin_positions.get(piece_index, member.position))

	if not state.assign_pieces_to_tray(members, active_tray_id):
		drag_origin_positions.clear()
		return false

	for value in members:
		_stash_piece(int(value))

	drag_origin_positions.clear()
	_refresh_ui()
	_refresh_tray_detail()
	return true


func _group_members_for_piece(piece_index: int) -> Array:
	if piece_index < 0 or piece_index >= board.pieces.size():
		return []
	var anchor = board.pieces[piece_index]
	if not is_instance_valid(anchor) or anchor.solved or not anchor.visible:
		return []

	var cluster_id := int(board.cluster_for_piece.get(piece_index, piece_index))
	var raw_members = board.cluster_members.get(cluster_id, [piece_index])
	if not (raw_members is Array):
		return []

	var members: Array = []
	for value in raw_members:
		var member_index := int(value)
		if member_index < 0 or member_index >= board.pieces.size():
			return []
		var member = board.pieces[member_index]
		if (
			not is_instance_valid(member)
			or member.solved
			or not member.visible
			or state.location_for(member_index) != SortingWorkspaceStateScript.LOCATION_LOOSE
		):
			return []
		members.append(member_index)
	return members


func _return_group_to_loose(member_indexes: Array) -> void:
	if member_indexes.is_empty():
		return
	var translation: Vector2 = _safe_group_return_translation(member_indexes)
	board.z_counter += 1
	var group_z: int = board.z_counter
	for value in member_indexes:
		var piece_index := int(value)
		if piece_index < 0 or piece_index >= board.pieces.size():
			continue
		var piece = board.pieces[piece_index]
		var saved_position: Vector2 = Vector2(return_positions.get(piece_index, board.navigation_rect.position + Vector2(24.0, 100.0)))
		state.move_piece_to_loose(piece_index)
		piece.position = saved_position + translation
		piece.visible = true
		piece.input_pickable = true
		piece.z_index = group_z
		return_positions.erase(piece_index)
	_refresh_ui()
	_refresh_tray_detail()


func _safe_group_return_translation(member_indexes: Array) -> Vector2:
	var bounds := Rect2()
	var has_bounds := false
	for value in member_indexes:
		var piece_index := int(value)
		if piece_index < 0 or piece_index >= board.pieces.size():
			continue
		var piece = board.pieces[piece_index]
		var saved_position: Vector2 = Vector2(return_positions.get(piece_index, board.navigation_rect.position + Vector2(24.0, 100.0)))
		var piece_rect := Rect2(saved_position, Vector2(piece.piece_size))
		if not has_bounds:
			bounds = piece_rect
			has_bounds = true
		else:
			bounds = bounds.merge(piece_rect)
	if not has_bounds:
		return Vector2.ZERO

	var nav: Rect2 = board.navigation_rect
	var workspace := Rect2(nav.position + Vector2(18.0, 86.0), Vector2(maxf(1.0, nav.size.x - 36.0), maxf(1.0, nav.size.y - 154.0)))
	var max_x := maxf(workspace.position.x, workspace.end.x - bounds.size.x)
	var max_y := maxf(workspace.position.y, workspace.end.y - bounds.size.y)
	var target_position := Vector2(clampf(bounds.position.x, workspace.position.x, max_x), clampf(bounds.position.y, workspace.position.y, max_y))
	var candidate_rect := Rect2(target_position, bounds.size)
	var exclusion: Rect2 = board.board_rect.grow(12.0)
	if not candidate_rect.intersects(exclusion):
		return target_position - bounds.position

	var candidates: Array[Vector2] = [
		Vector2(exclusion.position.x - 18.0 - bounds.size.x, target_position.y),
		Vector2(exclusion.end.x + 18.0, target_position.y),
		Vector2(target_position.x, exclusion.position.y - 18.0 - bounds.size.y),
		Vector2(target_position.x, exclusion.end.y + 18.0),
	]
	for candidate in candidates:
		var test_rect := Rect2(candidate, bounds.size)
		if _rect_inside(test_rect, workspace) and not test_rect.intersects(exclusion):
			return candidate - bounds.position
	return target_position - bounds.position


func _rect_inside(rect: Rect2, outer: Rect2) -> bool:
	return rect.position.x >= outer.position.x and rect.position.y >= outer.position.y and rect.end.x <= outer.end.x and rect.end.y <= outer.end.y


func _stash_piece(piece_index: int) -> void:
	if piece_index < 0 or piece_index >= board.pieces.size():
		return
	var piece = board.pieces[piece_index]
	if not is_instance_valid(piece):
		return
	piece.visible = false
	piece.input_pickable = false
	piece.position = STASH_ORIGIN - Vector2(float(piece_index) * 64.0, 0.0)


func _restash_tray_pieces() -> void:
	for tray_id in state.tray_ids():
		for piece_index in state.tray_piece_indexes(tray_id):
			_stash_piece(int(piece_index))


func _refresh_ui() -> void:
	if sort_button == null:
		return
	_sync_solved_locations()
	var tray_ids: Array[String] = state.tray_ids()
	var loose_count: int = state.count_in_location(SortingWorkspaceStateScript.LOCATION_LOOSE)
	var tray_piece_count: int = state.total_tray_piece_count()
	var board_count: int = state.count_in_location(SortingWorkspaceStateScript.LOCATION_BOARD)
	sort_button.text = "Sort · %d tray%s" % [tray_ids.size(), "" if tray_ids.size() == 1 else "s"]
	summary_label.text = "Loose %d · Trays %d · Board %d" % [loose_count, tray_piece_count, board_count]

	_clear_container(tray_list_box)
	if tray_ids.is_empty():
		var empty_label := Label.new()
		empty_label.text = "No trays yet. Name one above and create it."
		empty_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		empty_label.modulate = Color(1.0, 1.0, 1.0, 0.52)
		tray_list_box.add_child(empty_label)
	else:
		for tray_id in tray_ids:
			var tray_button := Button.new()
			var count: int = state.tray_piece_count(tray_id)
			tray_button.text = "%s    ·    %d piece%s" % [state.tray_name(tray_id), count, "" if count == 1 else "s"]
			tray_button.alignment = HORIZONTAL_ALIGNMENT_LEFT
			tray_button.custom_minimum_size = Vector2(0.0, 48.0)
			tray_button.pressed.connect(_open_tray.bind(tray_id))
			tray_list_box.add_child(tray_button)
	if not active_tray_id.is_empty() and tray_ids.has(active_tray_id):
		_refresh_tray_detail()


func _refresh_tray_detail() -> void:
	if active_tray_id.is_empty() or not state.tray_ids().has(active_tray_id):
		return
	var piece_count: int = state.tray_piece_count(active_tray_id)
	detail_title.text = "%s · %d piece%s" % [state.tray_name(active_tray_id), piece_count, "" if piece_count == 1 else "s"]
	_clear_container(detail_grid)
	var groups: Array = _tray_groups(active_tray_id)
	if groups.is_empty():
		var empty_label := Label.new()
		empty_label.text = "Empty tray — drag a piece here."
		empty_label.modulate = Color(1.0, 1.0, 1.0, 0.58)
		detail_grid.add_child(empty_label)
		return

	for group_value in groups:
		var members: Array = group_value
		var piece_nodes: Array = []
		for value in members:
			var piece_index := int(value)
			if piece_index >= 0 and piece_index < board.pieces.size():
				piece_nodes.append(board.pieces[piece_index])
		var card := PanelContainer.new()
		card.custom_minimum_size = Vector2(150.0, 146.0)
		detail_grid.add_child(card)
		var card_box := VBoxContainer.new()
		card_box.alignment = BoxContainer.ALIGNMENT_CENTER
		card_box.add_theme_constant_override("separation", 4)
		card.add_child(card_box)
		var preview = TrayItemPreviewScript.new()
		card_box.add_child(preview)
		preview.configure(piece_nodes)
		var kind_label := Label.new()
		kind_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		kind_label.text = "Single piece" if members.size() == 1 else "%d-piece cluster" % members.size()
		kind_label.modulate = Color(1.0, 1.0, 1.0, 0.7)
		card_box.add_child(kind_label)
		var return_button := Button.new()
		return_button.text = "Return to Loose"
		return_button.pressed.connect(_return_group_to_loose.bind(members.duplicate()))
		card_box.add_child(return_button)


func _tray_groups(tray_id: String) -> Array:
	var grouped: Dictionary = {}
	var group_order: Array[int] = []
	for value in state.tray_piece_indexes(tray_id):
		var piece_index := int(value)
		var cluster_id := int(board.cluster_for_piece.get(piece_index, piece_index))
		if not grouped.has(cluster_id):
			grouped[cluster_id] = []
			group_order.append(cluster_id)
		var members: Array = grouped[cluster_id]
		members.append(piece_index)
		grouped[cluster_id] = members
	var result: Array = []
	for cluster_id in group_order:
		result.append(grouped[cluster_id])
	return result


func _clear_container(container: Node) -> void:
	if container == null:
		return
	for child in container.get_children():
		container.remove_child(child)
		child.queue_free()


func _schedule_layout_refresh() -> void:
	if reflow_settle_timer != null:
		reflow_settle_timer.start()


func _after_window_reflow() -> void:
	_restash_tray_pieces()
	_layout_ui()


func _viewport_size() -> Vector2:
	var viewport_size := Vector2(get_window().content_scale_size)
	if viewport_size.x <= 1.0 or viewport_size.y <= 1.0:
		viewport_size = get_viewport().get_visible_rect().size
	return viewport_size


func _clamp_detail_position(candidate: Vector2) -> Vector2:
	var viewport_size := _viewport_size()
	var max_x := maxf(FLOATING_MARGIN, viewport_size.x - detail_panel.size.x - FLOATING_MARGIN)
	var max_y := maxf(FLOATING_MARGIN, viewport_size.y - detail_panel.size.y - FLOATING_MARGIN)
	return Vector2(
		clampf(candidate.x, FLOATING_MARGIN, max_x),
		clampf(candidate.y, FLOATING_MARGIN, max_y)
	)


func _layout_ui() -> void:
	if ui_layer == null:
		return
	var viewport_size := _viewport_size()
	var width := maxf(viewport_size.x, 1.0)
	var height := maxf(viewport_size.y, 1.0)
	var margin := 24.0
	var portrait := height > width
	sort_button.position = Vector2(margin, 92.0)

	if portrait:
		var portrait_panel_width := minf(PANEL_WIDTH, width - margin * 2.0)
		var portrait_panel_height := minf(PANEL_HEIGHT, height - 210.0)
		panel.size = Vector2(portrait_panel_width, portrait_panel_height)
		panel.position = Vector2((width - portrait_panel_width) * 0.5, maxf(150.0, height - portrait_panel_height - 96.0))
		var portrait_detail_width := minf(DETAIL_WIDTH, width - FLOATING_MARGIN * 2.0)
		var portrait_detail_height := minf(DETAIL_HEIGHT, maxf(300.0, height * 0.52))
		detail_panel.size = Vector2(portrait_detail_width, portrait_detail_height)
		if not detail_user_positioned:
			detail_panel.position = Vector2((width - portrait_detail_width) * 0.5, maxf(96.0, (height - portrait_detail_height) * 0.48))
		detail_grid.columns = 2
	else:
		panel.size = Vector2(PANEL_WIDTH, minf(PANEL_HEIGHT, height - 180.0))
		panel.position = Vector2(margin, 148.0)
		var landscape_detail_width := minf(DETAIL_WIDTH, maxf(330.0, width * 0.34))
		var landscape_detail_height := minf(DETAIL_HEIGHT, maxf(300.0, height - 172.0))
		detail_panel.size = Vector2(landscape_detail_width, landscape_detail_height)
		if not detail_user_positioned:
			detail_panel.position = Vector2(width - FLOATING_MARGIN - landscape_detail_width, maxf(86.0, (height - landscape_detail_height) * 0.5))
		detail_grid.columns = 2

	if detail_panel.visible:
		detail_panel.position = _clamp_detail_position(detail_panel.position)
		if detail_user_positioned and not active_tray_id.is_empty():
			tray_window_positions[active_tray_id] = detail_panel.position
