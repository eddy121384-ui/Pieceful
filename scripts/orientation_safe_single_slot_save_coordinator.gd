extends "res://scripts/single_slot_save_coordinator.gd"

# V1 orientation-safe extension. Single loose pieces can be restored from their
# own normalized position, but a connected cluster must never normalize every
# member independently: portrait/landscape use different X/Y scales and that
# would stretch the rigid island. Store one normalized anchor per loose cluster
# and rebuild the remaining members from exact target-relative offsets.


func _capture_snapshot() -> Dictionary:
	var snapshot: Dictionary = super._capture_snapshot()
	var board_state = snapshot.get("board", {})
	if not (board_state is Dictionary):
		return snapshot

	var anchors := {}
	if str(workspace.loose_layout_mode) == "scatter":
		var navigation := Rect2(board.navigation_rect)
		var cluster_ids: Array = board.cluster_members.keys()
		cluster_ids.sort()
		for cluster_id_value in cluster_ids:
			var cluster_id := int(cluster_id_value)
			var raw_members = board.cluster_members.get(cluster_id, [])
			if not (raw_members is Array) or raw_members.is_empty():
				continue

			var members: Array = raw_members.duplicate()
			members.sort()
			var anchor_index := int(members[0])
			if anchor_index < 0 or anchor_index >= board.pieces.size():
				continue
			var anchor_piece = board.pieces[anchor_index]
			if (
				not is_instance_valid(anchor_piece)
				or bool(anchor_piece.solved)
				or str(workspace.state.location_for(anchor_index)) != "loose"
			):
				continue

			# A cluster is a single workspace object. Only persist an anchor when every
			# member is still a loose, unsolved Main Table piece.
			var all_loose := true
			for member_value in members:
				var member_index := int(member_value)
				if (
					member_index < 0
					or member_index >= board.pieces.size()
					or bool(board.pieces[member_index].solved)
					or str(workspace.state.location_for(member_index)) != "loose"
				):
					all_loose = false
					break
			if not all_loose:
				continue

			anchors[str(anchor_index)] = _position_to_normalized(
				Vector2(anchor_piece.position),
				navigation
			)

	board_state["loose_cluster_anchor_norm"] = anchors
	snapshot["board"] = board_state
	return snapshot


func _restore_piece_runtime(board_state: Dictionary, workspace_state: Dictionary) -> void:
	super._restore_piece_runtime(board_state, workspace_state)
	if str(workspace_state.get("loose_layout_mode", "scatter")) != "scatter":
		return

	var anchors = board_state.get("loose_cluster_anchor_norm", {})
	if not (anchors is Dictionary) or anchors.is_empty():
		# Backward compatibility for early V1 autosaves created before cluster
		# anchors existed. Their singleton positions still restore normally.
		return

	var navigation := Rect2(board.navigation_rect)
	for cluster_id_value in board.cluster_members.keys():
		var cluster_id := int(cluster_id_value)
		var members = board.cluster_members.get(cluster_id, [])
		if not (members is Array) or members.is_empty():
			continue

		var sorted_members: Array = members.duplicate()
		sorted_members.sort()
		var anchor_index := int(sorted_members[0])
		var anchor_key := str(anchor_index)
		if not anchors.has(anchor_key):
			continue
		if anchor_index < 0 or anchor_index >= board.pieces.size():
			continue

		var anchor_piece = board.pieces[anchor_index]
		if not is_instance_valid(anchor_piece) or bool(anchor_piece.solved):
			continue
		var anchor_position := _normalized_to_position(anchors[anchor_key], navigation)
		var anchor_target := Vector2(anchor_piece.target_position)

		for member_value in sorted_members:
			var member_index := int(member_value)
			if member_index < 0 or member_index >= board.pieces.size():
				continue
			var member = board.pieces[member_index]
			if not is_instance_valid(member) or bool(member.solved):
				continue
			member.position = (
				anchor_position
				+ Vector2(member.target_position)
				- anchor_target
			)
