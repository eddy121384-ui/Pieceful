"""Project the approved authoring registry without rewriting any content identity."""
import copy
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))
from catalog_pipeline_lib.pipeline import run as validate_catalog


def projection(root=ROOT):
    validation = validate_catalog(root, "validate")
    if not validation["ok"]:
        raise ValueError("Authoritative catalog failed validation")
    profile = json.loads((root / "poki/profile.json").read_text())
    registry = json.loads((root / "content/curation/catalog_authoring_v1.json").read_text())
    records = {r["catalog_entry"]["id"]: r for r in registry["records"]}
    evidence = json.loads((root / "content/curation/met_runtime_candidates_v0.json").read_text())
    candidates = {r["id"]: r for r in evidence["contents"]}
    selected, hashes, artworks = [], {}, []
    for identifier in profile["artwork_ids"]:
        record = records[identifier]
        entry, rights = record["catalog_entry"], record["rights"]
        attribution = entry["attribution"]
        if not (rights["status"] == "APPROVED" and rights["kind"] == "CC0"
                and all(rights[k] for k in ("commercial_use", "redistribution", "derivatives"))
                and rights.get("review") and attribution["license"].lower() == "cc0"
                and attribution["provider_rights_signal"] == {"field": "isPublicDomain", "value": True}
                and identifier in candidates and entry["source_id"].startswith("met:")
                and all(candidates[identifier]["attribution"][k] == attribution[k]
                        for k in ("license", "license_url", "source_url", "provider_rights_signal"))
                and candidates[identifier]["curation"]["authority"] == "curator_reviewed_baseline"
                and candidates[identifier]["curation"]["puzzleability_status"] in ("accepted", "accepted_curator_override")):
            raise ValueError("Unapproved or unsupported artwork: " + identifier)
        for key in ("source", "thumbnail"):
            asset = record[key]
            actual = hashlib.sha256((root / asset["path"]).read_bytes()).hexdigest()
            if actual != asset["sha256"]:
                raise ValueError("Artwork/thumbnail bytes changed: " + identifier)
        selected.append(copy.deepcopy(entry))
        hashes[entry["path"]] = record["source"]["sha256"]
        artworks.append({"id": identifier, "source_id": entry["source_id"],
                         "sha256": record["source"]["sha256"], "thumbnail_sha256": record["thumbnail"]["sha256"],
                         "rights": copy.deepcopy(rights), "attribution": copy.deepcopy(attribution),
                         "puzzleability": copy.deepcopy(entry["puzzleability"]),
                         "suggested_difficulty": entry["suggested_difficulty"]})
    if len(set(profile["artwork_ids"])) != len(selected) or len(set(hashes.values())) != len(selected):
        raise ValueError("Repeated content ID or original artwork bytes")
    if len(selected) < profile["minimum_distinct_artworks"] or profile["featured_content_id"] not in profile["artwork_ids"]:
        raise ValueError("Insufficient content or missing featured artwork")
    catalog = copy.deepcopy(registry["catalog_header"])
    catalog["contents"] = selected
    themes = []
    for rule in profile["themes"]:
        ids = [e["id"] for e in selected if set(e.get(rule["field"], [])) & set(rule["values"])]
        if ids:
            themes.append({"id": rule["id"], "label": rule["label"], "artwork_ids": ids})
    return {"catalog": catalog, "identity": {"manifest_version": 1, "source_sha256": hashes},
            "profile": profile, "manifest": {"schema_version": 1, "profile": profile["profile"],
            "distinct_artwork_count": len(selected), "artworks": artworks, "themes": themes,
            "rights_basis": "Individually verified existing registry/evidence; no new legal clearance or live provider reverification"}}


if __name__ == "__main__":
    result = projection()
    print(json.dumps(result["manifest"], ensure_ascii=False, indent=2))
