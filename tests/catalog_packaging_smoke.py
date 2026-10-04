"""An immutable packaging digest must preserve source identity and usable art."""
import hashlib
import json
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools/release"))
from catalog_identity import MANIFEST_PATH, validate_catalog_identity


class CatalogPackagingSmoke(unittest.TestCase):
    def setUp(self):
        self.catalog = json.loads((ROOT / "content/catalog_v1.json").read_text())["contents"]
        self.payloads = {}
        digests = {}
        for index, entry in enumerate(self.catalog):
            source = entry["path"]
            digests[source] = hashlib.sha256((ROOT / source.removeprefix("res://")).read_bytes()).hexdigest()
            imported = f".godot/imported/art-{index}.ctex"
            self.payloads[imported] = b"display-resource"
            self.payloads[source.removeprefix("res://") + ".import"] = f'[remap]\npath="res://{imported}"\n'.encode()
        self.payloads[MANIFEST_PATH] = json.dumps({"manifest_version": 1, "source_sha256": digests}).encode()

    def validate(self):
        return validate_catalog_identity(ROOT, set(self.payloads), self.payloads.__getitem__)

    def test_exact_original_byte_contract_all_catalog_entries(self):
        self.assertEqual(self.validate()["original_byte_hashes_verified"], 38)

    def test_reject_changed_digest(self):
        manifest = json.loads(self.payloads[MANIFEST_PATH])
        manifest["source_sha256"][self.catalog[0]["path"]] = "0" * 64
        self.payloads[MANIFEST_PATH] = json.dumps(manifest).encode()
        with self.assertRaises(AssertionError):
            self.validate()

    def test_reject_missing_artwork(self):
        del self.payloads[".godot/imported/art-0.ctex"]
        with self.assertRaises(AssertionError):
            self.validate()

    def test_reject_duplicate_raw_sources(self):
        self.payloads[self.catalog[0]["path"].removeprefix("res://")] = b"duplicate"
        with self.assertRaises(AssertionError):
            self.validate()


if __name__ == "__main__":
    unittest.main()
