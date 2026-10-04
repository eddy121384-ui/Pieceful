"""Build unsigned release validation artifacts. These are not upload/install-ready."""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--godot", default=os.environ.get("GODOT_BIN", "godot"))
parser.add_argument("--templates", type=Path, required=True)
parser.add_argument("--output", type=Path, default=ROOT / "build/android-validation")
parser.add_argument("--apk-only", action="store_true")
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
args.output.joinpath(".gdignore").touch()
presets = ROOT / "export_presets.cfg"
original = presets.read_bytes()
text = original.decode()
section = re.search(r"(?ms)^\[preset\.(\d+)\]\s*\n(?:(?!^\[).)*?^name=\"Android Release AAB\"", text)
if section is None:
    raise SystemExit("Missing Android Release AAB preset")
options = re.search(rf"(?ms)^\[preset\.{section[1]}\.options\]\s*\n.*?(?=^\[|\Z)", text)
if options is None:
    raise SystemExit("Missing release options")
def configured(gradle: bool, format_id: int) -> str:
    body = options[0]
    for key, value in [("package/signed", "false"), ("gradle_build/use_gradle_build", str(gradle).lower()), ("gradle_build/export_format", str(format_id))]:
        body, count = re.subn(rf"(?m)^{re.escape(key)}=.*$", key + "=" + value, body)
        if count != 1:
            raise ValueError("Unsupported preset option: " + key)
    if not gradle:
        # Stock APK templates already carry the pinned SDK values; Godot rejects
        # explicit SDK overrides outside a Gradle build.
        for key in ["gradle_build/min_sdk", "gradle_build/target_sdk"]:
            body = re.sub(rf"(?m)^{re.escape(key)}=.*$", key + '=\"\"', body)
    return text[:options.start()] + body + text[options.end():]
try:
    presets.write_text(configured(False, 0))
    apk = (args.output / "pieceful-validation-unsigned.apk").resolve()
    subprocess.run([args.godot, "--headless", "--path", str(ROOT), "--export-release", "Android Release AAB", str(apk)], check=True)
    if not args.apk_only:
        build = ROOT / "android/build"
        if build.exists():
            raise SystemExit("Existing Android build template: preserve it; use a clean validation checkout or remove only known generated template output")
        build.mkdir(parents=True)
        with zipfile.ZipFile(args.templates / "android_source.zip") as archive:
            archive.extractall(build)
        # Godot's template manager records this beside build/, not inside it.
        (build.parent / ".build_version").write_bytes((args.templates / "version.txt").read_bytes())
        for name in ["android_debug.apk", "android_release.apk"]:
            # Stock Godot's source template already carries its engine payload;
            # these archives remain in the verified template directory.
            if not (args.templates / name).exists():
                raise SystemExit("Missing verified template: " + name)
        lock = json.loads((ROOT / "release_toolchain.lock.json").read_text())["android"]
        wrapper = build / "gradle/wrapper/gradle-wrapper.properties"
        source = wrapper.read_text()
        if f"gradle-{lock['gradle']}-bin.zip" not in source:
            raise SystemExit("Android template Gradle version differs from the lock")
        wrapper.write_text(source.rstrip() + "\ndistributionSha256Sum=" + lock["gradle_distribution_sha256"] + "\n")
        (build / "gradlew").chmod(0o755)
        presets.write_text(configured(True, 1))
        aab = (args.output / "pieceful-validation-unsigned.aab").resolve()
        subprocess.run([args.godot, "--headless", "--path", str(ROOT), "--export-release", "Android Release AAB", str(aab)], check=True)
finally:
    presets.write_bytes(original)
print("PASS unsigned Android release export validation; signing and device validation remain unperformed")
