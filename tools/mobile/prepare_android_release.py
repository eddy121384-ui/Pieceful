#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
EXPORT_PRESETS = ROOT / "export_presets.cfg"
PRESET_NAME = "Android Release AAB"


def _replace_in_release_section(text: str, key: str, value: str) -> str:
    sections = list(re.finditer(r"(?m)^\[([^\]]+)\][ \t]*$", text))
    target = None
    for index, section in enumerate(sections):
        end = sections[index + 1].start() if index + 1 < len(sections) else len(text)
        if re.fullmatch(r"preset\.\d+", section[1]) and re.search(
            rf'(?m)^name="{re.escape(PRESET_NAME)}"$', text[section.end():end]
        ):
            target = section[1] + ".options"
            break
    if target is None:
        raise RuntimeError(f"Missing export preset: {PRESET_NAME}")
    options_pos = -1
    for index, section in enumerate(sections):
        if section[1] == target:
            options_pos = section.start()
            end = sections[index + 1].start() if index + 1 < len(sections) else len(text)
            break
    if options_pos < 0:
        raise RuntimeError(f"Missing {target} section")
    section = text[options_pos:end]

    pattern = rf"(?m)^{re.escape(key)}=.*$"
    replacement = f'{key}={value}'
    if not re.search(pattern, section):
        raise RuntimeError(f"Missing release option: {key}")
    section = re.sub(pattern, lambda _match: replacement, section, count=1)
    return text[:options_pos] + section + text[end:]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--version-code", type=int, required=True)
    parser.add_argument("--version-name", required=True)
    parser.add_argument("--presets", type=Path, default=EXPORT_PRESETS)
    args = parser.parse_args()

    if not 1 <= args.version_code <= 2100000000:
        raise SystemExit("--version-code must be between 1 and 2100000000")
    version_name = args.version_name.strip()
    if not version_name:
        raise SystemExit("--version-name must not be empty")
    if any(ch in version_name for ch in ['"', "\\", "\n", "\r"]):
        raise SystemExit("--version-name contains unsupported characters")

    text = args.presets.read_text(encoding="utf-8")
    text = _replace_in_release_section(text, "version/code", str(args.version_code))
    text = _replace_in_release_section(text, "version/name", f'"{version_name}"')
    args.presets.write_text(text, encoding="utf-8")

    print(f"Android Release AAB version -> code={args.version_code}, name={version_name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
