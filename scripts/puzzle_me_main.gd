class_name PuzzleMeMain
extends "res://scripts/startup_gated_gallery_main.gd"

var puzzle_me_button: Button = null
var puzzle_me_privacy: Label = null
var puzzle_me_import_count := 0

var _web_photo_input = null
var _web_photo_reader = null
var _web_photo_change_callback = null
var _web_photo_load_callback = null
var _web_pending_name := ""


func _build_puzzle_selection_ui() -> void:
	super._build_puzzle_selection_ui()
	if puzzle_selection_panel == null:
		return
	var outer = puzzle_selection_panel.get_child(0)
	if not (outer is VBoxContainer):
		return

	var puzzle_me_box := VBoxContainer.new()
	puzzle_me_box.name = "PuzzleMeBox"
	puzzle_me_box.add_theme_constant_override("separation", 3)
	outer.add_child(puzzle_me_box)
	outer.move_child(puzzle_me_box, mini(2, outer.get_child_count() - 1))

	puzzle_me_button = Button.new()
	puzzle_me_button.name = "PuzzleMeButton"
	puzzle_me_button.text = "＋ Puzzle Me · Choose a photo"
	puzzle_me_button.custom_minimum_size = Vector2(0.0, 42.0)
	puzzle_me_button.tooltip_text = "Turn one of your photos into a puzzle"
	puzzle_me_button.pressed.connect(_pick_puzzle_me_photo)
	puzzle_me_box.add_child(puzzle_me_button)

	puzzle_me_privacy = Label.new()
	puzzle_me_privacy.name = "PuzzleMePrivacy"
	puzzle_me_privacy.text = "Private by default · your photo stays on this device"
	puzzle_me_privacy.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	puzzle_me_privacy.modulate = Color(1.0, 1.0, 1.0, 0.52)
	puzzle_me_privacy.add_theme_font_size_override("font_size", 11)
	puzzle_me_box.add_child(puzzle_me_privacy)


func _add_content_card(preset: Dictionary) -> void:
	var source_kind := str(preset.get("source_kind", ""))
	if source_kind != "local_photo":
		super._add_content_card(preset)
		return

	# Runtime user:// images are not imported Godot Resources, so the base Gallery
	# cannot load them with load(). Let it build the standard card using a harmless
	# placeholder, then replace only the card texture through the board's runtime
	# ImageTexture loader. Every other Gallery behavior stays shared.
	var card_preset: Dictionary = preset.duplicate(true)
	card_preset["path"] = "res://assets/demo_garden.svg"
	super._add_content_card(card_preset)
	var content_id := str(preset.get("id", ""))
	var picture = content_buttons.get(content_id)
	if picture is TextureButton and board != null and board.has_method("content_texture_for_id"):
		var texture = board.content_texture_for_id(content_id)
		if texture is Texture2D:
			(picture as TextureButton).texture_normal = texture
			(picture as TextureButton).texture_pressed = texture
			(picture as TextureButton).texture_hover = texture


func _pick_puzzle_me_photo() -> void:
	if OS.has_feature("web"):
		_pick_web_photo()
		return
	if DisplayServer.has_feature(DisplayServer.FEATURE_NATIVE_DIALOG_FILE):
		var filters := PackedStringArray([
			"*.png,*.jpg,*.jpeg,*.webp;Images;image/png,image/jpeg,image/webp",
		])
		var error := DisplayServer.file_dialog_show(
			"Choose a photo",
			"",
			"",
			false,
			DisplayServer.FILE_DIALOG_MODE_OPEN_FILE,
			filters,
			_on_native_photo_selected
		)
		if error != OK:
			_show_selection_error("This device could not open the photo picker.")
		return
	_show_selection_error("Photo picking is not available in this build yet.")


