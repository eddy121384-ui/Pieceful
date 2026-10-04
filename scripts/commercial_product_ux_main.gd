class_name CommercialProductUxMain
extends "res://scripts/commercial_gameplay_hud_main.gd"

# Product navigation sits above the accepted watercolor presentation and uses
# the existing catalog, save, photo, recommendation and completion contracts.
# Piece rendering, picking, gestures, camera, geometry and snapping stay intact.
var product_ready := false
var product_setup_open := false
var product_can_return := false
var product_resume_pending := false
var product_sessions_from_gallery := false
var product_collection := "browse"
var product_resume_id := ""
var product_confirmation_action: Callable
var product_gallery_button: Button
var product_header: HBoxContainer
var product_collection_row: HBoxContainer
var product_collection_buttons: Dictionary = {}
var product_resume_box: VBoxContainer
var product_resume_button: Button
var product_saved_copy: Label
var product_setup_box: VBoxContainer
var product_setup_artwork: TextureRect
var product_setup_title: Label
var product_setup_copy: Label
var product_setup_resume: Button
var product_difficulty_row: Control
var product_actions_row: Control
var product_settings_overlay: ColorRect
var product_settings_panel: PanelContainer
var product_confirmation_overlay: ColorRect
var product_confirmation_panel: PanelContainer
var product_confirmation_title: Label
var product_confirmation_copy: Label
var product_confirmation_confirm: Button
var product_sessions_scrim: ColorRect
var product_tools_scrim: ColorRect


func _ready() -> void:
	super._ready()
	_build_product_gallery()
	_build_product_settings()
	_build_product_confirmation()
	_build_product_gameplay_navigation()
	_build_product_modal_scrims()
	_prioritize_completion_actions()
	product_ready = true
	_refresh_product_gallery()
	_layout_ui(_sync_content_scale_to_window())


func _wait_for_catalog_bootstrap() -> void:
	await super._wait_for_catalog_bootstrap()
	# Both first and returning sessions enter a stable destination. The existing
	# bootstrap still restores the precise board under the loading curtain.
	if product_ready:
		_show_puzzle_selection(_has_playable_session())
		if OS.has_feature("web"):
			_warn_if_browser_storage_is_temporary(OS.is_userfs_persistent())


func _warn_if_browser_storage_is_temporary(persistent: bool) -> void:
	if not persistent:
		_ask_product_confirmation("Progress will not be kept", "Your browser is blocking storage. Progress and imported photos will be lost when you close or reload this page. Enable site storage to keep them.", Callable(), "Close")


func _has_playable_session() -> bool:
	return save_coordinator != null and save_coordinator.has_active_game() and not save_coordinator.needs_new_game_selection()


func _product_button(caption: String, action: Callable, primary := false) -> Button:
	var button := Button.new()
	button.text = caption
	button.custom_minimum_size = Vector2(0, 88)
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	button.clip_text = true
	button.theme = Paper.theme()
	button.add_theme_stylebox_override("normal", Paper.button_box(primary))
	button.pressed.connect(action)
	return button


func _product_label(copy: String, heading := false) -> Label:
	var label := Label.new()
	label.text = copy
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	label.theme = Paper.theme()
	if heading:
		label.add_theme_font_override("font", Paper.SERIF)
		label.add_theme_font_size_override("font_size", 34)
	return label


