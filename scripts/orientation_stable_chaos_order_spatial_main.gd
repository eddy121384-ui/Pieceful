extends "res://scripts/chaos_order_spatial_main.gd"

# With canvas_items + aspect=expand, a square logical base lets Godot expand the
# long axis to match the physical window. A 720×720 base therefore presents as
# roughly 1280×720 in 16:9 landscape and 720×1280 in 9:16 portrait without
# replacing Window.content_scale_size during every rotation.
#
# Replacing content_scale_size after hundreds of puzzle CanvasItems exist forces
# a very expensive first-frame viewport/canvas rebuild. Orientation should only
# change the physical window/aspect; the content-scale base stays stable.
const STABLE_CONTENT_SCALE_SIZE := Vector2i(720, 720)
const STABLE_SHORT_EDGE := 720.0


func _sync_content_scale_to_window() -> Vector2:
	var physical_size := Vector2(get_window().size)
	if physical_size.x <= 1.0 or physical_size.y <= 1.0:
		return get_viewport().get_visible_rect().size

	var physical_aspect := physical_size.x / physical_size.y
	if physical_aspect >= 1.0:
		return Vector2(STABLE_SHORT_EDGE * physical_aspect, STABLE_SHORT_EDGE)
	return Vector2(STABLE_SHORT_EDGE, STABLE_SHORT_EDGE / physical_aspect)
