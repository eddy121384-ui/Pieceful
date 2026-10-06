"""Summarize repeatable measurements without treating scoped counters as RSS."""
import argparse
import json
from pathlib import Path
import statistics


def summarize(artifacts, probe):
    cold = {}
    for profile in sorted({row["profile"] for row in probe["cold"]}):
        rows = [row for row in probe["cold"] if row["profile"] == profile]
        measurements = []
        for row in rows:
            resources = row["resources"]
            wasm = next(r for r in resources if r["name"].endswith("index.wasm"))
            pack = next(r for r in resources if r["name"].endswith("index.pck"))
            last_asset = max(wasm["responseEnd"], pack["responseEnd"], row["marks"]["instantiateStreamingEnd"])
            measurements.append({"engine_ready_ms": row["marks"]["engineReady"], "html_dom_content_loaded_ms": row["navigation"]["domContentLoadedEventEnd"], "wasm_response_end_ms": wasm["responseEnd"], "wasm_stream_instantiate_end_ms": row["marks"]["instantiateStreamingEnd"], "pck_response_end_ms": pack["responseEnd"], "post_assets_to_engine_ready_ms": row["marks"]["engineReady"] - last_asset, "measured_encoded_body_bytes": sum(r["encodedBodySize"] for r in resources) + row["navigation"]["encodedBodySize"], "measured_decoded_body_bytes": sum(r["decodedBodySize"] for r in resources) + row["navigation"]["decodedBodySize"]})
        cold[profile] = {"trials": len(rows), "median": {key: statistics.median(row[key] for row in measurements) for key in measurements[0]}, "engine_ready_range_ms": [min(row["engine_ready_ms"] for row in measurements), max(row["engine_ready_ms"] for row in measurements)], "measurements": measurements}
    runtime = []
    for row in probe["runtime"]:
        if "samples" not in row:
            runtime.append(row)
            continue
        samples = row["samples"]
        runtime.append({"tag": row["tag"], "pieces": row["pieces"], "sample_count": len(samples), "nodes_last": samples[-1]["nodes"], "resource_count_last": samples[-1]["resources"], "builtin_cached_textures": len([texture for texture in samples[-1]["texture_cache"] if texture["path"].startswith("res://")]), "photo_cached_textures": len([texture for texture in samples[-1]["texture_cache"] if texture["path"].startswith("user://")]), "texture_counter_max_bytes": max(s["texture_bytes"] for s in samples), "render_buffer_counter_max_bytes": max(s["render_buffer_bytes"] for s in samples), "wasm_linear_max_bytes": max(s["wasm_linear_bytes"] for s in samples), "cpu_process_median_ms": statistics.median(s["process_seconds"] for s in samples) * 1000, "draw_calls_last": samples[-1]["draw_calls"], "fps_range": [min(s["fps"] for s in samples), max(s["fps"] for s in samples)], "js_heap": row["jsHeap"], "process_rss": row["processRss"], "start_observed_ms": row.get("startObservedMs")})
    return {"artifact_raw_bytes": artifacts["raw_bytes"], "artifact_calculated_gzip_bytes": artifacts["gzip_bytes"], "artifacts": artifacts["artifacts"], "cold": cold, "qa_timing": {k: v for k, v in probe.items() if k.endswith("Ms")}, "runtime": runtime, "limits": probe["limits"], "orphan_counter": "Unavailable in release (DEBUG_ENABLED only); zero is not evidence of no orphan nodes. Native debug probe reports actual values."}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--measurements", type=Path, required=True)
    parser.add_argument("--build", type=Path, default=Path("build"))
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    result = {"before": summarize(json.loads((args.build / "perf-before/artifact-manifest.json").read_text()), json.loads((args.measurements / "before-browser.json").read_text())), "after": summarize(json.loads((args.build / "perf-after/artifact-manifest.json").read_text()), json.loads((args.measurements / "after-browser.json").read_text()))}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n")
