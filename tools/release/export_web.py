"""Build an inspected production Web export and record input/artifact identity."""
import argparse
import gzip
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import atexit
from contextlib import ExitStack

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from catalog_pipeline_lib.pipeline import run as validate_catalog, lock as catalog_lock

from inspect_pack import inspect

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--godot", default=os.environ.get("GODOT_BIN", "godot"))
parser.add_argument("--output", type=Path, default=ROOT / "build/release-web/index.html")
args = parser.parse_args()
catalog_guard = ExitStack()
catalog_guard.enter_context(catalog_lock(ROOT))
atexit.register(catalog_guard.close)
catalog_check = validate_catalog(ROOT, "validate")
if not catalog_check["ok"]:
    raise SystemExit("Catalog pipeline validation failed: " + str(catalog_check["errors"]))
output = args.output.resolve()
output.parent.mkdir(parents=True, exist_ok=True)
(ROOT / "build").mkdir(exist_ok=True)
(ROOT / "build/.gdignore").touch()
(output.parent / ".gdignore").touch()
if output.name != "index.html":
    raise SystemExit("Use index.html so deployed readiness and artifact checks have stable paths")
subprocess.run([args.godot, "--headless", "--path", str(ROOT), "--export-release", "Web", str(output)], check=True)
subprocess.run(["python3", str(ROOT / "tools/instrument_web_loader.py"), str(output)], check=True)
for sidecar in output.parent.glob("index.*.import"):
    if sidecar.read_text().startswith("[remap]"):
        sidecar.unlink()  # Editor import metadata is not a Web delivery artifact.
pack = inspect(output.with_suffix(".pck"), ROOT)
files = []
for path in sorted(output.parent.glob("index.*")):
    data = path.read_bytes()
    files.append({"file": path.name, "bytes": len(data), "gzip_bytes": len(gzip.compress(data, mtime=0)), "sha256": hashlib.sha256(data).hexdigest()})
def git(*arguments):
    return subprocess.check_output(["git", *arguments], cwd=ROOT, text=True).strip()
identity = {"ref": git("branch", "--show-current"), "sha": git("rev-parse", "HEAD"), "run": os.environ.get("GITHUB_RUN_ID", "local"), "tracked_source_dirty": bool(git("status", "--porcelain", "--untracked-files=no")), "engine": subprocess.check_output([args.godot, "--version"], text=True).strip()}
(output.parent / "build-info.json").write_text(json.dumps(identity, indent=2) + "\n")
(output.parent / "artifact-manifest.json").write_text(json.dumps({"build": identity, "production_pack": pack, "artifacts": files, "raw_bytes": sum(item["bytes"] for item in files), "gzip_bytes": sum(item["gzip_bytes"] for item in files)}, indent=2) + "\n")
print(json.dumps({"production_export": "passed", "pack_entries": pack["entries"], "raw_bytes": sum(item["bytes"] for item in files), "gzip_bytes": sum(item["gzip_bytes"] for item in files), "tracked_source_dirty": identity["tracked_source_dirty"]}))
