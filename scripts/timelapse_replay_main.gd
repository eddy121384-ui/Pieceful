class_name TimelapseReplayMain
extends "res://scripts/completion_share_card_contain_main.gd"

const TimelapseTraceScript = preload("res://scripts/timelapse_trace_v1.gd")
const TimelapseReplayPlanScript = preload("res://scripts/timelapse_replay_plan.gd")

var timelapse_replay_button: Button = null
var timelapse_overlay: ColorRect = null
var timelapse_title: Label = null
var timelapse_phase: Label = null
var timelapse_stage: ColorRect = null
var timelapse_piece_root: Node2D = null
var timelapse_tray_panel: ColorRect = null
var timelapse_tray_label: Label = null
var timelapse_footer: Label = null
var timelapse_close_button: Button = null
var timelapse_again_button: Button = null

var timelapse_trace: Dictionary = {}
var timelapse_plan: Dictionary = {}
var timelapse_piece_visuals: Dictionary = {}
var timelapse_workspace_rect := Rect2()
var timelapse_tray_rect := Rect2()
var timelapse_workspace_scale := 1.0
var timelapse_tray_scale := 0.6
var timelapse_play_serial := 0


func _ready() -> void:
	super._ready()
	_install_timelapse_replay_action()
	_build_timelapse_overlay()
	_layout_timelapse_overlay(get_viewport().get_visible_rect().size)


func _on_completed() -> void:
	super._on_completed()
	if save_coordinator == null or not save_coordinator.has_method("latest_completion_record"):
		return
	var record: Dictionary = save_coordinator.latest_completion_record()
	_prepare_timelapse_replay(record)


func _layout_ui(viewport_size: Vector2) -> void:
	super._layout_ui(viewport_size)
	_layout_timelapse_overlay(viewport_size)


func replay_presentation_snapshot() -> Dictionary:
	return {
		"button_exists": timelapse_replay_button != null,
		"button_text": timelapse_replay_button.text if timelapse_replay_button != null else "",
		"button_disabled": timelapse_replay_button.disabled if timelapse_replay_button != null else true,
		"overlay_visible": timelapse_overlay != null and timelapse_overlay.visible,
		"trace_event_count": _trace_event_count(),
		"plan_duration_ms": int(timelapse_plan.get("duration_ms", 0)),
		"plan_step_count": _plan_step_count(),
		"visual_count": timelapse_piece_visuals.size(),
		"phase": timelapse_phase.text if timelapse_phase != null else "",
	}


func _install_timelapse_replay_action() -> void:
	if completion_share_button == null or timelapse_replay_button != null:
		return
	var actions := completion_share_button.get_parent() as HBoxContainer
	if actions == null:
		return

	timelapse_replay_button = Button.new()
	timelapse_replay_button.name = "CompletionTimelapseReplay"
	timelapse_replay_button.text = "Replay"
	timelapse_replay_button.tooltip_text = "Timelapse replay prototype"
	timelapse_replay_button.custom_minimum_size = Vector2(150.0, 42.0)
	timelapse_replay_button.disabled = true
	timelapse_replay_button.pressed.connect(_on_timelapse_replay_pressed)
	actions.add_child(timelapse_replay_button)
	actions.move_child(timelapse_replay_button, 0)


