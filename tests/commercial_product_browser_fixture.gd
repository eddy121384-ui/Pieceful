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
	_publish_transition()
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
	elif action == "join_loose":
		# Deterministic loose island for transition QA; use the real board's
		# merge/state machinery, without solving or changing production input.
		var anchor := int(arguments[1]) if arguments.size() > 1 else 0
		var first = board.pieces[anchor]
		var second = board.pieces[anchor + 1]
		var view := main.get_viewport().get_visible_rect().size
		var origin: Vector2 = board.get_global_transform_with_canvas().affine_inverse() * (view * Vector2(0.35, 0.72))
		first.position = origin - first.piece_size * 0.5
		second.position = first.position + second.target_position - first.target_position
		board._merge_cluster_into(board._cluster_id_for(anchor), board._cluster_id_for(anchor + 1))
		board._raise_cluster(board._cluster_id_for(anchor))
	_publish()


func _publish_transition() -> void:
	var sorting = main.get_node("SortingWorkspace")
	var groups: Array = []
	if sorting.layout_transition_active:
		for group in sorting.layout_transition_root.get_children():
			if group.is_queued_for_deletion():
				continue
			var holders: Array = []
			for holder in group.get_children():
				var layers: Array = []
				for layer in holder.get_children():
					layers.append({"name": str(layer.name), "z": layer.z_index, "relative": layer.z_as_relative, "visible": layer.visible, "material": layer.material.resource_name if layer.material != null else "", "width": layer.width if layer is Line2D else 0.0, "offset": [layer.position.x, layer.position.y]})
				holders.append(layers)
			groups.append({"name": str(group.name), "position": [group.position.x, group.position.y], "scale": group.scale.x, "holders": holders})
	var data := {"active": sorting.layout_transition_active, "mode": sorting.loose_layout_mode, "root_z": sorting.layout_transition_root.z_index, "groups": groups}
	JavaScriptBridge.eval("window.__PIECEFUL_TRANSITION__=" + JSON.stringify(data) + ";if(window.__PIECEFUL_TRANSITION__.active){(window.__PIECEFUL_TRANSITION_FRAMES__??=[]).push(window.__PIECEFUL_TRANSITION__);}", true)


func _publish() -> void:
	var board = main.get_node("PuzzleBoard")
	var saves = main.get_node("SaveCoordinator")
	var controls: Array = []
	_collect_controls(main, controls)
	var menus: Array = []
	for option in [main.puzzle_selection_difficulty, main.gallery_category_filter, main.gallery_status_filter, main.album_overflow_difficulty]:
		var popup = option.get_popup()
		if popup.visible:
			menus.append({"name": str(option.name), "count": popup.item_count, "rect": [popup.position.x, popup.position.y, popup.size.x, popup.size.y]})
	var viewport := main.get_viewport().get_visible_rect().size
	var piece_points: Array = []
	for piece in board.pieces:
		var point: Vector2 = piece.get_global_transform_with_canvas() * (piece.piece_size * 0.5)
		var target: Vector2 = piece.get_parent().get_global_transform_with_canvas() * (piece.target_position + piece.piece_size * 0.5)
		piece_points.append({"index": int(piece.piece_index), "cluster": board._cluster_id_for(piece.piece_index), "solved": piece.solved, "visible": piece.is_visible_in_tree(), "pickable": piece.input_pickable, "z": piece.z_index, "point": [point.x, point.y], "target": [target.x, target.y]})
	var sorting = main.get_node("SortingWorkspace")
	var trays: Array = []
	for tray_id in sorting.state.tray_ids():
		trays.append({"id": tray_id, "name": sorting.state.tray_name(tray_id), "collapsed": sorting.state.tray_is_collapsed(tray_id), "members": sorting.state.tray_piece_indexes(tray_id)})
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
		"resume_pending": main.product_resume_pending,
		"save_error": saves.last_save_error,
		"solved": int(board.solved_count),
		"hint": board.hint_is_enabled(),
		"board_lines": main.board_lines_enabled,
		"board_lines_visible": main.board_lines_overlay.visible,
		"tray_manager": sorting.panel.visible,
		"tray_detail": sorting.detail_panel.visible,
		"rail_drop_point": [sorting.rail_scroll.get_global_rect().get_center().x, sorting.rail_scroll.get_global_rect().get_center().y],
		"trays": trays,
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
		var sorting = main.get_node("SortingWorkspace")
		for entry in [[sorting.new_tray_name, "new_tray_name"], [sorting.add_tray_button, "create_tray"], [sorting.detail_name_edit, "tray_name"], [sorting.rename_button, "rename_tray"], [sorting.collapse_detail_button, "collapse_tray"], [sorting.close_detail_button, "close_tray"], [sorting.manager_close_button, "close_trays"], [sorting.selection_mode_button, "select_pieces"]]:
			if node == entry[0]:
				role = entry[1]
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
