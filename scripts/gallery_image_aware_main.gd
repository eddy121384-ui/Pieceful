class_name GalleryImageAwareMain
extends "res://scripts/image_aware_puzzle_selection_main.gd"

const GalleryStateStoreScript = preload("res://scripts/gallery_state_store.gd")

var gallery_state = GalleryStateStoreScript.new()
var gallery_search: LineEdit = null
var gallery_category_filter: OptionButton = null
var gallery_status_filter: OptionButton = null
var gallery_scroll: ScrollContainer = null
var gallery_cards: Dictionary = {}
var gallery_status_labels: Dictionary = {}
var gallery_favorite_buttons: Dictionary = {}
var gallery_continue_buttons: Dictionary = {}


func _build_puzzle_selection_ui() -> void:
	super._build_puzzle_selection_ui()
	if puzzle_selection_panel == null or puzzle_selection_cards == null:
		return
	var outer = puzzle_selection_panel.get_child(0)
	if not (outer is VBoxContainer):
		return

	if outer.get_child_count() >= 2:
		var heading = outer.get_child(0)
		var subheading = outer.get_child(1)
		if heading is Label:
			heading.text = "Gallery"
		if subheading is Label:
			subheading.text = "Find a puzzle you want to live with for a while."

	var card_index := puzzle_selection_cards.get_index()
	outer.remove_child(puzzle_selection_cards)
	gallery_scroll = ScrollContainer.new()
	gallery_scroll.name = "GalleryScroll"
	gallery_scroll.custom_minimum_size = Vector2(0.0, 230.0)
	gallery_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	gallery_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	gallery_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	outer.add_child(gallery_scroll)
	outer.move_child(gallery_scroll, card_index)
	gallery_scroll.add_child(puzzle_selection_cards)

	var filters := VBoxContainer.new()
	filters.name = "GalleryFilters"
	filters.add_theme_constant_override("separation", 7)
	outer.add_child(filters)
	outer.move_child(filters, card_index)

	gallery_search = LineEdit.new()
	gallery_search.name = "GallerySearch"
	gallery_search.placeholder_text = "Search title, subject, tag, mood…"
	gallery_search.clear_button_enabled = true
	gallery_search.text_changed.connect(_on_gallery_search_changed)
	filters.add_child(gallery_search)

	var filter_row := HBoxContainer.new()
	filter_row.add_theme_constant_override("separation", 8)
	filters.add_child(filter_row)

	gallery_category_filter = OptionButton.new()
	gallery_category_filter.name = "GalleryCategoryFilter"
	gallery_category_filter.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	gallery_category_filter.add_item("All themes")
	gallery_category_filter.set_item_metadata(0, "all")
	if board != null and board.has_method("gallery_categories"):
		for category_value in board.gallery_categories():
			var category := str(category_value)
			gallery_category_filter.add_item(category.capitalize())
			gallery_category_filter.set_item_metadata(
				gallery_category_filter.get_item_count() - 1,
				category
			)
	gallery_category_filter.item_selected.connect(_on_gallery_filter_changed)
	filter_row.add_child(gallery_category_filter)

	gallery_status_filter = OptionButton.new()
	gallery_status_filter.name = "GalleryStatusFilter"
	gallery_status_filter.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	for row in [
		["All states", "all"],
		["Favorites", "favorites"],
		["Continue", "continue"],
		["Completed", "completed"],
		["New", "new"],
	]:
		gallery_status_filter.add_item(str(row[0]))
		gallery_status_filter.set_item_metadata(
			gallery_status_filter.get_item_count() - 1,
			str(row[1])
		)
	gallery_status_filter.item_selected.connect(_on_gallery_filter_changed)
	filter_row.add_child(gallery_status_filter)

	_refresh_gallery_cards()


