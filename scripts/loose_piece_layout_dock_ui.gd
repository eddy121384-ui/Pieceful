extends "res://scripts/loose_piece_layout_workspace.gd"

const LayoutIcons = preload("res://scripts/ui_icon_catalog.gd")
const LayoutMetrics = preload("res://scripts/app_ui_metrics.gd")
const ScrollableRailCanvasScript = preload("res://scripts/scrollable_loose_piece_rail_canvas.gd")

const LAYOUT_TRANSITION_DURATION := 0.38
const LAYOUT_TRANSITION_STAGGER := 0.012
const LAYOUT_TRANSITION_STAGGER_CAP := 0.12
const LAYOUT_TRANSITION_Z := 4096

var layout_mode_button: Button
var rail_scroll: ScrollContainer
var rail_scroll_horizontal_flow := false
var rail_scroll_flow_initialized := false

var layout_transition_active := false
var layout_transition_root: Node2D
var layout_transition_hidden_members: Array = []
var layout_transition_target_mode := ""


func _build_ui() -> void:
	super._build_ui()
	_detach_layout_mode_from_tray_manager()
	_build_layout_mode_dock_button()
	_install_scrollable_rail_canvas()
	_ensure_layout_transition_root()


func _detach_layout_mode_from_tray_manager() -> void:
	# Loose-piece presentation is a workspace-wide choice, not a Tray-management
	# command. Keep the legacy row constructed by the base slice out of layout so
	# only the dedicated dock action is player-facing.
	if layout_mode_row != null:
		layout_mode_row.visible = false


func _build_layout_mode_dock_button() -> void:
	if ui_layer == null:
		return
	layout_mode_button = Button.new()
	layout_mode_button.name = "LoosePieceLayoutButton"
	layout_mode_button.toggle_mode = true
	LayoutIcons.apply_button(
		layout_mode_button,
		LayoutIcons.IconId.LAYOUT,
		"Loose pieces · Scatter / Rail",
		Vector2(44.0, 44.0),
		22
	)
	layout_mode_button.toggled.connect(_on_layout_mode_button_toggled)
	ui_layer.add_child(layout_mode_button)
	_refresh_layout_mode_controls()


func _install_scrollable_rail_canvas() -> void:
	if rail_canvas == null:
		return
	# `rail_canvas` is intentionally dynamic in the inherited workspace because it
	# can be swapped between canvas implementations. Cast the scene-tree values
	# explicitly so older/stricter Godot analyzers do not have to infer a type
	# through a Variant-returning expression.
	var rail_box: Node = rail_canvas.get_parent() as Node
	if rail_box == null:
		return
	var old_index: int = int(rail_canvas.get_index())
	var old_canvas: Node = rail_canvas as Node
	if old_canvas == null:
		return
	rail_box.remove_child(old_canvas)
	old_canvas.queue_free()

	rail_scroll = ScrollContainer.new()
	rail_scroll.name = "LoosePieceRailScroll"
	rail_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	rail_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	rail_scroll.mouse_filter = Control.MOUSE_FILTER_STOP
	rail_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	rail_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	rail_box.add_child(rail_scroll)
	rail_box.move_child(rail_scroll, old_index)

	rail_canvas = ScrollableRailCanvasScript.new()
	rail_canvas.name = "LoosePieceRailCanvas"
	rail_canvas.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	rail_canvas.size_flags_vertical = Control.SIZE_EXPAND_FILL
	rail_canvas.group_dragged_out.connect(_on_rail_group_dragged_out)
	rail_scroll.add_child(rail_canvas)


func _ensure_layout_transition_root() -> void:
	if layout_transition_root != null and is_instance_valid(layout_transition_root):
		return
	if ui_layer == null:
		return
	layout_transition_root = Node2D.new()
	layout_transition_root.name = "LoosePieceLayoutTransition"
	layout_transition_root.z_as_relative = false
	layout_transition_root.z_index = LAYOUT_TRANSITION_Z
	ui_layer.add_child(layout_transition_root)


