class_name PuzzleCatalogChaosOrderStressPuzzleBoard
extends "res://scripts/content_identity_chaos_order_stress_puzzle_board.gd"

const CONTENTS := {
	"garden": {
		"id": "garden",
		"label": "Garden",
		"source_id": "builtin:demo_garden",
		"path": "res://assets/demo_garden.svg",
	},
	"twilight_lake": {
		"id": "twilight_lake",
		"label": "Twilight Lake",
		"source_id": "builtin:demo_twilight_lake",
		"path": "res://assets/demo_twilight_lake.svg",
	},
}

var selected_content_id := "garden"
var _texture_cache: Dictionary = {}
var _sha_cache: Dictionary = {}


func content_presets() -> Array:
	return [
		CONTENTS["garden"].duplicate(true),
		CONTENTS["twilight_lake"].duplicate(true),
	]


func active_content_id() -> String:
	return selected_content_id


func active_content_label() -> String:
	return content_label_for_id(selected_content_id)


func content_label_for_id(content_id: String) -> String:
	var value = CONTENTS.get(content_id, {})
	if value is Dictionary:
		return str(value.get("label", content_id.capitalize()))
	return content_id.capitalize()


func content_label_for_source_id(source_id: String) -> String:
	for content_id_value in CONTENTS.keys():
		var entry: Dictionary = CONTENTS[content_id_value]
		if str(entry.get("source_id", "")) == source_id:
			return str(entry.get("label", str(content_id_value).capitalize()))
	return "Puzzle"


func select_content(content_id: String) -> bool:
	if not CONTENTS.has(content_id):
		return false
	var entry: Dictionary = CONTENTS[content_id]
	var path := str(entry.get("path", ""))
	if path.is_empty() or not ResourceLoader.exists(path):
		return false
	selected_content_id = content_id
	return true


func select_content_by_identity(identity) -> bool:
	if not content_identity_structurally_valid(identity):
		return false
	var source_id := str(identity.get("source_id", ""))
	for content_id_value in CONTENTS.keys():
		var content_id := str(content_id_value)
		var entry: Dictionary = CONTENTS[content_id]
		if str(entry.get("source_id", "")) != source_id:
			continue
		if not select_content(content_id):
			return false
		return content_identity_matches(identity)
	return false


func active_puzzle_texture() -> Texture2D:
	var entry = CONTENTS.get(selected_content_id, {})
	if not (entry is Dictionary):
		return DEMO_TEXTURE
	var path := str(entry.get("path", ""))
	if _texture_cache.has(path):
		return _texture_cache[path]
	var texture = load(path)
	if texture is Texture2D:
		_texture_cache[path] = texture
		return texture
	return DEMO_TEXTURE


func active_content_identity() -> Dictionary:
	var entry = CONTENTS.get(selected_content_id, {})
	if not (entry is Dictionary):
		return {}
	var path := str(entry.get("path", ""))
	var digest := _content_sha256_for(path)
	return {
		"identity_version": CONTENT_IDENTITY_VERSION,
		"source_kind": CONTENT_SOURCE_KIND,
		"source_id": str(entry.get("source_id", "")),
		"sha256": digest,
		"content_key": "sha256:%s" % digest if not digest.is_empty() else "",
	}


func content_identity_matches(candidate) -> bool:
	if not content_identity_structurally_valid(candidate):
		return false
	var expected := active_content_identity()
	return (
		str(candidate.get("source_id", "")) == str(expected.get("source_id", ""))
		and str(candidate.get("sha256", "")) == str(expected.get("sha256", ""))
		and str(candidate.get("content_key", "")) == str(expected.get("content_key", ""))
	)


func _content_sha256_for(path: String) -> String:
	if _sha_cache.has(path):
		return str(_sha_cache[path])
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return ""
	var bytes := file.get_buffer(file.get_length())
	file.close()
	var hashing := HashingContext.new()
	if hashing.start(HashingContext.HASH_SHA256) != OK:
		return ""
	if hashing.update(bytes) != OK:
		return ""
	var digest := hashing.finish().hex_encode()
	_sha_cache[path] = digest
	return digest


func _build_board_visuals() -> void:
	var texture := active_puzzle_texture()
	var background := Polygon2D.new()
	background.name = "BoardBackground"
	background.polygon = PackedVector2Array([
		board_rect.position,
		board_rect.position + Vector2(board_rect.size.x, 0.0),
		board_rect.end,
		board_rect.position + Vector2(0.0, board_rect.size.y),
	])
	background.color = Color(0.11, 0.12, 0.135, 1.0)
	background.z_index = -2
	add_child(background)
	board_visuals.append(background)

	var preview := Sprite2D.new()
	preview.name = "SolvedPreview"
	preview.texture = texture
	preview.position = board_rect.get_center()
	preview.scale = board_rect.size / texture.get_size()
	preview.modulate = Color(1.0, 1.0, 1.0, 0.13)
	preview.z_index = -1
	add_child(preview)
	board_visuals.append(preview)

	var frame := Line2D.new()
	frame.name = "BoardFrame"
	frame.points = PackedVector2Array([
		board_rect.position,
		board_rect.position + Vector2(board_rect.size.x, 0.0),
		board_rect.end,
		board_rect.position + Vector2(0.0, board_rect.size.y),
		board_rect.position,
	])
	frame.width = 2.0
	frame.default_color = Color(1.0, 1.0, 1.0, 0.25)
	frame.antialiased = true
	frame.z_index = 0
	add_child(frame)
	board_visuals.append(frame)


func _build_pieces() -> void:
	var texture := active_puzzle_texture()
	var starts := _scatter_positions()
	for index in range(definition.piece_count()):
		var piece = PuzzlePieceScript.new()
		piece.name = "Piece_%03d" % index
		add_child(piece)
		piece.configure(
			index,
			texture,
			definition.target_position_for(index),
			definition.piece_size,
			definition.source_origin_for(index),
			definition.source_cell_size,
			definition.outline_for(index),
			starts[index]
		)
		piece.z_index = z_counter + index
		piece.picked.connect(_on_piece_picked)
		piece.dragged.connect(_on_piece_dragged)
		piece.released.connect(_on_piece_released)
		pieces.append(piece)
		cluster_for_piece[index] = index
		cluster_members[index] = [index]
	z_counter += definition.piece_count()
