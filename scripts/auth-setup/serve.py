"""Local static credential-form helper. Never accepts or saves submitted secrets."""
import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
ALLOWED = {"/", "/index.html", "/form.mjs", "/properties.mjs", "/styles.css"}

class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".mjs": "text/javascript; charset=utf-8"}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        parsed = urlsplit(self.path)
        if parsed.path not in ALLOWED or parsed.query:
            self.send_error(404)
            return
        super().do_GET()

    def do_HEAD(self):
        parsed = urlsplit(self.path)
        if parsed.path not in ALLOWED or parsed.query:
            self.send_error(404)
            return
        super().do_HEAD()

    def do_POST(self):
        self.send_error(405, "This helper never accepts form submissions")

    def end_headers(self):
        self.send_header("Content-Security-Policy",
            "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'none'; "
            "form-action 'none'; base-uri 'none'; frame-ancestors 'none'")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def log_message(self, fmt, *args):
        # Never log request URLs, query parameters or form values.
        pass

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8766)
    args = parser.parse_args()
    print(f"Local setup form: http://127.0.0.1:{args.port}/", flush=True)
    ThreadingHTTPServer(("127.0.0.1", args.port), Handler).serve_forever()
