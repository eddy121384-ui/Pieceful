class_name DurableContentSaveCoordinator
extends "res://scripts/robust_multi_slot_save_coordinator.gd"


func _capture_snapshot() -> Dictionary:
	var snapshot: Dictionary = super._capture_snapshot()
	var puzzle = snapshot.get("puzzle", {})
	if puzzle is Dictionary:
		puzzle["content_identity"] = _current_content_identity()
		snapshot["puzzle"] = puzzle
	return snapshot


func _write_stable_snapshot(stable_snapshot: Dictionary, force_write: bool) -> bool:
	var puzzle = stable_snapshot.get("puzzle", {})
	if not (puzzle is Dictionary):
		last_save_error = "Puzzle metadata missing content identity"
		return false
	var identity = puzzle.get("content_identity", {})
	if not _content_identity_structurally_valid(identity):
		last_save_error = "Current puzzle content identity is unavailable"
		return false
	return super._write_stable_snapshot(stable_snapshot, force_write)


func _metadata_from_snapshot(
	game_id: String,
	snapshot: Dictionary,
	last_played_unix: int
) -> Dictionary:
	var metadata: Dictionary = super._metadata_from_snapshot(
		game_id,
		snapshot,
		last_played_unix
	)
	var puzzle = snapshot.get("puzzle", {})
	var identity = puzzle.get("content_identity", {}) if puzzle is Dictionary else {}
	if identity is Dictionary:
		metadata["content_key"] = str(identity.get("content_key", ""))
		metadata["content_source_kind"] = str(identity.get("source_kind", ""))
		metadata["content_source_id"] = str(identity.get("source_id", ""))
		metadata["content_sha256"] = str(identity.get("sha256", ""))
	return metadata


func _slot_snapshot_is_supported(snapshot) -> bool:
	if not super._slot_snapshot_is_supported(snapshot):
		return false
	var puzzle = snapshot.get("puzzle", {})
	if not (puzzle is Dictionary):
		return false
	if not puzzle.has("content_identity"):
		# Every save produced before #3-E used the one built-in demo artwork. Keep
		# that historical format readable once so it can be upgraded in place after
		# a successful resume. New saves are never allowed to omit this field.
		return true
	return _content_identity_structurally_valid(puzzle.get("content_identity", {}))


func _resume_game_from_disk(game_id: String) -> bool:
	var path := _slot_path(game_id)
	var snapshot = _read_json_dictionary(path)
	if not _slot_snapshot_is_supported(snapshot):
		return await super._resume_game_from_disk(game_id)

	var puzzle: Dictionary = snapshot.get("puzzle", {})
	var legacy_without_identity := not puzzle.has("content_identity")
	if not legacy_without_identity:
		var identity = puzzle.get("content_identity", {})
		if not _content_identity_matches_current(identity):
			last_resume_error = "Saved puzzle content does not match the available artwork: %s" % game_id
			# This is incompatibility, not data loss: preserve the complete bytes in
			# quarantine instead of trying to restore piece state onto different art.
			_retire_broken_slot(game_id, path, "content-identity-mismatch")
			return false

	var restored: bool = await super._resume_game_from_disk(game_id)
	if restored and legacy_without_identity:
		# A pre-identity save can only have come from the historical built-in demo.
		# Rewrite it immediately through the crash-safe path so future launches no
		# longer depend on that historical assumption.
		if save_now(true):
			print("Pieceful content identity migration · upgraded %s" % game_id)
		else:
			push_warning(
				"Pieceful content identity migration could not persist %s: %s"
				% [game_id, last_save_error]
			)
	return restored


func _current_content_identity() -> Dictionary:
	if board != null and board.has_method("active_content_identity"):
		var value = board.active_content_identity()
		if value is Dictionary:
			return value.duplicate(true)
	return {}


func _content_identity_structurally_valid(identity) -> bool:
	if board != null and board.has_method("content_identity_structurally_valid"):
		return bool(board.content_identity_structurally_valid(identity))
	return false


func _content_identity_matches_current(identity) -> bool:
	if board != null and board.has_method("content_identity_matches"):
		return bool(board.content_identity_matches(identity))
	return false
