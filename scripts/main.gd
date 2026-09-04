extends Node

const BASE_SHORT_EDGE := 720.0
const RESIZE_DEBOUNCE_SECONDS := 0.06
const BoardCutLinesOverlayScript = preload("res://scripts/board_cut_lines_overlay.gd")

@onready var board: RuntimePuzzleBoard = $PuzzleBoard
@onready var puzzle_camera: PuzzleCameraController = $PuzzleCamera

var title_label: Label
var subtitle_label: Label
var status_label: Label
var runtime_label: Label
var zoom_label: Label
var zoom_out_button: Button
var zoom_in_button: Button
var fit_button: Button
var restart_button: Button
var preview_button: Button
var hint_button: Button
var board_lines_button: Button
var difficulty_caption: Label
var difficulty_select: OptionButton
var instruction_label: Label
var completion_panel: PanelContainer
var completion_copy: Label
var preview_panel: PanelContainer
var preview_texture_rect: TextureRect
var resize_debounce: Timer
var board_lines_overlay = null

# Player-aid switches are intentionally independent. Preview defaults off so the
# workspace starts uncluttered; subtle board cut lines and Hint default on for the
# normal experience. These settings survive reshuffles, difficulty changes, and
# live orientation changes for the lifetime of this runtime session. Disk save is
# deferred to Issue #3.
var preview_enabled := false
var board_lines_enabled := true


func _ready() -> void:
	_build_ui()
	_build_resize_observer()
	board.progress_changed.connect(_on_progress_changed)
	board.completed.connect(_on_completed)
	puzzle_camera.zoom_changed.connect(_on_zoom_changed)

	# Window size is the source of truth for device orientation. With stretch
	# enabled, the root Viewport can keep its previous logical size while the OS
	# window is already being resized, so viewport.size_changed alone is not a
	# reliable orientation signal.
	get_window().size_changed.connect(_schedule_responsive_reflow)

	var viewport_size := _sync_content_scale_to_window()
	board.apply_viewport_layout(viewport_size)
	board.start_new_game()
	puzzle_camera.set_content_rect(board.navigation_bounds(), true)
	_refresh_board_lines_overlay()
	_refresh_reference_panel()
	_layout_ui(viewport_size)
	_on_zoom_changed(puzzle_camera.zoom.x)
	_refresh_difficulty_control()
	_refresh_aid_controls()
	_update_runtime_label()


func _build_resize_observer() -> void:
	resize_debounce = Timer.new()
	resize_debounce.one_shot = true
	resize_debounce.wait_time = RESIZE_DEBOUNCE_SECONDS
	resize_debounce.timeout.connect(_apply_responsive_reflow)
	add_child(resize_debounce)


