class_name ResponsiveWorkspaceLayout
extends RefCounted

# Workspace layout is deliberately separate from puzzle geometry. The approved
# CutPattern and the board's 600x375 play surface stay unchanged; portrait /
# landscape reflow moves the board and the loose-piece workspace around it.
# This preserves exact die geometry while allowing the app shell to respond to
# the live viewport instead of pretending every device is 1280x720.

const MIN_LANDSCAPE_SIZE := Vector2(1280.0, 720.0)
const MIN_PORTRAIT_SIZE := Vector2(720.0, 1280.0)

const LANDSCAPE_TOP_SAFE := 82.0
const LANDSCAPE_BOTTOM_SAFE := 92.0
const PORTRAIT_TOP_SAFE := 112.0
const PORTRAIT_BOTTOM_SAFE := 118.0
const SIDE_SAFE := 18.0


func resolve(viewport_size: Vector2, board_size: Vector2) -> Dictionary:
	var safe_viewport := Vector2(
		maxf(viewport_size.x, 1.0),
		maxf(viewport_size.y, 1.0)
	)
	var portrait := safe_viewport.y > safe_viewport.x
	var workspace_size := safe_viewport

	# `expand` stretch normally guarantees at least the project base span on one
	# axis. These floors also keep desktop resize smoke tests usable if a window is
	# temporarily made very small.
	if portrait:
		workspace_size.x = maxf(workspace_size.x, MIN_PORTRAIT_SIZE.x)
		workspace_size.y = maxf(workspace_size.y, MIN_PORTRAIT_SIZE.y)
	else:
		workspace_size.x = maxf(workspace_size.x, MIN_LANDSCAPE_SIZE.x)
		workspace_size.y = maxf(workspace_size.y, MIN_LANDSCAPE_SIZE.y)

	var top_safe := PORTRAIT_TOP_SAFE if portrait else LANDSCAPE_TOP_SAFE
	var bottom_safe := PORTRAIT_BOTTOM_SAFE if portrait else LANDSCAPE_BOTTOM_SAFE
	var navigation_rect := Rect2(
		Vector2(0.0, top_safe),
		Vector2(
			workspace_size.x,
			maxf(workspace_size.y - top_safe - bottom_safe, board_size.y + 80.0)
		)
	)

	var board_x := clampf(
		(workspace_size.x - board_size.x) * 0.5,
		SIDE_SAFE,
		maxf(SIDE_SAFE, workspace_size.x - board_size.x - SIDE_SAFE)
	)
	var vertical_room := maxf(navigation_rect.size.y - board_size.y, 0.0)
	var board_offset_y := (
		minf(220.0, vertical_room * 0.18)
		if portrait
		else minf(44.0, vertical_room * 0.10)
	)
	var board_rect := Rect2(
		Vector2(board_x, navigation_rect.position.y + board_offset_y),
		board_size
	)

	return {
		"orientation": "portrait" if portrait else "landscape",
		"viewport_size": safe_viewport,
		"workspace_size": workspace_size,
		"navigation_rect": navigation_rect,
		"board_rect": board_rect,
	}
