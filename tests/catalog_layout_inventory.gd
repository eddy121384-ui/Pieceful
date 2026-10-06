extends SceneTree

const Board = preload("res://scripts/puzzle_me_gallery_board.gd")


func _init() -> void:
	var board = Board.new()
	var rows: Array = []
	for entry in board.content_presets():
		rows.append({"content": str(entry["id"]), "presets": board.difficulty_presets_for_content(str(entry["id"]))})
	board.free()
	var output := OS.get_environment("PIECEFUL_LAYOUT_OUTPUT")
	if output.is_empty():
		quit(1)
		return
	var file := FileAccess.open(output, FileAccess.WRITE)
	file.store_string(JSON.stringify(rows, "\t"))
	file.close()
	print("PASS catalog_layout_inventory")
	quit(0)
