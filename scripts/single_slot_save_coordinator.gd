class_name SingleSlotSaveCoordinator
extends Node

const SCHEMA_VERSION := 1
const SAVE_PATH := "user://pieceful_autosave_v1.json"
const AUTOSAVE_SECONDS := 2.5

var board = null
var workspace = null
var autosave_timer: Timer = null
var bootstrapping := true
var resume_attempted := false
var resume_succeeded := false
var last_save_error := ""
var last_resume_error := ""
var last_snapshot_json := ""


func _ready() -> void:
	call_deferred("_bootstrap")


func _bootstrap() -> void:
	board = get_parent().get_node_or_null("PuzzleBoard")
	workspace = get_parent().get_node_or_null("SortingWorkspace")
	if board == null or workspace == null:
		last_resume_error = "Save coordinator could not find PuzzleBoard / SortingWorkspace"
		bootstrapping = false
		return

	await get_tree().process_frame
	await get_tree().process_frame
	await get_tree().process_frame

	resume_attempted = true
	if FileAccess.file_exists(SAVE_PATH):
		resume_succeeded = await _resume_from_disk()

	bootstrapping = false
	_start_autosave_timer()
	last_snapshot_json = JSON.stringify(_capture_snapshot())


func _start_autosave_timer() -> void:
	autosave_timer = Timer.new()
	autosave_timer.one_shot = false
	autosave_timer.wait_time = AUTOSAVE_SECONDS
	autosave_timer.timeout.connect(_on_autosave_timeout)
	add_child(autosave_timer)
	autosave_timer.start()


func _on_autosave_timeout() -> void:
	if bootstrapping:
		return
	save_now(false)


func save_now(force_write: bool = true) -> bool:
	last_save_error = ""
	if board == null or workspace == null or board.definition == null:
		last_save_error = "Runtime is not ready"
		return false

	var snapshot: Dictionary = _capture_snapshot()
	var encoded := JSON.stringify(snapshot)
	if not force_write and encoded == last_snapshot_json:
		return true

	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		last_save_error = "Could not open autosave file"
		return false
	file.store_string(encoded)
	file.flush()
	file.close()
	last_snapshot_json = encoded
	return true


func clear_save() -> bool:
	last_save_error = ""
	if not FileAccess.file_exists(SAVE_PATH):
		last_snapshot_json = ""
		return true
	var error := DirAccess.remove_absolute(ProjectSettings.globalize_path(SAVE_PATH))
	if error != OK:
		last_save_error = "Could not remove autosave: %s" % error_string(error)
		return false
	last_snapshot_json = ""
	return true


func resume_available() -> bool:
	return FileAccess.file_exists(SAVE_PATH)


func diagnostics() -> Dictionary:
	return {
		"schema_version": SCHEMA_VERSION,
		"save_path": SAVE_PATH,
		"resume_attempted": resume_attempted,
		"resume_succeeded": resume_succeeded,
		"last_save_error": last_save_error,
		"last_resume_error": last_resume_error,
	}


func _capture_snapshot() -> Dictionary:
	var navigation: Rect2 = Rect2(board.navigation_rect)
	var layout_mode := str(workspace.loose_layout_mode)
	var piece_rows: Array = []
	for piece_value in board.pieces:
		var piece = piece_value
		if not is_instance_valid(piece):
			continue
		var piece_index: int = int(piece.piece_index)
		var location := str(workspace.state.location_for(piece_index))
		var row := {
			"index": piece_index,
			"location": location,
			"rotation": float(piece.rotation),
			"z": int(piece.z_index),
			"solved": bool(piece.solved),
		}
		if location == "loose" and layout_mode == "scatter" and not bool(piece.solved):
			row["position_norm"] = _position_to_normalized(Vector2(piece.position), navigation)
		piece_rows.append(row)

	var cluster_rows: Array = []
	var cluster_ids: Array = board.cluster_members.keys()
	cluster_ids.sort()
	for cluster_id_value in cluster_ids:
		var raw_members = board.cluster_members.get(cluster_id_value, [])
		if not (raw_members is Array):
			continue
		var members: Array = []
		for member_value in raw_members:
			members.append(int(member_value))
		members.sort()
		cluster_rows.append(members)

	return {
		"schema_version": SCHEMA_VERSION,
		"slot": "autosave",
		"captured_at_unix": int(Time.get_unix_time_from_system()),
		"puzzle": {
			"difficulty_id": str(board.active_difficulty_id()),
			"pattern_id": str(board.active_pattern_id()),
			"piece_count": int(board.active_piece_count()),
		},
		"board": {
			"navigation_size": _vector_to_array(navigation.size),
			"z_counter": int(board.z_counter),
			"solved_count": int(board.solved_count),
			"pieces": piece_rows,
			"clusters": cluster_rows,
		},
		"workspace": _capture_workspace_state(layout_mode),
	}


