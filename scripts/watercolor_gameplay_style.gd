class_name WatercolorGameplayStyle
extends RefCounted

# Original ink drawings share one atlas. Presentation only: never traverse pieces.
const ATLAS = preload("res://assets/ui/watercolor-gameplay-icons.svg")
const SERIF = preload("res://assets/ui/album-serif-regular.otf")
const PAPER := Color(0.994, 0.993, 0.980)
const WELL := Color(0.953, 0.960, 0.940)
const INK := Color(0.20, 0.28, 0.26)
const SOFT := Color(0.36, 0.43, 0.40)
const RIM := Color(0.29, 0.39, 0.35, 0.15)
const WASH := Color(0.77, 0.85, 0.80, 0.34)
enum Mark { TRAYS, PIECES, REFERENCE, HINT, MORE, FIT, GRID, SHUFFLE,
 JOURNAL, SAVED, ADD, CLOSE, RENAME, GRIP, SELECT, UP, DOWN, DELETE,
 COLLAPSE, EXPAND, SEND, SCATTER, RETURN, CLEAR }
static var _theme: Theme
static var _compact_theme: Theme


static func icon(mark: int) -> AtlasTexture:
	var result := AtlasTexture.new()
	result.atlas = ATLAS
	result.region = Rect2((mark % 6) * 64, int(mark / 6) * 64, 64, 64)
	return result


static func surface(well := false, margin := 18.0) -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = WELL if well else PAPER
	box.border_color = RIM
	box.set_border_width_all(1)
	box.set_corner_radius_all(8 if well else 12)
	box.set_content_margin_all(margin)
	if not well:
		box.shadow_color = Color(0.25, 0.34, 0.29, 0.08)
		box.shadow_size = 5
		box.shadow_offset = Vector2(0, 3)
	return box


static func button_box(active := false) -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = WASH if active else Color.TRANSPARENT
	box.set_corner_radius_all(7)
	box.set_content_margin_all(12)
	return box


static func theme() -> Theme:
	if _theme != null:
		return _theme
	_theme = Theme.new()
	_theme.default_font_size = 24
	for kind in ["Label", "Button", "OptionButton", "LineEdit", "PopupMenu", "CheckButton"]:
		for state in ["font_color", "font_hover_color", "font_pressed_color", "font_hover_pressed_color", "font_focus_color"]:
			_theme.set_color(state, kind, INK)
		_theme.set_color("font_disabled_color", kind, Color(0.36, 0.43, 0.40, 0.45))
		_theme.set_color("font_outline_color", kind, Color.TRANSPARENT)
	for kind in ["Button", "OptionButton", "CheckButton"]:
		for state in ["normal", "disabled", "hover", "pressed", "hover_pressed", "focus"]:
			var box := button_box(state in ["hover", "pressed", "hover_pressed"])
			if state == "focus":
				box.border_color = RIM
				box.set_border_width_all(2)
			_theme.set_stylebox(state, kind, box)
		for state in ["icon_normal_color", "icon_hover_color", "icon_pressed_color", "icon_hover_pressed_color", "icon_focus_color"]:
			_theme.set_color(state, kind, INK)
		_theme.set_color("icon_disabled_color", kind, Color(0.36, 0.43, 0.40, 0.35))
		_theme.set_constant("h_separation", kind, 16)
		_theme.set_constant("icon_max_width", kind, 44)
	for state in ["normal", "read_only", "focus"]:
		var field := surface(true, 16)
		field.set_corner_radius_all(5)
		field.set_border_width_all(0)
		field.border_width_bottom = 2 if state == "focus" else 1
		field.border_color = SOFT if state == "focus" else RIM
		_theme.set_stylebox(state, "LineEdit", field)
	_theme.set_color("caret_color", "LineEdit", INK)
	_theme.set_color("selection_color", "LineEdit", WASH)
	_theme.set_color("font_selected_color", "LineEdit", INK)
	_theme.set_color("font_placeholder_color", "LineEdit", SOFT)
	_theme.set_stylebox("panel", "PanelContainer", surface())
	_theme.set_stylebox("panel", "PopupMenu", surface())
	_theme.set_stylebox("hover", "PopupMenu", button_box(true))
	_theme.set_constant("v_separation", "PopupMenu", 24)
	for kind in ["HScrollBar", "VScrollBar"]:
		var blank := Image.create(1, 1, false, Image.FORMAT_RGBA8)
		blank.fill(Color.TRANSPARENT)
		var blank_texture := ImageTexture.create_from_image(blank)
		var track := button_box()
		track.set_content_margin_all(3)
		_theme.set_stylebox("scroll", kind, track)
		for state in ["grabber", "grabber_highlight", "grabber_pressed"]:
			var grab := button_box(true)
			grab.set_content_margin_all(3)
			_theme.set_stylebox(state, kind, grab)
		for name in ["increment", "increment_highlight", "increment_pressed", "decrement", "decrement_highlight", "decrement_pressed"]:
			_theme.set_icon(name, kind, blank_texture)
	_theme.set_stylebox("panel", "TooltipPanel", surface())
	_theme.set_color("font_color", "TooltipLabel", INK)
	return _theme