func _pick_web_photo() -> void:
	var document = JavaScriptBridge.get_interface("document")
	if document == null:
		_show_selection_error("The browser photo picker is unavailable.")
		return
	if _web_photo_input == null:
		_web_photo_input = document.createElement("input")
		_web_photo_input.type = "file"
		_web_photo_input.accept = "image/*"
		_web_photo_input.style.display = "none"
		document.body.appendChild(_web_photo_input)
		_web_photo_change_callback = JavaScriptBridge.create_callback(_on_web_photo_changed)
		_web_photo_input.addEventListener("change", _web_photo_change_callback)
	_web_photo_input.value = ""
	_web_photo_input.click()


func _on_web_photo_changed(_args: Array) -> void:
	if _web_photo_input == null or int(_web_photo_input.files.length) <= 0:
		return
	var file = _web_photo_input.files[0]
	_web_pending_name = str(file.name)
	_web_photo_reader = JavaScriptBridge.create_object("FileReader")
	_web_photo_load_callback = JavaScriptBridge.create_callback(_on_web_photo_loaded)
	_web_photo_reader.addEventListener("load", _web_photo_load_callback)
	_web_photo_reader.readAsArrayBuffer(file)


func _on_web_photo_loaded(_args: Array) -> void:
	if _web_photo_reader == null:
		return
	var result = _web_photo_reader.result
	if result == null or not JavaScriptBridge.is_js_buffer(result):
		call_deferred("_show_selection_error", "The browser could not read that photo.")
		return
	var bytes := JavaScriptBridge.js_buffer_to_packed_byte_array(result)
	var filename := _web_pending_name
	_web_photo_reader = null
	_web_photo_load_callback = null
	_web_pending_name = ""
	call_deferred("_prepare_puzzle_me_import", bytes, filename)


func _on_native_photo_selected(
	status: bool,
	selected_paths: PackedStringArray,
	_selected_filter_index: int
) -> void:
	if not status or selected_paths.is_empty():
		return
	var path := str(selected_paths[0])
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		_show_selection_error("Pieceful could not read that photo.")
		return
	var bytes := file.get_buffer(file.get_length())
	file.close()
	_prepare_puzzle_me_import(bytes, path.get_file())


func _prepare_puzzle_me_import(bytes: PackedByteArray, original_name: String) -> void:
	_show_loading_curtain("Preparing your photo…")
	await get_tree().process_frame
	if board == null or not board.has_method("import_local_photo"):
		_dismiss_loading_curtain()
		_show_selection_error("Puzzle Me is not available in this build.")
		return
	var preferred_difficulty := _picker_selected_difficulty_id()
	var metadata = board.import_local_photo(bytes, original_name)
	if not (metadata is Dictionary) or metadata.is_empty():
		var message := "Pieceful could not import that photo."
		if board.has_method("last_photo_import_error"):
			var detail := str(board.last_photo_import_error())
			if not detail.is_empty():
				message = detail
		await get_tree().process_frame
		_dismiss_loading_curtain()
		_show_selection_error(message)
		return

	var content_id := str(metadata.get("id", ""))
	if not gallery_cards.has(content_id):
		_add_content_card(metadata)
	_ensure_my_photos_filter()
	pending_content_id = content_id
	_refresh_picker_difficulties(content_id, preferred_difficulty)
	_refresh_content_card_state()
	_refresh_gallery_cards()
	puzzle_me_import_count += 1
	if puzzle_selection_error != null:
		puzzle_selection_error.visible = false
	if puzzle_me_privacy != null:
		puzzle_me_privacy.text = "Ready · stored privately on this device"
	await get_tree().process_frame
	_dismiss_loading_curtain()


func _ensure_my_photos_filter() -> void:
	if gallery_category_filter == null:
		return
	for index in range(gallery_category_filter.get_item_count()):
		if str(gallery_category_filter.get_item_metadata(index)) == "my_photos":
			return
	gallery_category_filter.add_item("My Photos")
	gallery_category_filter.set_item_metadata(
		gallery_category_filter.get_item_count() - 1,
		"my_photos"
	)
