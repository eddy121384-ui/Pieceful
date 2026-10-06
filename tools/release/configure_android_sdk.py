"""Set only SDK paths in an existing local Godot editor configuration."""
import argparse
import json
import os
from pathlib import Path
import re

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--sdk", type=Path, default=os.environ.get("ANDROID_HOME"))
parser.add_argument("--java", type=Path, default=os.environ.get("JAVA_HOME"))
parser.add_argument("--settings", type=Path, default=Path(os.environ.get("XDG_CONFIG_HOME", str(Path.home() / ".config"))) / "godot/editor_settings-4.7.tres")
args = parser.parse_args()
if not args.sdk or not args.java:
    raise SystemExit("Provide ANDROID_HOME/JAVA_HOME or --sdk/--java")
if not (args.sdk / "build-tools/36.1.0/aapt").is_file() or not (args.java / "bin/javac").is_file():
    raise SystemExit("Requires Android build-tools 36.1.0 and a full Java SDK")
if not args.settings.is_file():
    raise SystemExit("First run the pinned Godot with --headless --editor --quit to create local editor settings")
text = args.settings.read_text()
for key, path in [("export/android/android_sdk_path", args.sdk), ("export/android/java_sdk_path", args.java)]:
    line = key + " = " + json.dumps(str(path.resolve()))
    pattern = rf"(?m)^{re.escape(key)}\s*=.*$"
    if re.search(pattern, text):
        text = re.sub(pattern, lambda _match: line, text)
    else:
        text = text.rstrip() + "\n" + line + "\n"
args.settings.write_text(text)
print("Configured local Godot SDK paths; repository configuration and signing settings were not changed")
