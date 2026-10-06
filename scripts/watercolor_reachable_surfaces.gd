class_name WatercolorReachableSurfaces
extends RefCounted

# Presentation adapter only. Existing controls, signals and model methods survive.
const Paper = preload("res://scripts/watercolor_gameplay_style.gd")


static func style(main: Node) -> void:
	var saved_games = main.get_node_or_null("PaperSavedGamesLayer")
	if saved_games == null:
		saved_games = CanvasLayer.new()
		saved_games.name = "PaperSavedGamesLayer"
		saved_games.layer = 36
		main.add_child(saved_games)
		main.sessions_panel.reparent(saved_games, false)
	var sheets = main.get_node_or_null("PaperSheetsLayer")
	if sheets == null:
		sheets = CanvasLayer.new()
		sheets.name = "PaperSheetsLayer"
		sheets.layer = 50
		main.add_child(sheets)
	for overlay in [main.puzzle_selection_overlay, main.journal_overlay]:
		if overlay != null:
			if overlay.get_parent() != sheets:
				overlay.reparent(sheets, false)
			overlay.color = Color(0.953, 0.960, 0.940, 0.91)
	for panel in [main.puzzle_selection_panel, main.journal_panel]:
		if panel != null:
			Paper.apply_tree(panel)
	if main.puzzle_selection_panel != null:
		var outer = main.puzzle_selection_panel.get_child(0)
		if outer.get_node_or_null("PaperSelectionBody") == null:
			var body := ScrollContainer.new()
			body.name = "PaperSelectionBody"
			body.size_flags_vertical = Control.SIZE_EXPAND_FILL
			body.scroll_deadzone = 10
			body.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
			var content := VBoxContainer.new()
			content.name = "PaperSelectionContent"
			content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			content.add_theme_constant_override("separation", 18)
			var moving: Array[Node] = []
			for child in outer.get_children():
				if child == main.puzzle_selection_difficulty.get_parent():
					break
				if child.get_index() >= 2:
					moving.append(child)
			outer.add_child(body)
			outer.move_child(body, 2)
			body.add_child(content)
			for child in moving:
				child.reparent(content)
			var order := ["GalleryFilters", "GalleryScroll", "HomeForYou", "PuzzleMeBox"]
			for index in range(order.size()):
				var child = content.get_node_or_null(order[index])
				if child != null:
					content.move_child(child, index)
			Paper.apply_tree(body)
		var heading = outer.get_child(0)
		if heading is HBoxContainer:
			heading = heading.get_child(0)
		else:
			heading.text = "Choose your next puzzle"
		heading.add_theme_font_override("font", Paper.SERIF)
		heading.add_theme_font_size_override("font_size", 34)
		outer.get_child(1).autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		main.puzzle_me_privacy.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		main.gallery_for_you_mode.clip_text = true
		main.gallery_for_you_mode.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		for label in main.gallery_for_you_box.find_children("*", "Label", true, false):
			label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
			label.add_theme_font_size_override("font_size", 22)
		for button in main.gallery_for_you_buttons:
			button.custom_minimum_size.x = 0
			button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		for label in main.gallery_for_you_box.find_children("*", "Label", true, false):
			label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		main.gallery_reset_recommendations.add_theme_font_size_override("font_size", 20)
		main.gallery_scroll.custom_minimum_size.y = 480
		main.gallery_scroll.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
		main.gallery_search.get_menu().theme = Paper.theme()
		main.gallery_search.add_theme_icon_override("clear", Paper.icon(Paper.Mark.CLEAR))
		main.puzzle_selection_start.add_theme_stylebox_override("normal", Paper.button_box(true))
		main.puzzle_selection_start.custom_minimum_size.x = 220
		main.puzzle_me_button.text = "Choose a photo · Puzzle Me"
		Paper.mark_button(main.puzzle_me_button, Paper.Mark.PHOTO)
		main.puzzle_selection_error.add_theme_color_override("font_color", Color(0.55, 0.30, 0.26))
		main.puzzle_selection_error.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		style_cards(main)
		for option in [main.gallery_category_filter, main.gallery_status_filter, main.puzzle_selection_difficulty]:
			option.get_popup().theme = Paper.theme()
	if main.journal_panel != null:
		var heading = main.journal_panel.get_child(0).get_child(0).get_child(0)
		heading.add_theme_font_override("font", Paper.SERIF)
		heading.add_theme_font_size_override("font_size", 34)
		soft_cards(main.journal_panel)
		for label in [main.journal_today, main.journal_week]:
			label.autowrap_mode = TextServer.AUTOWRAP_OFF
			label.add_theme_font_size_override("font_size", 26)
	style_replay(main)


