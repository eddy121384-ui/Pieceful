class_name ChaosOrderStressPuzzleBoard
extends "res://scripts/chaos_order_spatial_puzzle_board.gd"

const CutPatternGeneratorV16Script = preload("res://scripts/cut_pattern_generator_v16.gd")

const STRESS_DIFFICULTY_ID := "stress_400"
const STRESS_PATTERN_PATH := "user://Pieceful_Stress_400_v16_A.json"
const STRESS_PATTERN_ID := "Pieceful_Stress_400_v16_A"
const STRESS_COLUMNS := 25
const STRESS_ROWS := 16
const STRESS_PIECE_COUNT := 400
const STRESS_ASPECT_RATIO := 1.6
const STRESS_SEED := 4002026

var last_stress_generation_ms := 0


func difficulty_available(difficulty_id: String) -> bool:
	if difficulty_id == STRESS_DIFFICULTY_ID:
		return true
	return super.difficulty_available(difficulty_id)


func request_difficulty(difficulty_id: String) -> bool:
	if difficulty_id == STRESS_DIFFICULTY_ID:
		if not _ensure_stress_pattern():
			last_difficulty_error = "Could not generate Stress 400 CutPattern"
			return false
	return super.request_difficulty(difficulty_id)


func _ensure_stress_pattern() -> bool:
	if FileAccess.file_exists(STRESS_PATTERN_PATH):
		return true

	var started_ms: int = Time.get_ticks_msec()
	var generator = CutPatternGeneratorV16Script.new(
		STRESS_COLUMNS,
		STRESS_ROWS,
		STRESS_ASPECT_RATIO,
		STRESS_SEED,
		{}
	)
	var pattern: Dictionary = generator.generate_pattern_dict(
		STRESS_PATTERN_ID,
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
		"difficulty_id": STRESS_DIFFICULTY_ID,
		"target_piece_count": STRESS_PIECE_COUNT,
		"resolved_piece_count": STRESS_PIECE_COUNT,
		"columns": STRESS_COLUMNS,
		"rows": STRESS_ROWS,
		"frame_aspect_ratio": STRESS_ASPECT_RATIO,
		"aspect_class": "custom_1.6000",
		"cell_aspect_ratio": STRESS_ASPECT_RATIO * float(STRESS_ROWS) / float(STRESS_COLUMNS),
		"layout_score": 0.0,
	}
	pattern["authoring"] = authoring

	var file := FileAccess.open(STRESS_PATTERN_PATH, FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(JSON.stringify(pattern))
	file.close()

	last_stress_generation_ms = Time.get_ticks_msec() - started_ms
	print(
		"Pieceful Stress 400 die · generated %dx%d = %d · %d ms · user:// cache"
		% [STRESS_COLUMNS, STRESS_ROWS, STRESS_PIECE_COUNT, last_stress_generation_ms]
	)
	return FileAccess.file_exists(STRESS_PATTERN_PATH)
