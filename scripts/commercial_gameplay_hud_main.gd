class_name CommercialGameplayHudMain
extends "res://scripts/monetization_main.gd"

const AlbumMetrics = preload("res://scripts/app_ui_metrics.gd")
const Paper = preload("res://scripts/watercolor_gameplay_style.gd")
const ReachablePaper = preload("res://scripts/watercolor_reachable_surfaces.gd")
const WatercolorIcons = preload("res://assets/ui/watercolor-gameplay-icons.svg")

# Watercolor book: printed ink, open white space, and quiet pigment at the edges.
# Only gameplay presentation is overridden; all inherited action bindings remain.
const DESK := Color(0.980, 0.979, 0.961, 1.0)
const BOARD_PAPER := Color(0.947, 0.950, 0.926, 1.0)
const PAPER := Color(0.980, 0.979, 0.961, 1.0)
const PAPER_LIGHT := Color(0.994, 0.993, 0.980, 1.0)
const PAPER_TAB := Color(0.77, 0.85, 0.80, 0.32)
const PAPER_BORDER := Color(0.29, 0.39, 0.35, 0.12)
const INK := Color(0.20, 0.28, 0.26, 1.0)
const INK_SOFT := Color(0.36, 0.43, 0.40, 1.0)
const INK_FAINT := Color(0.20, 0.28, 0.26, 0.18)
const WASH_INK := Color(0.38, 0.53, 0.46, 1.0)

var watercolor_selection: Texture2D = null
var watercolor_overflow_scroll: ScrollContainer = null

var album_backdrop_layer: CanvasLayer = null
var album_backdrop: ColorRect = null

var album_top_fiber: ColorRect = null
var album_dock_fiber: ColorRect = null

var album_difficulty_label: Label = null
var album_masthead_caption: Label = null
var album_progress_track: ColorRect = null
var album_progress_fill: ColorRect = null
var album_more_button: Button = null

var album_overflow_layer: CanvasLayer = null
var album_overflow_panel: PanelContainer = null
var album_overflow_backing: PanelContainer = null
var album_overflow_difficulty: OptionButton = null
var album_overflow_lines: Button = null
var album_lines_state: Label = null

var album_mount_shadow: Polygon2D = null
var album_mount_paper: Polygon2D = null

var album_dock_labels: Dictionary = {}
var album_progress_solved := 0
var album_progress_total := 1

var album_serif: Font = null
var album_serif_italic: Font = null


func _ready() -> void:
	super._ready()
	get_window().title = "Pieceful · Piece at your own pace"
	_style_gameplay_auxiliary_surfaces()
	ReachablePaper.style(self)


func _on_completed() -> void:
	super._on_completed()
	_style_completion_paper()
	_refresh_completion_layout_from_browser()


func _apply_completion_layout_for_orientation(logical_size: Vector2, orientation_size: Vector2) -> void:
	super._apply_completion_layout_for_orientation(logical_size, orientation_size)
	ReachablePaper.layout_completion(self, logical_size, orientation_size)


func _layout_timelapse_export_actions(viewport_size: Vector2) -> void:
	super._layout_timelapse_export_actions(viewport_size)
	ReachablePaper.layout_replay(self, viewport_size)


func _build_ui() -> void:
	super._build_ui()
	_build_album_fonts()
	_build_album_backdrop()
	_build_album_header()
	_build_album_overflow()
	_build_album_dock_labels()
	_apply_album_hierarchy()
	_style_album_primary_actions()
	_bind_album_tab_captions()
	_sync_album_difficulty()
	_style_gameplay_auxiliary_surfaces()
	if preview_panel != null:
		preview_panel.add_theme_stylebox_override("panel", _album_surface(PAPER_LIGHT, 4, 2, 8.0))
		for child in preview_panel.get_children():
			for caption in child.get_children():
				if caption is Label:
					caption.add_theme_color_override("font_color", INK_SOFT)


func _build_album_fonts() -> void:
	album_serif = load("res://assets/ui/album-serif-regular.otf") as Font
	album_serif_italic = load("res://assets/ui/album-serif-italic.otf") as Font


func _build_album_backdrop() -> void:
	album_backdrop_layer = CanvasLayer.new()
	album_backdrop_layer.name = "AlbumDeskBackdrop"
	album_backdrop_layer.layer = -30
	add_child(album_backdrop_layer)

	album_backdrop = ColorRect.new()
	album_backdrop.name = "AlbumDeskPaper"
	album_backdrop.color = DESK
	album_backdrop.mouse_filter = Control.MOUSE_FILTER_IGNORE
	album_backdrop_layer.add_child(album_backdrop)

	var material := ShaderMaterial.new()
	material.shader = preload("res://assets/ui/watercolor-paper.gdshader")
	album_backdrop.material = material


