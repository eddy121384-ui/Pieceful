extends "res://scripts/loose_piece_layout_workspace.gd"

const LayoutIcons = preload("res://scripts/ui_icon_catalog.gd")
const LayoutMetrics = preload("res://scripts/app_ui_metrics.gd")
const ScrollableRailCanvasScript = preload("res://scripts/scrollable_loose_piece_rail_canvas.gd")

var layout_mode_button: Button
var rail_scroll: ScrollContainer
var rail_scroll_horizontal_flow := false
var rail_scroll_flow_initialized := false


func _build_ui() -> void:
	super._build_ui()
	_detach_layout_mode_from_tray_manager()
	_build_layout_mode_dock_button()
	_install_scrollable_rail_canvas()


func _detach_layout_mode_from_tray_manager() -> void:
	# Loose-piece presentation is a workspace-wide choice, not a Tray-management
	# command. Keep the legacy row constructed by the base slice out of layout so
	# only the dedicated dock action is player-facing.
	if layout_mode_row != null:
		layout_mode_row.visible = false


func _build_layout_mode_dock_button() -> void:
	if ui_layer == null:
		return
	layout_mode_button = Button.new()
	layout_mode_button.name = "LoosePieceLayoutButton"
	layout_mode_button.toggle_mode = true
	LayoutIcons.apply_button(
		layout_mode_button,
		LayoutIcons.IconId.LAYOUT,
		"Loose pieces · Scatter / Rail",
		Vector2(44.0, 44.0),
		22
	)
	layout_mode_button.toggled.connect(_on_layout_mode_button_toggled)
	ui_layer.add_child(layout_mode_button)
	_refresh_layout_mode_controls()


func _install_scrollable_rail_canvas() -> void:
	if rail_canvas == null:
		return
	var rail_box := rail_canvas.get_parent()
	if rail_box == null:
		return
	var old_index: int = rail_canvas.get_index()
	var old_canvas = rail_canvas
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

	rail_canvas = ScrollableRailCanvasScript.new()
	rail_canvas.name = "LoosePieceRailCanvas"
	rail_canvas.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	rail_canvas.size_flags_vertical = Control.SIZE_EXPAND_FILL
	rail_canvas.group_dragged_out.connect(_on_rail_group_dragged_out)
	rail_scroll.add_child(rail_canvas)


func _on_layout_mode_button_toggled(rail_enabled: bool) -> void:
	_set_loose_layout_mode(LAYOUT_RAIL if rail_enabled else LAYOUT_SCATTER)


func _refresh_layout_mode_controls() -> void:
	super._refresh_layout_mode_controls()
	if layout_mode_button == null:
		return
	var rail_enabled: bool = loose_layout_mode == LAYOUT_RAIL
	layout_mode_button.set_pressed_no_signal(rail_enabled)
	layout_mode_button.icon = LayoutIcons.texture(LayoutIcons.IconId.LAYOUT)
	layout_mode_button.modulate = (
		Color.WHITE if rail_enabled else Color(1.0, 1.0, 1.0, 0.64)
	)
	layout_mode_button.tooltip_text = (
		"Loose pieces · Side Rail · click for Scatter"
		if rail_enabled
		else "Loose pieces · Scatter · click for Side Rail"
	)


func _layout_ui() -> void:
	super._layout_ui()
	if layout_mode_button != null:
		layout_mode_button.position = LayoutMetrics.dock_slot_position(
			_viewport_size(),
			LayoutMetrics.SLOT_LAYOUT_X
		)


func _layout_loose_piece_rail() -> void:
	super._layout_loose_piece_rail()
	_configure_rail_scrolling()


func _configure_rail_scrolling() -> void:
	if (
		rail_scroll == null
		or rail_canvas == null
		or rail_panel == null
		or loose_layout_mode != LAYOUT_RAIL
	):
		return

	var viewport_size: Vector2 = _viewport_size()
	var portrait: bool = viewport_size.y > viewport_size.x
	var horizontal_flow: bool = portrait
	if not rail_scroll_flow_initialized or horizontal_flow != rail_scroll_horizontal_flow:
		rail_scroll.scroll_horizontal = 0
		rail_scroll.scroll_vertical = 0
		rail_scroll_horizontal_flow = horizontal_flow
		rail_scroll_flow_initialized = true

	if portrait:
		rail_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
		rail_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
		var visible_height: float = maxf(88.0, rail_panel.size.y - 48.0)
		rail_canvas.set_scroll_layout(true, visible_height)
	else:
		rail_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
		rail_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
		var visible_width: float = maxf(120.0, rail_panel.size.x - 20.0)
		rail_canvas.set_scroll_layout(false, visible_width)