func _on_layout_mode_button_toggled(rail_enabled: bool) -> void:
	_set_loose_layout_mode(LAYOUT_RAIL if rail_enabled else LAYOUT_SCATTER)


func _set_loose_layout_mode(mode: String) -> void:
	if mode != LAYOUT_SCATTER and mode != LAYOUT_RAIL:
		return
	if layout_transition_active:
		_refresh_layout_mode_controls()
		return
	if mode == loose_layout_mode:
		_refresh_layout_mode_controls()
		return
	if board == null or rail_canvas == null or ui_layer == null:
		super._set_loose_layout_mode(mode)
		return

	var sources: Array = _capture_layout_transition_sources()
	if sources.is_empty():
		super._set_loose_layout_mode(mode)
		return

	layout_transition_active = true
	layout_transition_target_mode = mode
	if layout_mode_button != null:
		layout_mode_button.disabled = true

	# Capture source geometry first, then let the canonical layout/state layer do
	# the real switch. The animation is presentation-only and never owns puzzle
	# membership, clusters, solved state, or Tray state.
	super._set_loose_layout_mode(mode)
	_configure_rail_scrolling()

	if mode == LAYOUT_RAIL:
		if rail_canvas != null:
			rail_canvas.modulate = Color(1.0, 1.0, 1.0, 0.0)
	else:
		# The canonical switch makes real Main Table pieces visible immediately.
		# Hide them while the transition ghosts fan out, then hand interaction back.
		_hide_transition_target_members(sources)
		if rail_panel != null:
			rail_panel.visible = true
			rail_panel.modulate = Color.WHITE
		if rail_canvas != null:
			rail_canvas.modulate = Color(1.0, 1.0, 1.0, 0.0)

	_play_layout_transition(sources, mode)


func _capture_layout_transition_sources() -> Array:
	var result: Array = []
	if board == null:
		return result

	var seen: Dictionary = {}
	for piece_value in board.pieces:
		var piece = piece_value
		if not is_instance_valid(piece) or bool(piece.solved):
			continue
		var piece_index: int = int(piece.piece_index)
		if state.location_for(piece_index) != "loose":
			continue
		var cluster_id: int = int(
			board.cluster_for_piece.get(piece_index, piece_index)
		)
		if seen.has(cluster_id):
			continue
		seen[cluster_id] = true
		var members: Array = _loose_members_for_cluster(cluster_id)
		if members.is_empty():
			continue

		var anchor_index: int = int(members[0])
		var starts_in_rail: bool = (
			loose_layout_mode == LAYOUT_RAIL
			and rail_cluster_ids.has(cluster_id)
		)
		var start_position: Vector2
		var start_scale: float
		if starts_in_rail:
			start_position = _rail_piece_origin_in_ui_canvas(anchor_index, true)
			start_scale = _rail_piece_scale_in_ui_canvas()
		else:
			start_position = _world_piece_origin_in_ui_canvas(anchor_index)
			start_scale = _world_piece_scale_in_ui_canvas(anchor_index)

		result.append({
			"cluster_id": cluster_id,
			"members": members.duplicate(),
			"anchor": anchor_index,
			"start_position": start_position,
			"start_scale": start_scale,
		})
	return result


