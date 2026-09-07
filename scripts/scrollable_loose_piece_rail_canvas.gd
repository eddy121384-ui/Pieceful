class_name ScrollableLoosePieceRailCanvas
extends "res://scripts/loose_piece_rail_canvas.gd"

const ANTI_NEIGHBOR_WINDOW := 6
const ANTI_NEIGHBOR_AXIS_WEIGHT := 0.42
const ANTI_NEIGHBOR_JITTER := 0.38

var horizontal_flow := false
var visible_cross_extent := 180.0
var randomized_cluster_order: Array = []


func _ready() -> void:
	super._ready()
	# The ScrollContainer owns clipping. Keeping this canvas unclipped lets its
	# custom minimum size become the actual scrollable content extent.
	clip_contents = false


func set_scroll_layout(p_horizontal_flow: bool, p_visible_cross_extent: float) -> void:
	horizontal_flow = p_horizontal_flow
	visible_cross_extent = maxf(p_visible_cross_extent, 80.0)
	_layout_groups()
	_rebuild_visuals()
	_update_empty_hint()
	queue_redraw()


func reshuffle_group_order() -> void:
	# A plain Fisher-Yates shuffle is mathematically random, but it can still put
	# several source-neighbour pieces next to each other by chance. Players read
	# that as "not shuffled" and, worse, it can leak source-grid structure.
	# Build a randomized far-from-recent-neighbours order instead. Connected
	# pieces stay one rigid group; only unrelated groups are reordered.
	randomized_cluster_order = _anti_neighbor_order(_current_cluster_ids())
	_layout_groups()
	_rebuild_visuals()
	_update_empty_hint()
	queue_redraw()


func _gui_input(event: InputEvent) -> void:
	super._gui_input(event)
	# A touch that actually grabs a puzzle group belongs to the piece, not to the
	# parent ScrollContainer. Empty-space drags remain unaccepted and therefore
	# naturally scroll the rail.
	if dragging:
		accept_event()


func _layout_groups() -> void:
	positions.clear()
	if board == null or board.definition == null or member_indexes.is_empty():
		custom_minimum_size = Vector2.ZERO
		return

	var groups: Array = _groups_in_display_order()
	var scale_factor: float = visual_scale()
	var cell: Vector2 = _cell_size_for_groups(groups, scale_factor)
	var group_count: int = groups.size()
	if group_count <= 0:
		custom_minimum_size = Vector2.ZERO
		return

	var columns: int = 1
	var rows: int = 1
	if horizontal_flow:
		var usable_height: float = maxf(
			cell.y,
			visible_cross_extent - EDGE_PADDING * 2.0
		)
		rows = maxi(1, floori(usable_height / maxf(cell.y, 1.0)))
		columns = maxi(1, int(ceil(float(group_count) / float(rows))))
		custom_minimum_size = Vector2(
			EDGE_PADDING * 2.0 + float(columns) * cell.x,
			maxf(
				visible_cross_extent,
				EDGE_PADDING * 2.0 + float(rows) * cell.y
			)
		)
	else:
		var usable_width: float = maxf(
			cell.x,
			visible_cross_extent - EDGE_PADDING * 2.0
		)
		columns = maxi(1, floori(usable_width / maxf(cell.x, 1.0)))
		rows = maxi(1, int(ceil(float(group_count) / float(columns))))
		custom_minimum_size = Vector2(
			maxf(
				visible_cross_extent,
				EDGE_PADDING * 2.0 + float(columns) * cell.x
			),
			EDGE_PADDING * 2.0 + float(rows) * cell.y
		)

	for ordinal in range(group_count):
		var group = groups[ordinal]
		if not (group is Array) or group.is_empty():
			continue
		var column: int = 0
		var row: int = 0
		if horizontal_flow:
			column = floori(float(ordinal) / float(rows))
			row = ordinal % rows
		else:
			column = ordinal % columns
			row = floori(float(ordinal) / float(columns))

		var relative_bounds: Rect2 = _relative_group_bounds(group, scale_factor)
		var anchor_index: int = int(group[0])
		var anchor_piece = board.pieces[anchor_index]
		var cell_origin: Vector2 = Vector2(
			EDGE_PADDING + float(column) * cell.x,
			EDGE_PADDING + float(row) * cell.y
		)
		var anchor_position: Vector2 = cell_origin - relative_bounds.position

		for value in group:
			var member_index: int = int(value)
			var member = board.pieces[member_index]
			positions[member_index] = (
				anchor_position
				+ (
					Vector2(member.target_position)
					- Vector2(anchor_piece.target_position)
				) * scale_factor
			)


