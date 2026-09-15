class_name TimelapseVideoExportMain
extends "res://scripts/timelapse_replay_main.gd"

const TIMELAPSE_VIDEO_SIZE := Vector2i(1080, 1920)
const TIMELAPSE_VIDEO_FPS := 30
const TIMELAPSE_EXPORT_FINAL_HOLD_SECONDS := 0.8

var timelapse_export_button: Button = null
var timelapse_share_video_button: Button = null
var timelapse_export_brand: Label = null
var timelapse_export_title: Label = null
var timelapse_export_stats: Label = null
var timelapse_export_substats: Label = null
var timelapse_export_signature: Label = null

var timelapse_export_record: Dictionary = {}
var timelapse_export_payload: Dictionary = {}
var timelapse_export_state := "idle"
var timelapse_video_export_count := 0
var timelapse_export_capture_rect := Rect2()


func _ready() -> void:
	super._ready()
	_install_timelapse_export_actions()
	_build_timelapse_export_chrome()
	_layout_timelapse_export_actions(get_viewport().get_visible_rect().size)


func _on_completed() -> void:
	super._on_completed()
	if save_coordinator == null or not save_coordinator.has_method("latest_completion_record"):
		return
	var record: Dictionary = save_coordinator.latest_completion_record()
	if record.is_empty():
		return
	_prepare_timelapse_video_export(record)


func _layout_ui(viewport_size: Vector2) -> void:
	super._layout_ui(viewport_size)
	if timelapse_export_state == "recording":
		_apply_portrait_export_layout(viewport_size)
	else:
		_layout_timelapse_export_actions(viewport_size)


func timelapse_export_contract_snapshot() -> Dictionary:
	var probe_rect := timelapse_portrait_capture_rect(Vector2(1280.0, 720.0))
	return {
		"target_width": TIMELAPSE_VIDEO_SIZE.x,
		"target_height": TIMELAPSE_VIDEO_SIZE.y,
		"fps": TIMELAPSE_VIDEO_FPS,
		"capture_rect": probe_rect,
		"capture_aspect": probe_rect.size.x / maxf(probe_rect.size.y, 1.0),
		"export_button_exists": timelapse_export_button != null,
		"share_button_exists": timelapse_share_video_button != null,
		"explicit_only": true,
		"local_only": true,
		"state": timelapse_export_state,
		"export_count": timelapse_video_export_count,
	}


func timelapse_portrait_capture_rect(viewport_size: Vector2) -> Rect2:
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		return Rect2()
	var height := viewport_size.y
	var width := height * 9.0 / 16.0
	if width > viewport_size.x:
		width = viewport_size.x
		height = width * 16.0 / 9.0
	var size := Vector2(width, height)
	return Rect2((viewport_size - size) * 0.5, size)


func _install_timelapse_export_actions() -> void:
	if timelapse_overlay == null or timelapse_export_button != null:
		return

	timelapse_export_button = Button.new()
	timelapse_export_button.name = "TimelapseExportPortrait"
	timelapse_export_button.text = "Export 9:16"
	timelapse_export_button.custom_minimum_size = Vector2(156.0, 40.0)
	timelapse_export_button.disabled = true
	timelapse_export_button.pressed.connect(_on_timelapse_export_pressed)
	timelapse_overlay.add_child(timelapse_export_button)

	timelapse_share_video_button = Button.new()
	timelapse_share_video_button.name = "TimelapseShareVideo"
	timelapse_share_video_button.text = "Share video"
	timelapse_share_video_button.custom_minimum_size = Vector2(150.0, 40.0)
	timelapse_share_video_button.visible = false
	timelapse_share_video_button.pressed.connect(_on_timelapse_share_video_pressed)
	timelapse_overlay.add_child(timelapse_share_video_button)


