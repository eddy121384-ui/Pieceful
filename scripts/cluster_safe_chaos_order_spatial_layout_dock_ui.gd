extends "res://scripts/chaos_order_spatial_layout_dock_ui.gd"

# Rail / Scatter is a presentation choice for the loose-piece library. A connected
# 2+ piece island is already player progress on the Main Table and must not be
# automatically swallowed just because the loose-piece presentation changes.
#
# Explicit drag-to-Rail remains supported: try_store_rail_drop() still inserts
# that cluster id into rail_cluster_ids, and the inherited Rail canvas keeps the
# whole cluster rigid. The automatic mode switch only captures singleton groups.


func _capture_all_loose_groups_to_rail() -> void:
	if board == null:
		return

	rail_cluster_ids.clear()
	var seen: Dictionary = {}
	for piece_value in board.pieces:
		var piece = piece_value
		if not is_instance_valid(piece) or bool(piece.solved):
			continue
		var piece_index: int = int(piece.piece_index)
		if state.location_for(piece_index) != "loose":
			continue

		var cluster_id: int = int(
			board.cluster_for_piece.get(piece_index, piece_index)
		)
		if seen.has(cluster_id):
			continue
		seen[cluster_id] = true

		var members: Array = _loose_members_for_cluster(cluster_id)
		if members.size() != 1:
			# Connected islands stay exactly where the player built them.
			continue

		rail_cluster_ids[cluster_id] = true
		_stash_piece(int(members[0]))


func _capture_layout_transition_sources() -> Array:
	var sources: Array = super._capture_layout_transition_sources()
	var filtered: Array = []

	for source_value in sources:
		if not (source_value is Dictionary):
			continue
		var source: Dictionary = source_value
		var cluster_id: int = int(source.get("cluster_id", -1))
		var members_value = source.get("members", [])
		if not (members_value is Array):
			continue
		var members: Array = members_value

		if loose_layout_mode == LAYOUT_RAIL:
			# Rail -> Scatter: animate only groups that are actually in the Rail.
			if rail_cluster_ids.has(cluster_id):
				filtered.append(source)
		else:
			# Scatter -> Rail: only singleton loose pieces are auto-captured.
			if members.size() == 1:
				filtered.append(source)

	return filtered


func _restore_all_loose_groups_to_scatter() -> void:
	if board == null:
		return

	var starts: Array = []
	if board.has_method("_scatter_positions"):
		starts = board._scatter_positions()
	if starts.is_empty():
		return

	var rail_ids: Array = rail_cluster_ids.keys()
	rail_ids.sort()
	rail_cluster_ids.clear()

	var group_ordinal := 0
	for cluster_id_value in rail_ids:
		var cluster_id: int = int(cluster_id_value)
		var members: Array = _loose_members_for_cluster(cluster_id)
		if members.is_empty():
			continue

		var anchor_index: int = int(members[0])
		var anchor_piece = board.pieces[anchor_index]
		var anchor_position := Vector2(starts[group_ordinal % starts.size()])
		group_ordinal += 1
		board.z_counter += 1
		var group_z: int = int(board.z_counter)

		for value in members:
			var member_index: int = int(value)
			var member = board.pieces[member_index]
			member.position = (
				anchor_position
				+ Vector2(member.target_position)
				- Vector2(anchor_piece.target_position)
			)
			member.visible = true
			member.modulate = Color.WHITE
			member.input_pickable = true
			member.z_index = group_z


func _restore_dense_loose_groups_to_scatter() -> void:
	if board == null:
		return

	layout_transition_hidden_members.clear()
	dense_prewarm_members.clear()
	dense_prewarm_activated.clear()
	dense_prewarm_work_usec = 0

	var starts: Array = _dense_scatter_positions()
	if starts.is_empty():
		return

	var rail_ids: Array = rail_cluster_ids.keys()
	rail_ids.sort()
	rail_cluster_ids.clear()

	var group_ordinal := 0
	for cluster_id_value in rail_ids:
		var cluster_id: int = int(cluster_id_value)
		var members: Array = _loose_members_for_cluster(cluster_id)
		if members.is_empty():
			continue

		var anchor_index: int = int(members[0])
		var anchor_piece = board.pieces[anchor_index]
		var anchor_position := Vector2(
			starts[group_ordinal % starts.size()]
		)
		group_ordinal += 1
		board.z_counter += 1
		var group_z: int = int(board.z_counter)

		for value in members:
			var member_index: int = int(value)
			if member_index < 0 or member_index >= board.pieces.size():
				continue
			var member = board.pieces[member_index]
			if not is_instance_valid(member) or bool(member.solved):
				continue

			member.position = (
				anchor_position
				+ Vector2(member.target_position)
				- Vector2(anchor_piece.target_position)
			)
			member.z_index = group_z
			# Preserve the proven render-hot dense path. Only genuine Rail members
			# participate; Main Table islands never get hidden or moved.
			member.visible = true
			member.input_pickable = false
			member.modulate = Color(1.0, 1.0, 1.0, 0.0)

			layout_transition_hidden_members.append(member_index)
			dense_prewarm_members.append(member_index)
