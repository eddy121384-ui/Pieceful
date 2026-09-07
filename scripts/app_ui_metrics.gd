class_name AppUiMetrics
extends RefCounted

const TOP_MARGIN := 12.0
const SIDE_MARGIN := 16.0
const TOP_BAR_HEIGHT := 56.0
const DOCK_WIDTH := 540.0
const DOCK_HEIGHT := 64.0
const DOCK_BOTTOM_MARGIN := 18.0
const DOCK_BUTTON_Y := 10.0

const SLOT_SORT_X := 12.0
const SLOT_LAYOUT_X := 64.0
const SLOT_PREVIEW_X := 116.0
const SLOT_HINT_X := 168.0
const SLOT_LINES_X := 220.0
const SLOT_FIT_X := 280.0
const SLOT_ZOOM_OUT_X := 332.0
const SLOT_ZOOM_LABEL_X := 380.0
const SLOT_ZOOM_IN_X := 432.0
const SLOT_RESHUFFLE_X := 484.0


static func top_bar_rect(viewport_size: Vector2) -> Rect2:
	var width: float = maxf(viewport_size.x - SIDE_MARGIN * 2.0, 1.0)
	return Rect2(
		Vector2(SIDE_MARGIN, TOP_MARGIN),
		Vector2(width, TOP_BAR_HEIGHT)
	)


static func dock_rect(viewport_size: Vector2) -> Rect2:
	var width: float = minf(DOCK_WIDTH, maxf(1.0, viewport_size.x - SIDE_MARGIN * 2.0))
	return Rect2(
		Vector2(
			(viewport_size.x - width) * 0.5,
			viewport_size.y - DOCK_BOTTOM_MARGIN - DOCK_HEIGHT
		),
		Vector2(width, DOCK_HEIGHT)
	)


static func dock_slot_position(viewport_size: Vector2, slot_x: float) -> Vector2:
	var dock: Rect2 = dock_rect(viewport_size)
	return dock.position + Vector2(slot_x, DOCK_BUTTON_Y)
