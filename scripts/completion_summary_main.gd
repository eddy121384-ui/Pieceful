class_name CompletionSummaryMain
extends "res://scripts/completion_event_main.gd"

const MOBILE_PORTRAIT_CARD_WIDTH := 304.0
const MOBILE_PORTRAIT_CARD_HEIGHT := 500.0

var completion_artwork: TextureRect = null
var completion_heading: Label = null
var completion_artwork_label: Label = null
var completion_primary_stats: Label = null
var completion_secondary_stats: Label = null
var completion_status: Label = null
var completion_next_button: Button = null
var _web_completion_resize_callback = null


func _ready() -> void:
	super._ready()
	_upgrade_completion_panel()
	_install_web_completion_resize_listener()
	call_deferred("_refresh_completion_layout_from_browser")


func _on_completed() -> void:
	super._on_completed()
	if save_coordinator == null or not save_coordinator.has_method("latest_completion_record"):
		return
	var record: Dictionary = save_coordinator.latest_completion_record()
	if record.is_empty():
		return
	_present_completion(record)
	_refresh_completion_layout_from_browser()


func _layout_ui(viewport_size: Vector2) -> void:
	super._layout_ui(viewport_size)
	_apply_completion_layout_for_orientation(
		viewport_size,
		_completion_orientation_size(viewport_size)
	)


func _apply_completion_layout_for_orientation(
	logical_viewport_size: Vector2,
	orientation_size: Vector2
) -> void:
	if completion_panel == null:
		return

	var browser_portrait := orientation_size.y > orientation_size.x
	var panel_width: float
	var panel_height: float
	if browser_portrait:
		# Web exports intentionally retain a 1280x720 logical Godot viewport even on
		# portrait Safari. The visible browser slice is much narrower than 560 Godot
		# units, so use a compact fixed logical width when the browser itself says
		# portrait. This mirrors the Gallery's browser-orientation contract.
		panel_width = MOBILE_PORTRAIT_CARD_WIDTH
		panel_height = minf(
			MOBILE_PORTRAIT_CARD_HEIGHT,
			maxf(450.0, logical_viewport_size.y - 42.0)
		)
	else:
		panel_width = minf(560.0, maxf(330.0, logical_viewport_size.x - 28.0))
		panel_height = minf(560.0, maxf(500.0, logical_viewport_size.y - 30.0))

	# Shrink child minimums before sizing the PanelContainer. If the panel is
	# resized first, Godot clamps it against the previous 500px artwork minimum
	# and portrait Safari still ends up with a ~508px-wide completion card.
	if completion_artwork != null:
		var artwork_width := (
			panel_width - 44.0
			if browser_portrait
			else maxf(270.0, panel_width - 52.0)
		)
		var artwork_height := (
			minf(205.0, maxf(160.0, panel_height * 0.38))
			if browser_portrait
			else minf(270.0, maxf(180.0, panel_height * 0.43))
		)
		completion_artwork.custom_minimum_size = Vector2(artwork_width, artwork_height)

	if completion_heading != null:
		completion_heading.add_theme_font_size_override("font_size", 24 if browser_portrait else 28)
	if completion_artwork_label != null:
		completion_artwork_label.add_theme_font_size_override("font_size", 15 if browser_portrait else 17)
	if completion_primary_stats != null:
		completion_primary_stats.add_theme_font_size_override("font_size", 14 if browser_portrait else 16)

	completion_panel.custom_minimum_size = Vector2(panel_width, panel_height)
	completion_panel.reset_size()
	completion_panel.size = Vector2(panel_width, panel_height)
	completion_panel.position = Vector2(
		(logical_viewport_size.x - panel_width) * 0.5,
		(logical_viewport_size.y - panel_height) * 0.5
	)


func _completion_orientation_size(fallback: Vector2) -> Vector2:
	if not OS.has_feature("web"):
		return fallback
	var window = JavaScriptBridge.get_interface("window")
	if window == null:
		return fallback
	var width := float(window.innerWidth)
	var height := float(window.innerHeight)
	if width <= 0.0 or height <= 0.0:
		return fallback
	return Vector2(width, height)


func _install_web_completion_resize_listener() -> void:
	if not OS.has_feature("web") or _web_completion_resize_callback != null:
		return
	var window = JavaScriptBridge.get_interface("window")
	if window == null:
		return
	_web_completion_resize_callback = JavaScriptBridge.create_callback(_on_web_completion_viewport_changed)
	window.addEventListener("resize", _web_completion_resize_callback)
	window.addEventListener("orientationchange", _web_completion_resize_callback)


func _on_web_completion_viewport_changed(_args: Array) -> void:
	call_deferred("_refresh_completion_layout_from_browser")


func _refresh_completion_layout_from_browser() -> void:
	if not is_inside_tree() or completion_panel == null:
		return
	var logical_size := get_viewport().get_visible_rect().size
	_apply_completion_layout_for_orientation(
		logical_size,
		_completion_orientation_size(logical_size)
	)


func completion_presentation_snapshot() -> Dictionary:
	return {
		"visible": completion_panel != null and completion_panel.visible,
		"heading": completion_heading.text if completion_heading != null else "",
		"artwork_label": completion_artwork_label.text if completion_artwork_label != null else "",
		"primary_stats": completion_primary_stats.text if completion_primary_stats != null else "",
		"secondary_stats": completion_secondary_stats.text if completion_secondary_stats != null else "",
		"status": completion_status.text if completion_status != null else "",
		"has_artwork": completion_artwork != null and completion_artwork.texture != null,
		"panel_size": completion_panel.size if completion_panel != null else Vector2.ZERO,
		"artwork_minimum_size": (
			completion_artwork.custom_minimum_size
			if completion_artwork != null
			else Vector2.ZERO
		),
	}


