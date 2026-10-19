"""Prototype preview server.

Serves the prototype directory on 127.0.0.1:8000 with cache headers that end
the stale-browser class of bugs:
  - HTML            -> Cache-Control: no-store  (every navigation fetches fresh)
  - versioned (?v=) -> public, max-age=31536000, immutable (fetch once)
  - other assets    -> no-cache (revalidate with If-Modified-Since)
Run:  python serve_prototype.py   (from legacy/ — serves ../prototype/)
unify(2026-10-19): previously served the workspace root at /Prototype/…;
the prototype now lives in-repo, so this serves it directly at /.
"""
import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        path = self.path.split('?')[0]
        ext = os.path.splitext(path)[1].lower()
        versioned = '?' in self.path
        if ext == '.html' or not ext:
            self.send_header('Cache-Control', 'no-store')
        elif versioned:
            self.send_header('Cache-Control', 'public, max-age=31536000, immutable')
        else:
            self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def log_message(self, fmt, *args):  # quiet
        pass


if __name__ == '__main__':
    root = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'prototype'))
    os.chdir(root)
    server = HTTPServer(('127.0.0.1', 8000), Handler)
    print('serving %s at http://127.0.0.1:8000/ (HTML no-store, ?v= immutable)' % root, flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        sys.exit(0)
