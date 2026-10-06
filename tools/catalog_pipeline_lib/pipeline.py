"""Offline catalog projection with append-only identity and recoverable promotion."""
from contextlib import contextmanager
import argparse
import copy
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import sys
import tempfile

import numpy
import PIL

from . import images, metadata

ROOT = Path(__file__).resolve().parents[2]
AUTHORING = "content/curation/catalog_authoring_v1.json"
LOCKS = "content/curation/catalog_identity_lock_v1.json"
IDENTITY = "content/curation/catalog_identity_manifest_v1.json"
ASSETS = "content/curation/catalog_assets_v1.json"
CATALOG = "content/catalog_v1.json"
INVENTORY = "licenses/ASSET_MANIFEST.json"
CONTROL = ".pieceful-content/catalog-pipeline"
PROFILE = {"pillow": "12.3.0", "numpy": "2.3.5", "thumbnail": images.PROFILE, "puzzle_artwork": "original_bytes_no_recompression"}
LEGACY_FIXTURES = {"garden", "twilight_lake", "crane_pine_scroll"}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def dump(value):
    return (json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n").encode("utf-8")


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(",", ":"), allow_nan=False).encode()


def read_json(path):
    def pairs(values):
        result = {}
        for key, value in values:
            if key in result:
                raise ValueError("Duplicate JSON key: " + key)
            result[key] = value
        return result
    def bad(value):
        raise ValueError("Non-finite JSON value: " + value)
    return json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=pairs, parse_constant=bad)


def relative(value):
    if not isinstance(value, str) or not value or "\\" in value or ":" in value or "\0" in value:
        raise ValueError("Invalid relative path")
    path = PurePosixPath(value)
    if path.is_absolute() or any(part in ("", ".", "..") for part in value.split("/")):
        raise ValueError("Path traversal/noncanonical path: " + value)
    return path.as_posix()


def safe(root, value, *, required=True):
    value = relative(value)
    path = root / value
    current = root
    if root.is_symlink():
        raise ValueError("Symlink root is forbidden")
    for part in PurePosixPath(value).parts:
        if current.exists():
            for sibling in current.iterdir():
                if sibling.name.casefold() == part.casefold() and sibling.name != part:
                    raise ValueError("Case collision: " + value)
        current = current / part
        if current.is_symlink():
            raise ValueError("Symlink path is forbidden: " + value)
    if required and not path.is_file():
        raise ValueError("Missing file: " + value)
    if not path.resolve().is_relative_to(root.resolve()):
        raise ValueError("Path escapes root")
    return path


def res_path(value):
    if not isinstance(value, str) or not value.startswith("res://assets/"):
        raise ValueError("Runtime art must use res://assets/ paths")
    return relative(value.removeprefix("res://"))


def sync_dir(path):
    if os.name != "nt":
        fd = os.open(path, os.O_RDONLY)
        try:
            os.fsync(fd)
        finally:
            os.close(fd)


def durable(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name + ".writing")
    with temp.open("wb") as stream:
        stream.write(data)
        stream.flush()
        os.fsync(stream.fileno())
    os.replace(temp, path)
    sync_dir(path.parent)


