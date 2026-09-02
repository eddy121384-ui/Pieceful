extends Node2D

const CutPatternAssetScript = preload("res://scripts/cut_pattern_asset.gd")
const CutPatternGeneratorScript = preload("res://scripts/cut_pattern_generator.gd")
const CutPatternValidatorScript = preload("res://scripts/cut_pattern_validator.gd")

const PRESET_12_COLUMNS := 4
const PRESET_12_ROWS := 3
const PRESET_12_ASPECT_RATIO := 1.6
const PRESET_12_ASPECT_CLASS := "landscape_16_10"

const PRESET_36_COLUMNS := 6
const PRESET_36_ROWS := 6
const PRESET_36_ASPECT_RATIO := 1.0
const PRESET_36_ASPECT_CLASS := "square_1_1"

var seed := 424242
var current_pattern: CutPatternAsset
var current_dict: Dictionary = {}
var current_validation: Dictionary = {}

# Authoring now defaults to 36 pieces so topology distribution and whole-board
# die rhythm are visible. The 12-piece prototype remains available as a preset.
var current_columns := PRESET_36_COLUMNS
var current_rows := PRESET_36_ROWS
var current_aspect_ratio := PRESET_36_ASPECT_RATIO
var current_aspect_class := PRESET_36_ASPECT_CLASS
var current_piece_count := 36

var preview_rect := Rect2(Vector2(360.0, 92.0), Vector2(560.0, 560.0))
var seed_label: Label
var topology_label: Label
var validation_label: Label
var pattern_id_edit: LineEdit
var approve_button: Button
var preset_select: OptionButton


func _ready() -> void:
	_build_ui()
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
	title.text = "Piecepace · Classic Die Authoring"
	title.position = Vector2(24.0, 16.0)
	title.add_theme_font_size_override("font_size", 24)
	layer.add_child(title)

	preset_select = OptionButton.new()
	preset_select.position = Vector2(934.0, 18.0)
	preset_select.size = Vector2(300.0, 36.0)
	preset_select.add_item("36 pieces · 6 × 6", 36)
	preset_select.add_item("12 pieces · 4 × 3", 12)
	preset_select.select(0)
	preset_select.item_selected.connect(_on_preset_selected)
	layer.add_child(preset_select)

	seed_label = Label.new()
	seed_label.position = Vector2(26.0, 54.0)
	seed_label.size = Vector2(620.0, 24.0)
	seed_label.add_theme_font_size_override("font_size", 14)
	layer.add_child(seed_label)

	topology_label = Label.new()
	topology_label.position = Vector2(650.0, 56.0)
	topology_label.size = Vector2(584.0, 22.0)
	topology_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	topology_label.add_theme_font_size_override("font_size", 13)
	layer.add_child(topology_label)

	pattern_id_edit = LineEdit.new()
	pattern_id_edit.text = "Classic_036_candidate"
	pattern_id_edit.position = Vector2(24.0, 666.0)
	pattern_id_edit.size = Vector2(240.0, 38.0)
	layer.add_child(pattern_id_edit)

	var next_button := Button.new()
	next_button.text = "Generate Next"
	next_button.position = Vector2(280.0, 666.0)
	next_button.size = Vector2(160.0, 38.0)
	next_button.pressed.connect(_generate_next)
	layer.add_child(next_button)

	approve_button = Button.new()
	approve_button.text = "Approve JSON"
	approve_button.position = Vector2(452.0, 666.0)
	approve_button.size = Vector2(150.0, 38.0)
	approve_button.pressed.connect(_approve_current)
	layer.add_child(approve_button)

	validation_label = Label.new()
	validation_label.position = Vector2(625.0, 671.0)
	validation_label.size = Vector2(609.0, 30.0)
	layer.add_child(validation_label)


func _on_preset_selected(index: int) -> void:
	var preset_id: int = preset_select.get_item_id(index)
	if preset_id == 12:
		current_columns = PRESET_12_COLUMNS
		current_rows = PRESET_12_ROWS
		current_aspect_ratio = PRESET_12_ASPECT_RATIO
		current_aspect_class = PRESET_12_ASPECT_CLASS
		current_piece_count = 12
		preview_rect = Rect2(Vector2(240.0, 112.0), Vector2(800.0, 500.0))
		pattern_id_edit.text = "Classic_012_candidate"
	else:
		current_columns = PRESET_36_COLUMNS
		current_rows = PRESET_36_ROWS
		current_aspect_ratio = PRESET_36_ASPECT_RATIO
		current_aspect_class = PRESET_36_ASPECT_CLASS
		current_piece_count = 36
		preview_rect = Rect2(Vector2(360.0, 92.0), Vector2(560.0, 560.0))
		pattern_id_edit.text = "Classic_036_candidate"

	_generate_candidate()


func _generate_next() -> void:
	seed += 1
	_generate_candidate()


func _generate_candidate() -> void:
	var generator = CutPatternGeneratorScript.new(
		current_columns,
		current_rows,
		current_aspect_ratio,
		seed
	)
	current_dict = generator.generate_pattern_dict(
		"Candidate_%03d_%d" % [current_piece_count, seed],
		1,
		current_aspect_class
	)
	current_pattern = CutPatternAssetScript.from_dict(current_dict)

	var validator = CutPatternValidatorScript.new()
	current_validation = validator.validate(current_pattern)

	var authoring: Dictionary = current_dict.get("authoring", {})
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
		validation_label.text = "VALID · %d warning(s)" % current_validation["warnings"].size()
		approve_button.disabled = false
	else:
		validation_label.text = "INVALID · %d error(s)" % current_validation["errors"].size()
		approve_button.disabled = true

	queue_redraw()


func _update_topology_label(authoring: Dictionary) -> void:
	var distribution: Dictionary = authoring.get("topology_distribution", {})
	if distribution.is_empty():
		topology_label.text = "Topology stats unavailable"
		return

	# Counts refer only to true four-sided interior pieces. In this notation,
	# 0T = four blanks and 4T = four tabs.
	topology_label.text = "Interior · 4B %d  ·  3B/1T %d  ·  2B/2T %d  ·  1B/3T %d  ·  4T %d" % [
		int(distribution.get("zero_tabs", 0)),
		int(distribution.get("one_tab", 0)),
		int(distribution.get("two_tabs", 0)),
		int(distribution.get("three_tabs", 0)),
		int(distribution.get("four_tabs", 0)),
	]


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
