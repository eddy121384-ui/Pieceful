extends "res://scripts/commercial_product_ux_main.gd"

const THUMBNAIL_BUDGET := 12
const THUMBNAIL_MARGIN := 180.0

var poki_bridge = null
var poki_profile: Dictionary = {}
var poki_themes: Array = []
var poki_thumb_paths: Dictionary = {}
var poki_thumb_cache: Dictionary = {}
var poki_thumb_order: Array[String] = []
var poki_thumb_elapsed := 0.0
var poki_play_started := false
var poki_manual_paused := false
var poki_ad_lock := false
var poki_completion_transition_pending := false
var poki_pause_owned := false
var poki_previous_pause := false
var poki_audio_snapshot: Array[bool] = []
var poki_pause_layer: CanvasLayer
var poki_pause_scrim: ColorRect
var poki_pause_copy: Label
var poki_resume_button: Button
var poki_services_copy: Label
var poki_had_saved_slots := false
var poki_ready := false


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	poki_had_saved_slots = FileAccess.file_exists("user://saves/index.json")
	poki_profile = JSON.parse_string(FileAccess.get_file_as_string("res://poki/profile.json"))
	poki_themes = JSON.parse_string(FileAccess.get_file_as_string("res://poki/themes.json"))
	if OS.has_feature("web"):
		poki_bridge = JavaScriptBridge.get_interface("PiecefulPoki")
	super._ready()
	for child in [board, puzzle_camera, get_node("SortingWorkspace")]:
		child.process_mode = Node.PROCESS_MODE_PAUSABLE
	_build_poki_pause()
	poki_services_copy = _product_label("Online services are unavailable. Your puzzle still works.")
	poki_services_copy.add_theme_font_size_override("font_size", 20)
	poki_services_copy.visible = false
	puzzle_selection_panel.get_child(0).add_child(poki_services_copy)
	gallery_category_filter.clear()
	gallery_category_filter.add_item("All pictures")
	gallery_category_filter.set_item_metadata(0, "all")
	for theme: Dictionary in poki_themes:
		gallery_category_filter.add_item(str(theme["label"]))
		gallery_category_filter.set_item_metadata(gallery_category_filter.item_count - 1, str(theme["id"]))
	poki_ready = true
	_apply_poki_scope()


func _warn_if_browser_storage_is_temporary(persistent: bool) -> void:
	if not persistent:
		_ask_product_confirmation("Progress will not be kept", "Your browser is blocking saves. You can play, but progress will be lost when you close or reload. Enable site storage to keep it.", Callable(), "Close")


func _wait_for_catalog_bootstrap() -> void:
	await super._wait_for_catalog_bootstrap()
	# The accepted curtain/bootstrap restore still owns save loading. A new
	# player sees a featured setup immediately; no Gallery discovery is required.
	if not poki_had_saved_slots:
		_open_product_setup(str(poki_profile["featured_content_id"]))
	await get_tree().process_frame
	if poki_bridge != null:
		poki_bridge.usable()
	_apply_poki_scope()


func _process(delta: float) -> void:
	super._process(delta)
	if not poki_ready:
		return
	poki_thumb_elapsed += delta
	if poki_thumb_elapsed >= 0.08:
		poki_thumb_elapsed = 0.0
		_refresh_visible_poki_thumbnails()
	var hidden := bool(poki_bridge.hidden) if poki_bridge != null else false
	if hidden and not poki_pause_owned:
		_poki_save_before_interruption()
	_sync_poki_pause(poki_ad_lock or poki_manual_paused or hidden)
	if poki_bridge != null:
		poki_services_copy.visible = str(poki_bridge.status) == "failed" or not str(poki_bridge.error).is_empty()
	var interactive := not get_tree().paused and not puzzle_selection_overlay.visible and not completion_panel.visible
	interactive = interactive and not sessions_panel.visible and not product_confirmation_overlay.visible
	interactive = interactive and not product_settings_overlay.visible and not album_overflow_panel.visible
	if interactive and (board.active_drag_piece != null or puzzle_camera.mouse_panning or puzzle_camera.touch_points.size() > 0):
		poki_play_started = true
	if poki_bridge != null:
		poki_bridge.gameplay(interactive and poki_play_started)


