extends "res://scripts/runtime_difficulty_catalog.gd"

const QUICK := {"id": "poki_quick", "label": "Quick", "target_piece_count": 12,
	"resolved_piece_count": 12, "columns": 4, "rows": 3,
	"cut_pattern_path": "res://cut_patterns/Classic_012_A.json"}


func preset_for(difficulty_id: String) -> Dictionary:
	return QUICK if difficulty_id == "poki_quick" else super.preset_for(difficulty_id)
