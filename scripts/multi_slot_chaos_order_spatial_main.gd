extends "res://scripts/chaos_order_spatial_main.gd"

const SessionIcons = preload("res://scripts/ui_icon_catalog.gd")

var save_coordinator: MultiSlotSaveCoordinator = null
var games_button: Button = null
var sessions_panel: PanelContainer = null
var sessions_list: VBoxContainer = null
var sessions_empty_label: Label = null


func _ready() -> void:
	super._ready()
	call_deferred("_bind_multi_slot_save_coordinator")


func _build_ui() -> void:
	super._build_ui()
	_build_sessions_ui()


func _build_sessions_ui() -> void:
	if title_label == null:
		return
	var layer: Node = title_label.get_parent()
	if layer == null:
		return

	games_button = Button.new()
	games_button.name = "GamesButton"
	SessionIcons.apply_button(
		games_button,
		SessionIcons.IconId.LAYOUT,
		"Unfinished puzzles",
		Vector2(42.0, 42.0),
		20
	)
	games_button.pressed.connect(_toggle_sessions_panel)
	layer.add_child(games_button)

	sessions_panel = PanelContainer.new()
	sessions_panel.name = "SessionsPanel"
	sessions_panel.visible = false
	sessions_panel.custom_minimum_size = Vector2(430.0, 330.0)
	sessions_panel.size = Vector2(430.0, 330.0)
	sessions_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	sessions_panel.add_theme_stylebox_override(
		"panel",
		_chrome_style(
			Color(0.028, 0.032, 0.043, 0.97),
			Color(1.0, 1.0, 1.0, 0.14),
			18,
			12
		)
	)
	layer.add_child(sessions_panel)

	var outer := VBoxContainer.new()
	outer.add_theme_constant_override("separation", 10)
	outer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT, Control.PRESET_MODE_MINSIZE, 14)
	sessions_panel.add_child(outer)

	var header := HBoxContainer.new()
	outer.add_child(header)

	var title := Label.new()
	title.text = "Unfinished puzzles"
	title.add_theme_font_size_override("font_size", 22)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(title)

	var close_button := Button.new()
	SessionIcons.apply_button(
		close_button,
		SessionIcons.IconId.CLOSE,
		"Close",
		Vector2(38.0, 38.0),
		18
	)
	close_button.pressed.connect(_close_sessions_panel)
	header.add_child(close_button)

	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	outer.add_child(scroll)

	sessions_list = VBoxContainer.new()
	sessions_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	sessions_list.add_theme_constant_override("separation", 8)
	scroll.add_child(sessions_list)

	sessions_empty_label = Label.new()
	sessions_empty_label.text = "No unfinished puzzles yet."
	sessions_empty_label.modulate = Color(1.0, 1.0, 1.0, 0.58)
	sessions_empty_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	sessions_empty_label.custom_minimum_size = Vector2(0.0, 80.0)
	sessions_list.add_child(sessions_empty_label)

	var footer := HBoxContainer.new()
	footer.alignment = BoxContainer.ALIGNMENT_END
	outer.add_child(footer)

	var start_new_button := Button.new()
	start_new_button.text = "Start new"
	start_new_button.custom_minimum_size = Vector2(118.0, 40.0)
	start_new_button.pressed.connect(_on_start_new_pressed)
	footer.add_child(start_new_button)


func _layout_ui(viewport_size: Vector2) -> void:
	super._layout_ui(viewport_size)
	if games_button != null and top_bar != null:
		games_button.position = top_bar.position + Vector2(116.0, 7.0)
	if sessions_panel != null:
		var panel_size := Vector2(
			minf(430.0, maxf(320.0, viewport_size.x - 28.0)),
			minf(420.0, maxf(290.0, viewport_size.y - 90.0))
		)
		sessions_panel.size = panel_size
		sessions_panel.position = Vector2(
			maxf(14.0, (viewport_size.x - panel_size.x) * 0.5),
			maxf(58.0, (viewport_size.y - panel_size.y) * 0.5),
		)


func _bind_multi_slot_save_coordinator() -> void:
	save_coordinator = get_node_or_null("SaveCoordinator") as MultiSlotSaveCoordinator
	_refresh_sessions_list()


func _toggle_sessions_panel() -> void:
	if sessions_panel == null:
		return
	sessions_panel.visible = not sessions_panel.visible
	if sessions_panel.visible:
		_refresh_sessions_list()


