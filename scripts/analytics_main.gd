class_name AnalyticsMain
extends "res://scripts/timelapse_video_export_main.gd"

var analytics = null
var _analytics_ready := false
var _analytics_last_orientation := ""


func _ready() -> void:
	super._ready()
	analytics = get_node_or_null("Analytics")
	_bind_analytics_event_sources()
	_analytics_ready = true
	var orientation := _analytics_orientation(get_viewport().get_visible_rect().size)
	_analytics_last_orientation = orientation
	_analytics_track("app_open", {"orientation": orientation})


func _layout_ui(viewport_size: Vector2) -> void:
	super._layout_ui(viewport_size)
	if not _analytics_ready:
		return
	var orientation := _analytics_orientation(viewport_size)
	if orientation == _analytics_last_orientation:
		return
	_analytics_last_orientation = orientation
	_analytics_track("orientation_changed", {
		"orientation": orientation,
		"piece_count": _analytics_piece_count(),
		"layout_mode": _analytics_workspace_layout_mode(),
	})


func _show_puzzle_selection(can_cancel: bool) -> void:
	super._show_puzzle_selection(can_cancel)
	if not _analytics_ready:
		return
	_analytics_track("gallery_impression", {
		"orientation": _analytics_orientation(get_viewport().get_visible_rect().size),
		"layout_mode": gallery_layout_mode() if has_method("gallery_layout_mode") else "unknown",
		"visible_count": _analytics_visible_gallery_count(),
		"category_filter": _analytics_selected_filter(gallery_category_filter, "all"),
		"status_filter": _analytics_selected_filter(gallery_status_filter, "all"),
	})


func _on_content_card_pressed(content_id: String) -> void:
	super._on_content_card_pressed(content_id)
	var properties := _analytics_content_properties(content_id)
	properties["gallery_status"] = _gallery_status_for(content_id) if has_method("_gallery_status_for") else "unknown"
	properties["layout_mode"] = gallery_layout_mode() if has_method("gallery_layout_mode") else "unknown"
	_analytics_track("image_click", properties)


func _on_favorite_pressed(content_id: String) -> void:
	super._on_favorite_pressed(content_id)
	var properties := _analytics_content_properties(content_id)
	properties["favorite"] = gallery_state.is_favorite(content_id)
	_analytics_track("favorite_changed", properties)


func _start_selected_puzzle() -> void:
	var requested_content := pending_content_id
	var requested_difficulty := _picker_selected_difficulty_id() if has_method("_picker_selected_difficulty_id") else ""
	super._start_selected_puzzle()
	if puzzle_selection_overlay == null or puzzle_selection_overlay.visible:
		return
	if board == null or str(board.active_content_id()) != requested_content:
		return
	var properties := _analytics_content_properties(requested_content)
	properties["game_id"] = _analytics_active_game_id()
	properties["difficulty_id"] = str(board.active_difficulty_id()) if board.has_method("active_difficulty_id") else requested_difficulty
	properties["piece_count"] = _analytics_piece_count()
	properties["orientation"] = _analytics_orientation(get_viewport().get_visible_rect().size)
	properties["layout_mode"] = _analytics_workspace_layout_mode()
	_analytics_track_once("puzzle_start", str(properties.get("game_id", "")), properties)


func _on_resume_game_pressed(game_id: String) -> void:
	await super._on_resume_game_pressed(game_id)
	if save_coordinator == null or not save_coordinator.has_method("active_game"):
		return
	if str(save_coordinator.active_game()) != game_id:
		return
	var properties := _analytics_active_runtime_properties()
	properties["game_id"] = game_id
	properties["progress_bucket"] = _analytics_progress_bucket(
		int(board.get("solved_count")) if board != null else 0,
		_analytics_piece_count()
	)
	_analytics_track("puzzle_resume", properties)