func _build_album_header() -> void:
	if top_bar == null or title_label == null:
		return
	var layer = title_label.get_parent()
	if layer == null:
		return

	# No card edges, stacked sheets, fold, or protruding tab: ink lives on the page.
	top_bar.add_theme_stylebox_override("panel", StyleBoxEmpty.new())
	bottom_dock.add_theme_stylebox_override("panel", StyleBoxEmpty.new())
	var rule_material := ShaderMaterial.new()
	rule_material.shader = preload("res://assets/ui/watercolor-rule.gdshader")
	for is_top in [true, false]:
		var rule := ColorRect.new()
		rule.name = "WatercolorHeaderRule" if is_top else "WatercolorDockRule"
		rule.material = rule_material
		rule.mouse_filter = Control.MOUSE_FILTER_IGNORE
		layer.add_child(rule)
		if is_top:
			album_top_fiber = rule
		else:
			album_dock_fiber = rule

	title_label.text = "Pieceful"
	title_label.add_theme_font_override("font", album_serif)
	title_label.add_theme_font_size_override("font_size", 38)
	title_label.add_theme_color_override("font_color", INK)
	title_label.modulate = Color.WHITE
	album_masthead_caption = Label.new()
	album_masthead_caption.name = "AlbumMastheadCaption"
	album_masthead_caption.text = "Piece at your own pace"
	album_masthead_caption.add_theme_font_override("font", album_serif_italic)
	album_masthead_caption.add_theme_font_size_override("font_size", 17)
	album_masthead_caption.add_theme_color_override("font_color", INK_SOFT)
	album_masthead_caption.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(album_masthead_caption)

	status_label.add_theme_font_override("font", album_serif)
	status_label.add_theme_font_size_override("font_size", 24)
	status_label.add_theme_color_override("font_color", INK)
	status_label.modulate = Color.WHITE

	album_difficulty_label = Label.new()
	album_difficulty_label.name = "AlbumDifficulty"
	album_difficulty_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	album_difficulty_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	album_difficulty_label.add_theme_font_size_override("font_size", 16)
	album_difficulty_label.add_theme_color_override("font_color", INK_SOFT)
	album_difficulty_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(album_difficulty_label)

	album_progress_track = ColorRect.new()
	album_progress_track.name = "AlbumProgressTrack"
	album_progress_track.color = INK_FAINT
	album_progress_track.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(album_progress_track)

	album_progress_fill = ColorRect.new()
	album_progress_fill.name = "AlbumProgressFill"
	album_progress_fill.color = WASH_INK
	album_progress_fill.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(album_progress_fill)

	album_more_button = Button.new()
	album_more_button.name = "AlbumMore"
	album_more_button.text = ""
	album_more_button.icon = Paper.icon(Paper.Mark.MORE)
	album_more_button.expand_icon = true
	album_more_button.add_theme_constant_override("icon_max_width", 38)
	album_more_button.tooltip_text = "More puzzle tools"
	album_more_button.focus_mode = Control.FOCUS_NONE
	_style_paper_square_button(album_more_button, 100.0, 6)
	Paper.mark_button(album_more_button, Paper.Mark.MORE)
	album_more_button.add_theme_stylebox_override("normal", _more_paper_style(0.18, 2))
	album_more_button.add_theme_stylebox_override("hover", _more_paper_style(0.45, 3))
	album_more_button.add_theme_stylebox_override("pressed", _more_paper_style(0.62, 1))
	album_more_button.add_theme_stylebox_override("hover_pressed", _more_paper_style(0.62, 1))
	album_more_button.pressed.connect(_toggle_album_overflow)
	layer.add_child(album_more_button)


