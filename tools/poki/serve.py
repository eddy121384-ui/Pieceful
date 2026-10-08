"""Loopback-only raw/gzip benchmark server; never a deployment configuration."""
import argparse
import gzip
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--root', required=True)
parser.add_argument('--port', type=int, default=4294)
args = parser.parse_args()
from pathlib import Path
root = Path(args.root).resolve()
compressed = {str(p): gzip.compress(p.read_bytes(), mtime=0)
              for directory in root.iterdir() if directory.is_dir()
              for p in directory.iterdir() if p.is_file() and p.suffix in ('.wasm', '.pck', '.js', '.html', '.json')}

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(root), **kw)
    def end_headers(self):
        self.send_header('Cache-Control', 'public, max-age=3600')
        super().end_headers()
    def do_GET(self):
        if self.path.startswith('/gzip/'):
            self.path = self.path.removeprefix('/gzip')
            path = self.translate_path(self.path)
            if path in compressed:
                data = compressed[path]
                self.send_response(200)
                self.send_header('Content-Type', self.guess_type(path))
                self.send_header('Content-Encoding', 'gzip')
                self.send_header('Content-Length', str(len(data)))
                self.send_header('Vary', 'Accept-Encoding')
                self.end_headers()
                self.wfile.write(data)
                return
        super().do_GET()
print(f'Benchmark only: http://127.0.0.1:{args.port}', flush=True)
ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
