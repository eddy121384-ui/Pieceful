class_name CommercialGameplayHudMain
extends "res://scripts/monetization_main.gd"

const AlbumMetrics = preload("res://scripts/app_ui_metrics.gd")

const PAPER := Color(0.91, 0.855, 0.765, 0.96)
const PAPER_LIGHT := Color(0.955, 0.925, 0.865, 0.98)
const PAPER_BORDER := Color(0.40, 0.33, 0.25, 0.30)
const INK := Color(0.18, 0.145, 0.11, 0.96)
const INK_SOFT := Color(0.18, 0.145, 0.11, 0.62)
const TAB := Color(0.24, 0.205, 0.165, 0.90)
const TAB_HOVER := Color(0.20, 0.17, 0.14, 0.94)
const TAB_PRESSED := Color(0.15, 0.125, 0.10, 0.98)

var album_difficulty_label: Label = null
var album_progress_track: ColorRect = null
var album_progress_fill: ColorRect = null
var album_more_button: Button = null

var album_overflow_layer: CanvasLayer = null
var album_overflow_panel: PanelContainer = null
var album_overflow_difficulty: OptionButton = null
var album_overflow_lines: Button = null

var album_dock_labels: Dictionary = {}
var album_progress_solved := 0
var album_progress_total := 1


func _build_ui() -> void:
	super._build_ui()
	_build_album_header()
	_build_album_overflow()
	_build_album_dock_labels()
	_apply_album_hierarchy()
	_style_album_primary_actions()
	_sync_album_difficulty()


func _build_album_header() -> void:
	if top_bar == null or title_label == null:
		return
	var layer = title_label.get_parent()
	if layer == null:
		return

	top_bar.add_theme_stylebox_override(
		"panel",
		_album_surface(PAPER, 17, 8)
	)
	bottom_dock.add_theme_stylebox_override(
		"panel",
		_album_surface(PAPER_LIGHT, 20, 10)
	)

	title_label.text = "Pieceful"
	title_label.add_theme_font_size_override("font_size", 22)
	title_label.add_theme_color_override("font_color", INK)
	title_label.modulate = Color.WHITE

	status_label.add_theme_font_size_override("font_size", 16)
	status_label.add_theme_color_override("font_color", INK)
	status_label.modulate = Color.WHITE

	album_difficulty_label = Label.new()
	album_difficulty_label.name = "AlbumDifficulty"
	album_difficulty_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	album_difficulty_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	album_difficulty_label.add_theme_font_size_override("font_size", 12)
	album_difficulty_label.add_theme_color_override("font_color", INK_SOFT)
	album_difficulty_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(album_difficulty_label)

	album_progress_track = ColorRect.new()
	album_progress_track.name = "AlbumProgressTrack"
	album_progress_track.color = Color(0.20, 0.17, 0.13, 0.16)
	album_progress_track.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(album_progress_track)

	album_progress_fill = ColorRect.new()
	album_progress_fill.name = "AlbumProgressFill"
	album_progress_fill.color = Color(0.28, 0.225, 0.17, 0.78)
	album_progress_fill.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(album_progress_fill)

	album_more_button = Button.new()
	album_more_button.name = "AlbumMore"
	album_more_button.text = "•••"
	album_more_button.tooltip_text = "More puzzle tools"
	album_more_button.focus_mode = Control.FOCUS_NONE
	album_more_button.add_theme_font_size_override("font_size", 18)
	album_more_button.add_theme_color_override("font_color", Color(0.97, 0.94, 0.88, 0.98))
	album_more_button.add_theme_color_override("font_hover_color", Color.WHITE)
	album_more_button.add_theme_color_override("font_pressed_color", Color.WHITE)
	_style_dark_button(album_more_button, 44.0, 13)
	album_more_button.pressed.connect(_toggle_album_overflow)
	layer.add_child(album_more_button)


