"""로컬 미리보기(비밀번호 없음): python3 scripts/serve.py → http://127.0.0.1:8113/"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

if __name__ == '__main__':
    root = Path(__file__).resolve().parents[1] / 'site'
    print('http://127.0.0.1:8113/', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 8113), partial(SimpleHTTPRequestHandler, directory=str(root))).serve_forever()
