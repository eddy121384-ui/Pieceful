class_name PuzzleJournalMain
extends "res://scripts/completion_summary_main.gd"

const JournalIcons = preload("res://scripts/ui_icon_catalog.gd")

var journal_button: Button = null
var journal_overlay: ColorRect = null
var journal_panel: PanelContainer = null
var journal_today: Label = null
var journal_week: Label = null
var journal_recent_list: VBoxContainer = null
var journal_empty: Label = null


func _build_ui() -> void:
	super._build_ui()
	_build_journal_ui()


func _layout_ui(viewport_size: Vector2) -> void:
	super._layout_ui(viewport_size)
	if journal_button != null and top_bar != null:
		journal_button.position = top_bar.position + Vector2(164.0, 7.0)
	if journal_overlay == null or journal_panel == null:
		return
	journal_overlay.position = Vector2.ZERO
	journal_overlay.size = viewport_size
	var panel_size := Vector2(
		minf(620.0, maxf(330.0, viewport_size.x - 24.0)),
		minf(610.0, maxf(470.0, viewport_size.y - 28.0))
	)
	journal_panel.size = panel_size
	journal_panel.position = Vector2(
		(viewport_size.x - panel_size.x) * 0.5,
		(viewport_size.y - panel_size.y) * 0.5
	)


func completion_metrics_should_run() -> bool:
	if journal_overlay != null and journal_overlay.visible:
		return false
	return super.completion_metrics_should_run()


func journal_presentation_snapshot() -> Dictionary:
	return {
		"visible": journal_overlay != null and journal_overlay.visible,
		"today": journal_today.text if journal_today != null else "",
		"week": journal_week.text if journal_week != null else "",
		"recent_count": _journal_recent_card_count(),
		"empty_visible": journal_empty != null and journal_empty.visible,
	}


func _build_journal_ui() -> void:
	if title_label == null:
		return
	var layer = title_label.get_parent()
	if layer == null:
		return

	journal_button = Button.new()
	journal_button.name = "JournalButton"
	JournalIcons.apply_button(
		journal_button,
		JournalIcons.IconId.REPLAY,
		"Puzzle Journal",
		Vector2(42.0, 42.0),
		20
	)
	journal_button.pressed.connect(_toggle_journal)
	layer.add_child(journal_button)

	journal_overlay = ColorRect.new()
	journal_overlay.name = "JournalOverlay"
	journal_overlay.visible = false
	journal_overlay.color = Color(0.01, 0.012, 0.018, 0.82)
	journal_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	layer.add_child(journal_overlay)

	journal_panel = PanelContainer.new()
	journal_panel.name = "JournalPanel"
	journal_panel.custom_minimum_size = Vector2(560.0, 540.0)
	journal_panel.add_theme_stylebox_override(
		"panel",
		_chrome_style(
			Color(0.028, 0.032, 0.043, 0.98),
			Color(1.0, 1.0, 1.0, 0.14),
			20,
			12
		)
	)
	journal_overlay.add_child(journal_panel)

	var outer := VBoxContainer.new()
	outer.name = "JournalContent"
	outer.add_theme_constant_override("separation", 12)
	outer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT, Control.PRESET_MODE_MINSIZE, 16)
	journal_panel.add_child(outer)

	var header := HBoxContainer.new()
	header.add_theme_constant_override("separation", 8)
	outer.add_child(header)

	var title := Label.new()
	title.text = "Puzzle Journal"
	title.add_theme_font_size_override("font_size", 26)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(title)

	var close_button := Button.new()
	close_button.name = "JournalClose"
	JournalIcons.apply_button(
		close_button,
		JournalIcons.IconId.CLOSE,
		"Close Journal",
		Vector2(38.0, 38.0),
		18
	)
	close_button.pressed.connect(_close_journal)
	header.add_child(close_button)

	var subheading := Label.new()
	subheading.text = "A record of time you chose to spend here."
	subheading.modulate = Color(1.0, 1.0, 1.0, 0.58)
	subheading.add_theme_font_size_override("font_size", 13)
	outer.add_child(subheading)

	var summary_row := HBoxContainer.new()
	summary_row.name = "JournalSummaryRow"
	summary_row.add_theme_constant_override("separation", 10)
	outer.add_child(summary_row)

	journal_today = _journal_summary_card(summary_row, "Today")
	journal_today.name = "JournalToday"
	journal_week = _journal_summary_card(summary_row, "This week")
	journal_week.name = "JournalThisWeek"

	var recent_heading := Label.new()
	recent_heading.text = "Recently completed"
	recent_heading.add_theme_font_size_override("font_size", 16)
	recent_heading.modulate = Color(1.0, 1.0, 1.0, 0.82)
	outer.add_child(recent_heading)

	var scroll := ScrollContainer.new()
	scroll.name = "JournalRecentScroll"
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	outer.add_child(scroll)

	journal_recent_list = VBoxContainer.new()
	journal_recent_list.name = "JournalRecentList"
	journal_recent_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	journal_recent_list.add_theme_constant_override("separation", 8)
	scroll.add_child(journal_recent_list)

	journal_empty = Label.new()
	journal_empty.name = "JournalEmpty"
	journal_empty.text = "Completed puzzles will gather here."
	journal_empty.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	journal_empty.modulate = Color(1.0, 1.0, 1.0, 0.52)
	journal_empty.custom_minimum_size = Vector2(0.0, 88.0)
	journal_recent_list.add_child(journal_empty)


