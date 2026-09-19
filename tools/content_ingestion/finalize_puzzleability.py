#!/usr/bin/env python3
"""Finalize curator-reviewed Puzzleability decisions for the Met v0 catalog."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def read_json(path: str | Path) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: str | Path, value: Any) -> None:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def finalize(catalog: dict[str, Any], review: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
    out = json.loads(json.dumps(catalog))
    decisions = {row["id"]: row for row in review.get("decisions", [])}
    seen: set[str] = set()

    accepted: list[dict[str, Any]] = []
    excluded: list[dict[str, Any]] = []

    for entry in out.get("contents", []):
        curation = entry.setdefault("curation", {})
        analyzer_status = curation.get("puzzleability_status")
        decision = decisions.get(entry["id"])

        if analyzer_status == "review":
            if decision is None:
                raise RuntimeError(f"Missing curator puzzleability decision for {entry['id']}")
            seen.add(entry["id"])
            curation["puzzleability_curator_decision"] = decision["decision"]
            curation["puzzleability_curator_rationale"] = decision["rationale"]

            if decision["decision"] == "accept":
                curation["puzzleability_status"] = "accepted_curator_override"
                curation["puzzleability_review_reasons"] = []
                if decision.get("suggested_difficulty"):
                    entry["suggested_difficulty"] = decision["suggested_difficulty"]
                entry["promotion"] = {
                    "status": "blocked",
                    "blockers": ["production_asset_not_materialized"],
                }
                accepted.append(entry)
            elif decision["decision"] == "exclude":
                curation["puzzleability_status"] = "excluded_curator_review"
                entry["promotion"] = {
                    "status": "excluded",
                    "blockers": ["curator_rejected_puzzleability"],
                }
                excluded.append(entry)
            else:
                raise RuntimeError(f"Unknown decision for {entry['id']}: {decision['decision']}")
        else:
            # Analyzer-accepted entries remain candidates; human review is not
            # required unless explicitly added to the review file later.
            if decision is not None:
                raise RuntimeError(
                    f"Review file contains {entry['id']} but analyzer did not request review"
                )
            if entry.get("puzzleability") is None:
                raise RuntimeError(f"Missing puzzleability block for {entry['id']}")
            entry["promotion"] = {
                "status": "blocked",
                "blockers": ["production_asset_not_materialized"],
            }
            accepted.append(entry)

    unknown = set(decisions) - seen
    if unknown:
        raise RuntimeError("Unused curator decisions: " + ", ".join(sorted(unknown)))

    summary = out.setdefault("summary", {})
    summary.update({
        "puzzleability_analyzed": len(out.get("contents", [])),
        "puzzleability_curator_accepted": len(accepted),
        "puzzleability_curator_excluded": len(excluded),
        "runtime_candidate_count": len(accepted),
        "runtime_publishable": 0,
        "blocked_on_puzzleability": 0,
        "blocked_on_production_asset": len(accepted),
    })
    out["catalog_status"] = "curated_needs_production_assets"

    runtime_candidates = {
        "schema_version": 1,
        "kind": "pieceful_runtime_candidate_catalog_v0",
        "taxonomy_version": out.get("taxonomy_version"),
        "provider": out.get("provider"),
        "summary": {
            "candidate_count": len(accepted),
            "excluded_count": len(excluded),
            "publication_blocker": "production_asset_not_materialized",
        },
        "contents": accepted,
        "excluded": [
            {
                "id": e["id"],
                "label": e.get("label"),
                "reason": e.get("curation", {}).get("puzzleability_curator_rationale"),
            }
            for e in excluded
        ],
    }
    return out, runtime_candidates


def self_test() -> int:
    catalog = {
        "summary": {},
        "contents": [
            {
                "id": "a",
                "puzzleability": {"score": 0.8},
                "suggested_difficulty": "standard",
                "curation": {"puzzleability_status": "accepted"},
                "promotion": {"status": "blocked", "blockers": ["puzzleability_missing"]},
            },
            {
                "id": "b",
                "puzzleability": {"score": 0.3},
                "suggested_difficulty": "relaxed",
                "curation": {"puzzleability_status": "review"},
                "promotion": {"status": "blocked", "blockers": ["puzzleability_review"]},
            },
        ],
    }
    review = {
        "decisions": [
            {"id": "b", "decision": "exclude", "rationale": "fixture"},
        ]
    }
    final, candidates = finalize(catalog, review)
    assert final["summary"]["runtime_candidate_count"] == 1
    assert candidates["summary"]["candidate_count"] == 1
    assert candidates["excluded"][0]["id"] == "b"
    assert candidates["contents"][0]["id"] == "a"
    print("PASS Puzzleability curator finalization self-test")
    return 0


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--catalog", default="content/curation/met_curated_catalog_v0.json")
    p.add_argument("--review", default="content/curation/met_puzzleability_review_v0.json")
    p.add_argument("--output", default="content/curation/met_curated_catalog_v0.json")
    p.add_argument("--candidates", default="content/curation/met_runtime_candidates_v0.json")
    p.add_argument("--self-test", action="store_true")
    return p.parse_args()


def main() -> int:
    args = parse_args()
    if args.self_test:
        return self_test()
    catalog = read_json(args.catalog)
    review = read_json(args.review)
    final, candidates = finalize(catalog, review)
    write_json(args.output, final)
    write_json(args.candidates, candidates)
    print(json.dumps(candidates["summary"], ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