func _build_product_gallery() -> void:
	var outer := puzzle_selection_panel.get_child(0) as VBoxContainer
	outer.get_node("PaperSelectionBody").vertical_scroll_mode = ScrollContainer.SCROLL_MODE_SHOW_NEVER
	var body := outer.get_node("PaperSelectionBody").get_child(0)
	product_difficulty_row = puzzle_selection_difficulty.get_parent()
	product_actions_row = puzzle_selection_start.get_parent()
	var heading := outer.get_child(0) as Label
	heading.text = "Gallery"
	product_header = HBoxContainer.new()
	product_header.name = "ProductGalleryHeader"
	outer.add_child(product_header)
	outer.move_child(product_header, 0)
	heading.reparent(product_header)
	heading.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	heading.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	var history := _product_button("History", _toggle_journal)
	history.custom_minimum_size.x = 128
	history.size_flags_horizontal = Control.SIZE_SHRINK_END
	product_header.add_child(history)
	var settings := _product_button("Settings", _open_product_settings)
	settings.custom_minimum_size.x = 140
	settings.size_flags_horizontal = Control.SIZE_SHRINK_END
	product_header.add_child(settings)
	var subheading := outer.get_child(1) as Label
	subheading.text = "Choose a picture. Play at your own pace."

	product_resume_box = VBoxContainer.new()
	product_resume_box.name = "ProductResume"
	body.add_child(product_resume_box)
	body.move_child(product_resume_box, 0)
	product_resume_button = _product_button("Continue puzzle", _continue_product_session, true)
	product_resume_box.add_child(product_resume_button)
	product_saved_copy = _product_label("")
	product_saved_copy.add_theme_color_override("font_color", Paper.SOFT)
	product_resume_box.add_child(product_saved_copy)
	var progress_button := _product_button("All unfinished puzzles", _toggle_sessions_panel)
	product_resume_box.add_child(progress_button)

	product_collection_row = HBoxContainer.new()
	product_collection_row.name = "ProductCollections"
	body.add_child(product_collection_row)
	body.move_child(product_collection_row, 1)
	for spec in [["browse", "Browse"], ["favorites", "Favorites"], ["photos", "My photos"]]:
		var key := str(spec[0])
		var button := _product_button(str(spec[1]), _select_product_collection.bind(key))
		product_collection_row.add_child(button)
		product_collection_buttons[key] = button

	# Discovery does not carry a sticky start action for a hidden/default artwork.
	# Preserve the real picker fields and signals, but reveal them after selection.
	product_setup_box = VBoxContainer.new()
	product_setup_box.name = "ProductPuzzleSetup"
	product_setup_box.size_flags_vertical = Control.SIZE_EXPAND_FILL
	product_setup_box.add_theme_constant_override("separation", 16)
	outer.get_node("PaperSelectionBody").get_child(0).add_child(product_setup_box)
	product_setup_title = _product_label("", true)
	product_setup_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	product_setup_box.add_child(product_setup_title)
	product_setup_artwork = TextureRect.new()
	product_setup_artwork.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	product_setup_artwork.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	product_setup_artwork.size_flags_vertical = Control.SIZE_EXPAND_FILL
	product_setup_artwork.custom_minimum_size.y = 160
	product_setup_box.add_child(product_setup_artwork)
	product_setup_copy = _product_label("Choose a piece count for this picture.")
	product_setup_copy.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	product_setup_box.add_child(product_setup_copy)
	product_setup_resume = _product_button("Continue saved puzzle", _continue_selected_product_puzzle, true)
	product_setup_box.add_child(product_setup_resume)
	product_difficulty_row.get_child(0).text = "Pieces"
	puzzle_selection_start.text = "Start puzzle"
	puzzle_selection_cancel.text = "Back to puzzle"
	gallery_search.placeholder_text = "Search pictures, artists or themes"
	gallery_status_filter.set_item_text(0, "All puzzles")
	gallery_status_filter.set_item_text(3, "In progress")
	gallery_for_you_box.visible = false
	# My photos has its own destination and a clear entry before its picture grid.
	var photo_box := body.get_node("PuzzleMeBox")
	body.move_child(photo_box, 2)
	puzzle_me_button.text = "Choose a photo"
	Paper.mark_button(puzzle_me_button, Paper.Mark.PHOTO)
	photo_box.visible = false
	_sync_product_gallery_state()


