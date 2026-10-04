extends RefCounted

# This is a packaging optimization, not a new save identity/schema. The export
# plugin hashes the original authoring bytes. Existing source IDs, content_key,
# identity_version, and cut-pattern seeds continue to use those exact hashes.
const MANIFEST_PATH := "res://content/catalog_identity_v1.json"
static var _manifest: Dictionary = {}
static var _manifest_loaded := false


static func sha256_for(path: String) -> String:
	# Authoring/tests still hash actual sources, including edits. Imported user
	# photos always hash their canonical local bytes, never catalog metadata.
	if OS.has_feature("editor") or not path.begins_with("res://"):
		return FileAccess.get_sha256(path) if FileAccess.file_exists(path) else ""
	if not _manifest_loaded:
		_manifest_loaded = true
		var parsed = JSON.parse_string(FileAccess.get_file_as_string(MANIFEST_PATH))
		if parsed is Dictionary and int(parsed.get("manifest_version", 0)) == 1 and parsed.get("source_sha256") is Dictionary:
			_manifest = parsed["source_sha256"]
		else:
			push_error("Pieceful catalog identity manifest is missing or invalid")
	var digest := str(_manifest.get(path, ""))
	if digest.length() == 64 and digest.is_valid_hex_number(false):
		return digest
	return ""
