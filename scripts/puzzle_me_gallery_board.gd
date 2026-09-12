class_name PuzzleMeGalleryBoard
extends "res://scripts/resume_reuse_gallery_puzzle_board.gd"

const PuzzleMeStoreScript = preload("res://scripts/puzzle_me_store.gd")

var puzzle_me_store = PuzzleMeStoreScript.new()


func import_local_photo(bytes: PackedByteArray, original_name: String = "") -> Dictionary:
	var imported: Dictionary = puzzle_me_store.import_image_bytes(bytes, original_name)
	if imported.is_empty():
		return {}
	var content_id := str(imported.get("id", ""))
	if not content_id.is_empty():
		select_content(content_id)
	return content_metadata(content_id)


func last_photo_import_error() -> String:
	return str(puzzle_me_store.last_error)


func content_presets() -> Array:
	var result: Array = super.content_presets()
	for row_value in puzzle_me_store.entries():
		if row_value is Dictionary:
			result.append(_gallery_metadata_for_local(row_value as Dictionary))
	return result


func content_metadata(content_id: String) -> Dictionary:
	var local := puzzle_me_store.entry(content_id)
	if not local.is_empty():
		return _gallery_metadata_for_local(local)
	return super.content_metadata(content_id)


func gallery_categories() -> Array:
	var result: Array = super.gallery_categories()
	if not puzzle_me_store.entries().is_empty() and not result.has("my_photos"):
		result.append("my_photos")
	result.sort()
	return result


func content_search_text(content_id: String) -> String:
	var local := puzzle_me_store.entry(content_id)
	if local.is_empty():
		return super.content_search_text(content_id)
	return " ".join([
		content_id,
		str(local.get("label", "My Photo")),
		"my photo",
		"personal",
		"local",
		"puzzle me",
		"photography",
	]).to_lower()


func content_label_for_id(content_id: String) -> String:
	var local := puzzle_me_store.entry(content_id)
	if not local.is_empty():
		return _display_label_for_local(local)
	return super.content_label_for_id(content_id)


func content_label_for_source_id(source_id: String) -> String:
	var local := puzzle_me_store.entry_for_source_id(source_id)
	if not local.is_empty():
		return _display_label_for_local(local)
	return super.content_label_for_source_id(source_id)


func select_content(content_id: String) -> bool:
	var local := puzzle_me_store.entry(content_id)
	if not local.is_empty():
		var path := str(local.get("path", ""))
		if path.is_empty() or not FileAccess.file_exists(path):
			return false
		selected_content_id = content_id
		return true
	return super.select_content(content_id)


func select_content_by_identity(identity) -> bool:
	if not content_identity_structurally_valid(identity):
		return false
	if str(identity.get("source_kind", "")) == "local_photo":
		var local := puzzle_me_store.entry_for_source_id(str(identity.get("source_id", "")))
		if local.is_empty():
			return false
		return select_content(str(local.get("id", "")))
	return super.select_content_by_identity(identity)


func active_puzzle_texture() -> Texture2D:
	var local := puzzle_me_store.entry(selected_content_id)
	if local.is_empty():
		return super.active_puzzle_texture()
	return _local_texture(local)


func content_texture_for_id(content_id: String) -> Texture2D:
	var local := puzzle_me_store.entry(content_id)
	if not local.is_empty():
		return _local_texture(local)
	var metadata := super.content_metadata(content_id)
	var path := str(metadata.get("path", ""))
	if not path.is_empty():
		var texture = load(path)
		if texture is Texture2D:
			return texture
	return DEMO_TEXTURE


func active_content_identity() -> Dictionary:
	var local := puzzle_me_store.entry(selected_content_id)
	if local.is_empty():
		return super.active_content_identity()
	var path := str(local.get("path", ""))
	var digest := _content_sha256_for(path)
	return {
		"identity_version": CONTENT_IDENTITY_VERSION,
		"source_kind": "local_photo",
		"source_id": str(local.get("source_id", "")),
		"sha256": digest,
		"content_key": "sha256:%s" % digest if not digest.is_empty() else "",
	}


func content_aspect_ratio(content_id: String) -> float:
	var local := puzzle_me_store.entry(content_id)
	if not local.is_empty():
		var width := int(local.get("width", 0))
		var height := int(local.get("height", 0))
		if width > 0 and height > 0:
			return float(width) / float(height)
	return super.content_aspect_ratio(content_id)


func _content_cache_key(content_id: String) -> String:
	var local := puzzle_me_store.entry(content_id)
	if not local.is_empty():
		var digest := _content_sha256_for(str(local.get("path", "")))
		return digest.substr(0, 10) if digest.length() >= 10 else "unknown"
	return super._content_cache_key(content_id)


func _local_texture(local: Dictionary) -> Texture2D:
	var path := str(local.get("path", ""))
	if _texture_cache.has(path):
		return _texture_cache[path]
	if path.is_empty() or not FileAccess.file_exists(path):
		return DEMO_TEXTURE
	var image := Image.load_from_file(path)
	if image == null or image.is_empty():
		return DEMO_TEXTURE
	var texture := ImageTexture.create_from_image(image)
	_texture_cache[path] = texture
	return texture


func _display_label_for_local(local: Dictionary) -> String:
	var label := str(local.get("label", "My Photo")).strip_edges()
	if label.is_empty() or _looks_like_uuid_label(label):
		return "My Photo"
	return label


func _looks_like_uuid_label(label: String) -> bool:
	if label.length() != 36:
		return false
	if label.substr(8, 1) != "-" or label.substr(13, 1) != "-":
		return false
	if label.substr(18, 1) != "-" or label.substr(23, 1) != "-":
		return false
	var hex_chars := "0123456789abcdefABCDEF"
	for index in range(label.length()):
		if index in [8, 13, 18, 23]:
			continue
		if not hex_chars.contains(label.substr(index, 1)):
			return false
	return true


func _gallery_metadata_for_local(local: Dictionary) -> Dictionary:
	var result: Dictionary = local.duplicate(true)
	result["label"] = _display_label_for_local(local)
	result["category"] = "my_photos"
	result["subject"] = ["personal", "photo"]
	result["region_culture"] = []
	result["mood"] = []
	result["visual"] = ["photograph"]
	result["style"] = ["photography"]
	result["scene"] = []
	result["puzzleability"] = "user_provided"
	result["suggested_difficulty"] = "standard"
	result["tags"] = [
		{"id": "my-photo", "weight": 1.0},
		{"id": "puzzle-me", "weight": 1.0},
		{"id": "personal", "weight": 0.9},
	]
	result["attribution"] = "Your photo · stored locally"
	result["license"] = "user_provided"
	return result
