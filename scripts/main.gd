extends Node

@onready var board: PuzzleBoard = $PuzzleBoard
@onready var puzzle_camera: PuzzleCameraController = $PuzzleCamera

var status_label: Label
var zoom_label: Label
var completion_panel: PanelContainer


func _ready() -> void:
	_build_ui()
	board.progress_changed.connect(_on_progress_changed)
	board.completed.connect(_on_completed)
	puzzle_camera.zoom_changed.connect(_on_zoom_changed)
	board.start_new_game()
	puzzle_camera.set_content_rect(board.navigation_bounds(), true)
	_on_zoom_changed(puzzle_camera.zoom.x)


func _build_ui() -> void:
	var layer := CanvasLayer.new()
	layer.name = "UI"
	add_child(layer)

	var title := Label.new()
	title.text = "Piecepace: Jigsaw Puzzles"
	title.position = Vector2(24.0, 18.0)
	title.add_theme_font_size_override("font_size", 25)
	layer.add_child(title)

	var subtitle := Label.new()
	subtitle.text = "V0-01 · Godot core vertical slice"
	subtitle.position = Vector2(26.0, 52.0)
	subtitle.modulate = Color(1.0, 1.0, 1.0, 0.58)
	subtitle.add_theme_font_size_override("font_size", 14)
	layer.add_child(subtitle)

	status_label = Label.new()
	status_label.position = Vector2(525.0, 28.0)
	status_label.custom_minimum_size = Vector2(230.0, 30.0)
	status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	status_label.add_theme_font_size_override("font_size", 18)
	layer.add_child(status_label)

	var zoom_out_button := Button.new()
	zoom_out_button.text = "−"
	zoom_out_button.position = Vector2(820.0, 20.0)
	zoom_out_button.size = Vector2(44.0, 44.0)
	zoom_out_button.tooltip_text = "Zoom out"
	zoom_out_button.pressed.connect(_zoom_out)
	layer.add_child(zoom_out_button)

	zoom_label = Label.new()
	zoom_label.position = Vector2(868.0, 28.0)
	zoom_label.size = Vector2(70.0, 28.0)
	zoom_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	zoom_label.add_theme_font_size_override("font_size", 16)
	layer.add_child(zoom_label)

	var zoom_in_button := Button.new()
	zoom_in_button.text = "+"
	zoom_in_button.position = Vector2(942.0, 20.0)
	zoom_in_button.size = Vector2(44.0, 44.0)
	zoom_in_button.tooltip_text = "Zoom in"
	zoom_in_button.pressed.connect(_zoom_in)
	layer.add_child(zoom_in_button)

	var fit_button := Button.new()
	fit_button.text = "Fit"
	fit_button.position = Vector2(994.0, 20.0)
	fit_button.size = Vector2(82.0, 44.0)
	fit_button.tooltip_text = "Fit the whole puzzle workspace"
	fit_button.pressed.connect(_fit_view)
	layer.add_child(fit_button)

	var restart_button := Button.new()
	restart_button.text = "Reshuffle"
	restart_button.position = Vector2(1092.0, 20.0)
	restart_button.size = Vector2(160.0, 44.0)
	restart_button.pressed.connect(_restart)
	layer.add_child(restart_button)

	var instruction := Label.new()
	instruction.text = "Drag pieces · Wheel/pinch to zoom · Middle/right drag or empty-space touch to pan"
	instruction.position = Vector2(340.0, 660.0)
	instruction.size = Vector2(600.0, 28.0)
	instruction.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	instruction.modulate = Color(1.0, 1.0, 1.0, 0.62)
	instruction.add_theme_font_size_override("font_size", 15)
	layer.add_child(instruction)

	completion_panel = PanelContainer.new()
	completion_panel.position = Vector2(465.0, 260.0)
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

	var complete_copy := Label.new()
	complete_copy.text = "12 pieces · first Piecepace vertical slice"
	complete_copy.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	complete_copy.modulate = Color(1.0, 1.0, 1.0, 0.65)
	completion_box.add_child(complete_copy)

	var again_button := Button.new()
	again_button.text = "Play again"
	again_button.custom_minimum_size = Vector2(180.0, 42.0)
	again_button.pressed.connect(_restart)
	completion_box.add_child(again_button)


func _on_progress_changed(solved_count: int, total_count: int) -> void:
	status_label.text = "%d / %d pieces" % [solved_count, total_count]


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
