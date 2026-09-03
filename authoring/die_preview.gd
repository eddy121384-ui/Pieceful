extends Node2D

const CutPatternAssetScript = preload("res://scripts/cut_pattern_asset.gd")
const CutPatternGeneratorScript = preload("res://scripts/cut_pattern_generator_v15.gd")
const CutPatternValidatorScript = preload("res://scripts/cut_pattern_validator.gd")
const PuzzleLayoutResolverScript = preload("res://scripts/puzzle_layout_resolver.gd")

var seed := 424242
var current_pattern: CutPatternAsset
var current_dict: Dictionary = {}
var current_validation: Dictionary = {}
var current_layout: Dictionary = {}

var current_columns := 6
var current_rows := 6
var current_aspect_ratio := 1.0
var current_aspect_class := "square_1_1"
var current_piece_count := 36
var current_target_piece_count := 36
var current_difficulty_id := "relaxed"

var preview_rect := Rect2(Vector2(360.0, 92.0), Vector2(560.0, 560.0))
var layout_resolver = PuzzleLayoutResolverScript.new()
var random_seed_rng := RandomNumberGenerator.new()

var seed_label: Label
var layout_label: Label
var topology_label: Label
var validation_label: Label
var pattern_id_edit: LineEdit
var seed_edit: LineEdit
var custom_aspect_edit: LineEdit
var custom_target_edit: LineEdit
var approve_button: Button
var aspect_select: OptionButton
var difficulty_select: OptionButton
var height_slider: HSlider
var roundness_slider: HSlider
var asymmetry_slider: HSlider
var blend_slider: HSlider
var curvature_slider: HSlider
var height_value: Label
var roundness_value: Label
var asymmetry_value: Label
var blend_value: Label
var curvature_value: Label
var style_debounce: Timer


func _ready() -> void:
	random_seed_rng.randomize()
	_build_ui()
	_resolve_layout(false)
	_generate_candidate()


func _draw() -> void:
	draw_rect(preview_rect, Color.WHITE, true)
	draw_rect(preview_rect, Color(0.78, 0.78, 0.78), false, 1.0)

	if current_pattern == null:
		return

	var design_size := Vector2(current_pattern.aspect_ratio, 1.0)
	for boundary_row in range(current_pattern.rows + 1):
		for column in range(current_pattern.columns):
			_draw_design_segment(
				current_pattern.render_horizontal_segment(
					boundary_row,
					column,
					design_size
				)
			)

	for row in range(current_pattern.rows):
		for boundary_column in range(current_pattern.columns + 1):
			_draw_design_segment(
				current_pattern.render_vertical_segment(
					row,
					boundary_column,
					design_size
				)
			)


func _build_ui() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)

	var title := Label.new()
	title.text = "Piecepace · Die Lab"
	title.position = Vector2(24.0, 12.0)
	title.add_theme_font_size_override("font_size", 24)
	layer.add_child(title)

	var subtitle := Label.new()
	subtitle.text = "V15 geometry · dynamic layout resolver"
	subtitle.position = Vector2(25.0, 46.0)
	subtitle.add_theme_font_size_override("font_size", 12)
	layer.add_child(subtitle)

	seed_label = Label.new()
	seed_label.position = Vector2(360.0, 58.0)
	seed_label.size = Vector2(560.0, 24.0)
	seed_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	seed_label.add_theme_font_size_override("font_size", 13)
	layer.add_child(seed_label)

	_build_layout_controls(layer)
	_build_style_controls(layer)
	_build_curation_controls(layer)

	style_debounce = Timer.new()
	style_debounce.one_shot = true
	style_debounce.wait_time = 0.08
	style_debounce.timeout.connect(_generate_candidate)
	add_child(style_debounce)

	_update_slider_labels()


