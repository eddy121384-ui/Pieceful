#!/usr/bin/env python3
from pathlib import Path
import sys

path = Path(sys.argv[1] if len(sys.argv) > 1 else "build/web/index.html")
html = path.read_text(encoding="utf-8")

metrics_markup = '<div id="status-metrics" style="margin-top:10px;font:12px/1.4 system-ui,sans-serif;color:rgba(255,255,255,.62);text-align:center;min-height:18px"></div>'
if 'id="status-metrics"' not in html:
    html = html.replace(
        '<progress id="status-progress"></progress>',
        '<progress id="status-progress"></progress>\n\t\t\t' + metrics_markup,
    )

if "const statusMetrics = document.getElementById('status-metrics');" not in html:
    html = html.replace(
        "const statusNotice = document.getElementById('status-notice');",
        "const statusNotice = document.getElementById('status-notice');\n\tconst statusMetrics = document.getElementById('status-metrics');\n\tconst progressStartedAt = performance.now();",
    )

old = """\t\t\t'onProgress': function (current, total) {
\t\t\t\tif (current > 0 && total > 0) {
\t\t\t\t\tstatusProgress.value = current;
\t\t\t\t\tstatusProgress.max = total;
\t\t\t\t} else {
\t\t\t\t\tstatusProgress.removeAttribute('value');
\t\t\t\t\tstatusProgress.removeAttribute('max');
\t\t\t\t}
\t\t\t},"""

new = """\t\t\t'onProgress': function (current, total) {
\t\t\t\tif (current > 0 && total > 0) {
\t\t\t\t\tstatusProgress.value = current;
\t\t\t\t\tstatusProgress.max = total;
\t\t\t\t\tconst elapsedSeconds = Math.max((performance.now() - progressStartedAt) / 1000, 0.001);
\t\t\t\t\tconst mib = 1024 * 1024;
\t\t\t\t\tconst rate = current / mib / elapsedSeconds;
\t\t\t\t\tconst percent = current / total * 100;
\t\t\t\t\tstatusMetrics.textContent =
\t\t\t\t\t\t'Downloading Godot · ' +
\t\t\t\t\t\t(current / mib).toFixed(1) + ' / ' + (total / mib).toFixed(1) +
\t\t\t\t\t\t' MiB · ' + percent.toFixed(1) + '% · ' + rate.toFixed(2) + ' MiB/s';
\t\t\t\t} else {
\t\t\t\t\tstatusProgress.removeAttribute('value');
\t\t\t\t\tstatusProgress.removeAttribute('max');
\t\t\t\t\tstatusMetrics.textContent = 'Preparing Godot runtime…';
\t\t\t\t}
\t\t\t},"""

if old not in html:
    raise SystemExit("Could not find Godot onProgress block to instrument")
html = html.replace(old, new)
path.write_text(html, encoding="utf-8")
print(f"Instrumented Godot loader progress metrics in {path}")