func _groups_in_display_order() -> Array:
	var groups: Array = []
	if board == null:
		return groups

	_sync_randomized_cluster_order()
	for cluster_id_value in randomized_cluster_order:
		var cluster_id: int = int(cluster_id_value)
		var raw_members = board.cluster_members.get(cluster_id, [])
		if not (raw_members is Array):
			continue
		var group: Array = []
		for member_value in raw_members:
			var member_index: int = int(member_value)
			if member_indexes.has(member_index):
				group.append(member_index)
		if not group.is_empty():
			groups.append(group)
	return groups


func _current_cluster_ids() -> Array:
	var result: Array = []
	if board == null:
		return result
	for value in member_indexes:
		var piece_index: int = int(value)
		var cluster_id: int = int(
			board.cluster_for_piece.get(piece_index, piece_index)
		)
		if not result.has(cluster_id):
			result.append(cluster_id)
	return result


func _sync_randomized_cluster_order() -> void:
	var current_ids: Array = _current_cluster_ids()
	var retained: Array = []
	for cluster_id_value in randomized_cluster_order:
		var cluster_id: int = int(cluster_id_value)
		if current_ids.has(cluster_id):
			retained.append(cluster_id)
	randomized_cluster_order = retained

	# Initial population gets a full anti-neighbour shuffle. Later refreshes keep
	# existing ordering stable so the Rail never visibly scrambles under the user.
	if randomized_cluster_order.is_empty() and current_ids.size() > 1:
		randomized_cluster_order = _anti_neighbor_order(current_ids)
		return

	# Newly dropped groups are inserted into a slot whose nearby Rail neighbours
	# are far away in source-image space. This avoids a newly returned piece
	# accidentally recreating an obvious source row/column streak.
	for cluster_id_value in current_ids:
		var cluster_id: int = int(cluster_id_value)
		if randomized_cluster_order.has(cluster_id):
			continue
		var insertion_index: int = _best_insertion_index(cluster_id)
		randomized_cluster_order.insert(insertion_index, cluster_id)


func _anti_neighbor_order(cluster_ids: Array) -> Array:
	var remaining: Array = cluster_ids.duplicate()
	var ordered: Array = []
	if remaining.is_empty():
		return ordered

	var first_index: int = randi_range(0, remaining.size() - 1)
	ordered.append(int(remaining[first_index]))
	remaining.remove_at(first_index)

	while not remaining.is_empty():
		var best_index: int = 0
		var best_score: float = -INF
		for candidate_index in range(remaining.size()):
			var candidate_id: int = int(remaining[candidate_index])
			var score: float = _candidate_separation_score(candidate_id, ordered)
			score += randf() * ANTI_NEIGHBOR_JITTER
			if score > best_score:
				best_score = score
				best_index = candidate_index
		ordered.append(int(remaining[best_index]))
		remaining.remove_at(best_index)
	return ordered


func _candidate_separation_score(candidate_id: int, ordered: Array) -> float:
	if ordered.is_empty():
		return randf()
	var window_size: int = mini(ANTI_NEIGHBOR_WINDOW, ordered.size())
	var start_index: int = ordered.size() - window_size
	var minimum_score: float = INF
	for ordered_index in range(start_index, ordered.size()):
		var neighbour_id: int = int(ordered[ordered_index])
		minimum_score = minf(
			minimum_score,
			_source_separation(candidate_id, neighbour_id)
		)
	return minimum_score


func _source_separation(cluster_a: int, cluster_b: int) -> float:
	var a: Vector2 = _cluster_source_centroid(cluster_a)
	var b: Vector2 = _cluster_source_centroid(cluster_b)
	var piece_size: Vector2 = Vector2.ONE
	if board != null and board.definition != null:
		piece_size = Vector2(board.definition.piece_size)
	var dx: float = absf(a.x - b.x) / maxf(absf(piece_size.x), 1.0)
	var dy: float = absf(a.y - b.y) / maxf(absf(piece_size.y), 1.0)
	var euclidean: float = sqrt(dx * dx + dy * dy)
	# min(dx, dy) explicitly penalizes same-row / same-column neighbours. Pure
	# Euclidean distance can still consider two far-apart pieces in one source
	# column "well separated", recreating the exact tray pattern users complain
	# about in other jigsaw apps.
	var axis_spread: float = minf(dx, dy)
	return euclidean + axis_spread * ANTI_NEIGHBOR_AXIS_WEIGHT