func _build_album_overflow() -> void:
	album_overflow_layer = CanvasLayer.new()
	album_overflow_layer.name = "AlbumOverflowLayer"
	album_overflow_layer.layer = 40
	add_child(album_overflow_layer)
	album_overflow_backing = PanelContainer.new()
	album_overflow_backing.name = "AlbumOverflowPaperEdge"
	album_overflow_backing.visible = false
	album_overflow_backing.mouse_filter = Control.MOUSE_FILTER_IGNORE
	album_overflow_backing.add_theme_stylebox_override(
		"panel", _album_surface(Color(0.29, 0.39, 0.35, 0.06), 11, 3)
	)
	album_overflow_layer.add_child(album_overflow_backing)

	album_overflow_panel = PanelContainer.new()
	album_overflow_panel.name = "AlbumOverflowPanel"
	album_overflow_panel.visible = false
	album_overflow_panel.custom_minimum_size = Vector2(340.0, 0.0)
	album_overflow_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	album_overflow_panel.add_theme_stylebox_override(
		"panel",
		_album_surface(PAPER_LIGHT, 11, 7, 15.0)
	)
	album_overflow_layer.add_child(album_overflow_panel)

	watercolor_overflow_scroll = ScrollContainer.new()
	watercolor_overflow_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	album_overflow_panel.add_child(watercolor_overflow_scroll)
	var box := VBoxContainer.new()
	box.name = "AlbumOverflowContent"
	box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	box.add_theme_constant_override("separation", 0)
	watercolor_overflow_scroll.add_child(box)

	var folio := Label.new()
	folio.text = "PIECEFUL  /  AT YOUR PACE"
	folio.add_theme_font_size_override("font_size", 12)
	folio.add_theme_color_override("font_color", INK_SOFT)
	box.add_child(folio)
	box.add_child(_overflow_spacer(3.0))

	var heading := Label.new()
	heading.text = "Puzzle tools"
	heading.add_theme_font_override("font", album_serif)
	heading.add_theme_font_size_override("font_size", 30)
	heading.add_theme_color_override("font_color", INK)
	box.add_child(heading)
	box.add_child(_overflow_spacer(6.0))
	box.add_child(_overflow_rule())
	box.add_child(_overflow_spacer(7.0))

	var difficulty_caption := Label.new()
	difficulty_caption.text = "DIFFICULTY"
	difficulty_caption.add_theme_font_size_override("font_size", 14)
	difficulty_caption.add_theme_color_override("font_color", INK_SOFT)
	box.add_child(difficulty_caption)

	album_overflow_difficulty = OptionButton.new()
	album_overflow_difficulty.name = "AlbumDifficultySelect"
	album_overflow_difficulty.custom_minimum_size = Vector2(0.0, 100.0)
	album_overflow_difficulty.add_theme_font_size_override("font_size", 20)
	album_overflow_difficulty.add_theme_color_override("font_color", INK)
	album_overflow_difficulty.add_theme_color_override("font_hover_color", INK)
	for state in ["normal", "hover", "pressed", "hover_pressed"]:
		album_overflow_difficulty.add_theme_stylebox_override(
			state, _overflow_row_style(state == "hover" or state == "hover_pressed")
		)
	var difficulty_popup := album_overflow_difficulty.get_popup()
	difficulty_popup.add_theme_stylebox_override("panel", _album_surface(PAPER_LIGHT, 9, 4, 8.0))
	difficulty_popup.add_theme_stylebox_override("hover", _overflow_row_style(true))
	difficulty_popup.add_theme_color_override("font_color", INK)
	difficulty_popup.add_theme_color_override("font_hover_color", INK)
	difficulty_popup.add_theme_font_size_override("font_size", 20)
	album_overflow_difficulty.item_selected.connect(_on_album_difficulty_selected)
	box.add_child(album_overflow_difficulty)

	box.add_child(_overflow_rule())
	box.add_child(_overflow_spacer(4.0))

	var fit_action := _new_overflow_button("Fit workspace")
	fit_action.pressed.connect(_on_album_fit_pressed)
	box.add_child(fit_action)

	album_overflow_lines = _new_overflow_button("Board lines")
	album_overflow_lines.toggle_mode = true
	album_overflow_lines.toggled.connect(_on_album_lines_toggled)
	box.add_child(album_overflow_lines)
	album_lines_state = Label.new()
	album_lines_state.name = "AlbumBoardLinesState"
	album_lines_state.set_anchors_and_offsets_preset(Control.PRESET_RIGHT_WIDE)
	album_lines_state.offset_left = -50.0
	album_lines_state.offset_right = -9.0
	album_lines_state.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	album_lines_state.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	album_lines_state.add_theme_font_size_override("font_size", 14)
	album_lines_state.add_theme_color_override("font_color", INK_SOFT)
	album_lines_state.mouse_filter = Control.MOUSE_FILTER_IGNORE
	album_overflow_lines.add_child(album_lines_state)
	_sync_album_lines_state()

	var reshuffle_action := _new_overflow_button("Reshuffle pieces")
	reshuffle_action.pressed.connect(_on_album_reshuffle_pressed)
	box.add_child(reshuffle_action)

	var unfinished_action := _new_overflow_button("Unfinished puzzles")
	unfinished_action.pressed.connect(_on_album_unfinished_pressed)
	box.add_child(unfinished_action)

	var journal_action := _new_overflow_button("Puzzle Journal")
	journal_action.pressed.connect(_on_album_journal_pressed)
	box.add_child(journal_action)

	box.add_child(_overflow_rule())
	box.add_child(_overflow_spacer(7.0))
	var footer := Label.new()
	footer.text = "Pinch to zoom  ·  Drag the table to pan"
	footer.add_theme_font_size_override("font_size", 14)
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
		label.add_theme_font_size_override("font_size", 20)
		label.add_theme_color_override("font_color", INK)
		label.mouse_filter = Control.MOUSE_FILTER_IGNORE
		layer.add_child(label)
		album_dock_labels[key] = label


func _bind_album_tab_captions() -> void:
	for button in [preview_button, hint_button]:
		if button is Button:
			(button as Button).pressed.connect(_sync_album_tab_captions)
	var sorting = get_node_or_null("SortingWorkspace")
	if sorting != null:
		for control_name in ["sort_button", "layout_mode_button"]:
			var button = sorting.get(control_name)
			if button is Button:
				(button as Button).toggled.connect(_on_album_tab_toggled)
	_sync_album_tab_captions()


func _on_album_tab_toggled(_enabled: bool) -> void:
	_sync_album_tab_captions()


