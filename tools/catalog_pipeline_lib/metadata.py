"""Existing taxonomy and explicit operator rights attestations, not legal inference."""
import math
import re

ID = re.compile(r"[a-z][a-z0-9]*(?:_[a-z0-9]+)*\Z")
SHA = re.compile(r"[0-9a-f]{64}\Z")
FACETS = ("subject", "region_culture", "mood", "visual", "style", "scene")
KINDS = {"CC0", "PUBLIC_DOMAIN", "PROJECT_OWNED", "LICENSED", "UNKNOWN"}
STATES = {"APPROVED", "REVIEW_REQUIRED", "REJECTED"}


def nonempty(value, name):
    if not isinstance(value, str) or not value.strip() or len(value) > 4000 or any(ord(c) < 32 for c in value):
        raise ValueError(name + " must be nonempty plain text")
    return value


def stable_id(value):
    if not isinstance(value, str) or len(value) > 80 or not ID.fullmatch(value):
        raise ValueError("Stable ID must be <=80 characters of lower_snake_case ASCII, starting with a letter")
    return value


def digest(value):
    if not isinstance(value, str) or not SHA.fullmatch(value):
        raise ValueError("Invalid lowercase SHA256")
    return value


def validate_rights(rights, attribution, *, legacy=False):
    if not isinstance(rights, dict) or rights.get("kind") not in KINDS or rights.get("status") not in STATES:
        raise ValueError("Invalid rights kind/status")
    if rights["status"] == "REJECTED":
        raise ValueError("Rights rejected")
    if rights["status"] != "APPROVED" or rights["kind"] == "UNKNOWN":
        if legacy and rights == {"kind": "UNKNOWN", "status": "REVIEW_REQUIRED", "reason": "Original project_fixture ownership/distribution grant is not established in repository records"}:
            return ["Legacy REVIEW_REQUIRED: unchanged fixture only; production-rights gate remains blocked"]
        raise ValueError("Unapproved/unknown rights cannot be promoted")
    review = rights.get("review", {})
    if not isinstance(review, dict):
        raise ValueError("rights.review must be an object")
    nonempty(review.get("reviewer"), "rights.review.reviewer")
    nonempty(review.get("decision_reference"), "rights.review.decision_reference")
    nonempty(rights.get("evidence_reference"), "rights.evidence_reference")
    for grant in ("commercial_use", "redistribution", "derivatives"):
        if rights.get(grant) is not True:
            raise ValueError("Explicit " + grant + " approval required")
    license_name = nonempty(attribution.get("license"), "attribution.license")
    if license_name in ("unknown", "unverified", "project_fixture"):
        raise ValueError("Unresolved/fixture license is not production approval")
    if rights["kind"] == "CC0" and license_name != "cc0":
        raise ValueError("CC0 state requires cc0 license")
    if rights["kind"] == "PUBLIC_DOMAIN" and license_name != "public_domain":
        raise ValueError("Public-domain state requires public_domain license")
    if rights["kind"] == "PROJECT_OWNED" and license_name not in ("owned", "commissioned"):
        raise ValueError("Project-owned requires an ownership/commission grant, not project_fixture")
    if rights["kind"] in ("CC0", "PUBLIC_DOMAIN"):
        nonempty(attribution.get("source_url"), "Public-domain source URL/reference")
    if not isinstance(attribution.get("attribution_required"), bool):
        raise ValueError("attribution_required must be explicitly true or false")
    if attribution["attribution_required"]:
        nonempty(attribution.get("credit_line"), "Required credit line")
        nonempty(attribution.get("license_url"), "Required license URL/reference")
    signal = attribution.get("provider_rights_signal")
    if signal is not None and signal != {"field": "isPublicDomain", "value": True}:
        raise ValueError("Invalid public-domain signal")
    return []