func _play_layout_transition(sources: Array, mode: String) -> void:
	_ensure_layout_transition_root()
	_clear_layout_transition_ghosts()
	if layout_transition_root == null:
		_finish_layout_transition()
		return

	var tween: Tween = create_tween()
	tween.set_parallel(true)
	var ghost_count: int = 0

	for ordinal in range(sources.size()):
		var source_value = sources[ordinal]
		if not (source_value is Dictionary):
			continue
		var source: Dictionary = source_value
		var members_value = source.get("members", [])
		if not (members_value is Array):
			continue
		var members: Array = members_value
		if members.is_empty():
			continue
		var anchor_index: int = int(source.get("anchor", -1))
		if anchor_index < 0 or anchor_index >= board.pieces.size():
			continue

		var start_position: Vector2 = Vector2(
			source.get("start_position", Vector2.ZERO)
		)
		var start_scale: float = maxf(
			float(source.get("start_scale", 1.0)),
			0.01
		)
		var target_position: Vector2
		var target_scale: float
		if mode == LAYOUT_RAIL:
			target_position = _rail_piece_origin_in_ui_canvas(anchor_index, true)
			target_scale = _rail_piece_scale_in_ui_canvas()
		else:
			target_position = _world_piece_origin_in_ui_canvas(anchor_index)
			target_scale = _world_piece_scale_in_ui_canvas(anchor_index)

		var ghost: Node2D = _create_layout_transition_ghost(
			members,
			anchor_index,
			start_position,
			start_scale
		)
		if ghost == null:
			continue

		var delay: float = minf(
			float(ordinal) * LAYOUT_TRANSITION_STAGGER,
			LAYOUT_TRANSITION_STAGGER_CAP
		)
		var target_scale_vector := Vector2(target_scale, target_scale)
		var position_tweener: PropertyTweener = tween.tween_property(
			ghost,
			"position",
			target_position,
			LAYOUT_TRANSITION_DURATION
		)
		position_tweener.set_delay(delay)
		position_tweener.set_trans(Tween.TRANS_QUINT)
		position_tweener.set_ease(Tween.EASE_IN_OUT)

		var scale_tweener: PropertyTweener = tween.tween_property(
			ghost,
			"scale",
			target_scale_vector,
			LAYOUT_TRANSITION_DURATION
		)
		scale_tweener.set_delay(delay)
		scale_tweener.set_trans(Tween.TRANS_QUINT)
		scale_tweener.set_ease(Tween.EASE_IN_OUT)

		var target_alpha: float = 0.88 if mode == LAYOUT_RAIL else 0.96
		var fade_tweener: PropertyTweener = tween.tween_property(
			ghost,
			"modulate",
			Color(1.0, 1.0, 1.0, target_alpha),
			LAYOUT_TRANSITION_DURATION
		)
		fade_tweener.set_delay(delay)
		fade_tweener.set_trans(Tween.TRANS_QUAD)
		fade_tweener.set_ease(Tween.EASE_IN_OUT)
		ghost_count += 1

	if ghost_count <= 0:
		tween.kill()
		_finish_layout_transition()
		return

	if mode == LAYOUT_SCATTER and rail_panel != null:
		var panel_fade: PropertyTweener = tween.tween_property(
			rail_panel,
			"modulate",
			Color(1.0, 1.0, 1.0, 0.0),
			LAYOUT_TRANSITION_DURATION
		)
		panel_fade.set_trans(Tween.TRANS_QUAD)
		panel_fade.set_ease(Tween.EASE_IN_OUT)

	tween.chain().tween_callback(_finish_layout_transition)


func _create_layout_transition_ghost(
	members: Array,
	anchor_index: int,
	start_position: Vector2,
	start_scale: float
) -> Node2D:
	if layout_transition_root == null or board == null:
		return null
	if anchor_index < 0 or anchor_index >= board.pieces.size():
		return null

	var anchor_piece = board.pieces[anchor_index]
	if not is_instance_valid(anchor_piece):
		return null

	var group := Node2D.new()
	group.name = "LayoutTransitionGroup_%03d" % anchor_index
	group.position = start_position
	group.scale = Vector2(start_scale, start_scale)
	group.modulate = Color.WHITE
	layout_transition_root.add_child(group)

	for value in members:
		var piece_index: int = int(value)
		if piece_index < 0 or piece_index >= board.pieces.size():
			continue
		var source_piece = board.pieces[piece_index]
		if not is_instance_valid(source_piece):
			continue

		var holder := Node2D.new()
		holder.position = (
			Vector2(source_piece.target_position)
			- Vector2(anchor_piece.target_position)
		)
		group.add_child(holder)

		var face := Polygon2D.new()
		face.polygon = source_piece.polygon_points
		face.uv = source_piece.uv_points
		face.texture = source_piece.source_texture
		holder.add_child(face)

		var outline := Line2D.new()
		var outline_points: PackedVector2Array = source_piece.polygon_points.duplicate()
		if not outline_points.is_empty():
			outline_points.append(outline_points[0])
		outline.points = outline_points
		outline.width = 1.0
		outline.default_color = Color(1.0, 1.0, 1.0, 0.60)
		outline.antialiased = true
		holder.add_child(outline)
	return group


