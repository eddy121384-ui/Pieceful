extends "res://scripts/main.gd"

const Icons = preload("res://scripts/ui_icon_catalog.gd")


func _build_ui() -> void:
	super._build_ui()

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

	instruction_label.text = "Drag · snap · pinch to zoom · pan empty space"
	_iconify_completion_action()
	_simplify_reference_caption()


func _layout_ui(viewport_size: Vector2) -> void:
	super._layout_ui(viewport_size)

	var width := maxf(viewport_size.x, 1.0)
	var height := maxf(viewport_size.y, 1.0)
	var margin := 24.0
	var controls_width := 276.0
	var controls_start := width - margin - controls_width
	var compact_top := controls_start < 780.0
	if compact_top:
		controls_start = maxf(margin, (width - controls_width) * 0.5)

	var controls_y := 94.0 if compact_top else 20.0
	var cursor_x := controls_start
	zoom_out_button.position = Vector2(cursor_x, controls_y)
	cursor_x += 48.0

	zoom_label.size = Vector2(52.0, 28.0)
	zoom_label.position = Vector2(cursor_x, controls_y + 8.0)
	cursor_x += 56.0

	zoom_in_button.position = Vector2(cursor_x, controls_y)
	cursor_x += 48.0
	fit_button.position = Vector2(cursor_x, controls_y)
	cursor_x += 48.0
	restart_button.position = Vector2(cursor_x, controls_y)

	var aid_controls_width := 148.0
	var aid_start := width - margin - aid_controls_width
	preview_button.position = Vector2(aid_start, height - 68.0)
	hint_button.position = Vector2(aid_start + 52.0, height - 68.0)
	board_lines_button.position = Vector2(aid_start + 104.0, height - 68.0)

	_layout_reference_panel(viewport_size, compact_top)


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
		var hint_enabled := board.hint_is_enabled()
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
	if runtime_label == null:
		return
	if board.active_difficulty_id() == "regression":
		runtime_label.text = "%s · regression · 12 pieces" % [
			board.workspace_orientation_label(),
		]
		return

	runtime_label.text = "%s · %s · %d pieces" % [
		board.workspace_orientation_label(),
		board.active_difficulty_label(),
		board.active_piece_count(),
	]


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
	var caption := _find_label_with_text(preview_panel, "Reference · drag to move")
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
