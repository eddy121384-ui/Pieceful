extends "res://scripts/multi_slot_chaos_order_spatial_main.gd"

var puzzle_selection_overlay: ColorRect = null
var puzzle_selection_panel: PanelContainer = null
var puzzle_selection_cards: HBoxContainer = null
var puzzle_selection_difficulty: OptionButton = null
var puzzle_selection_start: Button = null
var puzzle_selection_cancel: Button = null
var puzzle_selection_error: Label = null
var content_buttons: Dictionary = {}
var pending_content_id := "garden"


func _ready() -> void:
	super._ready()
	call_deferred("_wait_for_catalog_bootstrap")


func _build_ui() -> void:
	super._build_ui()
	_build_puzzle_selection_ui()


func _build_puzzle_selection_ui() -> void:
	if title_label == null:
		return
	var layer := title_label.get_parent()
	if layer == null:
		return

	puzzle_selection_overlay = ColorRect.new()
	puzzle_selection_overlay.name = "PuzzleSelectionOverlay"
	puzzle_selection_overlay.visible = false
	puzzle_selection_overlay.color = Color(0.01, 0.012, 0.018, 0.82)
	puzzle_selection_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	layer.add_child(puzzle_selection_overlay)

	puzzle_selection_panel = PanelContainer.new()
	puzzle_selection_panel.name = "PuzzleSelectionPanel"
	puzzle_selection_panel.custom_minimum_size = Vector2(560.0, 430.0)
	puzzle_selection_panel.add_theme_stylebox_override(
		"panel",
		_chrome_style(
			Color(0.035, 0.04, 0.055, 0.98),
			Color(1.0, 1.0, 1.0, 0.15),
			22,
			14
		)
	)
	puzzle_selection_overlay.add_child(puzzle_selection_panel)

	var outer := VBoxContainer.new()
	outer.add_theme_constant_override("separation", 12)
	outer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT, Control.PRESET_MODE_MINSIZE, 18)
	puzzle_selection_panel.add_child(outer)

	var heading := Label.new()
	heading.text = "Choose a puzzle"
	heading.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	heading.add_theme_font_size_override("font_size", 28)
	outer.add_child(heading)

	var subheading := Label.new()
	subheading.text = "Pick an artwork, then choose the piece count."
	subheading.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subheading.modulate = Color(1.0, 1.0, 1.0, 0.62)
	outer.add_child(subheading)

	puzzle_selection_cards = HBoxContainer.new()
	puzzle_selection_cards.alignment = BoxContainer.ALIGNMENT_CENTER
	puzzle_selection_cards.add_theme_constant_override("separation", 14)
	puzzle_selection_cards.size_flags_vertical = Control.SIZE_EXPAND_FILL
	outer.add_child(puzzle_selection_cards)

	if board != null and board.has_method("content_presets"):
		for preset_value in board.content_presets():
			if preset_value is Dictionary:
				_add_content_card(preset_value)

	var difficulty_row := HBoxContainer.new()
	difficulty_row.alignment = BoxContainer.ALIGNMENT_CENTER
	difficulty_row.add_theme_constant_override("separation", 10)
	outer.add_child(difficulty_row)

	var difficulty_label := Label.new()
	difficulty_label.text = "Difficulty"
	difficulty_label.modulate = Color(1.0, 1.0, 1.0, 0.72)
	difficulty_row.add_child(difficulty_label)

	puzzle_selection_difficulty = OptionButton.new()
	puzzle_selection_difficulty.custom_minimum_size = Vector2(230.0, 40.0)
	for preset in board.difficulty_presets():
		var difficulty_id := str(preset.get("id", ""))
		if difficulty_id.is_empty() or not board.difficulty_available(difficulty_id):
			continue
		var count := int(preset.get("resolved_piece_count", 0))
		puzzle_selection_difficulty.add_item("%s · %d pieces" % [preset.get("label", difficulty_id), count])
		puzzle_selection_difficulty.set_item_metadata(
			puzzle_selection_difficulty.get_item_count() - 1,
			difficulty_id
		)
	difficulty_row.add_child(puzzle_selection_difficulty)

	puzzle_selection_error = Label.new()
	puzzle_selection_error.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	puzzle_selection_error.modulate = Color(1.0, 0.62, 0.62, 0.94)
	puzzle_selection_error.visible = false
	outer.add_child(puzzle_selection_error)

	var actions := HBoxContainer.new()
	actions.alignment = BoxContainer.ALIGNMENT_CENTER
	actions.add_theme_constant_override("separation", 10)
	outer.add_child(actions)

	puzzle_selection_cancel = Button.new()
	puzzle_selection_cancel.text = "Cancel"
	puzzle_selection_cancel.custom_minimum_size = Vector2(108.0, 42.0)
	puzzle_selection_cancel.pressed.connect(_hide_puzzle_selection)
	actions.add_child(puzzle_selection_cancel)

	puzzle_selection_start = Button.new()
	puzzle_selection_start.text = "Start puzzle"
	puzzle_selection_start.custom_minimum_size = Vector2(150.0, 42.0)
	puzzle_selection_start.pressed.connect(_start_selected_puzzle)
	actions.add_child(puzzle_selection_start)


