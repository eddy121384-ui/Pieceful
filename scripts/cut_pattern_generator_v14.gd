extends "res://scripts/cut_pattern_generator.gd"

# V14 keeps V13's global C2 ribbon geometry and rounded mushroom caps intact.
# Only the shared tab/blank topology changes. Instead of starting from a
# checkerboard and perturbing it, V14 searches several random shared-edge
# layouts and locally optimizes them for a more commercial, less algorithmic
# whole-board rhythm.

const V14_GENERATOR_VERSION := 14
const V14_TEMPLATE_NAME := "classic_cardboard_v14_topology_rhythm"

const TARGET_ZERO_TAB := 0.03
const TARGET_ONE_TAB := 0.19
const TARGET_TWO_TAB := 0.56
const TARGET_THREE_TAB := 0.19
const TARGET_FOUR_TAB := 0.03

const RESTARTS := 10
const STEPS_PER_RESTART := 140

var topology_rhythm_score := 0.0


func _build_edge_polarities() -> void:
	# Canonical sign semantics are inherited from V13:
	# H +1 => tab for piece above; V +1 => tab for piece right.
	# Outer edges remain flat / zero.
	horizontal_polarities.resize((rows + 1) * columns)
	vertical_polarities.resize(rows * (columns + 1))

	var topology_rng := RandomNumberGenerator.new()
	topology_rng.seed = seed + 314159

	var best_horizontal := PackedInt32Array()
	var best_vertical := PackedInt32Array()
	var best_score := INF

	for restart in range(RESTARTS):
		_randomize_full_topology(topology_rng)
		var current_score: float = _topology_rhythm_score()

		for step in range(STEPS_PER_RESTART):
			var edge := _pick_internal_edge(topology_rng)
			_flip_edge(edge)
			var proposed_score: float = _topology_rhythm_score()
			var progress: float = float(step) / maxf(float(STEPS_PER_RESTART - 1), 1.0)
			var temperature: float = lerpf(0.85, 0.035, progress)
			var delta: float = proposed_score - current_score
			var accept := delta <= 0.0
			if not accept and temperature > 0.000001:
				accept = topology_rng.randf() < exp(-delta / temperature)

			if accept:
				current_score = proposed_score
			else:
				_flip_edge(edge)

		if current_score < best_score:
			best_score = current_score
			best_horizontal = horizontal_polarities.duplicate()
			best_vertical = vertical_polarities.duplicate()

	horizontal_polarities = best_horizontal
	vertical_polarities = best_vertical
	topology_rhythm_score = best_score


func _randomize_full_topology(topology_rng: RandomNumberGenerator) -> void:
	for index in range(horizontal_polarities.size()):
		horizontal_polarities[index] = 0
	for index in range(vertical_polarities.size()):
		vertical_polarities[index] = 0

	for boundary_row in range(1, rows):
		for column in range(columns):
			horizontal_polarities[boundary_row * columns + column] = (
				1 if topology_rng.randi_range(0, 1) == 0 else -1
			)

	for row in range(rows):
		for boundary_column in range(1, columns):
			vertical_polarities[row * (columns + 1) + boundary_column] = (
				1 if topology_rng.randi_range(0, 1) == 0 else -1
			)


func _pick_internal_edge(topology_rng: RandomNumberGenerator) -> Vector3i:
	var horizontal_count: int = maxi(0, rows - 1) * columns
	var vertical_count: int = rows * maxi(0, columns - 1)
	var total: int = horizontal_count + vertical_count
	if total <= 0:
		return Vector3i(0, 0, 0)

	var pick: int = topology_rng.randi_range(0, total - 1)
	if pick < horizontal_count:
		var boundary_row: int = 1 + int(pick / columns)
		var column: int = pick % columns
		return Vector3i(0, boundary_row, column)

	var vertical_pick: int = pick - horizontal_count
	var inner_columns: int = maxi(columns - 1, 1)
	var row: int = int(vertical_pick / inner_columns)
	var boundary_column: int = 1 + vertical_pick % inner_columns
	return Vector3i(1, row, boundary_column)


func _flip_edge(edge: Vector3i) -> void:
	if edge.x == 0:
		var index: int = edge.y * columns + edge.z
		horizontal_polarities[index] = -horizontal_polarities[index]
	else:
		var index: int = edge.y * (columns + 1) + edge.z
		vertical_polarities[index] = -vertical_polarities[index]


