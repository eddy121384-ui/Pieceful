#!/usr/bin/env python3
"""Configure bundled museum JPEG imports for mobile-friendly Godot builds.

Godot's default JPEG import is lossless CompressedTexture2D, which expands the
35-image starter library substantially inside Web PCKs. Museum source JPEGs are
already curated production derivatives, so runtime imports use Godot's lossy
texture mode while preserving the original committed JPEG as the authoring
source.
"""

from __future__ import annotations

import argparse
from pathlib import Path


def configure(root: Path) -> tuple[int, int]:
    files = sorted(root.rglob("*.jpg.import"))
    if not files:
        raise RuntimeError(f"No .jpg.import files found under {root}")

    changed = 0
    for path in files:
        text = path.read_text(encoding="utf-8")
        original = text
        text = text.replace("compress/mode=0", "compress/mode=1")
        quality = "0.76" if "/puzzles/" in path.as_posix() else "0.70"
        if "compress/lossy_quality=" in text:
            lines = []
            for line in text.splitlines():
                if line.startswith("compress/lossy_quality="):
                    line = f"compress/lossy_quality={quality}"
                lines.append(line)
            text = "\n".join(lines) + ("\n" if original.endswith("\n") else "")
        if text != original:
            path.write_text(text, encoding="utf-8")
            changed += 1
    return len(files), changed


def self_test(tmp: Path) -> int:
    target = tmp / "assets/museum/met_v0/puzzles"
    target.mkdir(parents=True, exist_ok=True)
    sample = target / "fixture.jpg.import"
    sample.write_text(
        "[params]\n\ncompress/mode=0\ncompress/lossy_quality=0.7\n",
        encoding="utf-8",
    )
    total, changed = configure(tmp / "assets/museum/met_v0")
    out = sample.read_text(encoding="utf-8")
    assert total == 1
    assert changed == 1
    assert "compress/mode=1" in out
    assert "compress/lossy_quality=0.76" in out
    print("PASS museum texture import config self-test")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default="assets/museum/met_v0")
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--self-test-dir", default=".pieceful-content/texture-import-self-test")
    args = parser.parse_args()

    if args.self_test:
        return self_test(Path(args.self_test_dir))

    total, changed = configure(Path(args.root))
    print(f"Configured {total} museum texture imports; changed {changed}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
