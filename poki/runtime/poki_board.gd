extends "res://scripts/completion_event_puzzle_board.gd"

const PokiDifficulty = preload("res://poki/runtime/poki_difficulty_catalog.gd")


func _init() -> void:
	super._init()
	difficulty_catalog = PokiDifficulty.new()
	var profile = JSON.parse_string(FileAccess.get_file_as_string("res://poki/profile.json"))
	selected_content_id = str(profile["featured_content_id"])


func content_aspect_ratio(content_id: String) -> float:
	# Dimensions are checked against the immutable originals at build time.
	# Difficulty previews must not decode full artwork just to learn its shape.
	var metadata: Dictionary = content_metadata(content_id)
	var size: Dictionary = metadata.get("runtime_asset", {}).get("puzzle", {})
	if int(size.get("height", 0)) > 0:
		return float(size["width"]) / float(size["height"])
	return LEGACY_FRAME_ASPECT


func difficulty_presets_for_content(content_id: String) -> Array:
	var rows: Array = super.difficulty_presets_for_content(content_id)
	var quick: Dictionary = PokiDifficulty.QUICK.duplicate(true)
	rows.push_front(quick)
	return rows


func difficulty_available(difficulty_id: String) -> bool:
	if difficulty_id == "poki_quick":
		return FileAccess.file_exists(REGRESSION_CUT_PATTERN_PATH)
	return super.difficulty_available(difficulty_id)


func active_difficulty_id() -> String:
	return "poki_quick" if selected_difficulty_id == "poki_quick" else super.active_difficulty_id()


func request_difficulty(difficulty_id: String) -> bool:
	if difficulty_id != "poki_quick":
		return super.request_difficulty(difficulty_id)
	if _consume_matching_resume_runtime_reuse(difficulty_id):
		resume_runtime_reuse_hits += 1
		return true
	# The accepted density resolver intentionally has a 36-piece minimum.
	# Quick reuses the existing Classic_012_A die; do not change that resolver
	# or invent a second geometry generator to make a misleading "12" tier.
	_prepare_board_geometry(content_aspect_ratio(active_content_id()))
	_resolved_runtime_pattern_path = REGRESSION_CUT_PATTERN_PATH
	_active_resolved_layout = PokiDifficulty.QUICK.duplicate(true)
	selected_difficulty_id = difficulty_id
	last_difficulty_error = ""
	start_new_game()
	return true
