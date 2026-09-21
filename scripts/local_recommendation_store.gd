class_name LocalRecommendationStore
extends RefCounted

const STATE_VERSION := 1
const STATE_PATH := "user://pieceful_recommendation_v1.json"
const FAVORITE_WEIGHT := 3.0
const COMPLETION_WEIGHT := 2.0
const START_WEIGHT := 0.65
const REPLAY_WEIGHT := 0.9
const EARLY_ABANDON_WEIGHT := -0.55
const LATE_ABANDON_WEIGHT := -0.25
const HINT_DIFFICULTY_WEIGHT := -0.15
const CATEGORY_WEIGHT := 0.65
const DIVERSITY_PENALTY := 0.35

var state: Dictionary = _blank_state()


func _init() -> void:
	_load()


func sync_history(entries: Array, favorite_ids: Array, completion_counts: Dictionary) -> bool:
	var changed := false
	for entry_value in entries:
		if not (entry_value is Dictionary):
			continue
		var entry: Dictionary = entry_value
		var content_id := str(entry.get("id", ""))
		if content_id.is_empty():
			continue

		var favorite_state: Dictionary = state.get("favorite_state", {})
		var previous_favorite := bool(favorite_state.get(content_id, false))
		var current_favorite := favorite_ids.has(content_id)
		if previous_favorite != current_favorite:
			_apply_metadata_weight(entry, FAVORITE_WEIGHT if current_favorite else -FAVORITE_WEIGHT)
			favorite_state[content_id] = current_favorite
			state["favorite_state"] = favorite_state
			changed = true

		var recorded_counts: Dictionary = state.get("completion_counts", {})
		var previous_count := int(recorded_counts.get(content_id, 0))
		var current_count := maxi(0, int(completion_counts.get(content_id, 0)))
		if previous_count != current_count:
			_apply_metadata_weight(entry, float(current_count - previous_count) * COMPLETION_WEIGHT)
			recorded_counts[content_id] = current_count
			state["completion_counts"] = recorded_counts
			changed = true

	if changed:
		_save()
	return changed


func record_start(metadata: Dictionary, difficulty_id: String) -> bool:
	if metadata.is_empty():
		return false
	_apply_metadata_weight(metadata, START_WEIGHT)
	_bump_content_affinity(str(metadata.get("id", "")), START_WEIGHT)
	if not difficulty_id.is_empty():
		_bump_dictionary_weight("difficulty_weights", difficulty_id, 0.25)
	_bump_event_count("start")
	return _save()


func record_replay(metadata: Dictionary) -> bool:
	if metadata.is_empty():
		return false
	_apply_metadata_weight(metadata, REPLAY_WEIGHT)
	_bump_event_count("replay")
	return _save()


func record_abandon(metadata: Dictionary, progress: float = 0.0) -> bool:
	if metadata.is_empty():
		return false
	var normalized_progress := clampf(progress, 0.0, 1.0)
	var delta := EARLY_ABANDON_WEIGHT if normalized_progress < 0.25 else LATE_ABANDON_WEIGHT
	_apply_metadata_weight(metadata, delta)
	_bump_event_count("abandon")
	return _save()


func record_hint(metadata: Dictionary, difficulty_id: String) -> bool:
	if metadata.is_empty():
		return false
	# A hint is primarily a difficulty signal, not evidence that the player
	# dislikes the artwork. Keep content affinity neutral and only soften the
	# currently selected difficulty preference.
	if not difficulty_id.is_empty():
		_bump_dictionary_weight("difficulty_weights", difficulty_id, HINT_DIFFICULTY_WEIGHT)
	_bump_event_count("hint")
	return _save()