static func style_cards(main: Node) -> void:
	for key in main.gallery_cards:
		var card = main.gallery_cards[key]
		Paper.apply_tree(card)
		card.custom_minimum_size.x = 0 if main._gallery_portrait_grid else 248
		card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var picture = main.content_buttons[key]
		picture.modulate = Color.WHITE
		picture.custom_minimum_size.x = 0 if main._gallery_portrait_grid else 248
		picture.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		picture.custom_minimum_size.y = 220
		var frame = picture.get_node_or_null("PaperArtworkSelection")
		if frame == null:
			frame = Panel.new()
			frame.name = "PaperArtworkSelection"
			frame.mouse_filter = Control.MOUSE_FILTER_IGNORE
			picture.add_child(frame)
			frame.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		var selection := Paper.button_box()
		selection.set_corner_radius_all(3)
		selection.border_color = Paper.RIM
		selection.set_border_width_all(2 if str(key) == main.pending_content_id else 0)
		frame.add_theme_stylebox_override("panel", selection)
		var favorite = main.gallery_favorite_buttons[key]
		favorite.text = ""
		favorite.tooltip_text = "Favorite puzzle"
		Paper.mark_button(favorite, Paper.Mark.FAVORITE)
		favorite.add_theme_stylebox_override("normal", Paper.button_box(main.gallery_state.is_favorite(str(key))))
		main.gallery_status_labels[key].add_theme_font_size_override("font_size", 22)
		for child in card.get_children():
			if child is HBoxContainer:
				for caption in child.get_children():
					if caption is Label:
						picture.tooltip_text = caption.text
						caption.add_theme_font_size_override("font_size", 26)
						caption.add_theme_font_override("font", Paper.SERIF)
	var body = main.puzzle_selection_panel.get_child(0).get_node_or_null("PaperSelectionBody")
	if body != null:
		var content = body.get_child(0)
		var empty = content.get_node_or_null("PaperGalleryEmpty")
		if empty == null:
			empty = Label.new()
			empty.name = "PaperGalleryEmpty"
			empty.text = "No puzzles match.\nTry another search or filter."
			empty.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			empty.custom_minimum_size.y = 180
			content.add_child(empty)
			content.move_child(empty, main.gallery_scroll.get_index())
			empty.theme = Paper.theme()
		var has_cards := false
		for card in main.gallery_cards.values():
			has_cards = has_cards or card.visible
		empty.visible = not has_cards
		main.gallery_scroll.visible = has_cards


static func soft_cards(node: Node) -> void:
	for child in node.get_children():
		if child is PanelContainer:
			child.add_theme_stylebox_override("panel", Paper.surface(true, 14))
		soft_cards(child)


static func style_replay(main: Node) -> void:
	if main.timelapse_overlay == null:
		return
	var layer = main.get_node_or_null("PaperReplayLayer")
	if layer == null:
		layer = CanvasLayer.new()
		layer.name = "PaperReplayLayer"
		layer.layer = 60
		main.add_child(layer)
		main.timelapse_overlay.reparent(layer, false)
	Paper.apply_tree(main.timelapse_overlay, false)
	main.timelapse_overlay.color = Paper.PAPER
	main.timelapse_stage.color = Paper.WELL
	main.timelapse_tray_panel.color = Paper.WELL
	main.timelapse_title.text = "Puzzle replay"
	main.timelapse_title.add_theme_font_override("font", Paper.SERIF)
	Paper.mark_button(main.timelapse_close_button, Paper.Mark.CLOSE)
	Paper.mark_button(main.timelapse_again_button, Paper.Mark.RETURN)
	Paper.mark_button(main.completion_share_button, Paper.Mark.SEND)
	Paper.mark_button(main.timelapse_replay_button, Paper.Mark.RETURN)
	for button in [main.timelapse_close_button, main.timelapse_again_button, main.completion_share_button, main.timelapse_replay_button]:
		if button != null:
			button.add_theme_constant_override("icon_max_width", 22)


static func layout(main: Node, viewport: Vector2) -> void:
	var safe: Vector4 = main.AlbumMetrics.safe_area_insets(viewport)
	var available := viewport - Vector2(safe.x + safe.z + 48, safe.y + safe.w + 48)
	for panel in [main.puzzle_selection_panel, main.journal_panel]:
		if panel == null:
			continue
		panel.custom_minimum_size = Vector2.ZERO
		panel.size = Vector2(minf(900, available.x), minf(1100, available.y))
		panel.position = Vector2(safe.x + 24 + (available.x - panel.size.x) * 0.5, safe.y + 24 + (available.y - panel.size.y) * 0.5)
	if main.gallery_scroll != null:
		main.gallery_scroll.custom_minimum_size.y = 480
		main.gallery_grid.add_theme_constant_override("h_separation", 24)
		main.gallery_grid.add_theme_constant_override("v_separation", 24)
	for option in [main.album_overflow_difficulty, main.gallery_category_filter, main.gallery_status_filter, main.puzzle_selection_difficulty]:
		if option != null:
			option.get_popup().max_size = Vector2i(0, maxi(96, int(available.y)))
	if main.gallery_search != null:
		main.gallery_search.get_menu().max_size = Vector2i(0, maxi(96, int(available.y)))


