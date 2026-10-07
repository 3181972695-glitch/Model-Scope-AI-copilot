"""
按来源 IP 的滑动窗口限流

用途：服务部署到公网（如魔搭创空间）后，防止单个来源无限刷 AI 接口，
      把 DeepSeek 账户余额烧光。仅在进程内存中计数，无需额外依赖。

说明：多 worker 部署时每个 worker 各自计数，配额会被放大 N 倍。
      生产环境可换成 Redis 实现，本项目演示场景用内存版足够。
"""

from __future__ import annotations

import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status

from config import RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_SECONDS

# key -> 该 key 在窗口内的请求时间戳队列
_hits: dict[str, deque[float]] = defaultdict(deque)

# 定期清理阈值：记录数超过该值时触发一次全量清扫，避免长跑内存增长
_CLEANUP_THRESHOLD = 4096


def _client_key(request: Request) -> str:
    """提取来源标识。优先取代理链首个地址，便于创空间这类反向代理场景。"""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def _cleanup(now: float) -> None:
    """清扫所有 key 的过期时间戳；队列为空的 key 直接移除。"""
    cutoff = now - RATE_LIMIT_WINDOW_SECONDS
    for key in list(_hits.keys()):
        queue = _hits[key]
        while queue and queue[0] <= cutoff:
            queue.popleft()
        if not queue:
            del _hits[key]


def enforce_rate_limit(request: Request) -> None:
    """FastAPI 依赖：超限时抛出 429，并给出 Retry-After。"""
    now = time.monotonic()
    key = _client_key(request)

    if len(_hits) > _CLEANUP_THRESHOLD:
        _cleanup(now)

    queue = _hits[key]
    cutoff = now - RATE_LIMIT_WINDOW_SECONDS
    while queue and queue[0] <= cutoff:
        queue.popleft()

    if len(queue) >= RATE_LIMIT_REQUESTS:
        retry_after = max(1, int(RATE_LIMIT_WINDOW_SECONDS - (now - queue[0])) + 1)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "message": "请求过于频繁，请稍后再试",
                "limit": RATE_LIMIT_REQUESTS,
                "window_seconds": RATE_LIMIT_WINDOW_SECONDS,
                "retry_after_seconds": retry_after,
            },
            headers={"Retry-After": str(retry_after)},
        )

    queue.append(now)