func _build_product_settings() -> void:
	product_settings_overlay = _product_overlay("ProductSettingsOverlay", 70)
	product_settings_panel = PanelContainer.new()
	product_settings_panel.add_theme_stylebox_override("panel", Paper.surface(false, 24))
	product_settings_overlay.add_child(product_settings_panel)
	var outer := VBoxContainer.new()
	outer.add_theme_constant_override("separation", 18)
	product_settings_panel.add_child(outer)
	var header := HBoxContainer.new()
	outer.add_child(header)
	header.add_child(_product_label("Settings", true))
	header.add_child(_product_button("Close", _close_product_settings))
	var scroll := ScrollContainer.new()
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	outer.add_child(scroll)
	var content := VBoxContainer.new()
	content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	content.add_theme_constant_override("separation", 20)
	scroll.add_child(content)
	content.add_child(_product_label("Your pictures and progress stay on this device."))
	content.add_child(_product_label("Recommendations", true))
	content.add_child(_product_label("Picks learn from your favorites and completed puzzles. Resetting picks keeps your progress, favorites and history."))
	gallery_reset_recommendations.reparent(content)
	gallery_reset_recommendations.text = "Reset recommendations"
	gallery_reset_recommendations.custom_minimum_size.y = 88
	# Purchase and restoration controls retain their existing provider bindings.
	# They belong to Settings, not between artwork recommendations.
	if monetization_row != null:
		monetization_row.reparent(content)
		monetization_row.visible = true
		monetization_status.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		restore_purchases_button.text = "Restore purchases"
		for button in [remove_ads_button, restore_purchases_button]:
			button.custom_minimum_size.y = 88
	content.add_child(_product_label("No ads while you puzzle.", true))
	content.add_child(_product_label("If ads are available, they appear only between puzzles. Your private photos are never uploaded."))
	Paper.apply_tree(product_settings_panel)
	header.get_child(0).add_theme_font_size_override("font_size", 34)


func _product_overlay(node_name: String, order: int) -> ColorRect:
	var layer := CanvasLayer.new()
	layer.name = node_name + "Layer"
	layer.layer = order
	add_child(layer)
	var overlay := ColorRect.new()
	overlay.name = node_name
	overlay.color = Color(Paper.WELL, 0.94)
	overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	overlay.visible = false
	layer.add_child(overlay)
	return overlay


func _build_product_confirmation() -> void:
	product_confirmation_overlay = _product_overlay("ProductConfirmationOverlay", 80)
	product_confirmation_panel = PanelContainer.new()
	product_confirmation_panel.add_theme_stylebox_override("panel", Paper.surface(false, 28))
	product_confirmation_overlay.add_child(product_confirmation_panel)
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 20)
	product_confirmation_panel.add_child(box)
	product_confirmation_title = _product_label("", true)
	product_confirmation_copy = _product_label("")
	box.add_child(product_confirmation_title)
	box.add_child(product_confirmation_copy)
	var row := HBoxContainer.new()
	box.add_child(row)
	row.add_child(_product_button("Keep playing", _close_product_confirmation))
	product_confirmation_confirm = _product_button("Confirm", _confirm_product_action, true)
	row.add_child(product_confirmation_confirm)


func _build_product_gameplay_navigation() -> void:
	product_gallery_button = _product_button("Gallery", _leave_puzzle_for_gallery)
	product_gallery_button.name = "ProductGalleryButton"
	product_gallery_button.add_theme_font_size_override("font_size", 24)
	title_label.get_parent().add_child(product_gallery_button)
	album_dock_labels.reference.text = "Picture"
	preview_button.tooltip_text = "Picture · floating reference, on the board, or hidden"
	var sorting := get_node_or_null("SortingWorkspace")
	if sorting != null:
		sorting.sort_button.tooltip_text = "Trays · group pieces your way"
		sorting.layout_mode_button.tooltip_text = "Pieces · arrange loose pieces on the table or in a strip"