func _build_timelapse_export_chrome() -> void:
	if timelapse_overlay == null or timelapse_export_brand != null:
		return

	timelapse_export_brand = Label.new()
	timelapse_export_brand.text = "Pieceful"
	timelapse_export_brand.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	timelapse_export_brand.add_theme_font_size_override("font_size", 13)
	timelapse_export_brand.modulate = Color(1.0, 1.0, 1.0, 0.42)
	timelapse_export_brand.visible = false
	timelapse_overlay.add_child(timelapse_export_brand)

	timelapse_export_title = Label.new()
	timelapse_export_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	timelapse_export_title.add_theme_font_size_override("font_size", 22)
	timelapse_export_title.modulate = Color(1.0, 1.0, 1.0, 0.94)
	timelapse_export_title.clip_text = true
	timelapse_export_title.visible = false
	timelapse_overlay.add_child(timelapse_export_title)

	timelapse_export_stats = Label.new()
	timelapse_export_stats.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	timelapse_export_stats.add_theme_font_size_override("font_size", 14)
	timelapse_export_stats.modulate = Color(1.0, 1.0, 1.0, 0.82)
	timelapse_export_stats.visible = false
	timelapse_overlay.add_child(timelapse_export_stats)

	timelapse_export_substats = Label.new()
	timelapse_export_substats.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	timelapse_export_substats.add_theme_font_size_override("font_size", 12)
	timelapse_export_substats.modulate = Color(1.0, 1.0, 1.0, 0.54)
	timelapse_export_substats.visible = false
	timelapse_overlay.add_child(timelapse_export_substats)

	timelapse_export_signature = Label.new()
	timelapse_export_signature.text = "Chaos → Order"
	timelapse_export_signature.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	timelapse_export_signature.add_theme_font_size_override("font_size", 11)
	timelapse_export_signature.modulate = Color(1.0, 1.0, 1.0, 0.34)
	timelapse_export_signature.visible = false
	timelapse_overlay.add_child(timelapse_export_signature)


func _prepare_timelapse_video_export(record: Dictionary) -> void:
	timelapse_export_record = record.duplicate(true)
	timelapse_export_payload = _share_card_payload_for_record(record)
	timelapse_export_state = "idle"
	if timelapse_share_video_button != null:
		timelapse_share_video_button.visible = false
	if timelapse_export_button == null:
		return
	var valid_trace := not timelapse_trace.is_empty() and _plan_step_count() >= 2
	var supported := _web_video_capture_supported()
	timelapse_export_button.disabled = not valid_trace or not supported
	timelapse_export_button.text = "Export 9:16"
	if not valid_trace:
		timelapse_export_button.tooltip_text = "Finish a puzzle with a recorded replay first"
	elif not supported:
		timelapse_export_button.tooltip_text = "This browser cannot record the portrait replay locally"
	else:
		timelapse_export_button.tooltip_text = "Record a local 1080×1920 timelapse video"


func _layout_timelapse_export_actions(viewport_size: Vector2) -> void:
	if timelapse_export_button != null:
		timelapse_export_button.position = Vector2(maxf(40.0, viewport_size.x - 362.0), maxf(20.0, viewport_size.y - 60.0))
		timelapse_export_button.size = Vector2(156.0, 40.0)
	if timelapse_share_video_button != null:
		timelapse_share_video_button.position = Vector2(maxf(40.0, viewport_size.x - 530.0), maxf(20.0, viewport_size.y - 60.0))
		timelapse_share_video_button.size = Vector2(150.0, 40.0)


