class_name TimelapseTraceV1
extends RefCounted

const TRACE_VERSION := 1
const SPACE_ID := "workspace_normalized_v1"
const MAX_EVENTS := 2048
const ALLOWED_KINDS := {
	"start": true,
	"move": true,
	"tray_in": true,
	"tray_out": true,
	"tray_sort": true,
	"merge": true,
	"snap": true,
	"complete": true,
}


static func build_trace(game_id: String) -> Dictionary:
	return {
		"trace_version": TRACE_VERSION,
		"space": SPACE_ID,
		"game_id": game_id,
		"events": [],
	}


static func build_event(
	seq: int,
	kind: String,
	t_ms: int,
	piece_indexes: Array,
	payload: Dictionary = {}
) -> Dictionary:
	var ids: Array[int] = []
	for value in piece_indexes:
		var piece_index := int(value)
		if piece_index >= 0 and not ids.has(piece_index):
			ids.append(piece_index)
	ids.sort()
	return {
		"seq": maxi(0, seq),
		"kind": kind,
		"t_ms": maxi(0, t_ms),
		"piece_indexes": ids,
		"payload": payload.duplicate(true),
	}


static func structurally_valid(trace) -> bool:
	if not (trace is Dictionary):
		return false
	if int(trace.get("trace_version", -1)) != TRACE_VERSION:
		return false
	if str(trace.get("space", "")) != SPACE_ID:
		return false
	if str(trace.get("game_id", "")).is_empty():
		return false
	var events = trace.get("events", [])
	if not (events is Array):
		return false
	if events.size() > MAX_EVENTS:
		return false

	var expected_seq := 0
	var previous_t_ms := 0
	for event_value in events:
		if not (event_value is Dictionary):
			return false
		var event: Dictionary = event_value
		if int(event.get("seq", -1)) != expected_seq:
			return false
		var kind := str(event.get("kind", ""))
		if not ALLOWED_KINDS.has(kind):
			return false
		var t_ms := int(event.get("t_ms", -1))
		if t_ms < previous_t_ms:
			return false
		var piece_indexes = event.get("piece_indexes", [])
		if not (piece_indexes is Array):
			return false
		for piece_value in piece_indexes:
			if int(piece_value) < 0:
				return false
		if not (event.get("payload", {}) is Dictionary):
			return false
		expected_seq += 1
		previous_t_ms = t_ms
	return true