func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_ESCAPE:
		if poki_ad_lock:
			get_viewport().set_input_as_handled()
		elif not puzzle_selection_overlay.visible and not completion_panel.visible:
			_toggle_poki_pause()
			get_viewport().set_input_as_handled()
		return
	if not get_tree().paused:
		super._input(event)


func _add_content_card(preset: Dictionary) -> void:
	# Same paper card controls/layout, with no eager texture load or advanced
	# collection controls. Accepted UI styling continues to own their appearance.
	var identifier := str(preset["id"])
	var card := VBoxContainer.new()
	card.name = "GalleryCard_%s" % identifier
	card.custom_minimum_size = Vector2(188, 218)
	_active_gallery_host().add_child(card)
	gallery_cards[identifier] = card
	var picture := TextureButton.new()
	picture.name = "Artwork_%s" % identifier
	picture.custom_minimum_size = Vector2(188, 128)
	picture.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	picture.ignore_texture_size = true
	picture.stretch_mode = TextureButton.STRETCH_KEEP_ASPECT_CENTERED
	picture.toggle_mode = true
	picture.mouse_filter = Control.MOUSE_FILTER_PASS
	picture.pressed.connect(_on_content_card_pressed.bind(identifier))
	card.add_child(picture)
	content_buttons[identifier] = picture
	poki_thumb_paths[identifier] = str(preset["thumbnail_path"])
	var caption_row := HBoxContainer.new()
	card.add_child(caption_row)
	var caption := Label.new()
	caption.text = str(preset["label"])
	caption.clip_text = true
	caption.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	caption.add_theme_font_size_override("font_size", 22)
	caption_row.add_child(caption)
	var favorite := Button.new()
	favorite.visible = false
	caption_row.add_child(favorite)
	gallery_favorite_buttons[identifier] = favorite
	var progress := Label.new()
	progress.add_theme_font_size_override("font_size", 18)
	card.add_child(progress)
	gallery_status_labels[identifier] = progress
	var resume := Button.new()
	resume.text = "Continue"
	resume.custom_minimum_size.y = 40
	resume.pressed.connect(_on_continue_pressed.bind(identifier))
	card.add_child(resume)
	gallery_continue_buttons[identifier] = resume


func _refresh_gallery_cards() -> void:
	# Keep canonical search/progress handling; apply multi-membership themes
	# derived from existing taxonomy without changing the authoritative entries.
	var theme := _selected_filter_value(gallery_category_filter, "all")
	if gallery_category_filter != null:
		gallery_category_filter.set_item_metadata(gallery_category_filter.selected, "all")
	super._refresh_gallery_cards()
	if gallery_category_filter != null:
		gallery_category_filter.set_item_metadata(gallery_category_filter.selected, theme)
	if theme != "all":
		for group: Dictionary in poki_themes:
			if str(group["id"]) == theme:
				for identifier in gallery_cards:
					gallery_cards[identifier].visible = gallery_cards[identifier].visible and group["artwork_ids"].has(identifier)
	if poki_ready:
		ReachablePaper.style_cards(self)
		_sync_product_gallery_state()
		_apply_poki_scope()


func _load_poki_thumbnail(identifier: String) -> void:
	if not poki_thumb_paths.has(identifier):
		return
	if not poki_thumb_cache.has(identifier):
		var texture = load(str(poki_thumb_paths[identifier]))
		if not texture is Texture2D:
			puzzle_selection_error.text = "This picture preview could not load. Please choose another."
			puzzle_selection_error.visible = true
			return
		poki_thumb_cache[identifier] = texture
	poki_thumb_order.erase(identifier)
	poki_thumb_order.append(identifier)
	var picture: TextureButton = content_buttons[identifier]
	picture.texture_normal = poki_thumb_cache[identifier]
	picture.texture_pressed = picture.texture_normal
	picture.texture_hover = picture.texture_normal
	while poki_thumb_order.size() > THUMBNAIL_BUDGET:
		var old: String = poki_thumb_order.pop_front()
		var old_picture: TextureButton = content_buttons[old]
		old_picture.texture_normal = null
		old_picture.texture_pressed = null
		old_picture.texture_hover = null
		poki_thumb_cache.erase(old)


