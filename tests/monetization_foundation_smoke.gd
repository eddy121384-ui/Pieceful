extends SceneTree

const MainScene = preload("res://main.tscn")
const MonetizationServiceScript = preload("res://scripts/monetization_service.gd")
const STATE_PATH := "user://pieceful_monetization_v1.json"


class FakeProvider:
	extends MonetizationProvider

	var ready := true
	var purchase_entitled := true
	var restore_entitled := true
	var show_count := 0
	var purchase_count := 0
	var restore_count := 0
	var perturb_audio := false

	func provider_name() -> String:
		return "fake"

	func supports_interstitials() -> bool:
		return true

	func supports_purchases() -> bool:
		return true

	func is_interstitial_ready() -> bool:
		return ready

	func show_interstitial(_placement: String) -> bool:
		if not ready:
			return false
		show_count += 1
		interstitial_started.emit()
		if perturb_audio and AudioServer.bus_count > 0:
			AudioServer.set_bus_volume_db(0, -42.0)
			AudioServer.set_bus_mute(0, true)
		interstitial_finished.emit()
		return true

	func purchase_remove_ads() -> Dictionary:
		purchase_count += 1
		return {
			"ok": purchase_entitled,
			"entitled": purchase_entitled,
			"reason": "purchased" if purchase_entitled else "failed",
		}

	func restore_remove_ads() -> Dictionary:
		restore_count += 1
		return {
			"ok": true,
			"entitled": restore_entitled,
			"reason": "restored" if restore_entitled else "not_found",
		}


