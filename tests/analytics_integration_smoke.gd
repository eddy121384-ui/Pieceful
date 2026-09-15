extends SceneTree

const MainScene = preload("res://main.tscn")


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	var main = MainScene.instantiate()
	root.add_child(main)
	for _frame in range(12):
		await process_frame

	var analytics = main.get_node_or_null("Analytics")
	if analytics == null:
		_fail("Analytics service is not wired into main.tscn")
		return
	if not main.has_method("analytics_contract_snapshot"):
		_fail("AnalyticsMain wrapper is not active")
		return

	var contract: Dictionary = main.analytics_contract_snapshot()
	if int(contract.get("schema_version", 0)) != 1:
		_fail("Analytics schema version is not V1")
		return
	if bool(contract.get("remote_provider_enabled", true)):
		_fail("Remote analytics must remain disabled in foundation slice")
		return

	var events: Array = main.analytics_events_snapshot()
	var saw_app_open := false
	for event_value in events:
		if event_value is Dictionary and str(event_value.get("name", "")) == "app_open":
			saw_app_open = true
			break
	if not saw_app_open:
		_fail("app_open was not emitted through the analytics service")
		return

	var private_props: Dictionary = main.call("_analytics_content_properties", "local_photo:test-private")
	if str(private_props.get("content_kind", "")) != "puzzle_me":
		_fail("AnalyticsMain did not classify Puzzle Me content as private")
		return
	if private_props.has("content_id"):
		_fail("AnalyticsMain exposed private Puzzle Me content id")
		return

	main.queue_free()
	await process_frame
	print("PASS analytics_integration_smoke")
	quit(0)


func _fail(message: String) -> void:
	push_error("FAIL analytics_integration_smoke: %s" % message)
	quit(1)
