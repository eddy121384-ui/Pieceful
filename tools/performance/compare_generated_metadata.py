"""Verify cleanup/reimport changed only generated IDs/order, never display/code."""
import argparse
import json
from pathlib import Path
import re
import struct
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "release"))
from inspect_pack import read_directory


def payloads(path):
    data = path.read_bytes()
    return {entry["path"]: data[entry["offset"]:entry["offset"] + entry["bytes"]] for entry in read_directory(path)}


def uid_paths(data):
    count, = struct.unpack_from("<I", data)
    offset = 4
    paths, identifiers = [], []
    for _ in range(count):
        identifier, length = struct.unpack_from("<QI", data, offset)
        offset += 12
        paths.append(data[offset:offset + length].decode("utf-8"))
        identifiers.append(identifier)
        offset += length
    assert offset == len(data), "Unexpected UID cache format"
    assert len(set(paths)) == count and len(set(identifiers)) == count, "Duplicate UID mappings"
    return sorted(paths)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("first", type=Path)
    parser.add_argument("second", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    before, after = payloads(args.first / "index.pck"), payloads(args.second / "index.pck")
    assert before.keys() == after.keys(), "Resource set changed"
    changes = []
    for path, left in before.items():
        right = after[path]
        if left == right:
            continue
        if path == ".godot/uid_cache.bin":
            assert uid_paths(left) == uid_paths(right), "UID resource paths changed"
            reason = "Generated UID mappings/order; identical unique resource paths"
        elif path == ".godot/global_script_class_cache.cfg":
            # Only list ordering may differ. Compare every record and all text
            # outside records, rather than ignoring arbitrary class metadata.
            pattern = rb"\{[^{}]*\}"
            assert sorted(re.findall(pattern, left)) == sorted(re.findall(pattern, right))
            assert re.sub(pattern, b"RECORD", left) == re.sub(pattern, b"RECORD", right)
            reason = "Same class records, different ordering"
        elif path.endswith(".import"):
            pattern = rb'^uid="uid://[a-z0-9]+"$'
            assert len(re.findall(pattern, left, re.MULTILINE)) == 1
            assert len(re.findall(pattern, right, re.MULTILINE)) == 1
            assert re.sub(pattern, b"GENERATED_UID", left, flags=re.MULTILINE) == re.sub(pattern, b"GENERATED_UID", right, flags=re.MULTILINE)
            reason = "Only generated import UID; all paths/settings identical"
        else:
            raise AssertionError("Non-metadata resource changed: " + path)
        changes.append({"path": path, "reason": reason})
    for path in args.first.glob("index.*"):
        if path.suffix not in (".pck", ".import"):
            assert path.read_bytes() == (args.second / path.name).read_bytes(), path.name
    args.output.write_text(json.dumps({"passed": True, "payloads": len(before), "byte_identical_payloads": len(before) - len(changes), "generated_metadata_changes": changes, "note": "This permits only validated UID/order changes. It is not byte-identical container reproducibility."}, indent=2) + "\n")
    print("PASS generated UID/order only; display, geometry, code and delivery files unchanged")
