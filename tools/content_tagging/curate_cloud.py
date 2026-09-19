#!/usr/bin/env python3
"""Pieceful AI Curator cloud runner.

Authoring-time only. Fetches museum metadata/images, asks a vision model for
Pieceful taxonomy, escalates ambiguous cases to a stronger adjudicator model,
and writes a static JSON review queue for the mobile Content Lab.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

OPENAI_URL = "https://api.openai.com/v1/responses"
MET_OBJECT_URL = "https://collectionapi.metmuseum.org/public/collection/v1/objects/{object_id}"
FACETS = ("subject", "region_culture", "mood", "visual", "style", "scene")
CONF_FIELDS = ("overall", "category", "subject", "region_culture", "mood", "visual", "style", "scene")
CANONICAL_RE = re.compile(r"^[a-z0-9]+(?:_[a-z0-9]+)*$")


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def read_json(path: str | Path) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def write_json(path: str | Path, value: Any) -> None:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def http_json(url: str, *, method: str = "GET", body: Any = None, headers: dict[str, str] | None = None,
              timeout: int = 120, retries: int = 4) -> Any:
    payload = None if body is None else json.dumps(body, ensure_ascii=False).encode("utf-8")
    hdrs = {"User-Agent": "Pieceful-AI-Curator/1.0"}
    if payload is not None:
        hdrs["Content-Type"] = "application/json"
    if headers:
        hdrs.update(headers)
    for attempt in range(retries + 1):
        req = urllib.request.Request(url, data=payload, headers=hdrs, method=method)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            if exc.code not in (408, 409, 429, 500, 502, 503, 504) or attempt >= retries:
                detail = exc.read().decode("utf-8", errors="replace")
                raise RuntimeError(f"HTTP {exc.code} for {url}: {detail[:1000]}") from exc
        except urllib.error.URLError:
            if attempt >= retries:
                raise
        time.sleep(min(30, 2 * (2 ** attempt)))
    raise RuntimeError("unreachable")


def result_schema(tax: dict[str, Any]) -> dict[str, Any]:
    status_props = {f: {"type": "string", "enum": ["present", "not_applicable", "unresolved"]} for f in FACETS}
    conf_props = {f: {"type": "number", "minimum": 0, "maximum": 1} for f in CONF_FIELDS}

    def arr_schema(name: str) -> dict[str, Any]:
        rule = tax["facet_rules"][name]
        item: dict[str, Any] = {"type": "string"}
        if name in tax["controlled_values"]:
            item["enum"] = tax["controlled_values"][name]
        return {"type": "array", "items": item, "maxItems": int(rule["max_values"])}

    taxonomy_props = {
        "category": {"type": "string", "enum": tax["primary_categories"]},
        "subject": arr_schema("subject"),
        "region_culture": arr_schema("region_culture"),
        "mood": arr_schema("mood"),
        "visual": arr_schema("visual"),
        "style": arr_schema("style"),
        "scene": arr_schema("scene"),
        "facet_status": {
            "type": "object",
            "properties": status_props,
            "required": list(FACETS),
            "additionalProperties": False,
        },
    }
    return {
        "type": "object",
        "properties": {
            "taxonomy": {
                "type": "object",
                "properties": taxonomy_props,
                "required": ["category", *FACETS, "facet_status"],
                "additionalProperties": False,
            },
            "confidence": {
                "type": "object",
                "properties": conf_props,
                "required": list(CONF_FIELDS),
                "additionalProperties": False,
            },
            "review_required": {"type": "boolean"},
            "review_reasons": {"type": "array", "items": {"type": "string"}, "maxItems": 8},
            "rationale": {"type": "string"},
        },
        "required": ["taxonomy", "confidence", "review_required", "review_reasons", "rationale"],
        "additionalProperties": False,
    }


def validate_result(result: dict[str, Any], tax: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    t = result.get("taxonomy") or {}
    if t.get("category") not in tax["primary_categories"]:
        errors.append("bad category")

    for f in ("subject", "region_culture"):
        vals = t.get(f) or []
        if len(vals) > int(tax["facet_rules"][f]["max_values"]):
            errors.append(f"{f} too long")
        for value in vals:
            if not isinstance(value, str) or not CANONICAL_RE.fullmatch(value):
                errors.append(f"{f} value is not lower_snake_case_ascii: {value!r}")

    for f in ("mood", "visual", "style", "scene"):
        vals = t.get(f) or []
        allowed = set(tax["controlled_values"][f])
        if len(vals) > int(tax["facet_rules"][f]["max_values"]):
            errors.append(f"{f} too long")
        for value in vals:
            if value not in allowed:
                errors.append(f"bad {f}: {value!r}")

    statuses = t.get("facet_status") or {}
    for f in FACETS:
        vals = t.get(f) or []
        status = statuses.get(f)
        if status not in ("present", "not_applicable", "unresolved"):
            errors.append(f"bad status {f}")
        elif status == "present" and not vals:
            errors.append(f"{f} present but empty")
        elif status != "present" and vals:
            errors.append(f"{f} status={status} but nonempty")

    conf = result.get("confidence") or {}
    for f in CONF_FIELDS:
        try:
            value = float(conf[f])
        except Exception:
            errors.append(f"bad confidence {f}")
            continue
        if not 0 <= value <= 1:
            errors.append(f"bad confidence {f}")
    return errors


def min_confidence(result: dict[str, Any]) -> float:
    return min(float(result["confidence"][f]) for f in CONF_FIELDS)


def has_unresolved(result: dict[str, Any]) -> bool:
    statuses = result["taxonomy"]["facet_status"]
    return any(statuses[f] == "unresolved" for f in FACETS)


def extract_output_text(response: dict[str, Any]) -> str:
    direct = response.get("output_text")
    if isinstance(direct, str) and direct:
        return direct
    refusals: list[str] = []
    for item in response.get("output", []):
        for content in item.get("content", []) if isinstance(item, dict) else []:
            if content.get("type") == "output_text" and content.get("text"):
                return str(content["text"])
            if content.get("type") == "refusal":
                refusals.append(str(content.get("refusal", "refused")))
    if refusals:
        raise RuntimeError("Model refusal: " + "; ".join(refusals))
    raise RuntimeError("OpenAI response contained no output_text")


def openai_classify(*, key: str, model: str, prompt: str, image_url: str, schema: dict[str, Any],
                    image_detail: str) -> dict[str, Any]:
    body = {
        "model": model,
        "input": [{
            "role": "user",
            "content": [
                {"type": "input_text", "text": prompt},
                {"type": "input_image", "image_url": image_url, "detail": image_detail},
            ],
        }],
        "text": {
            "format": {
                "type": "json_schema",
                "name": "pieceful_ai_curator_v1",
                "description": "Pieceful semantic taxonomy proposal for one puzzle image",
                "strict": True,
                "schema": schema,
            }
        },
        "max_output_tokens": 2200,
    }
    response = http_json(
        OPENAI_URL,
        method="POST",
        body=body,
        headers={"Authorization": f"Bearer {key}"},
        timeout=150,
        retries=4,
    )
    result = json.loads(extract_output_text(response))
    return result


def source_context(meta: dict[str, Any], source_entry: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": source_entry["id"],
        "ingestion_query": source_entry.get("ingestion_query"),
        "title": meta.get("title"),
        "creator": meta.get("artistDisplayName"),
        "culture": meta.get("culture"),
        "country": meta.get("country"),
        "period": meta.get("period"),
        "object_date": meta.get("objectDate"),
        "classification": meta.get("classification"),
        "object_name": meta.get("objectName"),
        "medium": meta.get("medium"),
        "department": meta.get("department"),
    }


def primary_prompt(meta: dict[str, Any], source_entry: dict[str, Any]) -> str:
    ctx = json.dumps(source_context(meta, source_entry), ensure_ascii=False, separators=(",", ":"))
    return f"""You are the primary visual curator for Pieceful, a jigsaw-puzzle catalog.
