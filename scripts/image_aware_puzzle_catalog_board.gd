class_name ImageAwarePuzzleCatalogBoard
extends "res://scripts/puzzle_catalog_chaos_order_stress_puzzle_board.gd"

const PuzzleLayoutResolverScript = preload("res://scripts/puzzle_layout_resolver.gd")
const CutPatternGeneratorV16Script = preload("res://scripts/cut_pattern_generator_v16.gd")
const PuzzleDefinitionRuntimeScript = preload("res://scripts/puzzle_definition.gd")

const PLAYER_DIFFICULTY_IDS := ["relaxed", "standard", "hard"]
const GENERATED_PATTERN_DIR := "user://pieceful_patterns"
const BOARD_LONG_EDGE := 600.0
const TOUCH_PIECE_SHORT_EDGE := 24.0
const LEGACY_FRAME_ASPECT := 1.6

var layout_resolver = PuzzleLayoutResolverScript.new()
var _resolved_runtime_pattern_path := ""
var _active_resolved_layout: Dictionary = {}


func difficulty_presets() -> Array:
	return difficulty_presets_for_content(active_content_id())


func difficulty_presets_for_content(content_id: String) -> Array:
	var result: Array = []
	for difficulty_id_value in PLAYER_DIFFICULTY_IDS:
		var difficulty_id := str(difficulty_id_value)
		var preset := difficulty_catalog.preset_for(difficulty_id)
		if preset.is_empty():
			continue
		var layout := _resolved_layout_for_content(content_id, difficulty_id)
		if layout.is_empty():
			continue
		var row := preset.duplicate(true)
		row["columns"] = int(layout["columns"])
		row["rows"] = int(layout["rows"])
		row["resolved_piece_count"] = int(layout["piece_count"])
		row["frame_aspect_ratio"] = float(layout["frame_aspect_ratio"])
		row["cell_aspect_ratio"] = float(layout["cell_aspect_ratio"])
		row["piece_short_edge"] = float(layout["piece_short_edge"])
		row["touch_floor_satisfied"] = bool(layout["touch_floor_satisfied"])
		result.append(row)
	return result


func difficulty_available(difficulty_id: String) -> bool:
	if difficulty_id in PLAYER_DIFFICULTY_IDS:
		return not _resolved_layout_for_content(active_content_id(), difficulty_id).is_empty()
	# Keep explicit stress fixtures callable by CI / developer tooling, but they
	# are intentionally absent from difficulty_presets(), so normal players do
	# not see Stress 400 / Expert Stress 576 in the selector.
	return super.difficulty_available(difficulty_id)


func request_difficulty(difficulty_id: String) -> bool:
	if not (difficulty_id in PLAYER_DIFFICULTY_IDS):
		_resolved_runtime_pattern_path = ""
		_active_resolved_layout.clear()
		return super.request_difficulty(difficulty_id)

	last_difficulty_error = ""
	var profile := _runtime_profile_for_content(active_content_id(), difficulty_id)
	if profile.is_empty():
		last_difficulty_error = "Could not resolve difficulty: %s" % difficulty_id
		return false
	if not _ensure_runtime_pattern(profile):
		last_difficulty_error = "Could not prepare CutPattern for %s" % difficulty_id
		return false

	_prepare_board_geometry(float(profile["frame_aspect_ratio"]))
	_resolved_runtime_pattern_path = str(profile["cut_pattern_path"])
	_active_resolved_layout = profile.duplicate(true)
	selected_difficulty_id = difficulty_id

	var switch_started := Time.get_ticks_msec()
	start_new_game()
	last_difficulty_switch_ms = int(Time.get_ticks_msec() - switch_started)
	print(
		"Pieceful image-aware difficulty · %s · %.4f aspect · %dx%d = %d · %d ms"
		% [
			active_difficulty_label(),
			float(profile["frame_aspect_ratio"]),
			int(profile["columns"]),
			int(profile["rows"]),
			active_piece_count(),
			last_difficulty_switch_ms,
		]
	)
	return true


func start_new_game() -> void:
	# PuzzleBoard historically constructs PuzzleDefinition with DEMO_TEXTURE.
	# Image-aware content must instead derive source-cell geometry from the actual
	# selected artwork, otherwise non-960x600 museum/user images would sample the
	# wrong source regions even if the board grid were correct.
	preview_sprite = null
	_clear_hint_visuals()
	_clear_previous_game()
	solved_count = 0
	z_counter = 10
	active_cut_pattern_path = _select_runtime_cut_pattern()
	definition = PuzzleDefinitionRuntimeScript.new(
		active_puzzle_texture(),
		board_rect,
		active_cut_pattern_path
	)
	_build_board_visuals()
	_build_pieces()
	progress_changed.emit(solved_count, definition.piece_count())
	_apply_preview_state()


