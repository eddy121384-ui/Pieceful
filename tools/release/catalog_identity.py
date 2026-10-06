"""Validate frozen ORIGINAL-byte identity and imported display resources together."""
import hashlib
import json
from pathlib import Path
import re

MANIFEST_PATH = "content/catalog_identity_v1.json"


def validate_catalog_identity(root: Path, paths: set[str], read_bytes) -> dict:
    catalog = json.loads((root / "content/catalog_v1.json").read_text())["contents"]
    sources = [entry["path"] for entry in catalog]
    expected = {source: hashlib.sha256((root / source.removeprefix("res://")).read_bytes()).hexdigest() for source in sources}
    assert MANIFEST_PATH in paths, "Missing immutable catalog identity manifest"
    actual = json.loads(read_bytes(MANIFEST_PATH))
    assert actual == {"manifest_version": 1, "source_sha256": expected}, "Catalog manifest must match every original-byte save hash exactly"
    for source in sources:
        path = source.removeprefix("res://")
        assert path not in paths, "Raw catalog artwork duplicated in installed package: " + path
        metadata = path + ".import"
        assert metadata in paths, "Missing display resource remap: " + path
        imported = re.search(r'^path="res://([^"\n]+)"', read_bytes(metadata).decode(), re.MULTILINE)
        assert imported and imported[1] in paths, "Missing imported artwork: " + path
    return {"manifest_version": 1, "original_byte_hashes_verified": len(expected), "imported_artworks_verified": len(expected), "duplicate_raw_sources": 0}
