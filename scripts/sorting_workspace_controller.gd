class_name SortingWorkspaceController
extends Node

const SortingWorkspaceStateScript = preload("res://scripts/sorting_workspace_state.gd")
const TrayPlayCanvasScript = preload("res://scripts/tray_play_canvas.gd")
const STASH_ORIGIN := Vector2(-1000000.0, -1000000.0)
const PANEL_WIDTH := 360.0
const PANEL_HEIGHT := 440.0
const DETAIL_WIDTH := 460.0
const DETAIL_HEIGHT := 520.0
const REFLOW_SETTLE_SECONDS := 0.09
const FLOATING_MARGIN := 16.0

var board = null
var state = SortingWorkspaceStateScript.new()
var bound_piece_instance_ids: Array = []
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
var play_hint_label: Label
var tray_play_canvas = null
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
				_move_detail_panel(get_viewport().get_mouse_position())
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
	note_label.text = "Each tray is a mini puzzle table. Open one and drag pieces in to keep playing there."
	note_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	note_label.modulate = Color(1.0, 1.0, 1.0, 0.58)
	note_label.add_theme_font_size_override("font_size", 12)
	box.add_child(note_label)
	_build_tray_detail_window()


func _build_tray_detail_window() -> void:
	detail_panel = PanelContainer.new()
	detail_panel.visible = false
	detail_panel.custom_minimum_size = Vector2(320.0, 300.0)
	detail_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	ui_layer.add_child(detail_panel)

	var floating_style := StyleBoxFlat.new()
	floating_style.bg_color = Color(0.055, 0.06, 0.075, 0.76)
	floating_style.border_color = Color(1.0, 1.0, 1.0, 0.17)
	floating_style.set_border_width_all(1)
	floating_style.set_corner_radius_all(14)
	floating_style.shadow_color = Color(0.0, 0.0, 0.0, 0.32)
	floating_style.shadow_size = 12
	floating_style.content_margin_left = 12.0
	floating_style.content_margin_top = 9.0
	floating_style.content_margin_right = 12.0
	floating_style.content_margin_bottom = 12.0
	detail_panel.add_theme_stylebox_override("panel", floating_style)

	var detail_box := VBoxContainer.new()
	detail_box.add_theme_constant_override("separation", 7)
	detail_panel.add_child(detail_box)

	detail_drag_handle = Label.new()
	detail_drag_handle.text = "⋮⋮  Drag tray"
	detail_drag_handle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	detail_drag_handle.custom_minimum_size = Vector2(0.0, 28.0)
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
	detail_title.add_theme_font_size_override("font_size", 20)
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

	play_hint_label = Label.new()
	play_hint_label.text = "Drag in · play and snap here · drag out"
	play_hint_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	play_hint_label.custom_minimum_size = Vector2(0.0, 28.0)
	play_hint_label.modulate = Color(1.0, 1.0, 1.0, 0.62)
	play_hint_label.add_theme_font_size_override("font_size", 13)
	detail_box.add_child(play_hint_label)

	tray_play_canvas = TrayPlayCanvasScript.new()
	tray_play_canvas.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	tray_play_canvas.size_flags_vertical = Control.SIZE_EXPAND_FILL
	tray_play_canvas.custom_minimum_size = Vector2(280.0, 190.0)
	tray_play_canvas.group_dragged_out.connect(_on_tray_group_dragged_out)
	tray_play_canvas.tray_cluster_changed.connect(_on_tray_cluster_changed)
	detail_box.add_child(tray_play_canvas)


func _apply_after_parent_ready() -> void:
	var subtitle = get_parent().get("subtitle_label")
	if subtitle is Label:
		subtitle.text = "V0-03 · Playable Sorting Trays"
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
	tray_window_positions.clear()
	active_tray_id = ""
	detail_user_positioned = false
	_close_tray_detail()
	return true


func _sync_solved_locations() -> void:
	for piece in board.pieces:
		if is_instance_valid(piece) and piece.solved:
			state.mark_piece_on_board(piece.piece_index)


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
	_layout_ui()
	if detail_user_positioned:
		detail_panel.position = _clamp_detail_position(
			Vector2(tray_window_positions[tray_id])
		)
	tray_play_canvas.configure(board, state, tray_id)
	_refresh_tray_detail()


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
			_begin_detail_drag(-1, get_viewport().get_mouse_position())
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
	detail_panel.position = _clamp_detail_position(
		pointer_screen_position - detail_drag_offset
	)
	if not active_tray_id.is_empty():
		tray_window_positions[active_tray_id] = detail_panel.position


func _finish_detail_drag() -> void:
	if (
		detail_dragging
		and not active_tray_id.is_empty()
		and detail_panel != null
	):
		tray_window_positions[active_tray_id] = detail_panel.position
	detail_dragging = false
	detail_drag_pointer_id = -999
	detail_drag_offset = Vector2.ZERO


func try_store_drag_release(piece) -> bool:
	if (
		active_tray_id.is_empty()
		or tray_play_canvas == null
		or not detail_panel.visible
		or piece == null
		or not is_instance_valid(piece)
	):
		return false

	var drop_position: Vector2 = Vector2(piece.last_pointer_screen_position)
	if not tray_play_canvas.get_global_rect().has_point(drop_position):
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


