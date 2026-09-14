class_name CompletionShareCardMain
extends "res://scripts/puzzle_journal_main.gd"

const ShareIcons = preload("res://scripts/ui_icon_catalog.gd")
const SHARE_CARD_SIZE := Vector2i(1080, 1350)

var completion_share_button: Button = null
var share_card_png := PackedByteArray()
var share_card_payload: Dictionary = {}
var share_invocation_count := 0
var _share_generation_serial := 0


func _ready() -> void:
	super._ready()
	_install_share_action()


func _on_completed() -> void:
	super._on_completed()
	if save_coordinator == null or not save_coordinator.has_method("latest_completion_record"):
		return
	var record: Dictionary = save_coordinator.latest_completion_record()
	if record.is_empty():
		return
	_begin_share_card_preparation(record)


func share_card_presentation_snapshot() -> Dictionary:
	return {
		"button_exists": completion_share_button != null,
		"button_text": completion_share_button.text if completion_share_button != null else "",
		"button_disabled": completion_share_button.disabled if completion_share_button != null else true,
		"payload": share_card_payload.duplicate(true),
		"png_ready": not share_card_png.is_empty(),
		"share_invocation_count": share_invocation_count,
	}


func _install_share_action() -> void:
	if completion_next_button == null or completion_share_button != null:
		return
	var outer := completion_next_button.get_parent() as VBoxContainer
	if outer == null:
		return

	var next_index := completion_next_button.get_index()
	outer.remove_child(completion_next_button)

	var actions := HBoxContainer.new()
	actions.name = "CompletionActions"
	actions.alignment = BoxContainer.ALIGNMENT_CENTER
	actions.add_theme_constant_override("separation", 12)
	outer.add_child(actions)
	outer.move_child(actions, mini(next_index, outer.get_child_count() - 1))

	completion_share_button = Button.new()
	completion_share_button.name = "CompletionShareResult"
	ShareIcons.apply_button(
		completion_share_button,
		ShareIcons.IconId.SEND,
		"Share your completed puzzle",
		Vector2(176.0, 42.0),
		18
	)
	completion_share_button.text = "Share result"
	completion_share_button.icon_alignment = HORIZONTAL_ALIGNMENT_LEFT
	completion_share_button.alignment = HORIZONTAL_ALIGNMENT_CENTER
	completion_share_button.disabled = true
	completion_share_button.pressed.connect(_on_share_result_pressed)
	actions.add_child(completion_share_button)

	completion_next_button.custom_minimum_size = Vector2(190.0, 42.0)
	actions.add_child(completion_next_button)


func _begin_share_card_preparation(record: Dictionary) -> void:
	share_card_png = PackedByteArray()
	share_card_payload = _share_card_payload_for_record(record)
	_share_generation_serial += 1
	var serial := _share_generation_serial
	if completion_share_button != null:
		completion_share_button.disabled = true
		completion_share_button.text = "Preparing…"

	# Headless CI validates the contract/UI without depending on a rendering
	# backend. Web/native builds pre-render the PNG so the later button press can
	# call the browser share sheet while the user activation is still live.
	if DisplayServer.get_name() == "headless":
		if completion_share_button != null:
			completion_share_button.text = "Share result"
		return
	call_deferred("_prepare_share_card_png", record.duplicate(true), serial)


func _prepare_share_card_png(record: Dictionary, serial: int) -> void:
	var bytes: PackedByteArray = await _render_share_card_png(record)
	if serial != _share_generation_serial:
		return
	share_card_png = bytes
	if completion_share_button != null:
		completion_share_button.text = "Share result"
		completion_share_button.disabled = share_card_png.is_empty()
		completion_share_button.tooltip_text = (
			"Share your completed puzzle"
			if not share_card_png.is_empty()
			else "Share card could not be prepared"
		)


func _share_card_payload_for_record(record: Dictionary) -> Dictionary:
	var content_id := str(record.get("content_id", ""))
	var artwork_label := content_id.capitalize()
	if board != null and board.has_method("content_label_for_id"):
		artwork_label = str(board.content_label_for_id(content_id))
	elif board != null and board.has_method("active_content_label"):
		artwork_label = str(board.active_content_label())

	var pieces := int(record.get("pieces_placed", record.get("piece_count", 0)))
	var elapsed := int(record.get("elapsed_seconds", 0))
	var duration := _format_duration(elapsed)
	var difficulty := str(record.get("difficulty_id", "puzzle")).capitalize()
	var date := _local_completion_date(int(record.get("completed_at_unix", 0)))
	var hint_copy := "Hint-free" if int(record.get("hints_used", 0)) == 0 else "Hint used"
	var filename_date := date.replace(".", "-")
	if filename_date == "Completed":
		filename_date = "puzzle"
	return {
		"title": "Puzzle complete",
		"artwork_label": artwork_label,
		"primary": "%d pieces · %s · %s" % [pieces, duration, difficulty],
		"secondary": "%s · %s" % [date, hint_copy],
		"share_text": "%d-piece puzzle · %s · %s" % [pieces, duration, difficulty],
		"filename": "pieceful-%s.png" % filename_date,
		"explicit_only": true,
	}


