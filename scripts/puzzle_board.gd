class_name PuzzleBoard
extends Node2D

signal progress_changed(solved_count: int, total_count: int)
signal completed

const PuzzleDefinitionScript = preload("res://scripts/puzzle_definition.gd")
const PuzzlePieceScript = preload("res://scripts/puzzle_piece.gd")
const DEMO_TEXTURE: Texture2D = preload("res://assets/demo_garden.svg")
const REGRESSION_CUT_PATTERN_PATH := "res://cut_patterns/Classic_012_A.json"
const DEMO_RELAXED_CUT_PATTERN_PATH := "res://cut_patterns/Classic_040_A.json"
const SNAP_RADIUS_RATIO := 0.18
const SCATTER_SEED := 20260831

# The demo artwork is 960x600 = 1.6:1, so the board intentionally preserves that
# native ratio. PuzzleLayoutResolver maps Relaxed ~36 at 1.6:1 to 8x5 = 40 pieces;
# forcing an exact 6x6 would make each cell 1.6:1 and defeat the ratio-aware layout.
var board_rect := Rect2(Vector2(340.0, 105.0), Vector2(600.0, 375.0))
var navigation_rect := Rect2(Vector2.ZERO, Vector2(1280.0, 720.0))
var active_cut_pattern_path := REGRESSION_CUT_PATTERN_PATH
var definition
var pieces: Array[Node] = []
var board_visuals: Array[Node] = []
var solved_count := 0
var z_counter := 10

# Runtime assembly state. Every loose piece starts as a one-piece cluster.
# When neighbouring pieces meet at their correct relative offset, clusters merge.
# Cluster membership is independent of final board placement, so players can build
# islands anywhere on the workspace and move the whole island later.
var cluster_for_piece: Dictionary = {}
var cluster_members: Dictionary = {}


func start_new_game() -> void:
	_clear_previous_game()
	solved_count = 0
	z_counter = 10
	active_cut_pattern_path = _select_runtime_cut_pattern()

	definition = PuzzleDefinitionScript.new(
		DEMO_TEXTURE,
		board_rect,
		active_cut_pattern_path
	)

	_build_board_visuals()
	_build_pieces()
	progress_changed.emit(solved_count, definition.piece_count())


func navigation_bounds() -> Rect2:
	# The current relaxed demo still fits in one 1280x720 workspace. Future
	# panorama/scroll puzzles can widen this rect without changing camera code.
	return navigation_rect


func active_pattern_id() -> String:
	if definition == null or definition.cut_pattern == null:
		return ""
	return str(definition.cut_pattern.pattern_id)


func active_piece_count() -> int:
	if definition == null:
		return 0
	return definition.piece_count()


func using_relaxed_runtime_asset() -> bool:
	return active_cut_pattern_path == DEMO_RELAXED_CUT_PATTERN_PATH


func _select_runtime_cut_pattern() -> String:
	# Authoring approval writes Classic_040_A locally. Once that validated asset
	# exists, Reshuffle/startup automatically graduates the demo from the 12-piece
	# regression fixture to the ratio-correct Relaxed runtime without another code edit.
	if FileAccess.file_exists(DEMO_RELAXED_CUT_PATTERN_PATH):
		return DEMO_RELAXED_CUT_PATTERN_PATH
	return REGRESSION_CUT_PATTERN_PATH


func _clear_previous_game() -> void:
	for piece in pieces:
		if is_instance_valid(piece):
			remove_child(piece)
			piece.queue_free()
	pieces.clear()
	cluster_for_piece.clear()
	cluster_members.clear()

	for visual in board_visuals:
		if is_instance_valid(visual):
			remove_child(visual)
			visual.queue_free()
	board_visuals.clear()


func _build_board_visuals() -> void:
	var background := Polygon2D.new()
	background.name = "BoardBackground"
	background.polygon = PackedVector2Array([
		board_rect.position,
		board_rect.position + Vector2(board_rect.size.x, 0.0),
		board_rect.end,
		board_rect.position + Vector2(0.0, board_rect.size.y),
	])
	background.color = Color(0.11, 0.12, 0.135, 1.0)
	background.z_index = -2
	add_child(background)
	board_visuals.append(background)

	var preview := Sprite2D.new()
	preview.name = "SolvedPreview"
	preview.texture = DEMO_TEXTURE
	preview.position = board_rect.get_center()
	preview.scale = board_rect.size / DEMO_TEXTURE.get_size()
	preview.modulate = Color(1.0, 1.0, 1.0, 0.13)
	preview.z_index = -1
	add_child(preview)
	board_visuals.append(preview)

	var frame := Line2D.new()
	frame.name = "BoardFrame"
	frame.points = PackedVector2Array([
		board_rect.position,
		board_rect.position + Vector2(board_rect.size.x, 0.0),
		board_rect.end,
		board_rect.position + Vector2(0.0, board_rect.size.y),
		board_rect.position,
	])
	frame.width = 2.0
	frame.default_color = Color(1.0, 1.0, 1.0, 0.25)
	frame.antialiased = true
	frame.z_index = 0
	add_child(frame)
	board_visuals.append(frame)


