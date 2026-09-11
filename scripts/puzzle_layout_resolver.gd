class_name PuzzleLayoutResolver
extends RefCounted

# Converts a desired puzzle difficulty + frame aspect ratio into a practical
# rows/columns grid. Difficulty describes target density, not an exact count.
# Runtime callers may also provide the logical board size and a touch/readability
# floor so extreme source ratios cannot create unusably thin pieces.

const MIN_TARGET_PIECES := 36
const MAX_TARGET_PIECES := 1200
const MIN_AXIS := 2
const MAX_AXIS := 64

const MIN_FRAME_ASPECT := 0.20
const MAX_FRAME_ASPECT := 5.00
const MIN_CELL_ASPECT := 0.82
const MAX_CELL_ASPECT := 1.22
const COUNT_WEIGHT := 5.0
const CELL_ASPECT_WEIGHT := 3.0

const DIFFICULTY_PRESETS := [
	{"id": "relaxed", "label": "Relaxed", "target": 36},
	{"id": "casual", "label": "Casual", "target": 72},
	{"id": "standard", "label": "Standard", "target": 144},
	{"id": "hard", "label": "Hard", "target": 288},
	{"id": "expert", "label": "Expert", "target": 576},
	{"id": "extreme", "label": "Extreme", "target": 1000},
]

const ASPECT_PRESETS := [
	{"id": "square_1_1", "label": "Square 1:1", "aspect": 1.0},
	{"id": "landscape_4_3", "label": "Landscape 4:3", "aspect": 4.0 / 3.0},
	{"id": "photo_3_2", "label": "Photo 3:2", "aspect": 3.0 / 2.0},
	{"id": "wide_16_9", "label": "Wide 16:9", "aspect": 16.0 / 9.0},
	{"id": "portrait_3_4", "label": "Portrait 3:4", "aspect": 3.0 / 4.0},
	{"id": "portrait_2_3", "label": "Portrait 2:3", "aspect": 2.0 / 3.0},
]


func resolve(
	frame_aspect_ratio: float,
	target_piece_count: int,
	board_size: Vector2 = Vector2.ZERO,
	min_piece_short_edge: float = 0.0
) -> Dictionary:
	var safe_aspect := clampf(frame_aspect_ratio, MIN_FRAME_ASPECT, MAX_FRAME_ASPECT)
	var safe_target := clampi(target_piece_count, MIN_TARGET_PIECES, MAX_TARGET_PIECES)
	var safe_board_size := Vector2(maxf(board_size.x, 0.0), maxf(board_size.y, 0.0))
	var safe_piece_floor := maxf(min_piece_short_edge, 0.0)

	var best := _search(
		safe_aspect,
		safe_target,
		safe_board_size,
		safe_piece_floor,
		true
	)
	if best.is_empty():
		# Keep the touch/readability floor mandatory, but relax the preferred
		# near-square cell band when an unusual frame cannot satisfy both.
		best = _search(
			safe_aspect,
			safe_target,
			safe_board_size,
			safe_piece_floor,
			false
		)
	if best.is_empty() and safe_piece_floor > 0.0:
		# A caller can supply an impossibly small board. Return a deterministic
		# geometry result rather than crashing, but mark that the touch floor could
		# not be satisfied so product/UI layers can diagnose the fallback.
		best = _search(safe_aspect, safe_target, safe_board_size, 0.0, false)
		best["touch_floor_satisfied"] = false

	if best.is_empty():
		return {}

	best["frame_aspect_ratio"] = safe_aspect
	best["target_piece_count"] = safe_target
	best["piece_count_error_ratio"] = (
		absf(float(best["piece_count"]) - float(safe_target)) / float(safe_target)
	)
	best["min_piece_short_edge"] = safe_piece_floor
	if not best.has("touch_floor_satisfied"):
		best["touch_floor_satisfied"] = true
	return best


func _search(
	frame_aspect_ratio: float,
	target_piece_count: int,
	board_size: Vector2,
	min_piece_short_edge: float,
	enforce_cell_band: bool
) -> Dictionary:
	# When a touch floor is active, allow the resolver to move materially below
	# the nominal count. This is what keeps panoramas / tall scroll-like works
	# playable instead of forcing hundreds of needle-thin pieces.
	var minimum_count := (
		MIN_AXIS * MIN_AXIS
		if min_piece_short_edge > 0.0
		else maxi(MIN_AXIS * MIN_AXIS, int(floor(float(target_piece_count) * 0.60)))
	)
	var maximum_count := mini(
		MAX_AXIS * MAX_AXIS,
		int(ceil(float(target_piece_count) * 1.40))
	)
	var best_score := INF
	var best := {}

	for rows in range(MIN_AXIS, MAX_AXIS + 1):
		for columns in range(MIN_AXIS, MAX_AXIS + 1):
			var piece_count := rows * columns
			if piece_count < minimum_count or piece_count > maximum_count:
				continue

			var cell_aspect := frame_aspect_ratio * float(rows) / float(columns)
			if enforce_cell_band and (
				cell_aspect < MIN_CELL_ASPECT or cell_aspect > MAX_CELL_ASPECT
			):
				continue

			var piece_short_edge := INF
			if board_size.x > 0.0 and board_size.y > 0.0:
				piece_short_edge = minf(
					board_size.x / float(columns),
					board_size.y / float(rows)
				)
				if min_piece_short_edge > 0.0 and piece_short_edge < min_piece_short_edge:
					continue

			var count_error := log(float(piece_count) / float(target_piece_count))
			var cell_aspect_error := log(cell_aspect)
			var score := (
				COUNT_WEIGHT * count_error * count_error
				+ CELL_ASPECT_WEIGHT * cell_aspect_error * cell_aspect_error
			)

			# Tiny deterministic tie-breakers: prefer the board's natural orientation,
			# then the candidate closer to the requested count.
			if frame_aspect_ratio >= 1.0 and columns < rows:
				score += 0.001
			elif frame_aspect_ratio < 1.0 and rows < columns:
				score += 0.001
			score += (
				absf(float(piece_count) - float(target_piece_count))
				/ float(target_piece_count)
			) * 0.0001

			if score < best_score:
				best_score = score
				best = {
					"columns": columns,
					"rows": rows,
					"piece_count": piece_count,
					"cell_aspect_ratio": cell_aspect,
					"piece_short_edge": piece_short_edge,
					"score": score,
					"preferred_cell_band": enforce_cell_band,
				}

	return best


func target_for_difficulty(difficulty_id: String) -> int:
	for preset in DIFFICULTY_PRESETS:
		if str(preset["id"]) == difficulty_id:
			return int(preset["target"])
	return 144


func difficulty_id_for_target(target_piece_count: int) -> String:
	for preset in DIFFICULTY_PRESETS:
		if int(preset["target"]) == target_piece_count:
			return str(preset["id"])
	return "custom"


func aspect_for_preset(aspect_id: String) -> float:
	for preset in ASPECT_PRESETS:
		if str(preset["id"]) == aspect_id:
			return float(preset["aspect"])
	return 1.0
