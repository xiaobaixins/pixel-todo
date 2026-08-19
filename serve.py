"""局域网静态服务器（带正确 MIME，供手机访问 PixelTodo）。
用法: python serve.py [port]  默认 8080
"""
import http.server, socketserver, mimetypes, sys

mimetypes.add_type('application/manifest+json', '.webmanifest')
mimetypes.add_type('image/png', '.png')
mimetypes.add_type('font/woff2', '.woff2')

class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map)
    extensions_map.update(mimetypes.types_map)

    def log_message(self, fmt, *args):
        sys.stdout.write('%s %s\n' % (self.address_string(), fmt % args))

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
with socketserver.ThreadingTCPServer(('0.0.0.0', PORT), Handler) as httpd:
    print('PixelTodo serving on http://0.0.0.0:%d  (Ctrl+C to stop)' % PORT)
    httpd.serve_forever()
