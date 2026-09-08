class_name ChaosOrderOptimizedRailCanvas
extends "res://scripts/scrollable_loose_piece_rail_canvas.gd"

const DENSE_RAIL_THRESHOLD := 120
const DENSE_SHUFFLE_SAMPLE := 24
const VIRTUALIZATION_BUFFER := 104.0

var source_centroid_cache: Dictionary = {}
var virtualization_refresh_queued := false
var virtualization_settle_queued := false
var last_virtualized_visual_count := -1


func _ready() -> void:
	super._ready()
	call_deferred("_connect_scroll_virtualization")


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
	_queue_virtualization_settle_refresh()


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
		_queue_virtualization_settle_refresh()
		return

	_layout_groups()
	# Dense Rail keeps only the visible window instantiated. Reflowing the canvas
	# therefore updates the small visible set rather than rebuilding every piece.
	if _dense_virtualization_active():
		_sync_virtual_visuals()
	elif _visuals_cover_members():
		_sync_visual_positions()
	else:
		_rebuild_visuals()
	_update_empty_hint()
	queue_redraw()
	_queue_virtualization_settle_refresh()


func _connect_scroll_virtualization() -> void:
	var scroll: ScrollContainer = get_parent() as ScrollContainer
	if scroll == null:
		return
	var horizontal_bar: HScrollBar = scroll.get_h_scroll_bar()
	var vertical_bar: VScrollBar = scroll.get_v_scroll_bar()
	if horizontal_bar != null:
		var h_callable := Callable(self, "_on_scroll_value_changed")
		if not horizontal_bar.value_changed.is_connected(h_callable):
			horizontal_bar.value_changed.connect(h_callable)
	if vertical_bar != null:
		var v_callable := Callable(self, "_on_scroll_value_changed")
		if not vertical_bar.value_changed.is_connected(v_callable):
			vertical_bar.value_changed.connect(v_callable)
	_queue_virtualization_refresh()


func _on_scroll_value_changed(_value: float) -> void:
	_queue_virtualization_refresh()


func _queue_virtualization_refresh() -> void:
	if not _dense_virtualization_active() or virtualization_refresh_queued:
		return
	virtualization_refresh_queued = true
	call_deferred("_flush_virtualization_refresh")


func _flush_virtualization_refresh() -> void:
	virtualization_refresh_queued = false
	if not _dense_virtualization_active():
		return
	_sync_virtual_visuals()


func _queue_virtualization_settle_refresh() -> void:
	if not _dense_virtualization_active() or virtualization_settle_queued:
		return
	virtualization_settle_queued = true
	call_deferred("_refresh_virtualization_after_layout")


func _refresh_virtualization_after_layout() -> void:
	# ScrollContainer updates its child minimum size/scroll range during the UI
	# layout pass. A dense Rail can be configured earlier in the same frame, so
	# wait one process frame before trusting the viewport window. Without this,
	# first entry can instantiate only a handful of pieces until the user scrolls.
	await get_tree().process_frame
	virtualization_settle_queued = false
	if not _dense_virtualization_active():
		return
	_sync_virtual_visuals()


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


func _dense_virtualization_active() -> bool:
	return member_indexes.size() >= DENSE_RAIL_THRESHOLD


func _visuals_cover_members() -> bool:
	var expected: Array = (
		_visible_member_indexes()
		if _dense_virtualization_active()
		else member_indexes.duplicate()
	)
	if visual_nodes.size() != expected.size():
		return false
	for value in expected:
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

	var dense_mode: bool = _dense_virtualization_active()
	var render_members: Array = (
		_visible_member_indexes()
		if dense_mode
		else member_indexes.duplicate()
	)
	for value in render_members:
		_create_piece_visual(int(value), dense_mode)
	_sync_visual_positions()
	_report_virtualization(render_members.size())