func _build_pieces() -> void:
	var starts := _scatter_positions()

	for index in range(definition.piece_count()):
		var piece = PuzzlePieceScript.new()
		piece.name = "Piece_%03d" % index
		add_child(piece)
		piece.configure(
			index,
			DEMO_TEXTURE,
			definition.target_position_for(index),
			definition.piece_size,
			definition.source_origin_for(index),
			definition.source_cell_size,
			definition.outline_for(index),
			starts[index]
		)
		piece.z_index = z_counter + index
		piece.picked.connect(_on_piece_picked)
		piece.dragged.connect(_on_piece_dragged)
		piece.released.connect(_on_piece_released)
		pieces.append(piece)

		cluster_for_piece[index] = index
		cluster_members[index] = [index]

	z_counter += definition.piece_count()


func _on_piece_picked(piece) -> void:
	var cluster_id := _cluster_id_for(piece.piece_index)
	_raise_cluster(cluster_id)

	# Touch presses are provisionally observed by the camera so empty-space
	# gestures can pan. Once a piece claims that touch, remove it from camera
	# gesture tracking so piece dragging and viewport panning never fight.
	var camera_controller := get_tree().get_first_node_in_group("puzzle_camera_controller")
	if camera_controller != null and camera_controller.has_method("cancel_pointer"):
		camera_controller.cancel_pointer(piece.drag_pointer_id)


func _on_piece_dragged(piece, delta: Vector2) -> void:
	var cluster_id := _cluster_id_for(piece.piece_index)
	for member_index in _cluster_members_for(cluster_id):
		var member = pieces[int(member_index)]
		if member == piece or member.solved:
			continue
		member.global_position += delta


func _on_piece_released(piece) -> void:
	if piece.solved:
		return

	var cluster_id := _cluster_id_for(piece.piece_index)
	cluster_id = _merge_nearby_clusters(cluster_id)
	_snap_cluster_to_board_if_close(cluster_id)


func _merge_nearby_clusters(moving_cluster_id: int) -> int:
	var snap_radius := _snap_radius()
	var merged_again := true

	# A release can bridge more than one island. Keep absorbing neighbouring
	# clusters until no newly connected edge is within snap range.
	while merged_again:
		merged_again = false
		var moving_members := _cluster_members_for(moving_cluster_id).duplicate()

		for member_value in moving_members:
			var member_index := int(member_value)
			var member = pieces[member_index]

			for neighbor_index in definition.neighbor_indexes_for(member_index):
				var other_cluster_id := _cluster_id_for(neighbor_index)
				if other_cluster_id == moving_cluster_id:
					continue

				var neighbor = pieces[neighbor_index]
				var correct_relative_offset: Vector2 = member.target_position - neighbor.target_position
				var desired_member_position: Vector2 = neighbor.position + correct_relative_offset
				var correction: Vector2 = desired_member_position - member.position

				if correction.length() <= snap_radius:
					_translate_cluster(moving_cluster_id, correction)
					_merge_cluster_into(moving_cluster_id, other_cluster_id)
					_raise_cluster(moving_cluster_id)
					merged_again = true
					break

			if merged_again:
				break

	return moving_cluster_id


func _snap_cluster_to_board_if_close(cluster_id: int) -> void:
	var members := _cluster_members_for(cluster_id)
	if members.is_empty():
		return

	var best_distance := 1.0e20
	var best_correction := Vector2.ZERO

	for member_value in members:
		var member = pieces[int(member_value)]
		var correction: Vector2 = member.target_position - member.position
		var distance := correction.length()
		if distance < best_distance:
			best_distance = distance
			best_correction = correction

	if best_distance > _snap_radius():
		return

	# Every cluster was assembled using exact target-relative offsets, therefore
	# aligning any one member to the board aligns the entire cluster.
	_translate_cluster(cluster_id, best_correction)
	_solve_cluster(cluster_id)


