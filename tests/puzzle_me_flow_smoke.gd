extends SceneTree

const MainScene = preload("res://main.tscn")
const SAVE_DIR := "user://saves"
const LEGACY_SAVE := "user://pieceful_autosave_v1.json"
const GALLERY_STATE := "user://pieceful_gallery_state_v1.json"
const PUZZLE_ME_REGISTRY := "user://pieceful_puzzle_me_v1.json"
const PUZZLE_ME_MEDIA := "user://puzzle_me"


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	_clear_test_state()

	var first = MainScene.instantiate()
	root.add_child(first)
	for _frame in range(24):
		await process_frame

	var first_board = first.get_node_or_null("PuzzleBoard")
	var first_coordinator = first.get_node_or_null("SaveCoordinator")
	if first_board == null or first_coordinator == null:
		_fail("first launch runtime nodes missing")
		return

	if str(first_board.call(
		"_display_label_for_local",
		{"label": "C2858233-A16A-4FAA-AE4C-D516250D8B48"}
	)) != "My Photo":
		_fail("iOS temporary UUID photo label leaked into player-facing copy")
		return
	if str(first_board.call(
		"_display_label_for_local",
		{"label": "IMG_7481"}
	)) != "IMG_7481":
		_fail("normal local photo label was unnecessarily replaced")
		return

	var bytes := _portrait_png_bytes()
	first.call("_prepare_puzzle_me_import", bytes, "My Taiwan Trip.jpg")
	for _frame in range(16):
		await process_frame
	if int(first.get("puzzle_me_import_count")) != 1:
		_fail("Puzzle Me import flow did not complete")
		return

	var content_id := str(first_board.active_content_id())
	if not content_id.begins_with("photo_"):
		_fail("imported local photo did not become active content")
		return
	var metadata: Dictionary = first_board.content_metadata(content_id)
	if str(metadata.get("source_kind", "")) != "local_photo":
		_fail("imported content is not marked local_photo")
		return
	if str(metadata.get("category", "")) != "my_photos":
		_fail("imported content is not surfaced in My Photos")
		return
	if not first.gallery_cards.has(content_id):
		_fail("imported photo did not get a Gallery card")
		return

	_select_picker_difficulty(first, "standard")
	first.call("_start_selected_puzzle")
	for _frame in range(12):
		await process_frame

	if str(first_board.active_difficulty_id()) != "standard":
		_fail("Puzzle Me did not start Standard difficulty")
		return
	var grid = first_board.active_grid_resolution()
	if not (grid is Dictionary) or int(grid.get("rows", 0)) <= int(grid.get("columns", 0)):
		_fail("portrait Puzzle Me image did not resolve to a portrait grid")
		return
	var identity: Dictionary = first_board.active_content_identity()
	if str(identity.get("source_kind", "")) != "local_photo":
		_fail("runtime content identity lost local_photo source kind")
		return
	if str(identity.get("sha256", "")).length() != 64:
		_fail("runtime local photo identity has invalid SHA-256")
		return

	if not first_coordinator.save_now(true):
		_fail("could not persist Puzzle Me save: %s" % first_coordinator.last_save_error)
		return
	var saved_game_id := str(first_coordinator.active_game())
	var saved_pattern_id := str(first_board.active_pattern_id())
	var saved_piece_count := int(first_board.active_piece_count())
	var saved_source_id := str(identity.get("source_id", ""))
	var saved_digest := str(identity.get("sha256", ""))
	if saved_game_id.is_empty() or saved_pattern_id.is_empty() or saved_piece_count <= 0:
		_fail("Puzzle Me save identity is incomplete")
		return

	first.queue_free()
	for _frame in range(5):
		await process_frame

	var second = MainScene.instantiate()
	root.add_child(second)
	var second_board = second.get_node_or_null("PuzzleBoard")
	var second_coordinator = second.get_node_or_null("SaveCoordinator")
	if second_board == null or second_coordinator == null:
		_fail("second launch runtime nodes missing")
		return
	for _frame in range(180):
		if not bool(second_coordinator.get("bootstrapping")):
			break
		await process_frame
	if bool(second_coordinator.get("bootstrapping")):
		_fail("Puzzle Me resume bootstrap did not finish")
		return
	for _frame in range(12):
		await process_frame

	if not bool(second_coordinator.get("resume_succeeded")):
		_fail("Puzzle Me save did not resume after App reconstruction")
		return
	if str(second_coordinator.active_game()) != saved_game_id:
		_fail("Puzzle Me resume changed active game id")
		return
	if str(second_board.active_content_id()) != content_id:
		_fail("Puzzle Me resume restored the wrong local content id")
		return
	if str(second_board.active_pattern_id()) != saved_pattern_id:
		_fail("Puzzle Me resume restored a different CutPattern")
		return
	if int(second_board.active_piece_count()) != saved_piece_count:
		_fail("Puzzle Me resume restored a different piece count")
		return
	var restored_identity: Dictionary = second_board.active_content_identity()
	if str(restored_identity.get("source_kind", "")) != "local_photo":
		_fail("restored identity lost local_photo source kind")
		return
	if str(restored_identity.get("source_id", "")) != saved_source_id:
		_fail("restored local photo source id changed")
		return
	if str(restored_identity.get("sha256", "")) != saved_digest:
		_fail("restored local photo bytes do not match saved fingerprint")
		return
	if not second.gallery_cards.has(content_id):
		_fail("persisted Puzzle Me photo is missing from Gallery after restart")
		return

	second.queue_free()
	await process_frame
	_clear_test_state()
	print("PASS puzzle_me_flow_smoke")
	quit(0)


func _portrait_png_bytes() -> PackedByteArray:
	var image := Image.create(300, 500, false, Image.FORMAT_RGBA8)
	image.fill(Color(0.34, 0.22, 0.42, 1.0))
	return image.save_png_to_buffer()


func _select_picker_difficulty(main, difficulty_id: String) -> void:
	var picker = main.puzzle_selection_difficulty
	if picker == null:
		return
	for index in range(picker.get_item_count()):
		if str(picker.get_item_metadata(index)) == difficulty_id:
			picker.select(index)
			return


func _clear_test_state() -> void:
	for path in [LEGACY_SAVE, GALLERY_STATE, PUZZLE_ME_REGISTRY]:
		if FileAccess.file_exists(path):
			DirAccess.remove_absolute(ProjectSettings.globalize_path(path))
	var save_dir := DirAccess.open(SAVE_DIR)
	if save_dir != null:
		for filename in save_dir.get_files():
			DirAccess.remove_absolute(ProjectSettings.globalize_path(SAVE_DIR.path_join(filename)))
	var media_dir := DirAccess.open(PUZZLE_ME_MEDIA)
	if media_dir != null:
		for filename in media_dir.get_files():
			DirAccess.remove_absolute(ProjectSettings.globalize_path(PUZZLE_ME_MEDIA.path_join(filename)))


func _fail(message: String) -> void:
	push_error("FAIL puzzle_me_flow_smoke: %s" % message)
	quit(1)
