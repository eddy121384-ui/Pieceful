extends SceneTree
# Visual QA for #55 paper relief. Renders real PuzzlePiece nodes (loose,
# overlapping, joined, solved) through the live visual factory to a PNG.
# Needs a real rendering driver (not --headless), e.g. on Linux CI/containers:
#   xvfb-run -a godot --path . --rendering-driver opengl3 --resolution 1170x1100 \
#     --script tools/piece_relief_preview.gd -- out.png <zoom> <center_x> <center_y> \
#     [texture_path] [cut_pattern_path]
# Positions are authored for the 40-piece cell and scale with the pattern.
const PuzzleDefinitionScript = preload("res://scripts/puzzle_definition.gd")
const PuzzlePieceScript = preload("res://scripts/puzzle_piece.gd")

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var args := OS.get_cmdline_user_args()
	var out: String = args[0]
	var zoom := float(args[1])
	var center := Vector2(float(args[2]), float(args[3]))
	var tex_path: String = args[4] if args.size() > 4 else "res://assets/museum/met_v0/puzzles/met_10181.jpg"
	var pattern: String = args[5] if args.size() > 5 else "res://cut_patterns/Classic_040_A.json"
	var tex: Texture2D = load(tex_path)
	RenderingServer.set_default_clear_color(Color(0.075, 0.082, 0.09, 1))
	var def = PuzzleDefinitionScript.new(tex, Rect2(Vector2.ZERO, Vector2(600, 375)), pattern)
	var board := Node2D.new()
	root.add_child(board)
	var cols: int = def.columns
	var k: float = def.piece_size.x / 75.0
	zoom /= k
	center *= k
	var z := 10
	var plan := [
		# [index, offset, state]
		[0, Vector2(0, 0), "solved"], [1, Vector2(0, 0), "solved"],
		[cols, Vector2(0, 0), "solved"], [cols + 1, Vector2(0, 0), "solved"],
		[3, Vector2(-60, 150), "joined"], [4, Vector2(-60, 150), "joined"],
		[cols * 2 + 2, Vector2(20, 280), "abs"],
		[cols * 2 + 5, Vector2(150, 250), "abs"],
		[cols * 3 + 3, Vector2(260, 190), "abs"],
		[cols * 3 + 4, Vector2(300, 230), "abs"],
		[cols * 1 + 6, Vector2(280, 40), "abs"],
	]
	for entry in plan:
		var idx: int = entry[0]
		var piece = PuzzlePieceScript.new()
		board.add_child(piece)
		piece.configure(idx, tex, def.target_position_for(idx), def.piece_size,
			def.source_origin_for(idx), def.source_cell_size, def.outline_for(idx),
			def.target_position_for(idx) + entry[1] * k if entry[2] != "abs" else entry[1] * k)
		piece.z_index = z
		z += 1
		if entry[2] == "solved":
			piece.snap_to_target()
			piece.position = def.target_position_for(idx)
		elif entry[2] == "joined":
			piece.apply_joined_visual()
	var cam := Camera2D.new()
	cam.zoom = Vector2(zoom, zoom)
	cam.position = center
	root.add_child(cam)
	cam.make_current()
	for i in 8:
		await process_frame
	await create_timer(0.3).timeout
	await process_frame
	var img := root.get_texture().get_image()
	img.save_png(out)
	print("saved ", out)
	quit()
