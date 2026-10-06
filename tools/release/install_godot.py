"""Install checksum-pinned editor and Web/Android templates into local build storage."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--cache", type=Path, default=ROOT / ".godot-ci")
parser.add_argument("--templates", type=Path, default=Path(os.environ.get("XDG_DATA_HOME", str(Path.home() / ".local/share"))) / "godot/export_templates/4.7.2.stable")
args = parser.parse_args()
lock = json.loads((ROOT / "release_toolchain.lock.json").read_text())["godot"]
args.cache.mkdir(parents=True, exist_ok=True)
args.templates.mkdir(parents=True, exist_ok=True)
for kind in ["editor", "templates"]:
    name = lock[kind + "_archive"]
    archive = args.cache / name
    if not archive.exists():
        request = urllib.request.Request(f"https://github.com/godotengine/godot/releases/download/{lock['release']}/{name}", headers={"User-Agent": "Pieceful-release-validation"})
        temp = archive.with_suffix(archive.suffix + ".part")
        with urllib.request.urlopen(request) as response, temp.open("wb") as out:
            shutil.copyfileobj(response, out)
        temp.replace(archive)
    digest = hashlib.sha512()
    with archive.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    if digest.hexdigest() != lock[kind + "_sha512"]:
        raise SystemExit(f"{name}: checksum mismatch; refusing to use cached or downloaded toolchain")
    with zipfile.ZipFile(archive) as source:
        if kind == "editor":
            binary = f"Godot_v{lock['release']}_linux.x86_64"
            with source.open(binary) as src, (args.cache / binary).open("wb") as dest:
                shutil.copyfileobj(src, dest)
            (args.cache / binary).chmod(0o755)
        else:
            for member in source.namelist():
                name = Path(member).name
                if name.startswith(("web_", "android_")) or name == "version.txt":
                    with source.open(member) as src, (args.templates / name).open("wb") as dest:
                        shutil.copyfileobj(src, dest)
    print(f"Verified and installed {kind}: {lock['release']}")
