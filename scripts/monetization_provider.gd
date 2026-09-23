class_name MonetizationProvider
extends RefCounted

signal interstitial_started
signal interstitial_finished
signal remove_ads_entitlement_changed(entitled: bool)
signal purchase_flow_finished(result: Dictionary)
signal restore_flow_finished(result: Dictionary)

# Platform adapter contract. Web/headless intentionally behaves as unavailable:
# monetization failure must never block Pieceful's core puzzle flow.


func attach(_host: Node) -> void:
	pass


func poll() -> void:
	pass


func provider_name() -> String:
	return "unavailable"


func supports_interstitials() -> bool:
	return false


func supports_purchases() -> bool:
	return false


func is_interstitial_ready() -> bool:
	return false


func show_interstitial(_placement: String) -> bool:
	return false


func purchase_remove_ads() -> Dictionary:
	return {
		"ok": false,
		"entitled": false,
		"reason": "not_supported",
	}


func restore_remove_ads() -> Dictionary:
	return {
		"ok": false,
		"entitled": false,
		"reason": "not_supported",
	}
