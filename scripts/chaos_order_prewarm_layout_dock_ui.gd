extends "res://scripts/chaos_order_layout_dock_ui.gd"

const DENSE_PREWARM_BATCHES := 8
const DENSE_PREWARM_INTERVAL := 0.028
const DENSE_RENDER_HOT_STASH_ORIGIN := Vector2(-1000000.0, -1000000.0)

var dense_prewarm_members: Array[int] = []
var dense_prewarm_activated: Dictionary = {}
var dense_prewarm_tween: Tween
var dense_prewarm_work_usec := 0


func _stash_piece(piece_index: int) -> void:
	# Dense Rail is presentation-only. Keep canonical loose world pieces attached
	# to the Canvas render path instead of toggling ~3 child CanvasItems per piece
	# off and back on (Face + Outline + Shadow) when Rail returns to Scatter.
	# Tray storage still uses the inherited hard hide because Tray ownership is a
	# different canonical location and should not keep world presentation alive.
	if (
		_dense_runtime_active()
		and loose_layout_mode == LAYOUT_RAIL
		and board != null
		and piece_index >= 0
		and piece_index < board.pieces.size()
		and state.location_for(piece_index) == "loose"
	):
		var piece = board.pieces[piece_index]
		if not is_instance_valid(piece) or bool(piece.solved):
			return
		piece.input_pickable = false
		piece.modulate = Color(1.0, 1.0, 1.0, 0.0)
		piece.position = DENSE_RENDER_HOT_STASH_ORIGIN - Vector2(
			float(piece_index) * 64.0,
			0.0
		)
		# Intentionally remain visible. At alpha zero and far outside the viewport
		# the world piece is not player-facing, while RenderServer avoids the bulk
		# visibility activation spike on Rail -> Scatter.
		piece.visible = true
		return

	super._stash_piece(piece_index)


func _restore_dense_loose_groups_to_scatter() -> void:
	if board == null:
		return

	rail_cluster_ids.clear()
	layout_transition_hidden_members.clear()
	dense_prewarm_members.clear()
	dense_prewarm_activated.clear()
	dense_prewarm_work_usec = 0

	var starts: Array = _dense_scatter_positions()
	if starts.is_empty():
		return

	var seen: Dictionary = {}
	var group_ordinal := 0
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
			# Dense Rail stash deliberately kept these world CanvasItems visible and
			# transparent. Keep that render-hot state while sampled ghosts animate;
			# the transition finish only restores alpha/input instead of reactivating
			# hundreds of CanvasItems in one frame.
			member.visible = true
			member.input_pickable = false
			member.modulate = Color(1.0, 1.0, 1.0, 0.0)

			layout_transition_hidden_members.append(member_index)
			dense_prewarm_members.append(member_index)


func _play_dense_sample_transition(sources: Array, mode: String) -> void:
	super._play_dense_sample_transition(sources, mode)
	if mode == LAYOUT_SCATTER and not dense_prewarm_members.is_empty():
		_start_dense_scatter_prewarm()


func _start_dense_scatter_prewarm() -> void:
	if dense_prewarm_tween != null and dense_prewarm_tween.is_valid():
		dense_prewarm_tween.kill()
	if dense_prewarm_members.is_empty():
		return

	var batch_count: int = mini(DENSE_PREWARM_BATCHES, dense_prewarm_members.size())
	var batch_size: int = ceili(
		float(dense_prewarm_members.size()) / float(maxi(batch_count, 1))
	)

	dense_prewarm_tween = create_tween()
	for batch_index in range(batch_count):
		dense_prewarm_tween.tween_interval(DENSE_PREWARM_INTERVAL)
		var start_index: int = batch_index * batch_size
		var end_index: int = mini(
			dense_prewarm_members.size(),
			start_index + batch_size
		)
		dense_prewarm_tween.tween_callback(
			_prewarm_dense_scatter_batch.bind(start_index, end_index)
		)


func _prewarm_dense_scatter_batch(start_index: int, end_index: int) -> void:
	if board == null or layout_transition_target_mode != LAYOUT_SCATTER:
		return
	var started_usec: int = Time.get_ticks_usec()

	for ordinal in range(start_index, end_index):
		if ordinal < 0 or ordinal >= dense_prewarm_members.size():
			continue
		var piece_index: int = dense_prewarm_members[ordinal]
		if dense_prewarm_activated.has(piece_index):
			continue
		if piece_index < 0 or piece_index >= board.pieces.size():
			continue
		var piece = board.pieces[piece_index]
		if (
			not is_instance_valid(piece)
			or bool(piece.solved)
			or state.location_for(piece_index) != "loose"
		):
			continue

		# This is intentionally idempotent for render-hot Rail pieces. It still
		# records how much bookkeeping remains, but should no longer trigger a bulk
		# CanvasItem visibility transition.
		piece.modulate = Color(1.0, 1.0, 1.0, 0.0)
		piece.visible = true
		piece.input_pickable = false
		dense_prewarm_activated[piece_index] = true

	dense_prewarm_work_usec += Time.get_ticks_usec() - started_usec


func _finish_layout_transition() -> void:
	var finished_mode: String = layout_transition_target_mode
	var prepared_members: Array = layout_transition_hidden_members.duplicate()

	if dense_prewarm_tween != null and dense_prewarm_tween.is_valid():
		dense_prewarm_tween.kill()
	dense_prewarm_tween = null

	if finished_mode == LAYOUT_SCATTER:
		_prewarm_dense_scatter_batch(0, dense_prewarm_members.size())

	super._finish_layout_transition()

	if finished_mode == LAYOUT_SCATTER and board != null:
		var alpha_started_usec: int = Time.get_ticks_usec()
		for value in prepared_members:
			var piece_index: int = int(value)
			if piece_index < 0 or piece_index >= board.pieces.size():
				continue
			var piece = board.pieces[piece_index]
			if not is_instance_valid(piece):
				continue
			piece.modulate = Color.WHITE
		var alpha_work_usec: int = Time.get_ticks_usec() - alpha_started_usec
		print(
			"Pieceful dense Scatter render-hot · %d members · %.2f ms prep · %.2f ms alpha restore"
			% [
				prepared_members.size(),
				float(dense_prewarm_work_usec) / 1000.0,
				float(alpha_work_usec) / 1000.0,
			]
		)

	dense_prewarm_members.clear()
	dense_prewarm_activated.clear()
	dense_prewarm_work_usec = 0
