"""Offline ingestion, frozen identities, rights gates and transaction failure tests."""
import copy
import io
import json
from pathlib import Path
import shutil
import sys
import tempfile
import unittest
from unittest.mock import patch

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from catalog_pipeline_lib import images
from catalog_pipeline_lib.pipeline import AUTHORING, LOCKS, CATALOG, IDENTITY, CONTROL, Plan, dump, read_json, run, rollback_or_finish, lock, sha


def pixels(color=(50, 100, 170)):
    stream = io.BytesIO()
    Image.new("RGB", (96, 144), color).save(stream, format="PNG")
    return stream.getvalue()


def metadata_for(content_id):
    return {"id": content_id, "title": "Synthetic test artwork", "source_file": content_id + ".png", "source_id": "test:" + content_id, "creator": None, "provider": "nonshipping_unit_fixture", "source_reference": "tests/catalog_pipeline_smoke.py generated pixels", "license": "owned", "attribution_required": False,
            "rights": {"kind": "PROJECT_OWNED", "status": "APPROVED", "evidence_reference": "synthetic unit-test pixels; not a production legal claim", "review": {"reviewer": "unit test", "decision_reference": "unit-test scenario"}, "commercial_use": True, "redistribution": True, "derivatives": True},
            "taxonomy": {"category": "abstract", "subject": ["test_shapes"], "visual": ["flat_areas"], "style": ["digital_art"]}, "puzzleability_review": {"reviewer": "unit test", "rationale": "Small/flat fixture deliberately tests pipeline gates, not production artwork quality"}, "date": None}