func _sync_album_tab_captions() -> void:
	var sorting = get_node_or_null("SortingWorkspace")
	var sort_control = sorting.get("sort_button") if sorting != null else null
	var layout_control = sorting.get("layout_mode_button") if sorting != null else null
	var active := {
		"trays": sort_control is Button and (sort_control as Button).button_pressed,
		"pieces": layout_control is Button and (layout_control as Button).button_pressed,
		"reference": preview_button != null and preview_button.button_pressed,
		"hint": hint_button != null and hint_button.button_pressed,
	}
	for key in album_dock_labels:
		var caption = album_dock_labels[key]
		if caption is Label:
			(caption as Label).add_theme_color_override(
				"font_color", INK if bool(active[key]) else INK_SOFT
			)


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
			_style_paper_tab_button(button as Button)
	_set_watercolor_icon(preview_button, 2)
	_set_watercolor_icon(hint_button, 3)

	var sorting = get_node_or_null("SortingWorkspace")
	if sorting != null:
		var sort_control = sorting.get("sort_button")
		var layout_control = sorting.get("layout_mode_button")
		if sort_control is Button:
			_style_paper_tab_button(sort_control as Button)
			_set_watercolor_icon(sort_control as Button, 0)
		if layout_control is Button:
			_style_paper_tab_button(layout_control as Button)
			_set_watercolor_icon(layout_control as Button, 1)

	if spread_button != null:
		Paper.mark_button(spread_button, Paper.Mark.SCATTER)
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
			_album_control_style(PAPER_TAB, 13)
		)


func _layout_ui(viewport_size: Vector2) -> void:
	super._layout_ui(viewport_size)
	if top_bar == null or bottom_dock == null:
		return

	_layout_album_backdrop(viewport_size)
	_style_album_board_surface()

	var top_rect := AlbumMetrics.top_bar_rect(viewport_size)
	var dock_rect := AlbumMetrics.dock_rect(viewport_size)

	top_bar.position = top_rect.position
	top_bar.size = top_rect.size
	bottom_dock.position = dock_rect.position
	bottom_dock.size = dock_rect.size
	if album_top_fiber != null:
		album_top_fiber.position = top_rect.position + Vector2(0.0, top_rect.size.y - 2.0)
		album_top_fiber.size = Vector2(top_rect.size.x, 3.0)
	if album_dock_fiber != null:
		album_dock_fiber.position = dock_rect.position
		album_dock_fiber.size = Vector2(dock_rect.size.x, 4.0)
	title_label.position = top_rect.position + Vector2(0.0, 1.0)
	title_label.size = Vector2(180.0, 48.0)
	if album_masthead_caption != null:
		album_masthead_caption.position = top_rect.position + Vector2(2.0, 49.0)
		album_masthead_caption.size = Vector2(200.0, 18.0)
	if top_rect.size.x < 480.0:
		title_label.size.x = 106.0
		title_label.add_theme_font_size_override("font_size", 21)
		album_masthead_caption.visible = false
	else:
		title_label.add_theme_font_size_override("font_size", 38)
		album_masthead_caption.visible = true

	status_label.size = Vector2(112.0, 34.0)
	status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	status_label.position = Vector2(
		top_rect.position.x + (top_rect.size.x - status_label.size.x) * 0.5,
		top_rect.position.y + 10.0
	)

	var progress_width := minf(136.0, top_rect.size.x * 0.24)
	album_progress_track.position = Vector2(
		top_rect.position.x + (top_rect.size.x - progress_width) * 0.5,
		top_rect.position.y + 52.0
	)
	album_progress_track.size = Vector2(progress_width, 2.0)
	_refresh_album_progress()

	album_more_button.size = Vector2(100.0, 100.0)
	album_more_button.custom_minimum_size = Vector2(100.0, 100.0)
	album_more_button.position = top_rect.position + Vector2(
		top_rect.size.x - 100.0,
		0.0
	)

	album_difficulty_label.visible = top_rect.size.x >= 600.0
	album_difficulty_label.size = Vector2(126.0, 28.0)
	album_difficulty_label.position = Vector2(
		album_more_button.position.x - 130.0,
		top_rect.position.y + 27.0
	)

	var tab_width := AlbumMetrics.dock_button_width(viewport_size)
	for button in [preview_button, hint_button]:
		if button is Button:
			(button as Button).size.x = tab_width
			(button as Button).custom_minimum_size.x = tab_width

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
			(sort_control as Button).size.x = tab_width
			(sort_control as Button).custom_minimum_size.x = tab_width
			(sort_control as Button).position = AlbumMetrics.dock_slot_position(
				viewport_size,
				AlbumMetrics.SLOT_SORT_X
			)
		if layout_control is Button:
			(layout_control as Button).size.x = tab_width
			(layout_control as Button).custom_minimum_size.x = tab_width
			(layout_control as Button).position = AlbumMetrics.dock_slot_position(
				viewport_size,
				AlbumMetrics.SLOT_LAYOUT_X
			)

	_layout_dock_label("trays", viewport_size, AlbumMetrics.SLOT_SORT_X)
	_layout_dock_label("pieces", viewport_size, AlbumMetrics.SLOT_LAYOUT_X)
	_layout_dock_label("reference", viewport_size, AlbumMetrics.SLOT_PREVIEW_X)
	_layout_dock_label("hint", viewport_size, AlbumMetrics.SLOT_HINT_X)

	if spread_button != null and spread_button.visible:
		spread_button.position = Vector2(
			dock_rect.end.x - spread_button.size.x,
			maxf(top_rect.end.y + 12.0, dock_rect.position.y - spread_button.size.y - 10.0)
		)

	if album_overflow_panel != null:
		var safe := AlbumMetrics.safe_area_insets(viewport_size)
		var content = watercolor_overflow_scroll.get_child(0)
		watercolor_overflow_scroll.custom_minimum_size.y = minf(
			content.get_combined_minimum_size().y,
			maxf(96.0, viewport_size.y - safe.w - top_rect.end.y - 54.0)
		)
		album_overflow_panel.size = Vector2(
			minf(380.0, maxf(220.0, viewport_size.x - 28.0)),
			album_overflow_panel.get_combined_minimum_size().y
		)
		album_overflow_panel.position = Vector2(
			clampf(
				top_rect.end.x - album_overflow_panel.size.x,
				14.0 + safe.x,
				maxf(14.0 + safe.x, viewport_size.x - safe.z - album_overflow_panel.size.x - 14.0)
			),
			top_rect.end.y + 8.0
		)
		if album_overflow_backing != null:
			album_overflow_backing.position = album_overflow_panel.position + Vector2(2.0, 3.0)
			album_overflow_backing.size = album_overflow_panel.size

	# Reference is still a play-surface object; just clear the compact header.
	if sessions_panel != null:
		var safe := AlbumMetrics.safe_area_insets(viewport_size)
		var available := Vector2(viewport_size.x - safe.x - safe.z - 48, dock_rect.position.y - top_rect.end.y - 48)
		sessions_panel.custom_minimum_size = Vector2(0, 0)
		sessions_panel.size = Vector2(minf(640, available.x), minf(650, available.y))
		sessions_panel.position = Vector2(safe.x + (viewport_size.x - safe.x - safe.z - sessions_panel.size.x) * 0.5, top_rect.end.y + 24 + maxf(0, (available.y - sessions_panel.size.y) * 0.5))
	_layout_reference_panel(viewport_size, false)
	ReachablePaper.layout(self, viewport_size)
	if preview_panel != null and not preview_panel.user_positioned:
		preview_panel.position.y = maxf(preview_panel.position.y, top_rect.end.y + 16.0)


