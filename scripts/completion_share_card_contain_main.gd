class_name CompletionShareCardContainMain
extends "res://scripts/completion_share_card_main.gd"

const SHARE_ARTWORK_BOX := Rect2(24.0, 24.0, 888.0, 722.0)


func share_artwork_fit_rect_for_source(source_size: Vector2) -> Rect2:
	return _contain_rect(source_size, SHARE_ARTWORK_BOX)


func _contain_rect(source_size: Vector2, bounds: Rect2) -> Rect2:
	if source_size.x <= 0.0 or source_size.y <= 0.0:
		return bounds
	var scale := minf(bounds.size.x / source_size.x, bounds.size.y / source_size.y)
	var fitted_size := source_size * scale
	var fitted_position := bounds.position + (bounds.size - fitted_size) * 0.5
	return Rect2(fitted_position, fitted_size)


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
	artwork_panel.clip_contents = true
	artwork_panel.add_theme_stylebox_override(
		"panel",
		_chrome_style(Color(1, 1, 1, 0.025), Color(1, 1, 1, 0.08), 24, 0)
	)
	canvas.add_child(artwork_panel)

	# Do not delegate aspect fitting to TextureRect in an offscreen WebGL
	# viewport. Compute a strict contain rectangle ourselves so every source
	# pixel remains visible in the exported PNG, including extreme portrait
	# phone photos and wide landscape artwork.
	var fitted := share_artwork_fit_rect_for_source((artwork as Texture2D).get_size())
	var artwork_rect := TextureRect.new()
	artwork_rect.texture = artwork as Texture2D
	artwork_rect.position = fitted.position
	artwork_rect.size = fitted.size
	artwork_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	artwork_rect.stretch_mode = TextureRect.STRETCH_SCALE
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