func _build_product_modal_scrims() -> void:
	var saved_layer := sessions_panel.get_parent() as CanvasLayer
	saved_layer.layer = 55
	product_sessions_scrim = ColorRect.new()
	product_sessions_scrim.color = Color(Paper.WELL, 0.94)
	product_sessions_scrim.visible = false
	saved_layer.add_child(product_sessions_scrim)
	saved_layer.move_child(product_sessions_scrim, 0)
	product_tools_scrim = ColorRect.new()
	product_tools_scrim.color = Color.TRANSPARENT
	product_tools_scrim.visible = false
	product_tools_scrim.gui_input.connect(_on_product_tools_background)
	album_overflow_layer.add_child(product_tools_scrim)
	album_overflow_layer.move_child(product_tools_scrim, 0)
	# The shared Gallery/Journal layer now contains a header container. The
	# presentation adapter addresses it by name instead of child position.
	journal_panel.get_child(0).get_child(0).get_child(0).text = "Puzzle history"
	for button in album_overflow_panel.find_children("*", "Button", true, false):
		if button.text == "Puzzle Journal":
			button.text = "Puzzle history"


func _prioritize_completion_actions() -> void:
	if completion_next_button == null:
		return
	var outer := completion_panel.get_child(0)
	var next_row := HBoxContainer.new()
	next_row.name = "ProductCompletionNext"
	outer.add_child(next_row)
	completion_next_button.reparent(next_row)
	completion_next_button.text = "Choose next puzzle"
	completion_next_button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	completion_next_button.add_theme_stylebox_override("normal", Paper.button_box(true))
	outer.move_child(next_row, mini(1, outer.get_child_count() - 1))


func _show_puzzle_selection(can_cancel: bool) -> void:
	super._show_puzzle_selection(can_cancel)
	if not product_ready:
		return
	product_can_return = can_cancel and _has_playable_session()
	product_setup_open = false
	puzzle_selection_panel.get_child(0).get_node("PaperSelectionBody").scroll_vertical = 0
	_close_album_overflow()
	_sync_product_gallery_state()
	_refresh_product_gallery()
	call_deferred("_layout_product_after_frame")


func _sync_product_gallery_state() -> void:
	if product_setup_box == null:
		return
	var outer := puzzle_selection_panel.get_child(0)
	var content := outer.get_node("PaperSelectionBody").get_child(0)
	content.get_node("GalleryFilters").visible = not product_setup_open
	var has_cards := false
	for card in gallery_cards.values():
		has_cards = has_cards or card.visible
	gallery_scroll.visible = not product_setup_open and has_cards
	var empty := content.get_node_or_null("PaperGalleryEmpty")
	if empty != null:
		empty.visible = not product_setup_open and not has_cards
	content.get_node("PuzzleMeBox").visible = not product_setup_open and product_collection == "photos"
	product_setup_box.visible = product_setup_open
	product_difficulty_row.visible = product_setup_open
	puzzle_selection_start.visible = product_setup_open
	puzzle_selection_cancel.visible = product_setup_open or product_can_return
	puzzle_selection_cancel.text = "Back to Gallery" if product_setup_open else "Back to puzzle"
	product_actions_row.visible = product_setup_open or product_can_return
	product_collection_row.visible = not product_setup_open
	product_resume_box.visible = not product_setup_open and not product_resume_id.is_empty()
	product_header.get_child(0).text = "Choose pieces" if product_setup_open else "Gallery"
	# Shared paper styling clears button widths; clipped text needs an explicit
	# minimum again whenever a returning session opens this sheet.
	product_header.get_child(1).custom_minimum_size.x = 128
	product_header.get_child(2).custom_minimum_size.x = 140
	product_header.get_child(1).visible = not product_setup_open
	product_header.get_child(2).visible = not product_setup_open
	outer.get_child(1).visible = not product_setup_open
	for key in product_collection_buttons:
		product_collection_buttons[key].add_theme_stylebox_override("normal", Paper.button_box(key == product_collection))


func _on_content_card_pressed(content_id: String) -> void:
	super._on_content_card_pressed(content_id)
	if product_ready:
		_open_product_setup(content_id)