static func layout_completion(main: Node, viewport: Vector2, orientation: Vector2) -> void:
	if main.completion_heading == null or main.completion_share_button == null:
		return
	var panel = main.completion_panel
	var layer = main.get_node_or_null("PaperCompletionLayer")
	if layer == null:
		layer = CanvasLayer.new()
		layer.name = "PaperCompletionLayer"
		layer.layer = 35
		main.add_child(layer)
		panel.reparent(layer, false)
	var outer = panel.get_child(0)
	var body = outer.get_node_or_null("PaperCompletionBody")
	if body == null:
		body = ScrollContainer.new()
		body.name = "PaperCompletionBody"
		body.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
		body.scroll_deadzone = 10
		body.size_flags_vertical = Control.SIZE_EXPAND_FILL
		var content := VBoxContainer.new()
		content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		content.add_theme_constant_override("separation", 12)
		var moving: Array[Node] = []
		for child in outer.get_children():
			if child is not HBoxContainer:
				moving.append(child)
		outer.add_child(body)
		outer.move_child(body, 0)
		body.add_child(content)
		for child in moving:
			child.reparent(content)
		main.completion_more_like_label.reparent(outer)
		outer.move_child(main.completion_more_like_label, main.completion_actions_row.get_index())
		Paper.apply_tree(body, false)
	panel.add_theme_stylebox_override("panel", Paper.surface(false, 8))
	main.completion_heading.add_theme_font_size_override("font_size", 34)
	main.completion_artwork_label.add_theme_font_override("font", Paper.SERIF)
	main.completion_artwork_label.add_theme_font_size_override("font_size", 26)
	for label in [main.completion_primary_stats, main.completion_secondary_stats, main.completion_status, main.completion_more_like_label]:
		label.modulate = Color.WHITE
		label.add_theme_font_size_override("font_size", 22)
		label.add_theme_color_override("font_color", Paper.SOFT)
		label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	for button in panel.find_children("*", "Button", true, false):
		button.custom_minimum_size = Vector2(0, 88)
		button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		button.clip_text = true
		button.add_theme_font_size_override("font_size", 24)
		button.add_theme_constant_override("icon_max_width", 22)
	var portrait := orientation.y > orientation.x
	var width: float = panel.custom_minimum_size.x if portrait else minf(900, viewport.x - 48)
	var height := minf(1100 if viewport.y > viewport.x else 690, viewport.y - (24 if portrait else 48))
	main.completion_artwork.custom_minimum_size.x = width - 32
	panel.custom_minimum_size = Vector2.ZERO
	panel.size = Vector2(width, height)
	panel.position = (viewport - panel.size) * 0.5


static func layout_replay(main: Node, viewport: Vector2) -> void:
	if main.timelapse_export_button == null or main.timelapse_export_state == "recording":
		return
	main.timelapse_title.add_theme_font_size_override("font_size", 34)
	main.timelapse_phase.add_theme_font_size_override("font_size", 22)
	main.timelapse_phase.z_index = 1
	main.timelapse_phase.position.y = 62
	main.timelapse_phase.size.y = 34
	main.timelapse_tray_label.add_theme_font_size_override("font_size", 20)
	main.timelapse_footer.add_theme_font_size_override("font_size", 22)
	main.timelapse_footer.position = Vector2(40, viewport.y - 150)
	main.timelapse_footer.size = Vector2(viewport.x - 80, 36)
	main.timelapse_close_button.custom_minimum_size = Vector2(160, 80)
	main.timelapse_close_button.position = Vector2(viewport.x - 200, 20)
	main.timelapse_close_button.size = Vector2(160, 80)
	main.timelapse_close_button.add_theme_font_size_override("font_size", 24)
	var buttons := [main.timelapse_share_video_button, main.timelapse_export_button, main.timelapse_again_button]
	var width := (viewport.x - 104) / 3
	for index in range(buttons.size()):
		var button = buttons[index]
		if button == null:
			continue
		button.add_theme_font_size_override("font_size", 24)
		button.custom_minimum_size = Vector2(0, 80)
		button.position = Vector2(40 + index * (width + 12), viewport.y - 104)
		button.size = Vector2(width, 80)
