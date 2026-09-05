class_name SortingWorkspaceController
extends Node

const SortingWorkspaceStateScript = preload("res://scripts/sorting_workspace_state.gd")
const STASH_ORIGIN := Vector2(-1000000.0, -1000000.0)
const PANEL_WIDTH := 330.0
const PANEL_HEIGHT := 360.0
const REFLOW_SETTLE_SECONDS := 0.09

var board = null
var state = SortingWorkspaceStateScript.new()
var bound_piece_instance_ids: Array = []
var return_positions: Dictionary = {}
var selected_piece_index := -1

var ui_layer: CanvasLayer
var sort_button: Button
var panel: PanelContainer
var summary_label: Label
var selected_label: Label
var move_to_tray_button: Button
var tray_title_label: Label
var tray_list: ItemList
var return_to_loose_button: Button
var note_label: Label
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
	sort_button.text = "Sort · 0"
	sort_button.toggle_mode = true
	sort_button.size = Vector2(116.0, 44.0)
	sort_button.tooltip_text = "Open the Sorting Workspace prototype"
	sort_button.toggled.connect(_on_sort_toggled)
	ui_layer.add_child(sort_button)

	panel = PanelContainer.new()
	panel.visible = false
	panel.custom_minimum_size = Vector2(PANEL_WIDTH, PANEL_HEIGHT)
	panel.size = Vector2(PANEL_WIDTH, PANEL_HEIGHT)
	ui_layer.add_child(panel)

	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 8)
	panel.add_child(box)

	var title := Label.new()
	title.text = "Sorting Workspace · foundation"
	title.add_theme_font_size_override("font_size", 19)
	box.add_child(title)

	summary_label = Label.new()
	summary_label.modulate = Color(1.0, 1.0, 1.0, 0.72)
	box.add_child(summary_label)

	selected_label = Label.new()
	selected_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	selected_label.custom_minimum_size = Vector2(0.0, 44.0)
	box.add_child(selected_label)

	move_to_tray_button = Button.new()
	move_to_tray_button.text = "Move selected → Tray 1"
	move_to_tray_button.pressed.connect(_move_selected_to_tray)
	box.add_child(move_to_tray_button)

	var separator := HSeparator.new()
	box.add_child(separator)

	tray_title_label = Label.new()
	tray_title_label.text = "Tray 1"
	tray_title_label.add_theme_font_size_override("font_size", 16)
	box.add_child(tray_title_label)

	tray_list = ItemList.new()
	tray_list.custom_minimum_size = Vector2(0.0, 142.0)
	tray_list.select_mode = ItemList.SELECT_SINGLE
	tray_list.item_selected.connect(_on_tray_item_selected)
	box.add_child(tray_list)

	return_to_loose_button = Button.new()
	return_to_loose_button.text = "Return tray piece → Loose"
	return_to_loose_button.pressed.connect(_return_selected_tray_piece)
	box.add_child(return_to_loose_button)

	note_label = Label.new()
	note_label.text = "Foundation: single loose pieces only. Joined clusters stay on the table."
	note_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	note_label.modulate = Color(1.0, 1.0, 1.0, 0.52)
	note_label.add_theme_font_size_override("font_size", 12)
	box.add_child(note_label)


func _apply_after_parent_ready() -> void:
	var subtitle = get_parent().get("subtitle_label")
	if subtitle is Label:
		subtitle.text = "V0-03 · Sorting Workspace foundation"
	_ensure_piece_bindings()
	_refresh_ui()
	_layout_ui()


func _on_progress_changed(_solved_count: int, _total_count: int) -> void:
	var generation_changed := _ensure_piece_bindings()
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
	selected_piece_index = -1

	for piece in board.pieces:
		if is_instance_valid(piece) and not piece.picked.is_connected(_on_piece_picked):
			piece.picked.connect(_on_piece_picked)

	return true


func _sync_solved_locations() -> void:
	for piece in board.pieces:
		if not is_instance_valid(piece):
			continue
		if piece.solved:
			state.mark_piece_on_board(piece.piece_index)
			if selected_piece_index == piece.piece_index:
				selected_piece_index = -1


func _on_piece_picked(piece) -> void:
	if piece == null or piece.solved or not piece.visible:
		return
	selected_piece_index = int(piece.piece_index)
	_refresh_ui()


func _on_sort_toggled(enabled: bool) -> void:
	panel.visible = enabled
	_refresh_ui()
	_layout_ui()


func _move_selected_to_tray() -> void:
	if not _can_move_piece_to_tray(selected_piece_index):
		_refresh_ui()
		return

	var piece = board.pieces[selected_piece_index]
	return_positions[selected_piece_index] = piece.position
	if not state.assign_piece_to_tray(selected_piece_index, state.default_tray_id()):
		return

	_stash_piece(selected_piece_index)
	selected_piece_index = -1
	_refresh_ui()


func _return_selected_tray_piece() -> void:
	var selected_items := tray_list.get_selected_items()
	if selected_items.is_empty():
		return

	var list_index := int(selected_items[0])
	var piece_index := int(tray_list.get_item_metadata(list_index))
	if piece_index < 0 or piece_index >= board.pieces.size():
		return

	var piece = board.pieces[piece_index]
	state.move_piece_to_loose(piece_index)
	piece.position = _safe_return_position(piece_index, piece)
	piece.visible = true
	piece.input_pickable = true
	board.z_counter += 1
	piece.z_index = board.z_counter
	selected_piece_index = piece_index
	return_positions.erase(piece_index)
	_refresh_ui()