func _build_album_overflow() -> void:
	album_overflow_layer = CanvasLayer.new()
	album_overflow_layer.name = "AlbumOverflowLayer"
	album_overflow_layer.layer = 40
	add_child(album_overflow_layer)

	album_overflow_panel = PanelContainer.new()
	album_overflow_panel.name = "AlbumOverflowPanel"
	album_overflow_panel.visible = false
	album_overflow_panel.custom_minimum_size = Vector2(310.0, 0.0)
	album_overflow_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	album_overflow_panel.add_theme_stylebox_override(
		"panel",
		_album_surface(PAPER_LIGHT, 18, 12, 14.0)
	)
	album_overflow_layer.add_child(album_overflow_panel)

	var box := VBoxContainer.new()
	box.name = "AlbumOverflowContent"
	box.add_theme_constant_override("separation", 8)
	album_overflow_panel.add_child(box)

	var heading := Label.new()
	heading.text = "Puzzle tools"
	heading.add_theme_font_size_override("font_size", 18)
	heading.add_theme_color_override("font_color", INK)
	box.add_child(heading)

	var difficulty_caption := Label.new()
	difficulty_caption.text = "Difficulty"
	difficulty_caption.add_theme_font_size_override("font_size", 11)
	difficulty_caption.add_theme_color_override("font_color", INK_SOFT)
	box.add_child(difficulty_caption)

	album_overflow_difficulty = OptionButton.new()
	album_overflow_difficulty.name = "AlbumDifficultySelect"
	album_overflow_difficulty.custom_minimum_size = Vector2(0.0, 44.0)
	album_overflow_difficulty.add_theme_font_size_override("font_size", 13)
	album_overflow_difficulty.add_theme_color_override("font_color", INK)
	album_overflow_difficulty.add_theme_color_override("font_hover_color", INK)
	album_overflow_difficulty.add_theme_stylebox_override(
		"normal",
		_album_control_style(Color(0.68, 0.60, 0.49, 0.13), 12)
	)
	album_overflow_difficulty.item_selected.connect(_on_album_difficulty_selected)
	box.add_child(album_overflow_difficulty)

	box.add_child(HSeparator.new())

	var fit_action := _new_overflow_button("Fit workspace")
	fit_action.pressed.connect(_on_album_fit_pressed)
	box.add_child(fit_action)

	album_overflow_lines = _new_overflow_button("Board lines")
	album_overflow_lines.toggle_mode = true
	album_overflow_lines.toggled.connect(_on_album_lines_toggled)
	box.add_child(album_overflow_lines)

	var reshuffle_action := _new_overflow_button("Reshuffle pieces")
	reshuffle_action.pressed.connect(_on_album_reshuffle_pressed)
	box.add_child(reshuffle_action)

	var unfinished_action := _new_overflow_button("Unfinished puzzles")
	unfinished_action.pressed.connect(_on_album_unfinished_pressed)
	box.add_child(unfinished_action)

	var journal_action := _new_overflow_button("Puzzle Journal")
	journal_action.pressed.connect(_on_album_journal_pressed)
	box.add_child(journal_action)

	var footer := Label.new()
	footer.text = "Pinch to zoom · drag empty space to pan"
	footer.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	footer.add_theme_font_size_override("font_size", 10)
	footer.add_theme_color_override("font_color", INK_SOFT)
	box.add_child(footer)


func _build_album_dock_labels() -> void:
	if title_label == null:
		return
	var layer = title_label.get_parent()
	if layer == null:
		return
	for spec in [
		["trays", "Trays"],
		["pieces", "Pieces"],
		["reference", "Reference"],
		["hint", "Hint"],
	]:
		var key := str(spec[0])
		var label := Label.new()
		label.name = "AlbumDockLabel_%s" % key
		label.text = str(spec[1])
		label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		label.add_theme_font_size_override("font_size", 11)
		label.add_theme_color_override("font_color", INK)
		label.mouse_filter = Control.MOUSE_FILTER_IGNORE
		layer.add_child(label)
		album_dock_labels[key] = label


func _apply_album_hierarchy() -> void:
	# Secondary tools remain fully functional, but no longer compete with solving.
	if difficulty_select != null:
		difficulty_select.visible = false
	if board_lines_button != null:
		board_lines_button.visible = false
	if fit_button != null:
		fit_button.visible = false
	if zoom_out_button != null:
		zoom_out_button.visible = false
	if zoom_label != null:
		zoom_label.visible = false
	if zoom_in_button != null:
		zoom_in_button.visible = false
	if restart_button != null:
		restart_button.visible = false
	if games_button != null:
		games_button.visible = false
	if journal_button != null:
		journal_button.visible = false


