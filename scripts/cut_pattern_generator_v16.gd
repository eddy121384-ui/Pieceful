extends "res://scripts/cut_pattern_generator_v15.gd"

# V16 keeps the V15 crown / neck proportions and the V14 topology model, but
# replaces the old hand-staged shoulder/root return points with one continuous
# fairing profile. The additive tab feature fades into the ribbon with a
# quintic smootherstep-shaped envelope before the shared junction.
# Runtime still consumes approved CutPattern JSON only.

const V16_GENERATOR_VERSION := 16
const V16_TEMPLATE_NAME := "classic_cardboard_v16_transition_fairing"

const TRANSITION_LENGTH_MIN := 0.55
const TRANSITION_LENGTH_MAX := 1.00
const TRANSITION_FAIRNESS_MIN := 0.00
const TRANSITION_FAIRNESS_MAX := 1.00
const FAIRING_SAMPLES := 5

var transition_length := 1.00
var transition_fairness := 0.90


func _init(
	p_columns: int,
	p_rows: int,
	p_aspect_ratio: float,
	p_seed: int,
	p_style_params: Dictionary = {}
) -> void:
	transition_length = clampf(
		float(p_style_params.get("transition_length", 1.00)),
		TRANSITION_LENGTH_MIN,
		TRANSITION_LENGTH_MAX
	)
	transition_fairness = clampf(
		float(p_style_params.get("transition_fairness", 0.90)),
		TRANSITION_FAIRNESS_MIN,
		TRANSITION_FAIRNESS_MAX
	)
	super(p_columns, p_rows, p_aspect_ratio, p_seed, p_style_params)


func _fairing_value(t: float) -> float:
	var u := clampf(t, 0.0, 1.0)
	var quintic := u * u * u * (10.0 + u * (-15.0 + 6.0 * u))
	return lerpf(u, quintic, transition_fairness)


func _append_left_fairing(
	guides: PackedVector2Array,
	transition_start_x: float,
	root_x: float,
	root_depth: float,
	length: float
) -> void:
	var span := maxf(root_x - transition_start_x, length * 0.02)
	if transition_start_x > length * 0.002:
		guides.append(Vector2(transition_start_x, 0.0))

	for sample_index in range(1, FAIRING_SAMPLES + 1):
		var t := float(sample_index) / float(FAIRING_SAMPLES)
		var x := transition_start_x + span * t
		var y := -root_depth * _fairing_value(t)
		guides.append(Vector2(x, y))


func _append_right_fairing(
	guides: PackedVector2Array,
	root_x: float,
	transition_end_x: float,
	root_depth: float,
	length: float
) -> void:
	var span := maxf(transition_end_x - root_x, length * 0.02)
	for sample_index in range(FAIRING_SAMPLES):
		var t := float(sample_index) / float(FAIRING_SAMPLES)
		var x := root_x + span * t
		var y := -root_depth * (1.0 - _fairing_value(t))
		guides.append(Vector2(x, y))

	if transition_end_x < length * 0.998:
		guides.append(Vector2(transition_end_x, 0.0))


