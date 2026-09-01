extends Node2D

const CutPatternAssetScript = preload("res://scripts/cut_pattern_asset.gd")
const CutPatternGeneratorScript = preload("res://scripts/cut_pattern_generator.gd")
const CutPatternValidatorScript = preload("res://scripts/cut_pattern_validator.gd")

const DEFAULT_COLUMNS := 4
const DEFAULT_ROWS := 3
const DEFAULT_ASPECT_RATIO := 1.6
const DEFAULT_ASPECT_CLASS := "landscape_16_10"

var seed := 424242
var current_pattern: CutPatternAsset
var current_dict: Dictionary = {}
var current_validation: Dictionary = {}

var preview_rect := Rect2(Vector2(240.0, 105.0), Vector2(800.0, 500.0))
var seed_label: Label
var validation_label: Label
var pattern_id_edit: LineEdit
var approve_button: Button


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
	title.position = Vector2(24.0, 18.0)
	title.add_theme_font_size_override("font_size", 24)
	layer.add_child(title)

	seed_label = Label.new()
	seed_label.position = Vector2(26.0, 56.0)
	seed_label.add_theme_font_size_override("font_size", 14)
	layer.add_child(seed_label)

	pattern_id_edit = LineEdit.new()
	pattern_id_edit.text = "Classic_012_candidate"
	pattern_id_edit.position = Vector2(24.0, 650.0)
	pattern_id_edit.size = Vector2(240.0, 38.0)
	layer.add_child(pattern_id_edit)

	var next_button := Button.new()
	next_button.text = "Generate Next"
	next_button.position = Vector2(280.0, 650.0)
	next_button.size = Vector2(160.0, 38.0)
	next_button.pressed.connect(_generate_next)
	layer.add_child(next_button)

	approve_button = Button.new()
	approve_button.text = "Approve JSON"
	approve_button.position = Vector2(452.0, 650.0)
	approve_button.size = Vector2(150.0, 38.0)
	approve_button.pressed.connect(_approve_current)
	layer.add_child(approve_button)

	validation_label = Label.new()
	validation_label.position = Vector2(625.0, 655.0)
	validation_label.size = Vector2(620.0, 32.0)
	layer.add_child(validation_label)


func _generate_next() -> void:
	seed += 1
	_generate_candidate()


func _generate_candidate() -> void:
	var generator = CutPatternGeneratorScript.new(
		DEFAULT_COLUMNS,
		DEFAULT_ROWS,
		DEFAULT_ASPECT_RATIO,
		seed
	)
	current_dict = generator.generate_pattern_dict(
		"Candidate_012_%d" % seed,
		1,
		DEFAULT_ASPECT_CLASS
	)
	current_pattern = CutPatternAssetScript.from_dict(current_dict)

	var validator = CutPatternValidatorScript.new()
	current_validation = validator.validate(current_pattern)

	seed_label.text = "4 × 3 · seed %d · classic_cardboard_v1" % seed
	if bool(current_validation["valid"]):
		validation_label.text = "VALID · %d warning(s)" % current_validation["warnings"].size()
		approve_button.disabled = false
	else:
		validation_label.text = "INVALID · %d error(s)" % current_validation["errors"].size()
		approve_button.disabled = true

	queue_redraw()


func _approve_current() -> void:
	if current_pattern == null or not bool(current_validation.get("valid", false)):
		return

	var requested_id := pattern_id_edit.text.strip_edges()
	if requested_id.is_empty():
		requested_id = "Classic_012_%d" % seed

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