func rank_for_you(entries: Array, limit: int = 12, excluded_ids: Array = []) -> Array:
	var remaining: Array = []
	for entry_value in entries:
		if not (entry_value is Dictionary):
			continue
		var entry: Dictionary = (entry_value as Dictionary).duplicate(true)
		var content_id := str(entry.get("id", ""))
		if content_id.is_empty() or excluded_ids.has(content_id):
			continue
		remaining.append({
			"entry": entry,
			"score": score(entry),
			"id": content_id,
			"category": str(entry.get("category", "")),
		})

	var selected: Array = []
	var category_counts: Dictionary = {}
	while not remaining.is_empty() and selected.size() < maxi(0, limit):
		var best_index := 0
		var best_adjusted := -INF
		var best_id := ""
		for index in range(remaining.size()):
			var row: Dictionary = remaining[index]
			var category := str(row.get("category", ""))
			var adjusted := float(row.get("score", 0.0)) - (
				float(category_counts.get(category, 0)) * DIVERSITY_PENALTY
			)
			var row_id := str(row.get("id", ""))
			if adjusted > best_adjusted or (
				is_equal_approx(adjusted, best_adjusted)
				and (best_id.is_empty() or row_id < best_id)
			):
				best_index = index
				best_adjusted = adjusted
				best_id = row_id
		var chosen: Dictionary = remaining[best_index]
		remaining.remove_at(best_index)
		var chosen_entry: Dictionary = (chosen.get("entry", {}) as Dictionary).duplicate(true)
		chosen_entry["_recommendation_score"] = float(chosen.get("score", 0.0))
		selected.append(chosen_entry)
		var chosen_category := str(chosen.get("category", ""))
		category_counts[chosen_category] = int(category_counts.get(chosen_category, 0)) + 1
	return selected


func more_like(source: Dictionary, entries: Array, limit: int = 6) -> Array:
	if source.is_empty():
		return []
	var source_id := str(source.get("id", ""))
	var rows: Array = []
	for entry_value in entries:
		if not (entry_value is Dictionary):
			continue
		var entry: Dictionary = entry_value
		var content_id := str(entry.get("id", ""))
		if content_id.is_empty() or content_id == source_id:
			continue
		rows.append({
			"entry": entry.duplicate(true),
			"score": _similarity(source, entry),
			"id": content_id,
		})
	rows.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		var a_score := float(a.get("score", 0.0))
		var b_score := float(b.get("score", 0.0))
		if not is_equal_approx(a_score, b_score):
			return a_score > b_score
		return str(a.get("id", "")) < str(b.get("id", ""))
	)
	var result: Array = []
	for row_value in rows:
		if result.size() >= maxi(0, limit):
			break
		var row: Dictionary = row_value
		var entry: Dictionary = (row.get("entry", {}) as Dictionary).duplicate(true)
		entry["_similarity_score"] = float(row.get("score", 0.0))
		result.append(entry)
	return result


func score(metadata: Dictionary) -> float:
	if metadata.is_empty():
		return 0.0
	var preference_weights: Dictionary = state.get("preference_weights", {})
	var result := 0.0
	var category := str(metadata.get("category", ""))
	if not category.is_empty():
		result += float(preference_weights.get("category:%s" % category, 0.0)) * CATEGORY_WEIGHT

	var tags = metadata.get("tags", [])
	if tags is Array:
		for tag_value in tags:
			if not (tag_value is Dictionary):
				continue
			var tag: Dictionary = tag_value
			var tag_id := str(tag.get("id", ""))
			if tag_id.is_empty():
				continue
			var tag_weight := clampf(float(tag.get("weight", 1.0)), 0.0, 1.0)
			result += float(preference_weights.get("tag:%s" % tag_id, 0.0)) * tag_weight

	var content_id := str(metadata.get("id", ""))
	var affinity: Dictionary = state.get("content_affinity", {})
	result += float(affinity.get(content_id, 0.0)) * 0.12

	var puzzleability = metadata.get("puzzleability", {})
	if puzzleability is Dictionary:
		result += clampf(float((puzzleability as Dictionary).get("score", 0.0)), 0.0, 1.0) * 0.08
	return result


func preferred_difficulty() -> String:
	var weights: Dictionary = state.get("difficulty_weights", {})
	var best_id := ""
	var best_weight := -INF
	for difficulty_id_value in weights.keys():
		var difficulty_id := str(difficulty_id_value)
		var value := float(weights.get(difficulty_id, 0.0))
		if value > best_weight or (
			is_equal_approx(value, best_weight)
			and (best_id.is_empty() or difficulty_id < best_id)
		):
			best_id = difficulty_id
			best_weight = value
	return best_id


