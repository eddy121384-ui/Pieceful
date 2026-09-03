extends "res://scripts/cut_pattern_generator_v14.gd"

# Authoring performance shim for V14 topology optimization.
#
# Topology is deterministic from seed + rows + columns and is independent from
# the V15/V16 style sliders. Rebuilding the same topology on every slider move
# wastes the 10 x 140 rhythm-search loop, so cache it for the life of the Godot
# process and reuse it for geometry-only live previews.
#
# This class intentionally does not change V14 scoring or topology output.

const TOPOLOGY_CACHE_LIMIT := 48

static var _topology_cache: Dictionary = {}

var topology_cache_hit := false


func _build_edge_polarities() -> void:
	var cache_key := "%d:%d:%d" % [seed, rows, columns]
	if _topology_cache.has(cache_key):
		var cached: Dictionary = _topology_cache[cache_key]
		var cached_horizontal: PackedInt32Array = cached["horizontal"]
		var cached_vertical: PackedInt32Array = cached["vertical"]
		horizontal_polarities = cached_horizontal.duplicate()
		vertical_polarities = cached_vertical.duplicate()
		topology_rhythm_score = float(cached["score"])
		topology_cache_hit = true
		return

	topology_cache_hit = false
	super()

	if _topology_cache.size() >= TOPOLOGY_CACHE_LIMIT:
		_topology_cache.clear()

	_topology_cache[cache_key] = {
		"horizontal": horizontal_polarities.duplicate(),
		"vertical": vertical_polarities.duplicate(),
		"score": topology_rhythm_score,
	}


static func clear_topology_cache() -> void:
	_topology_cache.clear()