func _loose_group_members_for_piece(piece_index: int) -> Array:
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
			or state.location_for(member_index)
				!= SortingWorkspaceStateScript.LOCATION_LOOSE
		):
			return []
		members.append(member_index)
	return members


func _on_tray_group_dragged_out(
	member_indexes: Array,
	anchor_piece_index: int,
	screen_position: Vector2,
	anchor_pointer_offset: Vector2
) -> void:
	if member_indexes.is_empty():
		return
	if anchor_piece_index < 0 or anchor_piece_index >= board.pieces.size():
		return

	var scale_factor: float = maxf(tray_play_canvas.visual_scale(), 0.01)
	var pointer_world: Vector2 = (
		get_viewport().get_canvas_transform().affine_inverse() * screen_position
	)
	var anchor_world_position := (
		pointer_world - anchor_pointer_offset / scale_factor
	)
	var anchor_piece = board.pieces[anchor_piece_index]

	board.z_counter += 1
	var group_z: int = board.z_counter
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

	# The group is now back on the main puzzle surface. Settle this same release
	# through the existing cluster/board snap rules so dragging out feels like one
	# continuous gesture rather than requiring an extra jiggle on the main table.
	if board.has_method("_merge_nearby_clusters"):
		var cluster_id := int(
			board.cluster_for_piece.get(anchor_piece_index, anchor_piece_index)
		)
		cluster_id = int(board._merge_nearby_clusters(cluster_id))
		if board.has_method("_snap_cluster_to_board_if_close"):
			board._snap_cluster_to_board_if_close(cluster_id)

	tray_play_canvas.refresh()
	_refresh_ui()
	_refresh_tray_detail()


func _on_tray_cluster_changed() -> void:
	_refresh_ui()
	_refresh_tray_detail()


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
	var loose_count: int = state.count_in_location(
		SortingWorkspaceStateScript.LOCATION_LOOSE
	)
	var tray_piece_count: int = state.total_tray_piece_count()
	var board_count: int = state.count_in_location(
		SortingWorkspaceStateScript.LOCATION_BOARD
	)
	sort_button.text = "Sort · %d tray%s" % [
		tray_ids.size(),
		"" if tray_ids.size() == 1 else "s",
	]
	summary_label.text = "Loose %d · Trays %d · Board %d" % [
		loose_count,
		tray_piece_count,
		board_count,
	]

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
			tray_button.text = "%s    ·    %d piece%s" % [
				state.tray_name(tray_id),
				count,
				"" if count == 1 else "s",
			]
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
	detail_title.text = "%s · %d piece%s" % [
		state.tray_name(active_tray_id),
		piece_count,
		"" if piece_count == 1 else "s",
	]
	if tray_play_canvas != null:
		tray_play_canvas.refresh()


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
	if tray_play_canvas != null and not active_tray_id.is_empty():
		tray_play_canvas.refresh()


func _viewport_size() -> Vector2:
	var viewport_size := Vector2(get_window().content_scale_size)
	if viewport_size.x <= 1.0 or viewport_size.y <= 1.0:
		viewport_size = get_viewport().get_visible_rect().size
	return viewport_size


func _clamp_detail_position(candidate: Vector2) -> Vector2:
	var viewport_size := _viewport_size()
	var max_x := maxf(
		FLOATING_MARGIN,
		viewport_size.x - detail_panel.size.x - FLOATING_MARGIN
	)
	var max_y := maxf(
		FLOATING_MARGIN,
		viewport_size.y - detail_panel.size.y - FLOATING_MARGIN
	)
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
		panel.position = Vector2(
			(width - portrait_panel_width) * 0.5,
			maxf(150.0, height - portrait_panel_height - 96.0)
		)
		var portrait_detail_width := minf(
			DETAIL_WIDTH,
			width - FLOATING_MARGIN * 2.0
		)
		var portrait_detail_height := minf(
			DETAIL_HEIGHT,
			maxf(320.0, height * 0.54)
		)
		detail_panel.size = Vector2(
			portrait_detail_width,
			portrait_detail_height
		)
		if not detail_user_positioned:
			detail_panel.position = Vector2(
				(width - portrait_detail_width) * 0.5,
				maxf(96.0, (height - portrait_detail_height) * 0.48)
			)
	else:
		panel.size = Vector2(
			PANEL_WIDTH,
			minf(PANEL_HEIGHT, height - 180.0)
		)
		panel.position = Vector2(margin, 148.0)
		var landscape_detail_width := minf(
			DETAIL_WIDTH,
			maxf(350.0, width * 0.36)
		)
		var landscape_detail_height := minf(
			DETAIL_HEIGHT,
			maxf(340.0, height - 150.0)
		)
		detail_panel.size = Vector2(
			landscape_detail_width,
			landscape_detail_height
		)
		if not detail_user_positioned:
			detail_panel.position = Vector2(
				width - FLOATING_MARGIN - landscape_detail_width,
				maxf(72.0, (height - landscape_detail_height) * 0.5)
			)

	if detail_panel.visible:
		detail_panel.position = _clamp_detail_position(detail_panel.position)
		if detail_user_positioned and not active_tray_id.is_empty():
			tray_window_positions[active_tray_id] = detail_panel.position