func _apply_portrait_export_layout(viewport_size: Vector2) -> void:
	if timelapse_overlay == null or timelapse_stage == null:
		return
	timelapse_export_capture_rect = timelapse_portrait_capture_rect(viewport_size)
	var frame := timelapse_export_capture_rect
	timelapse_overlay.color = Color(0.018, 0.022, 0.03, 1.0)

	if timelapse_title != null:
		timelapse_title.visible = false
	if timelapse_footer != null:
		timelapse_footer.visible = false
	if timelapse_close_button != null:
		timelapse_close_button.visible = false
	if timelapse_again_button != null:
		timelapse_again_button.visible = false
	if timelapse_export_button != null:
		timelapse_export_button.visible = false
	if timelapse_share_video_button != null:
		timelapse_share_video_button.visible = false

	var title_text := str(timelapse_export_payload.get("artwork_label", "Puzzle"))
	var primary_text := str(timelapse_export_payload.get("primary", ""))
	var secondary_text := str(timelapse_export_payload.get("secondary", ""))

	timelapse_export_brand.text = "Pieceful"
	timelapse_export_brand.position = frame.position + Vector2(18.0, 18.0)
	timelapse_export_brand.size = Vector2(frame.size.x - 36.0, 22.0)
	timelapse_export_brand.visible = true

	timelapse_export_title.text = title_text
	timelapse_export_title.position = frame.position + Vector2(18.0, 43.0)
	timelapse_export_title.size = Vector2(frame.size.x - 36.0, 34.0)
	timelapse_export_title.visible = true

	timelapse_phase.position = frame.position + Vector2(18.0, 77.0)
	timelapse_phase.size = Vector2(frame.size.x - 36.0, 26.0)
	timelapse_phase.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	timelapse_phase.visible = true

	var stage_position := frame.position + Vector2(16.0, 112.0)
	var stage_size := Vector2(frame.size.x - 32.0, maxf(330.0, frame.size.y - 262.0))
	timelapse_stage.position = stage_position
	timelapse_stage.size = stage_size

	var inner := Rect2(Vector2(12.0, 12.0), stage_size - Vector2(24.0, 24.0))
	var tray_height := clampf(inner.size.y * 0.21, 72.0, 98.0)
	var workspace_bounds := Rect2(
		inner.position,
		Vector2(inner.size.x, maxf(180.0, inner.size.y - tray_height - 10.0))
	)
	timelapse_tray_rect = Rect2(
		Vector2(inner.position.x, workspace_bounds.end.y + 10.0),
		Vector2(inner.size.x, tray_height)
	)

	var navigation_size := Vector2(1280.0, 720.0)
	if board != null and board.has_method("navigation_bounds"):
		navigation_size = Vector2(board.navigation_bounds().size)
	timelapse_workspace_rect = _contain_rect(navigation_size, workspace_bounds)
	timelapse_workspace_scale = minf(
		timelapse_workspace_rect.size.x / maxf(navigation_size.x, 1.0),
		timelapse_workspace_rect.size.y / maxf(navigation_size.y, 1.0)
	)
	timelapse_tray_scale = timelapse_workspace_scale * 0.52

	timelapse_tray_panel.position = timelapse_tray_rect.position
	timelapse_tray_panel.size = timelapse_tray_rect.size
	timelapse_tray_label.position = Vector2.ZERO
	timelapse_tray_label.size = Vector2(timelapse_tray_rect.size.x, 20.0)

	var info_y := stage_position.y + stage_size.y + 14.0
	timelapse_export_stats.text = primary_text
	timelapse_export_stats.position = Vector2(frame.position.x + 18.0, info_y)
	timelapse_export_stats.size = Vector2(frame.size.x - 36.0, 24.0)
	timelapse_export_stats.visible = true

	timelapse_export_substats.text = secondary_text
	timelapse_export_substats.position = Vector2(frame.position.x + 18.0, info_y + 26.0)
	timelapse_export_substats.size = Vector2(frame.size.x - 36.0, 22.0)
	timelapse_export_substats.visible = true

	timelapse_export_signature.position = Vector2(frame.position.x + 18.0, frame.end.y - 30.0)
	timelapse_export_signature.size = Vector2(frame.size.x - 36.0, 18.0)
	timelapse_export_signature.visible = true


func _restore_standard_replay_layout() -> void:
	if timelapse_overlay == null:
		return
	timelapse_overlay.color = Color(0.008, 0.01, 0.014, 0.965)
	if timelapse_export_brand != null:
		timelapse_export_brand.visible = false
	if timelapse_export_title != null:
		timelapse_export_title.visible = false
	if timelapse_export_stats != null:
		timelapse_export_stats.visible = false
	if timelapse_export_substats != null:
		timelapse_export_substats.visible = false
	if timelapse_export_signature != null:
		timelapse_export_signature.visible = false
	if timelapse_title != null:
		timelapse_title.text = "Timelapse Lab"
		timelapse_title.visible = true
	if timelapse_phase != null:
		timelapse_phase.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
		timelapse_phase.visible = true
	if timelapse_footer != null:
		timelapse_footer.visible = true
	if timelapse_close_button != null:
		timelapse_close_button.visible = true
		timelapse_close_button.disabled = false
	if timelapse_again_button != null:
		timelapse_again_button.visible = true
	if timelapse_export_button != null:
		timelapse_export_button.visible = true
		timelapse_export_button.disabled = timelapse_export_state == "recording" or not _web_video_capture_supported()
	if timelapse_share_video_button != null:
		timelapse_share_video_button.visible = timelapse_export_state == "ready"

	var viewport_size := get_viewport().get_visible_rect().size
	super._layout_timelapse_overlay(viewport_size)
	_layout_timelapse_export_actions(viewport_size)
	_build_replay_piece_visuals()

	if timelapse_export_state == "ready":
		timelapse_phase.text = "Video ready"
		timelapse_footer.text = "1080×1920 · local video · ready to share"
		timelapse_export_button.text = "Export again"
	elif timelapse_export_state == "error":
		timelapse_phase.text = "Export unavailable"
		timelapse_footer.text = "This browser could not finish the local video recording"
		timelapse_export_button.text = "Try export again"