func _open_product_setup(content_id: String) -> void:
	product_setup_open = true
	puzzle_selection_panel.get_child(0).get_node("PaperSelectionBody").scroll_vertical = 0
	pending_content_id = content_id
	var preferred := recommendation_store.preferred_difficulty()
	if not preferred.is_empty():
		_refresh_picker_difficulties(content_id, preferred)
	product_setup_title.text = str(board.content_label_for_id(content_id))
	var picture := content_buttons.get(content_id) as TextureButton
	product_setup_artwork.texture = picture.texture_normal if picture != null else null
	var unfinished := _unfinished_entry_for_content(content_id)
	product_setup_resume.visible = not unfinished.is_empty()
	product_setup_copy.text = "Your saved puzzle is safe. Continue it, or start a separate puzzle with a new piece count." if not unfinished.is_empty() else "Choose a piece count for this picture."
	puzzle_selection_start.text = "Start another puzzle" if not unfinished.is_empty() else "Start puzzle"
	_sync_product_gallery_state()
	_layout_ui(_sync_content_scale_to_window())


func _hide_puzzle_selection() -> void:
	if product_ready and product_setup_open:
		product_setup_open = false
		_sync_product_gallery_state()
		call_deferred("_layout_product_after_frame")
		return
	super._hide_puzzle_selection()


func _start_selected_puzzle() -> void:
	super._start_selected_puzzle()
	if product_ready and not puzzle_selection_overlay.visible:
		product_setup_open = false
		product_can_return = true
		_sync_product_gallery_state()


func _leave_puzzle_for_gallery() -> void:
	if _has_playable_session() and not save_coordinator.save_now(true):
		_ask_product_confirmation("Progress could not be saved", "Please keep this puzzle open and try again before leaving.", Callable(), "Close")
		return
	_show_puzzle_selection(_has_playable_session())


func _select_product_collection(collection: String) -> void:
	product_collection = collection
	puzzle_selection_panel.get_child(0).get_node("PaperSelectionBody").scroll_vertical = 0
	gallery_search.text = ""
	gallery_category_filter.select(0)
	gallery_status_filter.select(0)
	if collection == "favorites":
		for index in range(gallery_status_filter.item_count):
			if str(gallery_status_filter.get_item_metadata(index)) == "favorites":
				gallery_status_filter.select(index)
	elif collection == "photos":
		_ensure_my_photos_filter()
		for index in range(gallery_category_filter.item_count):
			if str(gallery_category_filter.get_item_metadata(index)) == "my_photos":
				gallery_category_filter.select(index)
	_refresh_gallery_cards()
	_sync_product_gallery_state()


func _refresh_gallery_cards() -> void:
	super._refresh_gallery_cards()
	if product_ready:
		_refresh_product_gallery()


func _refresh_content_card_state() -> void:
	super._refresh_content_card_state()
	if product_ready:
		_sync_product_gallery_state()


func _apply_gallery_layout_for_orientation(logical_viewport_size: Vector2, orientation_size: Vector2) -> void:
	super._apply_gallery_layout_for_orientation(logical_viewport_size, orientation_size)
	if product_ready:
		# One vertical scroll surface owns discovery. An inner scrolling grid
		# otherwise traps swipes before the card footer or next row is revealed.
		if _gallery_portrait_grid:
			gallery_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
		_sync_product_gallery_state()


