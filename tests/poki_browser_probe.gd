extends Node

var main: Node
var elapsed := 0.0
var callback


func _ready() -> void:
	main = get_parent()
	if not OS.has_feature("web"):
		set_process(false)
		return
	process_mode = Node.PROCESS_MODE_ALWAYS
	callback = JavaScriptBridge.create_callback(_request)
	JavaScriptBridge.get_interface("window").pokiQaRequest = callback


func _process(delta: float) -> void:
	elapsed += delta
	if elapsed < 0.2 or not main.poki_ready:
		return
	elapsed = 0.0
	var textures: Array = []
	for identifier in main.poki_thumb_cache:
		var texture: Texture2D = main.poki_thumb_cache[identifier]
		textures.append({"id": identifier, "bytes_rgba_estimate": texture.get_width() * texture.get_height() * 4})
	var snapshot := {"profile": "poki", "camera_zoom": main.puzzle_camera.zoom.x,
		"camera_position": [main.puzzle_camera.global_position.x, main.puzzle_camera.global_position.y],
		"completion_transition_pending": main.poki_completion_transition_pending, "user_dir": OS.get_user_data_dir(),
		"thumbnail_cache": textures, "thumbnail_count": textures.size(),
		"full_art_cache_count": main.board._texture_cache.size(),
		"nodes": Performance.get_monitor(Performance.OBJECT_NODE_COUNT),
		"orphan_nodes": Performance.get_monitor(Performance.OBJECT_ORPHAN_NODE_COUNT),
		"static_memory": Performance.get_monitor(Performance.MEMORY_STATIC),
		"texture_memory": Performance.get_monitor(Performance.RENDER_TEXTURE_MEM_USED),
		"draw_calls": Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),
		"process_seconds": Performance.get_monitor(Performance.TIME_PROCESS),
		"paused": get_tree().paused, "manual_paused": main.poki_manual_paused,
		"ad_locked": main.poki_ad_lock, "master_muted": AudioServer.is_bus_mute(0),
		"loaded_artworks": main.board.content_presets().size()}
	JavaScriptBridge.eval("window.__PIECEFUL_POKI_STATE__=" + JSON.stringify(snapshot) + ";", true)


func _request(args: Array) -> void:
	if args.is_empty():
		return
	if str(args[0]) == "mute":
		AudioServer.set_bus_mute(0, bool(args[1]))
	elif str(args[0]) == "ad":
		main._poki_commercial_transition()
	elif str(args[0]) == "pause":
		main._toggle_poki_pause()
	elif str(args[0]) == "drag_busy":
		main.board.active_drag_piece = main.board.pieces[0] if bool(args[1]) else null
	elif str(args[0]) == "transition_busy":
		main.get_node("SortingWorkspace").layout_transition_active = bool(args[1])
