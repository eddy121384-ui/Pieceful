extends SceneTree

const MainScene = preload("res://main.tscn")
const RecommendationStoreScript = preload("res://scripts/local_recommendation_store.gd")
const STATE_PATH := "user://pieceful_recommendation_v1.json"
const GALLERY_STATE_PATH := "user://pieceful_gallery_state_v1.json"


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	_clear_state()
	var source := _entry(
		"source",
		"art_culture",
		[["art_culture", 1.0], ["japan", 0.9], ["ink", 0.8]],
		0.72
	)
	var similar := _entry(
		"similar",
		"art_culture",
		[["art_culture", 1.0], ["japan", 0.9], ["ink", 0.8], ["calm", 0.7]],
		0.78
	)
	var unrelated := _entry(
		"unrelated",
		"nature",
		[["nature", 1.0], ["flowers", 1.0], ["colorful", 0.7]],
		0.91
	)
	var architecture := _entry(
		"architecture",
		"places",
		[["places", 1.0], ["architecture", 1.0], ["urban", 0.6]],
		0.83
	)
	var entries: Array = [source, similar, unrelated, architecture]

	var store = RecommendationStoreScript.new()
	store.reset_profile()
	if str(store.recommendation_mode()) != "cold_start":
		_fail("clean recommendation profile did not enter cold-start mode")
		return
	var cold_start: Array = store.rank_for_you(entries, 3)
	if cold_start.size() != 3:
		_fail("cold-start fallback did not return enough choices")
		return
	var cold_categories: Dictionary = {}
	for row_value in cold_start:
		if row_value is Dictionary:
			var row: Dictionary = row_value
			if str(row.get("_recommendation_mode", "")) != "cold_start":
				_fail("cold-start result was not labeled as fallback")
				return
			cold_categories[str(row.get("category", ""))] = true
	if cold_categories.size() < 3:
		_fail("cold-start fallback was dominated by one category")
		return

	if not store.sync_history(entries, ["source"], {"source": 2}):
		_fail("history sync did not create a preference profile")
		return
	if float(store.score(similar)) <= float(store.score(unrelated)):
		_fail("metadata preference did not rank a similar image above an unrelated image")
		return

	var ranked: Array = store.rank_for_you(entries, 3, ["source"])
	if ranked.is_empty() or str((ranked[0] as Dictionary).get("id", "")) != "similar":
		_fail("For You ranking did not put the strongest metadata match first")
		return

	var more_like: Array = store.more_like(source, entries, 3)
	if more_like.is_empty() or str((more_like[0] as Dictionary).get("id", "")) != "similar":
		_fail("More Like This did not rank the closest metadata neighbor first")
		return
	for row_value in more_like:
		if row_value is Dictionary and str((row_value as Dictionary).get("id", "")) == "source":
			_fail("More Like This returned the source image itself")
			return

	if not store.record_start(similar, "hard"):
		_fail("start signal did not persist")
		return
	if str(store.preferred_difficulty()) != "hard":
		_fail("difficulty preference did not learn from a puzzle start")
		return

	var before_replay := float(store.score(similar))
	if not store.record_replay(similar):
		_fail("replay signal did not persist")
		return
	if float(store.score(similar)) <= before_replay:
		_fail("replay did not strengthen matching content preference")
		return
	var after_replay := float(store.score(similar))
	if not store.record_abandon(similar, 0.05):
		_fail("abandon signal did not persist")
		return
	if float(store.score(similar)) >= after_replay:
		_fail("early abandon did not soften matching content preference")
		return
	if not store.record_hint(similar, "hard"):
		_fail("hint signal did not persist")
		return
	if str(store.preferred_difficulty()) != "hard":
		_fail("one hint overcorrected the learned difficulty preference")
		return

	var reloaded = RecommendationStoreScript.new()
	if float(reloaded.score(similar)) <= float(reloaded.score(unrelated)):
		_fail("recommendation profile did not survive reload")
		return
	var snapshot: Dictionary = reloaded.profile_snapshot()
	var event_counts: Dictionary = snapshot.get("event_counts", {})
	for expected_event in ["start", "replay", "abandon", "hint"]:
		if int(event_counts.get(expected_event, 0)) != 1:
			_fail("%s signal count did not persist" % expected_event)
			return

	if not reloaded.reset_profile(entries, ["source"], {"source": 2}):
		_fail("neutral profile reset did not persist")
		return
	if reloaded.has_personalization_signal():
		_fail("profile reset retained personalization weights")
		return
	if reloaded.sync_history(entries, ["source"], {"source": 2}):
		_fail("profile reset immediately relearned historical favorites/completions")
		return

	# Product integration: the current Gallery must expose the local For You
	# filter and return real catalog entries without any network/runtime AI.
	var main = MainScene.instantiate()
	root.add_child(main)
	for _frame in range(16):
		await process_frame
	if main.gallery_status_filter == null:
		_fail("Gallery status filter missing")
		return
	var home_snapshot: Dictionary = main.home_recommendation_snapshot()
	if str(home_snapshot.get("mode", "")) != "cold_start":
		_fail("clean Home did not use cold-start recommendations")
		return
	var home_ids: Array = home_snapshot.get("ids", [])
	if home_ids.size() < 3:
		_fail("Home For You did not expose enough cold-start choices")
		return
	if not bool(home_snapshot.get("reset_exists", false)):
		_fail("Home recommendation reset control is missing")
		return
	var home_pick := str(home_ids[0])
	main.call("_on_home_for_you_pressed", 0)
	if str(main.pending_content_id) != home_pick:
		_fail("Home For You choice did not preselect its artwork")
		return
	main.call("_on_favorite_pressed", home_pick)
	home_snapshot = main.home_recommendation_snapshot()
	if str(home_snapshot.get("mode", "")) != "personalized":
		_fail("Home did not switch to personalized mode after a preference signal")
		return
	main.call("_on_reset_recommendations_pressed")
	home_snapshot = main.home_recommendation_snapshot()
	if str(home_snapshot.get("mode", "")) != "cold_start":
		_fail("Reset taste did not restore cold-start mode")
		return
	main.call("_refresh_gallery_cards")
	home_snapshot = main.home_recommendation_snapshot()
	if str(home_snapshot.get("mode", "")) != "cold_start":
		_fail("historical Gallery state immediately repersonalized after reset")
		return
	if not _option_has_metadata(main.gallery_status_filter, "for_you"):
		_fail("Gallery did not expose the For You filter")
		return
	var product_ranked: Array = main.call("recommendations_for_you", 5)
	if product_ranked.is_empty():
		_fail("product Gallery returned no local recommendations")
		return
	var first_id := str((product_ranked[0] as Dictionary).get("id", ""))
	if first_id.is_empty():
		_fail("product recommendation has no durable content id")
		return
	var product_more_like: Array = main.call("more_like_recommendations", first_id, 4)
	for row_value in product_more_like:
		if row_value is Dictionary and str((row_value as Dictionary).get("id", "")) == first_id:
			_fail("product More Like This returned its source content")
			return

	main.queue_free()
	await process_frame
	reloaded.reset_profile()
	_clear_state()
	print("PASS local_recommendation_smoke")
	quit(0)


func _entry(content_id: String, category: String, tag_rows: Array, puzzleability: float) -> Dictionary:
	var tags: Array = []
	for row_value in tag_rows:
		if row_value is Array and (row_value as Array).size() >= 2:
			var row: Array = row_value
			tags.append({"id": str(row[0]), "weight": float(row[1])})
	return {
		"id": content_id,
		"category": category,
		"tags": tags,
		"puzzleability": {"score": puzzleability},
	}


func _option_has_metadata(button: OptionButton, value: String) -> bool:
	for index in range(button.get_item_count()):
		if str(button.get_item_metadata(index)) == value:
			return true
	return false


func _clear_state() -> void:
	for path in [STATE_PATH, GALLERY_STATE_PATH]:
		if FileAccess.file_exists(path):
			DirAccess.remove_absolute(ProjectSettings.globalize_path(path))


func _fail(message: String) -> void:
	push_error("FAIL local_recommendation_smoke: %s" % message)
	_clear_state()
	quit(1)
