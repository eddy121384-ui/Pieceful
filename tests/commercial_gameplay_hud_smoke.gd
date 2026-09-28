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
	if dock_rect.size.x <= 0.0 or dock_rect.size.x > 460.0:
		_fail("Album dock is not compact: %s" % dock_rect)
		return
	if not bool(snapshot.get("more_visible", false)):
		_fail("More control is missing")
		return
	if str(snapshot.get("difficulty_text", "")).is_empty():
		_fail("Passive difficulty caption is missing")
		return

	for key in ["sort_rect", "layout_rect", "preview_rect", "hint_rect"]:
		var rect: Rect2 = snapshot.get(key, Rect2())
		if rect.size.x < 44.0 or rect.size.y < 44.0:
			_fail("Primary action is below the 44px touch target: %s=%s" % [key, rect])
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
