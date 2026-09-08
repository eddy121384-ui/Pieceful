class_name ChaosOrderOptimizedRailCanvas
extends "res://scripts/scrollable_loose_piece_rail_canvas.gd"

const DENSE_RAIL_THRESHOLD := 120
const DENSE_SHUFFLE_SAMPLE := 24

var source_centroid_cache: Dictionary = {}


func configure(p_board, p_member_indexes: Array) -> void:
	var members_changed: bool = not _same_member_set(p_member_indexes)
	var board_changed: bool = board != p_board
	board = p_board
	member_indexes = p_member_indexes.duplicate()
	if members_changed or board_changed:
		source_centroid_cache.clear()

	_layout_groups()
	if members_changed or board_changed or not _visuals_cover_members():
		_rebuild_visuals()
	else:
		_sync_visual_positions()
	_update_empty_hint()
	queue_redraw()


func refresh(p_member_indexes: Array) -> void:
	configure(board, p_member_indexes)


func set_scroll_layout(p_horizontal_flow: bool, p_visible_cross_extent: float) -> void:
	var next_cross_extent: float = maxf(p_visible_cross_extent, 80.0)
	var layout_changed: bool = (
		horizontal_flow != p_horizontal_flow
		or not is_equal_approx(visible_cross_extent, next_cross_extent)
	)
	horizontal_flow = p_horizontal_flow
	visible_cross_extent = next_cross_extent
	if not layout_changed:
		return

	_layout_groups()
	# Reflowing from the provisional canvas size into the final scroll direction
	# must not destroy/recreate hundreds of Polygon2D nodes. Reuse the same nodes
	# and only move them to their new Rail slots.
	if _visuals_cover_members():
		_sync_visual_positions()
	else:
		_rebuild_visuals()
	_update_empty_hint()
	queue_redraw()


func _same_member_set(values: Array) -> bool:
	if values.size() != member_indexes.size():
		return false
	var current: Dictionary = {}
	for value in member_indexes:
		current[int(value)] = true
	for value in values:
		if not current.has(int(value)):
			return false
	return true


func _visuals_cover_members() -> bool:
	if visual_nodes.size() != member_indexes.size():
		return false
	for value in member_indexes:
		var piece_index: int = int(value)
		if not visual_nodes.has(piece_index):
			return false
		var node = visual_nodes[piece_index]
		if not is_instance_valid(node):
			return false
	return true


func _rebuild_visuals() -> void:
	_ensure_content_root()
	_clear_visuals()
	if board == null:
		return

	var scale_factor: float = visual_scale()
	var dense_mode: bool = member_indexes.size() >= DENSE_RAIL_THRESHOLD
	for value in member_indexes:
		var piece_index: int = int(value)
		if piece_index < 0 or piece_index >= board.pieces.size():
			continue
		var source_piece = board.pieces[piece_index]
		if not is_instance_valid(source_piece):
			continue

		var holder := Node2D.new()
		holder.name = "RailPiece_%03d" % piece_index
		holder.position = _piece_position(piece_index)
		holder.scale = Vector2(scale_factor, scale_factor)
		holder.z_index = int(piece_z.get(piece_index, 0))
		content_root.add_child(holder)
		visual_nodes[piece_index] = holder

		var face := Polygon2D.new()
		face.polygon = source_piece.polygon_points
		face.uv = source_piece.uv_points
		face.texture = source_piece.source_texture
		holder.add_child(face)

		# A per-piece Line2D is useful at 40 pieces, but at 286 pieces it creates
		# hundreds of additional nodes and antialiasing work. Dense Rail pieces are
		# already visually separated by spacing, so omit this decorative layer.
		if dense_mode:
			continue
		var outline := Line2D.new()
		var outline_points: PackedVector2Array = source_piece.polygon_points.duplicate()
		if not outline_points.is_empty():
			outline_points.append(outline_points[0])
		outline.points = outline_points
		outline.width = 1.1 / maxf(scale_factor, 0.01)
		outline.default_color = Color(1.0, 1.0, 1.0, 0.58)
		outline.antialiased = true
		holder.add_child(outline)


