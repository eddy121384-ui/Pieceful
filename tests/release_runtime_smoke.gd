extends SceneTree

const Provider = preload("res://scripts/native_mobile_monetization_provider.gd")


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	if ProjectSettings.get_setting("application/config/version", "").is_empty():
		_fail("missing application version")
		return
	if Provider.ad_configuration_allows_initialization(false, false, "", ""):
		_fail("release export can initialize test advertising")
		return
	if not Provider.ad_configuration_allows_initialization(true, false, "", ""):
		_fail("debug sandbox advertising was disabled")
		return
	if Provider.ad_configuration_allows_initialization(false, true, Provider.ANDROID_TEST_APP_ID, "real-unit"):
		_fail("release export accepts Google's test application ID")
		return
	if Provider.ad_configuration_allows_initialization(false, true, "real-app", ""):
		_fail("unconfigured real advertising can initialize")
		return
	if not Provider.ad_configuration_allows_initialization(false, true, "real-app", "real-unit"):
		_fail("configured production provider was disabled")
		return
	var main = load("res://main.tscn").instantiate()
	root.add_child(main)
	for _frame in range(60):
		await process_frame
	main._warn_if_browser_storage_is_temporary(true)
	if main.product_confirmation_overlay.visible:
		_fail("persistent sessions show a storage warning")
		return
	main._warn_if_browser_storage_is_temporary(false)
	if not main.product_confirmation_overlay.visible or main.product_confirmation_title.text != "Progress will not be kept":
		_fail("temporary sessions do not disclose storage loss")
		return
	main._close_product_confirmation()
	if main.product_confirmation_overlay.visible:
		_fail("storage warning cannot be dismissed")
		return
	main.queue_free()
	await process_frame
	print("PASS release_runtime_smoke")
	quit(0)


func _fail(message: String) -> void:
	push_error("FAIL release_runtime_smoke: " + message)
	quit(1)