func _close_sessions_panel() -> void:
	if sessions_panel != null:
		sessions_panel.visible = false


func _refresh_sessions_list() -> void:
	if sessions_list == null:
		return
	for child in sessions_list.get_children():
		sessions_list.remove_child(child)
		child.queue_free()

	if save_coordinator == null:
		var loading := Label.new()
		loading.text = "Loading saves…"
		loading.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		loading.modulate = Color(1.0, 1.0, 1.0, 0.58)
		loading.custom_minimum_size = Vector2(0.0, 80.0)
		sessions_list.add_child(loading)
		return

	var games := save_coordinator.list_unfinished_games()
	if games.is_empty():
		var empty := Label.new()
		empty.text = "No unfinished puzzles yet."
		empty.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		empty.modulate = Color(1.0, 1.0, 1.0, 0.58)
		empty.custom_minimum_size = Vector2(0.0, 80.0)
		sessions_list.add_child(empty)
		return

	for entry_value in games:
		if not (entry_value is Dictionary):
			continue
		_add_session_row(entry_value)


func _add_session_row(entry: Dictionary) -> void:
	var game_id := str(entry.get("game_id", ""))
	if game_id.is_empty():
		return
	var is_active := bool(entry.get("is_active", false))
	var piece_count := int(entry.get("piece_count", 0))
	var solved_count := int(entry.get("solved_count", 0))
	var difficulty_id := str(entry.get("difficulty_id", "puzzle"))
	var progress_percent := int(round(float(entry.get("progress", 0.0)) * 100.0))

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
	copy.text = "%s%s\n%d / %d pieces · %d%% · %s" % [
		"Current · " if is_active else "",
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


func _format_last_played(unix_time: int) -> String:
	if unix_time <= 0:
		return "not saved yet"
	var timezone := Time.get_time_zone_from_system()
	var offset_seconds := int(timezone.get("bias", 0)) * 60
	var value := Time.get_datetime_dict_from_unix_time(unix_time + offset_seconds)
	return "%02d/%02d %02d:%02d" % [
		int(value.get("month", 0)),
		int(value.get("day", 0)),
		int(value.get("hour", 0)),
		int(value.get("minute", 0)),
	]


func _on_resume_game_pressed(game_id: String) -> void:
	if save_coordinator == null:
		return
	_close_sessions_panel()
	completion_panel.visible = false
	if await save_coordinator.resume_game(game_id):
		_refresh_difficulty_control()
		_refresh_aid_controls()
		_refresh_board_lines_overlay()
		_update_runtime_label()
		_refresh_sessions_list()


func _on_delete_game_pressed(game_id: String) -> void:
	if save_coordinator == null:
		return
	if save_coordinator.delete_game(game_id):
		_refresh_sessions_list()


func _on_start_new_pressed() -> void:
	_close_sessions_panel()
	_start_new_game_slot()


func _start_new_game_slot() -> void:
	if save_coordinator != null and save_coordinator.has_active_game():
		save_coordinator.save_now(true)
	# Start New is the only same-difficulty action that creates another unfinished
	# slot. The existing Reshuffle control remains an in-place reset of the current
	# game and must not grow the save list.
	super._restart()
	if save_coordinator != null:
		save_coordinator.create_slot_for_current_runtime()
		_refresh_sessions_list()


func _on_difficulty_selected(index: int) -> void:
	var requested_id := str(difficulty_select.get_item_metadata(index))
	var previous_id := str(board.active_difficulty_id())
	if requested_id == previous_id:
		return
	if save_coordinator != null and save_coordinator.has_active_game():
		save_coordinator.save_now(true)

	super._on_difficulty_selected(index)
	if (
		save_coordinator != null
		and str(board.active_difficulty_id()) == requested_id
		and requested_id != previous_id
	):
		save_coordinator.create_slot_for_current_runtime()
		_refresh_sessions_list()


func _restart() -> void:
	# The product already labels this action Reshuffle. Keep that contract: reset
	# the current puzzle in place instead of manufacturing a new unfinished slot.
	super._restart()
	if save_coordinator != null:
		if save_coordinator.has_active_game():
			save_coordinator.save_now(true)
		else:
			save_coordinator.create_slot_for_current_runtime()
		_refresh_sessions_list()


func _on_completed() -> void:
	if save_coordinator != null:
		save_coordinator.mark_active_completed()
		_refresh_sessions_list()
	super._on_completed()
