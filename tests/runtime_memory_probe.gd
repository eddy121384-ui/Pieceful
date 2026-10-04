extends SceneTree

const MainScene = preload("res://main.tscn")
var samples: Array = []


func _init() -> void:
	call_deferred("_run")


func _sample(tag: String) -> void:
	samples.append({"tag": tag, "nodes": Performance.get_monitor(Performance.OBJECT_NODE_COUNT), "orphans": Performance.get_monitor(Performance.OBJECT_ORPHAN_NODE_COUNT), "static_bytes": Performance.get_monitor(Performance.MEMORY_STATIC), "static_max_bytes": Performance.get_monitor(Performance.MEMORY_STATIC_MAX), "resources": Performance.get_monitor(Performance.OBJECT_RESOURCE_COUNT)})


func _run() -> void:
	_sample("before-main")
	var main = MainScene.instantiate()
	root.add_child(main)
	for _frame in range(20):
		await process_frame
	_sample("gallery")
	for difficulty in ["relaxed", "standard", "hard"]:
		main._on_content_card_pressed("garden")
		main._select_picker_difficulty(difficulty)
		main._start_selected_puzzle()
		for _frame in range(8):
			await process_frame
		_sample(difficulty)
		main._leave_puzzle_for_gallery()
	var sorting = main.get_node("SortingWorkspace")
	for index in range(12):
		sorting._set_loose_layout_mode("rail" if index % 2 == 0 else "scatter")
		await create_timer(0.7).timeout
	_sample("after-12-transitions")
	for index in range(8):
		main._on_content_card_pressed("garden")
		main._select_picker_difficulty("relaxed")
		main._start_selected_puzzle()
		for _frame in range(4):
			await process_frame
		main._leave_puzzle_for_gallery()
	_sample("after-8-cycles")
	main.queue_free()
	for _frame in range(4):
		await process_frame
	_sample("after-main-free")
	Node.print_orphan_nodes()
	var output := OS.get_environment("PIECEFUL_MEMORY_OUTPUT")
	if output.is_empty():
		push_error("Set PIECEFUL_MEMORY_OUTPUT to an external/ignored output path")
		quit(1)
		return
	var file := FileAccess.open(output, FileAccess.WRITE)
	file.store_string(JSON.stringify({"debug_build": OS.is_debug_build(), "headless": true, "samples": samples}, "\t"))
	file.close()
	print("PASS runtime_memory_probe (diagnostic; headless has no GPU memory evidence)")
	quit(0)
