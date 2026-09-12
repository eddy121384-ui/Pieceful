class_name PuzzleMeResponsiveMain
extends "res://scripts/puzzle_me_main.gd"

# Web exports can report a Retina-sized Godot canvas rather than CSS logical
# pixels. The Gallery contract is therefore orientation-driven: any portrait
# viewport uses the two-column vertical artwork wall, regardless of absolute
# pixel width. The parent still owns all layout/reparenting behavior; this thin
# adapter only normalizes the size used by its older <=700px portrait gate.
func _apply_gallery_layout(viewport_size: Vector2) -> void:
	var responsive_size := viewport_size
	if viewport_size.y > viewport_size.x:
		responsive_size.x = minf(viewport_size.x, 699.0)
	super._apply_gallery_layout(responsive_size)
