class_name ContentIdentityChaosOrderStressPuzzleBoard
extends "res://scripts/chaos_order_stress_puzzle_board.gd"

const CONTENT_IDENTITY_VERSION := 1
const CONTENT_SOURCE_KIND := "builtin"
const CONTENT_SOURCE_ID := "builtin:demo_garden"
const CONTENT_SOURCE_PATH := "res://assets/demo_garden.svg"

var _content_sha256_cache := ""


func active_content_identity() -> Dictionary:
	var digest := _content_sha256()
	return {
		"identity_version": CONTENT_IDENTITY_VERSION,
		"source_kind": CONTENT_SOURCE_KIND,
		"source_id": CONTENT_SOURCE_ID,
		"sha256": digest,
		"content_key": "sha256:%s" % digest if not digest.is_empty() else "",
	}


func content_identity_matches(candidate) -> bool:
	if not content_identity_structurally_valid(candidate):
		return false
	var expected := active_content_identity()
	if str(expected.get("sha256", "")).is_empty():
		return false
	return (
		str(candidate.get("sha256", "")) == str(expected.get("sha256", ""))
		and str(candidate.get("content_key", "")) == str(expected.get("content_key", ""))
	)


func content_identity_structurally_valid(candidate) -> bool:
	if not (candidate is Dictionary):
		return false
	if int(candidate.get("identity_version", -1)) != CONTENT_IDENTITY_VERSION:
		return false
	var digest := str(candidate.get("sha256", ""))
	if digest.length() != 64 or not digest.is_valid_hex_number(false):
		return false
	if str(candidate.get("content_key", "")) != "sha256:%s" % digest:
		return false
	if str(candidate.get("source_kind", "")).is_empty():
		return false
	if str(candidate.get("source_id", "")).is_empty():
		return false
	return true


func _content_sha256() -> String:
	if not _content_sha256_cache.is_empty():
		return _content_sha256_cache
	var file := FileAccess.open(CONTENT_SOURCE_PATH, FileAccess.READ)
	if file == null:
		return ""
	var bytes := file.get_buffer(file.get_length())
	file.close()
	var hashing := HashingContext.new()
	if hashing.start(HashingContext.HASH_SHA256) != OK:
		return ""
	if hashing.update(bytes) != OK:
		return ""
	_content_sha256_cache = hashing.finish().hex_encode()
	return _content_sha256_cache