func _build_layout_controls(layer: CanvasLayer) -> void:
	var aspect_caption := Label.new()
	aspect_caption.text = "Frame aspect"
	aspect_caption.position = Vector2(24.0, 78.0)
	layer.add_child(aspect_caption)

	var difficulty_caption := Label.new()
	difficulty_caption.text = "Difficulty target"
	difficulty_caption.position = Vector2(179.0, 78.0)
	layer.add_child(difficulty_caption)

	aspect_select = OptionButton.new()
	aspect_select.position = Vector2(24.0, 98.0)
	aspect_select.size = Vector2(145.0, 34.0)
	for preset in PuzzleLayoutResolverScript.ASPECT_PRESETS:
		aspect_select.add_item(str(preset["label"]))
	aspect_select.add_item("Custom")
	aspect_select.select(0)
	layer.add_child(aspect_select)

	difficulty_select = OptionButton.new()
	difficulty_select.position = Vector2(179.0, 98.0)
	difficulty_select.size = Vector2(145.0, 34.0)
	for preset in PuzzleLayoutResolverScript.DIFFICULTY_PRESETS:
		difficulty_select.add_item(
			"%s ~%d" % [str(preset["label"]), int(preset["target"])]
		)
	difficulty_select.add_item("Custom")
	difficulty_select.select(0)
	layer.add_child(difficulty_select)

	custom_aspect_edit = LineEdit.new()
	custom_aspect_edit.text = "1.0000"
	custom_aspect_edit.placeholder_text = "aspect 0.50–2.00"
	custom_aspect_edit.position = Vector2(24.0, 138.0)
	custom_aspect_edit.size = Vector2(145.0, 34.0)
	custom_aspect_edit.editable = false
	layer.add_child(custom_aspect_edit)

	custom_target_edit = LineEdit.new()
	custom_target_edit.text = "36"
	custom_target_edit.placeholder_text = "target 36–1200"
	custom_target_edit.position = Vector2(179.0, 138.0)
	custom_target_edit.size = Vector2(145.0, 34.0)
	custom_target_edit.editable = false
	layer.add_child(custom_target_edit)

	layout_label = Label.new()
	layout_label.position = Vector2(24.0, 178.0)
	layout_label.size = Vector2(300.0, 40.0)
	layout_label.add_theme_font_size_override("font_size", 12)
	layer.add_child(layout_label)

	var seed_caption := Label.new()
	seed_caption.text = "Seed"
	seed_caption.position = Vector2(24.0, 220.0)
	layer.add_child(seed_caption)

	seed_edit = LineEdit.new()
	seed_edit.text = str(seed)
	seed_edit.position = Vector2(24.0, 240.0)
	seed_edit.size = Vector2(188.0, 34.0)
	layer.add_child(seed_edit)

	var random_button := Button.new()
	random_button.text = "Random"
	random_button.position = Vector2(220.0, 240.0)
	random_button.size = Vector2(104.0, 34.0)
	random_button.pressed.connect(_randomize_seed)
	layer.add_child(random_button)

	var next_button := Button.new()
	next_button.text = "Generate Next"
	next_button.position = Vector2(24.0, 280.0)
	next_button.size = Vector2(300.0, 34.0)
	next_button.pressed.connect(_generate_next)
	layer.add_child(next_button)

	aspect_select.item_selected.connect(_on_aspect_selected)
	difficulty_select.item_selected.connect(_on_difficulty_selected)
	custom_aspect_edit.text_submitted.connect(_on_custom_aspect_submitted)
	custom_target_edit.text_submitted.connect(_on_custom_target_submitted)
	seed_edit.text_submitted.connect(_on_seed_submitted)