func _make_cell_guides(
	start: Vector2,
	finish: Vector2,
	cell_index: int,
	cell_count: int,
	ribbon_profile: Dictionary,
	tab_sign: float
) -> PackedVector2Array:
	var delta := finish - start
	var length: float = delta.length()
	if length <= 0.000001:
		return PackedVector2Array()

	var tangent := delta / length
	var normal := Vector2(-tangent.y, tangent.x)
	var min_cell: float = minf(cell_size.x, cell_size.y)
	var character := _pick_edge_character(length, min_cell)

	var center_ratio: float = float(character["center_ratio"])
	var center: float = center_ratio * length
	var depth: float = float(character["depth"])
	var shoulder_left: float = float(character["shoulder_left"])
	var shoulder_right: float = float(character["shoulder_right"])
	var neck_left: float = float(character["neck_left"])
	var neck_right: float = float(character["neck_right"])
	var head_left: float = float(character["head_left"])
	var head_right: float = float(character["head_right"])
	var peak_shift: float = float(character["peak_shift"])
	var left_dip: float = float(character["left_dip"])
	var right_dip: float = float(character["right_dip"])

	# Shoulder Blend now controls how far the root reaches into the body line.
	# Transition Length separately controls how much of the remaining run toward
	# the junction participates in the fairing. This keeps feature anatomy and
	# shoulder-to-ribbon recovery as two independent visual dimensions.
	var root_shift_scale: float = (shoulder_blend - 1.0) * 0.12
	var left_root_x := (
		center
		- (head_left + neck_left) * 0.58
		- shoulder_left * root_shift_scale
	)
	var right_root_x := (
		center
		+ (head_right + neck_right) * 0.58
		+ shoulder_right * root_shift_scale
	)

	left_root_x = clampf(left_root_x, length * 0.24, center - neck_left * 1.35)
	right_root_x = clampf(right_root_x, center + neck_right * 1.35, length * 0.76)

	var left_transition_start := left_root_x * (1.0 - transition_length)
	var right_transition_end := (
		right_root_x + (length - right_root_x) * transition_length
	)

	var local_guides := PackedVector2Array()
	_append_left_fairing(
		local_guides,
		left_transition_start,
		left_root_x,
		left_dip,
		length
	)

	# Crown / neck language is intentionally inherited unchanged from V11/V15.
	local_guides.append(Vector2(center - neck_left, 0.135 * depth))
	local_guides.append(Vector2(center - head_left * 0.91, 0.480 * depth))
	local_guides.append(Vector2(center - head_left, 0.690 * depth))
	local_guides.append(Vector2(center - head_left * 0.91, 0.855 * depth))
	local_guides.append(Vector2(center - head_left * 0.70, 0.990 * depth))
	local_guides.append(Vector2(center - head_left * 0.42, 1.075 * depth))
	local_guides.append(Vector2(center - head_left * 0.17 + peak_shift * 0.35, 1.120 * depth))
	local_guides.append(Vector2(center + peak_shift, 1.135 * depth))
	local_guides.append(Vector2(center + head_right * 0.17 + peak_shift * 0.35, 1.120 * depth))
	local_guides.append(Vector2(center + head_right * 0.42, 1.075 * depth))
	local_guides.append(Vector2(center + head_right * 0.70, 0.990 * depth))
	local_guides.append(Vector2(center + head_right * 0.91, 0.855 * depth))
	local_guides.append(Vector2(center + head_right, 0.690 * depth))
	local_guides.append(Vector2(center + head_right * 0.91, 0.480 * depth))
	local_guides.append(Vector2(center + neck_right, 0.135 * depth))

	_append_right_fairing(
		local_guides,
		right_root_x,
		right_transition_end,
		right_dip,
		length
	)

	var result := PackedVector2Array()
	for local_point in local_guides:
		var local_ratio: float = clampf(local_point.x / length, 0.0, 1.0)
		var global_ratio: float = (
			float(cell_index) + local_ratio
		) / maxf(float(cell_count), 1.0)
		var body_offset: float = _ribbon_offset(ribbon_profile, global_ratio)
		result.append(
			start
			+ tangent * local_point.x
			+ normal * (body_offset + local_point.y * tab_sign)
		)

	var neck_width: float = neck_left + neck_right
	var head_width: float = head_left + head_right
	segment_metrics.append({
		"neck_width_ratio": neck_width / length,
		"depth_ratio": depth * 1.135 / min_cell,
		"center_ratio": center_ratio,
		"head_to_neck_ratio": head_width / maxf(neck_width, 0.000001),
		"archetype": character["archetype"],
		"transition_length": transition_length,
		"transition_fairness": transition_fairness,
	})
	return result


func style_params_dict() -> Dictionary:
	var result: Dictionary = super()
	result["transition_length"] = transition_length
	result["transition_fairness"] = transition_fairness
	return result


func generate_pattern_dict(
	pattern_id: String,
	version: int = 1,
	aspect_ratio_class: String = "custom"
) -> Dictionary:
	var result: Dictionary = super(pattern_id, version, aspect_ratio_class)
	var authoring: Dictionary = result.get("authoring", {})
	authoring["generator_version"] = V16_GENERATOR_VERSION
	authoring["template"] = V16_TEMPLATE_NAME
	authoring["geometry_rule"] = "global_c2_tab_feature_with_quintic_transition_fairing"
	authoring["fairing_model"] = {
		"type": "quintic_smootherstep_guides",
		"samples_per_side": FAIRING_SAMPLES,
		"transition_length": transition_length,
		"transition_fairness": transition_fairness,
	}
	authoring["style_params"] = style_params_dict()
	result["authoring"] = authoring
	return result