Inspect the IMAGE itself first, then use museum metadata only as supporting evidence.

Classify the image into the supplied Pieceful taxonomy.
Important rules:
- ingestion_query is noisy discovery provenance, NEVER taxonomy truth.
- category is the primary visual/semantic experience for a puzzle player.
- museum artifacts, decorative arts, sculpture, textiles, jewelry, weapons, and instruments usually belong to art_culture when cultural/artistic character is primary.
- an animal motif may belong in subject without category=animals.
- scene describes what is visually depicted. Words such as Night Table or Night cap do not imply scene=night.
- region_culture may use explicit museum culture/place evidence; artist nationality alone is insufficient.
- use not_applicable when a facet genuinely does not meaningfully apply.
- use unresolved only when the image + reliable metadata truly cannot support a stable decision.
- flat reproductions use the artwork medium (painting/print/watercolor/etc.); catalog photos of 3D artifacts may use photo.
- neutral documentation imagery may use mood=not_applicable.
- subject and region_culture values must be lower_snake_case_ascii.
- never infer copyright/license/rights from the image.
- review_required should be true only for genuine ambiguity, weak evidence, or a meaningful metadata/image conflict.

Supporting museum context (not ground truth):
{ctx}
"""


def adjudicator_prompt(meta: dict[str, Any], source_entry: dict[str, Any], first: dict[str, Any]) -> str:
    ctx = json.dumps(source_context(meta, source_entry), ensure_ascii=False, separators=(",", ":"))
    first_json = json.dumps(first, ensure_ascii=False, separators=(",", ":"))
    return f"""You are Pieceful's senior visual curator and final AI adjudicator.
