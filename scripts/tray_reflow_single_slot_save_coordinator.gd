extends "res://scripts/orientation_safe_single_slot_save_coordinator.gd"

# V1 additive metadata: Tray local positions are paired with the mini-table size
# that produced them. Older V1 saves omit this field and remain loadable; they
# adopt the destination size on first open and are safely clamped there.


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
