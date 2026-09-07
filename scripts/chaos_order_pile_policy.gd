class_name ChaosOrderPilePolicy
extends RefCounted

const PILE_BOARD_CLEARANCE := 14.0
const PILE_REGION_MARGIN := 18.0
const PILE_SEED_SALT := 15031

var rng := RandomNumberGenerator.new()


func arrange_loose_pile(board) -> Rect2:
	if board == null or board.definition == null or board.pieces.is_empty():
		return Rect2()

	var region: Rect2 = _largest_pile_region(board)
	if region.size.x <= 1.0 or region.size.y <= 1.0:
		return Rect2()

	var piece_size: Vector2 = Vector2(board.definition.piece_size)
	var usable_region: Rect2 = region.grow(-PILE_REGION_MARGIN)
	if usable_region.size.x < piece_size.x or usable_region.size.y < piece_size.y:
		usable_region = region

	rng.seed = int(Time.get_ticks_usec()) ^ (int(board.pieces.size()) * PILE_SEED_SALT)
	var order: Array[int] = []
	for index in range(board.pieces.size()):
		order.append(index)
	_shuffle_ints(order)

	var radius_x: float = minf(
		maxf(piece_size.x * 3.5, 56.0),
		maxf(piece_size.x, usable_region.size.x * 0.34)
	)
	var radius_y: float = minf(
		maxf(piece_size.y * 5.0, 72.0),
		maxf(piece_size.y, usable_region.size.y * 0.34)
	)
	var center: Vector2 = usable_region.get_center()

	board.z_counter += board.pieces.size() + 1
	var base_z: int = int(board.z_counter)
	for ordinal in range(order.size()):
		var piece_index: int = int(order[ordinal])
		var piece = board.pieces[piece_index]
		if not is_instance_valid(piece) or bool(piece.solved):
			continue

		var angle: float = rng.randf_range(0.0, TAU)
		var radial: float = sqrt(rng.randf())
		var wobble := Vector2(
			cos(angle) * radius_x * radial,
			sin(angle) * radius_y * radial
		)
		var candidate: Vector2 = center + wobble - piece_size * 0.5
		candidate.x = clampf(
			candidate.x,
			usable_region.position.x,
			maxf(usable_region.position.x, usable_region.end.x - piece_size.x)
		)
		candidate.y = clampf(
			candidate.y,
			usable_region.position.y,
			maxf(usable_region.position.y, usable_region.end.y - piece_size.y)
		)

		piece.position = candidate
		piece.visible = true
		piece.input_pickable = true
		piece.z_index = base_z + ordinal

	board.z_counter = base_z + order.size()
	return Rect2(center - Vector2(radius_x, radius_y), Vector2(radius_x, radius_y) * 2.0)


func spread_at_world(
	board,
	world_position: Vector2,
	radius_world: float,
	strength_world: float
) -> int:
	if (
		board == null
		or board.definition == null
		or radius_world <= 0.001
		or strength_world <= 0.001
	):
		return 0

	var seen_clusters: Dictionary = {}
	var moved_clusters: int = 0
	var piece_size: Vector2 = Vector2(board.definition.piece_size)

	for piece_value in board.pieces:
		var piece = piece_value
		if (
			not is_instance_valid(piece)
			or bool(piece.solved)
			or not bool(piece.visible)
			or not bool(piece.input_pickable)
		):
			continue

		var piece_index: int = int(piece.piece_index)
		var cluster_id: int = int(
			board.cluster_for_piece.get(piece_index, piece_index)
		)
		if seen_clusters.has(cluster_id):
			continue
		seen_clusters[cluster_id] = true

		var members_value = board.cluster_members.get(cluster_id, [])
		if not (members_value is Array):
			continue
		var members: Array = members_value
		if members.is_empty():
			continue

		var center: Vector2 = _cluster_center(board, members, piece_size)
		var distance: float = center.distance_to(world_position)
		if distance > radius_world:
			continue

		var direction: Vector2 = center - world_position
		if direction.length_squared() <= 0.0001:
			var deterministic_angle: float = fmod(float(abs(cluster_id)) * 2.39996323, TAU)
			direction = Vector2(cos(deterministic_angle), sin(deterministic_angle))
		else:
			direction = direction.normalized()

		var falloff: float = pow(clampf(1.0 - distance / radius_world, 0.0, 1.0), 0.72)
		var delta: Vector2 = direction * strength_world * falloff
		delta = _safe_cluster_delta(board, members, delta, piece_size)
		if delta.is_zero_approx():
			continue

		if board.has_method("_translate_cluster"):
			board._translate_cluster(cluster_id, delta)
		else:
			for member_value in members:
				var member_index: int = int(member_value)
				board.pieces[member_index].position += delta
		if board.has_method("_raise_cluster"):
			board._raise_cluster(cluster_id)
		moved_clusters += 1

	return moved_clusters


