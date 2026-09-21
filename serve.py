#!/usr/bin/env python3
"""Serve spielwerk locally and persist snapshots as JSON files.

Usage: python3 serve.py [port]          (default 8765)

Static files come from this directory. Snapshots are stored one file per
tool in ~/Documents/spielwerk-snapshots/<tool>.json via a tiny API that
snapshots.js probes for:

  GET /snaps/ping     → "ok" (tells the page the file store is available)
  GET /snaps/<slug>   → the tool's snapshot array (or [])
  PUT /snaps/<slug>   → replace the tool's snapshot array
"""
import json, pathlib, sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = pathlib.Path(__file__).parent
DIR = pathlib.Path.home() / "Documents" / "spielwerk-snapshots"

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(ROOT), **kw)

    def end_headers(self):  # always revalidate, so an edited tool never runs a stale script
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def _slug(self):
        if not self.path.startswith("/snaps/"):
            return None
        slug = self.path[len("/snaps/"):]
        return slug if slug and all(c.isalnum() or c == "-" for c in slug) else None

    def _send(self, code, body):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        slug = self._slug()
        if slug is None:
            return super().do_GET()
        if slug == "ping":
            return self._send(200, b'"ok"')
        f = DIR / (slug + ".json")
        self._send(200, f.read_bytes() if f.exists() else b"[]")

    def do_PUT(self):
        slug = self._slug()
        if slug in (None, "ping"):
            return self._send(404, b'"not found"')
        body = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        json.loads(body)  # refuse to write garbage
        DIR.mkdir(parents=True, exist_ok=True)
        (DIR / (slug + ".json")).write_bytes(body)
        self._send(200, b'"ok"')

    def log_message(self, fmt, *args):  # keep the console quiet
        pass

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    print(f"spielwerk → http://localhost:{port}")
    print(f"snapshots → {DIR}")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
