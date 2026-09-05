extends "res://scripts/sorting_workspace_controller.gd"

const Icons = preload("res://scripts/ui_icon_catalog.gd")

var grip_icon: TextureRect


func _build_ui() -> void:
	super._build_ui()

	Icons.apply_button(
		sort_button,
		Icons.IconId.TRAY,
		"Sorting trays",
		Vector2(48.0, 48.0),
		24
	)
	Icons.apply_button(
		add_tray_button,
		Icons.IconId.ADD,
		"Create tray",
		Vector2(40.0, 40.0),
		20
	)
	Icons.apply_button(
		close_detail_button,
		Icons.IconId.BACK,
		"Back",
		Vector2(40.0, 40.0),
		20
	)
	Icons.apply_button(
		rename_button,
		Icons.IconId.RENAME,
		"Rename tray",
		Vector2(40.0, 40.0),
		20
	)

	new_tray_name.placeholder_text = "Tray name"
	note_label.text = "Tray = mini puzzle table"
	play_hint_label.visible = false

	_iconify_drag_handle()
	_simplify_panel_title()


func _refresh_ui() -> void:
	super._refresh_ui()
	if sort_button == null:
		return
	sort_button.text = ""
	sort_button.icon = Icons.texture(Icons.IconId.TRAY)
	sort_button.tooltip_text = "%d tray%s" % [
		state.tray_ids().size(),
		"" if state.tray_ids().size() == 1 else "s",
	]


func _iconify_drag_handle() -> void:
	if detail_drag_handle == null:
		return
	detail_drag_handle.text = ""
	detail_drag_handle.tooltip_text = "Move tray"
	detail_drag_handle.custom_minimum_size = Vector2(0.0, 34.0)

	grip_icon = TextureRect.new()
	grip_icon.texture = Icons.texture(Icons.IconId.GRIP)
	grip_icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	grip_icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	grip_icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	grip_icon.anchor_left = 0.5
	grip_icon.anchor_top = 0.5
	grip_icon.anchor_right = 0.5
	grip_icon.anchor_bottom = 0.5
	grip_icon.offset_left = -15.0
	grip_icon.offset_top = -15.0
	grip_icon.offset_right = 15.0
	grip_icon.offset_bottom = 15.0
	detail_drag_handle.add_child(grip_icon)


func _simplify_panel_title() -> void:
	var title := _find_label_with_text(panel, "Sorting Workspace")
	if title != null:
		title.text = "Trays"


func _find_label_with_text(root: Node, target_text: String) -> Label:
	if root == null:
		return null
	for child in root.get_children():
		if child is Label and child.text == target_text:
			return child as Label
		var nested := _find_label_with_text(child, target_text)
		if nested != null:
			return nested
	return null
