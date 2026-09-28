extends SceneTree

const MainScene = preload("res://main.tscn")


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	var main = MainScene.instantiate()
	root.add_child(main)
	for _frame in range(24):
		await process_frame

	if not main.has_method("commercial_hud_snapshot"):
		_fail("Commercial gameplay HUD adapter is not wired")
		return

	var snapshot: Dictionary = main.commercial_hud_snapshot()
	var top_rect: Rect2 = snapshot.get("top_rect", Rect2())
	var dock_rect: Rect2 = snapshot.get("dock_rect", Rect2())
	if top_rect.size.x <= 0.0 or top_rect.size.x > 650.0:
		_fail("Album header is not compact: %s" % top_rect)
		return
	if dock_rect.size.x < 560.0 or dock_rect.size.x > 640.0:
		_fail("Album dock is not a broad paper card: %s" % dock_rect)
		return
	if dock_rect.size.y > 94.0 or dock_rect.size.y < 88.0:
		_fail("Album dock regained its control-panel thickness: %s" % dock_rect)
		return
	var index_rect: Rect2 = snapshot.get("index_rect", Rect2())
	if index_rect.size.x < 70.0 or index_rect.position.y >= dock_rect.position.y:
		_fail("Dock lost its raised album page index: %s" % index_rect)
		return
	if not bool(snapshot.get("font_bundled", false)):
		_fail("Editorial serif is not embedded for Safari")
		return
	if int(snapshot.get("tab_caption_count", 0)) != 4:
		_fail("Album tab captions are missing")
		return
	if main.status_label.text.contains("pieces"):
		_fail("Album progress reverted to a functional app status string")
		return
	if main.title_label.get_theme_font("font") == null:
		_fail("Pieceful masthead lost its editorial typeface")
		return
	if not bool(snapshot.get("backdrop_exists", false)):
		_fail("Album tabletop background is missing")
		return
	var board_paper: Color = snapshot.get("board_paper", Color.TRANSPARENT)
	if board_paper.a < 0.99 or board_paper.get_luminance() < 0.55:
		_fail("Board still reads as a dark software canvas: %s" % board_paper)
		return
	if not bool(snapshot.get("more_visible", false)):
		_fail("More control is missing")
		return
	if not bool(snapshot.get("more_icon_exists", false)):
		_fail("More reverted to a fragile font glyph")
		return
	if not bool(snapshot.get("mount_exists", false)):
		_fail("Board mounting paper is missing")
		return
	if int(snapshot.get("overflow_row_radius", -1)) != 0:
		_fail("Overflow actions became individual rounded settings rows")
		return
	if int(snapshot.get("overflow_difficulty_count", 0)) == 0:
		_fail("Difficulty disappeared from the paper utility sheet")
		return
	if str(snapshot.get("difficulty_text", "")).is_empty():
		_fail("Passive difficulty caption is missing")
		return

	for key in ["sort_rect", "layout_rect", "preview_rect", "hint_rect"]:
		var rect: Rect2 = snapshot.get(key, Rect2())
		if rect.size.x < 88.0 or rect.size.y < 70.0:
			_fail("Primary paper tab is too small: %s=%s" % [key, rect])
			return
		if rect.position.y < dock_rect.position.y or rect.end.y > dock_rect.end.y:
			_fail("Primary tab escapes the paper dock: %s=%s" % [key, rect])
			return

	# At narrow portrait widths all four tabs still fit inside the dock.
	var metrics = load("res://scripts/app_ui_metrics.gd")
	var phone_size := Vector2(390.0, 844.0)
	var phone_dock: Rect2 = metrics.dock_rect(phone_size)
	var first: Vector2 = metrics.dock_slot_position(phone_size, metrics.SLOT_SORT_X)
	var last: Vector2 = metrics.dock_slot_position(phone_size, metrics.SLOT_HINT_X)
	if first.x < phone_dock.position.x or last.x + metrics.dock_button_width(phone_size) > phone_dock.end.x:
		_fail("Portrait dock tabs overflow the album page")
		return

	for key in [
		"legacy_zoom_visible",
		"legacy_fit_visible",
		"legacy_lines_visible",
		"legacy_reshuffle_visible",
		"games_entry_visible",
		"journal_entry_visible",
	]:
		if bool(snapshot.get(key, true)):
			_fail("Secondary action leaked into persistent HUD: %s" % key)
			return

	main.call("_toggle_album_overflow")
	await process_frame
	if not bool(main.commercial_hud_snapshot().get("overflow_visible", false)):
		_fail("More panel did not open")
		return

	main.queue_free()
	await process_frame
	print("PASS commercial_gameplay_hud_smoke")
	quit(0)


func _fail(message: String) -> void:
	push_error("FAIL commercial_gameplay_hud_smoke: %s" % message)
	quit(1)