func _on_delete_game_pressed(game_id: String) -> void:
	var entry := _analytics_find_unfinished_entry(game_id)
	super._on_delete_game_pressed(game_id)
	if entry.is_empty() or _analytics_game_exists(game_id):
		return
	var properties := _analytics_saved_entry_properties(entry)
	properties["game_id"] = game_id
	properties["orientation"] = _analytics_orientation(get_viewport().get_visible_rect().size)
	_analytics_track("puzzle_abandon", properties)
	var metadata := _recommendation_metadata_for_saved_entry(entry)
	if not metadata.is_empty():
		recommendation_store.record_abandon(metadata, float(entry.get("progress", 0.0)))


func _on_difficulty_selected(index: int) -> void:
	if difficulty_select == null or index < 0 or index >= difficulty_select.get_item_count():
		return
	var requested_id := str(difficulty_select.get_item_metadata(index))
	var previous_id := str(board.active_difficulty_id()) if board != null else ""
	super._on_difficulty_selected(index)
	if board == null or requested_id == previous_id or str(board.active_difficulty_id()) != requested_id:
		return
	var properties := _analytics_active_runtime_properties()
	properties["difficulty_id"] = requested_id
	properties["piece_count"] = _analytics_piece_count()
	_analytics_track("difficulty_selected", properties)
	var game_id := _analytics_active_game_id()
	properties["game_id"] = game_id
	properties["orientation"] = _analytics_orientation(get_viewport().get_visible_rect().size)
	properties["layout_mode"] = _analytics_workspace_layout_mode()
	_analytics_track_once("puzzle_start", game_id, properties)


func _on_completed() -> void:
	super._on_completed()
	if save_coordinator == null or not save_coordinator.has_method("latest_completion_record"):
		return
	var record: Dictionary = save_coordinator.latest_completion_record()
	if record.is_empty():
		return
	var content_id := str(record.get("content_id", ""))
	var properties := _analytics_content_properties(content_id)
	var game_id := str(record.get("game_id", ""))
	properties["game_id"] = game_id
	properties["difficulty_id"] = str(record.get("difficulty_id", ""))
	properties["piece_count"] = int(record.get("piece_count", record.get("pieces_placed", 0)))
	properties["elapsed_seconds"] = int(record.get("elapsed_seconds", 0))
	properties["hint_assisted"] = int(record.get("hints_used", 0)) > 0
	properties["orientation"] = _analytics_orientation(get_viewport().get_visible_rect().size)
	properties["tray_count"] = _analytics_tray_count()
	properties["layout_mode"] = _analytics_workspace_layout_mode()
	_analytics_track_once("puzzle_complete", game_id, properties)


func analytics_contract_snapshot() -> Dictionary:
	var service = _analytics_service()
	if service == null or not service.has_method("contract_snapshot"):
		return {}
	return service.contract_snapshot()


func analytics_events_snapshot() -> Array:
	var service = _analytics_service()
	if service == null or not service.has_method("events_snapshot"):
		return []
	return service.events_snapshot()


func _bind_analytics_event_sources() -> void:
	var coordinator = get_node_or_null("SaveCoordinator")
	var hint_callable := Callable(self, "_on_analytics_hint_assist_recorded")
	if (
		coordinator != null
		and coordinator.has_signal("analytics_hint_assist_recorded")
		and not coordinator.is_connected("analytics_hint_assist_recorded", hint_callable)
	):
		coordinator.connect("analytics_hint_assist_recorded", hint_callable)

	var workspace = get_node_or_null("SortingWorkspace")
	if workspace == null:
		return
	var open_callable := Callable(self, "_on_analytics_sorting_table_opened")
	if workspace.has_signal("analytics_sorting_table_opened") and not workspace.is_connected("analytics_sorting_table_opened", open_callable):
		workspace.connect("analytics_sorting_table_opened", open_callable)
	var tray_callable := Callable(self, "_on_analytics_tray_created")
	if workspace.has_signal("analytics_tray_created") and not workspace.is_connected("analytics_tray_created", tray_callable):
		workspace.connect("analytics_tray_created", tray_callable)
	var moved_callable := Callable(self, "_on_analytics_piece_moved_to_tray")
	if workspace.has_signal("analytics_piece_moved_to_tray") and not workspace.is_connected("analytics_piece_moved_to_tray", moved_callable):
		workspace.connect("analytics_piece_moved_to_tray", moved_callable)


