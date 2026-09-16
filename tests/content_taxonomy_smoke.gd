extends SceneTree

const TAXONOMY_PATH := "res://content/tag_taxonomy_v1.json"
const CATALOG_PATH := "res://content/catalog_v1.json"
const FACET_FIELDS := ["subject", "region_culture", "mood", "visual", "style", "scene"]


func _init() -> void:
	call_deferred("_run")


func _run() -> void:
	var taxonomy := _read_json(TAXONOMY_PATH)
	var catalog := _read_json(CATALOG_PATH)
	if taxonomy.is_empty() or catalog.is_empty():
		return

	if int(taxonomy.get("taxonomy_version", -1)) != 1:
		_fail("taxonomy version must be 1")
		return
	if int(catalog.get("schema_version", -1)) != 1:
		_fail("catalog schema version changed unexpectedly")
		return
	if int(catalog.get("metadata_version", -1)) < 2:
		_fail("catalog metadata_version did not advance to taxonomy-aware metadata")
		return
	if int(catalog.get("tag_schema_version", -1)) < 2:
		_fail("catalog tag_schema_version did not advance")
		return
	if int(catalog.get("taxonomy_version", -1)) != 1:
		_fail("catalog taxonomy_version does not match taxonomy file")
		return

	var categories := _string_set(taxonomy.get("primary_categories", []))
	var facet_rules: Dictionary = taxonomy.get("facet_rules", {})
	var controlled: Dictionary = taxonomy.get("controlled_values", {})
	var completeness: Dictionary = taxonomy.get("completeness_contract", {})
	var status_values := _string_set(completeness.get("status_values", []))
	var published_status_values := _string_set(completeness.get("published_allowed_status_values", []))
	var contract_facets = completeness.get("facet_fields", [])
	if not (contract_facets is Array) or contract_facets.size() != FACET_FIELDS.size():
		_fail("completeness contract facet list is incomplete")
		return
	for field in FACET_FIELDS:
		if not contract_facets.has(field):
			_fail("completeness contract missing facet %s" % field)
			return

	var difficulties := _string_set(taxonomy.get("difficulty_values", []))
	var puzzleability_contract: Dictionary = taxonomy.get("puzzleability", {})
	var required_metrics = puzzleability_contract.get("required_metrics", [])
	var attribution_contract: Dictionary = taxonomy.get("attribution", {})
	var required_attribution = attribution_contract.get("required_fields", [])
	var contents = catalog.get("contents", [])
	if not (contents is Array) or contents.is_empty():
		_fail("catalog has no content fixtures")
		return

	var seen_ids := {}
	for entry_value in contents:
		if not (entry_value is Dictionary):
			_fail("catalog contains a non-dictionary entry")
			return
		var entry: Dictionary = entry_value
		var content_id := str(entry.get("id", ""))
		if not _canonical_id(content_id):
			_fail("invalid content id: %s" % content_id)
			return
		if seen_ids.has(content_id):
			_fail("duplicate content id: %s" % content_id)
			return
		seen_ids[content_id] = true

		for required_string in ["label", "source_id", "path"]:
			if str(entry.get(required_string, "")).strip_edges().is_empty():
				_fail("%s missing %s" % [content_id, required_string])
				return

		var category := str(entry.get("category", ""))
		if not categories.has(category):
			_fail("%s uses unknown category %s" % [content_id, category])
			return

		var difficulty := str(entry.get("suggested_difficulty", ""))
		if not difficulties.has(difficulty):
			_fail("%s uses unknown suggested difficulty %s" % [content_id, difficulty])
			return

		var facet_status = entry.get("facet_status", {})
		if not (facet_status is Dictionary):
			_fail("%s facet_status missing" % content_id)
			return
		if facet_status.size() != FACET_FIELDS.size():
			_fail("%s facet_status must describe every semantic facet" % content_id)
			return

		var allowed_tag_ids := {category: true}
		for field in FACET_FIELDS:
			if not entry.has(field):
				_fail("%s missing facet field %s" % [content_id, field])
				return
			if not facet_status.has(field):
				_fail("%s missing facet_status for %s" % [content_id, field])
				return

			var status := str(facet_status.get(field, ""))
			if not status_values.has(status):
				_fail("%s has unknown %s status %s" % [content_id, field, status])
				return
			if not published_status_values.has(status):
				_fail("%s published metadata still has unresolved %s" % [content_id, field])
				return

			var values = entry.get(field, [])
			if not (values is Array):
				_fail("%s facet %s is not an array" % [content_id, field])
				return

			var rule: Dictionary = facet_rules.get(field, {})
			var max_values := int(rule.get("max_values", 999))
			if values.size() > max_values:
				_fail("%s facet %s exceeds max_values %d" % [content_id, field, max_values])
				return

			if status == "present" and values.is_empty():
				_fail("%s marks %s present but has no values" % [content_id, field])
				return
			if status != "present" and not values.is_empty():
				_fail("%s marks %s %s but still stores values" % [content_id, field, status])
				return
			if bool(rule.get("published_must_be_present", false)) and status != "present":
				_fail("%s published facet %s must be present" % [content_id, field])
				return

			var local_seen := {}
			for raw_value in values:
				var value := str(raw_value)
				if not _canonical_id(value):
					_fail("%s has non-canonical %s value %s" % [content_id, field, value])
					return
				if local_seen.has(value):
					_fail("%s duplicates %s value %s" % [content_id, field, value])
					return
				local_seen[value] = true
				allowed_tag_ids[value] = true
				if controlled.has(field):
					var allowed := _string_set(controlled.get(field, []))
					if not allowed.has(value):
						_fail("%s uses unknown controlled %s value %s" % [content_id, field, value])
						return

		var puzzleability = entry.get("puzzleability", {})
		if not (puzzleability is Dictionary):
			_fail("%s puzzleability is not a dictionary" % content_id)
			return
		for metric_value in required_metrics:
			var metric := str(metric_value)
			if not puzzleability.has(metric):
				_fail("%s puzzleability missing %s" % [content_id, metric])
				return
			var numeric := float(puzzleability.get(metric, -1.0))
			if numeric < 0.0 or numeric > 1.0:
				_fail("%s puzzleability %s outside 0..1" % [content_id, metric])
				return

		var tags = entry.get("tags", [])
		if not (tags is Array) or tags.is_empty():
			_fail("%s has no weighted tags" % content_id)
			return
		var tag_seen := {}
		for tag_value in tags:
			if not (tag_value is Dictionary):
				_fail("%s has malformed weighted tag" % content_id)
				return
			var tag: Dictionary = tag_value
			var tag_id := str(tag.get("id", ""))
			if not allowed_tag_ids.has(tag_id):
				_fail("%s tag %s is not backed by category/facets" % [content_id, tag_id])
				return
			if tag_seen.has(tag_id):
				_fail("%s duplicates weighted tag %s" % [content_id, tag_id])
				return
			tag_seen[tag_id] = true
			var weight := float(tag.get("weight", -1.0))
			if weight < 0.0 or weight > 1.0:
				_fail("%s tag %s weight outside 0..1" % [content_id, tag_id])
				return

		var attribution = entry.get("attribution", {})
		if not (attribution is Dictionary):
			_fail("%s attribution missing" % content_id)
			return
		for field_value in required_attribution:
			var field := str(field_value)
			if not attribution.has(field):
				_fail("%s attribution missing %s" % [content_id, field])
				return
			if field != "source_url" and str(attribution.get(field, "")).strip_edges().is_empty():
				_fail("%s attribution %s is empty" % [content_id, field])
				return

	print("PASS content_taxonomy_smoke: %d published fixtures have complete facet status + taxonomy v1 metadata" % contents.size())
	quit(0)


func _read_json(path: String) -> Dictionary:
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		_fail("cannot open %s" % path)
		return {}
	var parsed = JSON.parse_string(file.get_as_text())
	file.close()
	if not (parsed is Dictionary):
		_fail("invalid JSON root in %s" % path)
		return {}
	return parsed


func _string_set(values) -> Dictionary:
	var result := {}
	if values is Array:
		for value in values:
			result[str(value)] = true
	return result


func _canonical_id(value: String) -> bool:
	if value.is_empty() or value != value.to_lower() or value.contains(" "):
		return false
	for index in range(value.length()):
		var code := value.unicode_at(index)
		var is_lower := code >= 97 and code <= 122
		var is_digit := code >= 48 and code <= 57
		if not is_lower and not is_digit and code != 95:
			return false
	return true


func _fail(message: String) -> void:
	push_error("FAIL content_taxonomy_smoke: %s" % message)
	quit(1)
