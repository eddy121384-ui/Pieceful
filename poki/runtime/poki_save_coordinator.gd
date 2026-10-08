extends "res://scripts/analytics_save_coordinator.gd"


func _content_available_for_slot(game_id: String) -> bool:
	var snapshot: Dictionary = _read_json_dictionary(_slot_path(game_id))
	var puzzle: Dictionary = snapshot.get("puzzle", {})
	var identity: Dictionary = puzzle.get("content_identity", {})
	# A removed pack is availability, not corruption. Malformed identities still
	# take the accepted validation/recovery path, rather than being concealed.
	if not _content_identity_structurally_valid(identity):
		return true
	for row: Dictionary in board.content_presets():
		if str(row["source_id"]) == str(identity.get("source_id", "")):
			return ResourceLoader.exists(str(row["path"]))
	return false


func _candidate_game_ids() -> Array:
	var available: Array = []
	for game_id in super._candidate_game_ids():
		if _content_available_for_slot(str(game_id)):
			available.append(game_id)
	return available


func _resume_game_from_disk(game_id: String) -> bool:
	if not _content_available_for_slot(game_id):
		last_resume_error = "This picture is unavailable in this edition. Its saved progress is kept."
		return false
	return await super._resume_game_from_disk(game_id)
