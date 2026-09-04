class_name RuntimeSnapPolicy
extends RefCounted

# Preserve the existing piece-relative feel near the default Relaxed view, but
# keep the player's *screen-space* correction window from collapsing on dense
# puzzles or exploding at high zoom.
const PIECE_RADIUS_RATIO := 0.18
const MIN_SCREEN_RADIUS_PX := 12.0
const MAX_SCREEN_RADIUS_PX := 24.0
const MIN_SAFE_ZOOM := 0.01


func radius_world(piece_size: Vector2, zoom_scale: float) -> float:
	var safe_zoom := maxf(zoom_scale, MIN_SAFE_ZOOM)
	var piece_short_edge := maxf(minf(piece_size.x, piece_size.y), 0.001)
	var relative_world_radius := piece_short_edge * PIECE_RADIUS_RATIO
	var relative_screen_radius := relative_world_radius * safe_zoom
	var clamped_screen_radius := clampf(
		relative_screen_radius,
		MIN_SCREEN_RADIUS_PX,
		MAX_SCREEN_RADIUS_PX
	)
	return clamped_screen_radius / safe_zoom


func diagnostics(piece_size: Vector2, zoom_scale: float) -> Dictionary:
	var safe_zoom := maxf(zoom_scale, MIN_SAFE_ZOOM)
	var world_radius := radius_world(piece_size, safe_zoom)
	return {
		"piece_short_edge": minf(piece_size.x, piece_size.y),
		"zoom_scale": safe_zoom,
		"world_radius": world_radius,
		"screen_radius": world_radius * safe_zoom,
		"piece_radius_ratio": PIECE_RADIUS_RATIO,
		"min_screen_radius": MIN_SCREEN_RADIUS_PX,
		"max_screen_radius": MAX_SCREEN_RADIUS_PX,
	}
