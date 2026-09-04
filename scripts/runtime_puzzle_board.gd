class_name RuntimePuzzleBoard
extends "res://scripts/puzzle_board.gd"

const RuntimeDifficultyCatalogScript = preload("res://scripts/runtime_difficulty_catalog.gd")
const ResponsiveWorkspaceLayoutScript = preload("res://scripts/responsive_workspace_layout.gd")
const RuntimeSnapPolicyScript = preload("res://scripts/runtime_snap_policy.gd")

var difficulty_catalog = RuntimeDifficultyCatalogScript.new()
var workspace_layout = ResponsiveWorkspaceLayoutScript.new()
var snap_policy = RuntimeSnapPolicyScript.new()
var selected_difficulty_id := "relaxed"
var last_difficulty_error := ""
var workspace_orientation := ""
var last_viewport_size := Vector2.ZERO
var last_difficulty_switch_ms := 0


func difficulty_presets() -> Array:
	return RuntimeDifficultyCatalogScript.PRESETS


func difficulty_available(difficulty_id: String) -> bool:
	return difficulty_catalog.is_available(difficulty_id)


func active_difficulty_id() -> String:
	if active_cut_pattern_path == REGRESSION_CUT_PATTERN_PATH:
		return "regression"
	return selected_difficulty_id


func active_difficulty_label() -> String:
	var preset := difficulty_catalog.preset_for(selected_difficulty_id)
	if preset.is_empty():
		return "Unknown"
	return str(preset["label"])


func workspace_orientation_label() -> String:
	return "Portrait" if workspace_orientation == "portrait" else "Landscape"


func snap_diagnostics() -> Dictionary:
	if definition == null:
		return {}
	return snap_policy.diagnostics(definition.piece_size, _runtime_zoom_scale())


func can_begin_piece_drag(piece, pointer_screen_position: Vector2) -> bool:
	if piece == null or piece.solved or not piece.visible or not piece.input_pickable:
		return false

	var pointer_world := (
		get_viewport().get_canvas_transform().affine_inverse()
		* pointer_screen_position
	)
	var top_piece = null
	var top_z := -2147483648
	var top_order := -1

	# Physics picking is only the broadphase. Resolve the actual winner against the
	# full visible cut polygon and CanvasItem draw order, so an overlapped lower
	# piece can never steal a click merely because PhysicsServer reported it first.
	for candidate in pieces:
		if not is_instance_valid(candidate):
			continue
		if candidate.solved or not candidate.visible or not candidate.input_pickable:
			continue

		var local_point: Vector2 = candidate.to_local(pointer_world)
		if not Geometry2D.is_point_in_polygon(local_point, candidate.polygon_points):
			continue

		var candidate_z := int(candidate.z_index)
		var candidate_order := int(candidate.get_index())
		if (
			top_piece == null
			or candidate_z > top_z
			or (candidate_z == top_z and candidate_order > top_order)
		):
			top_piece = candidate
			top_z = candidate_z
			top_order = candidate_order

	return top_piece == piece


func request_difficulty(difficulty_id: String) -> bool:
	last_difficulty_error = ""
	var preset := difficulty_catalog.preset_for(difficulty_id)
	if preset.is_empty():
		last_difficulty_error = "Unknown difficulty: %s" % difficulty_id
		return false

	var path := str(preset["cut_pattern_path"])
	if not FileAccess.file_exists(path):
		last_difficulty_error = "%s needs approved %s" % [
			str(preset["label"]),
			path.get_file(),
		]
		return false

	var switch_started := Time.get_ticks_msec()
	selected_difficulty_id = difficulty_id
	start_new_game()
	last_difficulty_switch_ms = int(Time.get_ticks_msec() - switch_started)
	print(
		"Piecepace difficulty switch · %s · %d pieces · %d ms"
		% [active_difficulty_label(), active_piece_count(), last_difficulty_switch_ms]
	)
	return true


