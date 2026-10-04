@tool
extends EditorExportPlugin


func _get_name() -> String:
	return "PiecefulCatalogIdentityManifest"


func _export_begin(_features: PackedStringArray, _is_debug: bool, _path: String, _flags: int) -> void:
	# Freeze the SAME original-byte SHA-256 used by historical saves. Display
	# resources and their remaps remain Godot's responsibility. Raw artwork is
	# retained in the repository for authoring/integrity checks, not duplicated
	# in every installed game just to hash it again.
	var catalog = JSON.parse_string(FileAccess.get_file_as_string("res://content/catalog_v1.json"))
	if not catalog is Dictionary:
		push_error("Catalog source export: invalid catalog")
		return
	var digests := {}
	for entry: Dictionary in catalog.get("contents", []):
		var source := str(entry.get("path", ""))
		var digest := FileAccess.get_sha256(source)
		if digest.length() != 64:
			push_error("Catalog source export: missing artwork %s" % source)
			continue
		digests[source] = digest
	add_file("res://content/catalog_identity_v1.json", JSON.stringify({"manifest_version": 1, "source_sha256": digests}, "", true).to_utf8_buffer(), false)
