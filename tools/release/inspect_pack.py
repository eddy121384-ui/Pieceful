"""Inspect the pinned Godot's unencrypted PCK directory without loading the game."""
import argparse
import hashlib
import json
from pathlib import Path
import struct

FORBIDDEN_ROOTS = ("tests/", "tools/", "web/", "build/", "authoring/", "docs/", "content/curation/", "android/", "ios/", "addons/catalog_source_export/")
REQUIRED_NOTICES = ("licenses/NOTICE.txt", "licenses/ASSET_MANIFEST.json", "licenses/ANDROID-RUNTIME-INVENTORY.json", "licenses/GODOT-LICENSE.txt", "licenses/GODOT-THIRD-PARTY.json", "licenses/LPPL-1.3c.txt", "assets/ui/ALBUM-FONT-LICENSE.txt", "assets/ui/CATALOG-INK-FONT-LICENSE.txt")


def read_directory(path: Path) -> list[dict]:
    with path.open("rb") as stream:
        header = stream.read(40)
        if len(header) != 40:
            raise ValueError("Truncated PCK header")
        magic, version, major, minor, patch, flags, base, directory = struct.unpack("<6I2Q", header)
        if magic != 0x43504447 or version not in (3, 4) or flags & 1:
            raise ValueError("Unsupported or encrypted PCK; review parser before release")
        if (major, minor, patch) != (4, 7, 2):
            raise ValueError("PCK engine differs from the pinned 4.7.2")
        stream.seek(directory)
        count = struct.unpack("<I", stream.read(4))[0]
        if count > 100000:
            raise ValueError("Invalid PCK directory count")
        entries = []
        for _ in range(count):
            length = struct.unpack("<I", stream.read(4))[0]
            if length > 100000:
                raise ValueError("Invalid PCK path length")
            name = stream.read(length).rstrip(b"\0").decode("utf-8").removeprefix("res://")
            offset, size = struct.unpack("<2Q", stream.read(16))
            digest = stream.read(16).hex()
            entry_flags = struct.unpack("<I", stream.read(4))[0]
            entries.append({"path": name, "offset": base + offset, "bytes": size, "md5": digest, "flags": entry_flags})
        return entries


def inspect(path: Path, root: Path, enforce: bool = True) -> dict:
    entries = read_directory(path)
    paths = {entry["path"] for entry in entries}
    forbidden = sorted(p for p in paths if p.startswith(FORBIDDEN_ROOTS) or "commercial_product_browser_fixture" in p)
    missing = [p for p in REQUIRED_NOTICES if p not in paths]
    catalog = json.loads((root / "content/catalog_v1.json").read_text())["contents"]
    missing_sources = [entry["path"] for entry in catalog if entry["path"].removeprefix("res://") not in paths]
    source_mismatches = []
    by_path = {entry["path"]: entry for entry in entries}
    with path.open("rb") as stream:
        for entry in catalog:
            source = entry["path"].removeprefix("res://")
            if source not in by_path:
                continue
            packed = by_path[source]
            stream.seek(packed["offset"])
            if stream.read(packed["bytes"]) != (root / source).read_bytes():
                source_mismatches.append(source)
    result = {"file": path.name, "bytes": path.stat().st_size, "sha256": hashlib.sha256(path.read_bytes()).hexdigest(), "entries": len(entries), "forbidden_paths": forbidden, "missing_notices": missing, "missing_catalog_sources": missing_sources, "source_byte_mismatches": source_mismatches}
    if enforce and (forbidden or missing or missing_sources or source_mismatches):
        raise ValueError(json.dumps(result, indent=2))
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pack", type=Path)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--report-only", action="store_true")
    args = parser.parse_args()
    print(json.dumps(inspect(args.pack, args.root, not args.report_only), indent=2))
