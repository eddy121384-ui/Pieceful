extends SceneTree

const MainScene = preload("res://main.tscn")


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	var main = MainScene.instantiate()
	root.add_child(main)
	for _frame in range(12):
		await process_frame

	if not main.has_method("timelapse_export_contract_snapshot"):
		_fail("9:16 timelapse export main is not wired")
		return

	var snapshot: Dictionary = main.timelapse_export_contract_snapshot()
	if int(snapshot.get("target_width", 0)) != 1080 or int(snapshot.get("target_height", 0)) != 1920:
		_fail("timelapse export target is not 1080x1920")
		return
	if int(snapshot.get("fps", 0)) != 30:
		_fail("timelapse export frame rate contract changed")
		return
	if not bool(snapshot.get("export_button_exists", false)):
		_fail("Export 9:16 action is missing")
		return
	if not bool(snapshot.get("share_button_exists", false)):
		_fail("explicit Share video action is missing")
		return
	if not bool(snapshot.get("explicit_only", false)) or not bool(snapshot.get("local_only", false)):
		_fail("video export lost explicit/local-only privacy contract")
		return

	var capture_rect_value = snapshot.get("capture_rect", Rect2())
	if not (capture_rect_value is Rect2):
		_fail("portrait capture rectangle is missing")
		return
	var capture_rect: Rect2 = capture_rect_value
	if capture_rect.size.x <= 0.0 or capture_rect.size.y <= 0.0:
		_fail("portrait capture rectangle is empty")
		return
	var expected_aspect := 9.0 / 16.0
	var actual_aspect := capture_rect.size.x / capture_rect.size.y
	if absf(actual_aspect - expected_aspect) > 0.0001:
		_fail("portrait capture rectangle is not 9:16")
		return
	if capture_rect.position.x < 0.0 or capture_rect.position.y < 0.0:
		_fail("portrait capture rectangle escaped the logical viewport")
		return
	if capture_rect.end.x > 1280.001 or capture_rect.end.y > 720.001:
		_fail("portrait capture rectangle exceeds the logical viewport")
		return

	var alternate: Rect2 = main.timelapse_portrait_capture_rect(Vector2(720.0, 1280.0))
	if absf((alternate.size.x / alternate.size.y) - expected_aspect) > 0.0001:
		_fail("portrait capture sizing is not viewport-independent")
		return
	if alternate.size.x > 720.001 or alternate.size.y > 1280.001:
		_fail("portrait capture does not contain within a portrait viewport")
		return

	main.queue_free()
	await process_frame
	print("PASS timelapse_video_export_smoke")
	quit(0)


func _fail(message: String) -> void:
	push_error("FAIL timelapse_video_export_smoke: %s" % message)
	quit(1)
