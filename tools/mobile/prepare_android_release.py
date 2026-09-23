#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EXPORT_PRESETS = ROOT / "export_presets.cfg"
PRESET_NAME = "Android Release AAB"


def _replace_in_release_section(text: str, key: str, value: str) -> str:
    marker = f'name="{PRESET_NAME}"'
    preset_pos = text.find(marker)
    if preset_pos < 0:
        raise RuntimeError(f"Missing export preset: {PRESET_NAME}")

    options_pos = text.find("[preset.2.options]", preset_pos)
    if options_pos < 0:
        raise RuntimeError("Missing Android Release AAB options section")

    next_section = text.find("
[preset.", options_pos + 1)
    end = len(text) if next_section < 0 else next_section
    section = text[options_pos:end]

    pattern = rf"(?m)^{re.escape(key)}=.*$"
    replacement = f'{key}={value}'
    if not re.search(pattern, section):
        raise RuntimeError(f"Missing release option: {key}")
    section = re.sub(pattern, replacement, section, count=1)
    return text[:options_pos] + section + text[end:]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--version-code", type=int, required=True)
    parser.add_argument("--version-name", required=True)
    args = parser.parse_args()

    if args.version_code < 1:
        raise SystemExit("--version-code must be >= 1")
    version_name = args.version_name.strip()
    if not version_name:
        raise SystemExit("--version-name must not be empty")
    if any(ch in version_name for ch in ['"', "\n", "\r"]):
        raise SystemExit("--version-name contains unsupported characters")

    text = EXPORT_PRESETS.read_text(encoding="utf-8")
    text = _replace_in_release_section(text, "version/code", str(args.version_code))
    text = _replace_in_release_section(text, "version/name", f'"{version_name}"')
    EXPORT_PRESETS.write_text(text, encoding="utf-8")

    print(f"Android Release AAB version -> code={args.version_code}, name={version_name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
