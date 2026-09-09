class_name SortingWorkspaceManagementState
extends "res://scripts/sorting_workspace_state.gd"

var tray_collapsed: Dictionary = {}


func reset(piece_count: int) -> void:
	super.reset(piece_count)
	tray_collapsed.clear()


func create_tray(requested_name: String = "") -> String:
	var tray_id: String = super.create_tray(requested_name)
	tray_collapsed[tray_id] = false
	return tray_id


func move_tray(tray_id: String, delta: int) -> bool:
	var current_index: int = tray_order.find(tray_id)
	if current_index < 0:
		return false
	var next_index: int = clampi(current_index + delta, 0, tray_order.size() - 1)
	if next_index == current_index:
		return false
	tray_order.remove_at(current_index)
	tray_order.insert(next_index, tray_id)
	return true


func tray_is_collapsed(tray_id: String) -> bool:
	return bool(tray_collapsed.get(tray_id, false))


func set_tray_collapsed(tray_id: String, collapsed: bool) -> bool:
	if not tray_names.has(tray_id):
		return false
	tray_collapsed[tray_id] = collapsed
	return true


func delete_tray(tray_id: String) -> Array:
	if not tray_names.has(tray_id):
		return []

	var members: Array = tray_piece_indexes(tray_id)
	for value in members:
		var piece_index: int = int(value)
		piece_locations[piece_index] = LOCATION_LOOSE
		tray_for_piece.erase(piece_index)

	tray_order.erase(tray_id)
	tray_names.erase(tray_id)
	tray_members.erase(tray_id)
	tray_piece_positions.erase(tray_id)
	tray_position_reference_sizes.erase(tray_id)
	tray_collapsed.erase(tray_id)
	return members
