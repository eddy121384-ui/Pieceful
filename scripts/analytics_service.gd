class_name PiecefulAnalytics
extends Node

const Contract = preload("res://scripts/analytics_event_contract.gd")
const MAX_DEV_EVENTS := 500

signal event_recorded(event: Dictionary)

var remote_provider_enabled := false
var rejected_event_count := 0
var _dev_events: Array[Dictionary] = []
var _once_keys: Dictionary = {}


func track(event_name: String, properties: Dictionary = {}) -> Dictionary:
	var event := Contract.build_event(event_name, properties)
	if event.is_empty():
		rejected_event_count += 1
		return {}
	_append_dev_event(event)
	return event.duplicate(true)


func track_once(event_name: String, once_key: String, properties: Dictionary = {}) -> Dictionary:
	var key := "%s|%s" % [event_name, once_key]
	if once_key.is_empty() or _once_keys.has(key):
		return {}
	var event := track(event_name, properties)
	if event.is_empty():
		return {}
	_once_keys[key] = true
	return event


func events_snapshot() -> Array:
	return _dev_events.duplicate(true)


func clear_dev_events() -> void:
	_dev_events.clear()
	_once_keys.clear()
	rejected_event_count = 0


func contract_snapshot() -> Dictionary:
	return {
		"schema_version": Contract.SCHEMA_VERSION,
		"provider": "dev_only",
		"remote_provider_enabled": remote_provider_enabled,
		"event_count": _dev_events.size(),
		"rejected_event_count": rejected_event_count,
		"max_dev_events": MAX_DEV_EVENTS,
	}


func _append_dev_event(event: Dictionary) -> void:
	_dev_events.append(event.duplicate(true))
	while _dev_events.size() > MAX_DEV_EVENTS:
		_dev_events.pop_front()
	if OS.is_debug_build() or DisplayServer.get_name() == "headless":
		print("ANALYTICS_DEV %s" % JSON.stringify(event))
	event_recorded.emit(event.duplicate(true))
