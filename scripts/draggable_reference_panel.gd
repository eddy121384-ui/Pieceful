class_name DraggableReferencePanel
extends PanelContainer

const EDGE_MARGIN := 8.0

var dragging := false
var user_positioned := false
var drag_offset := Vector2.ZERO
var layout_bounds := Vector2.ZERO


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP
	gui_input.connect(_on_gui_input)


func set_layout_bounds(viewport_size: Vector2, default_position: Vector2) -> void:
	layout_bounds = viewport_size
	if not user_positioned:
		position = default_position
	_clamp_to_bounds()


func _on_gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed:
			dragging = true
			drag_offset = get_viewport().get_mouse_position() - position
			accept_event()
		else:
			dragging = false
			accept_event()
		return

	if event is InputEventMouseMotion and dragging:
		position = get_viewport().get_mouse_position() - drag_offset
		user_positioned = true
		_clamp_to_bounds()
		accept_event()
		return

	if event is InputEventScreenTouch:
		if event.pressed:
			dragging = true
			drag_offset = event.position - position
			accept_event()
		else:
			dragging = false
			accept_event()
		return

	if event is InputEventScreenDrag and dragging:
		position = event.position - drag_offset
		user_positioned = true
		_clamp_to_bounds()
		accept_event()


func _clamp_to_bounds() -> void:
	if layout_bounds.x <= 0.0 or layout_bounds.y <= 0.0:
		return

	var max_x := maxf(EDGE_MARGIN, layout_bounds.x - size.x - EDGE_MARGIN)
	var max_y := maxf(EDGE_MARGIN, layout_bounds.y - size.y - EDGE_MARGIN)
	position = Vector2(
		clampf(position.x, EDGE_MARGIN, max_x),
		clampf(position.y, EDGE_MARGIN, max_y)
	)
