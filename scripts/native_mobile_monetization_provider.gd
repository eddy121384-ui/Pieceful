class_name NativeMobileMonetizationProvider
extends MonetizationProvider

const ADMOB_SCRIPT := "res://addons/AdmobPlugin/Admob.gd"
const REMOVE_ADS_SETTING := "monetization/remove_ads_product_id"
const REAL_ADS_SETTING := "monetization/use_real_ads"
const ANDROID_APP_ID_SETTING := "monetization/android_admob_application_id"
const ANDROID_INTERSTITIAL_ID_SETTING := "monetization/android_interstitial_ad_unit_id"
const IOS_APP_ID_SETTING := "monetization/ios_admob_application_id"
const IOS_INTERSTITIAL_ID_SETTING := "monetization/ios_interstitial_ad_unit_id"

const ANDROID_TEST_APP_ID := "ca-app-pub-3940256099942544~3347511713"
const IOS_TEST_APP_ID := "ca-app-pub-3940256099942544~1458002511"
const PURCHASE_STATE_PURCHASED := 1
const BILLING_OK := 0

var _host: Node = null
var _admob = null
var _billing = null
var _ios_store = null
var _billing_ready := false
var _product_details_ready := false
var _remove_ads_product_id := ""
var _restore_in_progress := false


func provider_name() -> String:
	if OS.has_feature("android"):
		return "android_admob_play_billing"
	if OS.has_feature("ios"):
		return "ios_admob_storekit"
	return "native_mobile_unavailable"


func attach(host: Node) -> void:
	_host = host
	_remove_ads_product_id = str(ProjectSettings.get_setting(REMOVE_ADS_SETTING, "remove_ads")).strip_edges()
	if not (OS.has_feature("android") or OS.has_feature("ios")):
		return
	_setup_admob()
	if OS.has_feature("android"):
		_setup_android_billing()
	elif OS.has_feature("ios"):
		_setup_ios_store()


func poll() -> void:
	if _ios_store == null:
		return
	while int(_ios_store.call("get_pending_event_count")) > 0:
		var event = _ios_store.call("pop_pending_event")
		if event is Dictionary:
			_process_ios_store_event(event)


func supports_interstitials() -> bool:
	return _admob != null


func supports_purchases() -> bool:
	if _remove_ads_product_id.is_empty():
		return false
	if OS.has_feature("android"):
		return _billing != null
	if OS.has_feature("ios"):
		return _ios_store != null
	return false


func is_interstitial_ready() -> bool:
	if _admob == null or not _admob.has_method("is_interstitial_ad_loaded"):
		return false
	return bool(_admob.call("is_interstitial_ad_loaded"))


func show_interstitial(_placement: String) -> bool:
	if not is_interstitial_ready():
		return false
	_admob.call("show_interstitial_ad")
	return true


func purchase_remove_ads() -> Dictionary:
	if not supports_purchases():
		return {"ok": false, "entitled": false, "reason": "not_supported"}

	if OS.has_feature("android"):
		if not _billing_ready:
			return {"ok": false, "entitled": false, "reason": "billing_not_ready"}
		if not _product_details_ready:
			_query_android_product()
			return {"ok": false, "entitled": false, "reason": "product_not_ready"}
		var result = _billing.call("purchase", _remove_ads_product_id, "", "", false)
		if not (result is Dictionary):
			return {"ok": false, "entitled": false, "reason": "launch_failed"}
		var response_code := int(result.get("response_code", -1))
		return {
			"ok": response_code == BILLING_OK,
			"entitled": false,
			"reason": "pending" if response_code == BILLING_OK else "launch_failed",
			"response_code": response_code,
		}

	if OS.has_feature("ios"):
		var result = _ios_store.call("purchase", {"product_id": _remove_ads_product_id})
		return {
			"ok": int(result) == OK,
			"entitled": false,
			"reason": "pending" if int(result) == OK else "launch_failed",
		}

	return {"ok": false, "entitled": false, "reason": "not_supported"}


