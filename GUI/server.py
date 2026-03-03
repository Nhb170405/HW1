"""
Minesweeper Web Server
- Serve static files (index.html, style.css, app.js)
- API endpoints for scores.json
"""
import http.server
import json
import os
import webbrowser
import threading

PORT = int(os.environ.get('PORT', 8888))
SCORES_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'scores.json')

def get_scores():
    if not os.path.exists(SCORES_FILE):
        return {}
    try:
        with open(SCORES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return {}

def save_scores(data):
    with open(SCORES_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

class MinesweeperHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        gui_dir = os.path.dirname(os.path.abspath(__file__))
        super().__init__(*args, directory=gui_dir, **kwargs)

    def do_GET(self):
        if self.path == '/api/scores':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(get_scores(), ensure_ascii=False).encode('utf-8'))
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/scores':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8')
            try:
                data = json.loads(body)
                save_scores(data)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(b'{"ok":true}')
            except json.JSONDecodeError:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b'{"error":"invalid json"}')
        else:
            self.send_response(404)
            self.end_headers()

    def do_DELETE(self):
        if self.path == '/api/scores':
            save_scores({})
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"ok":true}')
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def log_message(self, format, *args):
        pass  # suppress logs

def run_server(open_browser=True):
    server = http.server.HTTPServer(('0.0.0.0', PORT), MinesweeperHandler)
    print(f'Minesweeper server running at http://127.0.0.1:{PORT}')
    if open_browser:
        threading.Timer(0.5, lambda: webbrowser.open(f'http://127.0.0.1:{PORT}/index.html')).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nServer stopped.')
        server.server_close()

if __name__ == '__main__':
    run_server()