func _add_content_card(preset: Dictionary) -> void:
	var content_id := str(preset.get("id", ""))
	var path := str(preset.get("path", ""))
	if content_id.is_empty() or path.is_empty():
		return

	var card := VBoxContainer.new()
	card.custom_minimum_size = Vector2(230.0, 178.0)
	card.add_theme_constant_override("separation", 6)
	puzzle_selection_cards.add_child(card)

	var picture := TextureButton.new()
	picture.name = "Artwork_%s" % content_id
	picture.custom_minimum_size = Vector2(230.0, 142.0)
	picture.ignore_texture_size = true
	picture.stretch_mode = TextureButton.STRETCH_KEEP_ASPECT_CENTERED
	picture.toggle_mode = true
	var texture = load(path)
	if texture is Texture2D:
		picture.texture_normal = texture
		picture.texture_pressed = texture
		picture.texture_hover = texture
	picture.pressed.connect(_on_content_card_pressed.bind(content_id))
	card.add_child(picture)
	content_buttons[content_id] = picture

	var caption := Label.new()
	caption.text = str(preset.get("label", content_id.capitalize()))
	caption.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	caption.add_theme_font_size_override("font_size", 16)
	card.add_child(caption)


func _layout_ui(viewport_size: Vector2) -> void:
	super._layout_ui(viewport_size)
	if puzzle_selection_overlay == null or puzzle_selection_panel == null:
		return
	puzzle_selection_overlay.position = Vector2.ZERO
	puzzle_selection_overlay.size = viewport_size
	var panel_size := Vector2(
		minf(590.0, maxf(330.0, viewport_size.x - 28.0)),
		minf(470.0, maxf(390.0, viewport_size.y - 36.0))
	)
	puzzle_selection_panel.size = panel_size
	puzzle_selection_panel.position = Vector2(
		(viewport_size.x - panel_size.x) * 0.5,
		(viewport_size.y - panel_size.y) * 0.5
	)


func _wait_for_catalog_bootstrap() -> void:
	var coordinator = get_node_or_null("SaveCoordinator")
	for _frame in range(60):
		if coordinator != null and not bool(coordinator.get("bootstrapping")):
			break
		await get_tree().process_frame
		coordinator = get_node_or_null("SaveCoordinator")

	_sync_artwork_ui()
	_refresh_sessions_list()
	if (
		coordinator != null
		and coordinator.has_method("needs_new_game_selection")
		and coordinator.needs_new_game_selection()
	):
		_show_puzzle_selection(false)


func _on_content_card_pressed(content_id: String) -> void:
	pending_content_id = content_id
	_refresh_content_card_state()


func _refresh_content_card_state() -> void:
	for content_id_value in content_buttons.keys():
		var content_id := str(content_id_value)
		var button := content_buttons[content_id] as BaseButton
		if button == null:
			continue
		var selected := content_id == pending_content_id
		button.set_pressed_no_signal(selected)
		button.modulate = Color.WHITE if selected else Color(1.0, 1.0, 1.0, 0.58)


func _show_puzzle_selection(can_cancel: bool) -> void:
	if puzzle_selection_overlay == null:
		return
	pending_content_id = (
		str(board.active_content_id())
		if board != null and board.has_method("active_content_id")
		else "garden"
	)
	_select_picker_difficulty(str(board.active_difficulty_id()))
	_refresh_content_card_state()
	puzzle_selection_error.visible = false
	puzzle_selection_cancel.visible = can_cancel
	puzzle_selection_overlay.visible = true
	puzzle_selection_overlay.move_to_front()


func _hide_puzzle_selection() -> void:
	if puzzle_selection_overlay != null and puzzle_selection_cancel.visible:
		puzzle_selection_overlay.visible = false


func _select_picker_difficulty(difficulty_id: String) -> void:
	if puzzle_selection_difficulty == null:
		return
	for index in range(puzzle_selection_difficulty.get_item_count()):
		if str(puzzle_selection_difficulty.get_item_metadata(index)) == difficulty_id:
			puzzle_selection_difficulty.select(index)
			return
	if puzzle_selection_difficulty.get_item_count() > 0:
		puzzle_selection_difficulty.select(0)


