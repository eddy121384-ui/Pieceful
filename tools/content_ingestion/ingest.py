#!/usr/bin/env python3
"""Pieceful Content Ingestion v0.

Downloads rights-safe museum image candidates and emits an authoring manifest.
Runtime catalog publication remains a separate, validated step.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

MET_SEARCH_URL = "https://collectionapi.metmuseum.org/public/collection/v1.1/search"
MET_OBJECT_URL = "https://collectionapi.metmuseum.org/public/collection/v1/objects/{object_id}"
MET_LICENSE_URL = "https://www.metmuseum.org/policies/image-resources"
FACETS = ("subject", "region_culture", "mood", "visual", "style", "scene")
USER_AGENT = "PiecefulContentIngestion/0.1 (+https://github.com/eddy121384-ui/Pieceful)"


def _utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _http_json(url: str, timeout: float = 30.0) -> dict[str, Any]:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.load(response)


def _download(url: str, destination: Path, timeout: float = 60.0) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    tmp = destination.with_suffix(destination.suffix + ".tmp")
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response, tmp.open("wb") as out:
            while True:
                chunk = response.read(1024 * 1024)
                if not chunk:
                    break
                out.write(chunk)
        if tmp.stat().st_size == 0:
            raise RuntimeError(f"downloaded empty file from {url}")
        tmp.replace(destination)
    finally:
        if tmp.exists():
            tmp.unlink(missing_ok=True)


def normalize_met_object(payload: dict[str, Any]) -> dict[str, Any] | None:
    """Return a Pieceful authoring candidate, or None if rights/image gates fail."""
    object_id = payload.get("objectID")
    if not isinstance(object_id, int) or object_id <= 0:
        return None
    if payload.get("isPublicDomain") is not True:
        return None

    game_url = str(payload.get("primaryImageSmall") or "").strip()
    original_url = str(payload.get("primaryImage") or "").strip()
    if not game_url:
        game_url = original_url
    if not game_url:
        return None

    title = str(payload.get("title") or f"Met object {object_id}").strip()
    creator = str(payload.get("artistDisplayName") or "").strip() or "Unknown / not supplied by source"
    source_url = str(payload.get("objectURL") or "").strip()
    if not source_url:
        source_url = f"https://www.metmuseum.org/art/collection/search/{object_id}"

    return {
        "id": f"met_{object_id}",
        "provider": "met",
        "source_item_id": str(object_id),
        "title": title,
        "creator": creator,
        "source_url": source_url,
        "rights": {
            "license": "cc0",
            "license_url": MET_LICENSE_URL,
            "commercial_use_allowed": True,
            "attribution_required": False,
            "provider_rights_signal": {
                "field": "isPublicDomain",
                "value": True,
            },
        },
        "asset": {
            "remote_original_url": original_url,
            "remote_game_candidate_url": game_url,
            "local_game_candidate_path": "",
        },
        "source_metadata": {
            "artist_display_name": str(payload.get("artistDisplayName") or ""),
            "artist_nationality": str(payload.get("artistNationality") or ""),
            "culture": str(payload.get("culture") or ""),
            "object_date": str(payload.get("objectDate") or ""),
            "medium": str(payload.get("medium") or ""),
            "classification": str(payload.get("classification") or ""),
            "department": str(payload.get("department") or ""),
            "credit_line": str(payload.get("creditLine") or ""),
            "object_name": str(payload.get("objectName") or ""),
        },
        "taxonomy_draft": {
            "status": "unresolved",
            "category": None,
            "subject": [],
            "region_culture": [],
            "mood": [],
            "visual": [],
            "style": [],
            "scene": [],
            "facet_status": {facet: "unresolved" for facet in FACETS},
            "puzzleability": None,
            "suggested_difficulty": None,
        },
    }


def _search_met_ids(query: str, limit: int, offset: int = 0) -> list[int]:
    params = urllib.parse.urlencode(
        {
            "q": query,
            "hasImages": "true",
            "limit": max(1, min(limit, 500)),
            "offset": max(0, offset),
        }
    )
    payload = _http_json(f"{MET_SEARCH_URL}?{params}")
    ids = payload.get("objectIDs") or []
    return [value for value in ids if isinstance(value, int)]


def _load_plan(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        plan = json.load(handle)
    if plan.get("provider") != "met":
        raise ValueError("Content Ingestion v0 currently implements provider=met only")
    queries = plan.get("queries")
    if not isinstance(queries, list) or not queries:
        raise ValueError("plan.queries must be a non-empty array")
    for row in queries:
        if not isinstance(row, dict) or not str(row.get("query") or "").strip():
            raise ValueError("each query row needs a non-empty query")
        target = row.get("target")
        if not isinstance(target, int) or target <= 0:
            raise ValueError("each query row needs target > 0")
    return plan


def ingest_met(
    plan: dict[str, Any],
    staging_root: Path,
    metadata_only: bool,
    candidates_per_query: int,
    request_delay: float,
) -> dict[str, Any]:
    entries: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    seen_asset_urls: set[str] = set()
    query_results: list[dict[str, Any]] = []

    for row in plan["queries"]:
        query = str(row["query"]).strip()
        target = int(row["target"])
        accepted = 0
        inspected = 0
        errors = 0

        try:
            object_ids = _search_met_ids(query, candidates_per_query)
        except (OSError, ValueError, urllib.error.URLError) as exc:
            print(f"WARN search failed for {query!r}: {exc}", file=sys.stderr)
            query_results.append(
                {"query": query, "target": target, "accepted": 0, "inspected": 0, "errors": 1}
            )
            continue

        for object_id in object_ids:
            if accepted >= target:
                break
            candidate_id = f"met_{object_id}"
            if candidate_id in seen_ids:
                continue
            inspected += 1
            if request_delay > 0:
                time.sleep(request_delay)
            try:
                payload = _http_json(MET_OBJECT_URL.format(object_id=object_id))
                candidate = normalize_met_object(payload)
            except (OSError, ValueError, urllib.error.URLError) as exc:
                errors += 1
                print(f"WARN object {object_id} failed: {exc}", file=sys.stderr)
                continue
            if candidate is None:
                continue

            candidate_asset_url = candidate["asset"]["remote_game_candidate_url"]
            if candidate_asset_url in seen_asset_urls:
                print(f"skipped duplicate image asset for {candidate_id}")
                continue

            local_rel = Path("processed") / "met" / f"{candidate_id}.jpg"
            candidate["asset"]["local_game_candidate_path"] = local_rel.as_posix()
            candidate["ingestion_query"] = query

            if not metadata_only:
                try:
                    _download(
                        candidate["asset"]["remote_game_candidate_url"],
                        staging_root / local_rel,
                    )
                except (OSError, RuntimeError, urllib.error.URLError) as exc:
                    errors += 1
                    print(f"WARN image {candidate_id} failed: {exc}", file=sys.stderr)
                    continue

            seen_ids.add(candidate_id)
            seen_asset_urls.add(candidate_asset_url)
            entries.append(candidate)
            accepted += 1
            print(f"accepted {candidate_id}: {candidate['title']}")

        query_results.append(
            {
                "query": query,
                "target": target,
                "accepted": accepted,
                "inspected": inspected,
                "errors": errors,
            }
        )

    return {
        "schema_version": 1,
        "kind": "pieceful_content_ingestion_manifest",
        "provider": "met",
        "generated_at": _utc_now(),
        "taxonomy_status": "authoring_unresolved",
        "download_mode": "metadata_only" if metadata_only else "game_candidate",
        "plan_version": int(plan.get("plan_version", 1)),
        "query_results": query_results,
        "entries": entries,
    }


def _default_manifest_path(staging_root: Path) -> Path:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    return staging_root / "manifests" / f"met_sample_{stamp}.json"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Pieceful Content Ingestion v0")
    parser.add_argument(
        "--plan",
        type=Path,
        default=Path("tools/content_ingestion/sample_plan_v0.json"),
        help="JSON query plan. v0 supports The Met only.",
    )
    parser.add_argument(
        "--staging-root",
        type=Path,
        default=Path(".pieceful-content"),
        help="Ignored local workspace for downloaded assets and generated manifests.",
    )
    parser.add_argument("--manifest", type=Path, help="Optional explicit manifest output path.")
    parser.add_argument(
        "--metadata-only",
        action="store_true",
        help="Fetch metadata and rights only; do not download image binaries.",
    )
    parser.add_argument(
        "--candidates-per-query",
        type=int,
        default=100,
        help="Maximum search candidates inspected per query (1..500).",
    )
    parser.add_argument(
        "--request-delay",
        type=float,
        default=0.05,
        help="Delay between object metadata requests in seconds.",
    )
    args = parser.parse_args(argv)

    try:
        plan = _load_plan(args.plan)
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"ERROR invalid plan: {exc}", file=sys.stderr)
        return 2

    if args.candidates_per_query < 1 or args.candidates_per_query > 500:
        print("ERROR --candidates-per-query must be between 1 and 500", file=sys.stderr)
        return 2
    if args.request_delay < 0:
        print("ERROR --request-delay cannot be negative", file=sys.stderr)
        return 2

    staging_root = args.staging_root
    staging_root.mkdir(parents=True, exist_ok=True)
    manifest = ingest_met(
        plan=plan,
        staging_root=staging_root,
        metadata_only=args.metadata_only,
        candidates_per_query=args.candidates_per_query,
        request_delay=args.request_delay,
    )

    manifest_path = args.manifest or _default_manifest_path(staging_root)
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {len(manifest['entries'])} entries to {manifest_path}")

    if not manifest["entries"]:
        print("ERROR no rights-safe image candidates were accepted", file=sys.stderr)
        return 3
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
