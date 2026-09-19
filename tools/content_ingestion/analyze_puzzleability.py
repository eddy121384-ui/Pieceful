#!/usr/bin/env python3
"""Pieceful Puzzleability v0.

Measures objective image structure for curator-approved content. This tool does
not decide semantics. It computes the seven metrics required by taxonomy v1,
adds a conservative suitability review flag, and updates the authoring catalog.

The score answers "does this image offer varied, locatable visual structure for
jigsaw solving?" Higher is better. It is not the player difficulty.
"""

from __future__ import annotations

import argparse
import io
import json
import math
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image, ImageOps

METRICS = (
    "score",
    "clear_regions",
    "repetitive_texture",
    "flat_area",
    "landmark_density",
    "color_variety",
    "edge_density",
    "gradient_area",
)


def read_json(path: str | Path) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: str | Path, value: Any) -> None:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def clamp01(v: float) -> float:
    return max(0.0, min(1.0, float(v)))


def round4(v: float) -> float:
    return round(clamp01(v), 4)


def fetch_bytes(url: str, timeout: int = 90, retries: int = 4) -> bytes:
    headers = {"User-Agent": "Pieceful-Puzzleability/1.0"}
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read()
        except urllib.error.HTTPError as exc:
            if exc.code not in (408, 409, 429, 500, 502, 503, 504) or attempt >= retries:
                detail = exc.read().decode("utf-8", errors="replace")
                raise RuntimeError(f"HTTP {exc.code} for {url}: {detail[:500]}") from exc
        except urllib.error.URLError:
            if attempt >= retries:
                raise
        time.sleep(min(20, 2 * (2 ** attempt)))
    raise RuntimeError("unreachable")


def decode_image(raw: bytes, long_edge: int = 320) -> tuple[np.ndarray, tuple[int, int]]:
    with Image.open(io.BytesIO(raw)) as im:
        im = ImageOps.exif_transpose(im).convert("RGB")
        original = im.size
        if max(im.size) > long_edge:
            scale = long_edge / max(im.size)
            im = im.resize(
                (max(1, round(im.width * scale)), max(1, round(im.height * scale))),
                Image.Resampling.LANCZOS,
            )
        arr = np.asarray(im, dtype=np.float32) / 255.0
    return arr, original


def block_stats(arr: np.ndarray, gray: np.ndarray, grad: np.ndarray, grid: int = 12) -> dict[str, np.ndarray]:
    h, w = gray.shape
    ys = np.linspace(0, h, min(grid, h) + 1, dtype=int)
    xs = np.linspace(0, w, min(grid, w) + 1, dtype=int)
    means: list[np.ndarray] = []
    within: list[float] = []
    edge_density: list[float] = []

    for yi in range(len(ys) - 1):
        for xi in range(len(xs) - 1):
            y0, y1 = ys[yi], ys[yi + 1]
            x0, x1 = xs[xi], xs[xi + 1]
            if y1 <= y0 or x1 <= x0:
                continue
            patch = arr[y0:y1, x0:x1]
            gp = grad[y0:y1, x0:x1]
            means.append(patch.reshape(-1, 3).mean(axis=0))
            within.append(float(patch.reshape(-1, 3).std(axis=0).mean()))
            edge_density.append(float(np.mean(gp > 0.14)))

    return {
        "means": np.asarray(means, dtype=np.float32),
        "within": np.asarray(within, dtype=np.float32),
        "edge_density": np.asarray(edge_density, dtype=np.float32),
    }


def color_entropy(arr: np.ndarray) -> float:
    # 6 bins/channel = 216 coarse colors. Entropy is robust to tiny JPEG noise.
    q = np.clip((arr * 6.0).astype(np.int32), 0, 5)
    ids = q[..., 0] * 36 + q[..., 1] * 6 + q[..., 2]
    counts = np.bincount(ids.ravel(), minlength=216).astype(np.float64)
    p = counts[counts > 0] / counts.sum()
    entropy = -float(np.sum(p * np.log2(p)))
    return clamp01(entropy / math.log2(216.0))