func _layout_album_backdrop(viewport_size: Vector2) -> void:
	if album_backdrop != null:
		album_backdrop.position = Vector2.ZERO
		album_backdrop.size = viewport_size


func _style_album_board_surface() -> void:
	if board == null:
		return
	var background = board.get_node_or_null("BoardBackground")
	if background is Polygon2D:
		(background as Polygon2D).color = BOARD_PAPER
		if album_mount_shadow == null:
			album_mount_shadow = Polygon2D.new()
			album_mount_shadow.name = "AlbumMountShadow"
			album_mount_shadow.z_index = -4
			album_mount_shadow.color = Color(0.27, 0.35, 0.31, 0.06)
			board.add_child(album_mount_shadow)
		if album_mount_paper == null:
			album_mount_paper = Polygon2D.new()
			album_mount_paper.name = "AlbumMountPaper"
			album_mount_paper.z_index = -3
			album_mount_paper.color = PAPER_LIGHT
			board.add_child(album_mount_paper)
		var mount_rect: Rect2 = board.board_rect.grow(10.0)
		album_mount_paper.polygon = _rect_polygon(mount_rect)
		album_mount_shadow.polygon = _rect_polygon(mount_rect.grow(1.5))
		album_mount_shadow.position = Vector2(1.5, 2.5)
	var frame = board.get_node_or_null("BoardFrame")
	if frame is Line2D:
		(frame as Line2D).default_color = Color(0.29, 0.39, 0.35, 0.10)
		(frame as Line2D).width = 1.0


func _rect_polygon(rect: Rect2) -> PackedVector2Array:
	return PackedVector2Array([
		rect.position,
		rect.position + Vector2(rect.size.x, 0.0),
		rect.end,
		rect.position + Vector2(0.0, rect.size.y),
	])


func _layout_dock_label(key: String, viewport_size: Vector2, slot_x: float) -> void:
	var label = album_dock_labels.get(key)
	if not (label is Label):
		return
	(label as Label).position = AlbumMetrics.dock_slot_position(viewport_size, slot_x) + Vector2(0.0, 66.0)
	(label as Label).size = Vector2(
		AlbumMetrics.dock_button_width(viewport_size),
		26.0
	)


func _on_progress_changed(solved_count: int, total_count: int) -> void:
	album_progress_solved = solved_count
	album_progress_total = maxi(total_count, 1)
	super._on_progress_changed(solved_count, total_count)
	if status_label != null:
		status_label.text = "%d / %d" % [solved_count, total_count]
	_style_album_board_surface()
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
	album_progress_fill.size = Vector2(
		album_progress_track.size.x * ratio,
		album_progress_track.size.y
	)


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
	_style_album_primary_actions()
	_sync_album_tab_captions()
	if album_overflow_lines != null:
		album_overflow_lines.set_pressed_no_signal(board_lines_enabled)
		_sync_album_lines_state()


func _toggle_album_overflow() -> void:
	if album_overflow_panel == null:
		return
	album_overflow_panel.visible = not album_overflow_panel.visible
	album_overflow_backing.visible = album_overflow_panel.visible
	if album_overflow_panel.visible:
		_sync_album_difficulty()
		album_overflow_panel.move_to_front()


