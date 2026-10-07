#!/usr/bin/env python3
"""本地复现展示平台的部署形态，用于「上线前验收」。

平台把作品挂在子路径下，例如 https://demo.tom-thu.cn/copilot/ ：

    /copilot/…        → 前端静态产物（dist/）
    /copilot/api/…    → 反向代理到后端服务

这个形态和「直接打开 index.html」「本地 dev server」都不一样，最容易在上线后才发现问题
（资源 404 导致白屏、接口路径 404 导致对话不可用）。本脚本把这一形态搬到本地：

    # 1. 后端
    cd backend && uvicorn main:app --port 8000
    # 2. 按平台前缀构建前端
    VITE_BASE=/copilot/ npm run build
    # 3. 起本脚本，然后浏览器访问 http://127.0.0.1:8080/copilot/
    python deploy/serve_like_platform.py --port 8080

它只做两件事：按前缀发静态文件；把 /<prefix>/api/* 原样转发给后端（含 SSE 流式透传）。
"""

from __future__ import annotations

import argparse
import http.client
import mimetypes
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "dist")

# 前缀与后端地址由命令行覆盖
PREFIX = "/copilot"
BACKEND_HOST = "127.0.0.1"
BACKEND_PORT = 8000


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    disable_nagle_algorithm = True

    def log_message(self, fmt, *args):  # 收敛日志噪音
        sys.stderr.write("[serve] %s\n" % (fmt % args))

    # ── 路由 ──
    def do_GET(self):
        self._route()

    def do_POST(self):
        self._route()

    def do_OPTIONS(self):
        self._route()

    def _route(self):
        path = urlsplit(self.path).path
        api_prefix = f"{PREFIX}/api"

        if path == PREFIX:
            self.send_response(301)
            self.send_header("Location", f"{PREFIX}/")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return

        if path.startswith(api_prefix):
            self._proxy(path[len(PREFIX):])
            return

        if path.startswith(f"{PREFIX}/"):
            self._static(path[len(PREFIX):])
            return

        self._send(404, b"not found under this prefix", "text/plain; charset=utf-8")

    # ── 静态文件（含 SPA 回退） ──
    def _static(self, rel_path: str):
        rel = rel_path.lstrip("/") or "index.html"
        target = os.path.normpath(os.path.join(DIST, rel))

        # 防目录穿越
        if not target.startswith(DIST):
            self._send(403, b"forbidden", "text/plain; charset=utf-8")
            return

        if os.path.isdir(target):
            target = os.path.join(target, "index.html")
        if not os.path.isfile(target):
            # 前端为单页应用：未知路径交给 index.html 处理
            target = os.path.join(DIST, "index.html")
            if not os.path.isfile(target):
                self._send(404, b"dist not built: run `VITE_BASE=<prefix>/ npm run build`", "text/plain; charset=utf-8")
                return

        ctype = mimetypes.guess_type(target)[0] or "application/octet-stream"
        with open(target, "rb") as fh:
            body = fh.read()
        self._send(200, body, ctype)

    def _send(self, status: int, body: bytes, ctype: str):
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    # ── 反向代理 → 后端 ──
    def _proxy(self, upstream_path: str):
        length = int(self.headers.get("Content-Length") or 0)
        payload = self.rfile.read(length) if length else None

        headers = {
            k: v
            for k, v in self.headers.items()
            if k.lower() not in ("host", "content-length", "connection", "accept-encoding")
        }
        if payload is not None:
            headers["Content-Length"] = str(len(payload))

        conn = http.client.HTTPConnection(BACKEND_HOST, BACKEND_PORT, timeout=300)
        try:
            conn.request(self.command, upstream_path, body=payload, headers=headers)
            resp = conn.getresponse()
        except OSError as exc:
            self._send(502, f"backend unreachable: {exc}".encode(), "text/plain; charset=utf-8")
            conn.close()
            return

        upstream_len = resp.getheader("Content-Length")
        self.send_response(resp.status)
        for key, value in resp.getheaders():
            if key.lower() in ("content-length", "transfer-encoding", "connection"):
                continue
            self.send_header(key, value)
        if upstream_len is not None:
            self.send_header("Content-Length", upstream_len)
        else:
            # 无长度（如 SSE）→ 用连接关闭标记结束，逐块透传不缓冲
            self.send_header("Connection", "close")
            self.close_connection = True
        self.end_headers()

        try:
            while True:
                chunk = resp.read(1024)
                if not chunk:
                    break
                self.wfile.write(chunk)
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            pass  # 客户端主动断开（例如用户离开页面）
        finally:
            conn.close()


def main():
    parser = argparse.ArgumentParser(description="按展示平台形态本地运行（前缀 + API 代理）")
    parser.add_argument("--port", type=int, default=8080, help="本地监听端口")
    parser.add_argument("--prefix", default="/copilot", help="部署前缀，需与 VITE_BASE 一致")
    parser.add_argument("--backend", default="http://127.0.0.1:8000", help="后端地址")
    args = parser.parse_args()

    global PREFIX, BACKEND_HOST, BACKEND_PORT
    PREFIX = args.prefix.rstrip("/")
    split = urlsplit(args.backend)
    BACKEND_HOST = split.hostname or "127.0.0.1"
    BACKEND_PORT = split.port or 80

    if not os.path.isfile(os.path.join(DIST, "index.html")):
        print(f"⚠  未找到 {DIST}/index.html，请先执行：VITE_BASE={PREFIX}/ npm run build")
        return 1

    index_html = open(os.path.join(DIST, "index.html"), encoding="utf-8").read()
    if f'"{PREFIX}/assets/' not in index_html:
        print(f"⚠  dist/index.html 的资源前缀与 {PREFIX} 不一致，页面会白屏。")
        print(f"   请用：VITE_BASE={PREFIX}/ npm run build")
        return 1

    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    print(f"✓ 模拟平台部署形态： http://127.0.0.1:{args.port}{PREFIX}/")
    print(f"  静态目录 {DIST}")
    print(f"  接口转发 {PREFIX}/api/* → {args.backend}/api/*")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n已停止")
    return 0


if __name__ == "__main__":
    sys.exit(main())