func _build_ui() -> void:
	var layer := CanvasLayer.new()
	layer.name = "UI"
	add_child(layer)

	title_label = Label.new()
	title_label.text = "Piecepace: Jigsaw Puzzles"
	title_label.size = Vector2(340.0, 34.0)
	title_label.add_theme_font_size_override("font_size", 25)
	layer.add_child(title_label)

	subtitle_label = Label.new()
	subtitle_label.text = "V0-02 · Basic Puzzle Workspace"
	subtitle_label.size = Vector2(300.0, 22.0)
	subtitle_label.modulate = Color(1.0, 1.0, 1.0, 0.58)
	subtitle_label.add_theme_font_size_override("font_size", 14)
	layer.add_child(subtitle_label)

	runtime_label = Label.new()
	runtime_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	runtime_label.modulate = Color(1.0, 1.0, 1.0, 0.52)
	runtime_label.add_theme_font_size_override("font_size", 12)
	layer.add_child(runtime_label)

	status_label = Label.new()
	status_label.size = Vector2(230.0, 30.0)
	status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	status_label.add_theme_font_size_override("font_size", 18)
	layer.add_child(status_label)

	zoom_out_button = Button.new()
	zoom_out_button.text = "−"
	zoom_out_button.size = Vector2(44.0, 44.0)
	zoom_out_button.tooltip_text = "Zoom out"
	zoom_out_button.pressed.connect(_zoom_out)
	layer.add_child(zoom_out_button)

	zoom_label = Label.new()
	zoom_label.size = Vector2(64.0, 28.0)
	zoom_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	zoom_label.add_theme_font_size_override("font_size", 16)
	layer.add_child(zoom_label)

	zoom_in_button = Button.new()
	zoom_in_button.text = "+"
	zoom_in_button.size = Vector2(44.0, 44.0)
	zoom_in_button.tooltip_text = "Zoom in"
	zoom_in_button.pressed.connect(_zoom_in)
	layer.add_child(zoom_in_button)

	fit_button = Button.new()
	fit_button.text = "Fit"
	fit_button.size = Vector2(82.0, 44.0)
	fit_button.tooltip_text = "Fit the whole puzzle workspace"
	fit_button.pressed.connect(_fit_view)
	layer.add_child(fit_button)

	restart_button = Button.new()
	restart_button.text = "Reshuffle"
	restart_button.size = Vector2(140.0, 44.0)
	restart_button.pressed.connect(_restart)
	layer.add_child(restart_button)

	preview_button = Button.new()
	preview_button.toggle_mode = true
	preview_button.size = Vector2(112.0, 44.0)
	preview_button.toggled.connect(_on_preview_toggled)
	layer.add_child(preview_button)

	hint_button = Button.new()
	hint_button.toggle_mode = true
	hint_button.size = Vector2(112.0, 44.0)
	hint_button.toggled.connect(_on_hint_toggled)
	layer.add_child(hint_button)

	board_lines_button = Button.new()
	board_lines_button.toggle_mode = true
	board_lines_button.size = Vector2(132.0, 44.0)
	board_lines_button.toggled.connect(_on_board_lines_toggled)
	layer.add_child(board_lines_button)

	difficulty_caption = Label.new()
	difficulty_caption.text = "Difficulty"
	difficulty_caption.size = Vector2(230.0, 20.0)
	difficulty_caption.modulate = Color(1.0, 1.0, 1.0, 0.62)
	difficulty_caption.add_theme_font_size_override("font_size", 13)
	layer.add_child(difficulty_caption)

	difficulty_select = OptionButton.new()
	difficulty_select.size = Vector2(230.0, 40.0)
	for preset in board.difficulty_presets():
		var difficulty_id := str(preset["id"])
		var resolved_count := int(preset["resolved_piece_count"])
		difficulty_select.add_item("%s · %d" % [str(preset["label"]), resolved_count])
		var item_index := difficulty_select.get_item_count() - 1
		difficulty_select.set_item_metadata(item_index, difficulty_id)
	difficulty_select.item_selected.connect(_on_difficulty_selected)
	layer.add_child(difficulty_select)

	instruction_label = Label.new()
	instruction_label.text = "Join matching neighbors anywhere · Preview / Hint / Board Lines are optional · Wheel/pinch zoom · Pan empty space"
	instruction_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	instruction_label.modulate = Color(1.0, 1.0, 1.0, 0.62)
	instruction_label.add_theme_font_size_override("font_size", 14)
	layer.add_child(instruction_label)

	preview_panel = PanelContainer.new()
	preview_panel.visible = false
	preview_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(preview_panel)

	var preview_box := VBoxContainer.new()
	preview_box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	preview_panel.add_child(preview_box)

	var preview_title := Label.new()
	preview_title.text = "Reference"
	preview_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	preview_title.modulate = Color(1.0, 1.0, 1.0, 0.72)
	preview_title.add_theme_font_size_override("font_size", 13)
	preview_title.mouse_filter = Control.MOUSE_FILTER_IGNORE
	preview_box.add_child(preview_title)

	preview_texture_rect = TextureRect.new()
	preview_texture_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	preview_texture_rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	preview_texture_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	preview_box.add_child(preview_texture_rect)

	completion_panel = PanelContainer.new()
	completion_panel.size = Vector2(350.0, 180.0)
	completion_panel.custom_minimum_size = Vector2(350.0, 180.0)
	completion_panel.visible = false
	layer.add_child(completion_panel)

	var completion_box := VBoxContainer.new()
	completion_box.alignment = BoxContainer.ALIGNMENT_CENTER
	completion_panel.add_child(completion_box)

	var complete_title := Label.new()
	complete_title.text = "Puzzle complete"
	complete_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	complete_title.add_theme_font_size_override("font_size", 28)
	completion_box.add_child(complete_title)

	completion_copy = Label.new()
	completion_copy.text = "Runtime puzzle"
	completion_copy.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	completion_copy.modulate = Color(1.0, 1.0, 1.0, 0.65)
	completion_box.add_child(completion_copy)

	var again_button := Button.new()
	again_button.text = "Play again"
	again_button.custom_minimum_size = Vector2(180.0, 42.0)
	again_button.pressed.connect(_restart)
	completion_box.add_child(again_button)


