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

	# Regression from an actual iPhone Safari screenshot. Web/Retina exports can
	# expose a canvas much wider than CSS logical pixels, so portrait behavior
	# must depend on orientation, not a <=700px width assumption.
	main.call("_layout_ui", Vector2(1125.0, 2436.0))
	if str(main.call("gallery_layout_mode")) != "portrait_grid":
		_fail("1125x2436 Retina portrait did not use the two-column Gallery grid")
		return
	if main.gallery_grid == null or int(main.gallery_grid.columns) != 2:
		_fail("Retina portrait Gallery lost its two-column grid")
		return
	if main.gallery_cards["garden"].get_parent() != main.gallery_grid:
		_fail("Retina portrait cards were not reparented into the grid")
		return
	var picture = main.content_buttons.get("garden")
	if not (picture is TextureButton) or picture.mouse_filter != Control.MOUSE_FILTER_PASS:
		_fail("Retina portrait artwork does not forward swipe gestures")
		return

	main.call("_layout_ui", Vector2(2436.0, 1125.0))
	if str(main.call("gallery_layout_mode")) != "wide_rail":
		_fail("landscape Retina canvas did not restore horizontal Gallery rail")
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