func active_grid_resolution() -> Dictionary:
	if definition == null or definition.cut_pattern == null:
		return {}
	return {
		"columns": int(definition.cut_pattern.columns),
		"rows": int(definition.cut_pattern.rows),
		"piece_count": int(definition.piece_count()),
		"pattern_id": str(definition.cut_pattern.pattern_id),
		"frame_aspect_ratio": active_content_aspect_ratio(),
	}


func active_content_aspect_ratio() -> float:
	return content_aspect_ratio(active_content_id())


func content_aspect_ratio(content_id: String) -> float:
	var entry_value = CONTENTS.get(content_id, {})
	if not (entry_value is Dictionary):
		return LEGACY_FRAME_ASPECT
	var entry: Dictionary = entry_value
	var path := str(entry.get("path", ""))
	if path.is_empty() or not ResourceLoader.exists(path):
		return LEGACY_FRAME_ASPECT
	var texture = load(path)
	if not (texture is Texture2D):
		return LEGACY_FRAME_ASPECT
	var size: Vector2 = texture.get_size()
	if size.x <= 0.0 or size.y <= 0.0:
		return LEGACY_FRAME_ASPECT
	return size.x / size.y


func resolved_layout_for_aspect(frame_aspect_ratio: float, difficulty_id: String) -> Dictionary:
	var preset := difficulty_catalog.preset_for(difficulty_id)
	if preset.is_empty():
		return {}
	var target := int(preset.get("target_piece_count", 0))
	if target <= 0:
		return {}
	var board_size := _board_size_for_aspect(frame_aspect_ratio)
	return layout_resolver.resolve(
		frame_aspect_ratio,
		target,
		board_size,
		TOUCH_PIECE_SHORT_EDGE
	)


func _resolved_layout_for_content(content_id: String, difficulty_id: String) -> Dictionary:
	return resolved_layout_for_aspect(content_aspect_ratio(content_id), difficulty_id)


func _runtime_profile_for_content(content_id: String, difficulty_id: String) -> Dictionary:
	var layout := _resolved_layout_for_content(content_id, difficulty_id)
	if layout.is_empty():
		return {}
	var preset := difficulty_catalog.preset_for(difficulty_id)
	if preset.is_empty():
		return {}

	var profile := layout.duplicate(true)
	profile["difficulty_id"] = difficulty_id
	profile["difficulty_label"] = str(preset.get("label", difficulty_id.capitalize()))
	profile["content_id"] = content_id

	var legacy_path := _legacy_curated_path_for(profile, preset)
	if not legacy_path.is_empty():
		profile["cut_pattern_path"] = legacy_path
		profile["pattern_id"] = legacy_path.get_file().get_basename()
		profile["runtime_generated"] = false
		return profile

	var content_key := _content_cache_key(content_id)
	var safe_content := _safe_token(content_id)
	var aspect_key := "%0.4f" % float(profile["frame_aspect_ratio"])
	var pattern_id := "Pieceful_Runtime_%s_%s_%s_%dx%d_%s_v16_A" % [
		safe_content,
		content_key,
		difficulty_id,
		int(profile["columns"]),
		int(profile["rows"]),
		aspect_key.replace(".", "p"),
	]
	profile["pattern_id"] = pattern_id
	profile["cut_pattern_path"] = "%s/%s.json" % [GENERATED_PATTERN_DIR, pattern_id]
	profile["runtime_generated"] = true
	profile["seed"] = _stable_seed(pattern_id)
	return profile


func _legacy_curated_path_for(profile: Dictionary, preset: Dictionary) -> String:
	if absf(float(profile["frame_aspect_ratio"]) - LEGACY_FRAME_ASPECT) > 0.0001:
		return ""
	if int(profile["columns"]) != int(preset.get("columns", -1)):
		return ""
	if int(profile["rows"]) != int(preset.get("rows", -1)):
		return ""
	if int(profile["piece_count"]) != int(preset.get("resolved_piece_count", -1)):
		return ""
	var path := str(preset.get("cut_pattern_path", ""))
	return path if not path.is_empty() and FileAccess.file_exists(path) else ""