func _refresh_visible_poki_thumbnails() -> void:
	if not puzzle_selection_overlay.visible or product_setup_open:
		return
	for identifier in gallery_cards:
		var picture: TextureButton = content_buttons[identifier]
		if not picture.is_visible_in_tree():
			continue
		var clip := get_viewport().get_visible_rect()
		var ancestor := picture.get_parent()
		while ancestor != null:
			if ancestor is ScrollContainer:
				clip = clip.intersection(ancestor.get_global_rect())
			ancestor = ancestor.get_parent()
		if clip.grow(THUMBNAIL_MARGIN).intersects(picture.get_global_rect()) and not poki_thumb_cache.has(identifier):
			_load_poki_thumbnail(str(identifier))
			break # At most one derivative decode in a frame.


func _open_product_setup(content_id: String) -> void:
	_load_poki_thumbnail(content_id)
	super._open_product_setup(content_id)
	product_setup_copy.text = "Quick: about 12 · Easy: 12–40 · Normal: 40–150 · Hard: 150–286.\nChoose any count. Picture detail adds its own challenge."
	var suggested := str(board.content_metadata(content_id).get("suggested_difficulty", "relaxed"))
	product_setup_copy.text += "\nPicture recommendation: %s." % {"relaxed": "Easy", "standard": "Normal", "hard": "Hard"}.get(suggested, suggested.capitalize())
	if not poki_had_saved_slots:
		product_setup_resume.visible = false
		puzzle_selection_start.text = "Start puzzle"
	_apply_poki_scope()


func _start_selected_puzzle() -> void:
	if poki_ad_lock:
		return
	# Current Poki requirements forbid ads on the way INTO level selection.
	# A completion creates one opportunity, consumed only when the player
	# explicitly starts the next puzzle and is heading back into gameplay.
	if poki_completion_transition_pending and not await _poki_commercial_transition():
		return
	poki_play_started = false
	super._start_selected_puzzle()
	if not puzzle_selection_overlay.visible:
		poki_had_saved_slots = true
		poki_completion_transition_pending = false
		poki_play_started = true # The real Start action entered puzzle gameplay.
	_apply_poki_scope()


func _on_resume_game_pressed(game_id: String) -> void:
	poki_play_started = false
	await super._on_resume_game_pressed(game_id)
	poki_play_started = not puzzle_selection_overlay.visible and not product_resume_pending
	_apply_poki_scope()


func _show_puzzle_selection(can_cancel: bool) -> void:
	if poki_bridge != null:
		poki_bridge.gameplay(false)
	super._show_puzzle_selection(can_cancel)
	if product_setup_artwork != null:
		product_setup_artwork.texture = null
	_apply_poki_scope()


func _sync_product_gallery_state() -> void:
	super._sync_product_gallery_state()
	_apply_poki_scope()


func _apply_poki_scope() -> void:
	if not product_ready:
		return
	product_header.get_child(1).visible = false
	product_header.get_child(2).visible = false
	product_collection_row.visible = false
	for favorite in gallery_favorite_buttons.values():
		favorite.visible = false
	gallery_status_filter.visible = false
	gallery_for_you_box.visible = false
	puzzle_selection_panel.get_child(0).get_node("PaperSelectionBody").get_child(0).get_node("PuzzleMeBox").visible = false
	if puzzle_me_button != null:
		puzzle_me_button.disabled = true
	if journal_button != null:
		journal_button.visible = false
	if completion_share_button != null:
		completion_share_button.visible = false
	for button in [timelapse_replay_button, timelapse_export_button, timelapse_share_video_button]:
		if button != null:
			button.visible = false
	# Every relayout may restyle/reveal inherited controls; the profile remains
	# enforced by action guards as well as visibility.
	for container in [album_overflow_panel, completion_panel]:
		if container != null:
			for control in container.find_children("*", "Button", true, false):
				if str(control.text) in ["Replay", "Replay puzzle", "Save video", "Puzzle history", "Puzzle Journal", "Share result"]:
					control.visible = false


func _layout_ui(viewport_size: Vector2) -> void:
	super._layout_ui(viewport_size)
	_apply_poki_scope()


func _toggle_journal() -> void:
	pass


func _on_share_result_pressed() -> void:
	pass


func _on_timelapse_replay_pressed() -> void:
	pass


func _on_timelapse_export_pressed() -> void:
	pass


func _begin_share_card_preparation(_record: Dictionary) -> void:
	pass


func _prepare_timelapse_replay(_record: Dictionary) -> void:
	pass


func _prepare_timelapse_video_export(_record: Dictionary) -> void:
	pass


func _open_product_settings() -> void:
	pass


func _prepare_puzzle_me_import(_bytes: PackedByteArray, _original_name: String) -> void:
	pass