func _build_timelapse_overlay() -> void:
	if timelapse_overlay != null or title_label == null:
		return
	var layer = title_label.get_parent()
	if layer == null:
		return

	timelapse_overlay = ColorRect.new()
	timelapse_overlay.name = "TimelapseReplayOverlay"
	timelapse_overlay.visible = false
	timelapse_overlay.color = Color(0.008, 0.01, 0.014, 0.965)
	timelapse_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	layer.add_child(timelapse_overlay)

	timelapse_title = Label.new()
	timelapse_title.text = "Timelapse Lab"
	timelapse_title.add_theme_font_size_override("font_size", 24)
	timelapse_overlay.add_child(timelapse_title)

	timelapse_phase = Label.new()
	timelapse_phase.text = "Chaos → Order"
	timelapse_phase.modulate = Color(1.0, 1.0, 1.0, 0.58)
	timelapse_phase.add_theme_font_size_override("font_size", 14)
	timelapse_overlay.add_child(timelapse_phase)

	timelapse_close_button = Button.new()
	timelapse_close_button.text = "Close"
	timelapse_close_button.pressed.connect(_close_timelapse_replay)
	timelapse_overlay.add_child(timelapse_close_button)

	timelapse_stage = ColorRect.new()
	timelapse_stage.name = "TimelapseStage"
	timelapse_stage.color = Color(0.035, 0.042, 0.055, 1.0)
	timelapse_stage.clip_contents = true
	timelapse_stage.mouse_filter = Control.MOUSE_FILTER_IGNORE
	timelapse_overlay.add_child(timelapse_stage)

	timelapse_tray_panel = ColorRect.new()
	timelapse_tray_panel.name = "TimelapseTrayZone"
	timelapse_tray_panel.color = Color(1.0, 1.0, 1.0, 0.035)
	timelapse_tray_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	timelapse_stage.add_child(timelapse_tray_panel)

	timelapse_tray_label = Label.new()
	timelapse_tray_label.text = "SORTING"
	timelapse_tray_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	timelapse_tray_label.modulate = Color(1.0, 1.0, 1.0, 0.28)
	timelapse_tray_label.add_theme_font_size_override("font_size", 11)
	timelapse_tray_panel.add_child(timelapse_tray_label)

	timelapse_piece_root = Node2D.new()
	timelapse_piece_root.name = "TimelapsePieces"
	timelapse_stage.add_child(timelapse_piece_root)

	timelapse_footer = Label.new()
	timelapse_footer.text = "Semantic replay · no video recording"
	timelapse_footer.modulate = Color(1.0, 1.0, 1.0, 0.48)
	timelapse_footer.add_theme_font_size_override("font_size", 13)
	timelapse_overlay.add_child(timelapse_footer)

	timelapse_again_button = Button.new()
	timelapse_again_button.text = "Replay again"
	timelapse_again_button.custom_minimum_size = Vector2(150.0, 40.0)
	timelapse_again_button.pressed.connect(_on_timelapse_replay_pressed)
	timelapse_overlay.add_child(timelapse_again_button)


func _layout_timelapse_overlay(viewport_size: Vector2) -> void:
	if timelapse_overlay == null:
		return
	timelapse_overlay.position = Vector2.ZERO
	timelapse_overlay.size = viewport_size

	timelapse_title.position = Vector2(40.0, 18.0)
	timelapse_title.size = Vector2(420.0, 34.0)
	timelapse_phase.position = Vector2(40.0, 49.0)
	timelapse_phase.size = Vector2(520.0, 24.0)
	timelapse_close_button.position = Vector2(maxf(40.0, viewport_size.x - 116.0), 20.0)
	timelapse_close_button.size = Vector2(76.0, 38.0)

	var stage_position := Vector2(32.0, 82.0)
	var stage_size := Vector2(
		maxf(360.0, viewport_size.x - 64.0),
		maxf(300.0, viewport_size.y - 150.0)
	)
	timelapse_stage.position = stage_position
	timelapse_stage.size = stage_size

	var inner := Rect2(Vector2(18.0, 18.0), stage_size - Vector2(36.0, 36.0))
	var tray_width := clampf(inner.size.x * 0.18, 150.0, 235.0)
	var workspace_bounds := Rect2(
		inner.position,
		Vector2(maxf(180.0, inner.size.x - tray_width - 16.0), inner.size.y)
	)
	timelapse_tray_rect = Rect2(
		Vector2(workspace_bounds.end.x + 16.0, inner.position.y),
		Vector2(tray_width, inner.size.y)
	)

	var navigation_size := Vector2(1280.0, 720.0)
	if board != null and board.has_method("navigation_bounds"):
		navigation_size = Vector2(board.navigation_bounds().size)
	timelapse_workspace_rect = _contain_rect(navigation_size, workspace_bounds)
	timelapse_workspace_scale = minf(
		timelapse_workspace_rect.size.x / maxf(navigation_size.x, 1.0),
		timelapse_workspace_rect.size.y / maxf(navigation_size.y, 1.0)
	)
	timelapse_tray_scale = timelapse_workspace_scale * 0.62

	timelapse_tray_panel.position = timelapse_tray_rect.position
	timelapse_tray_panel.size = timelapse_tray_rect.size
	timelapse_tray_label.position = Vector2(0.0, 8.0)
	timelapse_tray_label.size = Vector2(timelapse_tray_rect.size.x, 22.0)

	timelapse_footer.position = Vector2(40.0, maxf(24.0, viewport_size.y - 52.0))
	timelapse_footer.size = Vector2(maxf(260.0, viewport_size.x - 250.0), 30.0)
	timelapse_again_button.position = Vector2(maxf(40.0, viewport_size.x - 190.0), maxf(20.0, viewport_size.y - 60.0))
	timelapse_again_button.size = Vector2(150.0, 40.0)


func _prepare_timelapse_replay(record: Dictionary) -> void:
	timelapse_trace = {}
	timelapse_plan = {}
	var raw_trace = record.get("timelapse_trace", {})
	if raw_trace is Dictionary and TimelapseTraceScript.structurally_valid(raw_trace):
		timelapse_trace = raw_trace.duplicate(true)
		timelapse_plan = TimelapseReplayPlanScript.build(timelapse_trace)
	if timelapse_replay_button != null:
		timelapse_replay_button.disabled = timelapse_trace.is_empty() or _plan_step_count() < 2
		timelapse_replay_button.text = "Replay"


