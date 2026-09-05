class_name TrayItemPreview
extends Control

const PREVIEW_SIZE := Vector2(124.0, 82.0)
const PADDING := 7.0

var content_root: Node2D = null


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	clip_contents = true
	custom_minimum_size = PREVIEW_SIZE
	size = PREVIEW_SIZE


func configure(piece_nodes: Array) -> void:
	_clear_content()
	custom_minimum_size = PREVIEW_SIZE
	size = PREVIEW_SIZE
	if piece_nodes.is_empty():
		return

	var bounds := Rect2()
	var has_bounds := false
	for piece in piece_nodes:
		if piece == null or not is_instance_valid(piece):
			continue
		for point in piece.polygon_points:
			var artwork_point: Vector2 = Vector2(piece.target_position) + Vector2(point)
			if not has_bounds:
				bounds = Rect2(artwork_point, Vector2.ZERO)
				has_bounds = true
			else:
				bounds = bounds.expand(artwork_point)

	if not has_bounds:
		return

	var usable_size := PREVIEW_SIZE - Vector2(PADDING * 2.0, PADDING * 2.0)
	var scale_factor := minf(
		usable_size.x / maxf(bounds.size.x, 1.0),
		usable_size.y / maxf(bounds.size.y, 1.0)
	)

	content_root = Node2D.new()
	content_root.name = "Artwork"
	content_root.scale = Vector2(scale_factor, scale_factor)
	content_root.position = (
		(PREVIEW_SIZE - bounds.size * scale_factor) * 0.5
		- bounds.position * scale_factor
	)
	add_child(content_root)

	for piece in piece_nodes:
		if piece == null or not is_instance_valid(piece):
			continue

		var face := Polygon2D.new()
		face.polygon = piece.polygon_points
		face.uv = piece.uv_points
		face.texture = piece.source_texture
		face.position = piece.target_position
		content_root.add_child(face)

		var outline := Line2D.new()
		var outline_points: PackedVector2Array = piece.polygon_points.duplicate()
		if not outline_points.is_empty():
			outline_points.append(outline_points[0])
		outline.points = outline_points
		outline.position = piece.target_position
		outline.width = 0.85
		outline.default_color = Color(1.0, 1.0, 1.0, 0.42)
		outline.antialiased = true
		content_root.add_child(outline)


func _clear_content() -> void:
	if content_root != null and is_instance_valid(content_root):
		remove_child(content_root)
		content_root.queue_free()
	content_root = null
