"""Dependensi FastAPI: store, auth gateway, engine, dan pengguna yang sedang login."""

from __future__ import annotations

import hmac
import time
from collections import defaultdict, deque
from functools import lru_cache

from fastapi import Depends, Header, HTTPException, Request

from .auth_gateway import AuthError, AuthGateway, SupabaseAuthGateway
from .config import ConfigError, get_settings
from .engine import Engine
from .store import Store, SupabaseStore


@lru_cache
def _store() -> SupabaseStore:
    return SupabaseStore(get_settings())


@lru_cache
def _gateway() -> SupabaseAuthGateway:
    return SupabaseAuthGateway(get_settings())


def get_store() -> Store:
    try:
        return _store()
    except ConfigError as exc:
        raise HTTPException(503, str(exc)) from exc


def get_gateway() -> AuthGateway:
    try:
        return _gateway()
    except ConfigError as exc:
        raise HTTPException(503, str(exc)) from exc


def get_engine(store: Store = Depends(get_store)) -> Engine:
    s = get_settings()
    return Engine(store, final_question_count=s.final_question_count,
                  final_time_limit_seconds=s.final_time_limit_seconds)


def get_current_user(authorization: str | None = Header(default=None),
                     gateway: AuthGateway = Depends(get_gateway),
                     store: Store = Depends(get_store)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Silakan masuk terlebih dahulu.")
    token = authorization.split(" ", 1)[1].strip()
    try:
        user = gateway.verify_token(token)
    except AuthError as exc:
        raise HTTPException(exc.status, str(exc)) from exc
    profile = store.get_profile(user["id"])
    if not profile:
        raise HTTPException(403, "Akun ini tidak terdaftar sebagai siswa ROYAL ADVENTURE.")
    return profile


def require_admin(x_admin_key: str | None = Header(default=None)) -> None:
    expected = get_settings().admin_api_key
    if not expected:
        raise HTTPException(503, "ADMIN_API_KEY belum diatur di server.")
    if not x_admin_key or not hmac.compare_digest(x_admin_key, expected):
        raise HTTPException(401, "Kunci admin tidak valid.")


class RateLimiter:
    """Pembatas percobaan sederhana per alamat IP (in-memory)."""

    def __init__(self, limit: int, window_seconds: int):
        self.limit = limit
        self.window = window_seconds
        self.hits: dict[str, deque] = defaultdict(deque)

    def check(self, key: str) -> None:
        now = time.monotonic()
        q = self.hits[key]
        while q and now - q[0] > self.window:
            q.popleft()
        if len(q) >= self.limit:
            raise HTTPException(429, "Terlalu banyak percobaan masuk. Tunggu sebentar, lalu coba lagi.")
        q.append(now)


login_limiter = RateLimiter(limit=10, window_seconds=60)


def client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"
