"""Install the publisher-hosted, checksum-locked build validation tool; never shipped."""
import hashlib
import json
from pathlib import Path
import shutil
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
lock = json.loads((ROOT / "release_toolchain.lock.json").read_text())["bundletool"]
path = ROOT / ".godot-ci/bundletool.jar"
path.parent.mkdir(exist_ok=True)
if not path.exists():
    with urllib.request.urlopen(lock["url"]) as source, path.with_suffix(".part").open("wb") as destination:
        shutil.copyfileobj(source, destination)
    path.with_suffix(".part").replace(path)
assert hashlib.sha256(path.read_bytes()).hexdigest() == lock["sha256"], "Bundletool checksum mismatch"
print("Verified bundletool " + lock["version"])
