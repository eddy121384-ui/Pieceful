"""Exercise release selection against real immutable sources and rights evidence."""
import json
from pathlib import Path
import shutil
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools/poki"))
from catalog import projection


class PokiCatalogSmoke(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.root = Path(cls.temp.name)
        for folder in ("assets", "content", "licenses"):
            shutil.copytree(ROOT / folder, cls.root / folder)
        (cls.root / "poki").mkdir()
        cls.profile = (ROOT / "poki/profile.json").read_bytes()

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def setUp(self):
        (self.root / "poki/profile.json").write_bytes(self.profile)

    def alter_selection(self, ids):
        profile = json.loads(self.profile)
        profile["artwork_ids"] = ids
        (self.root / "poki/profile.json").write_text(json.dumps(profile))

    def test_all_35_keep_exact_canonical_metadata_and_distinct_hashes(self):
        view = projection(self.root)
        original = json.loads((ROOT / "content/catalog_v1.json").read_text())["contents"]
        selected = [e for e in original if e["source_id"].startswith("met:")]
        self.assertEqual(view["catalog"]["contents"], selected)
        self.assertEqual(len(view["catalog"]["contents"]), 35)
        self.assertEqual(len(set(view["identity"]["source_sha256"].values())), 35)
        self.assertEqual(len(view["manifest"]["themes"]), 7)
        self.assertTrue(all(r["rights"]["status"] == "APPROVED" for r in view["manifest"]["artworks"]))

    def test_review_required_original_fixture_is_rejected(self):
        ids = json.loads(self.profile)["artwork_ids"] + ["garden"]
        self.alter_selection(ids)
        with self.assertRaisesRegex(ValueError, "Unapproved"):
            projection(self.root)

    def test_less_than_30_is_not_a_release_candidate(self):
        self.alter_selection(json.loads(self.profile)["artwork_ids"][:29])
        with self.assertRaisesRegex(ValueError, "Insufficient"):
            projection(self.root)

    def test_duplicate_image_id_cannot_inflate_count(self):
        ids = json.loads(self.profile)["artwork_ids"]
        self.alter_selection(ids + [ids[0]])
        with self.assertRaisesRegex(ValueError, "Repeated"):
            projection(self.root)

    def test_changed_original_bytes_are_rejected_before_export(self):
        path = self.root / "assets/museum/met_v0/puzzles/met_10181.jpg"
        original = path.read_bytes()
        try:
            path.write_bytes(original + b"tampered")
            with self.assertRaisesRegex(ValueError, "validation|bytes changed"):
                projection(self.root)
        finally:
            path.write_bytes(original)


if __name__ == "__main__":
    unittest.main()