func _refresh_product_gallery() -> void:
	if not product_ready:
		return
	product_resume_id = ""
	product_resume_button.add_theme_stylebox_override("normal", Paper.button_box(true))
	product_setup_resume.add_theme_stylebox_override("normal", Paper.button_box(true))
	if save_coordinator != null and not save_coordinator.needs_new_game_selection():
		var games: Array = save_coordinator.list_unfinished_games()
		if not games.is_empty():
			var entry: Dictionary = games[0]
			for candidate: Dictionary in games:
				if bool(candidate.get("is_active", false)):
					entry = candidate
					break
			product_resume_id = str(entry.get("game_id", ""))
			var title := str(board.content_label_for_source_id(str(entry.get("content_source_id", ""))))
			product_resume_button.text = "Continue · %s" % title
			product_saved_copy.text = "Saved on this device · %d / %d pieces" % [int(entry.get("solved_count", 0)), int(entry.get("piece_count", 0))]
			product_resume_box.get_child(2).text = "All unfinished puzzles (%d)" % games.size()
	var body := puzzle_selection_panel.get_child(0).get_node("PaperSelectionBody").get_child(0)
	body.get_node("PuzzleMeBox").visible = product_collection == "photos"
	gallery_for_you_box.visible = false
	puzzle_me_button.text = "Choose a photo"
	gallery_status_filter.get_parent().visible = product_collection == "browse"
	gallery_search.visible = product_collection == "browse"
	var empty := body.get_node_or_null("PaperGalleryEmpty") as Label
	if empty != null and empty.visible:
		if product_collection == "favorites":
			empty.text = "No favorites yet.\nTap a heart beside a picture to save it here."
		elif product_collection == "photos":
			empty.text = "Your photo puzzles will appear here.\nChoose a photo to make your first one."
		else:
			empty.text = "No pictures match.\nTry another search or theme."
	_sync_product_gallery_state()


func _continue_product_session() -> void:
	if not product_resume_id.is_empty():
		_on_resume_game_pressed(product_resume_id)


func _continue_selected_product_puzzle() -> void:
	_on_continue_pressed(pending_content_id)


func _on_resume_game_pressed(game_id: String) -> void:
	product_resume_pending = true
	if product_ready and save_coordinator != null and game_id == str(save_coordinator.active_game()) and _has_playable_session():
		_close_sessions_panel()
		puzzle_selection_overlay.visible = false
		completion_panel.visible = false
		if monetization != null:
			monetization.begin_puzzle_session()
		_track_successful_puzzle_resume(game_id)
	else:
		await super._on_resume_game_pressed(game_id)
		if product_ready and save_coordinator != null and str(save_coordinator.active_game()) == game_id and save_coordinator.last_resume_error.is_empty():
			puzzle_selection_overlay.visible = false
	product_resume_pending = false
	if product_ready:
		product_setup_open = false
		_refresh_product_gallery()


func _toggle_sessions_panel() -> void:
	if product_ready:
		product_sessions_from_gallery = puzzle_selection_overlay.visible
	super._toggle_sessions_panel()
	if product_ready:
		product_sessions_scrim.visible = sessions_panel.visible
		_layout_ui(_sync_content_scale_to_window())


func _close_sessions_panel() -> void:
	super._close_sessions_panel()
	if product_sessions_scrim != null:
		product_sessions_scrim.visible = false


func _add_session_row(entry: Dictionary) -> void:
	super._add_session_row(entry)
	if not product_ready:
		return
	var row := sessions_list.get_child(sessions_list.get_child_count() - 1).get_child(0)
	var button := row.get_child(1) as Button
	button.disabled = false
	button.text = "Continue"
	button.tooltip_text = "Continue this saved puzzle"


func _refresh_sessions_list() -> void:
	super._refresh_sessions_list()
	if product_ready:
		_refresh_product_gallery()


func _open_product_settings() -> void:
	_refresh_monetization_controls()
	product_settings_overlay.visible = true
	_layout_ui(_sync_content_scale_to_window())


func _close_product_settings() -> void:
	product_settings_overlay.visible = false


func _refresh_monetization_controls() -> void:
	super._refresh_monetization_controls()
	if product_settings_panel != null:
		var entitlement: Dictionary = monetization.entitlement_snapshot()
		if not bool(entitlement.get("purchases_supported", false)):
			monetization_row.visible = false
		else:
			monetization_row.visible = true
			restore_purchases_button.visible = true


func _on_reset_recommendations_pressed() -> void:
	if not product_ready:
		super._on_reset_recommendations_pressed()
		return
	_ask_product_confirmation("Reset recommendations?", "Your progress, favorites, photos and puzzle history stay safe. Only your recommendation preferences reset.", _reset_product_recommendations, "Reset picks")


