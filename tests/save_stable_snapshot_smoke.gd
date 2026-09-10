extends SceneTree

const CoordinatorScript = preload("res://scripts/tray_reflow_single_slot_save_coordinator.gd")
const SAVE_PATH := "user://pieceful_autosave_v1.json"


func _init() -> void:
	var coordinator = CoordinatorScript.new()
	coordinator.clear_save()

	var stable_snapshot := {
		"schema_version": 1,
		"slot": "autosave",
		"puzzle": {"difficulty_id": "relaxed", "piece_count": 40},
		"board": {"solved_count": 0},
	}

	if not coordinator._write_stable_snapshot(stable_snapshot, true):
		_fail("initial forced write failed: %s" % coordinator.last_save_error)
		return
	var first_encoded := _read_save()
	if first_encoded.is_empty():
		_fail("initial save file is empty")
		return
	var first_parsed = JSON.parse_string(first_encoded)
	if not (first_parsed is Dictionary) or not first_parsed.has("captured_at_unix"):
		_fail("persisted save is missing captured_at_unix")
		return
	if stable_snapshot.has("captured_at_unix"):
		_fail("stable gameplay snapshot was mutated with captured_at_unix")
		return
	if coordinator.last_snapshot_json != JSON.stringify(stable_snapshot):
		_fail("dirty baseline contains non-stable metadata")
		return

	if not coordinator._write_stable_snapshot(stable_snapshot, false):
		_fail("unchanged autosave call failed: %s" % coordinator.last_save_error)
		return
	var unchanged_encoded := _read_save()
	if unchanged_encoded != first_encoded:
		_fail("unchanged autosave rewrote the persisted file")
		return

	stable_snapshot["board"]["solved_count"] = 1
	if not coordinator._write_stable_snapshot(stable_snapshot, false):
		_fail("changed autosave call failed: %s" % coordinator.last_save_error)
		return
	var changed_encoded := _read_save()
	if changed_encoded == unchanged_encoded:
		_fail("changed gameplay state did not produce a new save")
		return
	var changed_parsed = JSON.parse_string(changed_encoded)
	if not (changed_parsed is Dictionary):
		_fail("changed save is invalid JSON")
		return
	if int(changed_parsed.get("captured_at_unix", 0)) <= 0:
		_fail("changed save lost capture timestamp metadata")
		return
	if int(changed_parsed.get("board", {}).get("solved_count", -1)) != 1:
		_fail("changed gameplay state was not persisted")
		return

	coordinator.clear_save()
	coordinator.free()
	print("PASS save_stable_snapshot_smoke")
	quit(0)


func _read_save() -> String:
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		return ""
	var encoded := file.get_as_text()
	file.close()
	return encoded


func _fail(message: String) -> void:
	push_error("FAIL save_stable_snapshot_smoke: %s" % message)
	quit(1)