static func apply_tree(node: Node, comfortable := true) -> void:
	if node is Node2D:
		return
	if node is Control:
		var control := node as Control
		var existing_font_size := control.get_theme_font_size("font_size")
		var existing_margins: Dictionary = {}
		if control is Button and not comfortable:
			for state in ["normal", "hover", "pressed", "hover_pressed", "disabled", "focus"]:
				var old := control.get_theme_stylebox(state)
				existing_margins[state] = Vector4(old.get_content_margin(SIDE_LEFT), old.get_content_margin(SIDE_TOP), old.get_content_margin(SIDE_RIGHT), old.get_content_margin(SIDE_BOTTOM))
		if not comfortable and _compact_theme == null:
			_compact_theme = theme().duplicate()
			_compact_theme.default_font_size = 16
		control.theme = theme() if comfortable else _compact_theme
		if control is Label or control is Button or control is LineEdit:
			control.modulate = Color.WHITE
			for name in ["font_color", "font_hover_color", "font_pressed_color", "font_hover_pressed_color", "font_disabled_color", "font_outline_color", "icon_normal_color", "icon_hover_color", "icon_pressed_color", "icon_hover_pressed_color"]:
				control.remove_theme_color_override(name)
			for name in ["normal", "hover", "pressed", "hover_pressed", "disabled", "focus", "read_only"]:
				control.remove_theme_stylebox_override(name)
			if comfortable:
				control.add_theme_font_size_override("font_size", 24)
			else:
				control.add_theme_font_size_override("font_size", existing_font_size)
		if control is PanelContainer:
			control.add_theme_stylebox_override("panel", surface(false, 18 if comfortable else 0))
		if control is Button:
			for state in existing_margins:
				var box := button_box(state in ["hover", "pressed", "hover_pressed"])
				var margins: Vector4 = existing_margins[state]
				box.content_margin_left = margins.x
				box.content_margin_top = margins.y
				box.content_margin_right = margins.z
				box.content_margin_bottom = margins.w
				control.add_theme_stylebox_override(state, box)
			control.add_theme_constant_override("icon_max_width", 44)
			if comfortable:
				control.custom_minimum_size.y = 88
				if control.icon != null and control.text.is_empty():
					control.custom_minimum_size.x = 88
			if control.tooltip_text.begins_with("Close"):
				mark_button(control, Mark.CLOSE)
			elif control.tooltip_text.begins_with("Delete"):
				mark_button(control, Mark.DELETE)
		if control is LineEdit and comfortable:
			control.custom_minimum_size.y = 88
	for child in node.get_children():
		apply_tree(child, comfortable)


static func mark_button(button: Button, mark: int) -> void:
	if button == null:
		return
	button.icon = icon(mark)
	button.modulate = Color.WHITE
	button.add_theme_color_override("icon_normal_color", INK)
	button.add_theme_color_override("icon_hover_color", INK)
	button.add_theme_color_override("icon_pressed_color", INK)
	button.add_theme_color_override("icon_hover_pressed_color", INK)
	button.add_theme_color_override("icon_disabled_color", Color(0.36, 0.43, 0.40, 0.35))
