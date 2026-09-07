extends "res://scripts/main.gd"

const Icons = preload("res://scripts/ui_icon_catalog.gd")
const AppUiMetrics = preload("res://scripts/app_ui_metrics.gd")

var top_bar: PanelContainer
var bottom_dock: PanelContainer


func _build_ui() -> void:
	super._build_ui()
	_build_app_chrome()

	title_label.text = "Pieceful"
	title_label.add_theme_font_size_override("font_size", 20)
	title_label.modulate = Color(1.0, 1.0, 1.0, 0.92)
	subtitle_label.visible = false
	runtime_label.visible = false
	difficulty_caption.visible = false
	instruction_label.visible = false
	status_label.add_theme_font_size_override("font_size", 16)

	Icons.apply_button(
		zoom_out_button,
		Icons.IconId.ZOOM_OUT,
		"Zoom out"
	)
	Icons.apply_button(
		zoom_in_button,
		Icons.IconId.ZOOM_IN,
		"Zoom in"
	)
	Icons.apply_button(
		fit_button,
		Icons.IconId.FIT,
		"Fit workspace"
	)
	Icons.apply_button(
		restart_button,
		Icons.IconId.RESHUFFLE,
		"Reshuffle"
	)
	Icons.apply_button(
		preview_button,
		Icons.IconId.PREVIEW_OFF,
		"Preview"
	)
	preview_button.toggle_mode = true
	Icons.apply_button(
		hint_button,
		Icons.IconId.HINT,
		"Hint"
	)
	Icons.apply_button(
		board_lines_button,
		Icons.IconId.GRID,
		"Board lines"
	)

	_iconify_completion_action()
	_simplify_reference_caption()


func _build_app_chrome() -> void:
	var layer: Node = title_label.get_parent()
	if layer == null:
		return

	top_bar = PanelContainer.new()
	top_bar.name = "AppTopBar"
	top_bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top_bar.add_theme_stylebox_override(
		"panel",
		_chrome_style(
			Color(0.035, 0.04, 0.052, 0.74),
			Color(1.0, 1.0, 1.0, 0.08),
			16,
			0
		)
	)
	layer.add_child(top_bar)
	layer.move_child(top_bar, 0)

	bottom_dock = PanelContainer.new()
	bottom_dock.name = "AppBottomDock"
	bottom_dock.mouse_filter = Control.MOUSE_FILTER_IGNORE
	bottom_dock.add_theme_stylebox_override(
		"panel",
		_chrome_style(
			Color(0.035, 0.04, 0.052, 0.90),
			Color(1.0, 1.0, 1.0, 0.12),
			20,
			10
		)
	)
	layer.add_child(bottom_dock)
	layer.move_child(bottom_dock, 1)


func _chrome_style(
	background: Color,
	border: Color,
	radius: int,
	shadow_size: int
) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = background
	style.border_color = border
	style.set_border_width_all(1)
	style.set_corner_radius_all(radius)
	if shadow_size > 0:
		style.shadow_color = Color(0.0, 0.0, 0.0, 0.30)
		style.shadow_size = shadow_size
	return style


