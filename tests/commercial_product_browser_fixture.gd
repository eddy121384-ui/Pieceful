extends Node

# Used only by the separate QA scene. Production main.tscn has no bridge.
# Mouse/touch navigation still goes through the rendered Godot controls; the
# bridge provides their current bounds and deterministic progress fixtures.
var main: Node
var request_callback
var publish_elapsed := 0.0


func _ready() -> void:
	if OS.has_feature("web"):
		call_deferred("_install")


func _install() -> void:
	main = get_parent()
	for _frame in range(30):
		await get_tree().process_frame
	request_callback = JavaScriptBridge.create_callback(_on_request)
	JavaScriptBridge.get_interface("window").piecefulQaRequest = request_callback
	_publish()


func _process(delta: float) -> void:
	if main == null or not OS.has_feature("web"):
		return
	publish_elapsed += delta
	if publish_elapsed >= 0.2:
		publish_elapsed = 0.0
		_publish()


func _on_request(arguments: Array) -> void:
	if arguments.is_empty():
		return
	var action := str(arguments[0])
	var board = main.get_node("PuzzleBoard")
	if action == "place_one":
		for key in board.cluster_members.keys():
			var member = board.pieces[int(board.cluster_members[key][0])]
			if not member.solved:
				board._solve_cluster(int(key))
				break
	elif action == "complete":
		for key in board.cluster_members.keys():
			board._solve_cluster(int(key))
	_publish()


func _publish() -> void:
	var board = main.get_node("PuzzleBoard")
	var saves = main.get_node("SaveCoordinator")
	var controls: Array = []
	_collect_controls(main, controls)
	var menus: Array = []
	for option in [main.puzzle_selection_difficulty, main.gallery_category_filter, main.gallery_status_filter]:
		var popup = option.get_popup()
		if popup.visible:
			menus.append({"name": str(option.name), "count": popup.item_count, "rect": [popup.position.x, popup.position.y, popup.size.x, popup.size.y]})
	var viewport := main.get_viewport().get_visible_rect().size
	var piece_points: Array = []
	for piece in board.pieces:
		var point: Vector2 = piece.get_global_transform_with_canvas() * (piece.piece_size * 0.5)
		piece_points.append({"index": int(piece.piece_index), "solved": piece.solved, "point": [point.x, point.y]})
	var state := {
		"gallery": main.puzzle_selection_overlay.visible,
		"setup": main.product_setup_open,
		"settings": main.product_settings_overlay.visible,
		"confirmation": main.product_confirmation_overlay.visible,
		"completion": main.completion_panel.visible,
		"journal": main.journal_overlay.visible,
		"sessions": main.sessions_panel.visible,
		"replay": main.timelapse_overlay.visible,
		"content": str(board.active_content_id()),
		"pending": main.pending_content_id,
		"difficulty": str(board.active_difficulty_id()),
		"game": str(saves.active_game()),
		"coordinator_bound": main.save_coordinator != null,
		"needs_selection": saves.needs_new_game_selection(),
		"bootstrapping": saves.bootstrapping,
		"save_error": saves.last_save_error,
		"solved": int(board.solved_count),
		"hint": board.hint_is_enabled(),
		"picture_mode": main.preview_mode,
		"replay_close": str(main.timelapse_close_button.name),
		"piece_picker": str(main.puzzle_selection_difficulty.name),
		"pieces": board.pieces.size(),
		"games": saves.list_unfinished_games(),
		"history_count": saves.journal_completion_count(),
		"viewport": [viewport.x, viewport.y],
		"controls": controls,
		"menus": menus,
		"piece_points": piece_points,
	}
	JavaScriptBridge.eval("window.__PIECEFUL_UX_STATE__=" + JSON.stringify(state) + ";", true)


func _collect_controls(node: Node, controls: Array) -> void:
	if (node is BaseButton or node is LineEdit) and node.is_visible_in_tree():
		var role := ""
		if node == main.preview_button:
			role = "picture"
		elif node == main.hint_button:
			role = "hint"
		elif node == main.get_node("SortingWorkspace").sort_button:
			role = "trays"
		var rect: Rect2 = node.get_global_rect()
		var clip := rect
		var scroll_rect := Rect2()
		var parent := node.get_parent()
		while parent != null:
			if parent is ScrollContainer:
				var parent_rect: Rect2 = parent.get_global_rect()
				clip = clip.intersection(parent_rect)
				if scroll_rect.size == Vector2.ZERO or rect.position.y < parent_rect.position.y or rect.end.y > parent_rect.end.y:
					scroll_rect = parent_rect
			parent = parent.get_parent()
		controls.append({"name": str(node.name), "role": role, "text": node.text if node is Button or node is LineEdit else "", "tooltip": node.tooltip_text, "disabled": node.disabled if node is BaseButton else false, "rect": [rect.position.x, rect.position.y, rect.size.x, rect.size.y], "clip": [clip.position.x, clip.position.y, clip.size.x, clip.size.y], "scroll_rect": [scroll_rect.position.x, scroll_rect.position.y, scroll_rect.size.x, scroll_rect.size.y]})
	for child in node.get_children():
		_collect_controls(child, controls)