func _add_content_card(preset: Dictionary) -> void:
	var content_id := str(preset.get("id", ""))
	var path := str(preset.get("path", ""))
	if content_id.is_empty() or path.is_empty():
		return

	var card := VBoxContainer.new()
	card.name = "GalleryCard_%s" % content_id
	card.custom_minimum_size = Vector2(188.0, 218.0)
	card.add_theme_constant_override("separation", 5)
	puzzle_selection_cards.add_child(card)
	gallery_cards[content_id] = card

	var picture := TextureButton.new()
	picture.name = "Artwork_%s" % content_id
	picture.custom_minimum_size = Vector2(188.0, 128.0)
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

	var caption_row := HBoxContainer.new()
	caption_row.add_theme_constant_override("separation", 4)
	card.add_child(caption_row)

	var caption := Label.new()
	caption.text = str(preset.get("label", content_id.capitalize()))
	caption.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	caption.add_theme_font_size_override("font_size", 15)
	caption.clip_text = true
	caption_row.add_child(caption)

	var favorite := Button.new()
	favorite.name = "Favorite_%s" % content_id
	favorite.custom_minimum_size = Vector2(34.0, 30.0)
	favorite.tooltip_text = "Favorite"
	favorite.pressed.connect(_on_favorite_pressed.bind(content_id))
	caption_row.add_child(favorite)
	gallery_favorite_buttons[content_id] = favorite

	var status := Label.new()
	status.name = "Status_%s" % content_id
	status.add_theme_font_size_override("font_size", 12)
	status.modulate = Color(1.0, 1.0, 1.0, 0.62)
	status.clip_text = true
	card.add_child(status)
	gallery_status_labels[content_id] = status

	var continue_button := Button.new()
	continue_button.name = "Continue_%s" % content_id
	continue_button.text = "Continue"
	continue_button.custom_minimum_size = Vector2(0.0, 32.0)
	continue_button.visible = false
	continue_button.pressed.connect(_on_continue_pressed.bind(content_id))
	card.add_child(continue_button)
	gallery_continue_buttons[content_id] = continue_button


func _layout_ui(viewport_size: Vector2) -> void:
	super._layout_ui(viewport_size)
	if puzzle_selection_panel == null:
		return
	var panel_size := Vector2(
		minf(680.0, maxf(330.0, viewport_size.x - 24.0)),
		minf(650.0, maxf(470.0, viewport_size.y - 28.0))
	)
	puzzle_selection_panel.size = panel_size
	puzzle_selection_panel.position = Vector2(
		(viewport_size.x - panel_size.x) * 0.5,
		(viewport_size.y - panel_size.y) * 0.5
	)


func _show_puzzle_selection(can_cancel: bool) -> void:
	super._show_puzzle_selection(can_cancel)
	_refresh_gallery_cards()


func _on_gallery_search_changed(_value: String) -> void:
	_refresh_gallery_cards()


func _on_gallery_filter_changed(_index: int) -> void:
	_refresh_gallery_cards()


func _on_favorite_pressed(content_id: String) -> void:
	gallery_state.toggle_favorite(content_id)
	_refresh_gallery_cards()


func _on_continue_pressed(content_id: String) -> void:
	var entry := _unfinished_entry_for_content(content_id)
	var game_id := str(entry.get("game_id", ""))
	if game_id.is_empty():
		return
	if puzzle_selection_overlay != null:
		puzzle_selection_overlay.visible = false
	await _on_resume_game_pressed(game_id)


func _on_completed() -> void:
	var content_id := str(board.active_content_id()) if board != null else ""
	var difficulty_id := str(board.active_difficulty_id()) if board != null else ""
	if not content_id.is_empty():
		gallery_state.mark_completed(content_id, difficulty_id)
	super._on_completed()
	_refresh_gallery_cards()


func _refresh_sessions_list() -> void:
	super._refresh_sessions_list()
	_refresh_gallery_cards()


