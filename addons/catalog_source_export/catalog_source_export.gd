@tool
extends EditorExportPlugin


func _get_name() -> String:
	return "PiecefulCatalogSourceBytes"


func _export_begin(_features: PackedStringArray, _is_debug: bool, _path: String, _flags: int) -> void:
	# Godot normally exports an imported texture and its remap, dropping the
	# original SVG/JPEG. The existing save identity hashes that original file.
	# Include it alongside its imported texture, with no remap or hash changes.
	var catalog = JSON.parse_string(FileAccess.get_file_as_string("res://content/catalog_v1.json"))
	if not catalog is Dictionary:
		push_error("Catalog source export: invalid catalog")
		return
	for entry: Dictionary in catalog.get("contents", []):
		var source := str(entry.get("path", ""))
		var bytes := FileAccess.get_file_as_bytes(source)
		if bytes.is_empty():
			push_error("Catalog source export: missing artwork %s" % source)
			continue
		add_file(source, bytes, false)
