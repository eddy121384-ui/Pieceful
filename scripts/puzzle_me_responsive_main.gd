class_name PuzzleMeResponsiveMain
extends "res://scripts/puzzle_me_main.gd"

# The Godot project intentionally keeps a 1280x720 logical viewport for the
# puzzle workspace. In Web exports that means get_viewport().get_visible_rect()
# can remain landscape even while Safari itself is visibly portrait. Gallery
# responsiveness therefore uses browser CSS viewport orientation on Web and
# falls back to the Godot viewport on native/headless builds.
var _web_gallery_resize_callback = null


func _ready() -> void:
	super._ready()
	_install_web_gallery_resize_listener()
	call_deferred("_refresh_gallery_layout_from_browser")


func _apply_gallery_layout(viewport_size: Vector2) -> void:
	_apply_gallery_layout_for_orientation(viewport_size, _gallery_orientation_size(viewport_size))


func _apply_gallery_layout_for_orientation(
	logical_viewport_size: Vector2,
	orientation_size: Vector2
) -> void:
	# GalleryImageAwareMain currently owns the actual reparenting and only needs a
	# portrait/wide probe. Preserve the logical puzzle viewport everywhere else;
	# normalize only the size passed into that Gallery mode decision.
	var mode_probe := logical_viewport_size
	if orientation_size.y > orientation_size.x:
		mode_probe.x = minf(mode_probe.x, 699.0)
		mode_probe.y = maxf(mode_probe.y, 700.0)
		if mode_probe.y <= mode_probe.x:
			mode_probe.y = mode_probe.x + 1.0
	else:
		mode_probe.x = maxf(mode_probe.x, 701.0)
		mode_probe.y = minf(mode_probe.y, 700.0)
		if mode_probe.y > mode_probe.x:
			mode_probe.x = mode_probe.y + 1.0
	super._apply_gallery_layout(mode_probe)


func _gallery_orientation_size(fallback: Vector2) -> Vector2:
	if not OS.has_feature("web"):
		return fallback
	var window = JavaScriptBridge.get_interface("window")
	if window == null:
		return fallback
	var width := float(window.innerWidth)
	var height := float(window.innerHeight)
	if width <= 0.0 or height <= 0.0:
		return fallback
	return Vector2(width, height)


func _install_web_gallery_resize_listener() -> void:
	if not OS.has_feature("web") or _web_gallery_resize_callback != null:
		return
	var window = JavaScriptBridge.get_interface("window")
	if window == null:
		return
	_web_gallery_resize_callback = JavaScriptBridge.create_callback(_on_web_gallery_viewport_changed)
	window.addEventListener("resize", _web_gallery_resize_callback)
	window.addEventListener("orientationchange", _web_gallery_resize_callback)


func _on_web_gallery_viewport_changed(_args: Array) -> void:
	call_deferred("_refresh_gallery_layout_from_browser")


func _refresh_gallery_layout_from_browser() -> void:
	if not is_inside_tree() or gallery_scroll == null:
		return
	_apply_gallery_layout(get_viewport().get_visible_rect().size)