func _capture_workspace_state(layout_mode: String) -> Dictionary:
	var trays: Array = []
	for tray_id_value in workspace.state.tray_order:
		var tray_id := str(tray_id_value)
		var members: Array = []
		for member_value in workspace.state.tray_piece_indexes(tray_id):
			members.append(int(member_value))

		var positions := {}
		var stored_positions = workspace.state.tray_piece_positions.get(tray_id, {})
		if stored_positions is Dictionary:
			for piece_key in stored_positions.keys():
				positions[str(int(piece_key))] = _vector_to_array(Vector2(stored_positions[piece_key]))

		var collapsed := false
		if workspace.state.has_method("tray_is_collapsed"):
			collapsed = bool(workspace.state.tray_is_collapsed(tray_id))
		trays.append({
			"id": tray_id,
			"name": str(workspace.state.tray_name(tray_id)),
			"members": members,
			"collapsed": collapsed,
			"piece_positions_local": positions,
		})

	return {
		"loose_layout_mode": layout_mode,
		"next_tray_number": int(workspace.state.next_tray_number),
		"trays": trays,
	}


func _resume_from_disk() -> bool:
	last_resume_error = ""
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		last_resume_error = "Could not read autosave file"
		return false
	var encoded := file.get_as_text()
	file.close()
	var parsed = JSON.parse_string(encoded)
	if not (parsed is Dictionary):
		last_resume_error = "Autosave JSON is invalid"
		return false
	var snapshot: Dictionary = parsed
	if int(snapshot.get("schema_version", -1)) != SCHEMA_VERSION:
		last_resume_error = "Unsupported autosave schema"
		return false

	var puzzle = snapshot.get("puzzle", {})
	if not (puzzle is Dictionary):
		last_resume_error = "Autosave puzzle metadata missing"
		return false
	var difficulty_id := str(puzzle.get("difficulty_id", ""))
	if difficulty_id.is_empty() or not board.request_difficulty(difficulty_id):
		last_resume_error = "Could not restore difficulty: %s" % difficulty_id
		return false

	await get_tree().process_frame
	await get_tree().process_frame

	var expected_count := int(puzzle.get("piece_count", -1))
	if expected_count != board.active_piece_count():
		last_resume_error = "Piece-count mismatch: save %d runtime %d" % [
			expected_count,
			board.active_piece_count(),
		]
		return false

	var board_state = snapshot.get("board", {})
	var workspace_state = snapshot.get("workspace", {})
	if not (board_state is Dictionary) or not (workspace_state is Dictionary):
		last_resume_error = "Autosave runtime state missing"
		return false

	_restore_clusters(board_state)
	_restore_piece_runtime(board_state, workspace_state)
	_restore_workspace_state(workspace_state)

	if board.has_method("_configure_spatial_runtime"):
		board._configure_spatial_runtime()
	if board.has_method("mark_spatial_index_dirty"):
		board.mark_spatial_index_dirty()

	workspace._refresh_ui()
	workspace._layout_ui()
	board.progress_changed.emit(board.solved_count, board.active_piece_count())
	print(
		"Pieceful resume · schema %d · %s · %d pieces · %d solved · %s"
		% [
			SCHEMA_VERSION,
			difficulty_id,
			board.active_piece_count(),
			board.solved_count,
			str(workspace.loose_layout_mode),
		]
	)
	return true


func _restore_clusters(board_state: Dictionary) -> void:
	board.cluster_for_piece.clear()
	board.cluster_members.clear()
	var assigned := {}
	var clusters = board_state.get("clusters", [])
	if clusters is Array:
		for cluster_value in clusters:
			if not (cluster_value is Array) or cluster_value.is_empty():
				continue
			var members: Array = []
			for member_value in cluster_value:
				var piece_index := int(member_value)
				if piece_index < 0 or piece_index >= board.pieces.size() or assigned.has(piece_index):
					continue
				members.append(piece_index)
				assigned[piece_index] = true
			if members.is_empty():
				continue
			var cluster_id: int = int(members[0])
			board.cluster_members[cluster_id] = members
			for piece_index in members:
				board.cluster_for_piece[int(piece_index)] = cluster_id

	for piece_index in range(board.pieces.size()):
		if assigned.has(piece_index):
			continue
		board.cluster_for_piece[piece_index] = piece_index
		board.cluster_members[piece_index] = [piece_index]


