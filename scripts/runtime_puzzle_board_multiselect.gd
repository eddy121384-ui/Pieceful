class_name RuntimePuzzleBoardMultiSelect
extends "res://scripts/runtime_puzzle_board.gd"

const SELECTION_TAP_SLOP_PX := 10.0

var selection_pick_screen_position := Vector2.ZERO
var selection_drag_start_positions: Dictionary = {}
var selection_batch_active := false


func can_begin_piece_drag(piece, pointer_screen_position: Vector2) -> bool:
	return super.can_begin_piece_drag(piece, pointer_screen_position)


func _on_piece_picked(piece) -> void:
	super._on_piece_picked(piece)
	selection_pick_screen_position = Vector2(piece.last_pointer_screen_position)
	selection_drag_start_positions.clear()
	selection_batch_active = false

	var sorting_workspace := get_parent().get_node_or_null("SortingWorkspace")
	if (
		sorting_workspace != null
		and sorting_workspace.has_method("selected_drag_members_for_piece")
	):
		var selected_members: Array = sorting_workspace.selected_drag_members_for_piece(
			int(piece.piece_index)
		)
		if not selected_members.is_empty():
			active_drag_members.clear()
			z_counter += 1
			var batch_z: int = z_counter
			for value in selected_members:
				var piece_index: int = int(value)
				if piece_index < 0 or piece_index >= pieces.size():
					continue
				var member = pieces[piece_index]
				if not is_instance_valid(member) or member.solved or not member.visible:
					continue
				active_drag_members.append(member)
				member.z_index = batch_z
			active_drag_piece = piece
			selection_batch_active = not active_drag_members.is_empty()

	_capture_drag_start_positions()


func _on_piece_released(piece) -> void:
	var sorting_workspace := get_parent().get_node_or_null("SortingWorkspace")
	var release_screen_position: Vector2 = Vector2(piece.last_pointer_screen_position)
	var travel_px: float = release_screen_position.distance_to(selection_pick_screen_position)

	if (
		sorting_workspace != null
		and sorting_workspace.has_method("selection_mode_active")
		and sorting_workspace.selection_mode_active()
		and travel_px <= SELECTION_TAP_SLOP_PX
	):
		_restore_drag_start_positions()
		if sorting_workspace.has_method("toggle_selection_for_piece"):
			sorting_workspace.toggle_selection_for_piece(piece)
		_clear_active_drag_cache()
		_hide_hint_marker()
		_reset_selection_drag_state()
		return

	if (
		sorting_workspace != null
		and sorting_workspace.has_method("try_store_rail_drop")
		and sorting_workspace.try_store_rail_drop(piece)
	):
		_clear_active_drag_cache()
		_hide_hint_marker()
		_reset_selection_drag_state()
		return

	if (
		sorting_workspace != null
		and sorting_workspace.has_method("try_store_manager_drop")
		and sorting_workspace.try_store_manager_drop(piece)
	):
		_clear_active_drag_cache()
		_hide_hint_marker()
		_reset_selection_drag_state()
		return

	if selection_batch_active:
		_settle_selection_batch()
		_clear_active_drag_cache()
		_hide_hint_marker()
		_reset_selection_drag_state()
		return

	super._on_piece_released(piece)
	_reset_selection_drag_state()


func _capture_drag_start_positions() -> void:
	selection_drag_start_positions.clear()
	for member in active_drag_members:
		if not is_instance_valid(member):
			continue
		selection_drag_start_positions[int(member.piece_index)] = Vector2(member.position)


func _restore_drag_start_positions() -> void:
	for piece_index in selection_drag_start_positions.keys():
		var index: int = int(piece_index)
		if index < 0 or index >= pieces.size():
			continue
		var member = pieces[index]
		if is_instance_valid(member):
			member.position = Vector2(selection_drag_start_positions[piece_index])


func _settle_selection_batch() -> void:
	var cluster_ids: Array = []
	for member in active_drag_members:
		if not is_instance_valid(member) or member.solved or not member.visible:
			continue
		var cluster_id: int = int(
			cluster_for_piece.get(int(member.piece_index), int(member.piece_index))
		)
		if not cluster_ids.has(cluster_id):
			cluster_ids.append(cluster_id)

	for value in cluster_ids:
		var cluster_id: int = int(value)
		if not cluster_members.has(cluster_id):
			continue
		cluster_id = int(_merge_nearby_clusters(cluster_id))
		_snap_cluster_to_board_if_close(cluster_id)


func _reset_selection_drag_state() -> void:
	selection_pick_screen_position = Vector2.ZERO
	selection_drag_start_positions.clear()
	selection_batch_active = false