func _close_album_overflow() -> void:
	if album_overflow_panel != null:
		album_overflow_panel.visible = false
	if album_overflow_backing != null:
		album_overflow_backing.visible = false


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
	_sync_album_lines_state()


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
	var marks := {"Fit workspace": Paper.Mark.FIT, "Board lines": Paper.Mark.GRID, "Reshuffle pieces": Paper.Mark.SHUFFLE, "Unfinished puzzles": Paper.Mark.SAVED, "Puzzle Journal": Paper.Mark.JOURNAL}
	Paper.mark_button(button, marks.get(text_value, Paper.Mark.MORE))
	button.add_theme_constant_override("icon_max_width", 30)
	button.add_theme_constant_override("h_separation", 16)
	button.alignment = HORIZONTAL_ALIGNMENT_LEFT
	button.custom_minimum_size = Vector2(0.0, 100.0)
	button.focus_mode = Control.FOCUS_NONE
	button.add_theme_font_size_override("font_size", 20)
	button.add_theme_color_override("font_color", INK)
	button.add_theme_color_override("font_hover_color", INK)
	button.add_theme_color_override("font_pressed_color", INK)
	button.add_theme_color_override("font_hover_pressed_color", INK)
	button.add_theme_stylebox_override(
		"normal",
		_overflow_row_style(false)
	)
	button.add_theme_stylebox_override(
		"hover",
		_overflow_row_style(true)
	)
	button.add_theme_stylebox_override(
		"pressed",
		_overflow_row_style(true, true)
	)
	button.add_theme_stylebox_override(
		"hover_pressed",
		_overflow_row_style(true, true)
	)
	button.add_theme_stylebox_override("focus", StyleBoxEmpty.new())
	return button


func _overflow_rule() -> ColorRect:
	var rule := ColorRect.new()
	rule.custom_minimum_size.y = 1.0
	rule.color = INK_FAINT
	rule.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return rule


func _overflow_spacer(height: float) -> Control:
	var spacer := Control.new()
	spacer.custom_minimum_size.y = height
	spacer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return spacer


func _overflow_row_style(highlight: bool, selected: bool = false) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = (
		Color(0.60, 0.74, 0.66, 0.18) if selected
		else Color(0.60, 0.74, 0.66, 0.10) if highlight
		else Color.TRANSPARENT
	)
	style.border_color = PAPER_BORDER
	style.border_width_bottom = 1
	style.content_margin_left = 3.0
	style.content_margin_right = 3.0
	return style


func _sync_album_lines_state() -> void:
	if album_lines_state == null:
		return
	album_lines_state.text = "ON" if board_lines_enabled else "OFF"
	album_lines_state.add_theme_color_override(
		"font_color", INK if board_lines_enabled else INK_SOFT
	)


func _make_more_icon() -> Texture2D:
	# A tiny procedural icon has consistent dots on Godot Web, unlike a
	# platform-dependent ellipsis font glyph.
	var icon_image := Image.create(48, 48, false, Image.FORMAT_RGBA8)
	icon_image.fill(Color.TRANSPARENT)
	for y in range(48):
		for x in range(48):
			var coverage := 0.0
			for center_x in [14.0, 24.0, 34.0]:
				coverage = maxf(coverage, clampf(3.9 - Vector2(x + 0.5 - center_x, y + 0.5 - 24.0).length(), 0.0, 1.0))
			if coverage > 0.0:
				icon_image.set_pixel(x, y, Color(INK.r, INK.g, INK.b, coverage))
	return ImageTexture.create_from_image(icon_image)


func _style_paper_tab_button(button: Button) -> void:
	button.size = Vector2(
		AlbumMetrics.DOCK_BUTTON_WIDTH,
		AlbumMetrics.DOCK_BUTTON_HEIGHT
	)
	button.custom_minimum_size = button.size
	button.focus_mode = Control.FOCUS_NONE
	button.modulate = Color.WHITE
	button.add_theme_constant_override("icon_max_width", 52)

	for state in [
		"font_color",
		"font_hover_color",
		"font_pressed_color",
		"font_hover_pressed_color",
		"icon_normal_color",
		"icon_hover_color",
		"icon_pressed_color",
		"icon_hover_pressed_color",
	]:
		button.add_theme_color_override(str(state), INK)

	button.add_theme_stylebox_override(
		"normal",
		_tab_style(Color(1.0, 1.0, 1.0, 0.0), false)
	)
	button.add_theme_stylebox_override(
		"hover",
		_tab_style(Color(0.60, 0.74, 0.66, 0.10), false)
	)
	button.add_theme_stylebox_override(
		"pressed",
		_tab_style(PAPER_TAB, true)
	)
	button.add_theme_stylebox_override(
		"hover_pressed",
		_tab_style(PAPER_TAB, true)
	)
	button.add_theme_stylebox_override("focus", StyleBoxEmpty.new())
	button.add_theme_color_override("font_disabled_color", INK_SOFT)
	button.add_theme_color_override("icon_disabled_color", INK_SOFT)
	button.add_theme_stylebox_override("disabled", _tab_style(Color.TRANSPARENT, false))


