extends "res://scripts/analytics_sorting_workspace.gd"

# A presentation adapter over the unchanged tray, selection and rail controllers.
const Paper = preload("res://scripts/watercolor_gameplay_style.gd")
var paper_manager_scroll: ScrollContainer
var paper_ready := false


func _build_ui() -> void:
	super._build_ui()
	var box := panel.get_child(0)
	panel.remove_child(box)
	paper_manager_scroll = ScrollContainer.new()
	paper_manager_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	panel.add_child(paper_manager_scroll)
	paper_manager_scroll.add_child(box)
	box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	box.add_theme_constant_override("separation", 14)
	tray_scroll.custom_minimum_size.y = 96
	var title := _find_label_with_text(panel, "Trays")
	if title != null:
		title.reparent(manager_close_button.get_parent())
		title.get_parent().move_child(title, 1)
		title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	manager_drag_handle.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
	manager_drag_handle.custom_minimum_size = Vector2(88, 88)
	# Keep the original draggable handle and input binding; compose one quiet header.
	var header := close_detail_button.get_parent()
	detail_drag_handle.reparent(header)
	header.move_child(detail_drag_handle, 0)
	detail_drag_handle.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
	detail_drag_handle.custom_minimum_size = Vector2(88, 88)
	detail_title.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	detail_title.custom_minimum_size.x = 0
	detail_title.clip_text = true
	detail_title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	paper_ready = true
	_style_paper_windows()


func _refresh_ui() -> void:
	super._refresh_ui()
	if paper_ready:
		_style_paper_windows()


func _refresh_tray_detail() -> void:
	super._refresh_tray_detail()
	if paper_ready:
		_style_paper_windows()


func _refresh_selection_controls() -> void:
	super._refresh_selection_controls()
	if paper_ready:
		Paper.mark_button(selection_mode_button, Paper.Mark.SELECT)
		Paper.mark_button(clear_selection_button, Paper.Mark.CLEAR)
		selection_count_label.modulate = Color.WHITE


func _refresh_layout_mode_controls() -> void:
	super._refresh_layout_mode_controls()
	if paper_ready:
		_restore_dock_ink()


func _apply_detail_collapsed_state() -> void:
	super._apply_detail_collapsed_state()
	if paper_ready and not active_tray_id.is_empty():
		var collapsed: bool = state.tray_is_collapsed(active_tray_id)
		Paper.mark_button(collapse_detail_button, Paper.Mark.EXPAND if collapsed else Paper.Mark.COLLAPSE)
		detail_panel.custom_minimum_size = Vector2(320, 124 if collapsed else 330)
		if collapsed:
			detail_panel.size.y = 124


func _style_paper_windows() -> void:
	for root in [panel, detail_panel, rail_panel]:
		if root != null:
			Paper.apply_tree(root)
	for button in [manager_close_button, close_detail_button, collapse_detail_button, rename_button, add_tray_button, selection_mode_button, clear_selection_button]:
		button.custom_minimum_size = Vector2(88, 88)
	Paper.mark_button(manager_close_button, Paper.Mark.CLOSE)
	Paper.mark_button(close_detail_button, Paper.Mark.CLOSE)
	Paper.mark_button(rename_button, Paper.Mark.RENAME)
	Paper.mark_button(add_tray_button, Paper.Mark.ADD)
	Paper.mark_button(selection_mode_button, Paper.Mark.SELECT)
	Paper.mark_button(clear_selection_button, Paper.Mark.CLEAR)
	manager_grip_icon.texture = Paper.icon(Paper.Mark.GRIP)
	manager_grip_icon.modulate = Paper.SOFT
	for child in detail_drag_handle.get_children():
		if child is TextureRect:
			child.texture = Paper.icon(Paper.Mark.GRIP)
			child.modulate = Paper.SOFT
	for row in tray_list_box.get_children():
		for child in row.get_children():
			if child is Button:
				if child.tooltip_text.begins_with("Move tray up"):
					Paper.mark_button(child, Paper.Mark.UP)
				elif child.tooltip_text.begins_with("Move tray down"):
					Paper.mark_button(child, Paper.Mark.DOWN)
				elif child.tooltip_text.begins_with("Delete tray"):
					Paper.mark_button(child, Paper.Mark.DELETE)
				else:
					child.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
					child.clip_text = true
					continue
				child.custom_minimum_size = Vector2(80, 88)
	for label in [detail_title, rail_title]:
		label.add_theme_font_override("font", Paper.SERIF)
		label.add_theme_font_size_override("font_size", 30)
	var title := _find_label_with_text(panel, "Trays")
	if title != null:
		title.add_theme_font_override("font", Paper.SERIF)
		title.add_theme_font_size_override("font_size", 32)
	summary_label.add_theme_font_size_override("font_size", 22)
	summary_label.add_theme_color_override("font_color", Paper.SOFT)
	rail_title.text = "Loose pieces"
	for canvas in [tray_play_canvas, rail_canvas]:
		if canvas != null:
			canvas.presentation_surface = Paper.surface(true, 0)
			canvas.queue_redraw()
			if canvas.empty_hint != null:
				canvas.empty_hint.modulate = Color.WHITE
				canvas.empty_hint.add_theme_color_override("font_color", Paper.SOFT)
				canvas.empty_hint.add_theme_font_size_override("font_size", 22)
	_apply_detail_collapsed_state()
	_restore_dock_ink()


