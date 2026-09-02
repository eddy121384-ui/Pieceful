extends "res://scripts/cut_pattern_generator_v14.gd"

# V15 turns the visually tuned Die Lab controls into first-class authoring
# parameters while preserving V14 topology optimization and the V9/V11 global
# C2 ribbon construction. Runtime still consumes approved CutPattern JSON only.

const V15_GENERATOR_VERSION := 15
const V15_TEMPLATE_NAME := "classic_cardboard_v15_parametric_die_lab"

const HEIGHT_MIN := 0.88
const HEIGHT_MAX := 1.22
const ROUNDNESS_MIN := 0.90
const ROUNDNESS_MAX := 1.14
const ASYMMETRY_MIN := 0.0
const ASYMMETRY_MAX := 1.0
const SHOULDER_BLEND_MIN := 0.70
const SHOULDER_BLEND_MAX := 1.40
const RIBBON_CURVATURE_MIN := 0.60
const RIBBON_CURVATURE_MAX := 1.70

var mushroom_height := 1.0
var mushroom_roundness := 1.0
var mushroom_asymmetry := 0.35
var shoulder_blend := 1.0
var ribbon_curvature := 1.0


func _init(
	p_columns: int,
	p_rows: int,
	p_aspect_ratio: float,
	p_seed: int,
	p_style_params: Dictionary = {}
) -> void:
	mushroom_height = clampf(
		float(p_style_params.get("mushroom_height", 1.0)),
		HEIGHT_MIN,
		HEIGHT_MAX
	)
	mushroom_roundness = clampf(
		float(p_style_params.get("mushroom_roundness", 1.0)),
		ROUNDNESS_MIN,
		ROUNDNESS_MAX
	)
	mushroom_asymmetry = clampf(
		float(p_style_params.get("mushroom_asymmetry", 0.35)),
		ASYMMETRY_MIN,
		ASYMMETRY_MAX
	)
	shoulder_blend = clampf(
		float(p_style_params.get("shoulder_blend", 1.0)),
		SHOULDER_BLEND_MIN,
		SHOULDER_BLEND_MAX
	)
	ribbon_curvature = clampf(
		float(p_style_params.get("ribbon_curvature", 1.0)),
		RIBBON_CURVATURE_MIN,
		RIBBON_CURVATURE_MAX
	)

	super(p_columns, p_rows, p_aspect_ratio, p_seed)


func _make_ribbon_profile(min_cell: float) -> Dictionary:
	var profile: Dictionary = super(min_cell)
	profile["amplitude"] = float(profile["amplitude"]) * ribbon_curvature
	profile["secondary_amplitude"] = (
		float(profile["secondary_amplitude"]) * ribbon_curvature
	)
	return profile