func _request_break_ad(_placement: String) -> Dictionary:
	return {"status": "poki_only"}


func _on_completed() -> void:
	poki_completion_transition_pending = true
	poki_play_started = false
	if poki_bridge != null:
		poki_bridge.gameplay(false)
	super._on_completed()
	_apply_poki_scope()


func _on_completion_next_pressed() -> void:
	if poki_ad_lock:
		return
	super._on_completion_next_pressed()
	_apply_poki_scope()


func _on_completion_recommendation_pressed(index: int) -> void:
	if poki_ad_lock:
		return
	super._on_completion_recommendation_pressed(index)
	_apply_poki_scope()


func _poki_commercial_transition() -> bool:
	var sorting := get_node("SortingWorkspace")
	if poki_ad_lock or board.active_drag_piece != null or puzzle_camera.mouse_panning or not puzzle_camera.touch_points.is_empty() or sorting.layout_transition_active:
		return false
	if not poki_completion_transition_pending or not product_setup_open or not puzzle_selection_overlay.visible:
		return false # Only confirmed next-puzzle start after completion qualifies.
	if _has_playable_session() and not save_coordinator.save_now(true):
		return false
	if poki_bridge == null or str(poki_bridge.status) != "ready":
		return true # No ad attempted; observable SDK status remains unavailable.
	poki_ad_lock = true
	_sync_poki_pause(true)
	var requested := bool(poki_bridge.commercialBreak())
	if requested:
		while bool(poki_bridge.adPending):
			await get_tree().process_frame
	poki_ad_lock = false
	_sync_poki_pause(poki_manual_paused or bool(poki_bridge.hidden))
	return true


func _build_poki_pause() -> void:
	poki_pause_layer = CanvasLayer.new()
	poki_pause_layer.layer = 150
	add_child(poki_pause_layer)
	poki_pause_scrim = ColorRect.new()
	poki_pause_scrim.color = Color(Paper.WELL, 0.95)
	poki_pause_scrim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	poki_pause_layer.add_child(poki_pause_scrim)
	var center := CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	poki_pause_scrim.add_child(center)
	var box := VBoxContainer.new()
	box.custom_minimum_size.x = 260
	center.add_child(box)
	poki_pause_copy = _product_label("Paused", true)
	poki_pause_copy.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(poki_pause_copy)
	poki_resume_button = _product_button("Keep playing", _toggle_poki_pause, true)
	box.add_child(poki_resume_button)
	poki_pause_scrim.visible = false
	album_overflow_panel.get_child(0).add_child(_product_button("Pause", _toggle_poki_pause))


func _toggle_poki_pause() -> void:
	if poki_ad_lock or board.active_drag_piece != null or not puzzle_camera.touch_points.is_empty():
		return
	poki_manual_paused = not poki_manual_paused
	_close_album_overflow()
	if poki_manual_paused:
		_poki_save_before_interruption()
	_sync_poki_pause(poki_manual_paused or (bool(poki_bridge.hidden) if poki_bridge != null else false))


func _poki_save_before_interruption() -> void:
	# Mirror the accepted lifecycle guard: a selected slot can exist while
	# its artwork/geometry are still restoring. Never save the provisional
	# runtime over that durable slot during bootstrap or manual resume.
	if not _has_playable_session() or save_coordinator.bootstrapping or save_coordinator.resume_in_progress or product_resume_pending:
		return
	save_coordinator.save_now(false)


func _sync_poki_pause(paused: bool) -> void:
	if paused and not poki_pause_owned:
		poki_pause_owned = true
		poki_previous_pause = get_tree().paused
		poki_audio_snapshot.clear()
		for index in AudioServer.bus_count:
			poki_audio_snapshot.append(AudioServer.is_bus_mute(index))
			AudioServer.set_bus_mute(index, true)
		get_tree().paused = true
	elif not paused and poki_pause_owned:
		get_tree().paused = poki_previous_pause
		for index in mini(AudioServer.bus_count, poki_audio_snapshot.size()):
			AudioServer.set_bus_mute(index, poki_audio_snapshot[index])
		poki_pause_owned = false
	if poki_pause_scrim != null:
		poki_pause_scrim.visible = paused
		poki_pause_copy.text = "One moment…" if poki_ad_lock else "Paused"
		poki_resume_button.visible = not poki_ad_lock
