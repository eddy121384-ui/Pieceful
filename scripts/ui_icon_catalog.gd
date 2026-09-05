class_name UiIconCatalog
extends RefCounted

const ATLAS: Texture2D = preload("res://assets/ui/icon_atlas.svg")
const CELL_SIZE := Vector2(64.0, 64.0)

enum IconId {
	TRAY,
	ADD,
	BACK,
	RENAME,
	GRIP,
	ZOOM_OUT,
	ZOOM_IN,
	FIT,
	RESHUFFLE,
	PREVIEW_OFF,
	PREVIEW_FLOAT,
	PREVIEW_BOARD,
	HINT,
	GRID,
	REPLAY,
	CLOSE,
}


static func texture(icon_id: int) -> Texture2D:
	var column := icon_id % 4
	var row := icon_id / 4
	var atlas_texture := AtlasTexture.new()
	atlas_texture.atlas = ATLAS
	atlas_texture.region = Rect2(
		Vector2(float(column), float(row)) * CELL_SIZE,
		CELL_SIZE
	)
	return atlas_texture


static func apply_button(
	button: Button,
	icon_id: int,
	tooltip: String,
	button_size: Vector2 = Vector2(44.0, 44.0),
	icon_width: int = 22
) -> void:
	button.text = ""
	button.icon = texture(icon_id)
	button.expand_icon = true
	button.icon_max_width = icon_width
	button.size = button_size
	button.custom_minimum_size = button_size
	button.tooltip_text = tooltip
	button.focus_mode = Control.FOCUS_NONE