func _cluster_source_centroid(cluster_id: int) -> Vector2:
	if board == null:
		return Vector2.ZERO
	var raw_members = board.cluster_members.get(cluster_id, [])
	if not (raw_members is Array) or raw_members.is_empty():
		return Vector2.ZERO
	var total := Vector2.ZERO
	var count: int = 0
	for value in raw_members:
		var piece_index: int = int(value)
		if piece_index < 0 or piece_index >= board.pieces.size():
			continue
		var piece = board.pieces[piece_index]
		if not is_instance_valid(piece):
			continue
		total += Vector2(piece.target_position)
		count += 1
	if count <= 0:
		return Vector2.ZERO
	return total / float(count)


func _best_insertion_index(cluster_id: int) -> int:
	if randomized_cluster_order.is_empty():
		return 0
	var best_index: int = 0
	var best_score: float = -INF
	for insertion_index in range(randomized_cluster_order.size() + 1):
		var local_score: float = INF
		var has_neighbour := false
		for offset in [-2, -1, 0, 1]:
			var neighbour_index: int = insertion_index + int(offset)
			if neighbour_index < 0 or neighbour_index >= randomized_cluster_order.size():
				continue
			var neighbour_id: int = int(randomized_cluster_order[neighbour_index])
			local_score = minf(
				local_score,
				_source_separation(cluster_id, neighbour_id)
			)
			has_neighbour = true
		if not has_neighbour:
			local_score = 0.0
		local_score += randf() * ANTI_NEIGHBOR_JITTER
		if local_score > best_score:
			best_score = local_score
			best_index = insertion_index
	return best_index


func _cell_size_for_groups(groups: Array, scale_factor: float) -> Vector2:
	var piece_size: Vector2 = Vector2(board.definition.piece_size) * scale_factor
	var maximum: Vector2 = Vector2(
		maxf(64.0, piece_size.x),
		maxf(64.0, piece_size.y)
	)
	for group in groups:
		if not (group is Array) or group.is_empty():
			continue
		var bounds: Rect2 = _relative_group_bounds(group, scale_factor)
		maximum.x = maxf(maximum.x, bounds.size.x)
		maximum.y = maxf(maximum.y, bounds.size.y)
	return maximum + Vector2(CELL_GAP, CELL_GAP)


func _relative_group_bounds(group: Array, scale_factor: float) -> Rect2:
	if group.is_empty():
		return Rect2()
	var anchor_index: int = int(group[0])
	var anchor_piece = board.pieces[anchor_index]
	var piece_size: Vector2 = Vector2(board.definition.piece_size) * scale_factor
	var result: Rect2 = Rect2()
	var has_bounds := false
	for value in group:
		var member_index: int = int(value)
		var member = board.pieces[member_index]
		var relative_position: Vector2 = (
			Vector2(member.target_position) - Vector2(anchor_piece.target_position)
		) * scale_factor
		var piece_rect: Rect2 = Rect2(relative_position, piece_size)
		if not has_bounds:
			result = piece_rect
			has_bounds = true
		else:
			result = result.merge(piece_rect)
	return result


func _finish_piece_drag(screen_position: Vector2) -> void:
	if not dragging:
		return

	var released_members: Array = drag_member_indexes.duplicate()
	var released_anchor: int = drag_anchor_piece_index
	var released_offset: Vector2 = drag_anchor_pointer_offset
	var released_inside: bool = _visible_global_rect().has_point(screen_position)

	dragging = false
	drag_pointer_id = -999
	drag_anchor_piece_index = -1
	drag_member_indexes.clear()
	drag_last_screen_position = Vector2.ZERO
	drag_anchor_pointer_offset = Vector2.ZERO
	set_process_input(false)

	if not released_inside:
		group_dragged_out.emit(
			released_members,
			released_anchor,
			screen_position,
			released_offset
		)
		return

	_clamp_group_inside(released_members)
	_sync_visual_positions()
	queue_redraw()


func _visible_global_rect() -> Rect2:
	var parent_control: Control = get_parent() as Control
	if parent_control != null:
		return parent_control.get_global_rect()
	return get_global_rect()
