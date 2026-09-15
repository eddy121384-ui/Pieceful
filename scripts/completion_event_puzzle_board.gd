class_name CompletionEventPuzzleBoard
extends "res://scripts/touch_priority_puzzle_me_gallery_board.gd"


func _on_piece_picked(piece) -> void:
	super._on_piece_picked(piece)
	var coordinator = _completion_coordinator()
	if coordinator != null and coordinator.has_method("ensure_timelapse_started"):
		coordinator.ensure_timelapse_started()


func _on_piece_released(piece) -> void:
	if piece == null:
		super._on_piece_released(piece)
		return

	var before_cluster_id := int(cluster_for_piece.get(piece.piece_index, piece.piece_index))
	var before_members: Array = _cluster_members_for(before_cluster_id).duplicate()
	var before_solved := solved_count
	var sorting_workspace := get_parent().get_node_or_null("SortingWorkspace")

	super._on_piece_released(piece)

	var coordinator = _completion_coordinator()
	if coordinator == null or not coordinator.has_method("record_timelapse_event"):
		return

	# A successful tray drop stashes the world nodes immediately. Record the
	# semantic destination instead of their artificial off-screen stash position.
	if not piece.visible and sorting_workspace != null:
		var tray_id := ""
		var sorting_state = sorting_workspace.get("state")
		if sorting_state != null and sorting_state.has_method("tray_id_for"):
			tray_id = str(sorting_state.tray_id_for(int(piece.piece_index)))
		coordinator.record_timelapse_event(
			"tray_in",
			before_members,
			{"tray_id": tray_id},
			false
		)
		return

	var after_cluster_id := int(cluster_for_piece.get(piece.piece_index, piece.piece_index))
	var after_members: Array = _cluster_members_for(after_cluster_id).duplicate()
	coordinator.record_timelapse_event(
		"move",
		after_members,
		{},
		true
	)

	if after_members.size() > before_members.size():
		coordinator.record_timelapse_event(
			"merge",
			after_members,
			{"cluster_size": after_members.size()},
			false
		)

	if solved_count > before_solved:
		coordinator.record_timelapse_event(
			"snap",
			after_members,
			{
				"newly_solved": solved_count - before_solved,
				"solved_count": solved_count,
			},
			true
		)


func _show_hint_for_piece(piece) -> void:
	var should_record := (
		hint_is_enabled()
		and piece != null
		and not bool(piece.solved)
	)
	super._show_hint_for_piece(piece)
	if not should_record:
		return
	var coordinator = _completion_coordinator()
	if coordinator != null and coordinator.has_method("record_hint_use"):
		coordinator.call("record_hint_use", int(piece.piece_index))


func _completion_coordinator():
	var parent := get_parent()
	return parent.get_node_or_null("SaveCoordinator") if parent != null else null