func _restore_dock_ink() -> void:
	var main := get_parent()
	if main != null and main.has_method("_style_album_primary_actions"):
		main._style_album_primary_actions()


func _layout_ui() -> void:
	super._layout_ui()
	if not paper_ready:
		return
	var view := _viewport_size()
	var safe := AppUiMetrics.safe_area_insets(view)
	var top := AppUiMetrics.top_bar_rect(view).end.y + 24
	var bottom := AppUiMetrics.dock_rect(view).position.y - 24
	if view.y > view.x and loose_layout_mode == LAYOUT_RAIL:
		bottom = rail_panel.position.y - 18
	var area := Rect2(Vector2(safe.x + 24, top), Vector2(view.x - safe.x - safe.z - 48, maxf(330, bottom - top)))
	panel.custom_minimum_size = Vector2(0, 0)
	panel.size = Vector2(minf(620, area.size.x), minf(540, area.size.y))
	if not manager_user_positioned:
		panel.position = Vector2(area.position.x + (area.size.x - panel.size.x) * 0.5, area.end.y - panel.size.y)
	else:
		panel.position = manager_window_position.clamp(area.position, area.end - panel.size)
	var collapsed: bool = not active_tray_id.is_empty() and state.tray_is_collapsed(active_tray_id)
	detail_panel.custom_minimum_size = Vector2(320, 124 if collapsed else 330)
	detail_panel.size = Vector2(minf(640, area.size.x), 124 if collapsed else minf(570, area.size.y))
	if not detail_user_positioned:
		detail_panel.position = Vector2(area.position.x + (area.size.x - detail_panel.size.x) * 0.5, area.position.y + (area.size.y - detail_panel.size.y) * 0.5)
	else:
		detail_panel.position = detail_panel.position.clamp(area.position, area.end - detail_panel.size)


func _layout_loose_piece_rail() -> void:
	super._layout_loose_piece_rail()
	if not paper_ready or loose_layout_mode != LAYOUT_RAIL:
		return
	var view := _viewport_size()
	var safe := AppUiMetrics.safe_area_insets(view)
	var top := AppUiMetrics.top_bar_rect(view).end.y + 18
	var bottom := AppUiMetrics.dock_rect(view).position.y - 18
	if view.y > view.x:
		rail_panel.size = Vector2(view.x - safe.x - safe.z - 48, 210)
		rail_panel.position = Vector2(safe.x + 24, bottom - rail_panel.size.y)
	else:
		rail_panel.size = Vector2(270, maxf(210, bottom - top))
		rail_panel.position = Vector2(safe.x + 24, top)
	_configure_rail_scrolling()


func _configure_rail_scrolling() -> void:
	if not paper_ready or rail_panel == null or rail_canvas == null:
		super._configure_rail_scrolling()
		return
	# Retain the inherited flow and scroll policy; measure this skin's header
	# rather than using the legacy fixed 48-unit header allowance.
	var box := rail_panel.get_child(0) as VBoxContainer
	var header := box.get_child(0) as HBoxContainer
	var frame := rail_panel.get_theme_stylebox("panel")
	var header_height := header.get_combined_minimum_size().y
	rail_header_extent = frame.get_minimum_size().y + header_height + box.get_theme_constant("separation") + rail_scroll.get_h_scroll_bar().get_combined_minimum_size().y
	rail_side_extent = frame.get_minimum_size().x + rail_scroll.get_v_scroll_bar().get_combined_minimum_size().x
	super._configure_rail_scrolling()