func _on_timelapse_replay_pressed() -> void:
	if timelapse_trace.is_empty() or _plan_step_count() < 2:
		return
	timelapse_play_serial += 1
	var serial := timelapse_play_serial
	_build_replay_piece_visuals()
	if timelapse_piece_visuals.is_empty():
		return
	timelapse_overlay.visible = true
	timelapse_overlay.move_to_front()
	timelapse_phase.text = "Chaos"
	timelapse_again_button.disabled = true
	call_deferred("_run_timelapse_replay", timelapse_plan.duplicate(true), serial)


func _close_timelapse_replay() -> void:
	timelapse_play_serial += 1
	if timelapse_overlay != null:
		timelapse_overlay.visible = false


func _run_timelapse_replay(plan: Dictionary, serial: int) -> void:
	var steps_value = plan.get("steps", [])
	if not (steps_value is Array):
		return
	var steps: Array = steps_value
	for index in range(steps.size()):
		if serial != timelapse_play_serial or timelapse_overlay == null or not timelapse_overlay.visible:
			return
		var step_value = steps[index]
		if not (step_value is Dictionary):
			continue
		var step: Dictionary = step_value
		var event_value = step.get("event", {})
		if not (event_value is Dictionary):
			continue
		var event: Dictionary = event_value
		var hold_ms := maxi(45, int(step.get("hold_ms", 90)))
		var kind := str(event.get("kind", ""))
		timelapse_phase.text = _phase_for_event(kind)
		timelapse_footer.text = "Event %d / %d · %s" % [
			index + 1,
			steps.size(),
			_phase_for_event(kind),
		]
		_apply_replay_event(event, minf(0.24, float(hold_ms) / 1000.0 * 0.72))
		await get_tree().create_timer(float(hold_ms) / 1000.0).timeout

	if serial != timelapse_play_serial:
		return
	timelapse_phase.text = "Finished"
	timelapse_footer.text = "%d events → %.1fs · Chaos → Order" % [
		steps.size(),
		float(plan.get("duration_ms", 0)) / 1000.0,
	]
	timelapse_again_button.disabled = false


func _build_replay_piece_visuals() -> void:
	if timelapse_piece_root == null or board == null:
		return
	for child in timelapse_piece_root.get_children():
		timelapse_piece_root.remove_child(child)
		child.queue_free()
	timelapse_piece_visuals.clear()

	for piece in board.pieces:
		if not is_instance_valid(piece):
			continue
		var group := Node2D.new()
		group.name = "ReplayPiece_%03d" % int(piece.piece_index)
		group.scale = Vector2.ONE * timelapse_workspace_scale
		timelapse_piece_root.add_child(group)

		var face := Polygon2D.new()
		face.polygon = piece.polygon_points
		face.uv = piece.uv_points
		face.texture = piece.source_texture
		face.color = Color.WHITE
		group.add_child(face)

		var outline := Line2D.new()
		var points: PackedVector2Array = piece.polygon_points.duplicate()
		if not points.is_empty():
			points.append(points[0])
		outline.points = points
		outline.width = 1.2
		outline.default_color = Color(1.0, 1.0, 1.0, 0.42)
		outline.antialiased = true
		group.add_child(outline)

		timelapse_piece_visuals[int(piece.piece_index)] = group

	var events = timelapse_trace.get("events", [])
	if events is Array and not events.is_empty() and events[0] is Dictionary:
		_apply_replay_event(events[0], 0.0)


func _apply_replay_event(event: Dictionary, animation_seconds: float) -> void:
	var kind := str(event.get("kind", ""))
	var indexes_value = event.get("piece_indexes", [])
	var indexes: Array = indexes_value if indexes_value is Array else []
	var payload_value = event.get("payload", {})
	var payload: Dictionary = payload_value if payload_value is Dictionary else {}

	match kind:
		"start", "move", "snap", "tray_out":
			_apply_workspace_positions(payload.get("positions", []), animation_seconds)
		"tray_in":
			_apply_tray_slots(indexes, animation_seconds)
		"tray_sort":
			_apply_tray_positions(payload.get("positions", []), animation_seconds)
		"merge":
			_pulse_replay_pieces(indexes, animation_seconds)
		"complete":
			_apply_final_positions(animation_seconds)


func _apply_workspace_positions(positions_value, animation_seconds: float) -> void:
	if not (positions_value is Array):
		return
	for position_value in positions_value:
		if not (position_value is Dictionary):
			continue
		var position_data: Dictionary = position_value
		var piece_index := int(position_data.get("piece_index", -1))
		var target := timelapse_workspace_rect.position + Vector2(
			float(position_data.get("x", 0.0)) * timelapse_workspace_rect.size.x,
			float(position_data.get("y", 0.0)) * timelapse_workspace_rect.size.y
		)
		_move_replay_piece(piece_index, target, timelapse_workspace_scale, animation_seconds)


