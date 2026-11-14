"""Akses ke Supabase Auth (GoTrue): verifikasi token, login, dan manajemen akun siswa."""

from __future__ import annotations

import hashlib
import hmac
import re
import time
from typing import Protocol

import httpx

from .config import Settings

CODE_PATTERN = re.compile(r"^[A-Z0-9-]{4,20}$")


class AuthError(RuntimeError):
    def __init__(self, message: str, status: int = 401):
        super().__init__(message)
        self.status = status


def normalize_code(raw: str) -> str:
    """Kode siswa dibandingkan dalam huruf besar tanpa spasi di tepi."""
    return (raw or "").strip().upper()


def is_valid_code_format(code: str) -> bool:
    return bool(CODE_PATTERN.fullmatch(code))


def derive_password(secret: str, code: str) -> str:
    """Password akun Supabase siswa diturunkan dari kode + rahasia server.

    Siswa tidak pernah melihat password ini; mereka cukup memasukkan kode.
    Tanpa STUDENT_PASSWORD_SECRET (hanya ada di server), password tidak bisa ditebak.
    """
    return hmac.new(secret.encode(), code.encode(), hashlib.sha256).hexdigest()


def student_email(code: str, domain: str) -> str:
    return f"{code.lower()}@{domain}"


class AuthGateway(Protocol):
    def verify_token(self, token: str) -> dict: ...
    def sign_in(self, code: str) -> dict: ...
    def create_student_user(self, code: str, full_name: str) -> str: ...
    def delete_user(self, user_id: str) -> None: ...


class SupabaseAuthGateway:
    def __init__(self, settings: Settings, client: httpx.Client | None = None):
        settings.require_supabase()
        self.s = settings
        self._base = f"{settings.supabase_url}/auth/v1"
        self._client = client or httpx.Client(timeout=15.0)
        self._cache: dict[str, tuple[float, dict]] = {}

    def _admin_headers(self) -> dict:
        k = self.s.supabase_service_role_key
        return {"apikey": k, "Authorization": f"Bearer {k}"}

    def verify_token(self, token: str) -> dict:
        key = hashlib.sha256(token.encode()).hexdigest()
        now = time.time()
        hit = self._cache.get(key)
        if hit and hit[0] > now:
            return hit[1]
        try:
            r = self._client.get(f"{self._base}/user", headers={
                "apikey": self.s.supabase_anon_key, "Authorization": f"Bearer {token}"})
        except httpx.HTTPError as exc:
            raise AuthError("Layanan login tidak dapat dihubungi.", 503) from exc
        if r.status_code != 200:
            raise AuthError("Sesi login tidak valid atau sudah berakhir. Silakan masuk kembali.")
        user = r.json()
        if len(self._cache) > 2000:
            self._cache.clear()
        self._cache[key] = (now + 60, user)
        return user

    def _password_grant(self, email: str, password: str) -> httpx.Response:
        return self._client.post(f"{self._base}/token", params={"grant_type": "password"},
                                 headers={"apikey": self.s.supabase_anon_key},
                                 json={"email": email, "password": password})

    def sign_in(self, code: str) -> dict:
        email = student_email(code, self.s.student_email_domain)
        password = derive_password(self.s.student_password_secret, code)
        try:
            r = self._password_grant(email, password)
            if r.status_code == 400:
                # Password akun mungkin berubah; kembalikan ke password turunan lalu coba lagi.
                self._reset_password(email, password)
                r = self._password_grant(email, password)
        except httpx.HTTPError as exc:
            raise AuthError("Layanan login tidak dapat dihubungi.", 503) from exc
        if r.status_code != 200:
            raise AuthError("Akun siswa belum siap. Hubungi guru untuk mendaftarkan ulang kode ini.", 401)
        return r.json()

    def _find_user_id(self, email: str) -> str | None:
        page = 1
        while page < 50:
            r = self._client.get(f"{self._base}/admin/users", params={"page": page, "per_page": 200},
                                 headers=self._admin_headers())
            if r.status_code != 200:
                return None
            users = r.json().get("users", [])
            for u in users:
                if (u.get("email") or "").lower() == email:
                    return u["id"]
            if len(users) < 200:
                return None
            page += 1
        return None

    def _reset_password(self, email: str, password: str) -> None:
        uid = self._find_user_id(email)
        if uid:
            self._client.put(f"{self._base}/admin/users/{uid}", headers=self._admin_headers(),
                             json={"password": password})

    def create_student_user(self, code: str, full_name: str) -> str:
        email = student_email(code, self.s.student_email_domain)
        r = self._client.post(f"{self._base}/admin/users", headers=self._admin_headers(), json={
            "email": email,
            "password": derive_password(self.s.student_password_secret, code),
            "email_confirm": True,
            "user_metadata": {"full_name": full_name, "student_code": code},
        })
        if r.status_code in (200, 201):
            return r.json()["id"]
        if r.status_code == 422 or "already" in r.text.lower():
            uid = self._find_user_id(email)
            if uid:
                return uid
        raise AuthError(f"Gagal membuat akun siswa: {r.text[:200]}", 502)

    def delete_user(self, user_id: str) -> None:
        self._client.delete(f"{self._base}/admin/users/{user_id}", headers=self._admin_headers())