func _reset_product_recommendations() -> void:
	super._on_reset_recommendations_pressed()


func _on_album_reshuffle_pressed() -> void:
	if not product_ready:
		super._on_album_reshuffle_pressed()
		return
	_ask_product_confirmation("Reshuffle this puzzle?", "Placed and joined pieces return to the table. This resets the current puzzle; your other puzzles stay safe.", _reshuffle_product_puzzle, "Reshuffle")


func _reshuffle_product_puzzle() -> void:
	super._on_album_reshuffle_pressed()


func _on_album_difficulty_selected(index: int) -> void:
	if not product_ready:
		super._on_album_difficulty_selected(index)
		return
	var requested := str(album_overflow_difficulty.get_item_metadata(index))
	if requested == str(board.active_difficulty_id()):
		return
	var label := album_overflow_difficulty.get_item_text(index)
	_sync_album_difficulty()
	_ask_product_confirmation("Start a different piece count?", "Start %s as a separate puzzle. Your current progress stays in Unfinished puzzles." % label, _change_product_difficulty.bind(index), "Start another")


func _change_product_difficulty(index: int) -> void:
	_close_album_overflow()
	super._on_album_difficulty_selected(index)


func _on_delete_game_pressed(game_id: String) -> void:
	if not product_ready:
		super._on_delete_game_pressed(game_id)
		return
	if save_coordinator == null or game_id == str(save_coordinator.active_game()):
		return
	_ask_product_confirmation("Delete this saved puzzle?", "Its unfinished progress will be removed from this device. The picture, favorites and completed history stay available.", _delete_product_game.bind(game_id), "Delete puzzle")


func _delete_product_game(game_id: String) -> void:
	super._on_delete_game_pressed(game_id)


func _ask_product_confirmation(heading: String, copy: String, action: Callable, confirm: String) -> void:
	product_confirmation_title.text = heading
	product_confirmation_copy.text = copy
	product_confirmation_confirm.text = confirm
	product_confirmation_action = action
	product_confirmation_overlay.visible = true
	_layout_ui(_sync_content_scale_to_window())
	call_deferred("_layout_product_after_frame")
	product_confirmation_panel.get_child(0).get_child(2).get_child(0).text = "Cancel" if confirm in ["Reset picks", "Delete puzzle", "Close"] else "Keep playing"


func _close_product_confirmation() -> void:
	product_confirmation_overlay.visible = false
	product_confirmation_action = Callable()


func _confirm_product_action() -> void:
	var action := product_confirmation_action
	_close_product_confirmation()
	if action.is_valid():
		action.call()


func _toggle_album_overflow() -> void:
	super._toggle_album_overflow()
	if product_tools_scrim != null:
		product_tools_scrim.visible = album_overflow_panel.visible


func _close_album_overflow() -> void:
	super._close_album_overflow()
	if product_tools_scrim != null:
		product_tools_scrim.visible = false


func _on_product_tools_background(event: InputEvent) -> void:
	if (event is InputEventMouseButton and event.pressed) or (event is InputEventScreenTouch and event.pressed):
		_close_album_overflow()
		get_viewport().set_input_as_handled()


func _on_completed() -> void:
	super._on_completed()
	if product_ready:
		puzzle_selection_overlay.visible = false
		_close_album_overflow()
		_close_sessions_panel()
		completion_next_button.text = "Choose next puzzle"
		completion_next_button.add_theme_stylebox_override("normal", Paper.button_box(true))


func _on_completion_recommendation_pressed(index: int) -> void:
	super._on_completion_recommendation_pressed(index)
	if product_ready and index >= 0 and index < completion_more_like_ids.size():
		_open_product_setup(pending_content_id)


func _prepare_puzzle_me_import(bytes: PackedByteArray, original_name: String) -> void:
	await super._prepare_puzzle_me_import(bytes, original_name)
	if product_ready and pending_content_id.begins_with("photo_") and not puzzle_selection_error.visible:
		_open_product_setup(pending_content_id)