class AsyncProvider:
	extends MonetizationProvider

	func provider_name() -> String:
		return "async_fake"

	func supports_purchases() -> bool:
		return true

	func purchase_remove_ads() -> Dictionary:
		return {"ok": true, "entitled": false, "reason": "pending"}

	func restore_remove_ads() -> Dictionary:
		return {"ok": true, "entitled": false, "reason": "pending"}

	func complete_purchase() -> void:
		remove_ads_entitlement_changed.emit(true)
		purchase_flow_finished.emit({"ok": true, "entitled": true, "reason": "purchased"})


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	_clear_state()

	var provider := FakeProvider.new()
	var service = MonetizationServiceScript.new(provider)

	# The core brand promise is structural: forced interstitials cannot run while
	# the puzzle session guard is active, even after many attempted break calls.
	service.begin_puzzle_session()
	for index in range(3):
		var blocked: Dictionary = service.request_natural_break("test_break", 1000 + index)
		if bool(blocked.get("shown", false)) or str(blocked.get("reason", "")) != "puzzle_session_active":
			_fail("interstitial escaped the active puzzle-session guard")
			return
	if provider.show_count != 0:
		_fail("provider was invoked during an active puzzle")
		return

	# Conservative natural-break gating: no ad on the first break, then show on
	# the second when the provider is ready.
	service.end_puzzle_session()
	var first: Dictionary = service.request_natural_break("completion_exit", 1100)
	if bool(first.get("shown", false)) or str(first.get("reason", "")) != "frequency_gate":
		_fail("first natural break was not frequency-gated")
		return
	var second: Dictionary = service.request_natural_break("completion_exit", 1101)
	if not bool(second.get("shown", false)) or provider.show_count != 1:
		_fail("second eligible natural break did not show one interstitial")
		return

	# Cooldown and hourly cap must be enforced independently of provider readiness.
	service.request_natural_break("completion_exit", 1102)
	var cooldown: Dictionary = service.request_natural_break("completion_exit", 1103)
	if str(cooldown.get("reason", "")) != "cooldown":
		_fail("interstitial cooldown was not enforced")
		return

	service.request_natural_break("completion_exit", 1402)
	if provider.show_count != 2:
		_fail("eligible post-cooldown break did not show the second interstitial")
		return
	service.request_natural_break("completion_exit", 1403)
	service.request_natural_break("completion_exit", 1703)
	if provider.show_count != 3:
		_fail("third conservative interstitial was not shown")
		return
	service.request_natural_break("completion_exit", 1704)
	var capped: Dictionary = service.request_natural_break("completion_exit", 2004)
	if str(capped.get("reason", "")) != "hour_cap" or provider.show_count != 3:
		_fail("hourly interstitial cap was not enforced")
		return

	# Remove Ads persists and suppresses every non-user-requested ad attempt.
	var purchase: Dictionary = service.purchase_remove_ads()
	if not bool(purchase.get("entitled", false)) or not service.remove_ads_entitled():
		_fail("Remove Ads purchase did not grant entitlement")
		return
	var after_purchase: Dictionary = service.request_natural_break("completion_exit", 6000)
	if str(after_purchase.get("reason", "")) != "remove_ads" or provider.show_count != 3:
		_fail("Remove Ads did not suppress forced interstitials")
		return
	var reloaded = MonetizationServiceScript.new(provider)
	if not reloaded.remove_ads_entitled():
		_fail("Remove Ads entitlement did not survive reload")
		return

	# Simulate reinstall/local-cache loss: platform restore re-grants entitlement.
	_clear_state()
	var restore_provider := FakeProvider.new()
	restore_provider.restore_entitled = true
	var restored = MonetizationServiceScript.new(restore_provider)
	var restore_result: Dictionary = restored.restore_purchases()
	if not bool(restore_result.get("entitled", false)) or not restored.remove_ads_entitled():
		_fail("restore purchases did not recover Remove Ads")
		return

	# Native store flows are asynchronous. A pending launch must not grant the
	# entitlement until the platform purchase callback confirms ownership.
	_clear_state()
	var async_provider := AsyncProvider.new()
	var async_service = MonetizationServiceScript.new(async_provider)
	var async_launch: Dictionary = async_service.purchase_remove_ads()
	if str(async_launch.get("reason", "")) != "pending" or async_service.remove_ads_entitled():
		_fail("async purchase granted entitlement before store confirmation")
		return
	async_provider.complete_purchase()
	if not async_service.remove_ads_entitled():
		_fail("async provider entitlement callback was not persisted")
		return

	# Ad availability failure is non-blocking and never changes puzzle flow state.
	_clear_state()
	var unavailable_provider := FakeProvider.new()
	unavailable_provider.ready = false
	var unavailable = MonetizationServiceScript.new(unavailable_provider)
	unavailable.end_puzzle_session()
	unavailable.request_natural_break("completion_exit", 7000)
	var failed: Dictionary = unavailable.request_natural_break("completion_exit", 7001)
	if bool(failed.get("shown", false)) or str(failed.get("reason", "")) != "not_ready":
		_fail("unavailable ad provider did not fail open")
		return

	# Product integration: controls exist, provider can be swapped behind the
	# contract, and ad audio focus restores exactly to its pre-ad bus state.
	_clear_state()
	var main = MainScene.instantiate()
	root.add_child(main)
	for _frame in range(18):
		await process_frame
	if not main.has_method("monetization_snapshot"):
		_fail("MonetizationMain is not active")
		return

	var ui_provider := FakeProvider.new()
	ui_provider.perturb_audio = true
	main.install_monetization_provider(ui_provider)
	var snapshot: Dictionary = main.monetization_snapshot()
	if not bool(snapshot.get("remove_button_exists", false)) or not bool(snapshot.get("restore_button_exists", false)):
		_fail("Remove Ads / Restore controls are missing")
		return

	main.monetization.end_puzzle_session()
	main.call("_request_break_ad", "completion_exit")
	var original_mute := AudioServer.is_bus_mute(0)
	var original_volume := AudioServer.get_bus_volume_db(0)
	main.call("_request_break_ad", "completion_exit")
	if ui_provider.show_count != 1:
		_fail("product natural-break hook did not invoke provider")
		return
	if AudioServer.is_bus_mute(0) != original_mute:
		_fail("audio mute state was not restored after interstitial")
		return
	if absf(AudioServer.get_bus_volume_db(0) - original_volume) > 0.001:
		_fail("audio volume was not restored after interstitial")
		return

	main.call("_on_remove_ads_pressed")
	snapshot = main.monetization_snapshot()
	var entitlement: Dictionary = snapshot.get("entitlement", {})
	if not bool(entitlement.get("remove_ads", false)):
		_fail("product Remove Ads action did not grant entitlement")
		return
	if not str(snapshot.get("ui_status", "")).contains("Ad-free"):
		_fail("product UI did not reflect Remove Ads entitlement")
		return

	main.queue_free()
	await process_frame
	_clear_state()
	print("PASS monetization_foundation_smoke")
	quit(0)


func _clear_state() -> void:
	if FileAccess.file_exists(STATE_PATH):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(STATE_PATH))


func _fail(message: String) -> void:
	push_error("FAIL monetization_foundation_smoke: %s" % message)
	_clear_state()
	quit(1)
