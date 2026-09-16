class_name AnalyticsSortingWorkspace
extends "res://scripts/timelapse_sorting_workspace.gd"

signal analytics_sorting_table_opened(tray_count: int, piece_count: int)
signal analytics_tray_created(tray_count: int, piece_count: int)
signal analytics_piece_moved_to_tray(moved_piece_count: int, tray_count: int, piece_count: int)


func _on_sort_toggled(enabled: bool) -> void:
	super._on_sort_toggled(enabled)
	if enabled:
		analytics_sorting_table_opened.emit(_analytics_tray_count(), _analytics_piece_count())


func _create_tray_from_field() -> void:
	var before := _analytics_tray_count()
	super._create_tray_from_field()
	var after := _analytics_tray_count()
	if after > before:
		analytics_tray_created.emit(after, _analytics_piece_count())


func try_store_drag_release(piece) -> bool:
	var member_indexes: Array = []
	if piece != null and is_instance_valid(piece):
		member_indexes = _loose_group_members_for_piece(int(piece.piece_index))
	var stored := super.try_store_drag_release(piece)
	if stored and not member_indexes.is_empty():
		analytics_piece_moved_to_tray.emit(
			member_indexes.size(),
			_analytics_tray_count(),
			_analytics_piece_count()
		)
	return stored


func _analytics_tray_count() -> int:
	return state.tray_ids().size() if state != null else 0


func _analytics_piece_count() -> int:
	if board == null:
		return 0
	var pieces_value = board.get("pieces")
	return pieces_value.size() if pieces_value is Array else 0
