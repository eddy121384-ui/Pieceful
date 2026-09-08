extends "res://scripts/main_icon_ui.gd"

const ChaosOrderPilePolicyScript = preload("res://scripts/chaos_order_pile_policy.gd")
const ChaosIcons = preload("res://scripts/ui_icon_catalog.gd")
const ChaosMetrics = preload("res://scripts/app_ui_metrics.gd")

const CHAOS_DIFFICULTY_ID := "hard"
const CHAOS_MIN_PIECES := 250
const SPREAD_RADIUS_SCREEN := 118.0
const SPREAD_MIN_STEP_SCREEN := 9.0
const SPREAD_MAX_STEP_SCREEN := 34.0
const SPREAD_BUTTON_SIZE := Vector2(96.0, 42.0)

var pile_policy = ChaosOrderPilePolicyScript.new()
var spread_button: Button
var spread_mode_active := false
var spread_mouse_active := false
var spread_touch_ids: Dictionary = {}
var last_pile_bounds := Rect2()


func _ready() -> void:
	super._ready()
	# SortingWorkspace is a sibling and finishes its own _ready before the root.
	# Bind after the inherited runtime has built all UI so changing Scatter/Rail
	# can explicitly leave Spread mode instead of carrying a stale world gesture.
	call_deferred("_bind_workspace_mode_controls")


func _build_ui() -> void:
	super._build_ui()
	_build_spread_control()


func _build_spread_control() -> void:
	if title_label == null:
		return
	var layer: Node = title_label.get_parent()
	if layer == null:
		return

	spread_button = Button.new()
	spread_button.name = "ChaosSpreadButton"
	spread_button.toggle_mode = true
	ChaosIcons.apply_button(
		spread_button,
		ChaosIcons.IconId.EXPAND,
		"Spread loose pile",
		SPREAD_BUTTON_SIZE,
		20
	)
	# Keep an explicit text label in the prototype. An icon-only action was too
	# easy to miss on a dense Hard workspace, and the atlas glyph can disappear
	# visually against the pile depending on display scale.
	spread_button.text = "Spread"
	spread_button.icon_alignment = HORIZONTAL_ALIGNMENT_LEFT
	spread_button.alignment = HORIZONTAL_ALIGNMENT_CENTER
	spread_button.toggled.connect(_on_spread_mode_toggled)
	layer.add_child(spread_button)
	_refresh_spread_control()


func _layout_ui(viewport_size: Vector2) -> void:
	super._layout_ui(viewport_size)
	if spread_button == null:
		return
	# Make Spread an unmistakable workspace action rather than squeezing it into
	# the already crowded top bar. It floats immediately above the bottom dock and
	# therefore remains reachable in both portrait and landscape.
	var dock_rect: Rect2 = ChaosMetrics.dock_rect(viewport_size)
	spread_button.position = Vector2(
		dock_rect.end.x - SPREAD_BUTTON_SIZE.x,
		maxf(76.0, dock_rect.position.y - SPREAD_BUTTON_SIZE.y - 8.0)
	)


func _refresh_difficulty_control() -> void:
	super._refresh_difficulty_control()
	_refresh_spread_control()


func _on_difficulty_selected(index: int) -> void:
	# Difficulty is a workspace mode boundary. Always release Spread before the
	# inherited handler rebuilds the puzzle so input state cannot survive into a
	# lower-density runtime.
	_set_spread_mode(false)
	super._on_difficulty_selected(index)


func _randomize_runtime_scatter() -> void:
	_set_spread_mode(false)
	if _chaos_runtime_active():
		last_pile_bounds = pile_policy.arrange_loose_pile(board)
		return
	last_pile_bounds = Rect2()
	super._randomize_runtime_scatter()


func _chaos_runtime_active() -> bool:
	return (
		board != null
		and board.active_difficulty_id() == CHAOS_DIFFICULTY_ID
		and board.active_piece_count() >= CHAOS_MIN_PIECES
	)


func _on_spread_mode_toggled(enabled: bool) -> void:
	_set_spread_mode(enabled)


