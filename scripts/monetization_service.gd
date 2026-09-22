class_name MonetizationService
extends RefCounted

signal entitlement_changed(entitled: bool)
signal purchase_flow_finished(result: Dictionary)
signal restore_flow_finished(result: Dictionary)

const STATE_VERSION := 1
const STATE_PATH := "user://pieceful_monetization_v1.json"
const INTERSTITIAL_COOLDOWN_SECONDS := 300
const MAX_INTERSTITIALS_PER_HOUR := 3
const NATURAL_BREAKS_PER_ATTEMPT := 2

var provider: MonetizationProvider
var state: Dictionary = _blank_state()
var puzzle_session_active := false


func _init(provider_override: MonetizationProvider = null) -> void:
	provider = provider_override if provider_override != null else MonetizationProvider.new()
	_load()
	_bind_provider()


func install_provider(new_provider: MonetizationProvider) -> void:
	_unbind_provider()
	provider = new_provider if new_provider != null else MonetizationProvider.new()
	_bind_provider()


func begin_puzzle_session() -> void:
	puzzle_session_active = true


func end_puzzle_session() -> void:
	puzzle_session_active = false


func remove_ads_entitled() -> bool:
	return bool(state.get("remove_ads", false))


func entitlement_snapshot() -> Dictionary:
	return {
		"remove_ads": remove_ads_entitled(),
		"provider": provider.provider_name(),
		"purchases_supported": provider.supports_purchases(),
	}


func policy_snapshot() -> Dictionary:
	return {
		"puzzle_session_active": puzzle_session_active,
		"cooldown_seconds": INTERSTITIAL_COOLDOWN_SECONDS,
		"max_per_hour": MAX_INTERSTITIALS_PER_HOUR,
		"natural_breaks_per_attempt": NATURAL_BREAKS_PER_ATTEMPT,
		"natural_breaks_since_ad": int(state.get("natural_breaks_since_ad", 0)),
		"last_interstitial_unix": int(state.get("last_interstitial_unix", 0)),
		"hour_window_count": int(state.get("hour_window_count", 0)),
	}


func request_natural_break(
	placement: String,
	now_unix: int = -1
) -> Dictionary:
	var now := int(Time.get_unix_time_from_system()) if now_unix < 0 else now_unix
	var result := {
		"shown": false,
		"placement": placement,
		"reason": "",
	}

	if placement.is_empty():
		result["reason"] = "invalid_placement"
		return result
	if puzzle_session_active:
		result["reason"] = "puzzle_session_active"
		return result
	if remove_ads_entitled():
		result["reason"] = "remove_ads"
		return result

	state["natural_breaks_since_ad"] = int(state.get("natural_breaks_since_ad", 0)) + 1
	_roll_hour_window(now)
	if int(state.get("natural_breaks_since_ad", 0)) < NATURAL_BREAKS_PER_ATTEMPT:
		_save()
		result["reason"] = "frequency_gate"
		return result

	var last := int(state.get("last_interstitial_unix", 0))
	if last > 0 and now - last < INTERSTITIAL_COOLDOWN_SECONDS:
		_save()
		result["reason"] = "cooldown"
		return result
	if int(state.get("hour_window_count", 0)) >= MAX_INTERSTITIALS_PER_HOUR:
		_save()
		result["reason"] = "hour_cap"
		return result
	if not provider.supports_interstitials():
		_save()
		result["reason"] = "provider_unavailable"
		return result
	if not provider.is_interstitial_ready():
		_save()
		result["reason"] = "not_ready"
		return result
	if not provider.show_interstitial(placement):
		_save()
		result["reason"] = "show_failed"
		return result

	state["natural_breaks_since_ad"] = 0
	state["last_interstitial_unix"] = now
	state["hour_window_count"] = int(state.get("hour_window_count", 0)) + 1
	_save()
	result["shown"] = true
	result["reason"] = "shown"
	return result