func _world_piece_origin_in_ui_canvas(piece_index: int) -> Vector2:
	if board == null or piece_index < 0 or piece_index >= board.pieces.size():
		return Vector2.ZERO
	var piece = board.pieces[piece_index]
	if not is_instance_valid(piece):
		return Vector2.ZERO
	var transform: Transform2D = piece.get_global_transform_with_canvas()
	var viewport_origin: Vector2 = transform * Vector2.ZERO
	return _viewport_position_in_ui_canvas(viewport_origin)


func _world_piece_scale_in_ui_canvas(piece_index: int) -> float:
	if board == null or piece_index < 0 or piece_index >= board.pieces.size():
		return 1.0
	var piece = board.pieces[piece_index]
	if not is_instance_valid(piece):
		return 1.0
	var transform: Transform2D = piece.get_global_transform_with_canvas()
	var origin_ui: Vector2 = _viewport_position_in_ui_canvas(
		transform * Vector2.ZERO
	)
	var unit_x_ui: Vector2 = _viewport_position_in_ui_canvas(
		transform * Vector2.RIGHT
	)
	return maxf(origin_ui.distance_to(unit_x_ui), 0.01)


func _rail_piece_origin_in_ui_canvas(
	piece_index: int,
	clamp_to_visible_rail: bool
) -> Vector2:
	if rail_canvas == null:
		return Vector2.ZERO
	var canvas_transform: Transform2D = rail_canvas.get_global_transform()
	var local_position: Vector2 = Vector2(rail_canvas._piece_position(piece_index))
	var point: Vector2 = canvas_transform * local_position
	if clamp_to_visible_rail:
		point = _clamp_point_to_visible_rail(point)
	return point


func _rail_piece_scale_in_ui_canvas() -> float:
	if rail_canvas == null:
		return 1.0
	var canvas_transform: Transform2D = rail_canvas.get_global_transform()
	var scale_factor: float = maxf(float(rail_canvas.visual_scale()), 0.01)
	var origin: Vector2 = canvas_transform * Vector2.ZERO
	var unit_x: Vector2 = canvas_transform * Vector2(scale_factor, 0.0)
	return maxf(origin.distance_to(unit_x), 0.01)


func _clamp_point_to_visible_rail(point: Vector2) -> Vector2:
	if rail_scroll == null:
		return point
	var visible_rect: Rect2 = rail_scroll.get_global_rect().grow(-12.0)
	if visible_rect.size.x <= 1.0 or visible_rect.size.y <= 1.0:
		return point
	return Vector2(
		clampf(point.x, visible_rect.position.x, visible_rect.end.x),
		clampf(point.y, visible_rect.position.y, visible_rect.end.y)
	)


func _hide_transition_target_members(sources: Array) -> void:
	layout_transition_hidden_members.clear()
	if board == null:
		return
	for source_value in sources:
		if not (source_value is Dictionary):
			continue
		var source: Dictionary = source_value
		var members_value = source.get("members", [])
		if not (members_value is Array):
			continue
		for value in members_value:
			var piece_index: int = int(value)
			if layout_transition_hidden_members.has(piece_index):
				continue
			if piece_index < 0 or piece_index >= board.pieces.size():
				continue
			var piece = board.pieces[piece_index]
			if not is_instance_valid(piece) or bool(piece.solved):
				continue
			piece.visible = false
			piece.input_pickable = false
			layout_transition_hidden_members.append(piece_index)