func _layout_ui(viewport_size: Vector2) -> void:
	super._layout_ui(viewport_size)

	var width: float = maxf(viewport_size.x, 1.0)
	var top_rect: Rect2 = AppUiMetrics.top_bar_rect(viewport_size)
	var dock_rect: Rect2 = AppUiMetrics.dock_rect(viewport_size)

	if top_bar != null:
		top_bar.position = top_rect.position
		top_bar.size = top_rect.size
	if bottom_dock != null:
		bottom_dock.position = dock_rect.position
		bottom_dock.size = dock_rect.size

	title_label.position = top_rect.position + Vector2(16.0, 11.0)
	title_label.size = Vector2(150.0, 34.0)

	status_label.size = Vector2(190.0, 30.0)
	status_label.position = Vector2(
		(width - status_label.size.x) * 0.5,
		top_rect.position.y + 13.0
	)

	difficulty_select.size = Vector2(184.0, 36.0)
	difficulty_select.position = Vector2(
		top_rect.end.x - difficulty_select.size.x - 10.0,
		top_rect.position.y + 10.0
	)

	preview_button.position = AppUiMetrics.dock_slot_position(
		viewport_size,
		AppUiMetrics.SLOT_PREVIEW_X
	)
	hint_button.position = AppUiMetrics.dock_slot_position(
		viewport_size,
		AppUiMetrics.SLOT_HINT_X
	)
	board_lines_button.position = AppUiMetrics.dock_slot_position(
		viewport_size,
		AppUiMetrics.SLOT_LINES_X
	)
	fit_button.position = AppUiMetrics.dock_slot_position(
		viewport_size,
		AppUiMetrics.SLOT_FIT_X
	)
	zoom_out_button.position = AppUiMetrics.dock_slot_position(
		viewport_size,
		AppUiMetrics.SLOT_ZOOM_OUT_X
	)
	zoom_label.size = Vector2(48.0, 28.0)
	zoom_label.position = dock_rect.position + Vector2(
		AppUiMetrics.SLOT_ZOOM_LABEL_X,
		18.0
	)
	zoom_in_button.position = AppUiMetrics.dock_slot_position(
		viewport_size,
		AppUiMetrics.SLOT_ZOOM_IN_X
	)
	restart_button.position = AppUiMetrics.dock_slot_position(
		viewport_size,
		AppUiMetrics.SLOT_RESHUFFLE_X
	)

	# The floating reference belongs to the play surface, so keep its default
	# below the compact top bar rather than treating it as another toolbar.
	_layout_reference_panel(viewport_size, false)


func _refresh_aid_controls() -> void:
	super._refresh_aid_controls()

	if preview_button != null:
		var preview_icon := Icons.IconId.PREVIEW_OFF
		match preview_mode:
			PREVIEW_MODE_FLOATING:
				preview_icon = Icons.IconId.PREVIEW_FLOAT
			PREVIEW_MODE_BOARD:
				preview_icon = Icons.IconId.PREVIEW_BOARD
		preview_button.text = ""
		preview_button.icon = Icons.texture(preview_icon)
		preview_button.set_pressed_no_signal(preview_mode != PREVIEW_MODE_OFF)
		preview_button.modulate = (
			Color.WHITE
			if preview_mode != PREVIEW_MODE_OFF
			else Color(1.0, 1.0, 1.0, 0.52)
		)
		preview_button.tooltip_text = "Preview · Off → Floating → Board"

	if hint_button != null:
		var hint_enabled: bool = board.hint_is_enabled()
		hint_button.text = ""
		hint_button.icon = Icons.texture(Icons.IconId.HINT)
		hint_button.modulate = (
			Color.WHITE
			if hint_enabled
			else Color(1.0, 1.0, 1.0, 0.52)
		)
		hint_button.tooltip_text = "Hint"

	if board_lines_button != null:
		board_lines_button.text = ""
		board_lines_button.icon = Icons.texture(Icons.IconId.GRID)
		board_lines_button.modulate = (
			Color.WHITE
			if board_lines_enabled
			else Color(1.0, 1.0, 1.0, 0.52)
		)
		board_lines_button.tooltip_text = "Board lines"


func _update_runtime_label() -> void:
	# Runtime diagnostics remain available in code/logs, but are deliberately not
	# part of the product HUD. The top bar only carries player-facing state.
	if runtime_label != null:
		runtime_label.visible = false


func _iconify_completion_action() -> void:
	var again_button := _find_button_with_text(completion_panel, "Play again")
	if again_button == null:
		return
	Icons.apply_button(
		again_button,
		Icons.IconId.REPLAY,
		"Play again",
		Vector2(52.0, 52.0),
		26
	)
	again_button.size_flags_horizontal = Control.SIZE_SHRINK_CENTER


func _simplify_reference_caption() -> void:
	var caption := _find_label_with_text(
		preview_panel,
		"Reference · drag to move"
	)
	if caption != null:
		caption.text = "Reference"


func _find_button_with_text(root: Node, target_text: String) -> Button:
	if root == null:
		return null
	for child in root.get_children():
		if child is Button and child.text == target_text:
			return child as Button
		var nested := _find_button_with_text(child, target_text)
		if nested != null:
			return nested
	return null


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