func restore_remove_ads() -> Dictionary:
	if not supports_purchases():
		return {"ok": false, "entitled": false, "reason": "not_supported"}

	_restore_in_progress = true
	if OS.has_feature("android"):
		if not _billing_ready:
			return {"ok": false, "entitled": false, "reason": "billing_not_ready"}
		_billing.call("queryPurchases", "inapp", false)
		return {"ok": true, "entitled": false, "reason": "pending"}

	if OS.has_feature("ios"):
		var result = _ios_store.call("restore_purchases")
		return {
			"ok": int(result) == OK,
			"entitled": false,
			"reason": "pending" if int(result) == OK else "restore_failed",
		}

	return {"ok": false, "entitled": false, "reason": "not_supported"}


func _setup_admob() -> void:
	if _host == null or not ResourceLoader.exists(ADMOB_SCRIPT):
		return
	var script = load(ADMOB_SCRIPT)
	if script == null:
		return
	_admob = script.new()
	if not (_admob is Node):
		_admob = null
		return
	_admob.name = "Admob"
	_host.add_child(_admob)

	var use_real := bool(ProjectSettings.get_setting(REAL_ADS_SETTING, false))
	_admob.set("is_real", use_real)
	_admob.set("android_debug_application_id", ANDROID_TEST_APP_ID)
	_admob.set("ios_debug_application_id", IOS_TEST_APP_ID)
	if use_real:
		_admob.set(
			"android_real_application_id",
			str(ProjectSettings.get_setting(ANDROID_APP_ID_SETTING, ""))
		)
		_admob.set(
			"android_real_interstitial_id",
			str(ProjectSettings.get_setting(ANDROID_INTERSTITIAL_ID_SETTING, ""))
		)
		_admob.set(
			"ios_real_application_id",
			str(ProjectSettings.get_setting(IOS_APP_ID_SETTING, ""))
		)
		_admob.set(
			"ios_real_interstitial_id",
			str(ProjectSettings.get_setting(IOS_INTERSTITIAL_ID_SETTING, ""))
		)

	_connect_signal(_admob, "initialization_completed", _on_admob_initialized)
	_connect_signal(_admob, "interstitial_ad_showed_full_screen_content", _on_interstitial_showed)
	_connect_signal(_admob, "interstitial_ad_dismissed_full_screen_content", _on_interstitial_dismissed)
	_connect_signal(_admob, "interstitial_ad_failed_to_show_full_screen_content", _on_interstitial_failed_to_show)
	_connect_signal(_admob, "interstitial_ad_failed_to_load", _on_interstitial_failed_to_load)

	if _admob.has_method("initialize"):
		_admob.call("initialize")


func _on_admob_initialized(_status_data = null) -> void:
	_load_next_interstitial()


func _load_next_interstitial() -> void:
	if _admob != null and _admob.has_method("load_interstitial_ad"):
		_admob.call("load_interstitial_ad")


func _on_interstitial_showed(_ad_info = null) -> void:
	interstitial_started.emit()


func _on_interstitial_dismissed(_ad_info = null) -> void:
	interstitial_finished.emit()
	_load_next_interstitial()


func _on_interstitial_failed_to_show(_ad_info = null, _error_data = null) -> void:
	interstitial_finished.emit()
	_load_next_interstitial()


func _on_interstitial_failed_to_load(_ad_info = null, _error_data = null) -> void:
	# Failure is intentionally silent. The policy layer will fail open and the
	# plugin can be asked to load again at the next natural break/app lifecycle.
	pass


func _setup_android_billing() -> void:
	if not Engine.has_singleton("GodotGooglePlayBilling"):
		return
	_billing = Engine.get_singleton("GodotGooglePlayBilling")
	_billing.call("initPlugin")
	_connect_signal(_billing, "connected", _on_billing_connected)
	_connect_signal(_billing, "disconnected", _on_billing_disconnected)
	_connect_signal(_billing, "query_product_details_response", _on_product_details_response)
	_connect_signal(_billing, "query_purchases_response", _on_android_purchase_query)
	_connect_signal(_billing, "on_purchase_updated", _on_android_purchase_updated)
	_connect_signal(_billing, "acknowledge_purchase_response", _on_acknowledge_response)
	_billing.call("startConnection")