func _build_style_controls(layer: CanvasLayer) -> void:
	var slider_setup := _make_slider(layer, "蘑菇高度", 322.0, 0.88, 1.22, 0.01, 1.00)
	height_slider = slider_setup["slider"]
	height_value = slider_setup["value_label"]

	slider_setup = _make_slider(layer, "蘑菇寬度 / 圓潤感", 376.0, 0.90, 1.14, 0.01, 1.00)
	roundness_slider = slider_setup["slider"]
	roundness_value = slider_setup["value_label"]

	slider_setup = _make_slider(layer, "蘑菇左右不對稱度", 430.0, 0.00, 1.00, 0.01, 0.35)
	asymmetry_slider = slider_setup["slider"]
	asymmetry_value = slider_setup["value_label"]

	slider_setup = _make_slider(layer, "蘑菇肩膀平滑度", 484.0, 0.70, 1.40, 0.01, 1.00)
	blend_slider = slider_setup["slider"]
	blend_value = slider_setup["value_label"]

	slider_setup = _make_slider(layer, "Ribbon 彎曲度", 538.0, 0.60, 1.70, 0.05, 1.00)
	curvature_slider = slider_setup["slider"]
	curvature_value = slider_setup["value_label"]

	var copy_button := Button.new()
	copy_button.text = "Copy Settings"
	copy_button.position = Vector2(24.0, 596.0)
	copy_button.size = Vector2(145.0, 34.0)
	copy_button.pressed.connect(_copy_settings)
	layer.add_child(copy_button)

	var paste_button := Button.new()
	paste_button.text = "Paste Settings"
	paste_button.position = Vector2(179.0, 596.0)
	paste_button.size = Vector2(145.0, 34.0)
	paste_button.pressed.connect(_paste_settings)
	layer.add_child(paste_button)

	var reset_button := Button.new()
	reset_button.text = "Reset Shape"
	reset_button.position = Vector2(24.0, 638.0)
	reset_button.size = Vector2(300.0, 34.0)
	reset_button.pressed.connect(_reset_style)
	layer.add_child(reset_button)


func _build_curation_controls(layer: CanvasLayer) -> void:
	var stats_title := Label.new()
	stats_title.text = "Interior topology"
	stats_title.position = Vector2(944.0, 88.0)
	stats_title.add_theme_font_size_override("font_size", 16)
	layer.add_child(stats_title)

	topology_label = Label.new()
	topology_label.position = Vector2(944.0, 116.0)
	topology_label.size = Vector2(310.0, 128.0)
	topology_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	topology_label.add_theme_font_size_override("font_size", 13)
	layer.add_child(topology_label)

	var id_caption := Label.new()
	id_caption.text = "Approved pattern ID"
	id_caption.position = Vector2(944.0, 270.0)
	layer.add_child(id_caption)

	pattern_id_edit = LineEdit.new()
	pattern_id_edit.text = "Classic_036_candidate"
	pattern_id_edit.position = Vector2(944.0, 292.0)
	pattern_id_edit.size = Vector2(310.0, 38.0)
	layer.add_child(pattern_id_edit)

	approve_button = Button.new()
	approve_button.text = "Approve JSON"
	approve_button.position = Vector2(944.0, 340.0)
	approve_button.size = Vector2(310.0, 40.0)
	approve_button.pressed.connect(_approve_current)
	layer.add_child(approve_button)

	validation_label = Label.new()
	validation_label.position = Vector2(944.0, 394.0)
	validation_label.size = Vector2(310.0, 104.0)
	validation_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	layer.add_child(validation_label)

	var note := Label.new()
	note.text = (
		"Difficulty targets are approximate. The resolver may choose a nearby piece count "
		+ "to keep individual pieces well proportioned.\n\n"
		+ "12-piece remains a runtime regression asset, not a player-facing difficulty."
	)
	note.position = Vector2(944.0, 516.0)
	note.size = Vector2(310.0, 130.0)
	note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	note.add_theme_font_size_override("font_size", 12)
	layer.add_child(note)


func _make_slider(
	layer: CanvasLayer,
	caption: String,
	y: float,
	minimum: float,
	maximum: float,
	step: float,
	initial: float
) -> Dictionary:
	var label := Label.new()
	label.text = caption
	label.position = Vector2(24.0, y)
	label.size = Vector2(300.0, 18.0)
	layer.add_child(label)

	var slider := HSlider.new()
	slider.position = Vector2(24.0, y + 20.0)
	slider.size = Vector2(238.0, 26.0)
	slider.min_value = minimum
	slider.max_value = maximum
	slider.step = step
	slider.value = initial
	slider.value_changed.connect(_on_style_changed)
	layer.add_child(slider)

	var value_label := Label.new()
	value_label.position = Vector2(270.0, y + 21.0)
	value_label.size = Vector2(54.0, 22.0)
	value_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	layer.add_child(value_label)

	return {
		"slider": slider,
		"value_label": value_label,
	}


