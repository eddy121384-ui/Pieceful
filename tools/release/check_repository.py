"""Check repository invariants; success is not platform/store or legal certification."""
import argparse
import configparser
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]


def config(path: Path) -> configparser.ConfigParser:
    value = configparser.ConfigParser(interpolation=None, delimiters=("=",))
    value.optionxform = str
    value.read_string("[__root__]\n" + path.read_text())
    return value


def check(root: Path = ROOT) -> dict:
    project = config(root / "project.godot")
    presets = config(root / "export_presets.cfg")
    assert project["application"]["run/main_scene"] == '"res://main.tscn"'
    assert re.fullmatch(r'"\d+\.\d+\.\d+"', project["application"]["config/version"])
    assert project["debug"]["settings/stdout/print_to_stdout.release"] == "false"
    assert project["display"]["window/handheld/orientation"] == "6", "Allow accepted portrait and landscape layouts"
    assert project["monetization"]["use_real_ads"] == "false", "Default repository profile must remain non-monetized"
    assert '"res://addons/catalog_source_export/plugin.cfg"' in project["editor_plugins"]["enabled"]
    checked = []
    for section in presets.sections():
        if not re.fullmatch(r"preset\.\d+", section):
            continue
        settings = presets[section]
        excludes = json.loads(settings["exclude_filter"]).split(",")
        for prefix in ["tests", "tools", "build", "web", "authoring", "content/curation"]:
            assert prefix + "/*" in excludes, (section, prefix)
        assert "licenses/*" in json.loads(settings["include_filter"])
        assert settings["encrypt_pck"] == "false"
        if settings["platform"] == '"Android"':
            options = presets[section + ".options"]
            assert options["package/unique_name"] == '"com.piecepace.puzzles"', "Do not silently change the installed app identity"
            assert options["gradle_build/target_sdk"] == '"36"'
            assert options["architectures/arm64-v8a"] == "true"
            assert options["package/app_category"] == "2", "Android application category must be Game"
            assert 1 <= int(options["version/code"]) <= 2100000000
            for key in ["keystore/release", "keystore/release_user", "keystore/release_password"]:
                assert options.get(key, '""') == '""', "Signing material must be injected, never committed"
        checked.append(json.loads(settings["name"]))
    catalog = json.loads((root / "content/catalog_v1.json").read_text())["contents"]
    assert len({entry["id"] for entry in catalog}) == len(catalog)
    assert len({entry["source_id"] for entry in catalog}) == len(catalog)
    inventory = json.loads((root / "licenses/ASSET_MANIFEST.json").read_text())
    android_inventory = json.loads((root / "licenses/ANDROID-RUNTIME-INVENTORY.json").read_text())
    assert android_inventory["status"] == "dependency_inventory_not_legal_clearance"
    coordinates = android_inventory["resolved_external_coordinates"]
    assert coordinates and len(coordinates) == len(set(coordinates))
    indexed = {entry["path"]: entry for key in ["fonts", "artworks", "other_bundled_source_assets"] for entry in inventory[key]}
    for path, entry in indexed.items():
        source = root / path
        assert source.is_file(), path
        assert hashlib.sha256(source.read_bytes()).hexdigest() == entry["sha256"], path
    for entry in catalog:
        path = entry["path"].removeprefix("res://")
        assert path in indexed, path
        attribution = entry["attribution"]
        if entry["source_id"].startswith("met:"):
            assert attribution["license"] == "cc0"
            assert attribution["provider_rights_signal"] == {"field": "isPublicDomain", "value": True}
            assert attribution["source_url"].startswith("https://www.metmuseum.org/")
    runtime = json.loads((root / "content/runtime/met_v0_manifest.json").read_text())["entries"]
    assert {entry["id"] for entry in runtime} == {entry["id"] for entry in catalog if entry["source_id"].startswith("met:")}
    for entry in runtime:
        for key in ["puzzle", "thumbnail"]:
            asset = entry[key]
            source = root / asset["path"]
            assert source.stat().st_size == asset["bytes"]
            assert hashlib.sha256(source.read_bytes()).hexdigest() == asset["sha256"]
    return {"repository_checks": "passed", "export_presets": checked, "catalog_entries": len(catalog), "museum_assets_checked": len(runtime) * 2, "inventoried_source_assets": len(indexed), "android_dependency_coordinates": len(coordinates), "note": "This does not certify signing, ownership, platform integration, accessibility, or real-device readiness."}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT)
    args = parser.parse_args()
    print(json.dumps(check(args.root), indent=2))
