#!/usr/bin/env python3
import hashlib
import json
import shutil
import sys
import tempfile
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LOCK = ROOT / "mobile_plugins.lock.json"


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def download(url: str, dest: Path) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": "Pieceful-mobile-bootstrap"})
    with urllib.request.urlopen(req) as response, dest.open("wb") as out:
        shutil.copyfileobj(response, out)


def find_dir(root: Path, required: set[str]) -> Path:
    candidates = []
    for directory in [p for p in root.rglob("*") if p.is_dir()]:
        names = {p.name for p in directory.iterdir()}
        if required.issubset(names):
            candidates.append(directory)
    if not candidates:
        raise RuntimeError(f"Could not locate plugin directory containing {sorted(required)}")
    candidates.sort(key=lambda p: len(p.parts))
    return candidates[0]


def _copy_contents(source_root: Path, destination_root: Path) -> None:
    for source in source_root.iterdir():
        destination = destination_root / source.name
        if source.is_dir():
            shutil.copytree(source, destination, dirs_exist_ok=True)
        else:
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, destination)


def install_plugin(name: str, cfg: dict, temp_root: Path) -> None:
    archive = temp_root / cfg["archive"]
    download(cfg["url"], archive)
    actual = sha256(archive)
    if actual != cfg["sha256"]:
        raise RuntimeError(f"{name}: sha256 mismatch: {actual} != {cfg['sha256']}")

    unpacked = temp_root / f"{name}-unpacked"
    unpacked.mkdir()
    with zipfile.ZipFile(archive) as zf:
        zf.extractall(unpacked)

    target = ROOT / cfg["install_dir"]
    if target.exists():
        shutil.rmtree(target)

    if name == "admob":
        # The official multi-platform archive is intentionally rooted at res/.
        # Installing only the AdmobPlugin folder drops addons/GMPShared
        # (GmpLogger / SpmDependency) and the native platform export payload.
        # Mirror the plugin's own install.sh behavior by merging the complete
        # generated res/ tree into the Godot project.
        roots = [
            p for p in unpacked.rglob("res")
            if (p / "addons" / "AdmobPlugin").is_dir()
        ]
        if not roots:
            raise RuntimeError("admob: official archive is missing res/addons/AdmobPlugin")
        roots.sort(key=lambda p: len(p.parts))
        _copy_contents(roots[0], ROOT)
    else:
        # Billing's release is a conventional Godot addon. Preserve the entire
        # addon directory so its Android plugin metadata/binaries stay together.
        candidates = [
            p for p in unpacked.rglob("GodotGooglePlayBilling")
            if p.is_dir() and (p / "BillingClient.gd").exists() and (p / "plugin.cfg").exists()
        ]
        if candidates:
            candidates.sort(key=lambda p: len(p.parts))
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copytree(candidates[0], target)
        else:
            source = find_dir(unpacked, {"BillingClient.gd", "plugin.cfg"})
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copytree(source, target)

    print(f"installed {name} -> {target.relative_to(ROOT)}")


def write_admob_export_configs() -> None:
    target = ROOT / "addons/AdmobPlugin"
    android = """[General]
is_real = false

[Debug]
app_id = "ca-app-pub-3940256099942544~3347511713"

[Release]
app_id = "ca-app-pub-3940256099942544~3347511713"
"""
    ios = """[General]
is_real = false

[Debug]
app_id = "ca-app-pub-3940256099942544~1458002511"

[Release]
app_id = "ca-app-pub-3940256099942544~1458002511"

[ATT]
att_enabled = false
att_text = ""
"""
    (target / "android_export.cfg").write_text(android, encoding="utf-8")
    (target / "ios_export.cfg").write_text(ios, encoding="utf-8")


def enable_editor_plugins() -> None:
    project_path = ROOT / "project.godot"
    text = project_path.read_text(encoding="utf-8")
    section = (
        '[editor_plugins]\n\n'
        'enabled=PackedStringArray("res://addons/AdmobPlugin/plugin.cfg", '
        '"res://addons/GodotGooglePlayBilling/plugin.cfg")\n'
    )
    if "[editor_plugins]" in text:
        start = text.index("[editor_plugins]")
        next_section = text.find("\n[", start + 1)
        if next_section < 0:
            text = text[:start].rstrip() + "\n\n" + section
        else:
            text = text[:start].rstrip() + "\n\n" + section + "\n" + text[next_section + 1:]
    else:
        insert_at = text.find("\n[rendering]")
        if insert_at < 0:
            text = text.rstrip() + "\n\n" + section
        else:
            text = text[:insert_at].rstrip() + "\n\n" + section + "\n" + text[insert_at:]
    project_path.write_text(text, encoding="utf-8")


def verify() -> None:
    required = [
        ROOT / "addons/AdmobPlugin/Admob.gd",
        ROOT / "addons/AdmobPlugin/plugin.cfg",
        ROOT / "addons/GodotGooglePlayBilling/BillingClient.gd",
        ROOT / "addons/GodotGooglePlayBilling/plugin.cfg",
    ]
    missing = [str(p.relative_to(ROOT)) for p in required if not p.exists()]
    if missing:
        raise RuntimeError("Missing installed plugin files: " + ", ".join(missing))


def main() -> int:
    data = json.loads(LOCK.read_text(encoding="utf-8"))
    with tempfile.TemporaryDirectory(prefix="pieceful-mobile-") as tmp:
        temp_root = Path(tmp)
        install_plugin("admob", data["admob"], temp_root)
        install_plugin("google_play_billing", data["google_play_billing"], temp_root)
    write_admob_export_configs()
    enable_editor_plugins()
    verify()
    print("mobile monetization plugins installed and pinned")
    return 0


if __name__ == "__main__":
    sys.exit(main())
