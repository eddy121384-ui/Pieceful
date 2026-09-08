extends "res://scripts/chaos_order_layout_dock_ui.gd"

const DENSE_SCATTER_REVEAL_BATCHES := 6
const DENSE_SCATTER_REVEAL_INTERVAL := 0.035

var dense_scatter_reveal_members: Array = []
var dense_scatter_reveal_generation := 0
var dense_scatter_reveal_started_ms := 0


func _set_loose_layout_mode(mode: String) -> void:
	if mode == LAYOUT_RAIL:
		_invalidate_dense_scatter_reveal()
	super._set_loose_layout_mode(mode)


func _ensure_piece_bindings() -> bool:
	var changed: bool = super._ensure_piece_bindings()
	if changed:
		_invalidate_dense_scatter_reveal()
	return changed


func _restore_dense_loose_groups_to_scatter() -> void:
	if board == null:
		return

	_invalidate_dense_scatter_reveal()
	dense_scatter_reveal_generation += 1
	dense_scatter_reveal_started_ms = Time.get_ticks_msec()
	rail_cluster_ids.clear()

	var starts: Array = _dense_scatter_positions()
	if starts.is_empty():
		return

	var seen: Dictionary = {}
	var group_ordinal: int = 0
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
		if members.is_empty():
			continue
		var anchor_index: int = int(members[0])
		var anchor_piece = board.pieces[anchor_index]
		var anchor_position: Vector2 = Vector2(
			starts[group_ordinal % starts.size()]
		)
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
			# Position all pieces while they are still cheap/invisible, then let the
			# reveal scheduler return rendering and hit-testing in small frame-sized
			# batches. The sampled transition ghosts cover this handoff visually.
			member.visible = false
			member.input_pickable = false
			member.z_index = group_z
			dense_scatter_reveal_members.append(member_index)

	print(
		"Pieceful dense Scatter prepared · %d hidden members · %d ms"
		% [
			dense_scatter_reveal_members.size(),
			Time.get_ticks_msec() - dense_scatter_reveal_started_ms,
		]
	)


func _play_dense_sample_transition(sources: Array, mode: String) -> void:
	if mode == LAYOUT_SCATTER:
		_start_dense_scatter_reveal()
	super._play_dense_sample_transition(sources, mode)


func _start_dense_scatter_reveal() -> void:
	if dense_scatter_reveal_members.is_empty():
		return

	var generation: int = dense_scatter_reveal_generation
	var shuffled: Array = dense_scatter_reveal_members.duplicate()
	shuffled.shuffle()
	var batch_count: int = mini(
		DENSE_SCATTER_REVEAL_BATCHES,
		maxi(1, shuffled.size())
	)
	var batches: Array = []
	for batch_index in range(batch_count):
		batches.append([])
	for ordinal in range(shuffled.size()):
		var bucket: Array = batches[ordinal % batch_count]
		bucket.append(int(shuffled[ordinal]))

	# First batch appears immediately so the layout switch feels responsive.
	_reveal_dense_scatter_batch(batches[0], generation)
	if batch_count <= 1:
		_finish_dense_scatter_reveal(generation)
		return

	var reveal_tween: Tween = create_tween()
	for batch_index in range(1, batch_count):
		reveal_tween.tween_interval(DENSE_SCATTER_REVEAL_INTERVAL)
		var batch: Array = batches[batch_index]
		reveal_tween.tween_callback(
			_reveal_dense_scatter_batch.bind(batch, generation)
		)
	reveal_tween.tween_callback(_finish_dense_scatter_reveal.bind(generation))


func _reveal_dense_scatter_batch(member_indexes: Array, generation: int) -> void:
	if generation != dense_scatter_reveal_generation:
		return
	if board == null or loose_layout_mode != LAYOUT_SCATTER:
		return

	for value in member_indexes:
		var piece_index: int = int(value)
		if piece_index < 0 or piece_index >= board.pieces.size():
			continue
		var piece = board.pieces[piece_index]
		if (
			not is_instance_valid(piece)
			or bool(piece.solved)
			or state.location_for(piece_index) != "loose"
		):
			continue
		piece.visible = true
		piece.input_pickable = true


func _finish_dense_scatter_reveal(generation: int) -> void:
	if generation != dense_scatter_reveal_generation:
		return
	print(
		"Pieceful dense Scatter reveal · %d members · %d ms"
		% [
			dense_scatter_reveal_members.size(),
			Time.get_ticks_msec() - dense_scatter_reveal_started_ms,
		]
	)
	dense_scatter_reveal_members.clear()


func _invalidate_dense_scatter_reveal() -> void:
	dense_scatter_reveal_generation += 1
	dense_scatter_reveal_members.clear()