func _on_billing_connected() -> void:
	_billing_ready = true
	_query_android_product()
	_billing.call("queryPurchases", "inapp", false)


func _on_billing_disconnected() -> void:
	_billing_ready = false
	_product_details_ready = false


func _query_android_product() -> void:
	if _billing == null or not _billing_ready or _remove_ads_product_id.is_empty():
		return
	_billing.call("queryProductDetails", PackedStringArray([_remove_ads_product_id]), "inapp")


func _on_product_details_response(response: Dictionary) -> void:
	if int(response.get("response_code", -1)) != BILLING_OK:
		_product_details_ready = false
		return
	var details = response.get("product_details", [])
	_product_details_ready = details is Array and not details.is_empty()


func _on_android_purchase_query(response: Dictionary) -> void:
	var entitled := _process_android_purchases(response)
	if _restore_in_progress:
		restore_flow_finished.emit({
			"ok": int(response.get("response_code", -1)) == BILLING_OK,
			"entitled": entitled,
			"reason": "restored" if entitled else "not_found",
		})
		_restore_in_progress = false


func _on_android_purchase_updated(response: Dictionary) -> void:
	var entitled := _process_android_purchases(response)
	purchase_flow_finished.emit({
		"ok": int(response.get("response_code", -1)) == BILLING_OK,
		"entitled": entitled,
		"reason": "purchased" if entitled else "not_entitled",
	})


func _process_android_purchases(response: Dictionary) -> bool:
	if int(response.get("response_code", -1)) != BILLING_OK:
		return false
	var entitled := false
	var purchases = response.get("purchases", [])
	if not (purchases is Array):
		return false
	for purchase_value in purchases:
		if not (purchase_value is Dictionary):
			continue
		var purchase: Dictionary = purchase_value
		var product_ids = purchase.get("product_ids", [])
		if not (product_ids is Array) or not product_ids.has(_remove_ads_product_id):
			continue
		if int(purchase.get("purchase_state", -1)) != PURCHASE_STATE_PURCHASED:
			continue
		entitled = true
		remove_ads_entitlement_changed.emit(true)
		if not bool(purchase.get("is_acknowledged", false)):
			var token := str(purchase.get("purchase_token", ""))
			if not token.is_empty():
				_billing.call("acknowledgePurchase", token)
	return entitled


func _on_acknowledge_response(_response: Dictionary) -> void:
	pass


func _setup_ios_store() -> void:
	if not Engine.has_singleton("InAppStore"):
		return
	_ios_store = Engine.get_singleton("InAppStore")
	_ios_store.call("set_auto_finish_transaction", true)
	_ios_store.call("request_product_info", {
		"product_ids": [_remove_ads_product_id],
	})


func _process_ios_store_event(event: Dictionary) -> void:
	if str(event.get("result", "")) != "ok":
		return
	var event_type := str(event.get("type", ""))
	var product_id := str(event.get("product_id", ""))
	if event_type in ["purchase", "restore"] and product_id == _remove_ads_product_id:
		remove_ads_entitlement_changed.emit(true)
		var result := {"ok": true, "entitled": true, "reason": event_type}
		if event_type == "purchase":
			purchase_flow_finished.emit(result)
		else:
			restore_flow_finished.emit(result)
	elif event_type == "completed" and _restore_in_progress:
		restore_flow_finished.emit({"ok": true, "entitled": false, "reason": "not_found"})
		_restore_in_progress = false


func _connect_signal(target, signal_name: String, callback: Callable) -> void:
	if target == null or not target.has_signal(signal_name):
		return
	if not target.is_connected(signal_name, callback):
		target.connect(signal_name, callback)
