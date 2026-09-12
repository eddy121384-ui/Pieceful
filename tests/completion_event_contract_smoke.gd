extends SceneTree

const MainScene = preload("res://main.tscn")
const CompletionRecordScript = preload("res://scripts/completion_record_v1.gd")
const SAVE_DIR := "user://saves"
const LEGACY_SAVE := "user://pieceful_autosave_v1.json"
const GALLERY_STATE := "user://pieceful_gallery_state_v1.json"


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	_clear_test_state()

	var main = MainScene.instantiate()
	root.add_child(main)
	for _frame in range(12):
		await process_frame

	var coordinator = main.get_node_or_null("SaveCoordinator")
	var board = main.get_node_or_null("PuzzleBoard")
	if coordinator == null or board == null:
		_fail("completion runtime nodes missing")
		return
	if not coordinator.has_method("complete_active_game_once"):
		_fail("completion-aware save coordinator is not wired")
		return

	var game_id := str(coordinator.active_game())
	if game_id.is_empty():
		_fail("startup did not allocate a durable game id")
		return

	# Completion metrics are additive save metadata. Pin deterministic values, save,
	# rebuild the scene, and verify they survive the same browser-style resume path
	# used by the rest of Pieceful.
	coordinator.active_elapsed_seconds = 41.4
	coordinator.active_hints_used = 1
	if not coordinator.save_now(true):
		_fail("could not persist completion session metrics")
		return

	main.queue_free()
	await process_frame
	main = MainScene.instantiate()
	root.add_child(main)
	for _frame in range(12):
		await process_frame

	coordinator = main.get_node_or_null("SaveCoordinator")
	board = main.get_node_or_null("PuzzleBoard")
	if str(coordinator.active_game()) != game_id:
		_fail("completion session resume changed game identity")
		return
	var metrics: Dictionary = coordinator.completion_session_metrics()
	if float(metrics.get("elapsed_seconds", 0.0)) < 41.0:
		_fail("elapsed play time did not survive resume")
		return
	if int(metrics.get("hints_used", -1)) != 1:
		_fail("hint usage did not survive resume")
		return

	# A real target-region hint exposure must increment the completion metric. This
	# tests the board -> coordinator bridge instead of only mutating test state.
	var first_piece = board.pieces[0] if not board.pieces.is_empty() else null
	if first_piece == null:
		_fail("runtime has no piece available for hint instrumentation")
		return
	board.call("_show_hint_for_piece", first_piece)
	metrics = coordinator.completion_session_metrics()
	if int(metrics.get("hints_used", -1)) != 2:
		_fail("real hint exposure was not counted")
		return

	# Pin time before completion so the record value is deterministic enough for a
	# contract assertion while still allowing a few process frames of drift.
	coordinator.active_elapsed_seconds = 125.4
	var content_id := str(board.active_content_id())
	main.call("_on_completed")
	await process_frame

	var record: Dictionary = coordinator.latest_completion_record()
	if not CompletionRecordScript.structurally_valid(record):
		_fail("completion record is structurally invalid")
		return
	if str(record.get("game_id", "")) != game_id:
		_fail("completion record lost durable game identity")
		return
	if str(record.get("content_id", "")) != content_id:
		_fail("completion record content id mismatch")
		return
	if int(record.get("piece_count", 0)) != int(board.active_piece_count()):
		_fail("completion record piece count mismatch")
		return
	if int(record.get("elapsed_seconds", 0)) < 125:
		_fail("completion record elapsed time mismatch")
		return
	if int(record.get("hints_used", 0)) != 2 or bool(record.get("hint_free", true)):
		_fail("completion record hint facts mismatch")
		return
	if not str(coordinator.active_game()).is_empty():
		_fail("completed game still owns an active unfinished slot")
		return
	if not coordinator.list_unfinished_games().is_empty():
		_fail("completed game still appears in unfinished history")
		return

	var completion = main.gallery_state.completion_for(content_id)
	if int(completion.get("count", 0)) != 1:
		_fail("first completion did not update Gallery exactly once")
		return

	# Re-deliver the presentation callback. This is the core Issue #6 contract:
	# the same game id must never manufacture a second immutable completion fact.
	main.call("_on_completed")
	await process_frame
	completion = main.gallery_state.completion_for(content_id)
	if int(completion.get("count", 0)) != 1:
		_fail("duplicate completion callback incremented Gallery twice")
		return
	if not coordinator.complete_active_game_once().is_empty():
		_fail("completed game emitted a second completion record")
		return

	# Callers receive copies. Mutating a UI-facing dictionary must not rewrite the
	# immutable fact retained by the completion coordinator.
	var caller_copy: Dictionary = coordinator.latest_completion_record()
	caller_copy["elapsed_seconds"] = 999999
	if int(coordinator.latest_completion_record().get("elapsed_seconds", 0)) == 999999:
		_fail("completion record was mutable through a returned dictionary")
		return

	main.queue_free()
	await process_frame
	_clear_test_state()
	print("PASS completion_event_contract_smoke")
	quit(0)


func _clear_test_state() -> void:
	if FileAccess.file_exists(LEGACY_SAVE):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(LEGACY_SAVE))
	if FileAccess.file_exists(GALLERY_STATE):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(GALLERY_STATE))
	var dir := DirAccess.open(SAVE_DIR)
	if dir == null:
		return
	for filename in dir.get_files():
		DirAccess.remove_absolute(ProjectSettings.globalize_path(SAVE_DIR.path_join(filename)))


func _fail(message: String) -> void:
	push_error("FAIL completion_event_contract_smoke: %s" % message)
	quit(1)