func _ensure_runtime_pattern(profile: Dictionary) -> bool:
	var path := str(profile.get("cut_pattern_path", ""))
	if path.is_empty():
		return false
	if FileAccess.file_exists(path):
		return true
	if not bool(profile.get("runtime_generated", false)):
		return false

	var absolute_dir := ProjectSettings.globalize_path(GENERATED_PATTERN_DIR)
	var dir_error := DirAccess.make_dir_recursive_absolute(absolute_dir)
	if dir_error != OK and dir_error != ERR_ALREADY_EXISTS:
		return false

	var generator = CutPatternGeneratorV16Script.new(
		int(profile["columns"]),
		int(profile["rows"]),
		float(profile["frame_aspect_ratio"]),
		int(profile["seed"]),
		{}
	)
	var aspect_class := "runtime_%0.4f" % float(profile["frame_aspect_ratio"])
	var pattern: Dictionary = generator.generate_pattern_dict(
		str(profile["pattern_id"]),
		1,
		aspect_class
	)
	if pattern.is_empty():
		return false

	var authoring: Dictionary = pattern.get("authoring", {})
	authoring["curated"] = false
	authoring["runtime_generated"] = true
	authoring["layout"] = {
		"resolver": "image_aware_runtime_v1",
		"difficulty_id": str(profile["difficulty_id"]),
		"target_piece_count": int(profile["target_piece_count"]),
		"resolved_piece_count": int(profile["piece_count"]),
		"columns": int(profile["columns"]),
		"rows": int(profile["rows"]),
		"frame_aspect_ratio": float(profile["frame_aspect_ratio"]),
		"cell_aspect_ratio": float(profile["cell_aspect_ratio"]),
		"piece_short_edge": float(profile["piece_short_edge"]),
		"touch_floor_satisfied": bool(profile["touch_floor_satisfied"]),
		"layout_score": float(profile["score"]),
	}
	pattern["authoring"] = authoring

	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(JSON.stringify(pattern))
	file.flush()
	file.close()
	return FileAccess.file_exists(path)


func _prepare_board_geometry(frame_aspect_ratio: float) -> void:
	var next_size := _board_size_for_aspect(frame_aspect_ratio)
	var current_center := board_rect.get_center()
	board_rect = Rect2(current_center - next_size * 0.5, next_size)
	if last_viewport_size.x > 0.0 and last_viewport_size.y > 0.0:
		var layout: Dictionary = workspace_layout.resolve(last_viewport_size, next_size)
		board_rect = layout["board_rect"]
		navigation_rect = layout["navigation_rect"]
		workspace_orientation = str(layout["orientation"])


func _board_size_for_aspect(frame_aspect_ratio: float) -> Vector2:
	var safe_aspect := clampf(
		frame_aspect_ratio,
		PuzzleLayoutResolverScript.MIN_FRAME_ASPECT,
		PuzzleLayoutResolverScript.MAX_FRAME_ASPECT
	)
	if safe_aspect >= 1.0:
		return Vector2(BOARD_LONG_EDGE, BOARD_LONG_EDGE / safe_aspect)
	return Vector2(BOARD_LONG_EDGE * safe_aspect, BOARD_LONG_EDGE)


func _select_runtime_cut_pattern() -> String:
	if selected_difficulty_id.begins_with("stress_"):
		return super._select_runtime_cut_pattern()
	if not _resolved_runtime_pattern_path.is_empty() and FileAccess.file_exists(_resolved_runtime_pattern_path):
		return _resolved_runtime_pattern_path
	return super._select_runtime_cut_pattern()


func _content_cache_key(content_id: String) -> String:
	var entry_value = CONTENTS.get(content_id, {})
	if not (entry_value is Dictionary):
		return "unknown"
	var path := str((entry_value as Dictionary).get("path", ""))
	var digest := _content_sha256_for(path)
	return digest.substr(0, 10) if digest.length() >= 10 else "unknown"


func _safe_token(value: String) -> String:
	var token := value.to_lower()
	for character in [":", "/", "\\", " ", "."]:
		token = token.replace(character, "_")
	return token


func _stable_seed(value: String) -> int:
	var hash_value: int = 2166136261
	for byte_value in value.to_utf8_buffer():
		hash_value = ((hash_value ^ int(byte_value)) * 16777619) & 0x7fffffff
	return maxi(hash_value, 1)
