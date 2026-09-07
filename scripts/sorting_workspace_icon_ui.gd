extends "res://scripts/sorting_workspace_controller.gd"

const Icons = preload("res://scripts/ui_icon_catalog.gd")
const AppUiMetrics = preload("res://scripts/app_ui_metrics.gd")

var grip_icon: TextureRect


func _build_ui() -> void:
	super._build_ui()

	Icons.apply_button(
		sort_button,
		Icons.IconId.TRAY,
		"Sorting trays",
		Vector2(44.0, 44.0),
		22
	)
	Icons.apply_button(
		add_tray_button,
		Icons.IconId.ADD,
		"Create tray",
		Vector2(40.0, 40.0),
		20
	)
	Icons.apply_button(
		close_detail_button,
		Icons.IconId.BACK,
		"Back",
		Vector2(40.0, 40.0),
		20
	)
	Icons.apply_button(
		rename_button,
		Icons.IconId.RENAME,
		"Rename tray",
		Vector2(40.0, 40.0),
		20
	)

	new_tray_name.placeholder_text = "Tray name"
	note_label.visible = false
	play_hint_label.visible = false

	_style_tray_manager_panel()
	_iconify_drag_handle()
	_simplify_panel_title()


func _style_tray_manager_panel() -> void:
	if panel == null:
		return
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.035, 0.04, 0.052, 0.94)
	style.border_color = Color(1.0, 1.0, 1.0, 0.12)
	style.set_border_width_all(1)
	style.set_corner_radius_all(18)
	style.shadow_color = Color(0.0, 0.0, 0.0, 0.30)
	style.shadow_size = 10
	style.content_margin_left = 14.0
	style.content_margin_top = 14.0
	style.content_margin_right = 14.0
	style.content_margin_bottom = 14.0
	panel.add_theme_stylebox_override("panel", style)


func _refresh_ui() -> void:
	super._refresh_ui()
	if sort_button == null:
		return
	sort_button.text = ""
	sort_button.icon = Icons.texture(Icons.IconId.TRAY)
	sort_button.tooltip_text = "%d tray%s" % [
		state.tray_ids().size(),
		"" if state.tray_ids().size() == 1 else "s",
	]


func _layout_ui() -> void:
	super._layout_ui()
	var viewport_size: Vector2 = _viewport_size()
	var width: float = maxf(viewport_size.x, 1.0)
	var dock: Rect2 = AppUiMetrics.dock_rect(viewport_size)

	# Sorting is one primary action in the same bottom app dock as Preview, Hint,
	# Lines, Fit, Zoom, and Reshuffle. It is no longer a detached left-side tool.
	sort_button.position = AppUiMetrics.dock_slot_position(
		viewport_size,
		AppUiMetrics.SLOT_SORT_X
	)

	# The tray list behaves like a contextual popover raised from the dock. The
	# live Tray itself remains a freely draggable workspace surface.
	if panel.visible:
		var panel_width: float = minf(PANEL_WIDTH, width - 32.0)
		var available_height: float = maxf(280.0, dock.position.y - 92.0)
		var panel_height: float = minf(PANEL_HEIGHT, available_height)
		panel.size = Vector2(panel_width, panel_height)
		panel.position = Vector2(
			clampf(
				dock.position.x,
				16.0,
				maxf(16.0, width - panel_width - 16.0)
			),
			maxf(76.0, dock.position.y - panel_height - 12.0)
		)


func _iconify_drag_handle() -> void:
	if detail_drag_handle == null:
		return
	detail_drag_handle.text = ""
	detail_drag_handle.tooltip_text = "Move tray"
	detail_drag_handle.custom_minimum_size = Vector2(0.0, 34.0)

	grip_icon = TextureRect.new()
	grip_icon.texture = Icons.texture(Icons.IconId.GRIP)
	grip_icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	grip_icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	grip_icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	grip_icon.anchor_left = 0.5
	grip_icon.anchor_top = 0.5
	grip_icon.anchor_right = 0.5
	grip_icon.anchor_bottom = 0.5
	grip_icon.offset_left = -15.0
	grip_icon.offset_top = -15.0
	grip_icon.offset_right = 15.0
	grip_icon.offset_bottom = 15.0
	detail_drag_handle.add_child(grip_icon)


func _simplify_panel_title() -> void:
	var title := _find_label_with_text(panel, "Sorting Workspace")
	if title != null:
		title.text = "Trays"


func _find_label_with_text(root: Node, target_text: String) -> Label:
	if root == null:
		return null
	for child in root.get_children():
		if child is Label and child.text == target_text:
			return child as Label
		var nested := _find_label_with_text(child, target_text)
		if nested != null:
			return nested
	return null
