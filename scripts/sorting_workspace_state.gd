class_name SortingWorkspaceState
extends RefCounted

const LOCATION_LOOSE := "loose"
const LOCATION_TRAY := "tray"
const LOCATION_BOARD := "board"
const DEFAULT_TRAY_ID := "tray_1"

var tray_order: Array[String] = []
var tray_names: Dictionary = {}
var tray_members: Dictionary = {}
var piece_locations: Dictionary = {}
var tray_for_piece: Dictionary = {}


func reset(piece_count: int) -> void:
	tray_order = [DEFAULT_TRAY_ID]
	tray_names = {DEFAULT_TRAY_ID: "Tray 1"}
	tray_members = {DEFAULT_TRAY_ID: []}
	piece_locations.clear()
	tray_for_piece.clear()

	for piece_index in range(maxi(piece_count, 0)):
		piece_locations[piece_index] = LOCATION_LOOSE


func default_tray_id() -> String:
	return DEFAULT_TRAY_ID


func tray_name(tray_id: String) -> String:
	return str(tray_names.get(tray_id, tray_id))


func tray_piece_indexes(tray_id: String) -> Array:
	var members = tray_members.get(tray_id, [])
	if members is Array:
		return members.duplicate()
	return []


func location_for(piece_index: int) -> String:
	return str(piece_locations.get(piece_index, LOCATION_LOOSE))


func tray_id_for(piece_index: int) -> String:
	return str(tray_for_piece.get(piece_index, ""))


func assign_piece_to_tray(piece_index: int, tray_id: String) -> bool:
	if not tray_members.has(tray_id):
		return false
	if location_for(piece_index) == LOCATION_BOARD:
		return false

	_remove_from_current_tray(piece_index)
	var members: Array = tray_members[tray_id]
	if not members.has(piece_index):
		members.append(piece_index)
	tray_members[tray_id] = members
	piece_locations[piece_index] = LOCATION_TRAY
	tray_for_piece[piece_index] = tray_id
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
