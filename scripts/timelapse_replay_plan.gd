class_name TimelapseReplayPlan
extends RefCounted

const MIN_DURATION_MS := 8000
const MAX_DURATION_MS := 15000


static func target_duration_ms(event_count: int) -> int:
	return clampi(8000 + maxi(0, event_count - 1) * 35, MIN_DURATION_MS, MAX_DURATION_MS)


static func event_weight(kind: String) -> float:
	match kind:
		"start":
			return 1.8
		"move":
			return 0.72
		"tray_in", "tray_out":
			return 1.05
		"tray_sort":
			return 0.82
		"merge":
			return 1.28
		"snap":
			return 1.55
		"complete":
			return 2.6
		_:
			return 1.0


static func build(trace: Dictionary) -> Dictionary:
	var events_value = trace.get("events", [])
	if not (events_value is Array) or events_value.is_empty():
		return {"duration_ms": 0, "steps": []}

	var events: Array = events_value
	var duration_ms := target_duration_ms(events.size())
	var total_weight := 0.0
	for event_value in events:
		if event_value is Dictionary:
			total_weight += event_weight(str(event_value.get("kind", "")))
	if total_weight <= 0.0:
		return {"duration_ms": 0, "steps": []}

	var steps: Array = []
	var cursor_ms := 0
	for index in range(events.size()):
		var event_value = events[index]
		if not (event_value is Dictionary):
			continue
		var event: Dictionary = event_value
		var weight := event_weight(str(event.get("kind", "")))
		var hold_ms := maxi(45, int(round(float(duration_ms) * weight / total_weight)))
		if index == events.size() - 1:
			hold_ms = maxi(45, duration_ms - cursor_ms)
		steps.append({
			"event": event.duplicate(true),
			"at_ms": cursor_ms,
			"hold_ms": hold_ms,
		})
		cursor_ms += hold_ms

	return {
		"duration_ms": cursor_ms,
		"steps": steps,
	}
