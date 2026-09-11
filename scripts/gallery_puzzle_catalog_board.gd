class_name GalleryPuzzleCatalogBoard
extends "res://scripts/image_aware_puzzle_catalog_board.gd"

const CATALOG_PATH := "res://content/catalog_v1.json"
# Vertical and square artwork needs a shorter canonical long edge than landscape
# content. At the 1280x720 product baseline this keeps the fitted board (including
# normal jigsaw-tab overhang) below the top app bar and above the bottom dock.
# 480 also keeps a 3:4 Hard 15x20 grid at the resolver's 24 px touch floor.
const VERTICAL_BOARD_LONG_EDGE := 480.0

var _gallery_entries: Dictionary = {}
var _gallery_order: Array[String] = []


func _init() -> void:
	_load_gallery_catalog()


func _board_size_for_aspect(frame_aspect_ratio: float) -> Vector2:
	var base_size: Vector2 = super._board_size_for_aspect(frame_aspect_ratio)
	if base_size.y < base_size.x:
		return base_size
	var scale := minf(1.0, VERTICAL_BOARD_LONG_EDGE / maxf(base_size.y, 1.0))
	return base_size * scale


func content_presets() -> Array:
	var result: Array = []
	for content_id in _gallery_order:
		var entry = _gallery_entries.get(content_id, {})
		if entry is Dictionary:
			result.append((entry as Dictionary).duplicate(true))
	return result


func content_metadata(content_id: String) -> Dictionary:
	var value = _gallery_entries.get(content_id, {})
	if value is Dictionary:
		return (value as Dictionary).duplicate(true)
	return {}


func gallery_categories() -> Array:
	var result: Array = []
	for content_id in _gallery_order:
		var entry = _gallery_entries.get(content_id, {})
		if not (entry is Dictionary):
			continue
		var category := str((entry as Dictionary).get("category", ""))
		if not category.is_empty() and not result.has(category):
			result.append(category)
	result.sort()
	return result


func content_search_text(content_id: String) -> String:
	var entry := content_metadata(content_id)
	if entry.is_empty():
		return ""
	var tokens: Array[String] = [
		content_id,
		str(entry.get("label", "")),
		str(entry.get("category", "")),
		str(entry.get("suggested_difficulty", "")),
	]
	for field in ["subject", "region_culture", "mood", "visual", "style", "scene"]:
		var values = entry.get(field, [])
		if values is Array:
			for value in values:
				tokens.append(str(value))
	var tags = entry.get("tags", [])
	if tags is Array:
		for tag_value in tags:
			if tag_value is Dictionary:
				tokens.append(str((tag_value as Dictionary).get("id", "")))
	return " ".join(tokens).to_lower()


func active_content_label() -> String:
	return content_label_for_id(selected_content_id)


func content_label_for_id(content_id: String) -> String:
	var entry = _gallery_entries.get(content_id, {})
	if entry is Dictionary:
		return str((entry as Dictionary).get("label", content_id.capitalize()))
	return content_id.capitalize()


func content_label_for_source_id(source_id: String) -> String:
	for content_id in _gallery_order:
		var entry = _gallery_entries.get(content_id, {})
		if entry is Dictionary and str((entry as Dictionary).get("source_id", "")) == source_id:
			return str((entry as Dictionary).get("label", content_id.capitalize()))
	return "Puzzle"


func select_content(content_id: String) -> bool:
	var entry = _gallery_entries.get(content_id, {})
	if not (entry is Dictionary):
		return false
	var path := str((entry as Dictionary).get("path", ""))
	if path.is_empty() or not ResourceLoader.exists(path):
		return false
	selected_content_id = content_id
	return true


func select_content_by_identity(identity) -> bool:
	if not content_identity_structurally_valid(identity):
		return false
	var source_id := str(identity.get("source_id", ""))
	for content_id in _gallery_order:
		var entry = _gallery_entries.get(content_id, {})
		if entry is Dictionary and str((entry as Dictionary).get("source_id", "")) == source_id:
			return select_content(content_id)
	return false


func active_puzzle_texture() -> Texture2D:
	var entry = _gallery_entries.get(selected_content_id, {})
	if not (entry is Dictionary):
		return DEMO_TEXTURE
	var path := str((entry as Dictionary).get("path", ""))
	if _texture_cache.has(path):
		return _texture_cache[path]
	var texture = load(path)
	if texture is Texture2D:
		_texture_cache[path] = texture
		return texture
	return DEMO_TEXTURE


func active_content_identity() -> Dictionary:
	var entry = _gallery_entries.get(selected_content_id, {})
	if not (entry is Dictionary):
		return {}
	var path := str((entry as Dictionary).get("path", ""))
	var digest := _content_sha256_for(path)
	return {
		"identity_version": CONTENT_IDENTITY_VERSION,
		"source_kind": CONTENT_SOURCE_KIND,
		"source_id": str((entry as Dictionary).get("source_id", "")),
		"sha256": digest,
		"content_key": "sha256:%s" % digest if not digest.is_empty() else "",
	}


func content_aspect_ratio(content_id: String) -> float:
	var entry = _gallery_entries.get(content_id, {})
	if not (entry is Dictionary):
		return LEGACY_FRAME_ASPECT
	var path := str((entry as Dictionary).get("path", ""))
	if path.is_empty() or not ResourceLoader.exists(path):
		return LEGACY_FRAME_ASPECT
	var texture = load(path)
	if not (texture is Texture2D):
		return LEGACY_FRAME_ASPECT
	var size: Vector2 = texture.get_size()
	if size.x <= 0.0 or size.y <= 0.0:
		return LEGACY_FRAME_ASPECT
	return size.x / size.y


func _content_cache_key(content_id: String) -> String:
	var entry = _gallery_entries.get(content_id, {})
	if not (entry is Dictionary):
		return "unknown"
	var path := str((entry as Dictionary).get("path", ""))
	var digest := _content_sha256_for(path)
	return digest.substr(0, 10) if digest.length() >= 10 else "unknown"


func _load_gallery_catalog() -> void:
	_gallery_entries.clear()
	_gallery_order.clear()
	var file := FileAccess.open(CATALOG_PATH, FileAccess.READ)
	if file == null:
		push_error("Pieceful gallery catalog could not open %s" % CATALOG_PATH)
		return
	var parsed = JSON.parse_string(file.get_as_text())
	file.close()
	if not (parsed is Dictionary):
		push_error("Pieceful gallery catalog JSON root is invalid")
		return
	if int(parsed.get("schema_version", -1)) != 1:
		push_error("Pieceful gallery catalog schema is unsupported")
		return
	var contents = parsed.get("contents", [])
	if not (contents is Array):
		push_error("Pieceful gallery catalog contents are invalid")
		return
	for entry_value in contents:
		if not (entry_value is Dictionary):
			continue
		var entry: Dictionary = (entry_value as Dictionary).duplicate(true)
		var content_id := str(entry.get("id", ""))
		var source_id := str(entry.get("source_id", ""))
		var path := str(entry.get("path", ""))
		if content_id.is_empty() or source_id.is_empty() or path.is_empty():
			continue
		_gallery_entries[content_id] = entry
		_gallery_order.append(content_id)
