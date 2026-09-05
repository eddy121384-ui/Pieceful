class_name SortingWorkspaceState
extends RefCounted

const LOCATION_LOOSE := "loose"
const LOCATION_TRAY := "tray"
const LOCATION_BOARD := "board"

var tray_order: Array[String] = []
var tray_names: Dictionary = {}
var tray_members: Dictionary = {}
var piece_locations: Dictionary = {}
var tray_for_piece: Dictionary = {}
var next_tray_number := 1


func reset(piece_count: int) -> void:
	tray_order.clear()
	tray_names.clear()
	tray_members.clear()
	piece_locations.clear()
	tray_for_piece.clear()
	next_tray_number = 1

	for piece_index in range(maxi(piece_count, 0)):
		piece_locations[piece_index] = LOCATION_LOOSE


func tray_ids() -> Array[String]:
	return tray_order.duplicate()


func create_tray(requested_name: String = "") -> String:
	var tray_id := "tray_%d" % next_tray_number
	var display_name := requested_name.strip_edges()
	if display_name.is_empty():
		display_name = "Tray %d" % next_tray_number

	next_tray_number += 1
	tray_order.append(tray_id)
	tray_names[tray_id] = display_name
	tray_members[tray_id] = []
	return tray_id


func rename_tray(tray_id: String, requested_name: String) -> bool:
	if not tray_names.has(tray_id):
		return false
	var display_name := requested_name.strip_edges()
	if display_name.is_empty():
		return false
	tray_names[tray_id] = display_name
	return true


func tray_name(tray_id: String) -> String:
	return str(tray_names.get(tray_id, tray_id))


func tray_piece_indexes(tray_id: String) -> Array:
	var members = tray_members.get(tray_id, [])
	if members is Array:
		return members.duplicate()
	return []


func tray_piece_count(tray_id: String) -> int:
	return tray_piece_indexes(tray_id).size()


func total_tray_piece_count() -> int:
	return count_in_location(LOCATION_TRAY)


func location_for(piece_index: int) -> String:
	return str(piece_locations.get(piece_index, LOCATION_LOOSE))


func tray_id_for(piece_index: int) -> String:
	return str(tray_for_piece.get(piece_index, ""))


func assign_pieces_to_tray(piece_indexes: Array, tray_id: String) -> bool:
	if not tray_members.has(tray_id) or piece_indexes.is_empty():
		return false

	for value in piece_indexes:
		var piece_index := int(value)
		if location_for(piece_index) == LOCATION_BOARD:
			return false

	var members: Array = tray_members[tray_id]
	for value in piece_indexes:
		var piece_index := int(value)
		_remove_from_current_tray(piece_index)
		if not members.has(piece_index):
			members.append(piece_index)
		piece_locations[piece_index] = LOCATION_TRAY
		tray_for_piece[piece_index] = tray_id
	tray_members[tray_id] = members
	return true


func move_piece_to_loose(piece_index: int) -> void:
	_remove_from_current_tray(piece_index)
	piece_locations[piece_index] = LOCATION_LOOSE
	tray_for_piece.erase(piece_index)


func mark_piece_on_board(piece_index: int) -> void:
	_remove_from_current_tray(piece_index)
	piece_locations[piece_index] = LOCATION_BOARD
	tray_for_piece.erase(piece_index)


func count_in_location(location: String) -> int:
	var count := 0
	for value in piece_locations.values():
		if str(value) == location:
			count += 1
	return count


func _remove_from_current_tray(piece_index: int) -> void:
	var current_tray := tray_id_for(piece_index)
	if current_tray.is_empty() or not tray_members.has(current_tray):
		return

	var members: Array = tray_members[current_tray]
	members.erase(piece_index)
	tray_members[current_tray] = members