func _set_spread_mode(enabled: bool) -> void:
	spread_mode_active = enabled and _chaos_runtime_active()
	spread_mouse_active = false
	spread_touch_ids.clear()
	_refresh_spread_control()


func _refresh_spread_control() -> void:
	if spread_button == null:
		return
	var available: bool = _chaos_runtime_active()
	spread_button.visible = available
	spread_button.disabled = not available
	spread_button.set_pressed_no_signal(spread_mode_active and available)
	spread_button.text = "Spread On" if spread_mode_active and available else "Spread"
	spread_button.modulate = (
		Color.WHITE
		if spread_mode_active and available
		else Color(1.0, 1.0, 1.0, 0.82)
	)
	spread_button.tooltip_text = (
		"Spread mode on · drag empty pile space to fan pieces out"
		if spread_mode_active and available
		else "Spread loose pile"
	)


func _bind_workspace_mode_controls() -> void:
	var sorting_workspace: Node = get_node_or_null("SortingWorkspace")
	if sorting_workspace == null:
		return
	var layout_button: Button = sorting_workspace.get("layout_mode_button") as Button
	if layout_button == null:
		return
	if not layout_button.toggled.is_connected(_on_loose_layout_toggled):
		layout_button.toggled.connect(_on_loose_layout_toggled)


func _on_loose_layout_toggled(_rail_enabled: bool) -> void:
	_set_spread_mode(false)


func _input(event: InputEvent) -> void:
	if not spread_mode_active or not _chaos_runtime_active():
		return

	# Release bookkeeping must happen even if the pointer ends over a UI control.
	# Otherwise a world drag released on the dock could leave Spread internally
	# latched until the next pointer motion.
	if event is InputEventMouseButton:
		var mouse_button := event as InputEventMouseButton
		if (
			mouse_button.button_index == MOUSE_BUTTON_LEFT
			and not mouse_button.pressed
			and spread_mouse_active
		):
			spread_mouse_active = false
			if not _screen_hits_interactive_ui(mouse_button.position):
				get_viewport().set_input_as_handled()
			return
	elif event is InputEventScreenTouch:
		var touch := event as InputEventScreenTouch
		if not touch.pressed and spread_touch_ids.has(touch.index):
			spread_touch_ids.erase(touch.index)
			if not _screen_hits_interactive_ui(touch.position):
				get_viewport().set_input_as_handled()
			return

	# Spread is a play-surface gesture, never a UI modality. Let Buttons,
	# OptionButtons, Tray/Rail controls, scrolling surfaces and popups receive the
	# event normally. This is what allows Spread to be switched off again and
	# prevents it from trapping the Difficulty or Scatter/Rail controls.
	var pointer_position: Vector2 = _pointer_position_for_event(event)
	if pointer_position.x >= 0.0 and _screen_hits_interactive_ui(pointer_position):
		return
	if _has_visible_popup_window():
		return

	if event is InputEventMouseButton:
		_handle_spread_mouse_button(event as InputEventMouseButton)
	elif event is InputEventMouseMotion:
		_handle_spread_mouse_motion(event as InputEventMouseMotion)
	elif event is InputEventScreenTouch:
		_handle_spread_touch(event as InputEventScreenTouch)
	elif event is InputEventScreenDrag:
		_handle_spread_drag(event as InputEventScreenDrag)


func _pointer_position_for_event(event: InputEvent) -> Vector2:
	if event is InputEventMouseButton:
		return (event as InputEventMouseButton).position
	if event is InputEventMouseMotion:
		return (event as InputEventMouseMotion).position
	if event is InputEventScreenTouch:
		return (event as InputEventScreenTouch).position
	if event is InputEventScreenDrag:
		return (event as InputEventScreenDrag).position
	return Vector2(-1.0, -1.0)


