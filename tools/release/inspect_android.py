"""Inspect unsigned base-game validation artifacts, not store signing/readiness."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import struct
import subprocess
import zipfile
import xml.etree.ElementTree as ET

from inspect_pack import FORBIDDEN_ROOTS, REQUIRED_NOTICES

ROOT = Path(__file__).resolve().parents[2]


def inspect(path: Path, bundletool: Path | None = None) -> dict:
    prefix = "base/" if path.suffix == ".aab" else ""
    catalog = json.loads((ROOT / "content/catalog_v1.json").read_text())["contents"]
    with zipfile.ZipFile(path) as archive:
        names = set(archive.namelist())
        asset_prefix = "assets/" if not prefix else "assetPackInstallTime/assets/"
        paths = {name.removeprefix(asset_prefix) for name in names if name.startswith(asset_prefix)}
        assert not any(name.startswith(FORBIDDEN_ROOTS) or "commercial_product_browser_fixture" in name for name in paths), "Development resource shipped"
        assert all(name in paths for name in REQUIRED_NOTICES), "Missing license notices"
        for entry in catalog:
            name = entry["path"].removeprefix("res://")
            assert archive.read(asset_prefix + name) == (ROOT / name).read_bytes(), name
        libraries = sorted(name for name in names if name.startswith(prefix + "lib/") and name.endswith(".so"))
        assert libraries and all("/arm64-v8a/" in name for name in libraries), "Unexpected native ABI"
        alignments = {}
        for name in libraries:
            data = archive.read(name)
            assert data[:5] == b"\x7fELF\x02", "Expected ELF64"
            endian = "<" if data[5] == 1 else ">"
            phoff = struct.unpack_from(endian + "Q", data, 32)[0]
            size, count = struct.unpack_from(endian + "HH", data, 54)
            loads = []
            for index in range(count):
                entry = struct.unpack_from(endian + "IIQQQQQQ", data, phoff + index * size)
                if entry[0] == 1:  # PT_LOAD
                    assert entry[7] >= 16384 and entry[2] % 16384 == entry[3] % 16384, "ELF lacks 16 KB page alignment"
                    loads.append(entry[7])
            assert loads
            alignments[name] = loads
        assert not any(name.startswith("META-INF/") and name.upper().endswith((".RSA", ".DSA", ".EC")) for name in names), "Validation artifact unexpectedly signed"
    result = {"file": path.name, "bytes": path.stat().st_size, "sha256": hashlib.sha256(path.read_bytes()).hexdigest(), "catalog_sources_checked": len(catalog), "notices_present": len(REQUIRED_NOTICES), "native_load_alignments": alignments, "signed": False, "profile": "base game without optional monetization SDKs"}
    if path.suffix == ".apk":
        tools = Path(os.environ["ANDROID_HOME"]) / "build-tools/36.1.0"
        manifest = subprocess.check_output([str(tools / "aapt"), "dump", "xmltree", str(path), "AndroidManifest.xml"], text=True)
        badging = subprocess.check_output([str(tools / "aapt"), "dump", "badging", str(path)], text=True)
        assert "name='com.piecepace.puzzles'" in badging
        assert "sdkVersion:'24'" in badging and "targetSdkVersion:'36'" in badging
        assert "application-label:'Pieceful'" in badging
        assert "application-debuggable" not in badging
        assert 'android:screenOrientation(0x0101001e)=(type 0x10)0xd' in manifest, "Expected fullSensor orientation"
        assert 'android:isGame(0x010103f4)=(type 0x12)0x1' in manifest or 'android:isGame(0x010103f4)=(type 0x12)0xffffffff' in manifest
        assert 'android:appCategory(0x01010545)=(type 0x10)0x0' in manifest, "Expected Android Game category"
        assert "android:allowBackup" in manifest and "android:allowBackup(0x01010280)=(type 0x12)0x0" in manifest
        subprocess.run([str(tools / "zipalign"), "-c", "-P", "16", "4", str(path)], check=True)
        result.update({"manifest_checked": "APK", "package": "com.piecepace.puzzles", "min_sdk": 24, "target_sdk": 36, "debuggable": False, "allow_backup": False, "permissions": [line for line in badging.splitlines() if line.startswith("uses-permission")], "zip_alignment_16kb": "passed"})
    else:
        assert bundletool and bundletool.is_file(), "AAB verification requires the locked bundletool"
        java = str(Path(os.environ["JAVA_HOME"]) / "bin/java")
        subprocess.run([java, "-jar", str(bundletool), "validate", "--bundle=" + str(path)], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        document = subprocess.check_output([java, "-jar", str(bundletool), "dump", "manifest", "--bundle=" + str(path), "--module=base"], text=True)
        manifest = ET.fromstring(document)
        namespace = "{http://schemas.android.com/apk/res/android}"
        application, sdk = manifest.find("application"), manifest.find("uses-sdk")
        assert manifest.get("package") == "com.piecepace.puzzles"
        assert sdk.get(namespace + "minSdkVersion") == "24" and sdk.get(namespace + "targetSdkVersion") == "36"
        assert application.get(namespace + "debuggable", "false") == "false"
        assert application.get(namespace + "allowBackup") == "false"
        assert application.get(namespace + "isGame") == "true" and application.get(namespace + "appCategory") == "0"
        assert any(activity.get(namespace + "screenOrientation") == "13" for activity in application.findall("activity"))
        result.update({"manifest_checked": "AAB protobuf via bundletool", "bundletool_validate": "passed", "package": "com.piecepace.puzzles", "min_sdk": 24, "target_sdk": 36, "debuggable": False, "allow_backup": False, "orientation": "fullSensor", "permissions": [node.get(namespace + "name") for node in manifest.findall("uses-permission")]})
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("artifacts", type=Path, nargs="+")
    parser.add_argument("--bundletool", type=Path, default=ROOT / ".godot-ci/bundletool.jar")
    args = parser.parse_args()
    print(json.dumps({"android_validation": [inspect(path, args.bundletool) for path in args.artifacts], "note": "Unsigned base-game artifacts; signing, optional SDKs, Play ingestion and devices remain unverified."}, indent=2))
