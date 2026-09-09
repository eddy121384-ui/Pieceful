extends "res://scripts/chaos_order_spatial_main.gd"

# The root render target stays 720×720. We still lay the game out in the same
# virtual spaces players already know (for example ~1280×720 landscape and
# ~720×1280 portrait), then compress that virtual long axis into the fixed
# surface. Godot's final viewport stretch expands it back to the physical window,
# cancelling the compression without resizing the 1,000+ CanvasItem puzzle tree.
const FIXED_SURFACE_SIZE := Vector2(720.0, 720.0)
const VIRTUAL_SHORT_EDGE := 720.0

var last_physical_window_size := Vector2i.ZERO


func _ready() -> void:
	last_physical_window_size = get_window().size
	var virtual_size := _virtual_size_for_physical(Vector2(last_physical_window_size))
	if puzzle_camera != null and puzzle_camera.has_method("set_virtual_viewport_size"):
		puzzle_camera.set_virtual_viewport_size(virtual_size)

	super._ready()
	_apply_main_ui_surface_transform(virtual_size)
	_apply_sorting_surface_context(virtual_size)
	if puzzle_camera != null and puzzle_camera.has_method("logical_zoom"):
		_on_zoom_changed(float(puzzle_camera.logical_zoom()))
	set_process(true)


func _process(_delta: float) -> void:
	var physical_size: Vector2i = get_window().size
	if physical_size == last_physical_window_size:
		return
	if physical_size.x <= 1 or physical_size.y <= 1:
		return

	last_physical_window_size = physical_size
	var virtual_size := _virtual_size_for_physical(Vector2(physical_size))
	if puzzle_camera != null and puzzle_camera.has_method("set_virtual_viewport_size"):
		puzzle_camera.set_virtual_viewport_size(virtual_size)

	# Fixed-surface resize is cheap enough that the player-facing layout can
	# update on the first observed physical-size frame. Sorting/Tray internals keep
	# their own short settle timer for repeated mobile intermediate sizes.
	_apply_responsive_reflow()
	_apply_main_ui_surface_transform(virtual_size)
	_apply_sorting_surface_context(virtual_size)


func _sync_content_scale_to_window() -> Vector2:
	return _virtual_size_for_physical(Vector2(get_window().size))


func _layout_ui(viewport_size: Vector2) -> void:
	super._layout_ui(viewport_size)
	_apply_main_ui_surface_transform(viewport_size)


func _virtual_size_for_physical(physical_size: Vector2) -> Vector2:
	if physical_size.x <= 1.0 or physical_size.y <= 1.0:
		return FIXED_SURFACE_SIZE
	var aspect := physical_size.x / physical_size.y
	if aspect >= 1.0:
		return Vector2(VIRTUAL_SHORT_EDGE * aspect, VIRTUAL_SHORT_EDGE)
	return Vector2(VIRTUAL_SHORT_EDGE, VIRTUAL_SHORT_EDGE / aspect)


func _surface_scale_for_virtual(virtual_size: Vector2) -> Vector2:
	return Vector2(
		FIXED_SURFACE_SIZE.x / maxf(virtual_size.x, 1.0),
		FIXED_SURFACE_SIZE.y / maxf(virtual_size.y, 1.0)
	)


func _apply_main_ui_surface_transform(virtual_size: Vector2) -> void:
	var ui_layer := get_node_or_null("UI") as CanvasLayer
	if ui_layer == null:
		return
	var scale := _surface_scale_for_virtual(virtual_size)
	ui_layer.transform = Transform2D(
		Vector2(scale.x, 0.0),
		Vector2(0.0, scale.y),
		Vector2.ZERO
	)


func _apply_sorting_surface_context(virtual_size: Vector2) -> void:
	var workspace = get_node_or_null("SortingWorkspace")
	if workspace != null and workspace.has_method("set_fixed_surface_virtual_size"):
		workspace.set_fixed_surface_virtual_size(virtual_size)
