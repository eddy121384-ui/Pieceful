class_name RuntimeDifficultyCatalog
extends RefCounted

# Runtime difficulty is intentionally backed only by curated, validated CutPattern
# assets. The player-facing runtime must never synthesize a fresh die on demand.
# The current 960x600 demo artwork is 1.6:1, so the ratio-aware resolver maps the
# three Issue #2 representative targets to 40, 150, and 286 pieces respectively.

const PRESETS := [
	{
		"id": "relaxed",
		"label": "Relaxed",
		"target_piece_count": 36,
		"resolved_piece_count": 40,
		"columns": 8,
		"rows": 5,
		"cut_pattern_path": "res://cut_patterns/Classic_040_A.json",
	},
	{
		"id": "standard",
		"label": "Standard",
		"target_piece_count": 144,
		"resolved_piece_count": 150,
		"columns": 15,
		"rows": 10,
		"cut_pattern_path": "res://cut_patterns/Classic_150_A.json",
	},
	{
		"id": "hard",
		"label": "Hard",
		"target_piece_count": 288,
		"resolved_piece_count": 286,
		"columns": 22,
		"rows": 13,
		"cut_pattern_path": "res://cut_patterns/Classic_286_A.json",
	},
]


func preset_for(difficulty_id: String) -> Dictionary:
	for preset in PRESETS:
		if str(preset["id"]) == difficulty_id:
			return preset
	return {}


func is_available(difficulty_id: String) -> bool:
	var preset := preset_for(difficulty_id)
	if preset.is_empty():
		return false
	return FileAccess.file_exists(str(preset["cut_pattern_path"]))


func available_ids() -> Array[String]:
	var result: Array[String] = []
	for preset in PRESETS:
		var difficulty_id := str(preset["id"])
		if is_available(difficulty_id):
			result.append(difficulty_id)
	return result
