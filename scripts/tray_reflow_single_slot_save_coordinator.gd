extends "res://scripts/orientation_safe_single_slot_save_coordinator.gd"

# V1 additive metadata: Tray local positions are paired with the mini-table size
# that produced them. Older V1 saves omit this field and remain loadable; they
# adopt the destination size on first open and are safely clamped there.
#
# Autosave comparisons deliberately use a stable gameplay snapshot. Wall-clock
# capture time is attached only when a file is actually written, otherwise the
# 2.5-second autosave timer would make every unchanged snapshot look dirty.


func save_now(force_write: bool = true) -> bool:
	last_save_error = ""
	if board == null or workspace == null or board.definition == null:
		last_save_error = "Runtime is not ready"
		return false

	return _write_stable_snapshot(_capture_snapshot(), force_write)


func _write_stable_snapshot(stable_snapshot: Dictionary, force_write: bool) -> bool:
	var stable_encoded := JSON.stringify(stable_snapshot)
	if not force_write and stable_encoded == last_snapshot_json:
		return true

	var persisted_snapshot: Dictionary = stable_snapshot.duplicate(true)
	persisted_snapshot["captured_at_unix"] = int(Time.get_unix_time_from_system())
	var encoded := JSON.stringify(persisted_snapshot)

	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		last_save_error = "Could not open autosave file"
		return false
	file.store_string(encoded)
	file.flush()
	file.close()
	last_snapshot_json = stable_encoded
	return true


func _capture_snapshot() -> Dictionary:
	var snapshot: Dictionary = super._capture_snapshot()
	# The base V1 schema historically put capture time inside the runtime snapshot.
	# Keep the persisted field for compatibility, but exclude it from dirty-state
	# comparison. save_now() adds a fresh timestamp only on an actual disk write.
	snapshot.erase("captured_at_unix")
	return snapshot


func _resume_from_disk() -> bool:
	var restored: bool = await super._resume_from_disk()
	if restored:
		_sync_parent_presentation_after_resume()
	return restored


func _sync_parent_presentation_after_resume() -> void:
	# Main builds one default Relaxed/40 presentation during its own _ready().
	# SaveCoordinator restores the real puzzle a few frames later. The puzzle
	# pieces/definition are therefore correct, but Main-owned presentation caches
	# (especially BoardCutLinesOverlay) can still describe the bootstrap 40-piece
	# board. Refresh those caches only after the save restore has fully completed.
	var main := get_parent()
	if main == null:
		return

	if main.has_method("_refresh_board_lines_overlay"):
		main.call("_refresh_board_lines_overlay")
	if main.has_method("_refresh_difficulty_control"):
		main.call("_refresh_difficulty_control")
	if main.has_method("_refresh_aid_controls"):
		main.call("_refresh_aid_controls")
	if main.has_method("_update_runtime_label"):
		main.call("_update_runtime_label")

	var camera = main.get_node_or_null("PuzzleCamera")
	if camera != null and camera.has_method("set_content_rect"):
		camera.set_content_rect(board.navigation_bounds(), true)


func _capture_workspace_state(layout_mode: String) -> Dictionary:
	var workspace_state: Dictionary = super._capture_workspace_state(layout_mode)
	var trays = workspace_state.get("trays", [])
	if not (trays is Array):
		return workspace_state

	for tray_value in trays:
		if not (tray_value is Dictionary):
			continue
		var tray: Dictionary = tray_value
		var tray_id: String = str(tray.get("id", ""))
		if tray_id.is_empty():
			continue
		if workspace.state.has_method("tray_position_reference_size"):
			tray["position_reference_size"] = _vector_to_array(
				Vector2(workspace.state.tray_position_reference_size(tray_id))
			)

	workspace_state["trays"] = trays
	return workspace_state


func _restore_workspace_state(workspace_state: Dictionary) -> void:
	super._restore_workspace_state(workspace_state)
	if not workspace.state.has_method("set_tray_position_reference_size"):
		return

	var trays = workspace_state.get("trays", [])
	if not (trays is Array):
		return
	for tray_value in trays:
		if not (tray_value is Dictionary):
			continue
		var tray: Dictionary = tray_value
		var tray_id: String = str(tray.get("id", ""))
		if tray_id.is_empty() or not tray.has("position_reference_size"):
			continue
		workspace.state.set_tray_position_reference_size(
			tray_id,
			_array_to_vector(tray["position_reference_size"])
		)
