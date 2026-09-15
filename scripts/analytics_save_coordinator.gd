class_name AnalyticsSaveCoordinator
extends "res://scripts/timelapse_completion_event_save_coordinator.gd"

signal analytics_hint_assist_recorded(game_id: String)


func record_hint_use(piece_index: int) -> void:
	var was_assisted := active_hints_used > 0
	super.record_hint_use(piece_index)
	if (
		not was_assisted
		and active_hints_used > 0
		and not active_game_id.is_empty()
	):
		analytics_hint_assist_recorded.emit(active_game_id)
