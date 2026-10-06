"""Reject unintended art, geometry, renderer or delivery changes in this pass."""
import argparse
import hashlib
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "release"))
from inspect_pack import read_directory


def payload_hashes(pack):
    result = {}
    with pack.open("rb") as stream:
        for entry in read_directory(pack):
            stream.seek(entry["offset"])
            result[entry["path"]] = hashlib.sha256(stream.read(entry["bytes"])).hexdigest()
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("before", type=Path)
    parser.add_argument("after", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    before = payload_hashes(args.before / "index.pck")
    after = payload_hashes(args.after / "index.pck")
    removed = sorted(before.keys() - after.keys())
    added = sorted(after.keys() - before.keys())
    changed = sorted(path for path in before.keys() & after.keys() if before[path] != after[path])
    expected_removed = sorted(entry["path"].removeprefix("res://") for entry in json.loads((root / "content/catalog_v1.json").read_text())["contents"])
    assert removed == expected_removed, "Only redundant raw sources may be removed"
    assert added == ["content/catalog_identity_v1.json", "scripts/catalog_content_identity.gd.remap", "scripts/catalog_content_identity.gdc"]
    allowed = {".godot/uid_cache.bin", "scripts/content_identity_chaos_order_stress_puzzle_board.gdc", "scripts/gallery_puzzle_catalog_board.gdc", "scripts/puzzle_catalog_chaos_order_stress_puzzle_board.gdc"}
    assert set(changed) <= allowed, "Unintended shared resource changes: " + str(changed)
    unchanged_files = []
    for path in args.before.glob("index.*"):
        if path.suffix in (".pck", ".import"):
            continue
        left = path.read_bytes()
        right = (args.after / path.name).read_bytes()
        if path.name == "index.html":
            # Godot records the actual PCK length in its loader configuration.
            for directory, value in [(args.before, left), (args.after, right)]:
                assert value.count(f'"index.pck":{(directory / "index.pck").stat().st_size}'.encode()) == 1
            left = left.replace(f'"index.pck":{(args.before / "index.pck").stat().st_size}'.encode(), b'"index.pck":PACK_BYTES')
            right = right.replace(f'"index.pck":{(args.after / "index.pck").stat().st_size}'.encode(), b'"index.pck":PACK_BYTES')
        assert left == right, path.name
        unchanged_files.append(path.name)
    args.output.write_text(json.dumps({"passed": True, "removed": removed, "added": added, "changed": changed, "unchanged_shared_payloads": len(before.keys() & after.keys()) - len(changed), "unchanged_nonpack_delivery_files": sorted(unchanged_files), "html_difference": "Only the validated PCK fileSizes value changes", "note": "All imported artwork, thumbnails, fonts, UI, shader, cut patterns and catalog metadata remain byte-identical."}, indent=2) + "\n")
    print("PASS unchanged display/geometry resources and engine/bootstrap delivery")