func _style_album_primary_actions() -> void:
	for button in [preview_button, hint_button]:
		if button is Button:
			_style_dark_button(button as Button, 44.0, 13)

	var sorting = get_node_or_null("SortingWorkspace")
	if sorting != null:
		var sort_control = sorting.get("sort_button")
		var layout_control = sorting.get("layout_mode_button")
		if sort_control is Button:
			_style_dark_button(sort_control as Button, 44.0, 13)
		if layout_control is Button:
			_style_dark_button(layout_control as Button, 44.0, 13)

	if spread_button != null:
		spread_button.add_theme_color_override("font_color", INK)
		spread_button.add_theme_color_override("font_hover_color", INK)
		spread_button.add_theme_color_override("font_pressed_color", INK)
		spread_button.add_theme_stylebox_override(
			"normal",
			_album_control_style(PAPER, 13)
		)
		spread_button.add_theme_stylebox_override(
			"hover",
			_album_control_style(PAPER_LIGHT, 13)
		)
		spread_button.add_theme_stylebox_override(
			"pressed",
			_album_control_style(Color(0.84, 0.77, 0.66, 0.98), 13)
		)


func _layout_ui(viewport_size: Vector2) -> void:
	super._layout_ui(viewport_size)
	if top_bar == null or bottom_dock == null:
		return

	var top_rect := AlbumMetrics.top_bar_rect(viewport_size)
	var dock_rect := AlbumMetrics.dock_rect(viewport_size)
	top_bar.position = top_rect.position
	top_bar.size = top_rect.size
	bottom_dock.position = dock_rect.position
	bottom_dock.size = dock_rect.size

	title_label.position = top_rect.position + Vector2(18.0, 10.0)
	title_label.size = Vector2(132.0, 30.0)

	status_label.size = Vector2(170.0, 24.0)
	status_label.position = Vector2(
		top_rect.position.x + (top_rect.size.x - status_label.size.x) * 0.5,
		top_rect.position.y + 8.0
	)

	var progress_width := minf(138.0, top_rect.size.x * 0.26)
	album_progress_track.position = Vector2(
		top_rect.position.x + (top_rect.size.x - progress_width) * 0.5,
		top_rect.position.y + 39.0
	)
	album_progress_track.size = Vector2(progress_width, 3.0)
	_refresh_album_progress()

	album_more_button.size = Vector2(44.0, 44.0)
	album_more_button.custom_minimum_size = Vector2(44.0, 44.0)
	album_more_button.position = top_rect.position + Vector2(
		top_rect.size.x - 52.0,
		7.0
	)

	album_difficulty_label.visible = top_rect.size.x >= 500.0
	album_difficulty_label.size = Vector2(120.0, 28.0)
	album_difficulty_label.position = Vector2(
		album_more_button.position.x - 128.0,
		top_rect.position.y + 15.0
	)

	preview_button.position = AlbumMetrics.dock_slot_position(
		viewport_size,
		AlbumMetrics.SLOT_PREVIEW_X
	)
	hint_button.position = AlbumMetrics.dock_slot_position(
		viewport_size,
		AlbumMetrics.SLOT_HINT_X
	)

	var sorting = get_node_or_null("SortingWorkspace")
	if sorting != null:
		var sort_control = sorting.get("sort_button")
		var layout_control = sorting.get("layout_mode_button")
		if sort_control is Button:
			(sort_control as Button).position = AlbumMetrics.dock_slot_position(
				viewport_size,
				AlbumMetrics.SLOT_SORT_X
			)
		if layout_control is Button:
			(layout_control as Button).position = AlbumMetrics.dock_slot_position(
				viewport_size,
				AlbumMetrics.SLOT_LAYOUT_X
			)

	_layout_dock_label("trays", dock_rect, AlbumMetrics.SLOT_SORT_X)
	_layout_dock_label("pieces", dock_rect, AlbumMetrics.SLOT_LAYOUT_X)
	_layout_dock_label("reference", dock_rect, AlbumMetrics.SLOT_PREVIEW_X)
	_layout_dock_label("hint", dock_rect, AlbumMetrics.SLOT_HINT_X)

	if spread_button != null and spread_button.visible:
		spread_button.position = Vector2(
			dock_rect.end.x - spread_button.size.x,
			maxf(top_rect.end.y + 12.0, dock_rect.position.y - spread_button.size.y - 10.0)
		)

	if album_overflow_panel != null:
		album_overflow_panel.size = Vector2(
			minf(310.0, maxf(270.0, viewport_size.x - 28.0)),
			album_overflow_panel.get_combined_minimum_size().y
		)
		album_overflow_panel.position = Vector2(
			clampf(
				top_rect.end.x - album_overflow_panel.size.x,
				14.0,
				maxf(14.0, viewport_size.x - album_overflow_panel.size.x - 14.0)
			),
			top_rect.end.y + 8.0
		)

	# Reference is still a play-surface object; just clear the new compact header.
	_layout_reference_panel(viewport_size, false)