def analyze_array(arr: np.ndarray, original_size: tuple[int, int]) -> dict[str, Any]:
    gray = arr[..., 0] * 0.2126 + arr[..., 1] * 0.7152 + arr[..., 2] * 0.0722

    gx = np.zeros_like(gray)
    gy = np.zeros_like(gray)
    gx[:, 1:] = np.abs(gray[:, 1:] - gray[:, :-1])
    gy[1:, :] = np.abs(gray[1:, :] - gray[:-1, :])
    grad = np.sqrt(gx * gx + gy * gy)

    edge_density = float(np.mean(grad > 0.14))
    flat_area = float(np.mean(grad < 0.018))
    gradient_area = float(np.mean((grad >= 0.018) & (grad <= 0.14)))
    variety = color_entropy(arr)

    blocks = block_stats(arr, gray, grad)
    means = blocks["means"]
    within = blocks["within"]
    block_edges = blocks["edge_density"]

    between = float(means.std(axis=0).mean()) if len(means) else 0.0
    within_mean = float(within.mean()) if len(within) else 0.0
    # Clear regions: internally coherent patches whose average colors differ.
    clear_regions = between / (between + within_mean + 1e-6)
    clear_regions = clamp01(clear_regions * 1.18)

    # Landmark proxy: local spatial chunks whose color differs meaningfully from
    # the image's average chunk. This rewards locatable visual anchors without
    # requiring a semantic/object detector.
    if len(means):
        center = means.mean(axis=0)
        d = np.linalg.norm(means - center, axis=1) / math.sqrt(3.0)
        landmark_density = clamp01(float(np.mean(d > 0.12)) * 1.8 + float(np.quantile(d, 0.9)) * 0.8)
    else:
        landmark_density = 0.0

    # Repetitive texture proxy: lots of edges distributed uniformly throughout
    # the frame. Dense texture concentrated in one landmark is less penalized.
    mean_block_edge = float(block_edges.mean()) if len(block_edges) else 0.0
    edge_spread = float(block_edges.std()) if len(block_edges) else 0.0
    uniformity = clamp01(1.0 - edge_spread / (mean_block_edge + 0.08))
    repetitive_texture = clamp01((mean_block_edge / 0.28) * uniformity)

    # Edge usefulness peaks at a moderate density: too few cues is hard, while
    # all-over micro-detail is also less useful for locating pieces.
    edge_usefulness = math.exp(-((edge_density - 0.16) / 0.15) ** 2)
    gradient_usefulness = clamp01(gradient_area / 0.58)
    flat_excess = clamp01((flat_area - 0.52) / 0.42)

    score = (
        0.26 * clear_regions
        + 0.18 * variety
        + 0.24 * landmark_density
        + 0.18 * edge_usefulness
        + 0.14 * gradient_usefulness
        - 0.15 * flat_excess
        - 0.15 * repetitive_texture
    )
    score = clamp01(score)

    width, height = original_size
    reasons: list[str] = []
    if score < 0.43:
        reasons.append("low_puzzleability_score")
    if flat_area > 0.72:
        reasons.append("large_flat_area")
    if repetitive_texture > 0.76:
        reasons.append("high_repetitive_texture")
    if variety < 0.18 and edge_density < 0.06:
        reasons.append("low_visual_variety")

    # The current Met sample intentionally uses primaryImageSmall/web-large as
    # a cheap authoring derivative. Resolution is an asset-pipeline concern,
    # not a puzzleability verdict. The production-asset stage will fetch a
    # higher-resolution derivative before runtime publication.
    asset_warnings: list[str] = []
    if min(width, height) < 480 or max(width, height) < 720:
        asset_warnings.append("authoring_derivative_low_resolution")

    review_required = bool(reasons)

    # suggested_difficulty means a sensible default starting point, not a
    # quality label. Hard-looking imagery gets fewer pieces; richly structured,
    # cue-dense imagery can support more pieces.
    challenge = clamp01(
        0.42 * flat_area
        + 0.28 * repetitive_texture
        + 0.16 * (1.0 - variety)
        + 0.14 * (1.0 - clear_regions)
    )
    if review_required or challenge >= 0.56:
        suggested = "relaxed"
    elif score >= 0.72 and edge_density >= 0.12 and landmark_density >= 0.48 and flat_area <= 0.62:
        suggested = "hard"
    else:
        suggested = "standard"

    return {
        "puzzleability": {
            "score": round4(score),
            "clear_regions": round4(clear_regions),
            "repetitive_texture": round4(repetitive_texture),
            "flat_area": round4(flat_area),
            "landmark_density": round4(landmark_density),
            "color_variety": round4(variety),
            "edge_density": round4(edge_density),
            "gradient_area": round4(gradient_area),
        },
        "suggested_difficulty": suggested,
        "review_required": review_required,
        "review_reasons": reasons,
        "analysis": {
            "analyzer": "pieceful_puzzleability_v0",
            "source_width": int(width),
            "source_height": int(height),
            "working_width": int(arr.shape[1]),
            "working_height": int(arr.shape[0]),
            "challenge_index": round4(challenge),
            "asset_warnings": asset_warnings,
        },
    }


def analyze_bytes(raw: bytes) -> dict[str, Any]:
    arr, original_size = decode_image(raw)
    return analyze_array(arr, original_size)