func _on_style_changed(_value: float) -> void:
	_update_slider_labels()
	if style_debounce != null:
		style_debounce.start()


func _update_slider_labels() -> void:
	if height_value == null:
		return
	height_value.text = "%.2f×" % height_slider.value
	roundness_value.text = "%.2f×" % roundness_slider.value
	asymmetry_value.text = "%.2f" % asymmetry_slider.value
	blend_value.text = "%.2f×" % blend_slider.value
	curvature_value.text = "%.2f×" % curvature_slider.value


func _current_style_params() -> Dictionary:
	return {
		"mushroom_height": height_slider.value,
		"mushroom_roundness": roundness_slider.value,
		"mushroom_asymmetry": asymmetry_slider.value,
		"shoulder_blend": blend_slider.value,
		"ribbon_curvature": curvature_slider.value,
	}


func _on_aspect_selected(index: int) -> void:
	var custom_index := PuzzleLayoutResolverScript.ASPECT_PRESETS.size()
	custom_aspect_edit.editable = index == custom_index
	if index < custom_index:
		custom_aspect_edit.text = "%.4f" % float(
			PuzzleLayoutResolverScript.ASPECT_PRESETS[index]["aspect"]
		)
	_resolve_layout(true)


func _on_difficulty_selected(index: int) -> void:
	var custom_index := PuzzleLayoutResolverScript.DIFFICULTY_PRESETS.size()
	custom_target_edit.editable = index == custom_index
	if index < custom_index:
		custom_target_edit.text = str(
			int(PuzzleLayoutResolverScript.DIFFICULTY_PRESETS[index]["target"])
		)
	_resolve_layout(true)


func _on_custom_aspect_submitted(text: String) -> void:
	if not custom_aspect_edit.editable:
		return
	var cleaned := text.strip_edges()
	if cleaned.is_valid_float():
		var value := clampf(float(cleaned), 0.50, 2.00)
		custom_aspect_edit.text = "%.4f" % value
		_resolve_layout(true)
	else:
		custom_aspect_edit.text = "%.4f" % current_aspect_ratio


func _on_custom_target_submitted(text: String) -> void:
	if not custom_target_edit.editable:
		return
	var cleaned := text.strip_edges()
	if cleaned.is_valid_int():
		var value := clampi(
			int(cleaned),
			PuzzleLayoutResolverScript.MIN_TARGET_PIECES,
			PuzzleLayoutResolverScript.MAX_TARGET_PIECES
		)
		custom_target_edit.text = str(value)
		_resolve_layout(true)
	else:
		custom_target_edit.text = str(current_target_piece_count)


func _selected_aspect_ratio() -> float:
	var index := aspect_select.selected
	if index < PuzzleLayoutResolverScript.ASPECT_PRESETS.size():
		return float(PuzzleLayoutResolverScript.ASPECT_PRESETS[index]["aspect"])
	var cleaned := custom_aspect_edit.text.strip_edges()
	if cleaned.is_valid_float():
		return clampf(float(cleaned), 0.50, 2.00)
	return current_aspect_ratio


func _selected_aspect_class() -> String:
	var index := aspect_select.selected
	if index < PuzzleLayoutResolverScript.ASPECT_PRESETS.size():
		return str(PuzzleLayoutResolverScript.ASPECT_PRESETS[index]["id"])
	return "custom_%.4f" % _selected_aspect_ratio()


