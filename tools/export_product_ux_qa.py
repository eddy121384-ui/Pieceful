#!/usr/bin/env python3
"""Export the separate browser QA scene, always restoring production config."""
import argparse
import os
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--godot", default=os.environ.get("GODOT_BIN", "godot"))
parser.add_argument("--output", default="build/ux-qa/index.html")
args = parser.parse_args()
project = Path("project.godot")
original = project.read_bytes()
production_scene = 'run/main_scene="res://main.tscn"'
assert production_scene in original.decode(), "Expected the production main scene"
Path(args.output).parent.mkdir(parents=True, exist_ok=True)
try:
    project.write_text(original.decode().replace(
        production_scene,
        'run/main_scene="res://tests/commercial_product_browser_fixture.tscn"',
        1,
    ))
    subprocess.run([
        args.godot, "--headless", "--path", ".", "--export-release", "Web", args.output,
    ], check=True)
finally:
    project.write_bytes(original)
subprocess.run(["python3", "tools/instrument_web_loader.py", args.output], check=True)
