class_name MonetizationMain
extends "res://scripts/analytics_main.gd"

const MonetizationServiceScript = preload("res://scripts/monetization_service.gd")
const NativeMobileMonetizationProviderScript = preload("res://scripts/native_mobile_monetization_provider.gd")

var monetization = MonetizationServiceScript.new()
var monetization_row: HBoxContainer = null
var monetization_status: Label = null
var remove_ads_button: Button = null
var restore_purchases_button: Button = null
var _ad_audio_snapshot: Array = []


func _ready() -> void:
	super._ready()
	var entitlement_cb := Callable(self, "_on_monetization_entitlement_changed")
	if not monetization.entitlement_changed.is_connected(entitlement_cb):
		monetization.entitlement_changed.connect(entitlement_cb)
	if OS.has_feature("android") or OS.has_feature("ios"):
		var native_provider = NativeMobileMonetizationProviderScript.new()
		native_provider.attach(self)
		install_monetization_provider(native_provider)
	else:
		_bind_monetization_provider()
	_install_monetization_controls()
	_refresh_monetization_controls()
	call_deferred("_sync_monetization_session_from_runtime")


func _process(_delta: float) -> void:
	if monetization != null and monetization.provider != null:
		monetization.provider.poll()


func install_monetization_provider(provider: MonetizationProvider) -> void:
	_unbind_monetization_provider()
	monetization.install_provider(provider)
	_bind_monetization_provider()
	_refresh_monetization_controls()


func monetization_snapshot() -> Dictionary:
	return {
		"entitlement": monetization.entitlement_snapshot(),
		"policy": monetization.policy_snapshot(),
		"ui_status": monetization_status.text if monetization_status != null else "",
		"remove_button_exists": remove_ads_button != null,
		"restore_button_exists": restore_purchases_button != null,
	}


func _start_selected_puzzle() -> void:
	var requested_content := pending_content_id
	super._start_selected_puzzle()
	if (
		puzzle_selection_overlay != null
		and not puzzle_selection_overlay.visible
		and board != null
		and str(board.active_content_id()) == requested_content
	):
		monetization.begin_puzzle_session()


func _on_resume_game_pressed(game_id: String) -> void:
	await super._on_resume_game_pressed(game_id)
	if (
		save_coordinator != null
		and save_coordinator.has_method("active_game")
		and str(save_coordinator.active_game()) == game_id
	):
		monetization.begin_puzzle_session()


func _on_completed() -> void:
	super._on_completed()
	monetization.end_puzzle_session()


func _on_completion_next_pressed() -> void:
	_request_break_ad("completion_browse")
	super._on_completion_next_pressed()


func _on_completion_recommendation_pressed(index: int) -> void:
	_request_break_ad("completion_more_like")
	super._on_completion_recommendation_pressed(index)


func _request_break_ad(placement: String) -> Dictionary:
	var result := monetization.request_natural_break(placement)
	_refresh_monetization_controls()
	return result


func _install_monetization_controls() -> void:
	if monetization_row != null or gallery_for_you_box == null:
		return
	monetization_row = HBoxContainer.new()
	monetization_row.name = "MonetizationRow"
	monetization_row.alignment = BoxContainer.ALIGNMENT_CENTER
	monetization_row.add_theme_constant_override("separation", 7)
	gallery_for_you_box.add_child(monetization_row)

	monetization_status = Label.new()
	monetization_status.name = "MonetizationStatus"
	monetization_status.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	monetization_status.add_theme_font_size_override("font_size", 11)
	monetization_status.modulate = Color(1.0, 1.0, 1.0, 0.48)
	monetization_row.add_child(monetization_status)

	remove_ads_button = Button.new()
	remove_ads_button.name = "RemoveAds"
	remove_ads_button.text = "Remove ads"
	remove_ads_button.custom_minimum_size = Vector2(94.0, 30.0)
	remove_ads_button.pressed.connect(_on_remove_ads_pressed)
	monetization_row.add_child(remove_ads_button)

	restore_purchases_button = Button.new()
	restore_purchases_button.name = "RestorePurchases"
	restore_purchases_button.text = "Restore"
	restore_purchases_button.custom_minimum_size = Vector2(76.0, 30.0)
	restore_purchases_button.pressed.connect(_on_restore_purchases_pressed)
	monetization_row.add_child(restore_purchases_button)


