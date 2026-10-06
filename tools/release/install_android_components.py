"""Install the pinned Android API/build tools without assuming sdkmanager is on PATH."""
import argparse
import json
import os
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--sdk", type=Path, default=os.environ.get("ANDROID_HOME"))
args = parser.parse_args()
if not args.sdk:
    raise SystemExit("Requires an installed Android SDK (ANDROID_HOME or --sdk)")
manager = args.sdk / "cmdline-tools/latest/bin/sdkmanager"
if not manager.is_file():
    raise SystemExit("Install Android command-line tools at " + str(manager))
lock = json.loads((ROOT / "release_toolchain.lock.json").read_text())["android"]
subprocess.run([str(manager), "platform-tools", f"platforms;android-{lock['compile_sdk']}", f"build-tools;{lock['build_tools']}"], check=True)
print("Verified Android SDK component installation")