func apply_viewport_layout(viewport_size: Vector2) -> bool:
	var layout: Dictionary = workspace_layout.resolve(viewport_size, board_rect.size)
	var previous_orientation := workspace_orientation
	var previous_board_rect := board_rect
	var previous_navigation_rect := navigation_rect
	var next_board_rect: Rect2 = layout["board_rect"]
	var next_navigation_rect: Rect2 = layout["navigation_rect"]

	workspace_orientation = str(layout["orientation"])
	last_viewport_size = viewport_size

	var orientation_changed := (
		not previous_orientation.is_empty()
		and previous_orientation != workspace_orientation
	)
	var rect_changed := (
		not previous_board_rect.position.is_equal_approx(next_board_rect.position)
		or not previous_board_rect.size.is_equal_approx(next_board_rect.size)
		or not previous_navigation_rect.position.is_equal_approx(next_navigation_rect.position)
		or not previous_navigation_rect.size.is_equal_approx(next_navigation_rect.size)
	)

	board_rect = next_board_rect
	navigation_rect = next_navigation_rect

	if definition != null and rect_changed:
		_clear_active_drag_cache()
		_reflow_existing_state(previous_board_rect, previous_navigation_rect)
		_rebuild_board_visuals()

	return orientation_changed


func _select_runtime_cut_pattern() -> String:
	var preset := difficulty_catalog.preset_for(selected_difficulty_id)
	if not preset.is_empty():
		var path := str(preset["cut_pattern_path"])
		if FileAccess.file_exists(path):
			return path

	# Preserve the tiny regression fixture as a startup safety net only. Player
	# difficulty changes never silently fall back: request_difficulty() rejects a
	# missing curated asset before restarting the current game.
	return REGRESSION_CUT_PATTERN_PATH


func _snap_radius() -> float:
	if definition == null:
		return 0.0
	return snap_policy.radius_world(definition.piece_size, _runtime_zoom_scale())


func _runtime_zoom_scale() -> float:
	var camera_controller := get_tree().get_first_node_in_group("puzzle_camera_controller")
	if camera_controller == null:
		return 1.0
	return maxf(float(camera_controller.zoom.x), 0.01)


func _reflow_existing_state(previous_board_rect: Rect2, previous_navigation_rect: Rect2) -> void:
	# The board keeps the same physical play-surface size, so approved piece
	# geometry never changes during orientation switches. Only target positions and
	# workspace placement move.
	definition.board_rect = board_rect
	for piece in pieces:
		piece.target_position = definition.target_position_for(piece.piece_index)

	var board_delta := board_rect.position - previous_board_rect.position
	var old_width := maxf(previous_navigation_rect.size.x, 1.0)
	var old_height := maxf(previous_navigation_rect.size.y, 1.0)

	# Reflow one cluster at a time. Mapping individual pieces would distort a
	# preassembled island when portrait/landscape have different workspace ratios.
	# Moving the cluster centroid preserves exact neighbor-relative offsets.
	for cluster_key in cluster_members.keys():
		var members: Array = _cluster_members_for(int(cluster_key))
		if members.is_empty():
			continue

		var centroid := Vector2.ZERO
		var contains_solved := false
		for member_value in members:
			var member = pieces[int(member_value)]
			centroid += member.position
			contains_solved = contains_solved or member.solved
		centroid /= float(members.size())

		var translation := board_delta
		if not contains_solved:
			var normalized := Vector2(
				clampf(
					(centroid.x - previous_navigation_rect.position.x) / old_width,
					0.0,
					1.0
				),
				clampf(
					(centroid.y - previous_navigation_rect.position.y) / old_height,
					0.0,
					1.0
				)
			)
			var next_centroid := navigation_rect.position + normalized * navigation_rect.size
			translation = next_centroid - centroid

		for member_value in members:
			var member = pieces[int(member_value)]
			member.position += translation
			if member.solved:
				member.position = member.target_position


func _rebuild_board_visuals() -> void:
	for visual in board_visuals:
		if is_instance_valid(visual):
			remove_child(visual)
			visual.queue_free()
	board_visuals.clear()
	_build_board_visuals()
