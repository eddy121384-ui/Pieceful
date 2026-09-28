extends SceneTree

const PuzzleDefinitionScript = preload("res://scripts/puzzle_definition.gd")
const PuzzlePieceScript = preload("res://scripts/puzzle_piece.gd")
const VisualFactoryScript = preload("res://scripts/puzzle_piece_visual_factory.gd")
const DEMO_TEXTURE: Texture2D = preload("res://assets/demo_garden.svg")
const BOARD_RECT := Rect2(Vector2(340.0, 105.0), Vector2(600.0, 375.0))
const CASES := [
	{"label": "relaxed", "path": "res://cut_patterns/Classic_040_A.json", "expected": 40},
	{"label": "standard", "path": "res://cut_patterns/Classic_150_A.json", "expected": 150},
	{"label": "hard", "path": "res://cut_patterns/Classic_286_A.json", "expected": 286},
]
const CATASTROPHIC_BUILD_LIMIT_MS := 5000


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	for case_value in CASES:
		var case: Dictionary = case_value
		var definition_started := Time.get_ticks_msec()
		var definition = PuzzleDefinitionScript.new(
			DEMO_TEXTURE,
			BOARD_RECT,
			str(case["path"])
		)
		var definition_ms := int(Time.get_ticks_msec() - definition_started)
		var expected := int(case["expected"])
		if definition.piece_count() != expected:
			_fail(
				"%s expected %d pieces, got %d"
				% [str(case["label"]), expected, definition.piece_count()]
			)
			return

		var holder := Node2D.new()
		root.add_child(holder)
		var build_started := Time.get_ticks_msec()
		for index in range(definition.piece_count()):
			var piece = PuzzlePieceScript.new()
			holder.add_child(piece)
			piece.configure(
				index,
				DEMO_TEXTURE,
				definition.target_position_for(index),
				definition.piece_size,
				definition.source_origin_for(index),
				definition.source_cell_size,
				definition.outline_for(index),
				definition.target_position_for(index) + Vector2(20.0, 20.0)
			)
		var build_ms := int(Time.get_ticks_msec() - build_started)

		var polygon_render_items := 0
		var mesh_render_items := 0
		var line_render_items := 0
		var viewport_items := 0
		var relief_materials := {}
		var textures := {}
		for piece_value in holder.get_children():
			for child in piece_value.get_children():
				if child is Polygon2D:
					polygon_render_items += 1
					if (child as Polygon2D).texture != null:
						textures[(child as Polygon2D).texture] = true
					if (child as Polygon2D).material != null:
						_fail("%s Polygon2D gained a per-piece material" % str(case["label"]))
						return
				elif child is MeshInstance2D:
					mesh_render_items += 1
				elif child is Line2D:
					line_render_items += 1
					if (child as Line2D).texture != null:
						textures[(child as Line2D).texture] = true
					if (child as Line2D).material != null:
						relief_materials[(child as Line2D).material] = true
				elif child is SubViewport or child is SubViewportContainer:
					viewport_items += 1

		var expected_polygon_items := expected * 3
		if polygon_render_items != expected_polygon_items:
			_fail(
				"%s expected %d Polygon2D render items, got %d"
				% [str(case["label"]), expected_polygon_items, polygon_render_items]
			)
			return
		if mesh_render_items != 0:
			_fail(
				"%s created %d mesh render items"
				% [str(case["label"]), mesh_render_items]
			)
			return
		if line_render_items != expected:
			_fail(
				"%s expected %d EdgeRelief lines, got %d"
				% [str(case["label"]), expected, line_render_items]
			)
			return
		if viewport_items != 0:
			_fail("%s created per-piece viewports" % str(case["label"]))
			return
		# One shared relief material for every loose piece, one shared artwork
		# texture: nothing is generated per piece.
		if relief_materials.size() != 1:
			_fail(
				"%s expected 1 shared EdgeRelief material, got %d"
				% [str(case["label"]), relief_materials.size()]
			)
			return
		if textures.size() != 1 or not textures.has(DEMO_TEXTURE):
			_fail(
				"%s expected only the shared artwork texture, got %d textures"
				% [str(case["label"]), textures.size()]
			)
			return
		if build_ms > CATASTROPHIC_BUILD_LIMIT_MS:
			_fail(
				"%s piece build took %d ms (catastrophic limit %d ms)"
				% [str(case["label"]), build_ms, CATASTROPHIC_BUILD_LIMIT_MS]
			)
			return

		print(
			"BENCH paper_relief_build · %s · %d pieces · definition %d ms · pieces %d ms · %d Polygon2D · %d EdgeRelief Line2D · 0 mesh · %d shared relief ShaderMaterial · %d texture"
			% [
				str(case["label"]),
				expected,
				definition_ms,
				build_ms,
				polygon_render_items,
				line_render_items,
				relief_materials.size(),
				textures.size(),
			]
		)

		holder.queue_free()
		await process_frame

	# Loose, joined and solved: never more relief materials than piece states.
	if VisualFactoryScript._edge_relief_materials.size() > VisualFactoryScript.EDGE_RELIEF_STATE_PARAMS.size():
		_fail("EdgeRelief material cache grew beyond one material per state")
		return

	print("PASS puzzle_piece_depth_benchmark")
	quit(0)


func _fail(message: String) -> void:
	push_error("FAIL puzzle_piece_depth_benchmark: %s" % message)
	quit(1)