func _set_watercolor_icon(button: Button, index: int) -> void:
	if button == null:
		return
	var icon := AtlasTexture.new()
	icon.atlas = WatercolorIcons
	icon.region = Rect2(index * 64.0, 0.0, 64.0, 64.0)
	button.icon = icon


func _style_paper_square_button(button: Button, side: float, radius: int) -> void:
	button.size = Vector2(side, side)
	button.custom_minimum_size = Vector2(side, side)
	button.focus_mode = Control.FOCUS_NONE
	for state in [
		"font_color",
		"font_hover_color",
		"font_pressed_color",
		"font_hover_pressed_color",
	]:
		button.add_theme_color_override(str(state), INK)
	button.add_theme_stylebox_override(
		"normal",
		_small_paper_button_style(PAPER_LIGHT, radius, 5)
	)
	button.add_theme_stylebox_override(
		"hover",
		_small_paper_button_style(Color(0.98, 0.95, 0.90, 1.0), radius, 6)
	)
	button.add_theme_stylebox_override(
		"pressed",
		_small_paper_button_style(Color(0.84, 0.77, 0.66, 1.0), radius, 2)
	)
	button.add_theme_stylebox_override(
		"hover_pressed",
		_small_paper_button_style(Color(0.84, 0.77, 0.66, 1.0), radius, 2)
	)
	button.add_theme_stylebox_override("focus", StyleBoxEmpty.new())


func _tab_style(background: Color, selected: bool) -> StyleBox:
	if selected:
		if watercolor_selection == null:
			watercolor_selection = _make_watercolor_selection()
		var wash := StyleBoxTexture.new()
		wash.texture = watercolor_selection
		wash.content_margin_bottom = 30.0
		return wash
	var style := StyleBoxFlat.new()
	style.bg_color = background
	style.set_corner_radius_all(18)
	style.content_margin_bottom = 30.0
	return style


func _make_watercolor_selection() -> Texture2D:
	# Original static pigment study; one 160x112 texture reused by all four actions.
	var image := Image.create(160, 112, false, Image.FORMAT_RGBA8)
	for y in range(112):
		for x in range(160):
			var q := Vector2((float(x) - 80.0) / 72.0, (float(y) - 50.0) / 46.0)
			var grain := fposmod(sin(float(x * 127 + y * 311)) * 43758.5, 1.0)
			var edge := q.length() + sin(q.x * 8.0 + q.y * 5.0) * 0.035 + sin(q.y * 13.0) * 0.025
			var pool := exp(-pow((edge - 0.83) / 0.09, 2.0)) * 0.07
			var alpha := (1.0 - smoothstep(0.72, 1.05, edge)) * (0.15 + grain * 0.05) + pool
			image.set_pixel(x, y, Color(0.42, 0.62, 0.51, alpha))
	return ImageTexture.create_from_image(image)


func _more_paper_style(ink_alpha: float, _shadow_size: int) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.60, 0.74, 0.66, maxf(0.0, ink_alpha - 0.18) * 0.24)
	style.set_corner_radius_all(12)
	return style


func _small_paper_button_style(
	background: Color,
	radius: int,
	shadow_size: int
) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = background
	style.border_color = PAPER_BORDER
	style.set_border_width_all(1)
	style.set_corner_radius_all(radius)
	style.shadow_color = Color(0.25, 0.34, 0.30, 0.06)
	style.shadow_size = shadow_size
	return style


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
	style.shadow_color = Color(0.25, 0.34, 0.30, 0.08)
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
	style.border_color = PAPER_BORDER
	style.set_border_width_all(1)
	style.set_corner_radius_all(radius)
	return style