func _pick_edge_character(length: float, min_cell: float) -> Dictionary:
	var character: Dictionary = super(length, min_cell)

	var shoulder_base: float = (
		float(character["shoulder_left"]) + float(character["shoulder_right"])
	) * 0.5
	var neck_base: float = (
		float(character["neck_left"]) + float(character["neck_right"])
	) * 0.5
	var head_base: float = (
		float(character["head_left"]) + float(character["head_right"])
	) * 0.5 * mushroom_roundness

	# One coherent left/right bias controls the whole mushroom, rather than
	# independently jittering isolated points. This reads as commercial die
	# asymmetry instead of a crooked crown.
	var bias: float = rng.randf_range(-1.0, 1.0) * mushroom_asymmetry
	character["shoulder_left"] = shoulder_base * (1.0 - bias * 0.08)
	character["shoulder_right"] = shoulder_base * (1.0 + bias * 0.08)
	character["neck_left"] = neck_base * (1.0 + bias * 0.10)
	character["neck_right"] = neck_base * (1.0 - bias * 0.10)
	character["head_left"] = head_base * (1.0 - bias * 0.16)
	character["head_right"] = head_base * (1.0 + bias * 0.16)
	character["peak_shift"] = bias * 0.030 * length

	var side_depth: float = bias * 0.05
	character["depth"] = float(character["depth"]) * mushroom_height
	character["left_dip"] = (
		float(character["left_dip"]) * mushroom_height * (1.0 - side_depth)
	)
	character["right_dip"] = (
		float(character["right_dip"]) * mushroom_height * (1.0 + side_depth)
	)
	return character


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

	# Shoulder Blend is deliberately separate from ribbon curvature. It controls
	# how gradually the mushroom shoulder returns to the body line.
	var gate_stretch: float = 1.0 + (shoulder_blend - 1.0) * 0.22
	var shoulder_depth: float = 1.0 + (shoulder_blend - 1.0) * 0.30
	var shoulder_reach: float = 1.0 + (shoulder_blend - 1.0) * 0.18
	var left_gate: float = clampf(
		center - shoulder_left * 1.16 * gate_stretch,
		length * 0.10,
		length * 0.24
	)
	var right_gate: float = clampf(
		center + shoulder_right * 1.16 * gate_stretch,
		length * 0.76,
		length * 0.90
	)

	var local_guides := PackedVector2Array([
		Vector2(left_gate * 0.44, 0.0),
		Vector2(left_gate * 0.76, -left_dip * 0.04 * shoulder_depth),
		Vector2(left_gate, -left_dip * 0.14 * shoulder_depth),
		Vector2(center - shoulder_left * shoulder_reach, -left_dip * 0.34 * shoulder_depth),
		Vector2(center - (head_left + neck_left) * 0.58, -left_dip),
		Vector2(center - neck_left, 0.135 * depth),
		Vector2(center - head_left * 0.91, 0.480 * depth),
		Vector2(center - head_left, 0.690 * depth),
		Vector2(center - head_left * 0.91, 0.855 * depth),
		Vector2(center - head_left * 0.70, 0.990 * depth),
		Vector2(center - head_left * 0.42, 1.075 * depth),
		Vector2(center - head_left * 0.17 + peak_shift * 0.35, 1.120 * depth),
		Vector2(center + peak_shift, 1.135 * depth),
		Vector2(center + head_right * 0.17 + peak_shift * 0.35, 1.120 * depth),
		Vector2(center + head_right * 0.42, 1.075 * depth),
		Vector2(center + head_right * 0.70, 0.990 * depth),
		Vector2(center + head_right * 0.91, 0.855 * depth),
		Vector2(center + head_right, 0.690 * depth),
		Vector2(center + head_right * 0.91, 0.480 * depth),
		Vector2(center + neck_right, 0.135 * depth),
		Vector2(center + (head_right + neck_right) * 0.58, -right_dip),
		Vector2(center + shoulder_right * shoulder_reach, -right_dip * 0.34 * shoulder_depth),
		Vector2(right_gate, -right_dip * 0.14 * shoulder_depth),
		Vector2(right_gate + (length - right_gate) * 0.24, -right_dip * 0.04 * shoulder_depth),
		Vector2(right_gate + (length - right_gate) * 0.56, 0.0),
	])

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
	})
	return result


func style_params_dict() -> Dictionary:
	return {
		"mushroom_height": mushroom_height,
		"mushroom_roundness": mushroom_roundness,
		"mushroom_asymmetry": mushroom_asymmetry,
		"shoulder_blend": shoulder_blend,
		"ribbon_curvature": ribbon_curvature,
	}


func generate_pattern_dict(
	pattern_id: String,
	version: int = 1,
	aspect_ratio_class: String = "custom"
) -> Dictionary:
	var result: Dictionary = super(pattern_id, version, aspect_ratio_class)
	var authoring: Dictionary = result.get("authoring", {})
	authoring["generator_version"] = V15_GENERATOR_VERSION
	authoring["template"] = V15_TEMPLATE_NAME
	authoring["geometry_rule"] = "global_c2_parametric_classic_mushroom"
	authoring["style_params"] = style_params_dict()
	result["authoring"] = authoring
	return result
