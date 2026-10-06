@tool
extends EditorPlugin

var catalog_export := preload("res://addons/catalog_source_export/catalog_source_export.gd").new()


func _enter_tree() -> void:
	add_export_plugin(catalog_export)


func _exit_tree() -> void:
	remove_export_plugin(catalog_export)