func commercial_hud_snapshot() -> Dictionary:
	var sorting = get_node_or_null("SortingWorkspace")
	var sort_control = sorting.get("sort_button") if sorting != null else null
	var layout_control = sorting.get("layout_mode_button") if sorting != null else null
	var board_background = board.get_node_or_null("BoardBackground") if board != null else null
	return {
		"top_rect": top_bar.get_rect() if top_bar != null else Rect2(),
		"dock_rect": bottom_dock.get_rect() if bottom_dock != null else Rect2(),
		"backdrop_exists": album_backdrop != null,
		"printed_hud": (
			top_bar.get_theme_stylebox("panel") is StyleBoxEmpty
			and bottom_dock.get_theme_stylebox("panel") is StyleBoxEmpty
		),
		"selection_wash_exists": watercolor_selection != null,
		"font_bundled": album_serif is FontFile and album_serif_italic is FontFile,
		"tab_caption_count": album_dock_labels.size(),
		"mount_exists": album_mount_paper != null and album_mount_shadow != null,
		"more_icon_exists": album_more_button != null and album_more_button.icon != null and album_more_button.text.is_empty(),
		"overflow_row_radius": (
			(album_overflow_lines.get_theme_stylebox("normal") as StyleBoxFlat).corner_radius_top_left
			if album_overflow_lines != null else -1
		),
		"overflow_difficulty_count": album_overflow_difficulty.get_item_count() if album_overflow_difficulty != null else 0,
		"board_paper": (
			(board_background as Polygon2D).color
			if board_background is Polygon2D
			else Color.TRANSPARENT
		),
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


func _style_gameplay_auxiliary_surfaces() -> void:
	for surface in [preview_panel, sessions_panel]:
		if surface != null:
			Paper.apply_tree(surface)
	_style_completion_paper()
	if timelapse_overlay != null:
		Paper.apply_tree(timelapse_overlay, false)
		timelapse_overlay.color = PAPER
		timelapse_stage.color = BOARD_PAPER
		timelapse_tray_panel.color = Paper.WELL
		timelapse_title.text = "Puzzle replay"
		timelapse_title.add_theme_font_override("font", Paper.SERIF)
	if album_overflow_panel != null:
		album_overflow_panel.theme = Paper.theme()
	if album_overflow_difficulty != null:
		Paper.apply_menu(album_overflow_difficulty.get_popup())


func _style_completion_paper() -> void:
	if completion_panel != null:
		Paper.apply_tree(completion_panel, false)
		if completion_heading != null:
			completion_heading.add_theme_font_override("font", Paper.SERIF)
			# Give the taller book serif the same completion-card envelope.
			completion_panel.get_child(0).add_theme_constant_override("separation", 7)
		for button in completion_panel.find_children("*", "Button", true, false):
			button.add_theme_constant_override("icon_max_width", 22)


func _refresh_sessions_list() -> void:
	super._refresh_sessions_list()
	if sessions_panel != null:
		Paper.apply_tree(sessions_panel)
		for card in sessions_list.get_children():
			if card is PanelContainer:
				card.add_theme_stylebox_override("panel", Paper.surface(true, 12))
				for child in card.get_child(0).get_children():
					if child is Label:
						child.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
						child.custom_minimum_size.x = 0
						child.add_theme_font_size_override("font_size", 22)
					elif child is Button and child.icon != null:
						child.custom_minimum_size.x = 88
		var heading = sessions_panel.get_child(0).get_child(0).get_child(0)
		heading.add_theme_font_override("font", Paper.SERIF)
		heading.add_theme_font_size_override("font_size", 34)
		var footer = sessions_panel.get_child(0).get_child(sessions_panel.get_child(0).get_child_count() - 1)
		footer.get_child(0).add_theme_stylebox_override("normal", Paper.button_box(true))


func _show_puzzle_selection(can_cancel: bool) -> void:
	super._show_puzzle_selection(can_cancel)
	ReachablePaper.style(self)
	ReachablePaper.layout(self, Vector2(get_window().content_scale_size))
	call_deferred("_relayout_paper_sheets")


func _refresh_gallery_cards() -> void:
	super._refresh_gallery_cards()
	if is_node_ready():
		ReachablePaper.style_cards(self)


func _refresh_content_card_state() -> void:
	super._refresh_content_card_state()
	if is_node_ready():
		ReachablePaper.style_cards(self)


func _refresh_journal_ui() -> void:
	super._refresh_journal_ui()
	Paper.apply_tree(journal_panel)
	ReachablePaper.soft_cards(journal_panel)
	var heading = journal_panel.get_child(0).get_child(0).get_child(0)
	heading.add_theme_font_override("font", Paper.SERIF)
	heading.add_theme_font_size_override("font_size", 34)
	for label in [journal_today, journal_week]:
		label.autowrap_mode = TextServer.AUTOWRAP_OFF
		label.add_theme_font_size_override("font_size", 26)
	call_deferred("_relayout_paper_sheets")


func _relayout_paper_sheets() -> void:
	await get_tree().process_frame
	ReachablePaper.layout(self, Vector2(get_window().content_scale_size))


func _apply_gallery_layout_for_orientation(logical_viewport_size: Vector2, orientation_size: Vector2) -> void:
	super._apply_gallery_layout_for_orientation(logical_viewport_size, orientation_size)
	if is_node_ready():
		ReachablePaper.style_cards(self)
		ReachablePaper.layout(self, Vector2(get_window().content_scale_size))


func _install_loading_curtain() -> void:
	super._install_loading_curtain()
	Paper.apply_tree(startup_curtain)
	startup_curtain.color = Paper.PAPER
	startup_copy.add_theme_color_override("font_color", Paper.SOFT)
	var masthead = startup_curtain.get_child(0).get_child(0).get_child(0)
	masthead.add_theme_font_override("font", Paper.SERIF)
	masthead.add_theme_font_size_override("font_size", 38)


func _apply_portrait_export_layout(viewport_size: Vector2) -> void:
	super._apply_portrait_export_layout(viewport_size)
	ReachablePaper.style_replay(self)
	for label in [timelapse_export_brand, timelapse_export_title, timelapse_export_stats, timelapse_export_substats, timelapse_export_signature]:
		label.modulate = Color.WHITE
		label.add_theme_color_override("font_color", Paper.SOFT)
	timelapse_export_title.add_theme_font_override("font", Paper.SERIF)


func _restore_standard_replay_layout() -> void:
	super._restore_standard_replay_layout()
	ReachablePaper.style_replay(self)