class PipelineSmoke(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="pieceful-pipeline-test-")
        self.root = Path(self.temp.name) / "repo"
        self.root.mkdir()
        for name in ["assets", "content", "licenses"]:
            shutil.copytree(ROOT / name, self.root / name)
        self.intake = Path(self.temp.name) / "intake"
        self.intake.mkdir()

    def tearDown(self):
        self.temp.cleanup()

    def batch(self, items, data=None):
        for item in items:
            if isinstance(item, dict) and isinstance(item.get("source_file"), str) and "/" not in item["source_file"]:
                (self.intake / item["source_file"]).write_bytes(data if data is not None else pixels())
        (self.intake / "batch.json").write_bytes(dump({"schema_version": 1, "items": items}))

    def apply(self, **kwargs):
        return run(self.root, "ingest", batch=self.intake, **kwargs)

    def snapshot(self):
        return {p.relative_to(self.root).as_posix(): sha(p.read_bytes()) for directory in ["assets", "content", "licenses"] for p in (self.root / directory).rglob("*") if p.is_file()}

    def assert_blocked(self, fragment):
        before = self.snapshot()
        result = self.apply()
        self.assertFalse(result["ok"], result)
        self.assertIn(fragment, str(result["errors"]))
        self.assertEqual(before, self.snapshot(), "Failed intake changed current production")

    def test_valid_single_and_old_identity_compatibility(self):
        before = read_json(self.root / LOCKS)["records"]
        item = metadata_for("new_art")
        self.batch([item])
        result = self.apply()
        self.assertTrue(result["ok"], result["errors"])
        after = read_json(self.root / LOCKS)["records"]
        for key, value in before.items():
            self.assertEqual(value, after[key])
        entry = next(e for e in read_json(self.root / CATALOG)["contents"] if e["id"] == "new_art")
        self.assertEqual((self.root / entry["path"].removeprefix("res://")).read_bytes(), pixels())
        self.assertEqual(after["new_art"]["sha256"], sha(pixels()))
        self.assertEqual(entry["attribution"]["creator"], "")
        self.assertTrue(run(self.root, "validate")["ok"])

    def test_hundred_artworks_one_batch(self):
        self.batch([metadata_for("art_%03d" % i) for i in range(100)])
        result = self.apply()
        self.assertTrue(result["ok"], result["errors"])
        self.assertEqual(sum(r["status"] == "ADDED" for r in result["items"]), 100)
        self.assertEqual(len(read_json(self.root / CATALOG)["contents"]), 138)

    def test_duplicate_hash_is_reported_not_reidentified(self):
        self.batch([metadata_for("art_a"), metadata_for("art_b")])
        result = self.apply()
        self.assertTrue(result["ok"], result["errors"])
        self.assertTrue(any("Duplicate source hash" in str(r["warnings"]) for r in result["items"]))

    def test_duplicate_id(self):
        self.batch([metadata_for("duplicate"), metadata_for("duplicate")])
        self.assert_blocked("Duplicate stable ID")

    def test_changed_bytes_under_existing_id(self):
        item = metadata_for("met_10181")
        self.batch([item])
        self.assert_blocked("Changed bytes under existing stable ID")

    def test_missing_metadata(self):
        (self.intake / "batch.json").write_text('{}')
        self.assert_blocked("nonempty items array")

    def test_duplicate_json_keys(self):
        (self.intake / "batch.json").write_text('{"schema_version":1,"schema_version":2}')
        self.assert_blocked("Duplicate JSON key")

    def test_missing_source(self):
        self.batch([metadata_for("missing")]); (self.intake / "missing.png").unlink()
        self.assert_blocked("Missing file")

    def test_unapproved_rights(self):
        for status in ["REVIEW_REQUIRED", "REJECTED", "invalid"]:
            with self.subTest(status=status):
                item = metadata_for("rights_test"); item["rights"]["status"] = status
                self.batch([item]); self.assert_blocked("rights" if status != "REJECTED" else "Rights rejected")

    def test_missing_provenance_and_grants(self):
        item = metadata_for("no_grant"); item["rights"]["commercial_use"] = False
        self.batch([item]); self.assert_blocked("commercial_use")
        item = metadata_for("no_grant"); item.pop("source_reference")
        self.batch([item]); self.assert_blocked("source_reference")

    def test_malformed_image(self):
        self.batch([metadata_for("broken")], b"not a PNG")
        self.assert_blocked("cannot identify image")

    def test_unsupported_format(self):
        item = metadata_for("unsupported"); item["source_file"] = "unsupported.heic"
        self.batch([item]); self.assert_blocked("PNG/JPEG only")

    def test_path_traversal_and_symlink(self):
        item = metadata_for("bad_path"); item["source_file"] = "../outside.png"
        self.batch([item]); self.assert_blocked("Path traversal")
        item["source_file"] = "linked.png"
        self.batch([item]); (self.intake / "linked.png").unlink()
        (self.intake / "linked.png").symlink_to(ROOT / "tests/fixtures/product-ux-photo.png")
        self.assert_blocked("Symlink")

    def test_case_collision(self):
        item = metadata_for("collision")
        self.batch([item]); (self.intake / "COLLISION.png").write_bytes(pixels())
        self.assert_blocked("Case collision")

    def test_generated_file_collision(self):
        target = self.root / "assets/catalog/puzzles/collision.png"; target.parent.mkdir(parents=True); target.write_bytes(pixels())
        self.batch([metadata_for("collision")]); self.assert_blocked("Generated file collision")

    def test_invalid_theme_tag_and_title(self):
        item = metadata_for("bad_meta"); item["taxonomy"]["category"] = "not_a_theme"
        self.batch([item]); self.assert_blocked("category/theme")
        item = metadata_for("bad_meta"); item["title"] = ""
        self.batch([item]); self.assert_blocked("title")
        item = metadata_for("bad_meta"); item["tags"] = [{"id": "floating_synonym", "weight": 1}]
        self.batch([item]); self.assert_blocked("weighted tag")

    def test_invalid_and_stale_hash(self):
        item = metadata_for("bad_hash"); item["expected_source_sha256"] = "0" * 64
        self.batch([item]); self.assert_blocked("approved expected_source_sha256")
        doc = read_json(self.root / IDENTITY); doc['source_sha256'][next(iter(doc['source_sha256']))] = 'bad'
        (self.root / IDENTITY).write_bytes(dump(doc))
        result = run(self.root, "validate")
        self.assertFalse(result['ok']); self.assertIn('Stale generated', str(result['errors']))

    def test_thumbnail_mismatch_in_existing_catalog(self):
        path = self.root / "assets/museum/met_v0/thumbs/met_10181.jpg"; path.write_bytes(b'wrong')
        result = run(self.root, "validate")
        self.assertFalse(result['ok']); self.assertIn('Thumbnail hash/source mismatch', str(result['errors']))

    def test_deterministic_thumbnail_and_contain(self):
        data = pixels()
        a, info = images.thumbnail(data); b, _ = images.thumbnail(data)
        self.assertEqual(a, b); self.assertEqual(info['width'], 96); self.assertEqual(info['height'], 144)
        stream = io.BytesIO(); Image.new('RGB',(1800,1200)).save(stream,format='PNG')
        result, info = images.thumbnail(stream.getvalue())
        self.assertEqual((info['width'],info['height']),(420,280))
        with Image.open(io.BytesIO(result)) as image: image.load(); self.assertEqual(image.size,(420,280))

    def test_deterministic_manifest_dry_run_and_idempotency(self):
        self.batch([metadata_for('repeat')]); before = self.snapshot()
        first = self.apply(dry_run=True); second = self.apply(dry_run=True)
        self.assertTrue(first['ok'],first['errors']); self.assertEqual(first['changes'],second['changes'])
        self.assertEqual(before,self.snapshot()); self.assertTrue(self.apply()['ok'])
        stable = self.snapshot(); again = self.apply()
        self.assertTrue(again['ok'],again['errors']); self.assertEqual(again['changes'],[])
        self.assertEqual(stable,self.snapshot())

    def test_failed_fiftieth_batch_is_transactional(self):
        items = [metadata_for('art_%03d' % i) for i in range(50)]
        items[46]['rights']['status'] = 'REJECTED'
        self.batch(items); self.assert_blocked('Rights rejected')

    def test_promotion_io_failure_rolls_back(self):
        self.batch([metadata_for('rollback')]); before = self.snapshot()
        result = self.apply(fail_after=3)
        self.assertFalse(result['ok']); self.assertEqual(before,self.snapshot())
        self.assertFalse((self.root / CONTROL / 'pending.json').exists())

    def test_interrupted_transaction_recovery_preserves_backups(self):
        self.batch([metadata_for('recovery')]); before = self.snapshot()
        with patch('catalog_pipeline_lib.pipeline.rollback_or_finish',side_effect=ValueError('Simulated power loss')):
            result = self.apply(fail_after=3)
        self.assertFalse(result['ok']); self.assertTrue((self.root / CONTROL / 'pending.json').exists())
        self.assertFalse(run(self.root,'validate')['ok'])
        with lock(self.root) as control:
            self.assertEqual(rollback_or_finish(self.root,control),'Rolled back interrupted transaction')
        self.assertEqual(before,self.snapshot())

    def test_production_rights_gate_truthful(self):
        result = run(self.root,'validate',production_rights=True)
        self.assertFalse(result['ok']); self.assertIn('garden',str(result['errors']))

    def test_original_catalog_and_metadata_projection_exact(self):
        before = self.snapshot(); result = run(self.root,'generate')
        self.assertTrue(result['ok'],result['errors']); self.assertEqual(result['changes'],[])
        self.assertEqual(before,self.snapshot())
        self.assertEqual((ROOT / CATALOG).read_bytes(),(self.root / CATALOG).read_bytes())

    def test_baseline_rejects_manually_rewritten_lock(self):
        # Use actual local Git history, no network. Even coordinated edits to
        # authoring and locks cannot bypass the baseline identity comparison.
        from catalog_pipeline_lib.pipeline import baseline
        doc = read_json(self.root / AUTHORING); doc['records'][0]['source']['sha256'] = '0' * 64
        with self.assertRaisesRegex(ValueError,'Baseline content identity'):
            baseline(ROOT,'4ea7eca8644dfb105eefe7b2d782b9dd664dd614',doc)

    def test_pre_hardening_baseline_preserves_original_git_bytes(self):
        from catalog_pipeline_lib.pipeline import baseline
        # The merge target predates release inventory/locks. An absent
        # inventory must neither break PR CI nor weaken identity protection.
        ref='8f805080880e02f652a5d6954112616363402bf1'
        doc=read_json(self.root / AUTHORING)
        baseline(ROOT,ref,doc)
        doc['records'][0]['source']['sha256']='0'*64
        with self.assertRaisesRegex(ValueError,'Baseline content identity'):
            baseline(ROOT,ref,doc)

    def test_renamed_source_keeps_identity_and_clean_outputs(self):
        item = metadata_for('renamed'); self.batch([item]); self.assertTrue(self.apply()['ok'])
        before = self.snapshot(); (self.intake / 'renamed.png').rename(self.intake / 'different_filename.png')
        item['source_file'] = 'different_filename.png'; (self.intake / 'batch.json').write_bytes(dump({'schema_version':1,'items':[item]}))
        result = self.apply(); self.assertTrue(result['ok'],result['errors']); self.assertEqual(result['changes'],[])
        self.assertEqual(before,self.snapshot())

    def test_duplicate_source_reference_is_blocked(self):
        a,b=metadata_for('ref_a'),metadata_for('ref_b'); b['source_id']=a['source_id']
        self.batch([a,b]); self.assert_blocked('Duplicate ID/source identity')

    def test_invalid_registry_shape_is_reported(self):
        (self.root / AUTHORING).write_text('[]')
        result=run(self.root,'validate'); self.assertFalse(result['ok']); self.assertIn('JSON objects',str(result['errors']))

    def test_report_cannot_overwrite_production_inputs(self):
        import subprocess
        before=self.snapshot()
        result=subprocess.run([sys.executable,str(ROOT / 'tools/catalog_pipeline.py'),'--root',str(self.root),'validate','--report',str(self.root / CATALOG)],capture_output=True,text=True)
        self.assertEqual(result.returncode,2); self.assertIn('cannot overwrite',result.stderr); self.assertEqual(before,self.snapshot())

    def test_malformed_facet_status_is_reported_without_partial_promotion(self):
        item=metadata_for('bad_facets'); item['taxonomy']['facet_status']=[]
        self.batch([item]); self.assert_blocked('facet_status must be an object')

    def test_inherited_met_provenance_cannot_lose_public_domain_evidence(self):
        path=self.root / 'content/curation/met_runtime_candidates_v0.json'
        document=read_json(path); document['contents'][0]['attribution']['provider_rights_signal']['value']=False
        path.write_bytes(dump(document))
        result=run(self.root,'validate'); self.assertFalse(result['ok'])
        self.assertIn('provenance record is missing/ineligible',str(result['errors']))

    def test_export_lock_blocks_writer_without_mutating_catalog(self):
        import subprocess
        self.batch([metadata_for('concurrent')]); before=self.snapshot()
        with lock(self.root):
            result=subprocess.run([sys.executable,str(ROOT / 'tools/catalog_pipeline.py'),'--root',str(self.root),'ingest',str(self.intake)],capture_output=True,text=True)
        self.assertEqual(result.returncode,2); self.assertIn('holds the lock',result.stdout)
        self.assertEqual(before,self.snapshot())


if __name__ == '__main__':
    unittest.main(verbosity=2)
