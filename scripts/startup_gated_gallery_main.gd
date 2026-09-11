class_name StartupGatedGalleryMain
extends "res://scripts/gallery_image_aware_main.gd"

const STARTUP_FADE_SECONDS := 0.12

var startup_curtain_layer: CanvasLayer = null
var startup_curtain: ColorRect = null
var startup_copy: Label = null
var startup_gate_dismissed := false


func _ready() -> void:
	# The inherited runtime intentionally creates a provisional Relaxed puzzle
	# synchronously so every downstream system has valid nodes to bind against.
	# Install the curtain in the same _ready frame, before the first rendered
	# frame, so players never see that provisional board while save bootstrap is
	# resolving their real artwork/difficulty/progress.
	super._ready()
	_install_startup_curtain()


func _wait_for_catalog_bootstrap() -> void:
	await super._wait_for_catalog_bootstrap()
	_dismiss_startup_curtain()


func _install_startup_curtain() -> void:
	if startup_curtain_layer != null:
		return

	startup_curtain_layer = CanvasLayer.new()
	startup_curtain_layer.name = "StartupCurtainLayer"
	startup_curtain_layer.layer = 100
	add_child(startup_curtain_layer)

	startup_curtain = ColorRect.new()
	startup_curtain.name = "StartupCurtain"
	startup_curtain.color = Color(0.012, 0.014, 0.019, 1.0)
	startup_curtain.mouse_filter = Control.MOUSE_FILTER_STOP
	startup_curtain.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	startup_curtain_layer.add_child(startup_curtain)

	var center := CenterContainer.new()
	center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	startup_curtain.add_child(center)

	var box := VBoxContainer.new()
	box.alignment = BoxContainer.ALIGNMENT_CENTER
	box.add_theme_constant_override("separation", 8)
	center.add_child(box)

	var title := Label.new()
	title.text = "Pieceful"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 27)
	box.add_child(title)

	startup_copy = Label.new()
	startup_copy.text = "Loading puzzle…"
	startup_copy.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	startup_copy.modulate = Color(1.0, 1.0, 1.0, 0.58)
	startup_copy.add_theme_font_size_override("font_size", 14)
	box.add_child(startup_copy)


func _dismiss_startup_curtain() -> void:
	if startup_gate_dismissed:
		return
	startup_gate_dismissed = true
	if startup_curtain == null or not is_instance_valid(startup_curtain):
		_release_startup_curtain()
		return

	var tween := create_tween()
	tween.set_trans(Tween.TRANS_QUAD)
	tween.set_ease(Tween.EASE_OUT)
	tween.tween_property(startup_curtain, "modulate:a", 0.0, STARTUP_FADE_SECONDS)
	tween.finished.connect(_release_startup_curtain)


func _release_startup_curtain() -> void:
	if startup_curtain_layer != null and is_instance_valid(startup_curtain_layer):
		startup_curtain_layer.queue_free()
	startup_curtain_layer = null
	startup_curtain = null
	startup_copy = null