func _on_timelapse_export_pressed() -> void:
	if timelapse_export_state == "recording":
		return
	if timelapse_trace.is_empty() or _plan_step_count() < 2:
		return
	if not _web_video_capture_supported():
		timelapse_export_state = "error"
		_restore_standard_replay_layout()
		return

	timelapse_video_export_count += 1
	timelapse_export_state = "recording"
	timelapse_play_serial += 1
	var serial := timelapse_play_serial

	timelapse_overlay.visible = true
	timelapse_overlay.move_to_front()
	_apply_portrait_export_layout(get_viewport().get_visible_rect().size)
	_build_replay_piece_visuals()
	if timelapse_piece_visuals.is_empty():
		timelapse_export_state = "error"
		_restore_standard_replay_layout()
		return

	timelapse_phase.text = "Chaos"
	await get_tree().process_frame
	await RenderingServer.frame_post_draw

	var viewport_size := get_viewport().get_visible_rect().size
	var started := _start_web_video_capture(timelapse_export_capture_rect, viewport_size)
	if not started:
		timelapse_export_state = "error"
		_restore_standard_replay_layout()
		return

	await _run_timelapse_replay(timelapse_plan.duplicate(true), serial)
	if serial != timelapse_play_serial or timelapse_export_state != "recording":
		_cancel_web_video_capture()
		return

	await get_tree().create_timer(TIMELAPSE_EXPORT_FINAL_HOLD_SECONDS).timeout
	_stop_web_video_capture()
	var ready := await _wait_for_web_video_ready()
	timelapse_export_state = "ready" if ready else "error"
	_restore_standard_replay_layout()


func _close_timelapse_replay() -> void:
	if timelapse_export_state == "recording":
		timelapse_export_state = "idle"
		_cancel_web_video_capture()
	super._close_timelapse_replay()


func _on_timelapse_share_video_pressed() -> void:
	if timelapse_export_state != "ready" or not OS.has_feature("web"):
		return
	_share_timelapse_video_on_web()


func _web_video_capture_supported() -> bool:
	if not OS.has_feature("web"):
		return false
	var result = JavaScriptBridge.eval("""
(() => {
  const canvas = document.getElementById('canvas') || document.querySelector('canvas');
  return !!(canvas && window.MediaRecorder && HTMLCanvasElement.prototype.captureStream);
})()
""", true)
	return bool(result)


