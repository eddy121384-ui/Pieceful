"""Local-only repeatable identity/gzip HTTP delivery for cold-browser profiling.

Precompresses before listening; does not put server compression time in startup.
This is a measurement fixture, not a production hosting/CDN configuration.
"""
import argparse
import gzip
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--root", type=Path, default=Path("build"))
parser.add_argument("--port", type=int, default=4290)
args = parser.parse_args()
root = args.root.resolve()
compressed = {str(p): gzip.compress(p.read_bytes(), mtime=0) for p in root.glob("perf-*/index.*") if p.suffix in (".wasm", ".pck", ".js", ".html")}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *arguments, **keywords):
        super().__init__(*arguments, directory=str(root), **keywords)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        super().end_headers()

    def do_GET(self):
        path = self.translate_path(self.path)
        # /gzip/<normal-path> opts in explicitly; raw requests remain raw.
        if self.path.startswith("/gzip/"):
            self.path = self.path.removeprefix("/gzip")
            path = self.translate_path(self.path)
            if path in compressed:
                data = compressed[path]
                self.send_response(200)
                self.send_header("Content-Type", self.guess_type(path))
                self.send_header("Content-Encoding", "gzip")
                self.send_header("Content-Length", str(len(data)))
                self.send_header("Vary", "Accept-Encoding")
                self.end_headers()
                self.wfile.write(data)
                return
        super().do_GET()


print(f"Local benchmark server on 127.0.0.1:{args.port}", flush=True)
ThreadingHTTPServer(("127.0.0.1", args.port), Handler).serve_forever()
