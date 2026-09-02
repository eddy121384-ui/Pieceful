extends "res://authoring/die_preview.gd"

const CutPatternGeneratorV16Script = preload("res://scripts/cut_pattern_generator_v16.gd")

var transition_length_slider: HSlider
var transition_fairness_slider: HSlider
var transition_length_value: Label
var transition_fairness_value: Label


func _build_ui() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)

	var title := Label.new()
	title.text = "Piecepace · Die Lab"
	title.position = Vector2(24.0, 12.0)
	title.add_theme_font_size_override("font_size", 24)
	layer.add_child(title)

	var subtitle := Label.new()
	subtitle.text = "V16 transition fairing · dynamic layout resolver"
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


func _build_style_controls(layer: CanvasLayer) -> void:
	var slider_setup := _make_slider(layer, "Tab Depth / 凸榫深度", 318.0, 0.88, 1.22, 0.01, 1.00)
	height_slider = slider_setup["slider"]
	height_value = slider_setup["value_label"]

	slider_setup = _make_slider(layer, "Crown Width / Roundness", 362.0, 0.90, 1.14, 0.01, 1.00)
	roundness_slider = slider_setup["slider"]
	roundness_value = slider_setup["value_label"]

	slider_setup = _make_slider(layer, "Tab Asymmetry / 凸榫不對稱", 406.0, 0.00, 1.00, 0.01, 0.35)
	asymmetry_slider = slider_setup["slider"]
	asymmetry_value = slider_setup["value_label"]

	slider_setup = _make_slider(layer, "Shoulder Blend / 肩部延伸", 450.0, 0.70, 1.40, 0.01, 1.00)
	blend_slider = slider_setup["slider"]
	blend_value = slider_setup["value_label"]

	slider_setup = _make_slider(layer, "Ribbon Curvature / 主刀線曲率", 494.0, 0.60, 1.70, 0.05, 1.00)
	curvature_slider = slider_setup["slider"]
	curvature_value = slider_setup["value_label"]

	slider_setup = _make_slider(layer, "Transition Length / 過渡長度", 538.0, 0.55, 1.00, 0.01, 1.00)
	transition_length_slider = slider_setup["slider"]
	transition_length_value = slider_setup["value_label"]

	slider_setup = _make_slider(layer, "Transition Fairness / 過渡滑順度", 582.0, 0.00, 1.00, 0.01, 0.90)
	transition_fairness_slider = slider_setup["slider"]
	transition_fairness_value = slider_setup["value_label"]

	var copy_button := Button.new()
	copy_button.text = "Copy Settings"
	copy_button.position = Vector2(24.0, 632.0)
	copy_button.size = Vector2(145.0, 34.0)
	copy_button.pressed.connect(_copy_settings)
	layer.add_child(copy_button)

	var paste_button := Button.new()
	paste_button.text = "Paste Settings"
	paste_button.position = Vector2(179.0, 632.0)
	paste_button.size = Vector2(145.0, 34.0)
	paste_button.pressed.connect(_paste_settings)
	layer.add_child(paste_button)

	var reset_button := Button.new()
	reset_button.text = "Reset Shape"
	reset_button.position = Vector2(24.0, 674.0)
	reset_button.size = Vector2(300.0, 34.0)
	reset_button.pressed.connect(_reset_style)
	layer.add_child(reset_button)


func _update_slider_labels() -> void:
	super()
	if transition_length_value == null:
		return
	transition_length_value.text = "%.2f" % transition_length_slider.value
	transition_fairness_value.text = "%.2f" % transition_fairness_slider.value


func _current_style_params() -> Dictionary:
	var result: Dictionary = super()
	result["transition_length"] = transition_length_slider.value
	result["transition_fairness"] = transition_fairness_slider.value
	return result


func _generate_candidate() -> void:
	if style_debounce != null:
		style_debounce.stop()
	seed_edit.text = str(seed)

	var generator = CutPatternGeneratorV16Script.new(
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
			+ "V16 fairing · target %d. Approve only when you want to freeze this die."
		) % [
			current_validation["warnings"].size(),
			current_target_piece_count,
		]
		approve_button.disabled = false
	else:
		validation_label.text = "INVALID · %d error(s)\nDo not approve this candidate." % current_validation["errors"].size()
		approve_button.disabled = true

	queue_redraw()


func _settings_string() -> String:
	return (
		"Piecepace Die Lab · %d pieces · target %d · aspect %.4f · grid %dx%d"
		+ " · seed %d · height %.2f · round %.2f · asym %.2f · blend %.2f · curve %.2f"
		+ " · translen %.2f · fairness %.2f"
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
		transition_length_slider.value,
		transition_fairness_slider.value,
	]


func _paste_settings() -> void:
	var text := DisplayServer.clipboard_get().strip_edges()
	var tokens := text.replace("·", " ").split(" ", false)
	for index in range(tokens.size() - 1):
		var token := str(tokens[index])
		var next_value := str(tokens[index + 1])
		if token == "translen" and next_value.is_valid_float():
			transition_length_slider.value = clampf(float(next_value), 0.55, 1.00)
		elif token == "fairness" and next_value.is_valid_float():
			transition_fairness_slider.value = clampf(float(next_value), 0.00, 1.00)
	super()


func _reset_style() -> void:
	transition_length_slider.value = 1.00
	transition_fairness_slider.value = 0.90
	super()
