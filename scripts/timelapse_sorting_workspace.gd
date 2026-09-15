extends "res://scripts/tray_reflow_chaos_order_spatial_layout_dock_ui.gd"


func _on_tray_group_dragged_out(
	member_indexes: Array,
	anchor_piece_index: int,
	screen_position: Vector2,
	anchor_pointer_offset: Vector2
) -> void:
	var source_tray_id := active_tray_id
	super._on_tray_group_dragged_out(
		member_indexes,
		anchor_piece_index,
		screen_position,
		anchor_pointer_offset
	)
	var coordinator = _timelapse_coordinator()
	if coordinator != null and coordinator.has_method("record_timelapse_event"):
		coordinator.record_timelapse_event(
			"tray_out",
			member_indexes,
			{"tray_id": source_tray_id},
			true
		)


func _on_tray_cluster_changed() -> void:
	super._on_tray_cluster_changed()
	if active_tray_id.is_empty():
		return
	var member_indexes: Array = state.tray_piece_indexes(active_tray_id)
	var coordinator = _timelapse_coordinator()
	if coordinator != null and coordinator.has_method("record_timelapse_event"):
		coordinator.record_timelapse_event(
			"tray_sort",
			member_indexes,
			{
				"tray_id": active_tray_id,
				"positions": _normalized_tray_positions(member_indexes),
			},
			false
		)


func _normalized_tray_positions(member_indexes: Array) -> Array:
	var result: Array = []
	if tray_play_canvas == null:
		return result
	var width := maxf(float(tray_play_canvas.size.x), 1.0)
	var height := maxf(float(tray_play_canvas.size.y), 1.0)
	for value in member_indexes:
		var piece_index := int(value)
		if state.tray_id_for(piece_index) != active_tray_id:
			continue
		var position := Vector2(state.tray_piece_position(active_tray_id, piece_index))
		result.append({
			"piece_index": piece_index,
			"x": snappedf(position.x / width, 0.0001),
			"y": snappedf(position.y / height, 0.0001),
		})
	return result


func _timelapse_coordinator():
	var parent := get_parent()
	return parent.get_node_or_null("SaveCoordinator") if parent != null else null
