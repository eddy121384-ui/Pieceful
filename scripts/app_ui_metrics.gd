class_name AppUiMetrics
extends RefCounted

const TOP_MARGIN := 12.0
const SIDE_MARGIN := 18.0
const TOP_BAR_HEIGHT := 58.0
const TOP_BAR_MAX_WIDTH := 640.0

const DOCK_WIDTH := 440.0
const DOCK_HEIGHT := 74.0
const DOCK_BOTTOM_MARGIN := 18.0
const DOCK_BUTTON_Y := 7.0

# Album Desk keeps only four solving actions permanently visible.
const SLOT_SORT_X := 38.0
const SLOT_LAYOUT_X := 142.0
const SLOT_PREVIEW_X := 246.0
const SLOT_HINT_X := 350.0

# Legacy slots stay defined because inherited presentation code still lays these
# controls out before the commercial HUD hides them in the overflow hierarchy.
const SLOT_LINES_X := 246.0
const SLOT_FIT_X := 298.0
const SLOT_ZOOM_OUT_X := 298.0
const SLOT_ZOOM_LABEL_X := 346.0
const SLOT_ZOOM_IN_X := 394.0
const SLOT_RESHUFFLE_X := 394.0


static func safe_area_insets(viewport_size: Vector2) -> Vector4:
	# Web/Safari uses viewport-fit=cover, so read the real CSS safe-area values
	# and convert them into Godot logical canvas units. Headless/native builds use
	# the normal fixed margins below.
	if not OS.has_feature("web"):
		return Vector4.ZERO

	var raw = JavaScriptBridge.eval(
		"""(function(){
			var id='pieceful-safe-area-probe';
			var el=document.getElementById(id);
			if(!el){
				el=document.createElement('div');
				el.id=id;
				el.style.cssText='position:fixed;left:0;top:0;width:0;height:0;pointer-events:none;visibility:hidden;'
					+'padding-top:env(safe-area-inset-top);padding-right:env(safe-area-inset-right);'
					+'padding-bottom:env(safe-area-inset-bottom);padding-left:env(safe-area-inset-left);';
				document.body.appendChild(el);
			}
			var s=getComputedStyle(el);
			return [
				parseFloat(s.paddingLeft)||0,
				parseFloat(s.paddingTop)||0,
				parseFloat(s.paddingRight)||0,
				parseFloat(s.paddingBottom)||0,
				window.innerWidth||1,
				window.innerHeight||1
			].join(',');
		})()""",
		true
	)
	var parts := str(raw).split(",")
	if parts.size() != 6:
		return Vector4.ZERO

	var css_width := maxf(float(parts[4]), 1.0)
	var css_height := maxf(float(parts[5]), 1.0)
	var scale_x := viewport_size.x / css_width
	var scale_y := viewport_size.y / css_height
	return Vector4(
		float(parts[0]) * scale_x,
		float(parts[1]) * scale_y,
		float(parts[2]) * scale_x,
		float(parts[3]) * scale_y
	)


static func top_bar_rect(viewport_size: Vector2) -> Rect2:
	var safe := safe_area_insets(viewport_size)
	var available_width := maxf(
		1.0,
		viewport_size.x - SIDE_MARGIN * 2.0 - safe.x - safe.z
	)
	var width := minf(TOP_BAR_MAX_WIDTH, available_width)
	return Rect2(
		Vector2(
			safe.x + (viewport_size.x - safe.x - safe.z - width) * 0.5,
			safe.y + TOP_MARGIN
		),
		Vector2(width, TOP_BAR_HEIGHT)
	)


static func dock_rect(viewport_size: Vector2) -> Rect2:
	var safe := safe_area_insets(viewport_size)
	var available_width := maxf(
		1.0,
		viewport_size.x - SIDE_MARGIN * 2.0 - safe.x - safe.z
	)
	var width := minf(DOCK_WIDTH, available_width)
	return Rect2(
		Vector2(
			safe.x + (viewport_size.x - safe.x - safe.z - width) * 0.5,
			viewport_size.y - safe.w - DOCK_BOTTOM_MARGIN - DOCK_HEIGHT
		),
		Vector2(width, DOCK_HEIGHT)
	)


static func dock_slot_position(viewport_size: Vector2, slot_x: float) -> Vector2:
	var dock := dock_rect(viewport_size)
	return dock.position + Vector2(slot_x, DOCK_BUTTON_Y)