func _largest_pile_region(board) -> Rect2:
	var nav: Rect2 = Rect2(board.navigation_rect)
	var board_rect: Rect2 = Rect2(board.board_rect).grow(PILE_BOARD_CLEARANCE)
	var candidates: Array[Rect2] = []

	var left_width: float = maxf(0.0, board_rect.position.x - nav.position.x)
	if left_width > 1.0:
		candidates.append(Rect2(nav.position, Vector2(left_width, nav.size.y)))

	var right_width: float = maxf(0.0, nav.end.x - board_rect.end.x)
	if right_width > 1.0:
		candidates.append(Rect2(
			Vector2(board_rect.end.x, nav.position.y),
			Vector2(right_width, nav.size.y)
		))

	var top_height: float = maxf(0.0, board_rect.position.y - nav.position.y)
	if top_height > 1.0:
		candidates.append(Rect2(nav.position, Vector2(nav.size.x, top_height)))

	var bottom_height: float = maxf(0.0, nav.end.y - board_rect.end.y)
	if bottom_height > 1.0:
		candidates.append(Rect2(
			Vector2(nav.position.x, board_rect.end.y),
			Vector2(nav.size.x, bottom_height)
		))

	var best := Rect2()
	var best_area: float = -1.0
	for candidate in candidates:
		var area: float = candidate.size.x * candidate.size.y
		if area > best_area:
			best = candidate
			best_area = area
	return best


func _cluster_center(board, members: Array, piece_size: Vector2) -> Vector2:
	var total := Vector2.ZERO
	var count: int = 0
	for member_value in members:
		var member_index: int = int(member_value)
		if member_index < 0 or member_index >= board.pieces.size():
			continue
		var member = board.pieces[member_index]
		if not is_instance_valid(member):
			continue
		total += Vector2(member.position) + piece_size * 0.5
		count += 1
	if count <= 0:
		return Vector2.ZERO
	return total / float(count)


func _cluster_bounds(board, members: Array, piece_size: Vector2) -> Rect2:
	var result := Rect2()
	var has_bounds := false
	for member_value in members:
		var member_index: int = int(member_value)
		if member_index < 0 or member_index >= board.pieces.size():
			continue
		var member = board.pieces[member_index]
		if not is_instance_valid(member):
			continue
		var piece_rect := Rect2(Vector2(member.position), piece_size)
		if not has_bounds:
			result = piece_rect
			has_bounds = true
		else:
			result = result.merge(piece_rect)
	return result


func _safe_cluster_delta(
	board,
	members: Array,
	delta: Vector2,
	piece_size: Vector2
) -> Vector2:
	var bounds: Rect2 = _cluster_bounds(board, members, piece_size)
	if bounds.size.x <= 0.0 or bounds.size.y <= 0.0:
		return Vector2.ZERO

	var nav: Rect2 = Rect2(board.navigation_rect).grow(-8.0)
	var next_bounds := Rect2(bounds.position + delta, bounds.size)
	if next_bounds.position.x < nav.position.x:
		delta.x += nav.position.x - next_bounds.position.x
	elif next_bounds.end.x > nav.end.x:
		delta.x -= next_bounds.end.x - nav.end.x
	if next_bounds.position.y < nav.position.y:
		delta.y += nav.position.y - next_bounds.position.y
	elif next_bounds.end.y > nav.end.y:
		delta.y -= next_bounds.end.y - nav.end.y

	next_bounds = Rect2(bounds.position + delta, bounds.size)
	var board_exclusion: Rect2 = Rect2(board.board_rect).grow(8.0)
	if next_bounds.intersects(board_exclusion):
		return Vector2.ZERO
	return delta


func _shuffle_ints(values: Array[int]) -> void:
	for index in range(values.size() - 1, 0, -1):
		var swap_index: int = rng.randi_range(0, index)
		var temporary: int = values[index]
		values[index] = values[swap_index]
		values[swap_index] = temporary
