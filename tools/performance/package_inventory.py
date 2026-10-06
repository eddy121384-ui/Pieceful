"""Rank actual PCK payloads. Gzip values are local calculations, not CDN traffic."""
import argparse
from collections import defaultdict
import gzip
import hashlib
import json
from pathlib import Path
import re
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "release"))
from inspect_pack import read_directory


def inventory(pack: Path, root: Path) -> dict:
    imports = {}
    for source in (root / "assets").rglob("*.import"):
        for imported in re.findall(r'"res://(\.godot/imported/[^"\n]+)"', source.read_text()):
            imports[imported] = source.relative_to(root).as_posix().removesuffix(".import")
    catalog = json.loads((root / "content/catalog_v1.json").read_text())["contents"]
    font_sources = {entry["path"] for entry in json.loads((root / "licenses/ASSET_MANIFEST.json").read_text())["fonts"]}
    sources = {row["path"].removeprefix("res://") for row in catalog}
    thumbnails = {row.get("thumbnail_path", "").removeprefix("res://") for row in catalog} - sources
    groups = defaultdict(lambda: {"count": 0, "bytes": 0, "individual_payload_gzip_bytes": 0})
    duplicates = defaultdict(list)
    rows = []
    entries = read_directory(pack)
    with pack.open("rb") as stream:
        # Text resources (including the embedded FontFile .tres) are exported
        # as binary .res payloads, outside the ordinary image import mapping.
        for entry in entries:
            if entry["path"].endswith(".remap"):
                stream.seek(entry["offset"])
                remap = stream.read(entry["bytes"]).decode()
                target = re.search(r'^path="res://([^"\n]+)"', remap, re.MULTILINE)
                if target:
                    imports[target[1]] = entry["path"].removesuffix(".remap")
        for entry in entries:
            path = entry["path"]
            source = imports.get(path, path)
            if path in sources:
                category = "duplicate_raw_catalog_identity_sources"
            elif source in sources:
                category = "imported_catalog_artwork"
            elif source in thumbnails:
                category = "imported_thumbnails"
            elif source in font_sources or source.endswith((".ttf", ".otf", ".woff2", ".fnt")):
                category = "fonts"
            elif path.startswith("cut_patterns/"):
                category = "cut_patterns"
            elif path.startswith("licenses/") or "LICENSE" in path:
                category = "licenses"
            elif source.startswith("assets/ui/"):
                category = "ui_assets"
            elif source.endswith(".gdshader"):
                category = "shaders"
            elif path.startswith("scripts/") or path.endswith((".gdc", ".scn", ".tscn")):
                category = "scripts_scenes"
            elif path.endswith(".import") or path.endswith(".remap") or path.startswith(".godot/"):
                category = "godot_metadata_other_imports"
            elif path.startswith(("tests/", "tools/", "docs/", "authoring/", "web/")):
                category = "development_leftovers"
            else:
                category = "catalog_other_resources"
            stream.seek(entry["offset"])
            data = stream.read(entry["bytes"])
            digest = hashlib.sha256(data).hexdigest()
            zipped = len(gzip.compress(data, mtime=0))
            row = {"path": path, "source": source, "category": category, "bytes": len(data), "individual_payload_gzip_bytes": zipped, "sha256": digest}
            rows.append(row)
            duplicates[digest].append(path)
            group = groups[category]
            group["count"] += 1
            group["bytes"] += len(data)
            group["individual_payload_gzip_bytes"] += zipped
    data = pack.read_bytes()
    return {"pack_bytes": len(data), "pack_calculated_gzip_bytes": len(gzip.compress(data, mtime=0)), "payload_bytes": sum(row["bytes"] for row in rows), "container_directory_padding_bytes": len(data) - sum(row["bytes"] for row in rows), "groups": dict(sorted(groups.items(), key=lambda row: -row[1]["bytes"])), "ranked_payloads": sorted(rows, key=lambda row: -row["bytes"]), "identical_payload_groups": [paths for paths in duplicates.values() if len(paths) > 1], "note": "Per-payload gzip sums differ from whole-PCK gzip. Neither is measured CDN transfer."}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pack", type=Path)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(inventory(args.pack, args.root), indent=2) + "\n")
