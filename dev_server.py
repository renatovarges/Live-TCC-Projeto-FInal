#!/usr/bin/env python3
"""Servidor local: serve os arquivos e faz o proxy /api/cartola/* (igual à função do Netlify).
Uso: python dev_server.py  ->  http://localhost:8002"""
import http.server, socketserver, urllib.request, urllib.error, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8002
UA = {'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json'}

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_GET(self):
        if self.path.startswith('/api/cartola/'):
            url = 'https://api.cartola.globo.com/' + self.path[len('/api/cartola/'):]
            try:
                with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20) as r:
                    body = r.read(); code = r.status
            except urllib.error.HTTPError as e:
                body = e.read(); code = e.code
            except Exception as e:
                body = str(e).encode(); code = 502
            self.send_response(code)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers(); self.wfile.write(body)
        else:
            super().do_GET()

socketserver.ThreadingTCPServer.allow_reuse_address = True
with socketserver.ThreadingTCPServer(('', PORT), Handler) as srv:
    print(f'http://localhost:{PORT}')
    srv.serve_forever()
