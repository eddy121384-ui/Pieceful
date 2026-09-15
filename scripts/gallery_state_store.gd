class_name GalleryStateStore
extends RefCounted

const STATE_VERSION := 1
const STATE_PATH := "user://pieceful_gallery_state_v1.json"

var state: Dictionary = _blank_state()


func _init() -> void:
	_load()


func is_favorite(content_id: String) -> bool:
	var favorites = state.get("favorites", [])
	return favorites is Array and favorites.has(content_id)


func set_favorite(content_id: String, favorite: bool) -> bool:
	if content_id.is_empty():
		return false
	var favorites: Array = []
	var raw = state.get("favorites", [])
	if raw is Array:
		for value in raw:
			var existing := str(value)
			if not existing.is_empty() and not favorites.has(existing):
				favorites.append(existing)

	if favorite and not favorites.has(content_id):
		favorites.append(content_id)
	elif not favorite:
		favorites.erase(content_id)
	favorites.sort()
	state["favorites"] = favorites
	return _save()


func toggle_favorite(content_id: String) -> bool:
	return set_favorite(content_id, not is_favorite(content_id))


func mark_completed(content_id: String, difficulty_id: String, game_id: String = "") -> bool:
	if content_id.is_empty():
		return false
	var completed = state.get("completed", {})
	if not (completed is Dictionary):
		completed = {}
	var entry = completed.get(content_id, {})
	if not (entry is Dictionary):
		entry = {}

	var game_ids: Array = []
	var raw_game_ids = entry.get("game_ids", [])
	if raw_game_ids is Array:
		for value in raw_game_ids:
			var existing_game_id := str(value)
			if not existing_game_id.is_empty() and not game_ids.has(existing_game_id):
				game_ids.append(existing_game_id)
	if not game_id.is_empty() and game_ids.has(game_id):
		# Journal replays/retries may ask Gallery to reflect the same durable fact.
		# Treat that as idempotent success instead of incrementing Completed · N×.
		return true

	var difficulties: Array = []
	var raw_difficulties = entry.get("difficulties", [])
	if raw_difficulties is Array:
		for value in raw_difficulties:
			var existing := str(value)
			if not existing.is_empty() and not difficulties.has(existing):
				difficulties.append(existing)
	if not difficulty_id.is_empty() and not difficulties.has(difficulty_id):
		difficulties.append(difficulty_id)
	difficulties.sort()
	if not game_id.is_empty():
		game_ids.append(game_id)
		game_ids.sort()
	entry["count"] = int(entry.get("count", 0)) + 1
	entry["last_completed_unix"] = int(Time.get_unix_time_from_system())
	entry["difficulties"] = difficulties
	entry["game_ids"] = game_ids
	completed[content_id] = entry
	state["completed"] = completed
	return _save()


func is_completed(content_id: String) -> bool:
	var completed = state.get("completed", {})
	return completed is Dictionary and completed.has(content_id)


func completion_for(content_id: String) -> Dictionary:
	var completed = state.get("completed", {})
	if completed is Dictionary:
		var entry = completed.get(content_id, {})
		if entry is Dictionary:
			return entry.duplicate(true)
	return {}


func favorites() -> Array:
	var result: Array = []
	var raw = state.get("favorites", [])
	if raw is Array:
		for value in raw:
			result.append(str(value))
	return result


func _blank_state() -> Dictionary:
	return {
		"state_version": STATE_VERSION,
		"favorites": [],
		"completed": {},
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
	var favorites = parsed.get("favorites", [])
	var completed = parsed.get("completed", {})
	if not (favorites is Array) or not (completed is Dictionary):
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
