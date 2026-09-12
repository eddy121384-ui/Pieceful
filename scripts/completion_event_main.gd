class_name CompletionEventMain
extends "res://scripts/puzzle_me_responsive_main.gd"


func completion_metrics_should_run() -> bool:
	if completion_panel != null and completion_panel.visible:
		return false
	if puzzle_selection_overlay != null and puzzle_selection_overlay.visible:
		return false
	if sessions_panel != null and sessions_panel.visible:
		return false
	return true


func _on_completed() -> void:
	# Do not call the inherited Gallery completion chain here. Before V0-08 that
	# chain independently incremented Gallery state and retired the save slot,
	# which meant a duplicate completion callback could count the same game twice.
	# The completion-aware save coordinator now owns the one-shot boundary.
	if save_coordinator == null or not save_coordinator.has_method("complete_active_game_once"):
		super._on_completed()
		return

	var record = save_coordinator.call("complete_active_game_once")
	_refresh_sessions_list()
	completion_panel.visible = true
	if not (record is Dictionary) or record.is_empty():
		return

	var content_id := str(record.get("content_id", ""))
	var difficulty_id := str(record.get("difficulty_id", ""))
	if not content_id.is_empty():
		gallery_state.mark_completed(content_id, difficulty_id)
	_refresh_gallery_cards()