func _solve_cluster(cluster_id: int) -> void:
	var newly_solved := 0

	for member_value in _cluster_members_for(cluster_id):
		var member = pieces[int(member_value)]
		if member.solved:
			# A moving island can attach to an already anchored piece. Restore the
			# anchored member exactly in case the small merge correction moved it.
			member.position = member.target_position
			continue
		member.snap_to_target()
		newly_solved += 1

	if newly_solved == 0:
		return

	solved_count += newly_solved
	progress_changed.emit(solved_count, definition.piece_count())

	if solved_count == definition.piece_count():
		completed.emit()


func _merge_cluster_into(survivor_id: int, absorbed_id: int) -> void:
	if survivor_id == absorbed_id:
		return
	if not cluster_members.has(survivor_id) or not cluster_members.has(absorbed_id):
		return

	var survivor_members := _cluster_members_for(survivor_id)
	var absorbed_members := _cluster_members_for(absorbed_id)

	for member_value in absorbed_members:
		var member_index := int(member_value)
		survivor_members.append(member_index)
		cluster_for_piece[member_index] = survivor_id

	cluster_members[survivor_id] = survivor_members
	cluster_members.erase(absorbed_id)


func _translate_cluster(cluster_id: int, delta: Vector2) -> void:
	if delta.is_zero_approx():
		return

	for member_value in _cluster_members_for(cluster_id):
		var member = pieces[int(member_value)]
		member.position += delta


func _raise_cluster(cluster_id: int) -> void:
	for member_value in _cluster_members_for(cluster_id):
		z_counter += 1
		pieces[int(member_value)].z_index = z_counter


func _cluster_id_for(piece_index: int) -> int:
	return int(cluster_for_piece.get(piece_index, piece_index))


func _cluster_members_for(cluster_id: int) -> Array:
	var members = cluster_members.get(cluster_id, [])
	if members is Array:
		return members
	return []


func _snap_radius() -> float:
	return minf(definition.piece_size.x, definition.piece_size.y) * SNAP_RADIUS_RATIO


func _scatter_positions() -> Array[Vector2]:
	# Build deterministic tray slots from the actual piece size instead of a
	# 12-entry hardcoded list. This scales naturally to the first Relaxed runtime
	# (40 pieces for the 1.6:1 demo) and remains usable for denser smoke tests.
	var slots: Array[Vector2] = []
	var piece_size: Vector2 = definition.piece_size
	var top_clearance := 82.0
	var bottom_clearance := 62.0
	var side_margin := 18.0
	var step := Vector2(
		maxf(piece_size.x * 0.82, 38.0),
		maxf(piece_size.y * 0.82, 38.0)
	)
	var minimum := navigation_rect.position + Vector2(side_margin, top_clearance)
	var maximum := navigation_rect.end - piece_size - Vector2(side_margin, bottom_clearance)
	var exclusion := board_rect.grow(12.0)

	var y := minimum.y
	while y <= maximum.y + 0.001:
		var x := minimum.x
		while x <= maximum.x + 0.001:
			var candidate := Vector2(x, y)
			var footprint := Rect2(candidate, piece_size)
			if not footprint.intersects(exclusion):
				slots.append(candidate)
			x += step.x
		y += step.y

	var rng := RandomNumberGenerator.new()
	rng.seed = SCATTER_SEED
	_shuffle_with_rng(slots, rng)

	var requested: int = definition.piece_count()
	if slots.size() < requested:
		# Very dense layouts can exhaust non-overlapping tray slots. Fill the
		# remainder with deterministic, slightly overlapping placements outside the
		# board rather than failing startup; dense navigation will later get a larger
		# content workspace as part of the high-piece-count runtime milestone.
		var attempts := 0
		while slots.size() < requested and attempts < requested * 200:
			attempts += 1
			var candidate := Vector2(
				rng.randf_range(minimum.x, maxf(minimum.x, maximum.x)),
				rng.randf_range(minimum.y, maxf(minimum.y, maximum.y))
			)
			if Rect2(candidate, piece_size).intersects(exclusion):
				continue
			slots.append(candidate)

	while slots.size() < requested:
		# Last-resort safety for pathological future layouts. Keep every piece
		# constructible even if many origins overlap; camera/workspace scaling is a
		# separate product concern and must not become an index-out-of-range crash.
		slots.append(navigation_rect.position + Vector2(side_margin, top_clearance))

	var result: Array[Vector2] = []
	for index in range(requested):
		result.append(slots[index])
	return result


func _shuffle_with_rng(values: Array[Vector2], rng: RandomNumberGenerator) -> void:
	for index in range(values.size() - 1, 0, -1):
		var swap_index := rng.randi_range(0, index)
		var temporary := values[index]
		values[index] = values[swap_index]
		values[swap_index] = temporary
