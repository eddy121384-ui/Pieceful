#!/usr/bin/env python3
"""Promote curator-reviewed Met entries into a durable authoring catalog.

This is intentionally one stage before the shipped runtime catalog:
semantic taxonomy + source/rights metadata are complete, while objective
puzzleability metrics and production asset materialization remain blockers.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

MET_OBJECT_URL = "https://collectionapi.metmuseum.org/public/collection/v1/objects/{object_id}"
FACETS = ("subject", "region_culture", "mood", "visual", "style", "scene")


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def read_json(path: str | Path) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: str | Path, value: Any) -> None:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def http_json(url: str, timeout: int = 60, retries: int = 4) -> Any:
    headers = {"User-Agent": "Pieceful-Catalog-Promotion/1.0"}
    for attempt in range(retries + 1):
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            if exc.code not in (408, 409, 429, 500, 502, 503, 504) or attempt >= retries:
                detail = exc.read().decode("utf-8", errors="replace")
                raise RuntimeError(f"HTTP {exc.code} for {url}: {detail[:500]}") from exc
        except urllib.error.URLError:
            if attempt >= retries:
                raise
        time.sleep(min(20, 2 * (2 ** attempt)))
    raise RuntimeError("unreachable")


def status_for(values: list[str]) -> str:
    return "present" if values else "not_applicable"


def normalize_taxonomy(raw: dict[str, Any]) -> dict[str, Any]:
    out = {
        "category": str(raw["category"]),
        "subject": list(raw.get("subject", [])),
        "region_culture": list(raw.get("region_culture", [])),
        "mood": list(raw.get("mood", [])),
        "visual": list(raw.get("visual", [])),
        "style": list(raw.get("style", [])),
        "scene": list(raw.get("scene", [])),
    }
    statuses = raw.get("facet_status") or {}
    out["facet_status"] = {
        f: str(statuses.get(f) or status_for(out[f]))
        for f in FACETS
    }
    return out


def validate_taxonomy(t: dict[str, Any], taxonomy: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if t.get("category") not in taxonomy["primary_categories"]:
        errors.append("unknown category")

    for f in FACETS:
        vals = t.get(f)
        if not isinstance(vals, list):
            errors.append(f"{f} must be array")
            continue
        rule = taxonomy["facet_rules"][f]
        if len(vals) > int(rule["max_values"]):
            errors.append(f"{f} exceeds max_values")
        status = (t.get("facet_status") or {}).get(f)
        if status not in taxonomy["completeness_contract"]["published_allowed_status_values"]:
            errors.append(f"{f} status is not publishable: {status}")
        if status == "present" and not vals:
            errors.append(f"{f} is present but empty")
        if status != "present" and vals:
            errors.append(f"{f} has values while status={status}")
        if rule.get("published_must_be_present") and status != "present":
            errors.append(f"{f} must be present")
        if f in taxonomy["controlled_values"]:
            allowed = set(taxonomy["controlled_values"][f])
            for v in vals:
                if v not in allowed:
                    errors.append(f"unknown {f} value: {v}")
    return errors


def build_weighted_tags(t: dict[str, Any], taxonomy: dict[str, Any]) -> list[dict[str, Any]]:
    weights = taxonomy["weighted_tags"]["default_weight_guidance"]
    ordered: list[tuple[str, float]] = [(t["category"], float(weights["category"]))]
    for f in FACETS:
        for value in t[f]:
            ordered.append((value, float(weights[f])))
    seen: set[str] = set()
    tags: list[dict[str, Any]] = []
    for tag_id, weight in ordered:
        if tag_id in seen:
            continue
        seen.add(tag_id)
        tags.append({"id": tag_id, "weight": weight})
    return tags


def met_entry(source: dict[str, Any], curated: dict[str, Any], taxonomy: dict[str, Any],
              provider: dict[str, Any], *, fetcher=http_json) -> dict[str, Any]:
    object_id = int(source.get("object_id") or str(source["id"]).split("_", 1)[1])
    meta = fetcher(MET_OBJECT_URL.format(object_id=object_id))
    if meta.get("isPublicDomain") is not True:
        raise RuntimeError(f"{source['id']} lost explicit public-domain eligibility")
    image_url = meta.get("primaryImageSmall") or meta.get("primaryImage")
    if not image_url:
        raise RuntimeError(f"{source['id']} has no primary image")

    t = normalize_taxonomy(curated["taxonomy"])
    errors = validate_taxonomy(t, taxonomy)
    if errors:
        raise RuntimeError(f"{source['id']} taxonomy invalid: {'; '.join(errors)}")

    creator = str(meta.get("artistDisplayName") or "").strip()
    source_url = str(meta.get("objectURL") or "").strip()
    title = str(meta.get("title") or source["id"]).strip() or source["id"]

    return {
        "id": source["id"],
        "label": title,
        "source_id": f"met:{object_id}",
        "provider": "met",
        "source_item_id": str(object_id),
        "category": t["category"],
        "subject": t["subject"],
        "region_culture": t["region_culture"],
        "mood": t["mood"],
        "visual": t["visual"],
        "style": t["style"],
        "scene": t["scene"],
        "facet_status": t["facet_status"],
        "tags": build_weighted_tags(t, taxonomy),
        "attribution": {
            "creator": creator,
            "license": "cc0",
            "license_url": provider["rights_policy_url"],
            "source_url": source_url,
            "credit_line": str(meta.get("creditLine") or ""),
            "attribution_required": False,
            "provider_rights_signal": {
                "field": "isPublicDomain",
                "value": True,
            },
        },
        "asset": {
            "thumbnail_url": image_url,
            "puzzle_candidate_url": image_url,
            "production_path": None,
            "image_version": 0,
        },
        "curation": {
            "authority": "curator_reviewed_baseline",
            "ingestion_query": source.get("ingestion_query"),
            "semantic_status": "complete",
        },
        "promotion": {
            "status": "blocked",
            "blockers": [
                "puzzleability_missing",
                "production_asset_not_materialized",
            ],
        },
        "puzzleability": None,
        "suggested_difficulty": None,
    }


def build_catalog(source_doc: dict[str, Any], gold_doc: dict[str, Any], taxonomy: dict[str, Any],
                  providers: dict[str, Any], *, fetcher=http_json, limit: int = 0) -> dict[str, Any]:
    source_entries = list(source_doc.get("entries", []))
    if limit > 0:
        source_entries = source_entries[:limit]
    gold = {e["id"]: e for e in gold_doc.get("entries", [])}
    provider = providers["providers"]["met"]

    entries: list[dict[str, Any]] = []
    for i, source in enumerate(source_entries, start=1):
        item_id = source["id"]
        print(f"[{i}/{len(source_entries)}] promote {item_id}", flush=True)
        if item_id not in gold:
            raise RuntimeError(f"Missing curator taxonomy for {item_id}")
        entries.append(met_entry(source, gold[item_id], taxonomy, provider, fetcher=fetcher))

    return {
        "schema_version": 1,
        "kind": "pieceful_curated_authoring_catalog",
        "generated_at": utc_now(),
        "taxonomy_version": taxonomy["taxonomy_version"],
        "provider": "met",
        "catalog_status": "curated_needs_puzzleability",
        "summary": {
            "total": len(entries),
            "semantic_complete": len(entries),
            "rights_verified": len(entries),
            "runtime_publishable": 0,
            "blocked_on_puzzleability": len(entries),
            "blocked_on_production_asset": len(entries),
        },
        "contents": entries,
    }


def self_test(args: argparse.Namespace) -> int:
    taxonomy = read_json(args.taxonomy)
    providers = read_json(args.providers)
    source = {
        "schema_version": 1,
        "entries": [{"id": "met_437133", "object_id": 437133, "ingestion_query": "landscape"}],
    }
    gold = {
        "entries": [{
            "id": "met_437133",
            "taxonomy": {
                "category": "nature",
                "subject": ["landscape", "trees"],
                "region_culture": [],
                "mood": ["calm"],
                "visual": ["clear_regions", "detailed"],
                "style": ["painting", "oil_painting"],
                "scene": ["outdoor"],
                "facet_status": {
                    "subject": "present",
                    "region_culture": "not_applicable",
                    "mood": "present",
                    "visual": "present",
                    "style": "present",
                    "scene": "present",
                },
            },
        }],
    }
    fixture = {
        "objectID": 437133,
        "isPublicDomain": True,
        "primaryImageSmall": "https://images.metmuseum.org/CRDImages/ep/web-large/DT1567.jpg",
        "title": "Wheat Field with Cypresses",
        "artistDisplayName": "Vincent van Gogh",
        "objectURL": "https://www.metmuseum.org/art/collection/search/437133",
        "creditLine": "Purchase",
    }
    catalog = build_catalog(source, gold, taxonomy, providers, fetcher=lambda _: fixture)
    entry = catalog["contents"][0]
    assert entry["id"] == "met_437133"
    assert entry["attribution"]["license"] == "cc0"
    assert entry["promotion"]["status"] == "blocked"
    assert entry["promotion"]["blockers"] == ["puzzleability_missing", "production_asset_not_materialized"]
    assert entry["puzzleability"] is None
    assert entry["suggested_difficulty"] is None
    assert entry["facet_status"]["region_culture"] == "not_applicable"
    assert any(t["id"] == "nature" and t["weight"] == 1.0 for t in entry["tags"])
    print("PASS curated catalog promotion self-test")
    return 0


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--source", default="content/curation/met_curator_sample_v0.json")
    p.add_argument("--gold", default="content/curation/met_gold_set_v0.json")
    p.add_argument("--taxonomy", default="content/tag_taxonomy_v1.json")
    p.add_argument("--providers", default="content/source_providers_v1.json")
    p.add_argument("--output", default="content/curation/met_curated_catalog_v0.json")
    p.add_argument("--limit", type=int, default=0)
    p.add_argument("--self-test", action="store_true")
    return p.parse_args()


def main() -> int:
    args = parse_args()
    if args.self_test:
        return self_test(args)
    source = read_json(args.source)
    gold = read_json(args.gold)
    taxonomy = read_json(args.taxonomy)
    providers = read_json(args.providers)
    catalog = build_catalog(source, gold, taxonomy, providers, limit=args.limit)
    write_json(args.output, catalog)
    print(json.dumps(catalog["summary"], ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