func purchase_remove_ads() -> Dictionary:
	if remove_ads_entitled():
		return {"ok": true, "entitled": true, "reason": "already_entitled"}
	if not provider.supports_purchases():
		return {"ok": false, "entitled": false, "reason": "not_supported"}
	var result := provider.purchase_remove_ads()
	if bool(result.get("ok", false)) and bool(result.get("entitled", false)):
		_grant_remove_ads()
	return result


func restore_purchases() -> Dictionary:
	if not provider.supports_purchases():
		return {"ok": false, "entitled": remove_ads_entitled(), "reason": "not_supported"}
	var result := provider.restore_remove_ads()
	if bool(result.get("ok", false)) and bool(result.get("entitled", false)):
		_grant_remove_ads()
	return result


func clear_local_cache_for_test() -> void:
	state = _blank_state()
	_save()
	entitlement_changed.emit(false)


func _grant_remove_ads() -> void:
	var changed := not bool(state.get("remove_ads", false))
	state["remove_ads"] = true
	state["natural_breaks_since_ad"] = 0
	_save()
	if changed:
		entitlement_changed.emit(true)


func _bind_provider() -> void:
	if provider == null:
		return
	var entitlement_cb := Callable(self, "_on_provider_entitlement_changed")
	var purchase_cb := Callable(self, "_on_provider_purchase_finished")
	var restore_cb := Callable(self, "_on_provider_restore_finished")
	if not provider.remove_ads_entitlement_changed.is_connected(entitlement_cb):
		provider.remove_ads_entitlement_changed.connect(entitlement_cb)
	if not provider.purchase_flow_finished.is_connected(purchase_cb):
		provider.purchase_flow_finished.connect(purchase_cb)
	if not provider.restore_flow_finished.is_connected(restore_cb):
		provider.restore_flow_finished.connect(restore_cb)


func _unbind_provider() -> void:
	if provider == null:
		return
	var entitlement_cb := Callable(self, "_on_provider_entitlement_changed")
	var purchase_cb := Callable(self, "_on_provider_purchase_finished")
	var restore_cb := Callable(self, "_on_provider_restore_finished")
	if provider.remove_ads_entitlement_changed.is_connected(entitlement_cb):
		provider.remove_ads_entitlement_changed.disconnect(entitlement_cb)
	if provider.purchase_flow_finished.is_connected(purchase_cb):
		provider.purchase_flow_finished.disconnect(purchase_cb)
	if provider.restore_flow_finished.is_connected(restore_cb):
		provider.restore_flow_finished.disconnect(restore_cb)


func _on_provider_entitlement_changed(entitled: bool) -> void:
	if entitled:
		_grant_remove_ads()


func _on_provider_purchase_finished(result: Dictionary) -> void:
	if bool(result.get("ok", false)) and bool(result.get("entitled", false)):
		_grant_remove_ads()
	purchase_flow_finished.emit(result)


func _on_provider_restore_finished(result: Dictionary) -> void:
	if bool(result.get("ok", false)) and bool(result.get("entitled", false)):
		_grant_remove_ads()
	restore_flow_finished.emit(result)


func _roll_hour_window(now: int) -> void:
	var start := int(state.get("hour_window_start_unix", 0))
	if start <= 0 or now < start or now - start >= 3600:
		state["hour_window_start_unix"] = now
		state["hour_window_count"] = 0


func _blank_state() -> Dictionary:
	return {
		"state_version": STATE_VERSION,
		"remove_ads": false,
		"natural_breaks_since_ad": 0,
		"last_interstitial_unix": 0,
		"hour_window_start_unix": 0,
		"hour_window_count": 0,
	}


func _load() -> void:
	state = _blank_state()
	if not FileAccess.file_exists(STATE_PATH):
		return
	var file := FileAccess.open(STATE_PATH, FileAccess.READ)
	if file == null:
		return
	var parsed = JSON.parse_string(file.get_as_text())
	file.close()
	if not (parsed is Dictionary):
		return
	if int(parsed.get("state_version", -1)) != STATE_VERSION:
		return
	state = parsed


func _save() -> bool:
	state["state_version"] = STATE_VERSION
	var file := FileAccess.open(STATE_PATH, FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(JSON.stringify(state, "  "))
	file.flush()
	file.close()
	return true