def validate_entry(entry, taxonomy):
    if not isinstance(entry, dict):
        raise ValueError("catalog_entry must be an object")
    stable_id(entry.get("id"))
    nonempty(entry.get("label"), "Display title")
    source = nonempty(entry.get("source_id"), "source_id")
    if ":" not in source or not source.split(":", 1)[1] or source.startswith("photo:"):
        raise ValueError("source_id must be a stable provider:reference, not My Photos")
    if entry.get("category") not in taxonomy["primary_categories"]:
        raise ValueError("Invalid category/theme")
    if not isinstance(entry.get("facet_status"), dict):
        raise ValueError("facet_status must be an object")
    tokens = {entry["category"]}
    for facet in FACETS:
        values = entry.get(facet)
        rule = taxonomy["facet_rules"][facet]
        if not isinstance(values, list) or len(values) > rule["max_values"] or len(values) != len(set(values)):
            raise ValueError("Invalid " + facet + " values")
        for value in values:
            stable_id(value)
            if facet in taxonomy["controlled_values"] and value not in taxonomy["controlled_values"][facet]:
                raise ValueError("Unknown " + facet + " value: " + value)
        status = entry.get("facet_status", {}).get(facet)
        if status not in ("present", "not_applicable") or (status == "present") != bool(values):
            raise ValueError("Unresolved/inconsistent facet status: " + facet)
        if rule.get("published_must_be_present") and status != "present":
            raise ValueError(facet + " must be present")
        tokens.update(values)
    tags = entry.get("tags")
    if not isinstance(tags, list):
        raise ValueError("tags must be an array")
    seen = set()
    for tag in tags:
        if not isinstance(tag, dict) or tag.get("id") not in tokens or tag["id"] in seen:
            raise ValueError("Invalid/duplicate weighted tag reference")
        number(tag.get("weight"), "tag weight")
        seen.add(tag["id"])
    metrics = entry.get("puzzleability", {})
    if not isinstance(metrics, dict):
        raise ValueError("puzzleability must be an object")
    for key in taxonomy["puzzleability"]["required_metrics"]:
        number(metrics.get(key), "puzzleability." + key)
    if entry.get("suggested_difficulty") not in taxonomy["difficulty_values"]:
        raise ValueError("Invalid suggested difficulty")
    attribution = entry.get("attribution")
    if not isinstance(attribution, dict):
        raise ValueError("Missing attribution")
    for key in ("creator", "source_url"):
        if not isinstance(attribution.get(key), str):
            raise ValueError("Unknown creator/source URL must be explicit empty string")
    nonempty(attribution.get("license"), "License")
    if source.startswith("met:"):
        if attribution["license"] != "cc0" or attribution.get("provider_rights_signal") != {"field": "isPublicDomain", "value": True} or not attribution["source_url"].startswith("https://www.metmuseum.org/"):
            raise ValueError("Met requires its recorded CC0/public-domain signal and source URL")
    for key in ("collection_id", "pack_id"):
        if key in entry:
            stable_id(entry[key])


def number(value, name):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not 0 <= value <= 1:
        raise ValueError(name + " must be finite in [0,1]")


def entry_from_input(item, taxonomy, metrics, difficulty):
    for key in ("creator", "source_url", "credit_line", "license_url"):
        if item.get(key) is not None and not isinstance(item[key], str):
            raise ValueError(key + " must be text or explicit null/unknown")
    if item.get("date") is not None and (isinstance(item["date"], bool) or not isinstance(item["date"], (str, int))):
        raise ValueError("date must be text, integer year or null/unknown")
    t = item.get("taxonomy")
    if not isinstance(t, dict):
        raise ValueError("taxonomy is required; semantic metadata is never inferred")
    entry = {"id": stable_id(item.get("id")), "label": nonempty(item.get("title"), "title"), "source_id": nonempty(item.get("source_id"), "source_id"), "category": t.get("category")}
    statuses = {}
    for facet in FACETS:
        values = t.get(facet, [])
        entry[facet] = values
        statuses[facet] = "present" if values else "not_applicable"
    entry["facet_status"] = t.get("facet_status", statuses)
    entry["puzzleability"] = metrics
    entry["suggested_difficulty"] = item.get("suggested_difficulty", difficulty)
    tags = [{"id": entry["category"], "weight": 1.0}]
    seen = {entry["category"]}
    for facet in FACETS:
        for token in entry[facet]:
            if token not in seen:
                tags.append({"id": token, "weight": taxonomy["weighted_tags"]["default_weight_guidance"][facet]})
                seen.add(token)
    entry["tags"] = item.get("tags", tags)
    # None remains unknown; no invented creator, date or credit text.
    entry["attribution"] = {"creator": item.get("creator") or "", "license": item.get("license"), "source_url": item.get("source_url") or "", "credit_line": item.get("credit_line") or "", "attribution_required": item.get("attribution_required")}
    for key in ("license_url", "provider_rights_signal"):
        if key in item:
            entry["attribution"][key] = item[key]
    for key in ("collection_id", "pack_id"):
        if item.get(key) is not None:
            entry[key] = item[key]
    validate_entry(entry, taxonomy)
    return entry