func _start_web_video_capture(crop: Rect2, logical_viewport_size: Vector2) -> bool:
	if not OS.has_feature("web"):
		return false
	var filename_base := str(timelapse_export_payload.get("filename", "pieceful-puzzle.png")).trim_suffix(".png")
	var share_text := str(timelapse_export_payload.get("share_text", "Puzzle complete"))
	var js := """
(() => {
  try {
    const source = document.getElementById('canvas') || document.querySelector('canvas');
    if (!source || !window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return 'unsupported';
    const old = window.__piecefulTimelapseExport;
    if (old && old.helper && old.helper.remove) old.helper.remove();

    const helper = document.createElement('canvas');
    helper.width = %d;
    helper.height = %d;
    helper.setAttribute('aria-hidden', 'true');
    Object.assign(helper.style, {
      position: 'fixed', left: '-4px', top: '-4px', width: '1px', height: '1px',
      opacity: '0.001', pointerEvents: 'none', zIndex: '-1'
    });
    document.body.appendChild(helper);
    const ctx = helper.getContext('2d', { alpha: false });
    if (!ctx) { helper.remove(); return 'no-2d-context'; }

    const candidates = [
      'video/mp4;codecs=avc1.42E01E',
      'video/mp4',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ];
    let requestedMime = '';
    if (typeof MediaRecorder.isTypeSupported === 'function') {
      requestedMime = candidates.find((value) => MediaRecorder.isTypeSupported(value)) || '';
    }

    const stream = helper.captureStream(%d);
    let recorder;
    try {
      recorder = requestedMime
        ? new MediaRecorder(stream, { mimeType: requestedMime, videoBitsPerSecond: 8000000 })
        : new MediaRecorder(stream, { videoBitsPerSecond: 8000000 });
    } catch (_) {
      recorder = new MediaRecorder(stream);
    }

    const state = {
      status: 'recording', active: true, helper, stream, recorder, chunks: [], blob: null,
      mime: recorder.mimeType || requestedMime || 'video/webm', extension: 'webm',
      filenameBase: %s, shareText: %s
    };
    state.extension = state.mime.indexOf('mp4') >= 0 ? 'mp4' : 'webm';
    window.__piecefulTimelapseExport = state;

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) state.chunks.push(event.data);
    };
    recorder.onerror = () => { state.status = 'error'; state.active = false; };
    recorder.onstop = () => {
      state.active = false;
      state.blob = new Blob(state.chunks, { type: state.mime });
      state.status = state.blob.size > 0 ? 'ready' : 'error';
      if (state.stream) state.stream.getTracks().forEach((track) => track.stop());
      if (state.helper && state.helper.remove) state.helper.remove();
    };

    const logicalWidth = Math.max(%f, 1);
    const logicalHeight = Math.max(%f, 1);
    const cropX = %f;
    const cropY = %f;
    const cropW = %f;
    const cropH = %f;
    const draw = () => {
      if (!state.active) return;
      const scaleX = source.width / logicalWidth;
      const scaleY = source.height / logicalHeight;
      ctx.fillStyle = '#111419';
      ctx.fillRect(0, 0, helper.width, helper.height);
      ctx.drawImage(
        source,
        cropX * scaleX, cropY * scaleY, cropW * scaleX, cropH * scaleY,
        0, 0, helper.width, helper.height
      );
      requestAnimationFrame(draw);
    };

    draw();
    recorder.start(100);
    return 'ok';
  } catch (error) {
    window.__piecefulTimelapseExport = { status: 'error', error: String(error) };
    return 'error';
  }
})()
""" % [
		TIMELAPSE_VIDEO_SIZE.x,
		TIMELAPSE_VIDEO_SIZE.y,
		TIMELAPSE_VIDEO_FPS,
		JSON.stringify(filename_base),
		JSON.stringify(share_text),
		logical_viewport_size.x,
		logical_viewport_size.y,
		crop.position.x,
		crop.position.y,
		crop.size.x,
		crop.size.y,
	]
	return str(JavaScriptBridge.eval(js, true)) == "ok"


func _stop_web_video_capture() -> void:
	if not OS.has_feature("web"):
		return
	JavaScriptBridge.eval("""
(() => {
  const state = window.__piecefulTimelapseExport;
  if (!state) return;
  state.active = false;
  if (state.recorder && state.recorder.state !== 'inactive') state.recorder.stop();
})()
""", true)


func _cancel_web_video_capture() -> void:
	if not OS.has_feature("web"):
		return
	JavaScriptBridge.eval("""
(() => {
  const state = window.__piecefulTimelapseExport;
  if (!state) return;
  state.status = 'cancelled';
  state.active = false;
  if (state.recorder && state.recorder.state !== 'inactive') state.recorder.stop();
  if (state.stream) state.stream.getTracks().forEach((track) => track.stop());
  if (state.helper && state.helper.remove) state.helper.remove();
})()
""", true)


func _wait_for_web_video_ready() -> bool:
	if not OS.has_feature("web"):
		return false
	for _attempt in range(60):
		var status := str(JavaScriptBridge.eval("window.__piecefulTimelapseExport ? window.__piecefulTimelapseExport.status : 'missing'", true))
		if status == "ready":
			return true
		if status == "error" or status == "cancelled" or status == "missing":
			return false
		await get_tree().create_timer(0.1).timeout
	return false


func _share_timelapse_video_on_web() -> void:
	var js := """
(() => {
  const state = window.__piecefulTimelapseExport;
  if (!state || state.status !== 'ready' || !state.blob) return 'missing';
  const filename = `${state.filenameBase}-timelapse.${state.extension || 'webm'}`;
  const file = new File([state.blob], filename, { type: state.mime || state.blob.type || 'video/webm' });
  const fallback = () => {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  const data = { files: [file], title: 'Pieceful timelapse', text: state.shareText || 'Puzzle complete' };
  try {
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      navigator.share(data).catch((error) => {
        if (!error || error.name !== 'AbortError') fallback();
      });
      return 'share';
    }
    fallback();
    return 'download';
  } catch (_) {
    fallback();
    return 'download';
  }
})()
"""
	JavaScriptBridge.eval(js, true)
