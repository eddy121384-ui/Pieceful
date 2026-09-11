extends SceneTree

const PuzzleMeStoreScript = preload("res://scripts/puzzle_me_store.gd")
const REGISTRY_PATH := "user://pieceful_puzzle_me_v1.json"
const MEDIA_DIR := "user://puzzle_me"


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	_clear_test_state()
	var bytes := _portrait_png_bytes()
	if bytes.is_empty():
		_fail("could not create portrait fixture")
		return

	var store = PuzzleMeStoreScript.new()
	var first: Dictionary = store.import_image_bytes(bytes, "Family Portrait.jpg")
	if first.is_empty():
		_fail("first import failed: %s" % store.last_error)
		return
	if str(first.get("source_kind", "")) != "local_photo":
		_fail("source kind is not local_photo")
		return
	if str(first.get("label", "")) != "Family Portrait":
		_fail("filename label was not normalized")
		return
	if int(first.get("width", 0)) != 300 or int(first.get("height", 0)) != 500:
		_fail("stored dimensions changed unexpectedly")
		return
	var path := str(first.get("path", ""))
	if path.is_empty() or not FileAccess.file_exists(path):
		_fail("canonical local PNG was not written")
		return
	var digest := str(first.get("sha256", ""))
	if digest.length() != 64:
		_fail("stored SHA-256 is invalid")
		return

	var duplicate: Dictionary = store.import_image_bytes(bytes, "Same Photo Again.png")
	if str(duplicate.get("id", "")) != str(first.get("id", "")):
		_fail("duplicate import did not deduplicate by canonical bytes")
		return
	if store.entries().size() != 1:
		_fail("duplicate import created a second registry entry")
		return

	var reloaded = PuzzleMeStoreScript.new()
	if reloaded.entries().size() != 1:
		_fail("registry did not survive store reconstruction")
		return
	var restored := reloaded.entry(str(first.get("id", "")))
	if str(restored.get("source_id", "")) != str(first.get("source_id", "")):
		_fail("source identity changed after registry reload")
		return
	if not FileAccess.file_exists(str(restored.get("path", ""))):
		_fail("reloaded registry points to missing local media")
		return

	_clear_test_state()
	print("PASS puzzle_me_store_smoke")
	quit(0)


func _portrait_png_bytes() -> PackedByteArray:
	var image := Image.create(300, 500, false, Image.FORMAT_RGBA8)
	image.fill(Color(0.18, 0.34, 0.56, 1.0))
	return image.save_png_to_buffer()


func _clear_test_state() -> void:
	if FileAccess.file_exists(REGISTRY_PATH):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(REGISTRY_PATH))
	var dir := DirAccess.open(MEDIA_DIR)
	if dir != null:
		for filename in dir.get_files():
			DirAccess.remove_absolute(ProjectSettings.globalize_path(MEDIA_DIR.path_join(filename)))


func _fail(message: String) -> void:
	push_error("FAIL puzzle_me_store_smoke: %s" % message)
	quit(1)
