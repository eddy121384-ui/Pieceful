extends SceneTree

const AnalyticsServiceScript = preload("res://scripts/analytics_service.gd")


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	var service = AnalyticsServiceScript.new()
	root.add_child(service)
	await process_frame

	var official := service.track("puzzle_start", {
		"game_id": "game-analytics-1",
		"content_id": "garden",
		"content_kind": "catalog",
		"category": "nature",
		"difficulty_id": "relaxed",
		"piece_count": 35,
		"orientation": "portrait",
		"layout_mode": "scatter",
		"filename": "must-not-leak.jpg",
		"path": "/private/photo.jpg",
		"query": "my secret search",
	})
	if official.is_empty():
		_fail("supported analytics event was rejected")
		return
	var official_props = official.get("properties", {})
	if not (official_props is Dictionary):
		_fail("analytics event properties are not a Dictionary")
		return
	if str(official_props.get("content_id", "")) != "garden":
		_fail("catalog content id was not retained")
		return
	for forbidden_key in ["filename", "path", "query"]:
		if official_props.has(forbidden_key):
			_fail("free-form/private property leaked: %s" % forbidden_key)
			return

	var private_event := service.track("puzzle_start", {
		"game_id": "game-private-1",
		"content_id": "local_photo:deadbeefcafebabefeedface",
		"content_kind": "puzzle_me",
		"category": "my_photos",
		"difficulty_id": "standard",
		"piece_count": 80,
		"orientation": "portrait",
		"filename": "IMG_1234.JPG",
		"path": "user://puzzle_me/private.png",
		"sha256": "deadbeef",
		"image_bytes": "nope",
	})
	var private_props = private_event.get("properties", {})
	if not (private_props is Dictionary):
		_fail("private analytics properties are not a Dictionary")
		return
	if private_props.has("content_id"):
		_fail("Puzzle Me content id/hash leaked into analytics")
		return
	if str(private_props.get("content_kind", "")) != "puzzle_me":
		_fail("Puzzle Me content kind was not retained safely")
		return
	for forbidden_key in ["filename", "path", "sha256", "image_bytes"]:
		if private_props.has(forbidden_key):
			_fail("Puzzle Me private property leaked: %s" % forbidden_key)
			return

	var first_complete := service.track_once("puzzle_complete", "game-once", {
		"game_id": "game-once",
		"content_id": "garden",
		"content_kind": "catalog",
		"difficulty_id": "relaxed",
		"piece_count": 35,
		"elapsed_seconds": 90,
		"hint_assisted": false,
		"orientation": "landscape",
	})
	var duplicate_complete := service.track_once("puzzle_complete", "game-once", {
		"game_id": "game-once",
		"content_id": "garden",
		"content_kind": "catalog",
	})
	if first_complete.is_empty() or not duplicate_complete.is_empty():
		_fail("analytics completion once-gate failed")
		return

	var rejected := service.track("totally_unknown_event", {"anything": "value"})
	if not rejected.is_empty():
		_fail("unknown analytics event was accepted")
		return

	var snapshot: Dictionary = service.contract_snapshot()
	if bool(snapshot.get("remote_provider_enabled", true)):
		_fail("analytics foundation unexpectedly enabled a remote provider")
		return
	if str(snapshot.get("provider", "")) != "dev_only":
		_fail("analytics provider boundary is not dev-only")
		return
	if int(snapshot.get("rejected_event_count", 0)) < 1:
		_fail("rejected analytics event was not counted")
		return

	service.queue_free()
	await process_frame
	print("PASS analytics_event_contract_smoke")
	quit(0)


func _fail(message: String) -> void:
	push_error("FAIL analytics_event_contract_smoke: %s" % message)
	quit(1)