func _restore_transition_target_members() -> void:
	if board == null:
		layout_transition_hidden_members.clear()
		return
	for value in layout_transition_hidden_members:
		var piece_index: int = int(value)
		if piece_index < 0 or piece_index >= board.pieces.size():
			continue
		var piece = board.pieces[piece_index]
		if (
			is_instance_valid(piece)
			and not bool(piece.solved)
			and state.location_for(piece_index) == "loose"
		):
			piece.visible = true
			piece.input_pickable = true
	layout_transition_hidden_members.clear()


func _finish_layout_transition() -> void:
	var finished_mode: String = layout_transition_target_mode
	_clear_layout_transition_ghosts()
	if finished_mode == LAYOUT_SCATTER:
		_restore_transition_target_members()
		if rail_panel != null:
			rail_panel.visible = false
			rail_panel.modulate = Color.WHITE
	else:
		if rail_canvas != null:
			rail_canvas.modulate = Color.WHITE

	layout_transition_target_mode = ""
	layout_transition_active = false
	if layout_mode_button != null:
		layout_mode_button.disabled = false
	_refresh_layout_mode_controls()


func _clear_layout_transition_ghosts() -> void:
	if layout_transition_root == null or not is_instance_valid(layout_transition_root):
		return
	for child in layout_transition_root.get_children():
		layout_transition_root.remove_child(child)
		child.queue_free()


func _refresh_layout_mode_controls() -> void:
	super._refresh_layout_mode_controls()
	if layout_mode_button == null:
		return
	var rail_enabled: bool = loose_layout_mode == LAYOUT_RAIL
	layout_mode_button.set_pressed_no_signal(rail_enabled)
	layout_mode_button.icon = LayoutIcons.texture(LayoutIcons.IconId.LAYOUT)
	layout_mode_button.modulate = (
		Color.WHITE if rail_enabled else Color(1.0, 1.0, 1.0, 0.64)
	)
	layout_mode_button.tooltip_text = (
		"Loose pieces · Side Rail · click for Scatter"
		if rail_enabled
		else "Loose pieces · Scatter · click for Side Rail"
	)


func _layout_ui() -> void:
	super._layout_ui()
	if layout_mode_button != null:
		layout_mode_button.position = LayoutMetrics.dock_slot_position(
			_viewport_size(),
			LayoutMetrics.SLOT_LAYOUT_X
		)


func _layout_loose_piece_rail() -> void:
	super._layout_loose_piece_rail()
	_configure_rail_scrolling()


func _configure_rail_scrolling() -> void:
	if (
		rail_scroll == null
		or rail_canvas == null
		or rail_panel == null
		or loose_layout_mode != LAYOUT_RAIL
	):
		return

	var viewport_size: Vector2 = _viewport_size()
	var portrait: bool = viewport_size.y > viewport_size.x
	var horizontal_flow: bool = portrait
	if not rail_scroll_flow_initialized or horizontal_flow != rail_scroll_horizontal_flow:
		rail_scroll.scroll_horizontal = 0
		rail_scroll.scroll_vertical = 0
		rail_scroll_horizontal_flow = horizontal_flow
		rail_scroll_flow_initialized = true

	if portrait:
		rail_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
		rail_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
		var visible_height: float = maxf(88.0, rail_panel.size.y - 48.0)
		rail_canvas.set_scroll_layout(true, visible_height)
	else:
		rail_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
		rail_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
		var visible_width: float = maxf(120.0, rail_panel.size.x - 20.0)
		rail_canvas.set_scroll_layout(false, visible_width)