def enrich_catalog(catalog: dict[str, Any], *, fetcher=fetch_bytes, limit: int = 0) -> tuple[dict[str, Any], dict[str, Any]]:
    out = json.loads(json.dumps(catalog))
    entries = out.get("contents", [])
    if limit > 0:
        entries = entries[:limit]

    results: list[dict[str, Any]] = []
    for i, entry in enumerate(entries, start=1):
        url = str(entry.get("asset", {}).get("puzzle_candidate_url") or "")
        if not url:
            raise RuntimeError(f"{entry.get('id')} missing puzzle_candidate_url")
        print(f"[{i}/{len(entries)}] analyze {entry['id']}", flush=True)
        result = analyze_bytes(fetcher(url))
        entry["puzzleability"] = result["puzzleability"]
        entry["suggested_difficulty"] = result["suggested_difficulty"]
        entry.setdefault("curation", {})["puzzleability_status"] = (
            "review" if result["review_required"] else "accepted"
        )
        entry["curation"]["puzzleability_review_reasons"] = result["review_reasons"]
        entry["curation"]["puzzleability_analysis"] = result["analysis"]

        blockers = ["production_asset_not_materialized"]
        if result["review_required"]:
            blockers.insert(0, "puzzleability_review")
        entry["promotion"] = {"status": "blocked", "blockers": blockers}

        results.append({
            "id": entry["id"],
            "label": entry.get("label"),
            "score": result["puzzleability"]["score"],
            "suggested_difficulty": result["suggested_difficulty"],
            "review_required": result["review_required"],
            "review_reasons": result["review_reasons"],
            **result["puzzleability"],
        })

    # If a limit was used, only the analyzed prefix is included in the report.
    reviewed = [r for r in results if r["review_required"]]
    accepted = [r for r in results if not r["review_required"]]
    difficulties = {
        d: sum(1 for r in results if r["suggested_difficulty"] == d)
        for d in ("relaxed", "standard", "hard")
    }

    summary = out.setdefault("summary", {})
    if limit <= 0 or len(entries) == len(out.get("contents", [])):
        summary["puzzleability_analyzed"] = len(results)
        summary["puzzleability_accepted"] = len(accepted)
        summary["puzzleability_review"] = len(reviewed)
        summary["runtime_publishable"] = 0
        summary["blocked_on_puzzleability"] = len(reviewed)
        summary["blocked_on_production_asset"] = len(results)
        out["catalog_status"] = (
            "curated_needs_puzzleability_review_and_assets"
            if reviewed
            else "curated_needs_production_assets"
        )

    report = {
        "schema_version": 1,
        "kind": "pieceful_puzzleability_report_v0",
        "analyzer": "pieceful_puzzleability_v0",
        "summary": {
            "total": len(results),
            "accepted": len(accepted),
            "review_required": len(reviewed),
            "suggested_difficulty": difficulties,
            "score_min": min((r["score"] for r in results), default=None),
            "score_max": max((r["score"] for r in results), default=None),
            "score_mean": round(sum(r["score"] for r in results) / len(results), 4) if results else None,
        },
        "review_queue": sorted(reviewed, key=lambda r: (r["score"], r["id"])),
        "results": sorted(results, key=lambda r: r["id"]),
    }
    return out, report


def synthetic_image(kind: str, size: int = 256) -> bytes:
    if kind == "flat":
        arr = np.full((size, size, 3), 0.7, dtype=np.float32)
    elif kind == "structured":
        y, x = np.mgrid[0:size, 0:size]
        arr = np.zeros((size, size, 3), dtype=np.float32)
        arr[..., 0] = x / max(1, size - 1)
        arr[..., 1] = y / max(1, size - 1)
        arr[..., 2] = ((x // 32 + y // 32) % 2) * 0.65 + 0.15
        arr[40:105, 35:120, :] = np.array([0.95, 0.25, 0.18], dtype=np.float32)
        arr[145:220, 150:230, :] = np.array([0.12, 0.72, 0.92], dtype=np.float32)
    else:
        raise ValueError(kind)
    im = Image.fromarray(np.clip(arr * 255.0, 0, 255).astype(np.uint8), mode="RGB")
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    return buf.getvalue()


def self_test() -> int:
    flat = analyze_bytes(synthetic_image("flat"))
    structured = analyze_bytes(synthetic_image("structured"))
    for result in (flat, structured):
        assert set(result["puzzleability"]) == set(METRICS)
        assert all(0.0 <= float(result["puzzleability"][m]) <= 1.0 for m in METRICS)
        assert result["suggested_difficulty"] in ("relaxed", "standard", "hard")
    assert flat["review_required"] is True
    assert structured["puzzleability"]["score"] > flat["puzzleability"]["score"]
    assert structured["puzzleability"]["color_variety"] > flat["puzzleability"]["color_variety"]
    print("PASS Puzzleability v0 self-test")
    return 0


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--catalog", default="content/curation/met_curated_catalog_v0.json")
    p.add_argument("--output", default="content/curation/met_curated_catalog_v0.json")
    p.add_argument("--report", default="content/curation/met_puzzleability_report_v0.json")
    p.add_argument("--limit", type=int, default=0)
    p.add_argument("--self-test", action="store_true")
    return p.parse_args()


def main() -> int:
    args = parse_args()
    if args.self_test:
        return self_test()
    catalog = read_json(args.catalog)
    enriched, report = enrich_catalog(catalog, limit=args.limit)
    write_json(args.output, enriched)
    write_json(args.report, report)
    print(json.dumps(report["summary"], ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