func _selected_target_piece_count() -> int:
	var index := difficulty_select.selected
	if index < PuzzleLayoutResolverScript.DIFFICULTY_PRESETS.size():
		return int(PuzzleLayoutResolverScript.DIFFICULTY_PRESETS[index]["target"])
	var cleaned := custom_target_edit.text.strip_edges()
	if cleaned.is_valid_int():
		return clampi(
			int(cleaned),
			PuzzleLayoutResolverScript.MIN_TARGET_PIECES,
			PuzzleLayoutResolverScript.MAX_TARGET_PIECES
		)
	return current_target_piece_count


func _selected_difficulty_id() -> String:
	var index := difficulty_select.selected
	if index < PuzzleLayoutResolverScript.DIFFICULTY_PRESETS.size():
		return str(PuzzleLayoutResolverScript.DIFFICULTY_PRESETS[index]["id"])
	return "custom"


func _resolve_layout(regenerate: bool) -> void:
	current_aspect_ratio = _selected_aspect_ratio()
	current_aspect_class = _selected_aspect_class()
	current_target_piece_count = _selected_target_piece_count()
	current_difficulty_id = _selected_difficulty_id()
	current_layout = layout_resolver.resolve(
		current_aspect_ratio,
		current_target_piece_count
	)

	current_columns = int(current_layout["columns"])
	current_rows = int(current_layout["rows"])
	current_piece_count = int(current_layout["piece_count"])
	_update_preview_rect()

	layout_label.text = (
		"Target %d → %d × %d = %d pieces\nframe %.3f · cell %.3f"
	) % [
		current_target_piece_count,
		current_columns,
		current_rows,
		current_piece_count,
		current_aspect_ratio,
		float(current_layout["cell_aspect_ratio"]),
	]

	if pattern_id_edit != null:
		pattern_id_edit.text = "Classic_%03d_candidate" % current_piece_count

	if regenerate:
		_generate_candidate()
	else:
		queue_redraw()


func _update_preview_rect() -> void:
	var box_position := Vector2(360.0, 92.0)
	var box_size := Vector2(560.0, 560.0)
	var size := box_size

	if current_aspect_ratio >= 1.0:
		size.y = box_size.x / current_aspect_ratio
	else:
		size.x = box_size.y * current_aspect_ratio

	var position := box_position + (box_size - size) * 0.5
	preview_rect = Rect2(position, size)


func _on_seed_submitted(text: String) -> void:
	var cleaned := text.strip_edges()
	if cleaned.is_valid_int():
		seed = int(cleaned)
		_generate_candidate()
	else:
		seed_edit.text = str(seed)


func _read_seed_edit() -> void:
	var cleaned := seed_edit.text.strip_edges()
	if cleaned.is_valid_int():
		seed = int(cleaned)
	else:
		seed_edit.text = str(seed)


func _generate_next() -> void:
	_read_seed_edit()
	seed += 1
	_generate_candidate()


func _randomize_seed() -> void:
	seed = random_seed_rng.randi_range(100000000, 999999999)
	_generate_candidate()


func _generate_candidate() -> void:
	if style_debounce != null:
		style_debounce.stop()
	seed_edit.text = str(seed)

	var generator = CutPatternGeneratorScript.new(
		current_columns,
		current_rows,
		current_aspect_ratio,
		seed,
		_current_style_params()
	)
	current_dict = generator.generate_pattern_dict(
		"Candidate_%03d_%d" % [current_piece_count, seed],
		1,
		current_aspect_class
	)

	var authoring: Dictionary = current_dict.get("authoring", {})
	authoring["layout"] = {
		"resolver": "puzzle_layout_resolver_v1",
		"difficulty_id": current_difficulty_id,
		"target_piece_count": current_target_piece_count,
		"resolved_piece_count": current_piece_count,
		"columns": current_columns,
		"rows": current_rows,
		"frame_aspect_ratio": current_aspect_ratio,
		"aspect_class": current_aspect_class,
		"cell_aspect_ratio": float(current_layout.get("cell_aspect_ratio", 1.0)),
		"layout_score": float(current_layout.get("score", 0.0)),
	}
	current_dict["authoring"] = authoring
	current_pattern = CutPatternAssetScript.from_dict(current_dict)

	var validator = CutPatternValidatorScript.new()
	current_validation = validator.validate(current_pattern)

	var template_name := str(authoring.get("template", "unknown_template"))
	seed_label.text = "%d × %d · %d pieces · seed %d · %s" % [
		current_columns,
		current_rows,
		current_piece_count,
		seed,
		template_name,
	]
	_update_topology_label(authoring)

	if bool(current_validation["valid"]):
		validation_label.text = (
			"VALID · %d warning(s)\n"
			+ "Resolved from target %d. Approve only when you want to freeze this die."
		) % [
			current_validation["warnings"].size(),
			current_target_piece_count,
		]
		approve_button.disabled = false
	else:
		validation_label.text = "INVALID · %d error(s)\nDo not approve this candidate." % current_validation["errors"].size()
		approve_button.disabled = true

	queue_redraw()