func _layout_dock_label(key: String, dock_rect: Rect2, slot_x: float) -> void:
	var label = album_dock_labels.get(key)
	if not (label is Label):
		return
	(label as Label).position = dock_rect.position + Vector2(slot_x - 24.0, 50.0)
	(label as Label).size = Vector2(92.0, 18.0)


func _on_progress_changed(solved_count: int, total_count: int) -> void:
	album_progress_solved = solved_count
	album_progress_total = maxi(total_count, 1)
	super._on_progress_changed(solved_count, total_count)
	_refresh_album_progress()


func _refresh_album_progress() -> void:
	if album_progress_track == null or album_progress_fill == null:
		return
	var ratio := clampf(
		float(album_progress_solved) / float(maxi(album_progress_total, 1)),
		0.0,
		1.0
	)
	album_progress_fill.position = album_progress_track.position
	album_progress_fill.size = Vector2(album_progress_track.size.x * ratio, album_progress_track.size.y)


func _refresh_difficulty_control() -> void:
	super._refresh_difficulty_control()
	_sync_album_difficulty()


func _sync_album_difficulty() -> void:
	if board == null:
		return
	if album_difficulty_label != null:
		album_difficulty_label.text = "%s · %d" % [
			board.active_difficulty_label(),
			board.active_piece_count(),
		]
	if album_overflow_difficulty == null or difficulty_select == null:
		return

	album_overflow_difficulty.clear()
	var active_id := str(board.active_difficulty_id())
	for index in range(difficulty_select.get_item_count()):
		album_overflow_difficulty.add_item(difficulty_select.get_item_text(index))
		var album_index := album_overflow_difficulty.get_item_count() - 1
		var metadata = difficulty_select.get_item_metadata(index)
		album_overflow_difficulty.set_item_metadata(album_index, metadata)
		album_overflow_difficulty.set_item_disabled(
			album_index,
			difficulty_select.is_item_disabled(index)
		)
		if str(metadata) == active_id:
			album_overflow_difficulty.select(album_index)


func _refresh_aid_controls() -> void:
	super._refresh_aid_controls()
	_apply_album_hierarchy()
	if album_overflow_lines != null:
		album_overflow_lines.set_pressed_no_signal(board_lines_enabled)


func _toggle_album_overflow() -> void:
	if album_overflow_panel == null:
		return
	album_overflow_panel.visible = not album_overflow_panel.visible
	if album_overflow_panel.visible:
		_sync_album_difficulty()
		album_overflow_panel.move_to_front()


func _close_album_overflow() -> void:
	if album_overflow_panel != null:
		album_overflow_panel.visible = false


func _on_album_difficulty_selected(index: int) -> void:
	if album_overflow_difficulty == null or difficulty_select == null:
		return
	if index < 0 or index >= album_overflow_difficulty.get_item_count():
		return
	var requested_id := str(album_overflow_difficulty.get_item_metadata(index))
	for original_index in range(difficulty_select.get_item_count()):
		if str(difficulty_select.get_item_metadata(original_index)) == requested_id:
			_on_difficulty_selected(original_index)
			break
	_sync_album_difficulty()


func _on_album_fit_pressed() -> void:
	_close_album_overflow()
	_fit_view()


func _on_album_lines_toggled(enabled: bool) -> void:
	_on_board_lines_toggled(enabled)


func _on_album_reshuffle_pressed() -> void:
	_close_album_overflow()
	_restart()


func _on_album_unfinished_pressed() -> void:
	_close_album_overflow()
	_toggle_sessions_panel()


func _on_album_journal_pressed() -> void:
	_close_album_overflow()
	_toggle_journal()


