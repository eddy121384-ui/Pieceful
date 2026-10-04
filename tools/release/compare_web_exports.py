"""Compare every exported resource; report Godot container byte reproducibility separately."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

from inspect_pack import read_directory

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("first", type=Path)
parser.add_argument("second", type=Path)
args = parser.parse_args()


def hashes(folder):
    return {path.name: hashlib.sha256(path.read_bytes()).hexdigest() for path in folder.glob("index.*")}


first, second = hashes(args.first), hashes(args.second)
assert first and first.keys() == second.keys(), "Export file set differs"
assert {key: value for key, value in first.items() if key != "index.pck"} == {key: value for key, value in second.items() if key != "index.pck"}, "Non-container export bytes differ"


def resource_hashes(path):
    data = path.read_bytes()
    return {entry["path"]: {"bytes": entry["bytes"], "sha256": hashlib.sha256(data[entry["offset"]:entry["offset"] + entry["bytes"]]).hexdigest(), "flags": entry["flags"]} for entry in read_directory(path)}


resources = resource_hashes(args.first / "index.pck")
assert resources == resource_hashes(args.second / "index.pck"), "Packed resource content differs; inspect before release"
subprocess.run(["python3", str(ROOT / "tools/instrument_web_loader.py"), str(args.first / "index.html")], check=True)
assert first == hashes(args.first), "Loader instrumentation is not idempotent"
result = {"resource_content_identical": True, "resources_compared": len(resources), "non_pack_bytes_identical": True, "loader_idempotent": True, "pack_container_bytes_identical": first["index.pck"] == second["index.pck"], "note": "Godot PCK physical ordering/padding can differ even with identical resource bytes. This check does not certify byte-identical or cross-host builds."}
(args.first / "reproducibility.json").write_text(json.dumps(result, indent=2) + "\n")
print("PASS Web resource reproducibility and loader idempotency: " + json.dumps(result))
