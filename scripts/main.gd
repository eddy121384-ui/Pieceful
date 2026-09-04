extends Node

const BASE_SHORT_EDGE := 720.0
const RESIZE_DEBOUNCE_SECONDS := 0.06

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
var difficulty_caption: Label
var difficulty_select: OptionButton
var instruction_label: Label
var completion_panel: PanelContainer
var completion_copy: Label
var resize_debounce: Timer


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
	get_viewport().size_changed.connect(_schedule_responsive_reflow)

	var viewport_size := _sync_content_scale_to_window()
	board.apply_viewport_layout(viewport_size)
	board.start_new_game()
	puzzle_camera.set_content_rect(board.navigation_bounds(), true)
	_layout_ui(viewport_size)
	_on_zoom_changed(puzzle_camera.zoom.x)
	_refresh_difficulty_control()
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
	instruction_label.text = "Join matching neighbors anywhere · Drag a joined group as one · Wheel/pinch zoom · Pan empty space"
	instruction_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	instruction_label.modulate = Color(1.0, 1.0, 1.0, 0.62)
	instruction_label.add_theme_font_size_override("font_size", 15)
	layer.add_child(instruction_label)

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

	if width >= 760.0:
		instruction_label.position = Vector2(270.0, height - 56.0)
		instruction_label.size = Vector2(maxf(300.0, width - 294.0), 28.0)
	else:
		instruction_label.position = Vector2(margin, height - 128.0)
		instruction_label.size = Vector2(maxf(260.0, width - margin * 2.0), 28.0)

	completion_panel.position = Vector2(
		(width - completion_panel.size.x) * 0.5,
		(height - completion_panel.size.y) * 0.5
	)


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


func _on_difficulty_selected(index: int) -> void:
	var difficulty_id := str(difficulty_select.get_item_metadata(index))
	if difficulty_id == board.active_difficulty_id():
		return

	completion_panel.visible = false
	if board.request_difficulty(difficulty_id):
		puzzle_camera.set_content_rect(board.navigation_bounds(), true)
		_refresh_difficulty_control()
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
	if board.active_difficulty_id() == "regression":
		runtime_label.text = "%s · 12-piece regression fixture · Relaxed asset missing" % board.workspace_orientation_label()
		return

	runtime_label.text = "%s · %s runtime · %s · %d pieces" % [
		board.workspace_orientation_label(),
		board.active_difficulty_label(),
		board.active_pattern_id(),
		board.active_piece_count(),
	]


func _schedule_responsive_reflow() -> void:
	if resize_debounce != null:
		resize_debounce.start()


func _apply_responsive_reflow() -> void:
	var viewport_size := _sync_content_scale_to_window()
	var orientation_changed := board.apply_viewport_layout(viewport_size)
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


func _on_completed() -> void:
	completion_panel.visible = true


func _restart() -> void:
	completion_panel.visible = false
	board.start_new_game()
	puzzle_camera.set_content_rect(board.navigation_bounds(), true)
	_refresh_difficulty_control()
	_update_runtime_label()