func _can_move_piece_to_tray(piece_index: int) -> bool:
	if piece_index < 0 or piece_index >= board.pieces.size():
		return false
	if state.location_for(piece_index) != SortingWorkspaceStateScript.LOCATION_LOOSE:
		return false

	var piece = board.pieces[piece_index]
	if not is_instance_valid(piece) or piece.solved or not piece.visible:
		return false

	var cluster_id := int(board.cluster_for_piece.get(piece_index, piece_index))
	var members = board.cluster_members.get(cluster_id, [])
	return members is Array and members.size() == 1


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
	for piece_index in state.tray_piece_indexes(state.default_tray_id()):
		_stash_piece(int(piece_index))


func _safe_return_position(piece_index: int, piece) -> Vector2:
	var candidate: Vector2 = return_positions.get(piece_index, board.navigation_rect.position + Vector2(24.0, 100.0))
	var nav: Rect2 = board.navigation_rect
	var max_position := nav.end - piece.piece_size - Vector2(12.0, 12.0)
	candidate.x = clampf(candidate.x, nav.position.x + 12.0, maxf(nav.position.x + 12.0, max_position.x))
	candidate.y = clampf(candidate.y, nav.position.y + 82.0, maxf(nav.position.y + 82.0, max_position.y))

	if not Rect2(candidate, piece.piece_size).intersects(board.board_rect.grow(12.0)):
		return candidate

	var step := Vector2(maxf(piece.piece_size.x * 0.9, 42.0), maxf(piece.piece_size.y * 0.9, 42.0))
	var y := nav.position.y + 92.0
	while y <= max_position.y + 0.001:
		var x := nav.position.x + 18.0
		while x <= max_position.x + 0.001:
			var test_position := Vector2(x, y)
			if not Rect2(test_position, piece.piece_size).intersects(board.board_rect.grow(12.0)):
				return test_position
			x += step.x
		y += step.y

	return nav.position + Vector2(18.0, 92.0)


func _refresh_ui() -> void:
	if sort_button == null:
		return

	_sync_solved_locations()
	var tray_id := state.default_tray_id()
	var tray_pieces := state.tray_piece_indexes(tray_id)
	var loose_count := state.count_in_location(SortingWorkspaceStateScript.LOCATION_LOOSE)
	var board_count := state.count_in_location(SortingWorkspaceStateScript.LOCATION_BOARD)

	sort_button.text = "Sort · %d" % tray_pieces.size()
	summary_label.text = "Loose %d · Tray %d · Board %d" % [loose_count, tray_pieces.size(), board_count]
	tray_title_label.text = "%s · %d" % [state.tray_name(tray_id), tray_pieces.size()]

	if selected_piece_index < 0 or selected_piece_index >= board.pieces.size():
		selected_label.text = "Selected: none — touch or drag a loose piece first."
		move_to_tray_button.disabled = true
	else:
		var cluster_id := int(board.cluster_for_piece.get(selected_piece_index, selected_piece_index))
		var members = board.cluster_members.get(cluster_id, [])
		var cluster_size := members.size() if members is Array else 1
		selected_label.text = "Selected: Piece %03d · %s" % [
			selected_piece_index + 1,
			"single loose piece" if cluster_size == 1 else "joined cluster (%d pieces)" % cluster_size,
		]
		move_to_tray_button.disabled = not _can_move_piece_to_tray(selected_piece_index)

	tray_list.clear()
	for value in tray_pieces:
		var piece_index := int(value)
		var item_index := tray_list.add_item("Piece %03d" % (piece_index + 1))
		tray_list.set_item_metadata(item_index, piece_index)

	return_to_loose_button.disabled = tray_pieces.is_empty() or tray_list.get_selected_items().is_empty()


func _on_tray_item_selected(_index: int) -> void:
	return_to_loose_button.disabled = tray_list.get_selected_items().is_empty()


func _schedule_layout_refresh() -> void:
	if reflow_settle_timer != null:
		reflow_settle_timer.start()


func _after_window_reflow() -> void:
	_restash_tray_pieces()
	_layout_ui()


func _layout_ui() -> void:
	if ui_layer == null:
		return

	var viewport_size := Vector2(get_window().content_scale_size)
	if viewport_size.x <= 1.0 or viewport_size.y <= 1.0:
		viewport_size = get_viewport().get_visible_rect().size

	var width := maxf(viewport_size.x, 1.0)
	var height := maxf(viewport_size.y, 1.0)
	var margin := 24.0
	var portrait := height > width

	sort_button.position = Vector2(margin, 92.0)

	if portrait:
		var panel_width := minf(PANEL_WIDTH, width - margin * 2.0)
		panel.size = Vector2(panel_width, PANEL_HEIGHT)
		panel.position = Vector2(
			(width - panel_width) * 0.5,
			maxf(150.0, height - PANEL_HEIGHT - 118.0)
		)
	else:
		panel.size = Vector2(PANEL_WIDTH, minf(PANEL_HEIGHT, height - 180.0))
		panel.position = Vector2(margin, 148.0)
