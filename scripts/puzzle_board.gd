class_name PuzzleBoard
extends Node2D

signal progress_changed(solved_count: int, total_count: int)
signal completed

const PuzzleDefinitionScript = preload("res://scripts/puzzle_definition.gd")
const PuzzlePieceScript = preload("res://scripts/puzzle_piece.gd")
const DEMO_TEXTURE: Texture2D = preload("res://assets/demo_garden.svg")
const CUT_PATTERN_PATH := "res://cut_patterns/Classic_012_A.json"
const SNAP_RADIUS_RATIO := 0.18

var board_rect := Rect2(Vector2(340.0, 105.0), Vector2(600.0, 375.0))
var navigation_rect := Rect2(Vector2.ZERO, Vector2(1280.0, 720.0))
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

	definition = PuzzleDefinitionScript.new(
		DEMO_TEXTURE,
		board_rect,
		CUT_PATTERN_PATH
	)

	_build_board_visuals()
	_build_pieces()
	progress_changed.emit(solved_count, definition.piece_count())


func navigation_bounds() -> Rect2:
	# V0-01 keeps the historical 1280x720 workspace so the existing 12-piece
	# regression layout opens exactly as before. Future panorama/scroll puzzles
	# can widen this rect without changing the camera controller itself.
	return navigation_rect


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
		piece.name = "Piece_%02d" % index
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
	var positions: Array[Vector2] = [
		Vector2(38.0, 90.0),
		Vector2(182.0, 70.0),
		Vector2(40.0, 250.0),
		Vector2(185.0, 255.0),
		Vector2(42.0, 438.0),
		Vector2(188.0, 465.0),
		Vector2(972.0, 88.0),
		Vector2(1110.0, 72.0),
		Vector2(974.0, 250.0),
		Vector2(1110.0, 260.0),
		Vector2(974.0, 438.0),
		Vector2(1106.0, 468.0),
	]

	var rng := RandomNumberGenerator.new()
	rng.seed = 20260831

	for index in range(positions.size()):
		positions[index] += Vector2(
			rng.randf_range(-10.0, 10.0),
			rng.randf_range(-10.0, 10.0)
		)

	positions.shuffle()
	return positions
