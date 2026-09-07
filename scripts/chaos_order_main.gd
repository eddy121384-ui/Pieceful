extends "res://scripts/main_icon_ui.gd"

const ChaosOrderPilePolicyScript = preload("res://scripts/chaos_order_pile_policy.gd")
const ChaosIcons = preload("res://scripts/ui_icon_catalog.gd")
const ChaosMetrics = preload("res://scripts/app_ui_metrics.gd")

const CHAOS_DIFFICULTY_ID := "hard"
const CHAOS_MIN_PIECES := 250
const SPREAD_RADIUS_SCREEN := 118.0
const SPREAD_MIN_STEP_SCREEN := 9.0
const SPREAD_MAX_STEP_SCREEN := 34.0

var pile_policy = ChaosOrderPilePolicyScript.new()
var spread_button: Button
var spread_mode_active := false
var spread_mouse_active := false
var spread_touch_ids: Dictionary = {}
var last_pile_bounds := Rect2()


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
		"Spread loose pile"
	)
	spread_button.toggled.connect(_on_spread_mode_toggled)
	layer.add_child(spread_button)
	_refresh_spread_control()


func _layout_ui(viewport_size: Vector2) -> void:
	super._layout_ui(viewport_size)
	if spread_button == null or difficulty_select == null:
		return
	var top_rect: Rect2 = ChaosMetrics.top_bar_rect(viewport_size)
	spread_button.position = Vector2(
		difficulty_select.position.x - 52.0,
		top_rect.position.y + 6.0
	)


func _refresh_difficulty_control() -> void:
	super._refresh_difficulty_control()
	_refresh_spread_control()


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
	spread_button.modulate = (
		Color.WHITE
		if spread_mode_active and available
		else Color(1.0, 1.0, 1.0, 0.58)
	)
	spread_button.tooltip_text = (
		"Spread mode on · drag empty pile space to fan pieces out"
		if spread_mode_active and available
		else "Spread loose pile"
	)


func _input(event: InputEvent) -> void:
	if not spread_mode_active or not _chaos_runtime_active():
		return

	if event is InputEventMouseButton:
		_handle_spread_mouse_button(event as InputEventMouseButton)
	elif event is InputEventMouseMotion:
		_handle_spread_mouse_motion(event as InputEventMouseMotion)
	elif event is InputEventScreenTouch:
		_handle_spread_touch(event as InputEventScreenTouch)
	elif event is InputEventScreenDrag:
		_handle_spread_drag(event as InputEventScreenDrag)


func _handle_spread_mouse_button(event: InputEventMouseButton) -> void:
	if event.button_index != MOUSE_BUTTON_LEFT:
		return
	if event.pressed:
		spread_mouse_active = not _screen_hits_playable_piece(event.position)
		if spread_mouse_active:
			_spread_at_screen(event.position, SPREAD_MIN_STEP_SCREEN)
			get_viewport().set_input_as_handled()
		return

	if spread_mouse_active:
		spread_mouse_active = false
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
		return

	if spread_touch_ids.has(event.index):
		spread_touch_ids.erase(event.index)
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