func _current_cluster_ids() -> Array:
	var result: Array = []
	if board == null:
		return result
	var seen: Dictionary = {}
	for value in member_indexes:
		var piece_index: int = int(value)
		var cluster_id: int = int(
			board.cluster_for_piece.get(piece_index, piece_index)
		)
		if seen.has(cluster_id):
			continue
		seen[cluster_id] = true
		result.append(cluster_id)
	return result


func _sync_randomized_cluster_order() -> void:
	var current_ids: Array = _current_cluster_ids()
	var current_set: Dictionary = {}
	for value in current_ids:
		current_set[int(value)] = true

	var retained: Array = []
	var retained_set: Dictionary = {}
	for cluster_id_value in randomized_cluster_order:
		var cluster_id: int = int(cluster_id_value)
		if current_set.has(cluster_id):
			retained.append(cluster_id)
			retained_set[cluster_id] = true
	randomized_cluster_order = retained

	if randomized_cluster_order.is_empty() and current_ids.size() > 1:
		randomized_cluster_order = _anti_neighbor_order(current_ids)
		return

	for cluster_id_value in current_ids:
		var cluster_id: int = int(cluster_id_value)
		if retained_set.has(cluster_id):
			continue
		var insertion_index: int = _best_insertion_index(cluster_id)
		randomized_cluster_order.insert(insertion_index, cluster_id)
		retained_set[cluster_id] = true


func _groups_in_display_order() -> Array:
	var groups: Array = []
	if board == null:
		return groups

	var member_set: Dictionary = {}
	for value in member_indexes:
		member_set[int(value)] = true

	_sync_randomized_cluster_order()
	for cluster_id_value in randomized_cluster_order:
		var cluster_id: int = int(cluster_id_value)
		var raw_members = board.cluster_members.get(cluster_id, [])
		if not (raw_members is Array):
			continue
		var group: Array = []
		for member_value in raw_members:
			var member_index: int = int(member_value)
			if member_set.has(member_index):
				group.append(member_index)
		if not group.is_empty():
			groups.append(group)
	return groups


func _anti_neighbor_order(cluster_ids: Array) -> Array:
	if cluster_ids.size() < DENSE_RAIL_THRESHOLD:
		return super._anti_neighbor_order(cluster_ids)

	# Full best-of-every-remaining-candidate scoring is O(n²). At ~300 pieces it
	# performs hundreds of thousands of source-distance comparisons just to open
	# the Rail. Sampling up to 24 candidates per slot keeps the same anti-clumping
	# character while making the dense path effectively linear for this prototype.
	var remaining: Array = cluster_ids.duplicate()
	var ordered: Array = []
	if remaining.is_empty():
		return ordered

	var first_index: int = randi_range(0, remaining.size() - 1)
	ordered.append(int(remaining[first_index]))
	remaining.remove_at(first_index)

	while not remaining.is_empty():
		var sample_count: int = mini(DENSE_SHUFFLE_SAMPLE, remaining.size())
		var sampled: Dictionary = {}
		var best_index: int = 0
		var best_score: float = -INF
		var attempts: int = 0
		while sampled.size() < sample_count and attempts < sample_count * 4:
			attempts += 1
			var candidate_index: int = randi_range(0, remaining.size() - 1)
			if sampled.has(candidate_index):
				continue
			sampled[candidate_index] = true
			var candidate_id: int = int(remaining[candidate_index])
			var score: float = _candidate_separation_score(candidate_id, ordered)
			score += randf() * ANTI_NEIGHBOR_JITTER
			if score > best_score:
				best_score = score
				best_index = candidate_index

		if sampled.is_empty():
			best_index = 0
		ordered.append(int(remaining[best_index]))
		remaining.remove_at(best_index)
	return ordered


func _cluster_source_centroid(cluster_id: int) -> Vector2:
	if source_centroid_cache.has(cluster_id):
		return Vector2(source_centroid_cache[cluster_id])
	var centroid: Vector2 = super._cluster_source_centroid(cluster_id)
	source_centroid_cache[cluster_id] = centroid
	return centroid
