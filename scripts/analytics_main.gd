class_name AnalyticsMain
extends "res://scripts/timelapse_video_export_main.gd"

var analytics = null
var _analytics_ready := false
var _analytics_last_orientation := ""


func _ready() -> void:
	super._ready()
	analytics = get_node_or_null("Analytics")
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
	_analytics_track_once("puzzle_start", properties["game_id"], properties)


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


func _analytics_piece_count() -> int:
	if board == null:
		return 0
	var pieces_value = board.get("pieces")
	return pieces_value.size() if pieces_value is Array else 0


func _analytics_active_game_id() -> String:
	if save_coordinator != null and save_coordinator.has_method("active_game"):
		return str(save_coordinator.active_game())
	return ""


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
	if state_value == null:
		return 0
	var trays_value = state_value.get("trays")
	return trays_value.size() if trays_value is Array else 0