func _sync_virtual_visuals() -> void:
	if not _dense_virtualization_active():
		return
	_ensure_content_root()
	if board == null:
		return

	var desired_members: Array = _visible_member_indexes()
	var desired_set: Dictionary = {}
	for value in desired_members:
		desired_set[int(value)] = true

	var stale_indexes: Array = []
	for piece_index_value in visual_nodes.keys():
		var piece_index: int = int(piece_index_value)
		if not desired_set.has(piece_index):
			stale_indexes.append(piece_index)
	for piece_index_value in stale_indexes:
		var piece_index: int = int(piece_index_value)
		var old_node = visual_nodes.get(piece_index)
		visual_nodes.erase(piece_index)
		if is_instance_valid(old_node):
			old_node.get_parent().remove_child(old_node)
			old_node.queue_free()

	for value in desired_members:
		var piece_index: int = int(value)
		if visual_nodes.has(piece_index) and is_instance_valid(visual_nodes[piece_index]):
			continue
		_create_piece_visual(piece_index, true)

	_sync_visual_positions()
	_report_virtualization(desired_members.size())


func _create_piece_visual(piece_index: int, dense_mode: bool) -> void:
	if board == null or content_root == null:
		return
	if piece_index < 0 or piece_index >= board.pieces.size():
		return
	var source_piece = board.pieces[piece_index]
	if not is_instance_valid(source_piece):
		return

	var scale_factor: float = visual_scale()
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
		return
	var outline := Line2D.new()
	var outline_points: PackedVector2Array = source_piece.polygon_points.duplicate()
	if not outline_points.is_empty():
		outline_points.append(outline_points[0])
	outline.points = outline_points
	outline.width = 1.1 / maxf(scale_factor, 0.01)
	outline.default_color = Color(1.0, 1.0, 1.0, 0.58)
	outline.antialiased = true
	holder.add_child(outline)


func _visible_member_indexes() -> Array:
	var result: Array = []
	if board == null:
		return result
	if not _dense_virtualization_active():
		return member_indexes.duplicate()

	var visible_rect: Rect2 = _visible_local_rect().grow(VIRTUALIZATION_BUFFER)
	if visible_rect.size.x <= 1.0 or visible_rect.size.y <= 1.0:
		# The first configure can happen before the ScrollContainer receives its
		# final size. Render a bounded starter window instead of falling back to all
		# dense nodes; the post-layout refresh fills the real viewport next frame.
		var starter_count: int = mini(32, member_indexes.size())
		for ordinal in range(starter_count):
			result.append(int(member_indexes[ordinal]))
		return result

	var scale_factor: float = visual_scale()
	for value in member_indexes:
		var piece_index: int = int(value)
		if piece_index < 0 or piece_index >= board.pieces.size():
			continue
		var piece = board.pieces[piece_index]
		if not is_instance_valid(piece):
			continue
		var piece_rect := Rect2(
			_piece_position(piece_index),
			Vector2(piece.piece_size) * scale_factor
		)
		if visible_rect.intersects(piece_rect, true):
			result.append(piece_index)
	return result


func _visible_local_rect() -> Rect2:
	var scroll: ScrollContainer = get_parent() as ScrollContainer
	if scroll == null:
		return Rect2(Vector2.ZERO, size)
	if scroll.size.x <= 1.0 or scroll.size.y <= 1.0:
		return Rect2()
	# The Rail canvas is the ScrollContainer content child. Its local viewport is
	# therefore exactly the scroll offsets plus the visible ScrollContainer size.
	# Using global transforms here is fragile during the first layout frame because
	# ScrollContainer is simultaneously repositioning this child.
	return Rect2(
		Vector2(float(scroll.scroll_horizontal), float(scroll.scroll_vertical)),
		scroll.size
	)


func _report_virtualization(rendered_count: int) -> void:
	if not _dense_virtualization_active():
		last_virtualized_visual_count = -1
		return
	if rendered_count == last_virtualized_visual_count:
		return
	last_virtualized_visual_count = rendered_count
	print(
		"Pieceful dense Rail virtualization · %d members · %d visuals"
		% [member_indexes.size(), rendered_count]
	)


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
