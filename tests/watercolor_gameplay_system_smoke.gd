extends SceneTree

const MainScene = preload("res://main.tscn")
const Paper = preload("res://scripts/watercolor_gameplay_style.gd")
var main
var sorting


func _init() -> void:
	call_deferred("_run")


func _settle() -> void:
	for _frame in range(30):
		await process_frame


func _run() -> void:
	root.size = Vector2i(390, 844)
	main = MainScene.instantiate()
	root.add_child(main)
	await _settle()
	main._start_selected_puzzle()
	await _settle()
	sorting = main.get_node("SortingWorkspace")
	sorting._set_loose_layout_mode("scatter")
	await create_timer(0.7).timeout
	for id in sorting.state.tray_ids():
		sorting._delete_tray(id)
	sorting.sort_button.button_pressed = true
	await _settle()
	if not _light_surface(sorting.panel):
		return _fail("Empty manager exposes a dark surface")
	sorting.new_tray_name.text = "Sky and water"
	sorting.add_tray_button.pressed.emit()
	await _settle()
	var tray_id: String = sorting.active_tray_id
	sorting._store_groups_in_tray([[0], [1], [2]], tray_id)
	await _settle()
	if sorting.state.tray_piece_count(tray_id) != 3 or sorting.tray_play_canvas.visual_nodes.size() != 3:
		return _fail("Styled tray lost its real piece membership or visuals")
	if sorting.tray_play_canvas.presentation_surface.bg_color.get_luminance() < 0.85:
		return _fail("Playable tray well still exposes legacy dark paint")
	sorting.detail_name_edit.text = "Cloud study"
	sorting.rename_button.pressed.emit()
	if sorting.state.tray_name(tray_id) != "Cloud study":
		return _fail("Rename binding was lost")
	sorting.collapse_detail_button.pressed.emit()
	await _settle()
	if sorting.tray_play_canvas.visible or not sorting.state.tray_is_collapsed(tray_id):
		return _fail("Collapsed presentation diverged from tray state")
	sorting.collapse_detail_button.pressed.emit()
	sorting.close_detail_button.pressed.emit()
	sorting.new_tray_name.text = "Green study"
	sorting.add_tray_button.pressed.emit()
	var other_id: String = sorting.active_tray_id
	sorting.close_detail_button.pressed.emit()
	sorting._move_tray(other_id, -1)
	await _settle()
	if sorting.state.tray_ids()[0] != other_id:
		return _fail("Reorder binding was lost")
	# Rebuilding rows must keep the shared atlas, disabled states and touch sizes.
	for row in sorting.tray_list_box.get_children():
		for button in row.get_children():
			if button is Button and button.icon != null:
				if not (button.icon is AtlasTexture) or button.icon.atlas != Paper.ATLAS:
					return _fail("A refreshed tray row fell back to legacy icons")
				if button.custom_minimum_size.y < 88:
					return _fail("Tray row utility target is too small")
	sorting.manager_close_button.pressed.emit()
	sorting._set_loose_layout_mode("rail")
	await create_timer(0.7).timeout
	for phone in [Vector2i(390, 844), Vector2i(320, 568), Vector2i(844, 390)]:
		root.size = phone
		await _settle()
		sorting._layout_ui()
		await _settle()
		var initial_rail_size: Vector2 = sorting.rail_panel.size
		for _i in range(8):
			sorting._layout_ui()
			await process_frame
		if sorting.rail_panel.size.distance_to(initial_rail_size) > 2:
			return _fail("Paper Rail header causes repeated layout growth")
		if not _inside(sorting.rail_panel):
			return _fail("Rail is clipped at %s" % phone)
		sorting.sort_button.button_pressed = true
		await _settle()
		if not _inside(sorting.panel) or not _light_surface(sorting.panel):
			return _fail("Expanded manager escapes safe gameplay area at %s" % phone)
		sorting._open_tray(tray_id)
		await _settle()
		if not _inside(sorting.detail_panel) or not _light_surface(sorting.detail_panel):
			return _fail("Playable tray escapes safe gameplay area at %s" % phone)
		sorting.close_detail_button.pressed.emit()
		sorting.manager_close_button.pressed.emit()
	if sorting.rail_canvas.modulate.a < 0.95 or sorting.rail_canvas.visual_nodes.is_empty():
		return _fail("Rail transition or real piece presentation regressed")
	sorting._set_loose_layout_mode("scatter")
	await create_timer(0.7).timeout
	if sorting.state.tray_piece_count(tray_id) != 3:
		return _fail("Rail/Scatter presentation changed tray membership")
	sorting._delete_tray(tray_id)
	if sorting.state.location_for(0) != "loose":
		return _fail("Deleting a styled tray failed to return pieces")
	main._toggle_sessions_panel()
	await _settle()
	if not _light_surface(main.sessions_panel):
		return _fail("Unfinished gameplay sheet exposes a dark surface")
	main.queue_free()
	await process_frame
	print("PASS watercolor_gameplay_system_smoke")
	quit(0)


func _light_surface(panel: PanelContainer) -> bool:
	var style := panel.get_theme_stylebox("panel") as StyleBoxFlat
	return style != null and style.bg_color.a > 0.95 and style.bg_color.get_luminance() > 0.85


func _inside(control: Control) -> bool:
	var view: Vector2 = sorting._viewport_size()
	var rect := control.get_rect()
	return rect.position.x >= 0 and rect.position.y >= 0 and rect.end.x <= view.x + 1 and rect.end.y <= view.y + 1


func _fail(message: String) -> void:
	push_error("FAIL watercolor_gameplay_system_smoke: " + message)
	quit(1)