Independently inspect the IMAGE and decide the best stable taxonomy. Do not rubber-stamp the first pass.

Your goal is to RESOLVE ordinary ambiguity so a human only sees genuinely difficult exceptions.
Correct the first pass whenever needed. If a reasonable, well-supported taxonomy can be chosen from the image and museum metadata, choose it and set review_required=false.
Set review_required=true only when a human judgment is genuinely valuable: conflicting evidence, culturally sensitive/uncertain identity, subject/category ambiguity that materially changes discovery, or insufficient visual/metadata evidence.

Keep the same taxonomy rules:
- discovery query is never ground truth;
- image semantics lead, metadata supports;
- museum artifacts/decorative arts are usually art_culture;
- animal motifs do not force animals;
- scene is visual, not title-word matching;
- region/culture requires explicit evidence, not stereotypes or artist nationality alone;
- use not_applicable rather than inventing a value;
- never infer rights;
- open values use lower_snake_case_ascii.

Supporting museum context:
{ctx}

Primary curator result to audit:
{first_json}
"""


def fetch_met(source_entry: dict[str, Any]) -> dict[str, Any]:
    object_id = int(source_entry.get("object_id") or str(source_entry["id"]).split("_", 1)[1])
    meta = http_json(MET_OBJECT_URL.format(object_id=object_id), timeout=60, retries=4)
    if not meta.get("isPublicDomain"):
        raise RuntimeError("Met item is not explicitly public domain")
    image = meta.get("primaryImageSmall") or meta.get("primaryImage")
    if not image:
        raise RuntimeError("Met item has no primary image")
    return meta


def should_escalate(result: dict[str, Any], threshold: float) -> bool:
    return bool(result["review_required"] or has_unresolved(result) or min_confidence(result) < threshold)


def final_human_review(result: dict[str, Any], threshold: float) -> tuple[bool, list[str]]:
    reasons = list(dict.fromkeys(str(x) for x in result.get("review_reasons", [])))
    needed = bool(result.get("review_required"))
    if has_unresolved(result):
        needed = True
        reasons.append("facet_unresolved_after_adjudication")
    if min_confidence(result) < threshold:
        needed = True
        reasons.append("confidence_below_final_threshold")
    return needed, list(dict.fromkeys(reasons))


def compare_gold(entry: dict[str, Any], gold_taxonomy: dict[str, Any]) -> dict[str, Any]:
    actual = entry["taxonomy"]
    facet_exact = {f: sorted(actual.get(f, [])) == sorted(gold_taxonomy.get(f, [])) for f in FACETS}
    return {
        "category_exact": actual.get("category") == gold_taxonomy.get("category"),
        "facet_exact": facet_exact,
        "all_semantic_exact": actual.get("category") == gold_taxonomy.get("category") and all(facet_exact.values()),
    }


def run(args: argparse.Namespace) -> int:
    tax = read_json(args.taxonomy)
    source = read_json(args.source)
    schema = result_schema(tax)
    key = os.environ.get("OPENAI_API_KEY", "")
    if not key:
        raise RuntimeError("OPENAI_API_KEY is not set")

    gold_by_id: dict[str, Any] = {}
    if args.gold and Path(args.gold).exists():
        gold = read_json(args.gold)
        gold_by_id = {e["id"]: e["taxonomy"] for e in gold.get("entries", [])}

    source_entries = list(source.get("entries", []))
    if args.max_items and args.max_items > 0:
        source_entries = source_entries[:args.max_items]

    out_entries: list[dict[str, Any]] = []
    for i, src in enumerate(source_entries, start=1):
        item_id = src["id"]
        print(f"[{i}/{len(source_entries)}] {item_id}", flush=True)
        try:
            meta = fetch_met(src)
            image_url = meta.get("primaryImageSmall") or meta.get("primaryImage")
            first = openai_classify(
                key=key,
                model=args.primary_model,
                prompt=primary_prompt(meta, src),
                image_url=image_url,
                schema=schema,
                image_detail="low",
            )
            errors = validate_result(first, tax)
            if errors:
                raise RuntimeError("primary validation failed: " + "; ".join(errors))

            escalated = should_escalate(first, args.escalate_threshold)
            final = first
            adjudicator_result = None
            if escalated:
                print(f"  escalate -> {args.adjudicator_model}", flush=True)
                adjudicator_result = openai_classify(
                    key=key,
                    model=args.adjudicator_model,
                    prompt=adjudicator_prompt(meta, src, first),
                    image_url=image_url,
                    schema=schema,
                    image_detail="auto",
                )
                errors = validate_result(adjudicator_result, tax)
                if errors:
                    raise RuntimeError("adjudicator validation failed: " + "; ".join(errors))
                final = adjudicator_result

            human_review, reasons = final_human_review(final, args.final_threshold)
            entry = {
                "id": item_id,
                "provider": "met",
                "object_id": int(meta.get("objectID") or src.get("object_id")),
                "ingestion_query": src.get("ingestion_query"),
                "title": meta.get("title") or item_id,
                "creator": meta.get("artistDisplayName") or "",
                "culture": meta.get("culture") or "",
                "image_url": image_url,
                "source_url": meta.get("objectURL") or "",
                "rights": {
                    "provider_signal": "isPublicDomain",
                    "public_domain": True,
                    "credit_line": meta.get("creditLine") or "",
                },
                "taxonomy": final["taxonomy"],
                "confidence": final["confidence"],
                "human_review_required": human_review,
                "review_reasons": reasons,
                "rationale": final["rationale"],
                "provenance": {
                    "primary_model": args.primary_model,
                    "primary_min_confidence": round(min_confidence(first), 4),
                    "escalated": escalated,
                    "adjudicator_model": args.adjudicator_model if escalated else None,
                    "adjudicator_min_confidence": round(min_confidence(adjudicator_result), 4) if adjudicator_result else None,
                },
            }
            if item_id in gold_by_id:
                entry["gold_agreement"] = compare_gold(entry, gold_by_id[item_id])
            out_entries.append(entry)
            print(
                f"  -> {entry['taxonomy']['category']} "
                f"review={human_review} escalated={escalated} "
                f"min_conf={min_confidence(final):.2f}",
                flush=True,
            )
        except Exception as exc:
            print(f"  ERROR: {exc}", file=sys.stderr, flush=True)
            out_entries.append({
                "id": item_id,
                "provider": "met",
                "object_id": src.get("object_id"),
                "ingestion_query": src.get("ingestion_query"),
                "human_review_required": True,
                "review_reasons": ["curator_error"],
                "error": str(exc),
                "provenance": {
                    "primary_model": args.primary_model,
                    "adjudicator_model": args.adjudicator_model,
                },
            })
            if args.fail_fast:
                break

    ok_entries = [e for e in out_entries if "taxonomy" in e]
    escalated_count = sum(1 for e in ok_entries if e["provenance"].get("escalated"))
    review_count = sum(1 for e in out_entries if e.get("human_review_required"))
    failed_count = sum(1 for e in out_entries if "error" in e)
    auto_count = sum(1 for e in ok_entries if not e.get("human_review_required"))

    gold_rows = [e for e in ok_entries if "gold_agreement" in e]
    gold_eval = None
    if gold_rows:
        gold_eval = {
            "evaluated": len(gold_rows),
            "category_exact": sum(1 for e in gold_rows if e["gold_agreement"]["category_exact"]),
            "all_semantic_exact": sum(1 for e in gold_rows if e["gold_agreement"]["all_semantic_exact"]),
            "facet_exact": {
                f: sum(1 for e in gold_rows if e["gold_agreement"]["facet_exact"][f])
                for f in FACETS
            },
        }

    output = {
        "schema_version": 1,
        "kind": "pieceful_ai_curator_run",
        "generated_at": utc_now(),
        "source": args.source,
        "taxonomy_version": tax.get("taxonomy_version"),
        "models": {
            "primary": args.primary_model,
            "adjudicator": args.adjudicator_model,
        },
        "thresholds": {
            "escalate": args.escalate_threshold,
            "final_human_review": args.final_threshold,
        },
        "summary": {
            "requested": len(source_entries),
            "processed": len(out_entries),
            "auto_approved": auto_count,
            "escalated": escalated_count,
            "human_review_required": review_count,
            "failed": failed_count,
            "gold_eval": gold_eval,
        },
        "entries": out_entries,
    }
    write_json(args.output, output)
    print(json.dumps(output["summary"], ensure_ascii=False, indent=2), flush=True)
    return 1 if failed_count else 0


def self_test(args: argparse.Namespace) -> int:
    tax = read_json(args.taxonomy)
    schema = result_schema(tax)
    assert schema["properties"]["taxonomy"]["properties"]["category"]["enum"] == tax["primary_categories"]
    fixture = {
        "taxonomy": {
            "category": "art_culture",
            "subject": ["animal", "statuette"],
            "region_culture": ["coptic"],
            "mood": [],
            "visual": ["clear_regions"],
            "style": ["photo"],
            "scene": [],
            "facet_status": {
                "subject": "present",
                "region_culture": "present",
                "mood": "not_applicable",
                "visual": "present",
                "style": "present",
                "scene": "not_applicable",
            },
        },
        "confidence": {f: 0.9 for f in CONF_FIELDS},
        "review_required": False,
        "review_reasons": [],
        "rationale": "fixture",
    }
    assert validate_result(fixture, tax) == []
    fixture["taxonomy"]["scene"] = ["night"]
    fixture["taxonomy"]["facet_status"]["scene"] = "not_applicable"
    assert validate_result(fixture, tax)
    print("PASS AI Curator cloud self-test")
    return 0


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--source", default="content/curation/met_curator_sample_v0.json")
    p.add_argument("--gold", default="content/curation/met_gold_set_v0.json")
    p.add_argument("--taxonomy", default="content/tag_taxonomy_v1.json")
    p.add_argument("--output", default="web/content-lab/data/latest.json")
    p.add_argument("--primary-model", default=os.environ.get("PIECEFUL_CURATOR_MODEL", "gpt-5.6-luna"))
    p.add_argument("--adjudicator-model", default=os.environ.get("PIECEFUL_ADJUDICATOR_MODEL", "gpt-5.6-sol"))
    p.add_argument("--escalate-threshold", type=float, default=0.74)
    p.add_argument("--final-threshold", type=float, default=0.68)
    p.add_argument("--max-items", type=int, default=0)
    p.add_argument("--fail-fast", action="store_true")
    p.add_argument("--self-test", action="store_true")
    return p.parse_args()


if __name__ == "__main__":
    args = parse_args()
    try:
        raise SystemExit(self_test(args) if args.self_test else run(args))
    except Exception as exc:
        print(f"FATAL: {exc}", file=sys.stderr)
        raise SystemExit(2)
