class_name ChaosOrderStressPuzzleBoard
extends "res://scripts/chaos_order_spatial_puzzle_board.gd"

const CutPatternGeneratorV16Script = preload("res://scripts/cut_pattern_generator_v16.gd")

const STRESS_ASPECT_RATIO := 1.6
const STRESS_PROFILES := {
	"stress_400": {
		"path": "user://Pieceful_Stress_400_v16_A.json",
		"pattern_id": "Pieceful_Stress_400_v16_A",
		"columns": 25,
		"rows": 16,
		"piece_count": 400,
		"seed": 4002026,
	},
	"stress_576": {
		"path": "user://Pieceful_Stress_576_v16_A.json",
		"pattern_id": "Pieceful_Stress_576_v16_A",
		"columns": 32,
		"rows": 18,
		"piece_count": 576,
		"seed": 5762026,
	},
}

var last_stress_generation_ms := 0


func difficulty_available(difficulty_id: String) -> bool:
	if STRESS_PROFILES.has(difficulty_id):
		return true
	return super.difficulty_available(difficulty_id)


func request_difficulty(difficulty_id: String) -> bool:
	if STRESS_PROFILES.has(difficulty_id):
		if not _ensure_stress_pattern(difficulty_id):
			last_difficulty_error = "Could not generate %s CutPattern" % difficulty_id
			return false
	return super.request_difficulty(difficulty_id)


func _ensure_stress_pattern(difficulty_id: String) -> bool:
	var profile: Dictionary = _stress_profile_for(difficulty_id)
	if profile.is_empty():
		return false

	var pattern_path := str(profile["path"])
	if FileAccess.file_exists(pattern_path):
		return true

	var columns := int(profile["columns"])
	var rows := int(profile["rows"])
	var piece_count := int(profile["piece_count"])
	var seed := int(profile["seed"])
	var pattern_id := str(profile["pattern_id"])
	var started_ms: int = Time.get_ticks_msec()
	var generator = CutPatternGeneratorV16Script.new(
		columns,
		rows,
		STRESS_ASPECT_RATIO,
		seed,
		{}
	)
	var pattern: Dictionary = generator.generate_pattern_dict(
		pattern_id,
		1,
		"custom_1.6000"
	)
	if pattern.is_empty():
		return false

	var authoring: Dictionary = pattern.get("authoring", {})
	authoring["curated"] = false
	authoring["stress_test_only"] = true
	authoring["layout"] = {
		"resolver": "stress_fixed_grid_v1",
		"difficulty_id": difficulty_id,
		"target_piece_count": piece_count,
		"resolved_piece_count": piece_count,
		"columns": columns,
		"rows": rows,
		"frame_aspect_ratio": STRESS_ASPECT_RATIO,
		"aspect_class": "custom_1.6000",
		"cell_aspect_ratio": STRESS_ASPECT_RATIO * float(rows) / float(columns),
		"layout_score": 0.0,
	}
	pattern["authoring"] = authoring

	var file := FileAccess.open(pattern_path, FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(JSON.stringify(pattern))
	file.close()

	last_stress_generation_ms = Time.get_ticks_msec() - started_ms
	print(
		"Pieceful stress die · %s · %dx%d = %d · %d ms · user:// cache"
		% [difficulty_id, columns, rows, piece_count, last_stress_generation_ms]
	)
	return FileAccess.file_exists(pattern_path)


func _stress_profile_for(difficulty_id: String) -> Dictionary:
	var value = STRESS_PROFILES.get(difficulty_id, {})
	if value is Dictionary:
		return (value as Dictionary).duplicate(true)
	return {}