func _topology_rhythm_score() -> float:
	var interior_rows: int = maxi(rows - 2, 0)
	var interior_columns: int = maxi(columns - 2, 0)
	var interior_count: int = interior_rows * interior_columns
	if interior_count <= 0:
		return 0.0

	var counts := PackedInt32Array()
	counts.resize(interior_count)
	var masks := PackedInt32Array()
	masks.resize(interior_count)
	var distribution := PackedInt32Array([0, 0, 0, 0, 0])

	for row in range(1, rows - 1):
		for column in range(1, columns - 1):
			var local_index: int = (row - 1) * interior_columns + (column - 1)
			var tabs: int = _piece_tab_count(row, column)
			counts[local_index] = tabs
			masks[local_index] = _piece_tab_mask(row, column)
			distribution[tabs] += 1

	var score := 0.0
	var targets := PackedFloat32Array([
		TARGET_ZERO_TAB,
		TARGET_ONE_TAB,
		TARGET_TWO_TAB,
		TARGET_THREE_TAB,
		TARGET_FOUR_TAB,
	])

	# Global silhouette mix: keep 2/2 dominant, 1/3 and 3/1 common, extremes rare.
	for tab_count in range(5):
		var actual_ratio: float = float(distribution[tab_count]) / float(interior_count)
		var error: float = actual_ratio - targets[tab_count]
		score += error * error * 18.0

	# Neighbour rhythm: exact repeated silhouettes are more suspicious than merely
	# sharing the same tab count. Extremes may exist, but should not clump.
	for row in range(interior_rows):
		for column in range(interior_columns):
			var index: int = row * interior_columns + column
			if column + 1 < interior_columns:
				score += _adjacency_penalty(
					counts[index], masks[index],
					counts[index + 1], masks[index + 1]
				)
			if row + 1 < interior_rows:
				var below: int = index + interior_columns
				score += _adjacency_penalty(
					counts[index], masks[index],
					counts[below], masks[below]
				)

	# Three-in-a-row repetitions read as manufactured stripes rather than a
	# naturally composed die. Penalize both count runs and exact-mask runs.
	for row in range(interior_rows):
		for column in range(maxi(interior_columns - 2, 0)):
			var a: int = row * interior_columns + column
			var b: int = a + 1
			var c: int = a + 2
			if counts[a] == counts[b] and counts[b] == counts[c]:
				score += 0.85
			if masks[a] == masks[b] and masks[b] == masks[c]:
				score += 2.4

	for column in range(interior_columns):
		for row in range(maxi(interior_rows - 2, 0)):
			var a: int = row * interior_columns + column
			var b: int = a + interior_columns
			var c: int = b + interior_columns
			if counts[a] == counts[b] and counts[b] == counts[c]:
				score += 0.85
			if masks[a] == masks[b] and masks[b] == masks[c]:
				score += 2.4

	# Explicitly detect the V13 failure mode: a large fraction of shared edges
	# matching either checker orientation. Inverted checkerboards count too.
	var checker_matches := 0
	var checker_total := 0
	for boundary_row in range(1, rows):
		for column in range(columns):
			var expected: int = 1 if (boundary_row + column) % 2 == 0 else -1
			if _horizontal_polarity(boundary_row, column) == expected:
				checker_matches += 1
			checker_total += 1
	for row in range(rows):
		for boundary_column in range(1, columns):
			var expected: int = 1 if (row + boundary_column) % 2 == 0 else -1
			if _vertical_polarity(row, boundary_column) == expected:
				checker_matches += 1
			checker_total += 1

	if checker_total > 0:
		var direct_alignment: float = float(checker_matches) / float(checker_total)
		var checker_alignment: float = maxf(direct_alignment, 1.0 - direct_alignment)
		if checker_alignment > 0.60:
			score += (checker_alignment - 0.60) * 24.0

	return score


func _adjacency_penalty(
	first_count: int,
	first_mask: int,
	second_count: int,
	second_mask: int
) -> float:
	var penalty := 0.0
	if first_count == second_count:
		penalty += 0.20
	if first_mask == second_mask:
		penalty += 0.85
	if (first_count == 0 or first_count == 4) and (second_count == 0 or second_count == 4):
		penalty += 3.5
	return penalty


func _piece_tab_mask(row: int, column: int) -> int:
	# Bit order: top=1, right=2, bottom=4, left=8.
	var mask := 0
	if row > 0 and horizontal_polarities[row * columns + column] < 0:
		mask |= 1
	if column < columns - 1 and vertical_polarities[row * (columns + 1) + column + 1] < 0:
		mask |= 2
	if row < rows - 1 and horizontal_polarities[(row + 1) * columns + column] > 0:
		mask |= 4
	if column > 0 and vertical_polarities[row * (columns + 1) + column] > 0:
		mask |= 8
	return mask


func generate_pattern_dict(
	pattern_id: String,
	version: int = 1,
	aspect_ratio_class: String = "custom"
) -> Dictionary:
	var result: Dictionary = super(pattern_id, version, aspect_ratio_class)
	var authoring: Dictionary = result.get("authoring", {})
	authoring["generator_version"] = V14_GENERATOR_VERSION
	authoring["template"] = V14_TEMPLATE_NAME
	authoring["topology_rule"] = "optimized_spatial_rhythm_with_rare_extremes"
	authoring["topology_target"] = {
		"zero_tabs": TARGET_ZERO_TAB,
		"one_tab": TARGET_ONE_TAB,
		"two_tabs": TARGET_TWO_TAB,
		"three_tabs": TARGET_THREE_TAB,
		"four_tabs": TARGET_FOUR_TAB,
	}
	authoring["topology_rhythm_score"] = topology_rhythm_score
	result["authoring"] = authoring
	return result
