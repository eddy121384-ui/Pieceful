extends "res://scripts/completion_event_save_coordinator.gd"

const TimelapseTraceV1Script = preload("res://scripts/timelapse_trace_v1.gd")


func record_timelapse_event(
	kind: String,
	piece_indexes: Array = [],
	payload: Dictionary = {},
	capture_positions: bool = false
) -> bool:
	# Timelapse events are driven by semantic gameplay callbacks (release, tray,
	# snap), not by the elapsed-time UI gate. A paused/covered presentation may
	# stop the clock, but if a real gameplay callback happens while a durable game
	# is alive we should keep the reconstruction trace intact.
	if bootstrapping or runtime_completed or active_game_id.is_empty():
		return false
	if not TimelapseTraceV1Script.ALLOWED_KINDS.has(kind) or kind == "start":
		return false
	if not ensure_timelapse_started():
		return false

	var events_value = active_timelapse_trace.get("events", [])
	if not (events_value is Array):
		return false
	var events: Array = events_value
	if events.size() >= TimelapseTraceV1Script.MAX_EVENTS:
		return false

	var event_payload: Dictionary = payload.duplicate(true)
	if capture_positions:
		event_payload["positions"] = _timelapse_positions_for(piece_indexes)
	var t_ms := maxi(0, int(round(active_elapsed_seconds * 1000.0)))
	if not events.is_empty():
		t_ms = maxi(t_ms, int(events[events.size() - 1].get("t_ms", 0)))
	events.append(TimelapseTraceV1Script.build_event(
		events.size(),
		kind,
		t_ms,
		piece_indexes,
		event_payload
	))
	active_timelapse_trace["events"] = events
	return true