func _layout_ui(viewport_size: Vector2) -> void:
	var width := maxf(viewport_size.x, 1.0)
	var height := maxf(viewport_size.y, 1.0)
	var margin := 24.0
	var controls_width := 406.0
	var controls_start := width - margin - controls_width
	var compact_top := controls_start < 780.0

	title_label.position = Vector2(margin, 16.0)
	subtitle_label.position = Vector2(margin + 2.0, 50.0)

	if compact_top:
		status_label.position = Vector2(maxf(margin, width - 248.0), 22.0)
		runtime_label.position = Vector2(margin, 70.0)
		runtime_label.size = Vector2(maxf(260.0, width - margin * 2.0), 20.0)
		controls_start = maxf(margin, (width - controls_width) * 0.5)
	else:
		status_label.position = Vector2(width * 0.5 - 115.0, 26.0)
		runtime_label.position = Vector2(width * 0.21, 54.0)
		runtime_label.size = Vector2(width * 0.58, 20.0)

	var controls_y := 94.0 if compact_top else 20.0
	var cursor_x := controls_start
	zoom_out_button.position = Vector2(cursor_x, controls_y)
	cursor_x += 52.0
	zoom_label.position = Vector2(cursor_x, controls_y + 8.0)
	cursor_x += 72.0
	zoom_in_button.position = Vector2(cursor_x, controls_y)
	cursor_x += 52.0
	fit_button.position = Vector2(cursor_x, controls_y)
	cursor_x += 90.0
	restart_button.position = Vector2(cursor_x, controls_y)

	difficulty_caption.position = Vector2(margin, height - 92.0)
	difficulty_select.position = Vector2(margin, height - 68.0)

	var aid_controls_width := 372.0
	var aid_start := width - margin - aid_controls_width
	preview_button.position = Vector2(aid_start, height - 68.0)
	hint_button.position = Vector2(aid_start + 120.0, height - 68.0)
	board_lines_button.position = Vector2(aid_start + 240.0, height - 68.0)

	instruction_label.position = Vector2(margin, height - 126.0)
	instruction_label.size = Vector2(maxf(260.0, width - margin * 2.0), 28.0)

	_layout_reference_panel(viewport_size, compact_top)

	completion_panel.position = Vector2(
		(width - completion_panel.size.x) * 0.5,
		(height - completion_panel.size.y) * 0.5
	)


func _layout_reference_panel(viewport_size: Vector2, compact_top: bool) -> void:
	if preview_panel == null or preview_texture_rect == null:
		return

	var width := maxf(viewport_size.x, 1.0)
	var margin := 24.0
	var panel_width := 220.0 if width >= 900.0 else 180.0
	var texture_aspect := 1.6
	if preview_texture_rect.texture != null:
		var texture_size := preview_texture_rect.texture.get_size()
		if texture_size.y > 0.0:
			texture_aspect = texture_size.x / texture_size.y

	var image_width := panel_width - 16.0
	var image_height := image_width / maxf(texture_aspect, 0.01)
	var panel_height := image_height + 34.0
	preview_texture_rect.custom_minimum_size = Vector2(image_width, image_height)
	preview_panel.custom_minimum_size = Vector2(panel_width, panel_height)
	preview_panel.size = Vector2(panel_width, panel_height)

	var panel_y := 156.0 if compact_top else 86.0
	preview_panel.position = Vector2(width - margin - panel_width, panel_y)


func _on_progress_changed(solved_count: int, total_count: int) -> void:
	status_label.text = "%d / %d pieces" % [solved_count, total_count]
	if completion_copy != null:
		completion_copy.text = "%s · %d pieces · %s" % [
			board.active_difficulty_label(),
			total_count,
			board.active_pattern_id(),
		]


func _refresh_difficulty_control() -> void:
	if difficulty_select == null:
		return

	var active_id := board.active_difficulty_id()
	for index in range(difficulty_select.get_item_count()):
		var difficulty_id := str(difficulty_select.get_item_metadata(index))
		var available := board.difficulty_available(difficulty_id)
		var preset := board.difficulty_catalog.preset_for(difficulty_id)
		var label := "%s · %d" % [
			str(preset["label"]),
			int(preset["resolved_piece_count"]),
		]
		if not available:
			label += " · approve die"
		difficulty_select.set_item_text(index, label)
		difficulty_select.set_item_disabled(index, not available)
		if difficulty_id == active_id:
			difficulty_select.select(index)


func _refresh_aid_controls() -> void:
	if preview_button != null:
		preview_button.set_pressed_no_signal(preview_enabled)
		preview_button.text = "Preview: On" if preview_enabled else "Preview: Off"
		preview_button.tooltip_text = "Show or hide the floating reference image"

	if hint_button != null:
		hint_button.set_pressed_no_signal(board.hint_is_enabled())
		hint_button.text = "Hint: On" if board.hint_is_enabled() else "Hint: Off"
		hint_button.tooltip_text = (
			"Show a target-region clue while dragging"
			if board.hint_is_enabled()
			else "No target-region clues"
		)

	if board_lines_button != null:
		board_lines_button.set_pressed_no_signal(board_lines_enabled)
		board_lines_button.text = "Lines: On" if board_lines_enabled else "Lines: Off"
		board_lines_button.tooltip_text = "Show or hide subtle die-cut outlines on the board"


