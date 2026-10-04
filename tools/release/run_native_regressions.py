"""Run the existing accepted regression list plus the release guard in isolated data roots."""
import argparse
import concurrent.futures
import json
import os
from pathlib import Path
import subprocess
import time

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--godot", default=os.environ.get("GODOT_BIN", "godot"))
parser.add_argument("--output", type=Path, default=ROOT / "build/release-native-tests")
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
tests = [item["test"] for item in json.loads((ROOT / "docs/ux-evidence/regression-results.json").read_text())["tests"]]
tests.append("release_runtime_smoke")


def run(test):
    started = time.monotonic()
    data = (args.output / test).resolve()
    data.mkdir(exist_ok=True)
    log = args.output / (test + ".log")
    env = os.environ.copy()
    env["XDG_DATA_HOME"] = str(data)
    try:
        with log.open("w") as output:
            result = subprocess.run([args.godot, "--headless", "--path", str(ROOT), "--script", f"tests/{test}.gd"], env=env, stdout=output, stderr=subprocess.STDOUT, timeout=360)
        passed = result.returncode == 0 and any(line.startswith("PASS") for line in log.read_text().splitlines())
    except subprocess.TimeoutExpired:
        passed = False
    record = {"test": test, "passed": passed, "seconds": round(time.monotonic() - started, 1)}
    print(json.dumps(record), flush=True)
    if not passed:
        print(log.read_text(), flush=True)
    return record


with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    results = list(pool.map(run, tests))
(args.output / "results.json").write_text(json.dumps({"suite_count": len(results), "passed": sum(item["passed"] for item in results), "tests": results}, indent=2) + "\n")
raise SystemExit(0 if all(item["passed"] for item in results) else 1)
