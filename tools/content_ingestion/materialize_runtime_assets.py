#!/usr/bin/env python3
"""Materialize Pieceful runtime assets from curator-approved museum candidates.

Issue #9 / Met v0 vertical slice:
- reads the 35 curator-approved candidates;
- re-fetches current Met object metadata and re-checks public-domain rights;
- prefers the Met original image and falls back to the approved candidate URL;
- writes normalized JPEG puzzle + thumbnail derivatives into the bundled app;
- records dimensions, byte size and SHA-256;
- appends/replaces those entries in content/catalog_v1.json.

This is intentionally a small bundled starter-library slice, not the eventual
object-storage/CDN implementation.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

from PIL import Image, ImageOps

MET_OBJECT_URL = "https://collectionapi.metmuseum.org/public/collection/v1/objects/{object_id}"
DEFAULT_CANDIDATES = "content/curation/met_runtime_candidates_v0.json"
DEFAULT_CATALOG = "content/catalog_v1.json"
DEFAULT_ASSET_ROOT = "assets/museum/met_v0"
DEFAULT_MANIFEST = "content/runtime/met_v0_manifest.json"

PUZZLE_LONG_EDGE = 1800
THUMB_LONG_EDGE = 420
PUZZLE_QUALITY = 88
THUMB_QUALITY = 82

Image.MAX_IMAGE_PIXELS = 200_000_000


def read_json(path: str | Path) -> Any:
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: str | Path, value: Any) -> None:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def http_bytes(url: str, *, timeout: int = 120, retries: int = 4) -> bytes:
    headers = {"User-Agent": "Pieceful-Runtime-Asset-Materializer/1.0"}
    for attempt in range(retries + 1):
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                return response.read()
        except urllib.error.HTTPError as exc:
            if exc.code not in (408, 409, 429, 500, 502, 503, 504) or attempt >= retries:
                detail = exc.read().decode("utf-8", errors="replace")
                raise RuntimeError(f"HTTP {exc.code} for {url}: {detail[:500]}") from exc
        except urllib.error.URLError:
            if attempt >= retries:
                raise
        time.sleep(min(24, 2 * (2 ** attempt)))
    raise RuntimeError("unreachable")


def http_json(url: str, *, timeout: int = 60, retries: int = 4) -> Any:
    return json.loads(http_bytes(url, timeout=timeout, retries=retries).decode("utf-8"))


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def normalized_image(raw: bytes) -> Image.Image:
    with Image.open(io.BytesIO(raw)) as source:
        image = ImageOps.exif_transpose(source)
        if image.mode in ("RGBA", "LA"):
            background = Image.new("RGB", image.size, "white")
            alpha = image.getchannel("A")
            background.paste(image.convert("RGB"), mask=alpha)
            image = background
        else:
            image = image.convert("RGB")
        return image.copy()


def resized_copy(image: Image.Image, long_edge: int) -> Image.Image:
    if max(image.size) <= long_edge:
        return image.copy()
    scale = long_edge / float(max(image.size))
    size = (
        max(1, round(image.width * scale)),
        max(1, round(image.height * scale)),
    )
    return image.resize(size, Image.Resampling.LANCZOS)


def encode_jpeg(image: Image.Image, *, quality: int) -> bytes:
    buffer = io.BytesIO()
    image.save(
        buffer,
        format="JPEG",
        quality=quality,
        optimize=True,
        progressive=True,
        subsampling="4:2:0",
    )
    return buffer.getvalue()


def write_asset(path: Path, data: bytes) -> dict[str, Any]:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    with Image.open(io.BytesIO(data)) as im:
        width, height = im.size
    return {
        "path": path.as_posix(),
        "width": int(width),
        "height": int(height),
        "bytes": len(data),
        "sha256": sha256_bytes(data),
    }


def display_creator(value: Any) -> str:
    text = str(value or "").strip()
    return text if text else "Unidentified artist"


def verify_candidate(entry: dict[str, Any]) -> None:
    if entry.get("promotion", {}).get("status") == "excluded":
        raise RuntimeError(f"{entry.get('id')} is excluded and must not materialize")
    if entry.get("puzzleability") is None:
        raise RuntimeError(f"{entry.get('id')} has no puzzleability metrics")
    if str(entry.get("suggested_difficulty") or "") not in ("relaxed", "standard", "hard"):
        raise RuntimeError(f"{entry.get('id')} has invalid suggested difficulty")
    attribution = entry.get("attribution") or {}
    if attribution.get("license") != "cc0":
        raise RuntimeError(f"{entry.get('id')} is not approved CC0 content")
    signal = attribution.get("provider_rights_signal") or {}
    if signal.get("field") != "isPublicDomain" or signal.get("value") is not True:
        raise RuntimeError(f"{entry.get('id')} lacks explicit Met public-domain evidence")


def runtime_catalog_entry(
    candidate: dict[str, Any],
    meta: dict[str, Any],
    puzzle_asset: dict[str, Any],
    thumb_asset: dict[str, Any],
    *,
    source_image_url: str,
) -> dict[str, Any]:
    creator = display_creator((candidate.get("attribution") or {}).get("creator"))
    source_url = str((candidate.get("attribution") or {}).get("source_url") or meta.get("objectURL") or "")
    attribution = json.loads(json.dumps(candidate.get("attribution") or {}))
    attribution["creator"] = creator
    attribution["source_url"] = source_url

    result = {
        "id": candidate["id"],
        "label": candidate["label"],
        "source_id": candidate["source_id"],
        "path": "res://" + puzzle_asset["path"],
        "thumbnail_path": "res://" + thumb_asset["path"],
        "category": candidate["category"],
        "subject": candidate["subject"],
        "region_culture": candidate["region_culture"],
        "mood": candidate["mood"],
        "visual": candidate["visual"],
        "style": candidate["style"],
        "scene": candidate["scene"],
        "facet_status": candidate["facet_status"],
        "puzzleability": candidate["puzzleability"],
        "suggested_difficulty": candidate["suggested_difficulty"],
        "tags": candidate["tags"],
        "attribution": attribution,
        "runtime_asset": {
            "provider": "met",
            "source_item_id": str(candidate["source_item_id"]),
            "source_image_url": source_image_url,
            "image_version": 1,
            "puzzle": {
                "width": puzzle_asset["width"],
                "height": puzzle_asset["height"],
                "bytes": puzzle_asset["bytes"],
                "sha256": puzzle_asset["sha256"],
            },
            "thumbnail": {
                "width": thumb_asset["width"],
                "height": thumb_asset["height"],
                "bytes": thumb_asset["bytes"],
                "sha256": thumb_asset["sha256"],
            },
        },
    }
    return result


def materialize(
    candidates_doc: dict[str, Any],
    catalog_doc: dict[str, Any],
    *,
    asset_root: str | Path,
    fetch_json=http_json,
    fetch_bytes=http_bytes,
    limit: int = 0,
) -> tuple[dict[str, Any], dict[str, Any]]:
    candidates = list(candidates_doc.get("contents", []))
    expected = int((candidates_doc.get("summary") or {}).get("candidate_count", len(candidates)))
    if expected != len(candidates):
        raise RuntimeError(f"candidate_count={expected} but contents={len(candidates)}")
    if limit > 0:
        candidates = candidates[:limit]

    root = Path(asset_root)
    puzzle_dir = root / "puzzles"
    thumb_dir = root / "thumbs"

    existing = {
        str(entry.get("id")): entry
        for entry in catalog_doc.get("contents", [])
        if isinstance(entry, dict)
    }
    original_order = [
        str(entry.get("id"))
        for entry in catalog_doc.get("contents", [])
        if isinstance(entry, dict)
    ]

    manifest_rows: list[dict[str, Any]] = []
    materialized_entries: list[dict[str, Any]] = []

    for index, candidate in enumerate(candidates, start=1):
        verify_candidate(candidate)
        item_id = candidate["id"]
        object_id = int(candidate["source_item_id"])
        print(f"[{index}/{len(candidates)}] materialize {item_id}", flush=True)

        meta = fetch_json(MET_OBJECT_URL.format(object_id=object_id))
        if meta.get("isPublicDomain") is not True:
            raise RuntimeError(f"{item_id} no longer reports isPublicDomain=true")
        source_url = str(meta.get("primaryImage") or candidate.get("asset", {}).get("puzzle_candidate_url") or "")
        if not source_url:
            raise RuntimeError(f"{item_id} has no source image URL")

        raw = fetch_bytes(source_url)
        image = normalized_image(raw)
        if min(image.size) < 240:
            raise RuntimeError(f"{item_id} source image is too small: {image.size}")

        puzzle_image = resized_copy(image, PUZZLE_LONG_EDGE)
        thumb_image = resized_copy(image, THUMB_LONG_EDGE)
        puzzle_bytes = encode_jpeg(puzzle_image, quality=PUZZLE_QUALITY)
        thumb_bytes = encode_jpeg(thumb_image, quality=THUMB_QUALITY)

        puzzle_path = puzzle_dir / f"{item_id}.jpg"
        thumb_path = thumb_dir / f"{item_id}.jpg"
        puzzle_asset = write_asset(puzzle_path, puzzle_bytes)
        thumb_asset = write_asset(thumb_path, thumb_bytes)

        entry = runtime_catalog_entry(
            candidate,
            meta,
            puzzle_asset,
            thumb_asset,
            source_image_url=source_url,
        )
        existing[item_id] = entry
        materialized_entries.append(entry)
        manifest_rows.append({
            "id": item_id,
            "source_item_id": str(object_id),
            "source_url": source_url,
            "source_width": int(image.width),
            "source_height": int(image.height),
            "puzzle": puzzle_asset,
            "thumbnail": thumb_asset,
        })

    new_contents: list[dict[str, Any]] = []
    materialized_ids = {entry["id"] for entry in materialized_entries}

    # Preserve existing built-in/catalog order, replacing any already-materialized
    # museum entries in place. New museum items are appended in curated order.
    for content_id in original_order:
        if content_id in materialized_ids:
            continue
        entry = existing.get(content_id)
        if entry is not None:
            new_contents.append(entry)
    new_contents.extend(materialized_entries)

    updated_catalog = json.loads(json.dumps(catalog_doc))
    updated_catalog["contents"] = new_contents
    updated_catalog["metadata_version"] = max(3, int(updated_catalog.get("metadata_version", 0)))
    updated_catalog["runtime_asset_version"] = 1

    manifest = {
        "schema_version": 1,
        "kind": "pieceful_runtime_asset_manifest",
        "provider": "met",
        "asset_version": 1,
        "puzzle_long_edge": PUZZLE_LONG_EDGE,
        "thumbnail_long_edge": THUMB_LONG_EDGE,
        "jpeg_quality": {
            "puzzle": PUZZLE_QUALITY,
            "thumbnail": THUMB_QUALITY,
        },
        "materialized_count": len(manifest_rows),
        "entries": manifest_rows,
    }
    return updated_catalog, manifest


def validate_outputs(
    catalog: dict[str, Any],
    manifest: dict[str, Any],
    *,
    expected_count: int,
    root: Path = Path("."),
) -> None:
    rows = manifest.get("entries", [])
    if len(rows) != expected_count:
        raise RuntimeError(f"manifest has {len(rows)} rows, expected {expected_count}")

    by_id = {
        str(entry.get("id")): entry
        for entry in catalog.get("contents", [])
        if isinstance(entry, dict)
    }
    for row in rows:
        item_id = row["id"]
        if item_id not in by_id:
            raise RuntimeError(f"{item_id} missing from runtime catalog")
        entry = by_id[item_id]
        for field in ("path", "thumbnail_path"):
            resource_path = str(entry.get(field) or "")
            if not resource_path.startswith("res://"):
                raise RuntimeError(f"{item_id} {field} is not res://")
            local = root / resource_path.removeprefix("res://")
            if not local.is_file():
                raise RuntimeError(f"{item_id} missing asset file {local}")
        runtime = entry.get("runtime_asset") or {}
        if runtime.get("image_version") != 1:
            raise RuntimeError(f"{item_id} bad runtime image version")
        if len(str(runtime.get("puzzle", {}).get("sha256", ""))) != 64:
            raise RuntimeError(f"{item_id} missing puzzle sha256")
        if not str((entry.get("attribution") or {}).get("creator") or "").strip():
            raise RuntimeError(f"{item_id} has empty creator display")
        if (entry.get("attribution") or {}).get("license") != "cc0":
            raise RuntimeError(f"{item_id} lost cc0 attribution")


def synthetic_jpeg(size: tuple[int, int] = (1200, 800)) -> bytes:
    image = Image.new("RGB", size, (210, 180, 140))
    for x in range(0, size[0], 80):
        for y in range(0, size[1], 80):
            if (x // 80 + y // 80) % 2 == 0:
                for xx in range(x, min(x + 40, size[0])):
                    for yy in range(y, min(y + 40, size[1])):
                        image.putpixel((xx, yy), (70, 120, 190))
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=90)
    return buffer.getvalue()


def self_test(tmp_root: Path) -> int:
    candidate = {
        "summary": {"candidate_count": 1},
        "contents": [{
            "id": "met_1",
            "label": "Fixture",
            "source_id": "met:1",
            "provider": "met",
            "source_item_id": "1",
            "category": "nature",
            "subject": ["landscape"],
            "region_culture": [],
            "mood": ["calm"],
            "visual": ["clear_regions"],
            "style": ["painting"],
            "scene": ["outdoor"],
            "facet_status": {
                "subject": "present",
                "region_culture": "not_applicable",
                "mood": "present",
                "visual": "present",
                "style": "present",
                "scene": "present",
            },
            "puzzleability": {
                "score": 0.8,
                "clear_regions": 0.7,
                "repetitive_texture": 0.2,
                "flat_area": 0.2,
                "landmark_density": 0.7,
                "color_variety": 0.6,
                "edge_density": 0.2,
                "gradient_area": 0.4,
            },
            "suggested_difficulty": "standard",
            "tags": [{"id": "nature", "weight": 1.0}],
            "attribution": {
                "creator": "",
                "license": "cc0",
                "source_url": "https://example.test/met/1",
                "attribution_required": False,
                "provider_rights_signal": {"field": "isPublicDomain", "value": True},
            },
            "asset": {"puzzle_candidate_url": "https://example.test/small.jpg"},
            "promotion": {"status": "blocked", "blockers": ["production_asset_not_materialized"]},
        }],
    }
    catalog = {
        "schema_version": 1,
        "metadata_version": 2,
        "tag_schema_version": 2,
        "taxonomy_version": 1,
        "contents": [{
            "id": "garden",
            "label": "Garden",
            "source_id": "builtin:garden",
            "path": "res://fixture.svg",
        }],
    }
    raw = synthetic_jpeg()
    fake_meta = {
        "objectID": 1,
        "isPublicDomain": True,
        "primaryImage": "https://example.test/original.jpg",
        "objectURL": "https://example.test/met/1",
    }
    previous = Path.cwd()
    tmp_root.mkdir(parents=True, exist_ok=True)
    try:
        os.chdir(tmp_root)
        updated, manifest = materialize(
            candidate,
            catalog,
            asset_root="assets/museum/met_v0",
            fetch_json=lambda _url: fake_meta,
            fetch_bytes=lambda _url: raw,
        )
        validate_outputs(updated, manifest, expected_count=1)
        museum = [e for e in updated["contents"] if e.get("id") == "met_1"][0]
        assert museum["attribution"]["creator"] == "Unidentified artist"
        assert museum["path"].startswith("res://assets/museum/met_v0/puzzles/")
        assert museum["thumbnail_path"].startswith("res://assets/museum/met_v0/thumbs/")
        assert museum["runtime_asset"]["puzzle"]["width"] == 1200
        assert len(updated["contents"]) == 2
    finally:
        os.chdir(previous)
    print("PASS runtime asset materializer self-test")
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--candidates", default=DEFAULT_CANDIDATES)
    parser.add_argument("--catalog", default=DEFAULT_CATALOG)
    parser.add_argument("--asset-root", default=DEFAULT_ASSET_ROOT)
    parser.add_argument("--manifest", default=DEFAULT_MANIFEST)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--validate-only", action="store_true")
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--self-test-dir", default=".pieceful-content/materializer-self-test")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.self_test:
        return self_test(Path(args.self_test_dir))

    candidates = read_json(args.candidates)
    catalog = read_json(args.catalog)
    expected_count = len(candidates.get("contents", []))
    if args.limit > 0:
        expected_count = min(expected_count, args.limit)

    if args.validate_only:
        manifest = read_json(args.manifest)
        validate_outputs(catalog, manifest, expected_count=expected_count)
        print(f"PASS runtime assets validate-only: {expected_count} museum assets")
        return 0

    updated_catalog, manifest = materialize(
        candidates,
        catalog,
        asset_root=args.asset_root,
        limit=args.limit,
    )
    write_json(args.catalog, updated_catalog)
    write_json(args.manifest, manifest)
    validate_outputs(updated_catalog, manifest, expected_count=expected_count)
    print(
        json.dumps(
            {
                "materialized": manifest["materialized_count"],
                "catalog_contents": len(updated_catalog["contents"]),
                "asset_root": args.asset_root,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