func _upgrade_completion_panel() -> void:
	if completion_panel == null:
		return
	for child in completion_panel.get_children():
		completion_panel.remove_child(child)
		child.queue_free()

	completion_panel.name = "CompletionPanel"
	completion_panel.custom_minimum_size = Vector2(560.0, 540.0)

	var outer := VBoxContainer.new()
	outer.name = "CompletionSummary"
	outer.alignment = BoxContainer.ALIGNMENT_CENTER
	outer.add_theme_constant_override("separation", 9)
	outer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT, Control.PRESET_MODE_MINSIZE, 18)
	completion_panel.add_child(outer)

	completion_heading = Label.new()
	completion_heading.name = "CompletionHeading"
	completion_heading.text = "Puzzle complete"
	completion_heading.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	completion_heading.add_theme_font_size_override("font_size", 28)
	outer.add_child(completion_heading)

	completion_status = Label.new()
	completion_status.name = "CompletionStatus"
	completion_status.text = "A quiet moment, finished."
	completion_status.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	completion_status.modulate = Color(1.0, 1.0, 1.0, 0.58)
	completion_status.add_theme_font_size_override("font_size", 13)
	outer.add_child(completion_status)

	completion_artwork = TextureRect.new()
	completion_artwork.name = "CompletionArtwork"
	completion_artwork.custom_minimum_size = Vector2(500.0, 240.0)
	completion_artwork.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	completion_artwork.size_flags_vertical = Control.SIZE_EXPAND_FILL
	completion_artwork.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	completion_artwork.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	completion_artwork.mouse_filter = Control.MOUSE_FILTER_IGNORE
	outer.add_child(completion_artwork)

	completion_artwork_label = Label.new()
	completion_artwork_label.name = "CompletionArtworkLabel"
	completion_artwork_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	completion_artwork_label.add_theme_font_size_override("font_size", 17)
	completion_artwork_label.clip_text = true
	outer.add_child(completion_artwork_label)

	completion_primary_stats = Label.new()
	completion_primary_stats.name = "CompletionPrimaryStats"
	completion_primary_stats.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	completion_primary_stats.add_theme_font_size_override("font_size", 16)
	outer.add_child(completion_primary_stats)
	# Preserve the inherited field so older progress/layout code keeps a valid label
	# reference while the upgraded card is hidden during normal play.
	completion_copy = completion_primary_stats

	completion_secondary_stats = Label.new()
	completion_secondary_stats.name = "CompletionSecondaryStats"
	completion_secondary_stats.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	completion_secondary_stats.modulate = Color(1.0, 1.0, 1.0, 0.62)
	completion_secondary_stats.add_theme_font_size_override("font_size", 13)
	outer.add_child(completion_secondary_stats)

	completion_next_button = Button.new()
	completion_next_button.name = "CompletionNextPuzzle"
	completion_next_button.text = "Choose next puzzle"
	completion_next_button.custom_minimum_size = Vector2(190.0, 42.0)
	completion_next_button.pressed.connect(_on_completion_next_pressed)
	outer.add_child(completion_next_button)

	_layout_ui(get_viewport().get_visible_rect().size)


func _present_completion(record: Dictionary) -> void:
	if completion_artwork == null:
		_upgrade_completion_panel()
	if completion_artwork != null and board != null and board.has_method("active_puzzle_texture"):
		completion_artwork.texture = board.active_puzzle_texture()

	var content_id := str(record.get("content_id", ""))
	var artwork_label := content_id.capitalize()
	if board != null and board.has_method("content_label_for_id"):
		artwork_label = str(board.content_label_for_id(content_id))
	elif board != null and board.has_method("active_content_label"):
		artwork_label = str(board.active_content_label())
	if completion_artwork_label != null:
		completion_artwork_label.text = artwork_label

	var pieces := int(record.get("pieces_placed", record.get("piece_count", 0)))
	var elapsed := int(record.get("elapsed_seconds", 0))
	var difficulty := str(record.get("difficulty_id", "puzzle")).capitalize()
	if completion_primary_stats != null:
		completion_primary_stats.text = "%d pieces · %s · %s" % [
			pieces,
			_format_duration(elapsed),
			difficulty,
		]

	var hints := int(record.get("hints_used", 0))
	var hint_copy := "Hint-free" if hints == 0 else "%d hint%s used" % [hints, "" if hints == 1 else "s"]
	if completion_secondary_stats != null:
		completion_secondary_stats.text = "%s · %s" % [
			_local_completion_date(int(record.get("completed_at_unix", 0))),
			hint_copy,
		]
	if completion_status != null:
		completion_status.text = "A quiet moment, finished."


func _on_completion_next_pressed() -> void:
	if completion_panel != null:
		completion_panel.visible = false
	_show_puzzle_selection(false)


func _format_duration(total_seconds: int) -> String:
	var seconds := maxi(0, total_seconds)
	var hours := seconds / 3600
	var minutes := (seconds % 3600) / 60
	var remainder := seconds % 60
	if hours > 0:
		return "%dh %02dm" % [hours, minutes]
	if minutes > 0:
		return "%dm %02ds" % [minutes, remainder]
	return "%ds" % remainder


func _local_completion_date(unix_time: int) -> String:
	if unix_time <= 0:
		return "Completed"
	var timezone := Time.get_time_zone_from_system()
	var offset_seconds := int(timezone.get("bias", 0)) * 60
	var date := Time.get_datetime_dict_from_unix_time(unix_time + offset_seconds)
	return "%04d.%02d.%02d" % [
		int(date.get("year", 0)),
		int(date.get("month", 0)),
		int(date.get("day", 0)),
	]
