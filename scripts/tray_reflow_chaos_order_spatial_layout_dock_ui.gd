extends "res://scripts/cluster_safe_chaos_order_spatial_layout_dock_ui.gd"

const TrayReflowCanvasScript = preload("res://scripts/tray_reflow_play_canvas.gd")
const FIXED_SURFACE_SIZE := Vector2(720.0, 720.0)

var fixed_surface_virtual_size := FIXED_SURFACE_SIZE


func _build_ui() -> void:
	super._build_ui()
	_install_reflow_tray_canvas()
	_apply_fixed_surface_ui_transform()


func set_fixed_surface_virtual_size(next_size: Vector2) -> void:
	if next_size.x <= 1.0 or next_size.y <= 1.0:
		return
	fixed_surface_virtual_size = next_size
	_apply_fixed_surface_ui_transform()
	_layout_ui()
	# viewport+ignore intentionally keeps the root render target fixed, so a
	# physical mobile rotation may not emit the legacy Window.size_changed signal.
	# Main supplies every observed physical aspect here; restart the existing Tray
	# settle timer so orientation-aware mini-table reflow still happens once the
	# browser/device stops sending intermediate sizes.
	if reflow_settle_timer != null:
		reflow_settle_timer.start()


func _viewport_size() -> Vector2:
	return fixed_surface_virtual_size


func _apply_fixed_surface_ui_transform() -> void:
	if ui_layer == null:
		return
	var scale := Vector2(
		FIXED_SURFACE_SIZE.x / maxf(fixed_surface_virtual_size.x, 1.0),
		FIXED_SURFACE_SIZE.y / maxf(fixed_surface_virtual_size.y, 1.0)
	)
	ui_layer.transform = Transform2D(
		Vector2(scale.x, 0.0),
		Vector2(0.0, scale.y),
		Vector2.ZERO
	)


func _install_reflow_tray_canvas() -> void:
	if tray_play_canvas == null:
		return
	var parent: Node = tray_play_canvas.get_parent() as Node
	if parent == null:
		return
	var old_index: int = int(tray_play_canvas.get_index())
	var old_canvas: Node = tray_play_canvas as Node
	parent.remove_child(old_canvas)
	old_canvas.queue_free()

	tray_play_canvas = TrayReflowCanvasScript.new()
	tray_play_canvas.name = "TrayPlayCanvas"
	tray_play_canvas.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	tray_play_canvas.size_flags_vertical = Control.SIZE_EXPAND_FILL
	tray_play_canvas.custom_minimum_size = Vector2(280.0, 190.0)
	tray_play_canvas.group_dragged_out.connect(_on_tray_group_dragged_out)
	tray_play_canvas.tray_cluster_changed.connect(_on_tray_cluster_changed)
	parent.add_child(tray_play_canvas)
	parent.move_child(tray_play_canvas, old_index)


func _store_groups_in_tray(groups: Array, tray_id: String) -> bool:
	# A Tray can be inactive when pieces are dropped onto its manager row. Reflow
	# its existing coordinate space to the current mini-table size before mixing
	# newly-created positions into that state.
	_prepare_tray_for_current_canvas(tray_id)
	var stored: bool = super._store_groups_in_tray(groups, tray_id)
	if stored:
		_prepare_tray_for_current_canvas(tray_id)
	return stored


func _prepare_tray_for_current_canvas(tray_id: String) -> void:
	if (
		tray_play_canvas == null
		or tray_id.is_empty()
		or not tray_play_canvas.has_method("prepare_tray_for_size")
	):
		return
	var target_size: Vector2 = Vector2(tray_play_canvas.size)
	if target_size.x <= 1.0 or target_size.y <= 1.0:
		return
	tray_play_canvas.prepare_tray_for_size(
		board,
		state,
		tray_id,
		target_size
	)
