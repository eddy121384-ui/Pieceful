extends SceneTree

const JournalStoreScript = preload("res://scripts/puzzle_journal_store.gd")
const CompletionRecordScript = preload("res://scripts/completion_record_v1.gd")
const JOURNAL_PATH := "user://pieceful_journal_v1.json"


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	_clear_journal()
	var store = JournalStoreScript.new()
	var now := int(Time.get_unix_time_from_system())
	var today_start := int(store.call("_local_day_start_unix", now))
	var test_now := today_start + 12 * 3600
	var first := _record("game_journal_a", today_start + 3600, 120, 0)
	var second := _record("game_journal_b", today_start + 7200, 240, 2)
	var old := _record("game_journal_old", today_start - 8 * 86400 + 3600, 90, 0)

	if not store.append_completion(first):
		_fail("could not append first completion")
		return
	if not store.last_append_added:
		_fail("first append was not reported as new")
		return

	var duplicate: Dictionary = first.duplicate(true)
	duplicate["elapsed_seconds"] = 99999
	if not store.append_completion(duplicate):
		_fail("duplicate append was not idempotent success")
		return
	if store.last_append_added:
		_fail("duplicate game id was reported as a new journal row")
		return
	if store.completion_count() != 1:
		_fail("duplicate game id created another journal row")
		return
	if int(store.completion_for_game("game_journal_a").get("elapsed_seconds", 0)) != 120:
		_fail("duplicate append rewrote immutable completion facts")
		return

	if not store.append_completion(second) or not store.append_completion(old):
		_fail("could not append additional journal fixtures")
		return
	if store.completion_count() != 3:
		_fail("journal fixture count mismatch")
		return

	store = JournalStoreScript.new()
	if store.completion_count() != 3:
		_fail("journal history did not survive reload")
		return
	var recent: Array = store.recent_completions(2)
	if recent.size() != 2:
		_fail("recent completion limit mismatch")
		return
	if str(recent[0].get("game_id", "")) != "game_journal_b":
		_fail("recent completion ordering is not newest-first")
		return

	var today: Dictionary = store.today_summary(test_now)
	if int(today.get("completion_count", 0)) != 2:
		_fail("today aggregate completion count mismatch")
		return
	if int(today.get("elapsed_seconds", 0)) != 360:
		_fail("today aggregate elapsed time mismatch")
		return
	if int(today.get("pieces_placed", 0)) != 80:
		_fail("today aggregate pieces placed mismatch")
		return
	if int(today.get("hint_free_count", 0)) != 1:
		_fail("today aggregate hint-free count mismatch")
		return

	var week: Dictionary = store.this_week_summary(test_now)
	if int(week.get("completion_count", 0)) < 2:
		_fail("week aggregate dropped today's completions")
		return
	if int(week.get("completion_count", 0)) > 2:
		_fail("week aggregate included an eight-day-old completion")
		return
	if int(week.get("elapsed_seconds", 0)) != 360:
		_fail("week aggregate elapsed time mismatch")
		return

	_clear_journal()
	print("PASS puzzle_journal_store_smoke")
	quit(0)


func _record(game_id: String, completed_at: int, elapsed: int, hints: int) -> Dictionary:
	return CompletionRecordScript.build(
		game_id,
		"garden",
		{
			"content_key": "builtin:garden",
			"source_kind": "builtin",
			"source_id": "garden",
			"sha256": "fixture",
		},
		"relaxed",
		"Classic_040_A",
		40,
		float(elapsed),
		hints,
		completed_at
	)


func _clear_journal() -> void:
	for suffix in ["", ".tmp", ".bak"]:
		var path: String = JOURNAL_PATH + str(suffix)
		if FileAccess.file_exists(path):
			DirAccess.remove_absolute(ProjectSettings.globalize_path(path))


func _fail(message: String) -> void:
	push_error("FAIL puzzle_journal_store_smoke: %s" % message)
	_clear_journal()
	quit(1)
