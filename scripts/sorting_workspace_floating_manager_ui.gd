extends "res://scripts/sorting_workspace_management_ui.gd"

const FloatingIcons = preload("res://scripts/ui_icon_catalog.gd")

const MANAGER_MARGIN := 16.0
const MANAGER_DRAG_HANDLE_HEIGHT := 56.0
const MOBILE_REFLOW_SETTLE_SECONDS := 0.28

var manager_drag_handle: Label
var manager_grip_icon: TextureRect
var manager_close_button: Button
var manager_dragging := false
var manager_drag_pointer_id := -999
var manager_drag_offset := Vector2.ZERO
var manager_user_positioned := false
var manager_window_position := Vector2.ZERO


func _ready() -> void:
	super._ready()
	if reflow_settle_timer != null:
		reflow_settle_timer.wait_time = MOBILE_REFLOW_SETTLE_SECONDS


func _build_ui() -> void:
	super._build_ui()
	_build_manager_drag_header()


func _build_manager_drag_header() -> void:
	if panel == null or panel.get_child_count() == 0:
		return
	var box = panel.get_child(0)
	if not (box is VBoxContainer):
		return

	var header := HBoxContainer.new()
	header.name = "ManagerFloatingHeader"
	header.add_theme_constant_override("separation", 6)
	box.add_child(header)
	box.move_child(header, 0)

	manager_drag_handle = Label.new()
	manager_drag_handle.name = "ManagerDragHandle"
	manager_drag_handle.text = ""
	manager_drag_handle.custom_minimum_size = Vector2(0.0, MANAGER_DRAG_HANDLE_HEIGHT)
	manager_drag_handle.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	manager_drag_handle.mouse_filter = Control.MOUSE_FILTER_STOP
	manager_drag_handle.mouse_default_cursor_shape = Control.CURSOR_MOVE
	manager_drag_handle.tooltip_text = "Move tray manager"
	manager_drag_handle.gui_input.connect(_on_manager_drag_handle_gui_input)
	header.add_child(manager_drag_handle)

	manager_grip_icon = TextureRect.new()
	manager_grip_icon.texture = FloatingIcons.texture(FloatingIcons.IconId.GRIP)
	manager_grip_icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	manager_grip_icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	manager_grip_icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	manager_grip_icon.anchor_left = 0.5
	manager_grip_icon.anchor_top = 0.5
	manager_grip_icon.anchor_right = 0.5
	manager_grip_icon.anchor_bottom = 0.5
	manager_grip_icon.offset_left = -18.0
	manager_grip_icon.offset_top = -18.0
	manager_grip_icon.offset_right = 18.0
	manager_grip_icon.offset_bottom = 18.0
	manager_drag_handle.add_child(manager_grip_icon)

	manager_close_button = Button.new()
	manager_close_button.name = "ManagerCloseButton"
	FloatingIcons.apply_button(
		manager_close_button,
		FloatingIcons.IconId.CLOSE,
		"Close tray manager",
		Vector2(44.0, 44.0),
		20
	)
	manager_close_button.pressed.connect(_close_manager)
	header.add_child(manager_close_button)


func _input(event: InputEvent) -> void:
	if detail_dragging:
		super._input(event)
		return

	if not manager_dragging:
		super._input(event)
		return

	if manager_drag_pointer_id == -1:
		if event is InputEventMouseMotion:
			if (event.button_mask & MOUSE_BUTTON_MASK_LEFT) != 0:
				_move_manager_panel(
					_viewport_position_in_ui_canvas(get_viewport().get_mouse_position())
				)
				get_viewport().set_input_as_handled()
		elif event is InputEventMouseButton:
			if event.button_index == MOUSE_BUTTON_LEFT and not event.pressed:
				_finish_manager_drag()
				get_viewport().set_input_as_handled()
	else:
		if event is InputEventScreenDrag and event.index == manager_drag_pointer_id:
			_move_manager_panel(_viewport_position_in_ui_canvas(event.position))
			get_viewport().set_input_as_handled()
		elif event is InputEventScreenTouch:
			if event.index == manager_drag_pointer_id and not event.pressed:
				_finish_manager_drag()
				get_viewport().set_input_as_handled()


func _on_manager_drag_handle_gui_input(event: InputEvent) -> void:
	if panel == null or not panel.visible:
		return
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
			_begin_manager_drag(
				-1,
				_viewport_position_in_ui_canvas(get_viewport().get_mouse_position())
			)
	elif event is InputEventScreenTouch:
		if event.pressed:
			_begin_manager_drag(
				event.index,
				_control_local_to_ui_canvas(manager_drag_handle, event.position)
			)


func _begin_manager_drag(pointer_id: int, pointer_canvas_position: Vector2) -> void:
	manager_dragging = true
	manager_drag_pointer_id = pointer_id
	manager_drag_offset = pointer_canvas_position - panel.position
	manager_user_positioned = true
	manager_window_position = panel.position
	get_viewport().set_input_as_handled()


func _move_manager_panel(pointer_canvas_position: Vector2) -> void:
	if not manager_dragging or panel == null:
		return
	panel.position = _clamp_manager_position(
		pointer_canvas_position - manager_drag_offset
	)
	manager_window_position = panel.position


func _finish_manager_drag() -> void:
	if manager_dragging and panel != null:
		manager_window_position = _clamp_manager_position(panel.position)
		panel.position = manager_window_position
	manager_dragging = false
	manager_drag_pointer_id = -999
	manager_drag_offset = Vector2.ZERO


func _close_manager() -> void:
	_finish_manager_drag()
	if sort_button != null:
		sort_button.set_pressed_no_signal(false)
	_on_sort_toggled(false)


func _on_sort_toggled(enabled: bool) -> void:
	if not enabled:
		_finish_manager_drag()
	super._on_sort_toggled(enabled)
	if enabled and panel != null and panel.visible and manager_user_positioned:
		manager_window_position = _clamp_manager_position(manager_window_position)
		panel.position = manager_window_position


func _layout_ui() -> void:
	super._layout_ui()
	if panel == null or not panel.visible:
		return
	if manager_user_positioned:
		manager_window_position = _clamp_manager_position(manager_window_position)
		panel.position = manager_window_position


func _clamp_manager_position(candidate: Vector2) -> Vector2:
	if panel == null:
		return candidate
	var viewport_size: Vector2 = _viewport_size()
	var max_x: float = maxf(
		MANAGER_MARGIN,
		viewport_size.x - panel.size.x - MANAGER_MARGIN
	)
	var max_y: float = maxf(
		MANAGER_MARGIN,
		viewport_size.y - panel.size.y - MANAGER_MARGIN
	)
	return Vector2(
		clampf(candidate.x, MANAGER_MARGIN, max_x),
		clampf(candidate.y, MANAGER_MARGIN, max_y)
	)