func _on_analytics_hint_assist_recorded(game_id: String) -> void:
	var properties := _analytics_active_runtime_properties()
	properties["game_id"] = game_id
	_analytics_track_once("hint_used", game_id, properties)
	if board != null and board.has_method("active_content_id") and board.has_method("content_metadata"):
		var content_id := str(board.active_content_id())
		var metadata: Dictionary = board.content_metadata(content_id)
		if not metadata.is_empty():
			recommendation_store.record_hint(
				metadata,
				str(board.active_difficulty_id()) if board.has_method("active_difficulty_id") else ""
			)


func _on_timelapse_replay_pressed() -> void:
	var previous_serial := int(timelapse_play_serial)
	super._on_timelapse_replay_pressed()
	if int(timelapse_play_serial) == previous_serial:
		return
	if save_coordinator == null or not save_coordinator.has_method("latest_completion_record"):
		return
	var record: Dictionary = save_coordinator.latest_completion_record()
	var content_id := str(record.get("content_id", ""))
	if content_id.is_empty() or board == null or not board.has_method("content_metadata"):
		return
	var metadata: Dictionary = board.content_metadata(content_id)
	if not metadata.is_empty():
		recommendation_store.record_replay(metadata)


func _on_analytics_sorting_table_opened(tray_count: int, piece_count: int) -> void:
	_analytics_track("sorting_table_opened", {
		"game_id": _analytics_active_game_id(),
		"tray_count": tray_count,
		"piece_count": piece_count,
		"orientation": _analytics_orientation(get_viewport().get_visible_rect().size),
	})


func _on_analytics_tray_created(tray_count: int, piece_count: int) -> void:
	_analytics_track("tray_created", {
		"game_id": _analytics_active_game_id(),
		"tray_count": tray_count,
		"piece_count": piece_count,
		"orientation": _analytics_orientation(get_viewport().get_visible_rect().size),
	})


func _on_analytics_piece_moved_to_tray(moved_piece_count: int, tray_count: int, piece_count: int) -> void:
	_analytics_track("piece_moved_to_tray", {
		"game_id": _analytics_active_game_id(),
		"tray_count": tray_count,
		"piece_count": piece_count,
		"moved_piece_count": moved_piece_count,
	})


func _analytics_track(event_name: String, properties: Dictionary = {}) -> Dictionary:
	var service = _analytics_service()
	if service == null or not service.has_method("track"):
		return {}
	return service.track(event_name, properties)


func _analytics_track_once(event_name: String, once_key: String, properties: Dictionary = {}) -> Dictionary:
	var service = _analytics_service()
	if service == null or not service.has_method("track_once"):
		return {}
	return service.track_once(event_name, once_key, properties)


func _analytics_service():
	if analytics == null:
		analytics = get_node_or_null("Analytics")
	return analytics


func _analytics_content_properties(content_id: String) -> Dictionary:
	var result := {"content_kind": "unknown"}
	if board == null or content_id.is_empty():
		return result
	var metadata: Dictionary = {}
	if board.has_method("content_metadata"):
		metadata = board.content_metadata(content_id)
	var is_private := (
		str(metadata.get("category", "")) == "my_photos"
		or str(metadata.get("license", "")) == "user_provided"
		or content_id.begins_with("local_photo:")
	)
	if is_private:
		result["content_kind"] = "puzzle_me"
		return result
	result["content_kind"] = "catalog"
	result["content_id"] = content_id
	var category := str(metadata.get("category", ""))
	if not category.is_empty():
		result["category"] = category
	return result


func _analytics_active_runtime_properties() -> Dictionary:
	var content_id := ""
	if board != null and board.has_method("active_content_id"):
		content_id = str(board.active_content_id())
	var result := _analytics_content_properties(content_id)
	if board != null and board.has_method("active_difficulty_id"):
		result["difficulty_id"] = str(board.active_difficulty_id())
	result["piece_count"] = _analytics_piece_count()
	result["orientation"] = _analytics_orientation(get_viewport().get_visible_rect().size)
	return result