func _update_topology_label(authoring: Dictionary) -> void:
	var distribution: Dictionary = authoring.get("topology_distribution", {})
	if distribution.is_empty():
		topology_label.text = "Topology stats unavailable"
		return

	var rhythm_score := float(authoring.get("topology_rhythm_score", -1.0))
	topology_label.text = (
		"4 凹            %d\n"
		+ "3 凹 / 1 凸    %d\n"
		+ "2 凹 / 2 凸    %d\n"
		+ "1 凹 / 3 凸    %d\n"
		+ "4 凸            %d\n\n"
		+ "Rhythm score   %.2f"
	) % [
		int(distribution.get("zero_tabs", 0)),
		int(distribution.get("one_tab", 0)),
		int(distribution.get("two_tabs", 0)),
		int(distribution.get("three_tabs", 0)),
		int(distribution.get("four_tabs", 0)),
		rhythm_score,
	]


func _settings_string() -> String:
	return (
		"Piecepace Die Lab · %d pieces · target %d · aspect %.4f · grid %dx%d"
		+ " · seed %d · height %.2f · round %.2f · asym %.2f · blend %.2f · curve %.2f"
	) % [
		current_piece_count,
		current_target_piece_count,
		current_aspect_ratio,
		current_columns,
		current_rows,
		seed,
		height_slider.value,
		roundness_slider.value,
		asymmetry_slider.value,
		blend_slider.value,
		curvature_slider.value,
	]


func _copy_settings() -> void:
	DisplayServer.clipboard_set(_settings_string())
	validation_label.text = "Settings copied to clipboard."


func _paste_settings() -> void:
	var text := DisplayServer.clipboard_get().strip_edges()
	if text.is_empty():
		validation_label.text = "Clipboard is empty."
		return

	var tokens := text.replace("·", " ").split(" ", false)
	var parsed_any := false
	var imported_pieces := -1
	var imported_target := -1
	var imported_aspect := -1.0

	for index in range(tokens.size()):
		var token := str(tokens[index])
		if token == "pieces" and index > 0:
			var previous := str(tokens[index - 1])
			if previous.is_valid_int():
				imported_pieces = int(previous)
				parsed_any = true
		elif index + 1 < tokens.size():
			var next_value := str(tokens[index + 1])
			match token:
				"target":
					if next_value.is_valid_int():
						imported_target = int(next_value)
						parsed_any = true
				"aspect":
					if next_value.is_valid_float():
						imported_aspect = float(next_value)
						parsed_any = true
				"seed":
					if next_value.is_valid_int():
						seed = int(next_value)
						parsed_any = true
				"height":
					if next_value.is_valid_float():
						height_slider.value = float(next_value)
						parsed_any = true
				"round":
					if next_value.is_valid_float():
						roundness_slider.value = float(next_value)
						parsed_any = true
				"asym":
					if next_value.is_valid_float():
						asymmetry_slider.value = float(next_value)
						parsed_any = true
				"blend":
					if next_value.is_valid_float():
						blend_slider.value = float(next_value)
						parsed_any = true
				"curve":
					if next_value.is_valid_float():
						curvature_slider.value = float(next_value)
						parsed_any = true

	if not parsed_any:
		validation_label.text = "Clipboard does not contain Piecepace Die Lab settings."
		return

	if imported_aspect > 0.0:
		_select_aspect_value(imported_aspect)
	if imported_target < 0 and imported_pieces > 0:
		imported_target = imported_pieces
	if imported_target > 0:
		_select_target_value(imported_target)

	_update_slider_labels()
	if style_debounce != null:
		style_debounce.stop()
	_resolve_layout(false)
	_generate_candidate()


