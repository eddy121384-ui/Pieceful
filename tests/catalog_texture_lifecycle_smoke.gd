extends SceneTree

const Board = preload("res://scripts/puzzle_me_gallery_board.gd")


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	var board = Board.new()
	# Do not build gameplay here: isolate the board cache's ownership contract.
	var ids: Array = []
	for entry in board.content_presets():
		if str(entry.get("source_id", "")).begins_with("met:"):
			ids.append(str(entry["id"]))
	var previous: WeakRef = null
	for content_id in ids.slice(0, 8):
		if not board.select_content(content_id):
			_fail("catalog selection failed")
			return
		var texture: Texture2D = board.active_puzzle_texture()
		var current: WeakRef = weakref(texture)
		texture = null
		await process_frame
		if previous != null and previous.get_ref() != null:
			_fail("previous full artwork remains retained by board cache")
			return
		if board._texture_cache.size() != 1:
			_fail("builtin cache grew beyond the current full artwork")
			return
		previous = current
	# User photos have a different Gallery ownership/decode lifecycle.
	var photo := ImageTexture.create_from_image(Image.create(8, 8, false, Image.FORMAT_RGBA8))
	board._texture_cache["user://puzzle_me/fixture.png"] = photo
	board.select_content(ids[0])
	board.active_puzzle_texture()
	if not board._texture_cache.has("user://puzzle_me/fixture.png"):
		_fail("catalog eviction changed photo caching")
		return
	board.free()
	print("PASS catalog_texture_lifecycle_smoke")
	quit(0)


func _fail(message: String) -> void:
	push_error("FAIL catalog_texture_lifecycle_smoke: " + message)
	quit(1)
