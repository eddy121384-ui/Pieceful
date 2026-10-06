extends SceneTree


func _init() -> void:
	var directory := OS.get_environment("PIECEFUL_LICENSE_OUTPUT")
	if directory.is_empty():
		push_error("Set PIECEFUL_LICENSE_OUTPUT to the reviewed license output directory")
		quit(1)
		return
	if DirAccess.make_dir_recursive_absolute(directory) != OK:
		quit(1)
		return
	var notice := FileAccess.open(directory.path_join("GODOT-LICENSE.txt"), FileAccess.WRITE)
	if notice == null:
		quit(1)
		return
	notice.store_string(Engine.get_license_text())
	notice.close()
	var dependencies := FileAccess.open(directory.path_join("GODOT-THIRD-PARTY.json"), FileAccess.WRITE)
	if dependencies == null:
		quit(1)
		return
	dependencies.store_string(JSON.stringify({
		"engine_version": Engine.get_version_info().string,
		"copyright": Engine.get_copyright_info(),
		"license_texts": Engine.get_license_info(),
	}, "\t") + "\n")
	dependencies.close()
	print("PASS engine license inventory from ", Engine.get_version_info().string)
	quit(0)
