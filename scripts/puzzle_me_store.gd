class_name PuzzleMeStore
extends RefCounted

const REGISTRY_PATH := "user://pieceful_puzzle_me_v1.json"
const MEDIA_DIR := "user://puzzle_me"
const SCHEMA_VERSION := 1
const MAX_LONG_EDGE := 4096

var _entries: Dictionary = {}
var _order: Array[String] = []
var last_error := ""


func _init() -> void:
	_load_registry()


func entries() -> Array:
	var result: Array = []
	for content_id in _order:
		var entry = _entries.get(content_id, {})
		if entry is Dictionary:
			result.append((entry as Dictionary).duplicate(true))
	return result


func entry(content_id: String) -> Dictionary:
	var value = _entries.get(content_id, {})
	if value is Dictionary:
		return (value as Dictionary).duplicate(true)
	return {}


func entry_for_source_id(source_id: String) -> Dictionary:
	for content_id in _order:
		var value = _entries.get(content_id, {})
		if value is Dictionary and str((value as Dictionary).get("source_id", "")) == source_id:
			return (value as Dictionary).duplicate(true)
	return {}


func has_content(content_id: String) -> bool:
	return _entries.has(content_id)


func import_image_bytes(bytes: PackedByteArray, original_name: String = "") -> Dictionary:
	last_error = ""
	if bytes.is_empty():
		last_error = "The selected photo is empty."
		return {}

	var image: Image = _decode_image(bytes)
	if image == null or image.is_empty():
		last_error = "Pieceful could not read this image. Try PNG, JPEG, or WebP."
		return {}

	var size: Vector2i = image.get_size()
	if size.x <= 0 or size.y <= 0:
		last_error = "The selected photo has invalid dimensions."
		return {}

	var longest := maxi(size.x, size.y)
	if longest > MAX_LONG_EDGE:
		var scale := float(MAX_LONG_EDGE) / float(longest)
		var target := Vector2i(
			maxi(1, int(round(float(size.x) * scale))),
			maxi(1, int(round(float(size.y) * scale)))
		)
		image.resize(target.x, target.y, Image.INTERPOLATE_LANCZOS)
		size = image.get_size()

	var canonical_bytes: PackedByteArray = image.save_png_to_buffer()
	if canonical_bytes.is_empty():
		last_error = "Pieceful could not prepare this photo for local storage."
		return {}
	var digest := _sha256(canonical_bytes)
	if digest.is_empty():
		last_error = "Pieceful could not fingerprint this photo."
		return {}

	var content_id := "photo_%s" % digest.substr(0, 16)
	if _entries.has(content_id):
		return entry(content_id)

	if not _ensure_media_dir():
		last_error = "Pieceful could not create its local photo folder."
		return {}
	var path := "%s/%s.png" % [MEDIA_DIR, digest]
	if not FileAccess.file_exists(path):
		var file := FileAccess.open(path, FileAccess.WRITE)
		if file == null:
			last_error = "Pieceful could not save this photo locally."
			return {}
		file.store_buffer(canonical_bytes)
		file.flush()
		file.close()

	var label := _label_from_name(original_name)
	var imported_at := int(Time.get_unix_time_from_system())
	var metadata := {
		"id": content_id,
		"label": label,
		"source_kind": "local_photo",
		"source_id": "local_photo:%s" % digest,
		"sha256": digest,
		"path": path,
		"width": size.x,
		"height": size.y,
		"imported_at_unix": imported_at,
	}
	_entries[content_id] = metadata
	_order.push_front(content_id)
	if not _save_registry():
		_entries.erase(content_id)
		_order.erase(content_id)
		if FileAccess.file_exists(path):
			DirAccess.remove_absolute(ProjectSettings.globalize_path(path))
		return {}
	return metadata.duplicate(true)


func remove(content_id: String) -> bool:
	last_error = ""
	var value = _entries.get(content_id, {})
	if not (value is Dictionary):
		return false
	var path := str((value as Dictionary).get("path", ""))
	_entries.erase(content_id)
	_order.erase(content_id)
	if not _save_registry():
		last_error = "Pieceful could not update its local photo library."
		return false
	if not path.is_empty() and FileAccess.file_exists(path):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(path))
	return true


func _decode_image(bytes: PackedByteArray) -> Image:
	var image := Image.new()
	if image.load_png_from_buffer(bytes) == OK:
		return image
	image = Image.new()
	if image.load_jpg_from_buffer(bytes) == OK:
		return image
	image = Image.new()
	if image.load_webp_from_buffer(bytes) == OK:
		return image
	return null


func _sha256(bytes: PackedByteArray) -> String:
	var hashing := HashingContext.new()
	if hashing.start(HashingContext.HASH_SHA256) != OK:
		return ""
	if hashing.update(bytes) != OK:
		return ""
	return hashing.finish().hex_encode()


func _label_from_name(original_name: String) -> String:
	var label := original_name.get_file().get_basename().strip_edges()
	if label.is_empty():
		return "My Photo"
	if label.length() > 48:
		label = label.substr(0, 48).strip_edges()
	return label


func _ensure_media_dir() -> bool:
	var error := DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(MEDIA_DIR))
	return error == OK or error == ERR_ALREADY_EXISTS


func _load_registry() -> void:
	_entries.clear()
	_order.clear()
	if not FileAccess.file_exists(REGISTRY_PATH):
		return
	var file := FileAccess.open(REGISTRY_PATH, FileAccess.READ)
	if file == null:
		return
	var parsed = JSON.parse_string(file.get_as_text())
	file.close()
	if not (parsed is Dictionary) or int(parsed.get("schema_version", -1)) != SCHEMA_VERSION:
		return
	var rows = parsed.get("photos", [])
	if not (rows is Array):
		return
	for row_value in rows:
		if not (row_value is Dictionary):
			continue
		var row: Dictionary = (row_value as Dictionary).duplicate(true)
		var content_id := str(row.get("id", ""))
		var source_id := str(row.get("source_id", ""))
		var path := str(row.get("path", ""))
		if content_id.is_empty() or source_id.is_empty() or path.is_empty():
			continue
		if not FileAccess.file_exists(path):
			continue
		_entries[content_id] = row
		_order.append(content_id)


func _save_registry() -> bool:
	if not _ensure_media_dir():
		last_error = "Pieceful could not create its local photo folder."
		return false
	var rows: Array = []
	for content_id in _order:
		var value = _entries.get(content_id, {})
		if value is Dictionary:
			rows.append((value as Dictionary).duplicate(true))
	var payload := {
		"schema_version": SCHEMA_VERSION,
		"photos": rows,
	}
	var file := FileAccess.open(REGISTRY_PATH, FileAccess.WRITE)
	if file == null:
		last_error = "Pieceful could not write its local photo registry."
		return false
	file.store_string(JSON.stringify(payload, "  "))
	file.flush()
	file.close()
	return true
