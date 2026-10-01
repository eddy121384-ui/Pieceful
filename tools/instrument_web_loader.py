#!/usr/bin/env python3
from pathlib import Path
import sys
from web_persistence_patch import patch_web_persistence

path = Path(sys.argv[1] if len(sys.argv) > 1 else "build/web/index.html")
patch_web_persistence(path.with_suffix(".js"))
html = path.read_text(encoding="utf-8")

metrics_markup = '<div id="status-metrics" style="margin-top:16px;font:13px/1.5 system-ui,sans-serif;color:#63746c;text-align:center;min-height:20px"></div>'
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
\t\t\t\t\t\t'Opening your puzzle · ' + Math.round(percent) + '%';
\t\t\t\t} else {
\t\t\t\t\tstatusProgress.removeAttribute('value');
\t\t\t\t\tstatusProgress.removeAttribute('max');
\t\t\t\t\tstatusMetrics.textContent = 'Preparing your puzzle…';
\t\t\t\t}
\t\t\t},"""

if old not in html:
    raise SystemExit("Could not find Godot onProgress block to instrument")
html = html.replace(old, new)
html = html.replace('<title>Piecepace: Jigsaw Puzzles</title>', '<title>Pieceful · Piece at your own pace</title>')
html = html.replace('<div id="status">', '<div id="status">\n<div id="status-brand">Pieceful</div><div id="status-caption">Piece at your own pace</div>')
paper_css = '''
/* Pieceful loading presentation; engine progress/error behavior is preserved. */
body, #status { background-color: #fafaf5; color: #334740; }
#status-splash { display: none !important; }
#status-brand { font: 38px/1.3 Georgia, "Times New Roman", serif; }
#status-caption { margin: 6px 24px 32px; font: italic 14px/1.5 Georgia, serif; color: #63746c; }
#status-progress { position: static; width: 176px; height: 3px; appearance: none; border: 0; border-radius: 1px; background: #e7ece5; }
#status-progress::-webkit-progress-bar { background: #e7ece5; }
#status-progress::-webkit-progress-value { background: #81988a; }
#status-progress::-moz-progress-bar { background: #81988a; }
#status-notice { color: #334740; background: #f3f5ee; border: 1px solid #dce3da; max-width: 340px; padding: 20px; margin: 24px; font: 14px/1.6 system-ui, sans-serif; }
'''
html = html.replace('</style>', paper_css + '\n</style>', 1)
path.write_text(html, encoding="utf-8")
print(f"Instrumented Godot loader progress metrics in {path}")