func _render_share_card_png(record: Dictionary) -> PackedByteArray:
	if board == null or not board.has_method("active_puzzle_texture"):
		return PackedByteArray()
	var artwork = board.active_puzzle_texture()
	if not (artwork is Texture2D):
		return PackedByteArray()

	var payload := _share_card_payload_for_record(record)
	var viewport := SubViewport.new()
	viewport.name = "CompletionShareCardViewport"
	viewport.size = SHARE_CARD_SIZE
	viewport.disable_3d = true
	viewport.transparent_bg = false
	viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	add_child(viewport)

	var canvas := Control.new()
	canvas.name = "ShareCardCanvas"
	canvas.position = Vector2.ZERO
	canvas.size = Vector2(SHARE_CARD_SIZE)
	viewport.add_child(canvas)

	var background := ColorRect.new()
	background.color = Color("111419")
	background.position = Vector2.ZERO
	background.size = Vector2(SHARE_CARD_SIZE)
	background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	canvas.add_child(background)

	var heading := _share_label(str(payload.get("title", "Puzzle complete")), 52, Color(1, 1, 1, 0.94))
	heading.position = Vector2(72, 54)
	heading.size = Vector2(936, 68)
	canvas.add_child(heading)

	var artwork_panel := Panel.new()
	artwork_panel.position = Vector2(72, 146)
	artwork_panel.size = Vector2(936, 770)
	artwork_panel.add_theme_stylebox_override(
		"panel",
		_chrome_style(Color(1, 1, 1, 0.025), Color(1, 1, 1, 0.08), 24, 0)
	)
	canvas.add_child(artwork_panel)

	var artwork_rect := TextureRect.new()
	artwork_rect.texture = artwork as Texture2D
	artwork_rect.position = Vector2(24, 24)
	artwork_rect.size = Vector2(888, 722)
	artwork_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	artwork_rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	artwork_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	artwork_panel.add_child(artwork_rect)

	var artwork_label := _share_label(str(payload.get("artwork_label", "Puzzle")), 38, Color(1, 1, 1, 0.94))
	artwork_label.position = Vector2(72, 950)
	artwork_label.size = Vector2(936, 52)
	canvas.add_child(artwork_label)

	var primary := _share_label(str(payload.get("primary", "")), 30, Color(1, 1, 1, 0.82))
	primary.position = Vector2(72, 1018)
	primary.size = Vector2(936, 46)
	canvas.add_child(primary)

	var secondary := _share_label(str(payload.get("secondary", "")), 25, Color(1, 1, 1, 0.58))
	secondary.position = Vector2(72, 1072)
	secondary.size = Vector2(936, 40)
	canvas.add_child(secondary)

	var quiet_copy := _share_label("A quiet moment, finished.", 27, Color(1, 1, 1, 0.56))
	quiet_copy.position = Vector2(72, 1160)
	quiet_copy.size = Vector2(936, 44)
	canvas.add_child(quiet_copy)

	var signature := _share_label("Pieceful", 21, Color(1, 1, 1, 0.34))
	signature.position = Vector2(72, 1266)
	signature.size = Vector2(936, 32)
	canvas.add_child(signature)

	await get_tree().process_frame
	await get_tree().process_frame
	await RenderingServer.frame_post_draw
	var image := viewport.get_texture().get_image()
	viewport.render_target_update_mode = SubViewport.UPDATE_DISABLED
	viewport.queue_free()
	if image == null or image.is_empty():
		return PackedByteArray()
	return image.save_png_to_buffer()


func _share_label(text_value: String, font_size: int, color: Color) -> Label:
	var label := Label.new()
	label.text = text_value
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", font_size)
	label.modulate = color
	label.clip_text = true
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return label


func _on_share_result_pressed() -> void:
	if share_card_png.is_empty() or share_card_payload.is_empty():
		return
	share_invocation_count += 1
	if OS.has_feature("web"):
		_share_png_on_web()
		return
	var path := "user://%s" % str(share_card_payload.get("filename", "pieceful-result.png"))
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file != null:
		file.store_buffer(share_card_png)
		file.close()


func _share_png_on_web() -> void:
	var base64_png := Marshalls.raw_to_base64(share_card_png)
	var filename := str(share_card_payload.get("filename", "pieceful-result.png"))
	var share_text := str(share_card_payload.get("share_text", "Puzzle complete"))
	var js := """
(() => {
  const b64 = %s;
  const filename = %s;
  const shareText = %s;
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const file = new File([bytes], filename, { type: 'image/png' });
  const fallback = () => {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const data = { files: [file], title: 'Puzzle complete', text: shareText };
  try {
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      navigator.share(data).catch((error) => {
        if (!error || error.name !== 'AbortError') fallback();
      });
    } else {
      fallback();
    }
  } catch (_) {
    fallback();
  }
})();
""" % [JSON.stringify(base64_png), JSON.stringify(filename), JSON.stringify(share_text)]
	JavaScriptBridge.eval(js, true)
