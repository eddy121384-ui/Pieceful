extends SceneTree

const MainScene = preload("res://main.tscn")
const SAVE_DIR := "user://saves"
const LEGACY_SAVE := "user://pieceful_autosave_v1.json"
const GALLERY_STATE := "user://pieceful_gallery_state_v1.json"


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	_clear_test_state()
	var main = MainScene.instantiate()
	root.add_child(main)
	for _frame in range(16):
		await process_frame

	# Real iPhone/Safari regression: Pieceful intentionally renders through a
	# fixed 1280x720 logical Godot viewport while the browser is visibly portrait.
	# The browser orientation, not the Godot logical viewport, must select the
	# two-column vertical Gallery.
	main.call(
		"_apply_gallery_layout_for_orientation",
		Vector2(1280.0, 720.0),
		Vector2(390.0, 844.0)
	)
	if str(main.call("gallery_layout_mode")) != "portrait_grid":
		_fail("portrait Safari with a 1280x720 Godot viewport did not use the two-column Gallery grid")
		return
	if main.gallery_grid == null or int(main.gallery_grid.columns) != 2:
		_fail("portrait Safari Gallery lost its two-column grid")
		return
	if main.gallery_cards["garden"].get_parent() != main.gallery_grid:
		_fail("portrait Safari cards were not reparented into the grid")
		return
	if main.gallery_scroll.horizontal_scroll_mode != ScrollContainer.SCROLL_MODE_DISABLED:
		_fail("portrait Safari Gallery still allows horizontal scrolling")
		return
	if main.gallery_scroll.vertical_scroll_mode != ScrollContainer.SCROLL_MODE_SHOW_NEVER:
		_fail("portrait Safari Gallery did not enable hidden-scrollbar vertical swiping")
		return
	var picture = main.content_buttons.get("garden")
	if not (picture is TextureButton) or picture.mouse_filter != Control.MOUSE_FILTER_PASS:
		_fail("portrait Safari artwork does not forward swipe gestures")
		return

	# Retina-sized browser dimensions must produce the same product mode.
	main.call(
		"_apply_gallery_layout_for_orientation",
		Vector2(1280.0, 720.0),
		Vector2(1125.0, 2436.0)
	)
	if str(main.call("gallery_layout_mode")) != "portrait_grid":
		_fail("1125x2436 Retina browser viewport did not keep the portrait Gallery grid")
		return

	# Rotate the browser while the internal Godot viewport remains unchanged.
	main.call(
		"_apply_gallery_layout_for_orientation",
		Vector2(1280.0, 720.0),
		Vector2(844.0, 390.0)
	)
	if str(main.call("gallery_layout_mode")) != "wide_rail":
		_fail("landscape Safari did not restore the horizontal Gallery rail")
		return
	if main.gallery_cards["garden"].get_parent() != main.puzzle_selection_cards:
		_fail("landscape Safari cards did not return to the horizontal rail")
		return

	main.queue_free()
	await process_frame
	_clear_test_state()
	print("PASS gallery_retina_portrait_smoke")
	quit(0)


func _clear_test_state() -> void:
	for path in [LEGACY_SAVE, GALLERY_STATE]:
		if FileAccess.file_exists(path):
			DirAccess.remove_absolute(ProjectSettings.globalize_path(path))
	var dir := DirAccess.open(SAVE_DIR)
	if dir != null:
		for filename in dir.get_files():
			DirAccess.remove_absolute(ProjectSettings.globalize_path(SAVE_DIR.path_join(filename)))


func _fail(message: String) -> void:
	push_error("FAIL gallery_retina_portrait_smoke: %s" % message)
	quit(1)