func _apply_tray_slots(piece_indexes: Array, animation_seconds: float) -> void:
	var count := maxi(1, board.pieces.size() if board != null else piece_indexes.size())
	var columns := 3
	var rows := maxi(1, int(ceil(float(count) / float(columns))))
	var cell := Vector2(
		timelapse_tray_rect.size.x / float(columns),
		timelapse_tray_rect.size.y / float(rows)
	)
	for value in piece_indexes:
		var piece_index := int(value)
		var column := piece_index % columns
		var row := (piece_index / columns) % rows
		var target := timelapse_tray_rect.position + Vector2(
			(float(column) + 0.12) * cell.x,
			(float(row) + 0.16) * cell.y
		)
		_move_replay_piece(piece_index, target, timelapse_tray_scale, animation_seconds)


func _apply_tray_positions(positions_value, animation_seconds: float) -> void:
	if not (positions_value is Array):
		return
	for position_value in positions_value:
		if not (position_value is Dictionary):
			continue
		var position_data: Dictionary = position_value
		var piece_index := int(position_data.get("piece_index", -1))
		var target := timelapse_tray_rect.position + Vector2(
			float(position_data.get("x", 0.0)) * timelapse_tray_rect.size.x,
			float(position_data.get("y", 0.0)) * timelapse_tray_rect.size.y
		)
		_move_replay_piece(piece_index, target, timelapse_tray_scale, animation_seconds)


func _apply_final_positions(animation_seconds: float) -> void:
	if board == null:
		return
	var navigation := Rect2(Vector2.ZERO, Vector2(1280.0, 720.0))
	if board.has_method("navigation_bounds"):
		navigation = Rect2(board.navigation_bounds())
	var width := maxf(navigation.size.x, 1.0)
	var height := maxf(navigation.size.y, 1.0)
	for piece in board.pieces:
		if not is_instance_valid(piece):
			continue
		var normalized := Vector2(
			(Vector2(piece.target_position).x - navigation.position.x) / width,
			(Vector2(piece.target_position).y - navigation.position.y) / height
		)
		var target := timelapse_workspace_rect.position + normalized * timelapse_workspace_rect.size
		_move_replay_piece(int(piece.piece_index), target, timelapse_workspace_scale, animation_seconds)


func _move_replay_piece(piece_index: int, target: Vector2, target_scale: float, animation_seconds: float) -> void:
	var node_value = timelapse_piece_visuals.get(piece_index, null)
	if not (node_value is Node2D):
		return
	var node: Node2D = node_value
	var scale_value := Vector2.ONE * target_scale
	if animation_seconds <= 0.001:
		node.position = target
		node.scale = scale_value
		return
	var tween := create_tween()
	tween.set_trans(Tween.TRANS_QUAD)
	tween.set_ease(Tween.EASE_IN_OUT)
	tween.set_parallel(true)
	tween.tween_property(node, "position", target, animation_seconds)
	tween.tween_property(node, "scale", scale_value, animation_seconds)


func _pulse_replay_pieces(piece_indexes: Array, animation_seconds: float) -> void:
	var duration := maxf(0.08, animation_seconds)
	for value in piece_indexes:
		var node_value = timelapse_piece_visuals.get(int(value), null)
		if not (node_value is Node2D):
			continue
		var node: Node2D = node_value
		node.modulate = Color(1.0, 0.92, 0.68, 1.0)
		var tween := create_tween()
		tween.tween_property(node, "modulate", Color.WHITE, duration)


func _phase_for_event(kind: String) -> String:
	match kind:
		"start":
			return "Chaos"
		"tray_in", "tray_sort", "tray_out":
			return "Sorting"
		"move", "merge":
			return "Finding connections"
		"snap":
			return "Order"
		"complete":
			return "Final piece"
		_:
			return "Chaos → Order"


func _contain_rect(source_size: Vector2, bounds: Rect2) -> Rect2:
	if source_size.x <= 0.0 or source_size.y <= 0.0:
		return bounds
	var scale := minf(bounds.size.x / source_size.x, bounds.size.y / source_size.y)
	var fitted_size := source_size * scale
	return Rect2(bounds.position + (bounds.size - fitted_size) * 0.5, fitted_size)


func _trace_event_count() -> int:
	var events = timelapse_trace.get("events", [])
	return events.size() if events is Array else 0


func _plan_step_count() -> int:
	var steps = timelapse_plan.get("steps", [])
	return steps.size() if steps is Array else 0
