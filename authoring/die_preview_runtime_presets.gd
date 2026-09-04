extends "res://authoring/die_preview_v16.gd"


func _build_curation_controls(layer: CanvasLayer) -> void:
	super(layer)

	var standard_button := Button.new()
	standard_button.text = "Standard · ~144 → 150"
	standard_button.position = Vector2(944.0, 670.0)
	standard_button.size = Vector2(150.0, 34.0)
	standard_button.tooltip_text = "Load the 960×600 Standard runtime candidate"
	standard_button.pressed.connect(_load_demo_standard_runtime)
	layer.add_child(standard_button)

	var hard_button := Button.new()
	hard_button.text = "Hard · ~288 → 286"
	hard_button.position = Vector2(1104.0, 670.0)
	hard_button.size = Vector2(150.0, 34.0)
	hard_button.tooltip_text = "Load the 960×600 Hard runtime candidate"
	hard_button.pressed.connect(_load_demo_hard_runtime)
	layer.add_child(hard_button)


func _load_demo_standard_runtime() -> void:
	_load_demo_runtime_preset(
		"standard",
		144,
		15,
		10,
		150,
		"Classic_150_A"
	)


func _load_demo_hard_runtime() -> void:
	_load_demo_runtime_preset(
		"hard",
		288,
		22,
		13,
		286,
		"Classic_286_A"
	)


func _load_demo_runtime_preset(
	difficulty_id: String,
	target_piece_count: int,
	expected_columns: int,
	expected_rows: int,
	expected_piece_count: int,
	approved_pattern_id: String
) -> void:
	_select_aspect_value(1.6)
	_select_target_value(target_piece_count)
	_resolve_layout(false)

	# Assign a production asset ID only when the resolver produces the exact
	# expected 1.6:1 grid. Any future resolver change must be reviewed instead of
	# silently approving a different die under the old filename.
	if (
		current_difficulty_id == difficulty_id
		and current_columns == expected_columns
		and current_rows == expected_rows
		and current_piece_count == expected_piece_count
	):
		pattern_id_edit.text = approved_pattern_id
	else:
		pattern_id_edit.text = "Classic_%03d_candidate" % current_piece_count

	_generate_candidate()