func _refresh_reference_panel() -> void:
	if preview_panel == null or preview_texture_rect == null:
		return
	if board.definition != null:
		preview_texture_rect.texture = board.definition.texture
	preview_panel.visible = preview_enabled and preview_texture_rect.texture != null


func _refresh_board_lines_overlay() -> void:
	if board_lines_overlay == null or not is_instance_valid(board_lines_overlay):
		board_lines_overlay = BoardCutLinesOverlayScript.new()
		board_lines_overlay.name = "BoardCutLinesOverlay"
		board.add_child(board_lines_overlay)

	board_lines_overlay.configure(board)
	board_lines_overlay.visible = board_lines_enabled


func _on_difficulty_selected(index: int) -> void:
	var difficulty_id := str(difficulty_select.get_item_metadata(index))
	if difficulty_id == board.active_difficulty_id():
		return

	completion_panel.visible = false
	if board.request_difficulty(difficulty_id):
		puzzle_camera.set_content_rect(board.navigation_bounds(), true)
		_refresh_difficulty_control()
		_refresh_board_lines_overlay()
		_refresh_reference_panel()
		_refresh_aid_controls()
		_update_runtime_label()
		return

	# Missing curated assets must not silently downgrade to another difficulty.
	# Restore the current selection and surface the authoring requirement instead.
	_refresh_difficulty_control()
	if runtime_label != null:
		runtime_label.text = board.last_difficulty_error


func _update_runtime_label() -> void:
	if runtime_label == null:
		return
	var hint_state := "Hint On" if board.hint_is_enabled() else "Hint Off"
	if board.active_difficulty_id() == "regression":
		runtime_label.text = "%s · 12-piece regression fixture · Relaxed asset missing · %s" % [
			board.workspace_orientation_label(),
			hint_state,
		]
		return

	runtime_label.text = "%s · %s runtime · %s · %d pieces · %s" % [
		board.workspace_orientation_label(),
		board.active_difficulty_label(),
		board.active_pattern_id(),
		board.active_piece_count(),
		hint_state,
	]


func _schedule_responsive_reflow() -> void:
	if resize_debounce != null:
		resize_debounce.start()


func _apply_responsive_reflow() -> void:
	var viewport_size := _sync_content_scale_to_window()
	var orientation_changed := board.apply_viewport_layout(viewport_size)
	_refresh_board_lines_overlay()
	_layout_ui(viewport_size)
	puzzle_camera.set_content_rect(board.navigation_bounds(), false)
	if orientation_changed:
		puzzle_camera.fit_to_content()
	_update_runtime_label()


func _sync_content_scale_to_window() -> Vector2:
	var physical_size := Vector2(get_window().size)
	if physical_size.x <= 1.0 or physical_size.y <= 1.0:
		return get_viewport().get_visible_rect().size

	var physical_aspect := physical_size.x / physical_size.y
	var logical_size := Vector2.ZERO
	if physical_aspect >= 1.0:
		logical_size = Vector2(BASE_SHORT_EDGE * physical_aspect, BASE_SHORT_EDGE)
	else:
		logical_size = Vector2(BASE_SHORT_EDGE, BASE_SHORT_EDGE / physical_aspect)

	var desired_scale_size := Vector2i(
		maxi(1, int(round(logical_size.x))),
		maxi(1, int(round(logical_size.y)))
	)
	if get_window().content_scale_size != desired_scale_size:
		get_window().content_scale_size = desired_scale_size

	return Vector2(desired_scale_size)


func _on_zoom_changed(zoom_scale: float) -> void:
	if zoom_label != null:
		zoom_label.text = "%d%%" % int(round(zoom_scale * 100.0))


func _zoom_out() -> void:
	puzzle_camera.zoom_step(-1)


func _zoom_in() -> void:
	puzzle_camera.zoom_step(1)


func _fit_view() -> void:
	puzzle_camera.fit_to_content()


func _on_preview_toggled(enabled: bool) -> void:
	preview_enabled = enabled
	_refresh_reference_panel()
	_refresh_aid_controls()
	_layout_reference_panel(_sync_content_scale_to_window(), board.workspace_orientation == "portrait")


func _on_hint_toggled(enabled: bool) -> void:
	board.set_hint_enabled(enabled)
	_refresh_aid_controls()
	_update_runtime_label()


func _on_board_lines_toggled(enabled: bool) -> void:
	board_lines_enabled = enabled
	_refresh_board_lines_overlay()
	_refresh_aid_controls()


func _on_completed() -> void:
	completion_panel.visible = true


func _restart() -> void:
	completion_panel.visible = false
	board.start_new_game()
	puzzle_camera.set_content_rect(board.navigation_bounds(), true)
	_refresh_board_lines_overlay()
	_refresh_reference_panel()
	_refresh_difficulty_control()
	_refresh_aid_controls()
	_update_runtime_label()