func _new_overflow_button(text_value: String) -> Button:
	var button := Button.new()
	button.text = text_value
	button.alignment = HORIZONTAL_ALIGNMENT_LEFT
	button.custom_minimum_size = Vector2(0.0, 44.0)
	button.focus_mode = Control.FOCUS_NONE
	button.add_theme_font_size_override("font_size", 13)
	button.add_theme_color_override("font_color", INK)
	button.add_theme_color_override("font_hover_color", INK)
	button.add_theme_color_override("font_pressed_color", INK)
	button.add_theme_color_override("font_hover_pressed_color", INK)
	button.add_theme_stylebox_override(
		"normal",
		_album_control_style(Color(0.68, 0.60, 0.49, 0.08), 12)
	)
	button.add_theme_stylebox_override(
		"hover",
		_album_control_style(Color(0.68, 0.60, 0.49, 0.16), 12)
	)
	button.add_theme_stylebox_override(
		"pressed",
		_album_control_style(Color(0.58, 0.49, 0.39, 0.22), 12)
	)
	button.add_theme_stylebox_override(
		"hover_pressed",
		_album_control_style(Color(0.58, 0.49, 0.39, 0.24), 12)
	)
	return button


func _style_dark_button(button: Button, side: float, radius: int) -> void:
	button.size = Vector2(side, side)
	button.custom_minimum_size = Vector2(side, side)
	button.focus_mode = Control.FOCUS_NONE
	button.add_theme_stylebox_override("normal", _album_control_style(TAB, radius))
	button.add_theme_stylebox_override("hover", _album_control_style(TAB_HOVER, radius))
	button.add_theme_stylebox_override("pressed", _album_control_style(TAB_PRESSED, radius))
	button.add_theme_stylebox_override("hover_pressed", _album_control_style(TAB_PRESSED, radius))
	button.add_theme_stylebox_override("focus", StyleBoxEmpty.new())


func _album_surface(
	background: Color,
	radius: int,
	shadow_size: int,
	margin: float = 0.0
) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = background
	style.border_color = PAPER_BORDER
	style.set_border_width_all(1)
	style.set_corner_radius_all(radius)
	style.shadow_color = Color(0.08, 0.055, 0.035, 0.22)
	style.shadow_size = shadow_size
	if margin > 0.0:
		style.content_margin_left = margin
		style.content_margin_top = margin
		style.content_margin_right = margin
		style.content_margin_bottom = margin
	return style


func _album_control_style(background: Color, radius: int) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = background
	style.border_color = Color(1.0, 1.0, 1.0, 0.09)
	style.set_border_width_all(1)
	style.set_corner_radius_all(radius)
	return style


func commercial_hud_snapshot() -> Dictionary:
	var sorting = get_node_or_null("SortingWorkspace")
	var sort_control = sorting.get("sort_button") if sorting != null else null
	var layout_control = sorting.get("layout_mode_button") if sorting != null else null
	return {
		"top_rect": top_bar.get_rect() if top_bar != null else Rect2(),
		"dock_rect": bottom_dock.get_rect() if bottom_dock != null else Rect2(),
		"more_visible": album_more_button != null and album_more_button.visible,
		"overflow_visible": album_overflow_panel != null and album_overflow_panel.visible,
		"difficulty_text": album_difficulty_label.text if album_difficulty_label != null else "",
		"preview_rect": preview_button.get_rect() if preview_button != null else Rect2(),
		"hint_rect": hint_button.get_rect() if hint_button != null else Rect2(),
		"sort_rect": sort_control.get_rect() if sort_control is Button else Rect2(),
		"layout_rect": layout_control.get_rect() if layout_control is Button else Rect2(),
		"legacy_zoom_visible": (
			(zoom_out_button != null and zoom_out_button.visible)
			or (zoom_in_button != null and zoom_in_button.visible)
			or (zoom_label != null and zoom_label.visible)
		),
		"legacy_fit_visible": fit_button != null and fit_button.visible,
		"legacy_lines_visible": board_lines_button != null and board_lines_button.visible,
		"legacy_reshuffle_visible": restart_button != null and restart_button.visible,
		"games_entry_visible": games_button != null and games_button.visible,
		"journal_entry_visible": journal_button != null and journal_button.visible,
	}