func _select_aspect_value(value: float) -> void:
	var safe_value := clampf(value, 0.50, 2.00)
	for index in range(PuzzleLayoutResolverScript.ASPECT_PRESETS.size()):
		var preset_value := float(PuzzleLayoutResolverScript.ASPECT_PRESETS[index]["aspect"])
		if is_equal_approx(preset_value, safe_value):
			aspect_select.select(index)
			custom_aspect_edit.editable = false
			custom_aspect_edit.text = "%.4f" % preset_value
			return

	aspect_select.select(PuzzleLayoutResolverScript.ASPECT_PRESETS.size())
	custom_aspect_edit.editable = true
	custom_aspect_edit.text = "%.4f" % safe_value


func _select_target_value(value: int) -> void:
	var safe_value := clampi(
		value,
		PuzzleLayoutResolverScript.MIN_TARGET_PIECES,
		PuzzleLayoutResolverScript.MAX_TARGET_PIECES
	)
	for index in range(PuzzleLayoutResolverScript.DIFFICULTY_PRESETS.size()):
		var preset_target := int(PuzzleLayoutResolverScript.DIFFICULTY_PRESETS[index]["target"])
		if preset_target == safe_value:
			difficulty_select.select(index)
			custom_target_edit.editable = false
			custom_target_edit.text = str(preset_target)
			return

	difficulty_select.select(PuzzleLayoutResolverScript.DIFFICULTY_PRESETS.size())
	custom_target_edit.editable = true
	custom_target_edit.text = str(safe_value)


func _reset_style() -> void:
	height_slider.value = 1.0
	roundness_slider.value = 1.0
	asymmetry_slider.value = 0.35
	blend_slider.value = 1.0
	curvature_slider.value = 1.0
	_update_slider_labels()
	if style_debounce != null:
		style_debounce.stop()
	_generate_candidate()


func _approve_current() -> void:
	if current_pattern == null or not bool(current_validation.get("valid", false)):
		return

	var requested_id := pattern_id_edit.text.strip_edges()
	if requested_id.is_empty():
		requested_id = "Classic_%03d_%d" % [current_piece_count, seed]

	var safe_id := requested_id.replace("/", "_").replace("\\", "_")
	current_dict["pattern_id"] = safe_id

	var authoring: Dictionary = current_dict["authoring"]
	authoring["curated"] = true
	current_dict["authoring"] = authoring

	var metadata: Dictionary = current_dict["validation_metadata"]
	metadata["validated"] = true
	metadata["piece_self_intersections"] = 0
	metadata["segment_self_intersections"] = 0
	current_dict["validation_metadata"] = metadata

	var path := "res://cut_patterns/%s.json" % safe_id
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		validation_label.text = "Could not write %s" % path
		return

	file.store_string(JSON.stringify(current_dict, "\t"))
	file.close()
	validation_label.text = "APPROVED → %s" % path


func _draw_design_segment(segment: PackedVector2Array) -> void:
	var points := PackedVector2Array()
	var design_size := Vector2(current_pattern.aspect_ratio, 1.0)

	for point in segment:
		points.append(
			preview_rect.position
			+ Vector2(
				point.x / design_size.x * preview_rect.size.x,
				point.y / design_size.y * preview_rect.size.y
			)
		)

	draw_polyline(points, Color(0.04, 0.04, 0.04), 2.0, true)