func profile_snapshot() -> Dictionary:
	return state.duplicate(true)


func reset_profile() -> bool:
	state = _blank_state()
	return _save()


func _apply_metadata_weight(metadata: Dictionary, delta: float) -> void:
	var category := str(metadata.get("category", ""))
	if not category.is_empty():
		_bump_dictionary_weight("preference_weights", "category:%s" % category, delta)

	var tags = metadata.get("tags", [])
	if tags is Array:
		for tag_value in tags:
			if not (tag_value is Dictionary):
				continue
			var tag: Dictionary = tag_value
			var tag_id := str(tag.get("id", ""))
			if tag_id.is_empty():
				continue
			var tag_weight := clampf(float(tag.get("weight", 1.0)), 0.0, 1.0)
			_bump_dictionary_weight("preference_weights", "tag:%s" % tag_id, delta * tag_weight)

	_bump_content_affinity(str(metadata.get("id", "")), delta)


func _bump_content_affinity(content_id: String, delta: float) -> void:
	if content_id.is_empty():
		return
	_bump_dictionary_weight("content_affinity", content_id, delta)


func _bump_dictionary_weight(bucket_name: String, key: String, delta: float) -> void:
	var bucket: Dictionary = state.get(bucket_name, {})
	bucket[key] = clampf(float(bucket.get(key, 0.0)) + delta, -20.0, 40.0)
	state[bucket_name] = bucket


func _bump_event_count(event_name: String) -> void:
	var counts: Dictionary = state.get("event_counts", {})
	counts[event_name] = int(counts.get(event_name, 0)) + 1
	state["event_counts"] = counts


func _similarity(a: Dictionary, b: Dictionary) -> float:
	var result := 0.0
	if str(a.get("category", "")) == str(b.get("category", "")):
		result += 0.9

	var a_tags := _tag_map(a)
	var b_tags := _tag_map(b)
	for tag_id_value in a_tags.keys():
		var tag_id := str(tag_id_value)
		if b_tags.has(tag_id):
			result += minf(float(a_tags[tag_id]), float(b_tags[tag_id]))

	var a_puzzle = a.get("puzzleability", {})
	var b_puzzle = b.get("puzzleability", {})
	if a_puzzle is Dictionary and b_puzzle is Dictionary:
		var a_score := clampf(float((a_puzzle as Dictionary).get("score", 0.0)), 0.0, 1.0)
		var b_score := clampf(float((b_puzzle as Dictionary).get("score", 0.0)), 0.0, 1.0)
		result += (1.0 - absf(a_score - b_score)) * 0.15
	return result


func _tag_map(metadata: Dictionary) -> Dictionary:
	var result: Dictionary = {}
	var tags = metadata.get("tags", [])
	if tags is Array:
		for tag_value in tags:
			if tag_value is Dictionary:
				var tag_id := str((tag_value as Dictionary).get("id", ""))
				if not tag_id.is_empty():
					result[tag_id] = clampf(
						float((tag_value as Dictionary).get("weight", 1.0)),
						0.0,
						1.0
					)
	return result


func _blank_state() -> Dictionary:
	return {
		"state_version": STATE_VERSION,
		"preference_weights": {},
		"content_affinity": {},
		"difficulty_weights": {},
		"favorite_state": {},
		"completion_counts": {},
		"event_counts": {},
	}


func _load() -> void:
	state = _blank_state()
	if not FileAccess.file_exists(STATE_PATH):
		return
	var file := FileAccess.open(STATE_PATH, FileAccess.READ)
	if file == null:
		return
	var parsed = JSON.parse_string(file.get_as_text())
	file.close()
	if not (parsed is Dictionary):
		return
	if int(parsed.get("state_version", -1)) != STATE_VERSION:
		return
	for required in [
		"preference_weights",
		"content_affinity",
		"difficulty_weights",
		"favorite_state",
		"completion_counts",
		"event_counts",
	]:
		if not (parsed.get(required, null) is Dictionary):
			return
	state = parsed


func _save() -> bool:
	state["state_version"] = STATE_VERSION
	var file := FileAccess.open(STATE_PATH, FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(JSON.stringify(state, "  "))
	file.flush()
	file.close()
	return true
