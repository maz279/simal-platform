import os
import sys
sys.stdout.reconfigure(encoding='utf-8')
import socket
from http.server import SimpleHTTPRequestHandler, HTTPServer
import mimetypes

# Additional MIME types for modern web
mimetypes.add_type('font/woff2', '.woff2')
mimetypes.add_type('font/woff', '.woff')
mimetypes.add_type('font/ttf', '.ttf')
mimetypes.add_type('font/eot', '.eot')
mimetypes.add_type('image/webp', '.webp')
mimetypes.add_type('image/svg+xml', '.svg')
mimetypes.add_type('application/json', '.json')

DIRECTORY = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Mirror_site')

class ResilientMirrorHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    # Handle POST requests from WooCommerce (e.g. ?wc-ajax=get_refreshed_fragments)
    def do_POST(self):
        # Respond with empty JSON fragment
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        response_body = b'{"fragments":{},"cart_hash":""}'
        self.send_header('Content-Length', str(len(response_body)))
        self.end_headers()
        self.wfile.write(response_body)

    # Handle OPTIONS preflight requests
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With')
        self.end_headers()

    # Suppress broken pipe / connection reset logging noise
    def handle_one_request(self):
        try:
            super().handle_one_request()
        except (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            pass

    def log_message(self, format, *args):
        # Clean logging
        sys.stdout.write(f"[{self.log_date_time_string()}] {args[0]} -> {args[1]}\n")
        sys.stdout.flush()

class ThreadedHTTPServer(HTTPServer):
    daemon_threads = True

def run(port=8080):
    server_address = ('', port)
    httpd = ThreadedHTTPServer(server_address, ResilientMirrorHandler)
    print(f"==================================================")
    print(f" Resilient Simal Mirror Server Online")
    print(f" Serving: {DIRECTORY}")
    print(f" URL:     http://localhost:{port}/")
    print(f"==================================================")
    sys.stdout.flush()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()

if __name__ == '__main__':
    port = 8080
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except:
            pass
    run(port)