func _screen_hits_interactive_ui(screen_position: Vector2) -> bool:
	# Mouse hover is the cheapest/highest-fidelity route because the Viewport has
	# already resolved Control z-order. The recursive fallback also covers touch,
	# where there is no persistent hover target.
	var hovered: Control = get_viewport().gui_get_hovered_control()
	if (
		hovered != null
		and hovered.is_visible_in_tree()
		and hovered.mouse_filter != Control.MOUSE_FILTER_IGNORE
	):
		return true
	return _node_contains_interactive_control(get_tree().root, screen_position)


func _node_contains_interactive_control(node: Node, screen_position: Vector2) -> bool:
	if node is Control:
		var control := node as Control
		if (
			control.is_visible_in_tree()
			and control.mouse_filter != Control.MOUSE_FILTER_IGNORE
			and control.size.x > 0.5
			and control.size.y > 0.5
			and control.get_global_rect().has_point(screen_position)
		):
			return true

	for child_value in node.get_children():
		var child := child_value as Node
		if child != null and _node_contains_interactive_control(child, screen_position):
			return true
	return false


func _has_visible_popup_window() -> bool:
	return _node_has_visible_popup(get_tree().root)


func _node_has_visible_popup(node: Node) -> bool:
	if node is Window:
		var window := node as Window
		if window != get_window() and window.visible:
			return true
	for child_value in node.get_children():
		var child := child_value as Node
		if child != null and _node_has_visible_popup(child):
			return true
	return false


func _handle_spread_mouse_button(event: InputEventMouseButton) -> void:
	if event.button_index != MOUSE_BUTTON_LEFT:
		return
	if event.pressed:
		spread_mouse_active = not _screen_hits_playable_piece(event.position)
		if spread_mouse_active:
			_spread_at_screen(event.position, SPREAD_MIN_STEP_SCREEN)
			get_viewport().set_input_as_handled()


func _handle_spread_mouse_motion(event: InputEventMouseMotion) -> void:
	if not spread_mouse_active:
		return
	if (event.button_mask & MOUSE_BUTTON_MASK_LEFT) == 0:
		spread_mouse_active = false
		return
	var step_screen: float = clampf(
		event.relative.length() * 0.95,
		SPREAD_MIN_STEP_SCREEN,
		SPREAD_MAX_STEP_SCREEN
	)
	_spread_at_screen(event.position, step_screen)
	get_viewport().set_input_as_handled()


func _handle_spread_touch(event: InputEventScreenTouch) -> void:
	if event.pressed:
		if _screen_hits_playable_piece(event.position):
			return
		spread_touch_ids[event.index] = true
		_spread_at_screen(event.position, SPREAD_MIN_STEP_SCREEN)
		get_viewport().set_input_as_handled()


func _handle_spread_drag(event: InputEventScreenDrag) -> void:
	if not spread_touch_ids.has(event.index):
		return
	var step_screen: float = clampf(
		event.relative.length() * 0.95,
		SPREAD_MIN_STEP_SCREEN,
		SPREAD_MAX_STEP_SCREEN
	)
	_spread_at_screen(event.position, step_screen)
	get_viewport().set_input_as_handled()


func _spread_at_screen(screen_position: Vector2, step_screen: float) -> void:
	if board == null or puzzle_camera == null:
		return
	var zoom_scale: float = maxf(float(puzzle_camera.zoom.x), 0.01)
	var world_position: Vector2 = (
		get_viewport().get_canvas_transform().affine_inverse() * screen_position
	)
	pile_policy.spread_at_world(
		board,
		world_position,
		SPREAD_RADIUS_SCREEN / zoom_scale,
		step_screen / zoom_scale
	)


func _screen_hits_playable_piece(screen_position: Vector2) -> bool:
	if board == null:
		return false
	var world_position: Vector2 = (
		get_viewport().get_canvas_transform().affine_inverse() * screen_position
	)
	for piece_value in board.pieces:
		var piece = piece_value
		if (
			not is_instance_valid(piece)
			or bool(piece.solved)
			or not bool(piece.visible)
			or not bool(piece.input_pickable)
		):
			continue
		var local_point: Vector2 = piece.to_local(world_position)
		if Geometry2D.is_point_in_polygon(local_point, piece.polygon_points):
			return true
	return false