func _analytics_saved_entry_properties(entry: Dictionary) -> Dictionary:
	var kind := "puzzle_me" if str(entry.get("content_source_kind", "")) == "local_photo" else "catalog"
	var piece_count := int(entry.get("piece_count", 0))
	var solved_count := int(entry.get("solved_count", 0))
	return {
		"content_kind": kind,
		"difficulty_id": str(entry.get("difficulty_id", "")),
		"piece_count": piece_count,
		"progress_bucket": _analytics_progress_bucket(solved_count, piece_count),
	}


func _recommendation_metadata_for_saved_entry(entry: Dictionary) -> Dictionary:
	if board == null or not board.has_method("content_presets"):
		return {}
	if str(entry.get("content_source_kind", "")) == "local_photo":
		return {}
	var source_id := str(entry.get("content_source_id", ""))
	if source_id.is_empty():
		return {}
	for entry_value in board.content_presets():
		if not (entry_value is Dictionary):
			continue
		var metadata: Dictionary = entry_value
		if str(metadata.get("source_id", "")) == source_id:
			return metadata.duplicate(true)
	return {}


func _analytics_piece_count() -> int:
	if board == null:
		return 0
	var pieces_value = board.get("pieces")
	return pieces_value.size() if pieces_value is Array else 0


func _analytics_active_game_id() -> String:
	if save_coordinator != null and save_coordinator.has_method("active_game"):
		return str(save_coordinator.active_game())
	return ""


func _analytics_find_unfinished_entry(game_id: String) -> Dictionary:
	if save_coordinator == null or not save_coordinator.has_method("list_unfinished_games"):
		return {}
	for entry_value in save_coordinator.list_unfinished_games():
		if entry_value is Dictionary and str(entry_value.get("game_id", "")) == game_id:
			return (entry_value as Dictionary).duplicate(true)
	return {}


func _analytics_game_exists(game_id: String) -> bool:
	return not _analytics_find_unfinished_entry(game_id).is_empty()


func _analytics_progress_bucket(solved_count: int, piece_count: int) -> String:
	if piece_count <= 0 or solved_count <= 0:
		return "0"
	if solved_count >= piece_count:
		return "100"
	var percent := int(floor(float(solved_count) / float(piece_count) * 100.0))
	if percent < 25:
		return "1-24"
	if percent < 50:
		return "25-49"
	if percent < 75:
		return "50-74"
	return "75-99"


func _analytics_orientation(viewport_size: Vector2) -> String:
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		return "unknown"
	if is_equal_approx(viewport_size.x, viewport_size.y):
		return "square"
	return "portrait" if viewport_size.y > viewport_size.x else "landscape"


func _analytics_visible_gallery_count() -> int:
	var count := 0
	for card_value in gallery_cards.values():
		if card_value is Control and (card_value as Control).visible:
			count += 1
	return count


func _analytics_selected_filter(button: OptionButton, fallback: String) -> String:
	if button == null or button.get_item_count() <= 0:
		return fallback
	return str(button.get_item_metadata(button.selected))


func _analytics_workspace_layout_mode() -> String:
	var workspace = get_node_or_null("SortingWorkspace")
	if workspace != null:
		var value = workspace.get("layout_mode")
		if value != null:
			var mode := str(value).to_lower()
			if mode.contains("rail"):
				return "side_rail"
			if mode.contains("scatter"):
				return "scatter"
	return "unknown"


func _analytics_tray_count() -> int:
	var workspace = get_node_or_null("SortingWorkspace")
	if workspace == null:
		return 0
	var state_value = workspace.get("state")
	if state_value != null and state_value.has_method("tray_ids"):
		var tray_ids = state_value.tray_ids()
		return tray_ids.size() if tray_ids is Array else 0
	return 0
