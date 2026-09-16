class_name AnalyticsEventContract
extends RefCounted

const SCHEMA_VERSION := 1

# Product analytics is intentionally allow-listed. Unknown events and unknown
# properties are rejected/dropped before any provider ever sees them.
const EVENT_PROPERTIES := {
	"app_open": ["orientation"],
	"gallery_impression": ["orientation", "layout_mode", "visible_count", "category_filter", "status_filter"],
	"image_click": ["content_id", "content_kind", "category", "gallery_status", "layout_mode"],
	"favorite_changed": ["content_id", "content_kind", "category", "favorite"],
	"puzzle_start": ["game_id", "content_id", "content_kind", "category", "difficulty_id", "piece_count", "orientation", "layout_mode"],
	"puzzle_resume": ["game_id", "content_id", "content_kind", "difficulty_id", "piece_count", "orientation", "progress_bucket"],
	"puzzle_complete": ["game_id", "content_id", "content_kind", "category", "difficulty_id", "piece_count", "elapsed_seconds", "hint_assisted", "orientation", "tray_count", "layout_mode"],
	"puzzle_abandon": ["game_id", "content_id", "content_kind", "difficulty_id", "piece_count", "progress_bucket", "elapsed_seconds", "orientation"],
	"difficulty_selected": ["content_id", "content_kind", "difficulty_id", "piece_count"],
	"hint_used": ["game_id", "content_kind", "difficulty_id", "piece_count"],
	"orientation_changed": ["orientation", "piece_count", "layout_mode"],
	"tray_created": ["game_id", "tray_count", "piece_count", "orientation"],
	"sorting_table_opened": ["game_id", "tray_count", "piece_count", "orientation"],
	"piece_moved_to_tray": ["game_id", "tray_count", "piece_count", "moved_piece_count"],
	"share_result": ["content_kind", "difficulty_id", "piece_count", "elapsed_seconds"],
	"timelapse_replay": ["content_kind", "difficulty_id", "piece_count", "event_count"],
	"timelapse_export": ["content_kind", "difficulty_id", "piece_count", "event_count"],
	"timelapse_share": ["content_kind", "difficulty_id", "piece_count"],
}

const PRIVATE_CONTENT_PREFIXES := [
	"local_photo:",
	"sha256:",
]

const ENUM_VALUES := {
	"content_kind": ["catalog", "puzzle_me", "unknown"],
	"orientation": ["portrait", "landscape", "square", "unknown"],
	"layout_mode": ["side_rail", "scatter", "portrait_grid", "wide_rail", "unknown"],
	"gallery_status": ["new", "continue", "completed", "unknown"],
	"progress_bucket": ["0", "1-24", "25-49", "50-74", "75-99", "100"],
}


static func event_supported(event_name: String) -> bool:
	return EVENT_PROPERTIES.has(event_name)


static func build_event(
	event_name: String,
	properties: Dictionary = {},
	occurred_at_unix_ms: int = -1
) -> Dictionary:
	if not event_supported(event_name):
		return {}
	var timestamp_ms := occurred_at_unix_ms
	if timestamp_ms < 0:
		timestamp_ms = int(Time.get_unix_time_from_system() * 1000.0)
	return {
		"schema_version": SCHEMA_VERSION,
		"name": event_name,
		"occurred_at_unix_ms": timestamp_ms,
		"properties": sanitize_properties(event_name, properties),
	}


static func sanitize_properties(event_name: String, properties: Dictionary) -> Dictionary:
	if not event_supported(event_name):
		return {}
	var result := {}
	var allowed_value = EVENT_PROPERTIES.get(event_name, [])
	if not (allowed_value is Array):
		return result
	var allowed: Array = allowed_value
	var private_content := _private_content(properties)
	for key_value in allowed:
		var key := str(key_value)
		if not properties.has(key):
			continue
		if key == "content_id" and private_content:
			continue
		var clean_value = _sanitize_value(key, properties.get(key))
		if clean_value != null:
			result[key] = clean_value
	return result


static func _private_content(properties: Dictionary) -> bool:
	if str(properties.get("content_kind", "")) == "puzzle_me":
		return true
	var content_id := str(properties.get("content_id", ""))
	for prefix_value in PRIVATE_CONTENT_PREFIXES:
		if content_id.begins_with(str(prefix_value)):
			return true
	return false


static func _sanitize_value(key: String, value):
	if ENUM_VALUES.has(key):
		var text := str(value).to_lower()
		var allowed_value = ENUM_VALUES.get(key, [])
		if allowed_value is Array and (allowed_value as Array).has(text):
			return text
		return "unknown" if (allowed_value as Array).has("unknown") else null

	if value is bool:
		return value
	if value is int:
		return maxi(0, int(value))
	if value is float:
		return maxf(0.0, float(value))
	if value is String or value is StringName:
		var text := str(value).strip_edges().replace("\n", " ").replace("\r", " ")
		if text.is_empty():
			return null
		# No free-form text belongs in analytics. Every string field in the
		# allow-list is an identifier/category controlled by the product.
		if text.length() > 96:
			text = text.substr(0, 96)
		return text
	return null