func _restore_piece_runtime(board_state: Dictionary, workspace_state: Dictionary) -> void:
	var navigation: Rect2 = Rect2(board.navigation_rect)
	var saved_layout_mode := str(workspace_state.get("loose_layout_mode", "scatter"))
	var solved_total := 0
	var highest_z := 10
	var rows = board_state.get("pieces", [])
	if rows is Array:
		for row_value in rows:
			if not (row_value is Dictionary):
				continue
			var row: Dictionary = row_value
			var piece_index := int(row.get("index", -1))
			if piece_index < 0 or piece_index >= board.pieces.size():
				continue
			var piece = board.pieces[piece_index]
			if not is_instance_valid(piece):
				continue

			piece.rotation = float(row.get("rotation", 0.0))
			var solved := bool(row.get("solved", false))
			var z_value := int(row.get("z", piece.z_index))
			highest_z = maxi(highest_z, z_value)
			if solved:
				piece.solved = true
				piece.dragging = false
				piece.drag_pointer_id = -999
				piece.set_process_input(false)
				piece.input_pickable = false
				piece.position = Vector2(piece.target_position)
				piece.z_index = 1
				var shadow = piece.get_node_or_null("Shadow")
				if shadow != null:
					shadow.visible = false
				solved_total += 1
			else:
				piece.solved = false
				piece.visible = true
				piece.modulate = Color.WHITE
				piece.z_index = z_value
				if saved_layout_mode == "scatter" and row.has("position_norm"):
					piece.position = _normalized_to_position(row["position_norm"], navigation)

	board.solved_count = solved_total
	board.z_counter = maxi(int(board_state.get("z_counter", highest_z)), highest_z)


func _restore_workspace_state(workspace_state: Dictionary) -> void:
	workspace.state.reset(board.pieces.size())
	var trays = workspace_state.get("trays", [])
	if trays is Array:
		for tray_value in trays:
			if not (tray_value is Dictionary):
				continue
			var tray: Dictionary = tray_value
			var tray_id := str(tray.get("id", ""))
			if tray_id.is_empty():
				continue
			workspace.state.tray_order.append(tray_id)
			workspace.state.tray_names[tray_id] = str(tray.get("name", tray_id))
			workspace.state.tray_members[tray_id] = []
			workspace.state.tray_piece_positions[tray_id] = {}
			if workspace.state.has_method("set_tray_collapsed"):
				workspace.state.tray_collapsed[tray_id] = bool(tray.get("collapsed", false))

			var members = tray.get("members", [])
			if members is Array:
				for member_value in members:
					var piece_index := int(member_value)
					if piece_index < 0 or piece_index >= board.pieces.size():
						continue
					var tray_members: Array = workspace.state.tray_members[tray_id]
					if not tray_members.has(piece_index):
						tray_members.append(piece_index)
					workspace.state.tray_members[tray_id] = tray_members
					workspace.state.piece_locations[piece_index] = "tray"
					workspace.state.tray_for_piece[piece_index] = tray_id

			var positions = tray.get("piece_positions_local", {})
			if positions is Dictionary:
				for piece_key in positions.keys():
					var piece_index := int(str(piece_key))
					workspace.state.set_tray_piece_position(
						tray_id,
						piece_index,
						_array_to_vector(positions[piece_key])
					)

	workspace.state.next_tray_number = maxi(
		1,
		int(workspace_state.get("next_tray_number", workspace.state.tray_order.size() + 1))
	)
	for piece_value in board.pieces:
		var piece = piece_value
		if is_instance_valid(piece) and bool(piece.solved):
			workspace.state.mark_piece_on_board(int(piece.piece_index))

	workspace._restash_tray_pieces()
	var saved_mode := str(workspace_state.get("loose_layout_mode", "scatter"))
	if saved_mode != "rail":
		saved_mode = "scatter"
	if str(workspace.loose_layout_mode) != saved_mode:
		workspace._set_loose_layout_mode(saved_mode)


func _position_to_normalized(position: Vector2, rect: Rect2) -> Array:
	var width := maxf(rect.size.x, 1.0)
	var height := maxf(rect.size.y, 1.0)
	return [
		(position.x - rect.position.x) / width,
		(position.y - rect.position.y) / height,
	]


func _normalized_to_position(value, rect: Rect2) -> Vector2:
	var normalized := _array_to_vector(value)
	return rect.position + normalized * rect.size


func _vector_to_array(value: Vector2) -> Array:
	return [float(value.x), float(value.y)]


func _array_to_vector(value) -> Vector2:
	if not (value is Array) or value.size() < 2:
		return Vector2.ZERO
	return Vector2(float(value[0]), float(value[1]))
