#!/usr/bin/env python3

from __future__ import annotations

import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INGEST_PATH = ROOT / "tools" / "content_ingestion" / "ingest.py"
PLAN_PATH = ROOT / "tools" / "content_ingestion" / "sample_plan_v0.json"
PROVIDERS_PATH = ROOT / "content" / "source_providers_v1.json"

spec = importlib.util.spec_from_file_location("pieceful_ingest", INGEST_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError("failed to load content ingestion module")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

public_fixture = {
    "objectID": 437133,
    "isPublicDomain": True,
    "primaryImage": "https://images.metmuseum.org/original.jpg",
    "primaryImageSmall": "https://images.metmuseum.org/web-large.jpg",
    "title": "Wheat Field with Cypresses",
    "artistDisplayName": "Vincent van Gogh",
    "objectURL": "https://www.metmuseum.org/art/collection/search/437133",
    "artistNationality": "Dutch",
    "culture": "",
    "objectDate": "1889",
    "medium": "Oil on canvas",
    "classification": "Paintings",
    "department": "European Paintings",
    "creditLine": "Purchase, The Annenberg Foundation Gift, 1993",
    "objectName": "Painting",
}

candidate = module.normalize_met_object(public_fixture)
assert candidate is not None
assert candidate["id"] == "met_437133"
assert candidate["provider"] == "met"
assert candidate["source_item_id"] == "437133"
assert candidate["rights"]["license"] == "cc0"
assert candidate["rights"]["commercial_use_allowed"] is True
assert candidate["rights"]["attribution_required"] is False
assert candidate["rights"]["provider_rights_signal"] == {
    "field": "isPublicDomain",
    "value": True,
}
assert candidate["asset"]["remote_game_candidate_url"].endswith("web-large.jpg")
assert candidate["taxonomy_draft"]["status"] == "unresolved"
assert candidate["taxonomy_draft"]["category"] is None
assert candidate["taxonomy_draft"]["puzzleability"] is None
assert all(
    state == "unresolved"
    for state in candidate["taxonomy_draft"]["facet_status"].values()
)
assert all(
    candidate["taxonomy_draft"][field] == []
    for field in ("subject", "region_culture", "mood", "visual", "style", "scene")
)

restricted = dict(public_fixture)
restricted["isPublicDomain"] = False
assert module.normalize_met_object(restricted) is None

missing_image = dict(public_fixture)
missing_image["primaryImage"] = ""
missing_image["primaryImageSmall"] = ""
assert module.normalize_met_object(missing_image) is None

with PLAN_PATH.open("r", encoding="utf-8") as handle:
    plan = json.load(handle)
assert plan["provider"] == "met"
assert len(plan["queries"]) >= 6
assert sum(int(row["target"]) for row in plan["queries"]) == 40

with PROVIDERS_PATH.open("r", encoding="utf-8") as handle:
    providers = json.load(handle)
met = providers["providers"]["met"]
assert met["status"] == "active_v0"
assert met["accepted_rights"] == ["cc0"]
assert "isPublicDomain=true" in met["rights_gate"]
assert providers["providers"]["npm"]["status"] == "planned"
assert providers["providers"]["rijksmuseum"]["status"] == "planned"

print("PASS content_ingestion_smoke: rights gate, unresolved authoring state, provider registry, and 40-image plan are valid")
