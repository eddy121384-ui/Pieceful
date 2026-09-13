class_name CompletionRecordV1
extends RefCounted

const RECORD_VERSION := 1


static func build(
	game_id: String,
	content_id: String,
	content_identity: Dictionary,
	difficulty_id: String,
	pattern_id: String,
	piece_count: int,
	elapsed_seconds: float,
	hints_used: int,
	completed_at_unix: int
) -> Dictionary:
	var completed_piece_count := maxi(0, piece_count)
	return {
		"record_version": RECORD_VERSION,
		"game_id": game_id,
		"content_id": content_id,
		"content_key": str(content_identity.get("content_key", "")),
		"source_kind": str(content_identity.get("source_kind", "")),
		"source_id": str(content_identity.get("source_id", "")),
		"source_sha256": str(content_identity.get("sha256", "")),
		"difficulty_id": difficulty_id,
		"pattern_id": pattern_id,
		"piece_count": completed_piece_count,
		# At the immutable completion boundary every piece is placed. Keep the
		# explicit field because Journal/share consumers should not have to infer it.
		"pieces_placed": completed_piece_count,
		"elapsed_seconds": maxi(0, int(round(elapsed_seconds))),
		"hints_used": maxi(0, hints_used),
		"hint_free": hints_used <= 0,
		"completed_at_unix": completed_at_unix,
	}


static func structurally_valid(record) -> bool:
	if not (record is Dictionary):
		return false
	if int(record.get("record_version", -1)) != RECORD_VERSION:
		return false
	if str(record.get("game_id", "")).is_empty():
		return false
	if str(record.get("content_id", "")).is_empty():
		return false
	if str(record.get("content_key", "")).is_empty():
		return false
	if str(record.get("source_kind", "")).is_empty():
		return false
	if str(record.get("source_id", "")).is_empty():
		return false
	if str(record.get("difficulty_id", "")).is_empty():
		return false
	if str(record.get("pattern_id", "")).is_empty():
		return false
	var piece_count := int(record.get("piece_count", 0))
	if piece_count <= 0:
		return false
	if int(record.get("pieces_placed", -1)) != piece_count:
		return false
	if int(record.get("elapsed_seconds", -1)) < 0:
		return false
	if int(record.get("hints_used", -1)) < 0:
		return false
	if bool(record.get("hint_free", false)) != (int(record.get("hints_used", 0)) == 0):
		return false
	return int(record.get("completed_at_unix", 0)) > 0