func completion_metrics_should_run() -> bool:
	if product_ready and (product_settings_overlay.visible or product_confirmation_overlay.visible):
		return false
	return super.completion_metrics_should_run()


func _refresh_aid_controls() -> void:
	super._refresh_aid_controls()
	if product_ready:
		preview_button.tooltip_text = "Picture · floating reference, on the board, or hidden"
		preview_panel.get_child(0).get_child(0).text = "Picture"


func _phase_for_event(kind: String) -> String:
	match kind:
		"start":
			return "Starting puzzle"
		"snap":
			return "Placing pieces"
	return super._phase_for_event(kind)


func _apply_replay_event(event: Dictionary, animation_seconds: float) -> void:
	super._apply_replay_event(event, animation_seconds)
	timelapse_footer.text = "Your puzzle replay"


func _run_timelapse_replay(plan: Dictionary, serial: int) -> void:
	await super._run_timelapse_replay(plan, serial)
	if serial == timelapse_play_serial and timelapse_overlay.visible:
		timelapse_phase.text = "Puzzle complete"
		timelapse_footer.text = "Replay again, or save your video"


func _unhandled_key_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE:
		if _product_back():
			get_viewport().set_input_as_handled()


func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_GO_BACK_REQUEST and product_ready:
		_product_back()


func _product_back() -> bool:
	if not product_ready:
		return false
	if product_confirmation_overlay.visible:
		_close_product_confirmation()
	elif product_settings_overlay.visible:
		_close_product_settings()
	elif journal_overlay.visible:
		_close_journal()
	elif sessions_panel.visible:
		_close_sessions_panel()
	elif album_overflow_panel.visible:
		_close_album_overflow()
	elif puzzle_selection_overlay.visible:
		_hide_puzzle_selection()
	elif completion_panel.visible:
		_on_completion_next_pressed()
	else:
		_leave_puzzle_for_gallery()
	return true


func _layout_ui(viewport_size: Vector2) -> void:
	super._layout_ui(viewport_size)
	if not product_ready:
		return
	var top := AlbumMetrics.top_bar_rect(viewport_size)
	product_gallery_button.position = top.position
	product_gallery_button.size = Vector2(116, 100)
	product_gallery_button.custom_minimum_size = Vector2(116, 100)
	title_label.position = top.position + Vector2(122, 8)
	title_label.size = Vector2(126, 48)
	title_label.add_theme_font_size_override("font_size", 30)
	title_label.visible = top.size.x >= 620
	album_masthead_caption.visible = false
	for overlay in [product_settings_overlay, product_confirmation_overlay, product_sessions_scrim, product_tools_scrim]:
		overlay.position = Vector2.ZERO
		overlay.size = viewport_size
	var safe := AlbumMetrics.safe_area_insets(viewport_size)
	var available := viewport_size - Vector2(safe.x + safe.z + 48, safe.y + safe.w + 48)
	product_settings_panel.custom_minimum_size = Vector2.ZERO
	product_settings_panel.size = Vector2(minf(860, available.x), minf(900, available.y))
	product_settings_panel.position = Vector2(safe.x + 24, safe.y + 24) + (available - product_settings_panel.size) * 0.5
	var confirmation_width := minf(700, available.x)
	product_confirmation_panel.custom_minimum_size = Vector2(confirmation_width, 0)
	product_confirmation_panel.size = Vector2(confirmation_width, minf(460, available.y))
	product_confirmation_panel.position = (viewport_size - product_confirmation_panel.size) * 0.5
	product_setup_artwork.custom_minimum_size.y = minf(420, maxf(100, available.y * 0.30))
	# Reflow both browse and setup in the same safe watercolor sheet envelope.
	ReachablePaper.layout(self, viewport_size)
	_sync_product_gallery_state()


func _layout_product_after_frame() -> void:
	await get_tree().process_frame
	if product_ready:
		_layout_ui(_sync_content_scale_to_window())
