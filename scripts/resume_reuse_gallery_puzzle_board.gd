class_name ResumeReuseGalleryPuzzleBoard
extends "res://scripts/gallery_puzzle_catalog_board.gd"

var _resume_runtime_reuse_hint: Dictionary = {}
var resume_runtime_reuse_hits := 0


func arm_resume_runtime_reuse(difficulty_id: String) -> void:
	if definition == null:
		_resume_runtime_reuse_hint.clear()
		return
	_resume_runtime_reuse_hint = {
		"difficulty_id": difficulty_id,
		"content_id": str(active_content_id()),
		"pattern_id": str(active_pattern_id()),
		"piece_count": int(active_piece_count()),
	}


func clear_resume_runtime_reuse_hint() -> void:
	_resume_runtime_reuse_hint.clear()


func request_difficulty(difficulty_id: String) -> bool:
	if _consume_matching_resume_runtime_reuse(difficulty_id):
		last_difficulty_error = ""
		resume_runtime_reuse_hits += 1
		print(
			"Pieceful resume fast-path · reused %s · %s · %d pieces"
			% [difficulty_id, active_pattern_id(), active_piece_count()]
		)
		return true
	return super.request_difficulty(difficulty_id)


func _consume_matching_resume_runtime_reuse(difficulty_id: String) -> bool:
	if _resume_runtime_reuse_hint.is_empty():
		return false
	var hint := _resume_runtime_reuse_hint.duplicate(true)
	# A hint is strictly one-shot. If anything about the next request differs,
	# fall back to the normal rebuild rather than carrying stale reuse state into
	# a later player action.
	_resume_runtime_reuse_hint.clear()
	return (
		difficulty_id == str(hint.get("difficulty_id", ""))
		and difficulty_id == str(active_difficulty_id())
		and str(active_content_id()) == str(hint.get("content_id", ""))
		and str(active_pattern_id()) == str(hint.get("pattern_id", ""))
		and int(active_piece_count()) == int(hint.get("piece_count", -1))
	)
