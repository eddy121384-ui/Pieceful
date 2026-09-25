class_name PuzzlePieceEdgeVisual
extends MeshInstance2D

# A real bevel band built as one mesh. Each contour edge becomes a textured quad
# that spans from the original puzzle contour to an inset contour. Vertex color
# provides directional light/shade across that surface without custom _draw(),
# which keeps the WebGL/mobile path on Godot's standard mesh renderer.

const BEVEL_WIDTH_PX := 3.4
const HIGHLIGHT_GAIN := 1.08
const HIGHLIGHT_GREEN_TINT := 0.985
const HIGHLIGHT_BLUE_TINT := 0.94
const SHADOW_GAIN := 0.72
const LIGHT_DIRECTION := Vector2(-0.72, -0.69)


func configure(
	points: PackedVector2Array,
	uvs: PackedVector2Array,
	texture_value: Texture2D,
	pixel_scale: float = 1.0
) -> void:
	texture = texture_value
	mesh = _build_mesh(points, uvs, maxf(pixel_scale, 0.01))


func _build_mesh(
	points: PackedVector2Array,
	uvs: PackedVector2Array,
	pixel_scale: float
) -> ArrayMesh:
	var result := ArrayMesh.new()
	if points.size() < 3 or uvs.size() != points.size():
		return result

	var outward_normals := _outward_normals(points)
	var inner := _inset_ring(points, outward_normals, BEVEL_WIDTH_PX * pixel_scale)
	var inner_uvs := _mapped_inner_uvs(points, uvs, inner)
	var light := LIGHT_DIRECTION.normalized()

	var vertices := PackedVector3Array()
	var mesh_uvs := PackedVector2Array()
	var colors := PackedColorArray()
	var indices := PackedInt32Array()

	for edge_index in range(points.size()):
		var next_index := (edge_index + 1) % points.size()
		var base := vertices.size()
		var facing := clampf(outward_normals[edge_index].dot(light), -1.0, 1.0)
		var gain := lerpf(
			1.0,
			HIGHLIGHT_GAIN,
			maxf(facing, 0.0)
		)
		gain = lerpf(
			gain,
			SHADOW_GAIN,
			maxf(-facing, 0.0)
		)
		var lit := maxf(facing, 0.0)
		var outer_color := Color(
			gain,
			gain * lerpf(1.0, HIGHLIGHT_GREEN_TINT, lit),
			gain * lerpf(1.0, HIGHLIGHT_BLUE_TINT, lit),
			1.0
		)
		var inner_color := Color(1.0, 1.0, 1.0, 0.02)

		vertices.append(Vector3(points[edge_index].x, points[edge_index].y, 0.0))
		vertices.append(Vector3(points[next_index].x, points[next_index].y, 0.0))
		vertices.append(Vector3(inner[next_index].x, inner[next_index].y, 0.0))
		vertices.append(Vector3(inner[edge_index].x, inner[edge_index].y, 0.0))

		mesh_uvs.append(uvs[edge_index])
		mesh_uvs.append(uvs[next_index])
		mesh_uvs.append(inner_uvs[next_index])
		mesh_uvs.append(inner_uvs[edge_index])

		colors.append(outer_color)
		colors.append(outer_color)
		colors.append(inner_color)
		colors.append(inner_color)

		indices.append(base)
		indices.append(base + 1)
		indices.append(base + 2)
		indices.append(base)
		indices.append(base + 2)
		indices.append(base + 3)

	var arrays := []
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX] = vertices
	arrays[Mesh.ARRAY_TEX_UV] = mesh_uvs
	arrays[Mesh.ARRAY_COLOR] = colors
	arrays[Mesh.ARRAY_INDEX] = indices
	result.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	return result


func _outward_normals(points: PackedVector2Array) -> PackedVector2Array:
	var centroid := _centroid(points)
	var result := PackedVector2Array()
	for index in range(points.size()):
		var a := points[index]
		var b := points[(index + 1) % points.size()]
		var tangent := (b - a).normalized()
		var outward := Vector2(-tangent.y, tangent.x)
		if outward.dot(((a + b) * 0.5) - centroid) < 0.0:
			outward = -outward
		result.append(outward)
	return result


func _inset_ring(
	points: PackedVector2Array,
	normals: PackedVector2Array,
	distance: float
) -> PackedVector2Array:
	var result := PackedVector2Array()
	for index in range(points.size()):
		var previous := (index - 1 + points.size()) % points.size()
		var inward := -(normals[previous] + normals[index])
		if inward.length_squared() < 0.0001:
			inward = -normals[index]
		inward = inward.normalized()
		var denominator := maxf(absf(inward.dot(-normals[index])), 0.48)
		var miter := minf(distance / denominator, distance * 1.7)
		result.append(points[index] + inward * miter)
	return result


func _mapped_inner_uvs(
	points: PackedVector2Array,
	uvs: PackedVector2Array,
	inner: PackedVector2Array
) -> PackedVector2Array:
	var point_bounds := _bounds(points)
	var uv_bounds := _bounds(uvs)
	var scale := Vector2(
		uv_bounds.size.x / maxf(point_bounds.size.x, 0.001),
		uv_bounds.size.y / maxf(point_bounds.size.y, 0.001)
	)
	var origin := uv_bounds.position - point_bounds.position * scale
	var result := PackedVector2Array()
	for point in inner:
		result.append(origin + point * scale)
	return result


func _bounds(points: PackedVector2Array) -> Rect2:
	var result := Rect2(points[0], Vector2.ZERO)
	for point in points:
		result = result.expand(point)
	return result


func _centroid(points: PackedVector2Array) -> Vector2:
	var result := Vector2.ZERO
	for point in points:
		result += point
	return result / maxf(float(points.size()), 1.0)