func _journal_summary_card(host: HBoxContainer, caption: String) -> Label:
	var card := PanelContainer.new()
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	card.custom_minimum_size = Vector2(0.0, 92.0)
	card.add_theme_stylebox_override(
		"panel",
		_chrome_style(
			Color(1.0, 1.0, 1.0, 0.035),
			Color(1.0, 1.0, 1.0, 0.07),
			14,
			0
		)
	)
	host.add_child(card)

	var box := VBoxContainer.new()
	box.alignment = BoxContainer.ALIGNMENT_CENTER
	box.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT, Control.PRESET_MODE_MINSIZE, 10)
	card.add_child(box)

	var heading := Label.new()
	heading.text = caption
	heading.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	heading.modulate = Color(1.0, 1.0, 1.0, 0.58)
	heading.add_theme_font_size_override("font_size", 12)
	box.add_child(heading)

	var value := Label.new()
	value.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	value.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	value.add_theme_font_size_override("font_size", 14)
	box.add_child(value)
	return value


func _toggle_journal() -> void:
	if journal_overlay == null:
		return
	if journal_overlay.visible:
		_close_journal()
		return
	_close_sessions_panel()
	_refresh_journal_ui()
	journal_overlay.visible = true
	journal_overlay.move_to_front()


func _close_journal() -> void:
	if journal_overlay != null:
		journal_overlay.visible = false


func _refresh_journal_ui() -> void:
	if save_coordinator == null or not save_coordinator.has_method("journal_recent"):
		if journal_today != null:
			journal_today.text = "Loading…"
		if journal_week != null:
			journal_week.text = "Loading…"
		return

	var today: Dictionary = save_coordinator.journal_today_summary()
	var week: Dictionary = save_coordinator.journal_week_summary()
	if journal_today != null:
		journal_today.text = _journal_summary_text(today)
	if journal_week != null:
		journal_week.text = _journal_summary_text(week)

	if journal_recent_list == null:
		return
	for child in journal_recent_list.get_children():
		journal_recent_list.remove_child(child)
		child.queue_free()

	var recent: Array = save_coordinator.journal_recent(30)
	if recent.is_empty():
		journal_empty = Label.new()
		journal_empty.name = "JournalEmpty"
		journal_empty.text = "Completed puzzles will gather here."
		journal_empty.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		journal_empty.modulate = Color(1.0, 1.0, 1.0, 0.52)
		journal_empty.custom_minimum_size = Vector2(0.0, 88.0)
		journal_recent_list.add_child(journal_empty)
		return

	journal_empty = null
	for record_value in recent:
		if record_value is Dictionary:
			_add_journal_record(record_value as Dictionary)


func _journal_summary_text(summary: Dictionary) -> String:
	var count := int(summary.get("completion_count", 0))
	var elapsed := int(summary.get("elapsed_seconds", 0))
	return "%d completed\n%s" % [count, _format_duration(elapsed)]


func _add_journal_record(record: Dictionary) -> void:
	var card := PanelContainer.new()
	card.name = "JournalRecord_%s" % str(record.get("game_id", "unknown"))
	card.add_theme_stylebox_override(
		"panel",
		_chrome_style(
			Color(1.0, 1.0, 1.0, 0.028),
			Color(1.0, 1.0, 1.0, 0.06),
			12,
			0
		)
	)
	journal_recent_list.add_child(card)

	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	card.add_child(row)

	var content_id := str(record.get("content_id", ""))
	var texture := TextureRect.new()
	texture.custom_minimum_size = Vector2(94.0, 68.0)
	texture.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	texture.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	texture.mouse_filter = Control.MOUSE_FILTER_IGNORE
	if board != null and board.has_method("content_texture_for_id"):
		texture.texture = board.content_texture_for_id(content_id)
	row.add_child(texture)

	var label := content_id.capitalize()
	if board != null and board.has_method("content_label_for_id"):
		label = str(board.content_label_for_id(content_id))
	var hint_copy := "Hint-free" if bool(record.get("hint_free", false)) else "%d hints" % int(record.get("hints_used", 0))
	var copy := Label.new()
	copy.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	copy.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	copy.text = "%s\n%s · %d pieces · %s\n%s · %s" % [
		label,
		str(record.get("difficulty_id", "puzzle")).capitalize(),
		int(record.get("pieces_placed", record.get("piece_count", 0))),
		_format_duration(int(record.get("elapsed_seconds", 0))),
		_local_completion_date(int(record.get("completed_at_unix", 0))),
		hint_copy,
	]
	copy.add_theme_font_size_override("font_size", 13)
	copy.modulate = Color(1.0, 1.0, 1.0, 0.78)
	row.add_child(copy)


func _journal_recent_card_count() -> int:
	if journal_recent_list == null:
		return 0
	var count := 0
	for child in journal_recent_list.get_children():
		if child is PanelContainer and child.name.begins_with("JournalRecord_"):
			count += 1
	return count
