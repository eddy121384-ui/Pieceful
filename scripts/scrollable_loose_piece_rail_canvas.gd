class_name ScrollableLoosePieceRailCanvas
extends "res://scripts/loose_piece_rail_canvas.gd"

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
	# Rail placement must not leak source-image order. Puzzle piece indexes follow
	# the source grid closely, so a deterministic index sort clusters similar
	# colours and effectively gives the player free image segmentation hints.
	# Shuffle by cluster instead: connected pieces remain rigid, unrelated groups
	# are randomized. The order then stays stable until explicitly reshuffled.
	randomized_cluster_order = _current_cluster_ids()
	randomized_cluster_order.shuffle()
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

	var columns := 1
	var rows := 1
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
		var column := 0
		var row := 0
		if horizontal_flow:
			column = floori(float(ordinal) / float(rows))
			row = ordinal % rows
		else:
			column = ordinal % columns
			row = floori(float(ordinal) / float(columns))

		var relative_bounds: Rect2 = _relative_group_bounds(group, scale_factor)
		var anchor_index: int = int(group[0])
		var anchor_piece = board.pieces[anchor_index]
		var cell_origin := Vector2(
			EDGE_PADDING + float(column) * cell.x,
			EDGE_PADDING + float(row) * cell.y
		)
		var anchor_position := cell_origin - relative_bounds.position

		for value in group:
			var member_index := int(value)
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

	# Newly dropped groups enter a random slot instead of always appearing at the
	# end. Existing groups keep their positions, so normal refreshes never make the
	# Rail visibly reshuffle underneath the player.
	for cluster_id_value in current_ids:
		var cluster_id: int = int(cluster_id_value)
		if randomized_cluster_order.has(cluster_id):
			continue
		var insertion_index: int = randi_range(0, randomized_cluster_order.size())
		randomized_cluster_order.insert(insertion_index, cluster_id)


func _cell_size_for_groups(groups: Array, scale_factor: float) -> Vector2:
	var piece_size: Vector2 = Vector2(board.definition.piece_size) * scale_factor
	var maximum := Vector2(
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
	var result := Rect2()
	var has_bounds := false
	for value in group:
		var member_index := int(value)
		var member = board.pieces[member_index]
		var relative_position: Vector2 = (
			Vector2(member.target_position) - Vector2(anchor_piece.target_position)
		) * scale_factor
		var piece_rect := Rect2(relative_position, piece_size)
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
	var parent_control := get_parent() as Control
	if parent_control != null:
		return parent_control.get_global_rect()
	return get_global_rect()