func _refresh_gallery_cards() -> void:
	if gallery_cards.is_empty():
		return
	var query := gallery_search.text.strip_edges().to_lower() if gallery_search != null else ""
	var category := _selected_filter_value(gallery_category_filter, "all")
	var status_filter := _selected_filter_value(gallery_status_filter, "all")

	for content_id_value in gallery_cards.keys():
		var content_id := str(content_id_value)
		var card = gallery_cards.get(content_id)
		if not (card is Control):
			continue
		var metadata: Dictionary = (
			board.content_metadata(content_id)
			if board != null and board.has_method("content_metadata")
			else {}
		)
		var search_text := (
			str(board.content_search_text(content_id))
			if board != null and board.has_method("content_search_text")
			else str(metadata.get("label", content_id)).to_lower()
		)
		var category_matches := category == "all" or str(metadata.get("category", "")) == category
		var query_matches := query.is_empty() or search_text.contains(query)
		var gallery_status := _gallery_status_for(content_id)
		var status_matches := (
			status_filter == "all"
			or (status_filter == "favorites" and gallery_state.is_favorite(content_id))
			or status_filter == gallery_status
		)
		(card as Control).visible = query_matches and category_matches and status_matches

		var favorite = gallery_favorite_buttons.get(content_id)
		if favorite is Button:
			(favorite as Button).text = "★" if gallery_state.is_favorite(content_id) else "☆"

		var status_label = gallery_status_labels.get(content_id)
		if status_label is Label:
			(status_label as Label).text = _gallery_status_copy(content_id, metadata)

		var continue_button = gallery_continue_buttons.get(content_id)
		if continue_button is Button:
			(continue_button as Button).visible = gallery_status == "continue"

	_refresh_content_card_state()


func _gallery_status_for(content_id: String) -> String:
	if not _unfinished_entry_for_content(content_id).is_empty():
		return "continue"
	if gallery_state.is_completed(content_id):
		return "completed"
	return "new"


func _gallery_status_copy(content_id: String, metadata: Dictionary) -> String:
	var unfinished := _unfinished_entry_for_content(content_id)
	if not unfinished.is_empty():
		var progress := int(round(float(unfinished.get("progress", 0.0)) * 100.0))
		return "Continue · %d%%" % progress
	if gallery_state.is_completed(content_id):
		var completion := gallery_state.completion_for(content_id)
		return "Completed · %d×" % maxi(1, int(completion.get("count", 1)))
	var suggested := str(metadata.get("suggested_difficulty", ""))
	return "New · suggested %s" % suggested.capitalize() if not suggested.is_empty() else "New"


func _unfinished_entry_for_content(content_id: String) -> Dictionary:
	if save_coordinator == null or board == null or not board.has_method("content_metadata"):
		return {}
	var metadata: Dictionary = board.content_metadata(content_id)
	var source_id := str(metadata.get("source_id", ""))
	if source_id.is_empty():
		return {}

	# Clean bootstrap intentionally owns one provisional Garden slot so the save
	# coordinator always has a durable place to commit the player's first choice.
	# That technical placeholder is not a player-started puzzle and must never be
	# surfaced as Continue · 0% in the Gallery.
	var provisional_game_id := ""
	if (
		save_coordinator.has_method("needs_new_game_selection")
		and bool(save_coordinator.needs_new_game_selection())
	):
		provisional_game_id = str(save_coordinator.active_game())

	var best: Dictionary = {}
	for entry_value in save_coordinator.list_unfinished_games():
		if not (entry_value is Dictionary):
			continue
		var entry: Dictionary = entry_value
		if not provisional_game_id.is_empty() and str(entry.get("game_id", "")) == provisional_game_id:
			continue
		if str(entry.get("content_source_id", "")) != source_id:
			continue
		if best.is_empty() or int(entry.get("last_played_unix", 0)) > int(best.get("last_played_unix", 0)):
			best = entry
	return best


func _selected_filter_value(button: OptionButton, fallback: String) -> String:
	if button == null or button.get_item_count() <= 0:
		return fallback
	return str(button.get_item_metadata(button.selected))