func _on_remove_ads_pressed() -> void:
	monetization.purchase_remove_ads()
	_refresh_monetization_controls()


func _on_restore_purchases_pressed() -> void:
	monetization.restore_purchases()
	_refresh_monetization_controls()


func _on_monetization_entitlement_changed(_entitled: bool) -> void:
	_refresh_monetization_controls()


func _refresh_monetization_controls() -> void:
	if monetization_status == null:
		return
	var entitlement := monetization.entitlement_snapshot()
	var entitled := bool(entitlement.get("remove_ads", false))
	var purchases_supported := bool(entitlement.get("purchases_supported", false))
	if entitled:
		monetization_status.text = "Ad-free · No forced ads"
	elif purchases_supported:
		monetization_status.text = "Free · Ads only between puzzles"
	else:
		monetization_status.text = "Preview · Ads only between puzzles"
	if remove_ads_button != null:
		remove_ads_button.visible = not entitled
		remove_ads_button.disabled = not purchases_supported
		remove_ads_button.tooltip_text = (
			"Remove forced ads permanently"
			if purchases_supported
			else "Available in the mobile store build"
		)
	if restore_purchases_button != null:
		restore_purchases_button.visible = not entitled
		restore_purchases_button.disabled = not purchases_supported
		restore_purchases_button.tooltip_text = (
			"Restore a previous Remove Ads purchase"
			if purchases_supported
			else "Available in the mobile store build"
		)


func _sync_monetization_session_from_runtime() -> void:
	if save_coordinator == null:
		return
	if (
		save_coordinator.has_method("needs_new_game_selection")
		and bool(save_coordinator.needs_new_game_selection())
	):
		monetization.end_puzzle_session()
		return
	if completion_panel != null and completion_panel.visible:
		monetization.end_puzzle_session()
		return
	if puzzle_selection_overlay != null and puzzle_selection_overlay.visible:
		monetization.end_puzzle_session()
		return
	if save_coordinator.has_method("has_active_game") and bool(save_coordinator.has_active_game()):
		monetization.begin_puzzle_session()


func _bind_monetization_provider() -> void:
	if monetization == null or monetization.provider == null:
		return
	var started := Callable(self, "_on_interstitial_started")
	var finished := Callable(self, "_on_interstitial_finished")
	if not monetization.provider.interstitial_started.is_connected(started):
		monetization.provider.interstitial_started.connect(started)
	if not monetization.provider.interstitial_finished.is_connected(finished):
		monetization.provider.interstitial_finished.connect(finished)


func _unbind_monetization_provider() -> void:
	if monetization == null or monetization.provider == null:
		return
	var started := Callable(self, "_on_interstitial_started")
	var finished := Callable(self, "_on_interstitial_finished")
	if monetization.provider.interstitial_started.is_connected(started):
		monetization.provider.interstitial_started.disconnect(started)
	if monetization.provider.interstitial_finished.is_connected(finished):
		monetization.provider.interstitial_finished.disconnect(finished)


func _on_interstitial_started() -> void:
	_ad_audio_snapshot.clear()
	for index in range(AudioServer.bus_count):
		_ad_audio_snapshot.append({
			"index": index,
			"mute": AudioServer.is_bus_mute(index),
			"volume_db": AudioServer.get_bus_volume_db(index),
		})
		AudioServer.set_bus_mute(index, true)


func _on_interstitial_finished() -> void:
	for row_value in _ad_audio_snapshot:
		if not (row_value is Dictionary):
			continue
		var row: Dictionary = row_value
		var index := int(row.get("index", -1))
		if index < 0 or index >= AudioServer.bus_count:
			continue
		AudioServer.set_bus_volume_db(index, float(row.get("volume_db", 0.0)))
		AudioServer.set_bus_mute(index, bool(row.get("mute", false)))
	_ad_audio_snapshot.clear()