func _start_selected_puzzle() -> void:
	if puzzle_selection_difficulty == null or puzzle_selection_difficulty.get_item_count() <= 0:
		return
	var difficulty_id := str(
		puzzle_selection_difficulty.get_item_metadata(puzzle_selection_difficulty.selected)
	)
	var committing_initial: bool = (
		save_coordinator != null
		and save_coordinator.has_method("needs_new_game_selection")
		and bool(save_coordinator.needs_new_game_selection())
	)
	if (
		save_coordinator != null
		and save_coordinator.has_active_game()
		and not committing_initial
	):
		if not save_coordinator.save_now(true):
			_show_selection_error("Could not preserve the current puzzle.")
			return
	if not board.has_method("select_content") or not board.select_content(pending_content_id):
		_show_selection_error("That artwork is not available.")
		return
	if not board.request_difficulty(difficulty_id):
		_show_selection_error("That difficulty is not available.")
		return

	_randomize_runtime_scatter()
	puzzle_camera.set_content_rect(board.navigation_bounds(), true)
	_apply_preview_mode()
	_sync_artwork_ui()
	_refresh_board_lines_overlay()
	_refresh_difficulty_control()
	_refresh_aid_controls()
	_update_runtime_label()
	completion_panel.visible = false

	if save_coordinator != null:
		if committing_initial and save_coordinator.has_method("commit_initial_selection"):
			if not save_coordinator.commit_initial_selection():
				_show_selection_error("Could not save the selected puzzle.")
				return
		else:
			save_coordinator.create_slot_for_current_runtime()
		_refresh_sessions_list()
	puzzle_selection_overlay.visible = false


func _show_selection_error(message: String) -> void:
	if puzzle_selection_error != null:
		puzzle_selection_error.text = message
		puzzle_selection_error.visible = true


func _sync_artwork_ui() -> void:
	if board == null:
		return
	if preview_texture_rect != null and board.has_method("active_puzzle_texture"):
		preview_texture_rect.texture = board.active_puzzle_texture()
	if title_label != null and board.has_method("active_content_label"):
		title_label.tooltip_text = "Current puzzle · %s" % board.active_content_label()


func _on_start_new_pressed() -> void:
	_close_sessions_panel()
	_show_puzzle_selection(true)


func _on_resume_game_pressed(game_id: String) -> void:
	if save_coordinator == null:
		return
	_close_sessions_panel()
	completion_panel.visible = false
	if await save_coordinator.resume_game(game_id):
		_sync_artwork_ui()
		_refresh_difficulty_control()
		_refresh_aid_controls()
		_refresh_board_lines_overlay()
		_update_runtime_label()
		_refresh_sessions_list()


func _add_session_row(entry: Dictionary) -> void:
	var game_id := str(entry.get("game_id", ""))
	if game_id.is_empty():
		return
	var is_active := bool(entry.get("is_active", false))
	var piece_count := int(entry.get("piece_count", 0))
	var solved_count := int(entry.get("solved_count", 0))
	var difficulty_id := str(entry.get("difficulty_id", "puzzle"))
	var progress_percent := int(round(float(entry.get("progress", 0.0)) * 100.0))
	var source_id := str(entry.get("content_source_id", ""))
	var artwork_label := "Puzzle"
	if board != null and board.has_method("content_label_for_source_id"):
		artwork_label = str(board.content_label_for_source_id(source_id))

	var card := PanelContainer.new()
	card.add_theme_stylebox_override(
		"panel",
		_chrome_style(
			Color(1.0, 1.0, 1.0, 0.035),
			Color(1.0, 1.0, 1.0, 0.08),
			12,
			0
		)
	)
	sessions_list.add_child(card)

	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)
	card.add_child(row)

	var copy := Label.new()
	copy.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	copy.text = "%s%s · %s\n%d / %d pieces · %d%% · %s" % [
		"Current · " if is_active else "",
		artwork_label,
		difficulty_id.capitalize(),
		solved_count,
		piece_count,
		progress_percent,
		_format_last_played(int(entry.get("last_played_unix", 0))),
	]
	copy.add_theme_font_size_override("font_size", 14)
	copy.modulate = Color(1.0, 1.0, 1.0, 0.86 if is_active else 0.72)
	row.add_child(copy)

	var resume_button := Button.new()
	resume_button.text = "Resume" if not is_active else "Open"
	resume_button.custom_minimum_size = Vector2(76.0, 38.0)
	resume_button.disabled = is_active
	resume_button.pressed.connect(_on_resume_game_pressed.bind(game_id))
	row.add_child(resume_button)

	var delete_button := Button.new()
	SessionIcons.apply_button(
		delete_button,
		SessionIcons.IconId.DELETE,
		"Delete unfinished puzzle",
		Vector2(38.0, 38.0),
		18
	)
	delete_button.disabled = is_active
	delete_button.pressed.connect(_on_delete_game_pressed.bind(game_id))
	row.add_child(delete_button)