@contextmanager
def lock(root):
    control = safe(root, CONTROL, required=False)
    control.mkdir(parents=True, exist_ok=True)
    (control.parent / ".gdignore").touch()
    path = safe(root, CONTROL + "/lock", required=False)
    with path.open("a+b") as stream:
        try:
            if os.name == "nt":
                import msvcrt
                if path.stat().st_size == 0:
                    stream.write(b"0"); stream.flush()
                stream.seek(0)
                msvcrt.locking(stream.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl
                fcntl.flock(stream.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError as error:
            raise ValueError("Another catalog writer holds the lock") from error
        try:
            yield control
        finally:
            if os.name == "nt":
                stream.seek(0); msvcrt.locking(stream.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                fcntl.flock(stream.fileno(), fcntl.LOCK_UN)


class Plan:
    def __init__(self, root, stage):
        self.root, self.stage = root, stage
        self.targets = {}
        self.observed = {}

    def observe(self, path):
        data = path.read_bytes()
        if path in self.observed and self.observed[path] != sha(data):
            raise ValueError("Input changed during generation: " + str(path))
        self.observed[path] = sha(data)
        return data

    def put(self, target, data):
        relative(target)
        safe(self.root, target, required=False)
        if target in self.targets:
            raise ValueError("Generated file collision: " + target)
        staged = self.stage / "desired" / target
        durable(staged, data)
        self.targets[target] = staged

    def changes(self):
        return [path for path, staged in sorted(self.targets.items()) if not (self.root / path).is_file() or (self.root / path).read_bytes() != staged.read_bytes()]

    def verify_inputs(self):
        for path, digest in self.observed.items():
            if not path.is_file() or sha(path.read_bytes()) != digest:
                raise ValueError("Input changed during generation: " + str(path))


def rollback_or_finish(root, control):
    journal = control / "pending.json"
    if not journal.exists():
        return "No pending transaction"
    state = read_json(journal)
    transaction = safe(root, CONTROL + "/" + relative(state["directory"]), required=False)
    if not transaction.is_dir():
        raise ValueError("Missing transaction backups; manual review required")
    for item in state["files"]:
        target = safe(root, item["path"], required=False)
        current = sha(target.read_bytes()) if target.is_file() else None
        if current not in (item["before"], item["after"]):
            raise ValueError("Recovery would overwrite an external edit: " + item["path"])
        backup = transaction / "backup" / item["path"]
        if item["before"] is not None and (not backup.is_file() or sha(backup.read_bytes()) != item["before"]):
            raise ValueError("Invalid recovery backup")
    if state["phase"] == "committed":
        if any(sha((root / i["path"]).read_bytes()) != i["after"] for i in state["files"]):
            raise ValueError("Committed transaction has external changes")
        result = "Completed transaction cleanup"
    else:
        for item in reversed(state["files"]):
            target = root / item["path"]
            if item["before"] is None:
                target.unlink(missing_ok=True)
                if target.parent.exists():
                    sync_dir(target.parent)
            else:
                durable(target, (transaction / "backup" / item["path"]).read_bytes())
        result = "Rolled back interrupted transaction"
    journal.unlink()
    sync_dir(control)
    shutil.rmtree(transaction)
    return result


def promote(plan, control, *, fail_after=None):
    changes = plan.changes()
    if not changes:
        return []
    plan.verify_inputs()
    files = []
    for path in changes:
        target, staged = plan.root / path, plan.targets[path]
        before = target.read_bytes() if target.is_file() else None
        if before is not None:
            durable(plan.stage / "backup" / path, before)
        files.append({"path": path, "before": sha(before) if before is not None else None, "after": sha(staged.read_bytes())})
    journal = control / "pending.json"
    state = {"schema_version": 1, "directory": plan.stage.name, "phase": "prepared", "files": files}
    durable(journal, dump(state))
    try:
        plan.verify_inputs()
        for index, item in enumerate(files, start=1):
            target = safe(plan.root, item["path"], required=False)
            current = sha(target.read_bytes()) if target.is_file() else None
            if current != item["before"]:
                raise ValueError("Output changed during promotion")
            target.parent.mkdir(parents=True, exist_ok=True)
            os.replace(plan.targets[item["path"]], target)
            sync_dir(target.parent)
            if fail_after == index:
                raise OSError("Injected promotion failure")
        durable(journal, dump({**state, "phase": "committed"}))
    except BaseException:
        rollback_or_finish(plan.root, control)
        raise
    journal.unlink()
    sync_dir(control)
    return changes


def ensure_profile():
    if PIL.__version__ != PROFILE["pillow"] or numpy.__version__ != PROFILE["numpy"]:
        raise ValueError("Install tools/catalog_pipeline_requirements.txt; image tool versions must match the locked profile")


def load(root, plan=None):
    if (root / CONTROL / "pending.json").exists():
        raise ValueError("Interrupted transaction exists; run recover before validation/export")
    paths = [AUTHORING, LOCKS, "content/tag_taxonomy_v1.json"]
    for path in paths:
        safe(root, path)
        if plan:
            plan.observe(root / path)
    return tuple(read_json(root / path) for path in paths)


def project(root, registry, locks, taxonomy, plan):
    ensure_profile()
    if not all(isinstance(d, dict) for d in (registry, locks, taxonomy)):
        raise ValueError("Authoring, locks and taxonomy must be JSON objects")
    if registry.get("schema_version") != 1 or registry.get("profile") != PROFILE or locks.get("schema_version") != 1:
        raise ValueError("Unsupported authoring/identity/image profile")
    entries, asset_rows, rows = [], [], []
    ids, sources, paths, hashes, orders = set(), set(), set(), {}, set()
    records = registry["records"]
    if not isinstance(records, list) or not records:
        raise ValueError("Authoring registry has no record array")
    for record in records:
        if not isinstance(record, dict) or not all(isinstance(record.get(k), dict) for k in ("catalog_entry", "source", "thumbnail", "rights", "provenance")):
            raise ValueError("Malformed authoring record")
    if not isinstance(locks.get("records"), dict) or not isinstance(locks.get("legacy_review_exceptions"), dict):
        raise ValueError("Malformed identity lock")
    if not all(isinstance(v, dict) for v in locks["records"].values()):
        raise ValueError("Identity lock records must be objects")
    if set(locks.get("legacy_review_exceptions", {})) != LEGACY_FIXTURES:
        raise ValueError("Only the three unchanged baseline fixtures may have legacy rights exceptions")
    if not isinstance(records, list) or not records:
        raise ValueError("Authoring registry has no records")
    if {r["catalog_entry"]["id"] for r in records} != set(locks["records"]):
        raise ValueError("Missing/extra immutable identity references")
    evidence_path = "content/curation/met_runtime_candidates_v0.json"
    evidence_bytes = plan.observe(safe(root, evidence_path))
    evidence = {e["id"]: e for e in json.loads(evidence_bytes)["contents"]}
    for record in sorted(records, key=lambda r: (r["sort_order"], r["catalog_entry"]["id"])):
        entry = record["catalog_entry"]
        metadata.validate_entry(entry, taxonomy)
        content_id = entry["id"]
        order = record.get("sort_order")
        if isinstance(order, bool) or not isinstance(order, int) or order < 0 or order in orders:
            raise ValueError("Invalid/duplicate sort_order")
        orders.add(order)
        if content_id in ids or entry["source_id"].casefold() in sources:
            raise ValueError("Duplicate ID/source identity: " + content_id)
        ids.add(content_id); sources.add(entry["source_id"].casefold())
        source = record["source"]
        source_path = res_path(entry["path"])
        if source["path"] != source_path or source_path.casefold() in paths:
            raise ValueError("Source reference/generated path collision")
        paths.add(source_path.casefold())
        data = plan.observe(safe(root, source_path)) if source_path not in plan.targets else plan.targets[source_path].read_bytes()
        lock_record = locks["records"][content_id]
        metadata.digest(source["sha256"])
        if {"path": source_path, "source_id": entry["source_id"], "sha256": sha(data)} != {k: lock_record[k] for k in ("path", "source_id", "sha256")} or sha(data) != source["sha256"]:
            raise ValueError("Frozen content identity changed: " + content_id + "; retain old ID/artwork and introduce a reviewed revision ID")
        info = images.inspect(data, Path(source_path).suffix, legacy_svg=lock_record.get("legacy_svg", False))
        if any(source.get(k) != v for k, v in {**info, "bytes": len(data)}.items()):
            raise ValueError("Stale source dimensions/format/bytes: " + content_id)
        legacy = content_id in locks.get("legacy_review_exceptions", {})
        if legacy and record["rights"].get("status") != "APPROVED":
            if sha(canonical(entry)) != locks["legacy_review_exceptions"][content_id]:
                raise ValueError("Unapproved legacy entry was modified")
        warnings = metadata.validate_rights(record["rights"], entry["attribution"], legacy=legacy)
        if record["rights"].get("basis") == "Existing recorded isPublicDomain=true and CC0, not live reverification or new legal clearance":
            proof_id = record["rights"]["evidence_reference"].rsplit("#", 1)[-1]
            proof = evidence.get(proof_id, {})
            # Demonstration aliases may cite the same proven source, but cannot
            # apply inherited eligibility to different bytes or another URL.
            if record["rights"]["evidence_reference"] != evidence_path + "#" + proof_id or locks["records"].get(proof_id, {}).get("sha256") != sha(data) or proof.get("attribution", {}).get("source_url") != entry["attribution"].get("source_url") or proof.get("attribution", {}).get("license") != "cc0" or proof.get("attribution", {}).get("provider_rights_signal") != {"field": "isPublicDomain", "value": True} or proof.get("curation", {}).get("puzzleability_status") not in ("accepted", "accepted_curator_override"):
                raise ValueError("Existing Met provenance record is missing/ineligible: " + content_id)
        metadata.nonempty(record.get("provenance", {}).get("provider"), "provenance.provider")
        metadata.nonempty(record.get("provenance", {}).get("source_reference"), "provenance.source_reference")
        thumb = record["thumbnail"]
        thumb_path = res_path(entry.get("thumbnail_path", entry["path"]))
        if thumb["path"] != thumb_path:
            raise ValueError("Thumbnail/catalog path mismatch")
        if thumb_path != source_path:
            if thumb_path.casefold() in paths:
                raise ValueError("Generated thumbnail collision")
            paths.add(thumb_path.casefold())
        thumb_data = plan.targets[thumb_path].read_bytes() if thumb_path in plan.targets else plan.observe(safe(root, thumb_path))
        if sha(thumb_data) != metadata.digest(thumb["sha256"]):
            raise ValueError("Thumbnail hash/source mismatch: " + content_id)
        if thumb["profile"] == "legacy_frozen":
            if lock_record.get("legacy_thumbnail") != {"path": thumb_path, "sha256": sha(thumb_data)}:
                raise ValueError("Legacy thumbnail is not its immutable original derivative")
            thumb_info = images.inspect(thumb_data, Path(thumb_path).suffix)
        elif thumb["profile"] == "same_as_source":
            if not lock_record.get("legacy_svg") or thumb_path != source_path:
                raise ValueError("Only legacy SVG fixtures may use source as Gallery resource")
            thumb_info = info
        elif thumb["profile"] == images.PROFILE:
            expected, thumb_info = images.thumbnail(data)
            if expected != thumb_data:
                raise ValueError("Stale/non-deterministic thumbnail or wrong source: " + content_id)
        else:
            raise ValueError("Unknown thumbnail generation profile")
        if any(thumb.get(k) != v for k, v in {**thumb_info, "bytes": len(thumb_data)}.items()):
            raise ValueError("Stale thumbnail dimensions/bytes")
        runtime_asset = entry.get("runtime_asset")
        if runtime_asset:
            if not isinstance(runtime_asset, dict) or not all(isinstance(runtime_asset.get(k), dict) for k in ("puzzle", "thumbnail")):
                raise ValueError("runtime_asset must contain puzzle/thumbnail objects")
            for key, asset in [("puzzle", source), ("thumbnail", thumb)]:
                if any(runtime_asset[key].get(k) != asset[k] for k in ("width", "height", "bytes", "sha256")):
                    raise ValueError("Stale runtime asset metadata: " + content_id)
        if sha(data) in hashes:
            warnings.append("Duplicate source hash with " + hashes[sha(data)] + "; stable IDs are explicit, never inferred from filenames")
        hashes[sha(data)] = content_id
        entries.append(entry)
        asset_rows.append({"id": content_id, "source": source, "thumbnail": thumb})
        rows.append({"status": "UNCHANGED", "id": content_id, "title": entry["label"], "source": entry["source_id"], "rights": record["rights"], "source_sha256": sha(data), "dimensions": [info["width"], info["height"]], "generated_files": [source_path, thumb_path], "assets": {"source": source, "thumbnail": thumb}, "warnings": warnings})
    catalog = copy.deepcopy(registry["catalog_header"])
    catalog["contents"] = entries
    # Preserve original header insertion order, including fields after contents.
    catalog = {k: catalog[k] for k in registry["catalog_key_order"]}
    inventory = copy.deepcopy(registry["inventory_base"])
    inventory["artworks"] = [{"id": e["id"], "path": res_path(e["path"]), "sha256": locks["records"][e["id"]]["sha256"], "attribution": e["attribution"]} for e in entries]
    indexed = records_by_id(records)
    thumbnails = {res_path(e["thumbnail_path"]): {"path": res_path(e["thumbnail_path"]), "sha256": indexed[e["id"]]["thumbnail"]["sha256"], "attribution": e["attribution"]} for e in entries if e.get("thumbnail_path") and e["thumbnail_path"] != e["path"]}
    others = {e["path"]: e for e in inventory["other_bundled_source_assets"]}
    if set(others) & set(thumbnails):
        raise ValueError("Inventory generated file collision")
    others.update(thumbnails)
    order = registry["inventory_other_order"]
    inventory["other_bundled_source_assets"] = [others[p] for p in order] + [others[p] for p in sorted(others.keys() - set(order))]
    inventory = {k: inventory[k] for k in registry["inventory_key_order"]}
    for group in ("fonts", "other_bundled_source_assets"):
        for asset in inventory[group]:
            if asset["path"] in plan.targets:
                data = plan.targets[asset["path"]].read_bytes()
            else:
                data = plan.observe(safe(root, asset["path"]))
            if sha(data) != metadata.digest(asset["sha256"]):
                raise ValueError("Inventory hash mismatch: " + asset["path"])
    for path, value in [(CATALOG, catalog), (INVENTORY, inventory), (IDENTITY, {"manifest_version": 1, "source_sha256": {e["path"]: locks["records"][e["id"]]["sha256"] for e in sorted(entries, key=lambda e: e["path"])}}), (ASSETS, {"schema_version": 1, "profile": PROFILE, "entries": asset_rows})]:
        plan.put(path, dump(value))
    return rows


def records_by_id(records):
    return {r["catalog_entry"]["id"]: r for r in records}


def migration(root, plan):
    if (root / AUTHORING).exists() or (root / LOCKS).exists():
        raise ValueError("Already migrated; use validate/generate, not a new baseline")
    catalog = read_json(safe(root, CATALOG))
    inventory = read_json(safe(root, INVENTORY))
    indexed = {a["id"]: a for a in inventory["artworks"]}
    records, locks, exceptions = [], {}, {}
    for order, entry in enumerate(catalog["contents"]):
        path = res_path(entry["path"])
        data = plan.observe(safe(root, path))
        if indexed[entry["id"]]["sha256"] != sha(data) or indexed[entry["id"]]["attribution"] != entry["attribution"]:
            raise ValueError("Existing source/inventory mismatch; migration cannot approve changed bytes")
        legacy_svg = Path(path).suffix == ".svg"
        source = {"path": path, "sha256": sha(data), "bytes": len(data), **images.inspect(data, Path(path).suffix, legacy_svg=legacy_svg)}
        thumb_path = res_path(entry.get("thumbnail_path", entry["path"]))
        thumb_data = plan.observe(safe(root, thumb_path))
        thumb = {"path": thumb_path, "sha256": sha(thumb_data), "bytes": len(thumb_data), **images.inspect(thumb_data, Path(thumb_path).suffix, legacy_svg=legacy_svg), "profile": "same_as_source" if legacy_svg else "legacy_frozen"}
        lock_record = {"path": path, "source_id": entry["source_id"], "sha256": sha(data)}
        if legacy_svg:
            if entry["id"] not in LEGACY_FIXTURES or entry["attribution"].get("license") != "project_fixture":
                raise ValueError("New/unrecognized SVG fixture cannot acquire a legacy exception")
            lock_record["legacy_svg"] = True
            rights = {"kind": "UNKNOWN", "status": "REVIEW_REQUIRED", "reason": "Original project_fixture ownership/distribution grant is not established in repository records"}
            exceptions[entry["id"]] = sha(canonical(entry))
        else:
            if not entry["source_id"].startswith("met:") or entry["attribution"].get("license") != "cc0" or entry["attribution"].get("provider_rights_signal") != {"field": "isPublicDomain", "value": True}:
                raise ValueError("Existing nonfixture lacks recorded Met eligibility; manual review needed")
            rights = {"kind": "CC0", "status": "APPROVED", "evidence_reference": "content/curation/met_runtime_candidates_v0.json#" + entry["id"], "review": {"reviewer": "existing curator_reviewed_baseline record", "decision_reference": "content/curation/met_runtime_candidates_v0.json#" + entry["id"]}, "commercial_use": True, "redistribution": True, "derivatives": True, "basis": "Existing recorded isPublicDomain=true and CC0, not live reverification or new legal clearance"}
            lock_record["legacy_thumbnail"] = {"path": thumb_path, "sha256": sha(thumb_data)}
        locks[entry["id"]] = lock_record
        records.append({"sort_order": order, "catalog_entry": entry, "source": source, "thumbnail": thumb, "rights": rights, "provenance": {"provider": "met" if not legacy_svg else "project_fixture", "source_reference": entry["attribution"].get("source_url") or path, "date": None}})
    thumb_paths = {r["thumbnail"]["path"] for r in records if r["thumbnail"]["path"] != r["source"]["path"]}
    base = copy.deepcopy(inventory)
    base.pop("artworks")
    base["other_bundled_source_assets"] = [a for a in base["other_bundled_source_assets"] if a["path"] not in thumb_paths]
    registry = {"schema_version": 1, "profile": PROFILE, "catalog_header": {k: v for k, v in catalog.items() if k != "contents"}, "catalog_key_order": list(catalog), "inventory_base": base, "inventory_key_order": list(inventory), "inventory_other_order": [a["path"] for a in inventory["other_bundled_source_assets"]], "records": records}
    identity = {"schema_version": 1, "records": locks, "legacy_review_exceptions": exceptions}
    return registry, identity


def ingest(root, batch, registry, locks, taxonomy, plan):
    if batch.is_symlink():
        raise ValueError("Symlink intake directory is forbidden")
    batch = batch.resolve()
    if batch.is_relative_to(root):
        parent = batch
        while parent != root and not (parent / ".gdignore").is_file():
            parent = parent.parent
        if parent == root:
            raise ValueError("In-repository intake must have .gdignore on it or an ancestor; use content-intake/")
    doc = read_json(safe(batch, "batch.json"))
    if not isinstance(doc, dict) or doc.get("schema_version") != 1 or not isinstance(doc.get("items"), list) or not doc["items"]:
        raise ValueError("Expected schema_version=1 with a nonempty items array")
    current = records_by_id(registry["records"])
    items = doc["items"]
    seen = set()
    errors, statuses, intake_rows = [], {}, []
    allowed = {"id", "title", "source_file", "source_id", "creator", "provider", "source_url", "source_reference", "license", "license_url", "credit_line", "attribution_required", "provider_rights_signal", "rights", "taxonomy", "tags", "suggested_difficulty", "puzzleability", "puzzleability_review", "collection_id", "pack_id", "sort_order", "expected_source_sha256", "date"}
    from content_ingestion.analyze_puzzleability import analyze_bytes
    for item in sorted(items, key=lambda i: str(i.get("id", "")) if isinstance(i, dict) else ""):
        content_id = str(item.get("id", "<missing>")) if isinstance(item, dict) else "<malformed>"
        data = None
        try:
            if not isinstance(item, dict) or item.keys() - allowed:
                raise ValueError("Malformed metadata/unknown fields")
            metadata.stable_id(content_id)
            if content_id in seen:
                raise ValueError("Duplicate stable ID in batch")
            seen.add(content_id)
            path = safe(batch, item.get("source_file"))
            data = plan.observe(path)
            info = images.inspect(data, path.suffix)
            if item.get("expected_source_sha256") is not None and metadata.digest(item["expected_source_sha256"]) != sha(data):
                raise ValueError("Input bytes differ from approved expected_source_sha256")
            old = current.get(content_id)
            if old and sha(data) != locks["records"][content_id]["sha256"]:
                raise ValueError("Changed bytes under existing stable ID; use a new reviewed revision ID and retain old artwork for saves")
            analysis = analyze_bytes(data) if not old else None
            metrics = item.get("puzzleability", old["catalog_entry"]["puzzleability"] if old else analysis["puzzleability"])
            difficulty = old["catalog_entry"]["suggested_difficulty"] if old else analysis["suggested_difficulty"]
            entry = metadata.entry_from_input(item, taxonomy, metrics, difficulty)
            rights = item.get("rights")
            metadata.validate_rights(rights, entry["attribution"])
            provenance = {"provider": metadata.nonempty(item.get("provider"), "provider"), "source_reference": metadata.nonempty(item.get("source_reference") or item.get("source_url"), "source_reference or source_url"), "date": item.get("date")}
            quality_review = item.get("puzzleability_review")
            if analysis and analysis["review_required"]:
                if not isinstance(quality_review, dict):
                    raise ValueError("Puzzleability REVIEW_REQUIRED: " + ", ".join(analysis["review_reasons"]) + "; supply explicit reviewer/rationale")
                metadata.nonempty(quality_review.get("reviewer"), "puzzleability reviewer")
                metadata.nonempty(quality_review.get("rationale"), "puzzleability rationale")
            if old:
                entry = {**copy.deepcopy(old["catalog_entry"]), **entry}
                entry["attribution"] = {**old["catalog_entry"]["attribution"], **entry["attribution"]}
                if entry["source_id"] != old["catalog_entry"]["source_id"]:
                    raise ValueError("Existing source_id cannot change")
                record = copy.deepcopy(old)
                record.update(catalog_entry=entry, rights=rights, provenance=provenance)
                if item.get("sort_order") is not None:
                    record["sort_order"] = item["sort_order"]
                if record == old:
                    record = old
                else:
                    registry["records"][registry["records"].index(old)] = record
                statuses[content_id] = "UNCHANGED" if record == old else "UPDATED"
            else:
                suffix = ".jpg" if path.suffix == ".jpeg" else path.suffix
                source_path = "assets/catalog/puzzles/" + content_id + suffix
                thumb_path = "assets/catalog/thumbs/" + content_id + ".png"
                for target in [source_path, thumb_path]:
                    if safe(root, target, required=False).exists() or safe(root, target + ".import", required=False).exists():
                        raise ValueError("Generated file collision: " + target)
                thumb_data, thumb_info = images.thumbnail(data)
                source = {"path": source_path, "sha256": sha(data), "bytes": len(data), **info}
                thumb = {"path": thumb_path, "sha256": sha(thumb_data), "bytes": len(thumb_data), **thumb_info, "profile": images.PROFILE}
                entry["path"] = "res://" + source_path
                entry["thumbnail_path"] = "res://" + thumb_path
                record = {"sort_order": item.get("sort_order", max(r["sort_order"] for r in registry["records"]) + 1), "catalog_entry": entry, "source": source, "thumbnail": thumb, "rights": rights, "provenance": provenance, "puzzleability_analysis": analysis, "puzzleability_review": quality_review}
                registry["records"].append(record)
                locks["records"][content_id] = {"path": source_path, "source_id": entry["source_id"], "sha256": sha(data)}
                plan.put(source_path, data)
                plan.put(thumb_path, thumb_data)
                statuses[content_id] = "ADDED"
            intake_rows.append({"status": statuses[content_id], "id": content_id, "title": entry["label"], "source": entry["source_id"], "rights": rights, "source_sha256": sha(data), "dimensions": [info["width"], info["height"]], "generated_files": [record["source"]["path"], record["thumbnail"]["path"]], "assets": {"source": record["source"], "thumbnail": record["thumbnail"]}, "warnings": []})
        except (ValueError, TypeError, KeyError, OSError) as error:
            rights_report = item.get("rights") if isinstance(item, dict) and isinstance(item.get("rights"), dict) else {}
            blocked = {"status": "BLOCKED", "id": content_id, "title": item.get("title") if isinstance(item, dict) else None, "source": item.get("source_id") if isinstance(item, dict) else None, "rights": rights_report, "source_sha256": sha(data) if data is not None else None, "reason": str(error), "warnings": []}
            errors.append(blocked); intake_rows.append(blocked)
    return errors, statuses, intake_rows


def baseline(root, ref, registry):
    if not ref:
        return
    if not ref or ref.startswith("-"):
        raise ValueError("Invalid baseline ref")
    def show(path):
        result = subprocess.run(["git", "show", ref + ":" + path], cwd=root, capture_output=True, check=True)
        return json.loads(result.stdout)
    old_catalog = show(CATALOG)
    old_inventory = {a["id"]: a for a in show(INVENTORY)["artworks"]}
    current = records_by_id(registry["records"])
    for entry in old_catalog["contents"]:
        record = current.get(entry["id"])
        if not record or record["source"]["sha256"] != old_inventory[entry["id"]]["sha256"] or record["catalog_entry"]["source_id"] != entry["source_id"] or record["catalog_entry"]["path"] != entry["path"]:
            raise ValueError("Baseline content identity removed/rewritten: " + entry["id"])
        if record["rights"]["status"] != "APPROVED" and record["catalog_entry"] != entry:
            raise ValueError("Unapproved legacy baseline metadata was rewritten")
    try:
        old_locks = show(LOCKS)
    except subprocess.CalledProcessError:
        old_locks = None  # First migration base predates the authoring registry.
    if old_locks:
        for content_id, before in old_locks["records"].items():
            after = read_json(root / LOCKS)["records"].get(content_id)
            if after != before:
                raise ValueError("Immutable baseline lock changed: " + content_id)


def run(root=ROOT, command="validate", *, batch=None, dry_run=False, production_rights=False, baseline_ref=None, fail_after=None):
    root = Path(root).absolute()
    if root.is_symlink():
        raise ValueError("Symlink repository root")
    root = root.resolve()
    if baseline_ref is None and (root / ".git").exists():
        baseline_ref = "HEAD"
    report = {"schema_version": 1, "command": command, "dry_run": dry_run, "ok": False, "promoted": False, "items": [], "changes": [], "errors": []}
    writing = command in ("migrate", "ingest", "generate") and not dry_run
    @contextmanager
    def workspace():
        if writing:
            with lock(root) as control:
                if (control / "pending.json").exists():
                    raise ValueError("Interrupted transaction; run recover first")
                temp = Path(tempfile.mkdtemp(prefix="stage-", dir=control))
                try:
                    yield temp, control
                finally:
                    # A failed automatic rollback must retain its journal and
                    # backups for recover/manual review, never erase evidence.
                    if not (control / "pending.json").exists() and temp.exists():
                        shutil.rmtree(temp)
        else:
            with tempfile.TemporaryDirectory(prefix="pieceful-catalog-") as temp:
                yield Path(temp), None
    try:
        with workspace() as (stage, control):
            plan = Plan(root, stage)
            if command == "migrate":
                registry, locks = migration(root, plan)
                taxonomy = read_json(root / "content/tag_taxonomy_v1.json")
            else:
                registry, locks, taxonomy = load(root, plan)
            if command == "ingest":
                # Verify existing production before even accepting new metadata.
                existing = Plan(root, stage / "existing-check")
                existing_rows = project(root, registry, locks, taxonomy, existing)
                if existing.changes():
                    raise ValueError("Stale existing catalog/manifests: " + ", ".join(existing.changes()))
                errors, statuses, intake_rows = ingest(root, Path(batch), registry, locks, taxonomy, plan)
                report["intake"] = intake_rows
                report["errors"].extend(errors)
                if errors:
                    report["items"] = existing_rows + intake_rows
                    return report
            else:
                statuses = {}
            baseline(root, baseline_ref, registry)
            report["items"] = project(root, registry, locks, taxonomy, plan)
            for row in report["items"]:
                row["status"] = statuses.get(row["id"], "UNCHANGED")
            report["summary"] = {"catalog_entries": len(report["items"]), "source_bytes": sum(r["assets"]["source"]["bytes"] for r in report["items"]), "thumbnail_source_bytes": sum(r["assets"]["thumbnail"]["bytes"] for r in report["items"]), "estimated_thumbnail_rgba_bytes": sum(r["assets"]["thumbnail"]["width"] * r["assets"]["thumbnail"]["height"] * 4 for r in report["items"]), "rights_pending": [r["id"] for r in report["items"] if r["rights"]["status"] != "APPROVED"], "note": "Source/dimension estimates, not Godot import, PCK, GPU or transfer measurements. Current product eagerly builds Gallery cards and bundles all approved artworks."}
            if production_rights:
                blocked = [r["id"] for r in report["items"] if r["rights"]["status"] != "APPROVED"]
                if blocked:
                    raise ValueError("Production rights gate blocked: " + ", ".join(blocked))
            if command in ("migrate", "ingest", "generate"):
                plan.put(AUTHORING, dump(registry))
                plan.put(LOCKS, dump(locks))
            report["changes"] = plan.changes()
            plan.verify_inputs()
            if (root / CONTROL / "pending.json").exists():
                raise ValueError("Concurrent catalog promotion is in progress")
            if command == "validate" and report["changes"]:
                raise ValueError("Stale generated output: " + ", ".join(report["changes"]))
            if writing:
                promote(plan, control, fail_after=fail_after)
                report["promoted"] = bool(report["changes"])
            report["ok"] = True
    except (ValueError, TypeError, KeyError, OSError, subprocess.SubprocessError) as error:
        report["errors"].append({"status": "BLOCKED", "reason": str(error)})
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT)
    sub = parser.add_subparsers(dest="command", required=True)
    for command in ("migrate", "validate", "generate", "ingest"):
        p = sub.add_parser(command)
        if command == "ingest":
            p.add_argument("batch", type=Path)
        p.add_argument("--dry-run", action="store_true")
        p.add_argument("--production-rights", action="store_true")
        p.add_argument("--baseline-ref")
        p.add_argument("--report", type=Path)
    sub.add_parser("recover")
    p = sub.add_parser("example", help="Prepare a local batch using existing recorded-CC0 Met source bytes")
    p.add_argument("--output", type=Path, required=True)
    p = sub.add_parser("demo", help="Ingest and verify the example in an isolated nonshipping project")
    p.add_argument("--output", type=Path, required=True)
    p.add_argument("--godot", default=os.environ.get("GODOT_BIN", "godot"))
    args = parser.parse_args()
    if getattr(args, "report", None):
        report_path = args.report.absolute().resolve()
        if args.report.is_symlink() or report_path.suffix != ".json":
            parser.error("Reports must be JSON files, not symlinks")
        for protected in (ROOT.resolve(), args.root.resolve()):
            if report_path.is_relative_to(protected) and report_path.relative_to(protected).parts[0] not in ("build", ".pieceful-content"):
                parser.error("Reports cannot overwrite repository inputs; use build/, .pieceful-content/ or an external JSON path")
    if args.command in ("example", "demo"):
        try:
            if args.command == "example":
                example(args.root.resolve(), args.output)
            else:
                demo(args.root.resolve(), args.output, args.godot)
            return 0
        except (ValueError, OSError, subprocess.SubprocessError) as error:
            print("BLOCKED", str(error), file=sys.stderr); return 2
    if args.command == "recover":
        try:
            with lock(args.root.resolve()) as control:
                print(rollback_or_finish(args.root.resolve(), control))
            return 0
        except (OSError, ValueError) as error:
            print(str(error), file=sys.stderr); return 2
    report = run(args.root, args.command, batch=getattr(args, "batch", None), dry_run=args.dry_run, production_rights=args.production_rights, baseline_ref=args.baseline_ref)
    for row in report["items"]:
        print(row["status"], row["id"], row["title"], row["rights"].get("status", "UNKNOWN"), row["source_sha256"])
        if row["status"] in ("ADDED", "UPDATED"):
            print("FILES", ", ".join(row["generated_files"]), "source", row["dimensions"], "thumbnail", [row["assets"]["thumbnail"]["width"], row["assets"]["thumbnail"]["height"]])
        for warning in row["warnings"]:
            print("WARNING", row["id"], warning)
    for error in report["errors"]:
        print("BLOCKED", error.get("id", "catalog"), error["reason"])
    print(("VALID" if report["ok"] else "BLOCKED") + f': {len(report["changes"])} file changes; promoted={report["promoted"]}; dry_run={report["dry_run"]}')
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_bytes(dump(report))
    return 0 if report["ok"] else 2


def example(root, output):
    output = output.absolute().resolve()
    if output == root or (output.is_relative_to(root) and output.relative_to(root).parts[0] not in ("content-intake", "build", ".pieceful-content")):
        raise ValueError("Example intake must be content-intake/, build/ or outside the repository")
    doc = read_json(root / "tools/catalog_pipeline_examples/met_sample/batch.json")
    source = (root / "assets/museum/met_v0/puzzles/met_10181.jpg").read_bytes()
    if sha(source) != doc["items"][0]["expected_source_sha256"]:
        raise ValueError("Example source no longer matches approved repository bytes")
    output.mkdir(parents=True, exist_ok=True)
    for name, data in [(".gdignore", b""), ("batch.json", dump(doc)), ("met_10181.jpg", source)]:
        target = safe(output.resolve(), name, required=False)
        if target.exists() and target.read_bytes() != data:
            raise ValueError("Example refuses to overwrite operator input: " + name)
        target.write_bytes(data)
    print("Prepared offline example batch:", output)


def demo(root, output, godot):
    output = output.absolute()
    if output.exists():
        raise ValueError("Use a new demo output directory; existing files are preserved")
    if output == root or output in root.parents:
        raise ValueError("Demo must not replace the real repository")
    if output.is_relative_to(root) and output.relative_to(root).parts[0] not in ("build", ".pieceful-content"):
        raise ValueError("In-repository demo output must be build/ or .pieceful-content/")
    output.mkdir(parents=True)
    (output / ".gdignore").touch()
    project = output / "project"
    project.mkdir()
    # Explicit allowlist: no credentials, Git history, SDKs, user saves or
    # arbitrary files are copied into the diagnostic project.
    for directory in ("scripts", "assets", "content", "licenses", "addons", "cut_patterns"):
        shutil.copytree(root / directory, project / directory)
    for name in ("project.godot", "export_presets.cfg", "main.tscn"):
        shutil.copy2(root / name, project / name)
    (project / "tests").mkdir()
    shutil.copy2(root / "tests/catalog_pipeline_runtime_smoke.gd", project / "tests/catalog_pipeline_runtime_smoke.gd")
    intake = output / "intake"
    example(root, intake)
    report = run(project, "ingest", batch=intake)
    (output / "report.json").write_bytes(dump(report))
    if not report["ok"]:
        raise ValueError(str(report["errors"]))
    subprocess.run([godot, "--headless", "--path", str(project), "--editor", "--quit"], check=True)
    env = {**os.environ, "XDG_DATA_HOME": str(output / "user-data"), "XDG_CACHE_HOME": str(output / "cache"), "XDG_CONFIG_HOME": str(output / "config")}
    subprocess.run([godot, "--headless", "--path", str(project), "--script", "tests/catalog_pipeline_runtime_smoke.gd"], env=env, check=True)
    print("PASS isolated catalog example, thumbnail, immutable hash, Gallery and playable puzzle")
