"""Konfigurasi dari environment variable (lihat backend/.env.example)."""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


class ConfigError(RuntimeError):
    pass


@dataclass(frozen=True)
class Settings:
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    student_password_secret: str
    student_email_domain: str
    admin_api_key: str
    cors_origins: tuple[str, ...]
    final_question_count: int
    final_time_limit_seconds: int

    def require_supabase(self) -> None:
        missing = [name for name, val in (
            ("SUPABASE_URL", self.supabase_url),
            ("SUPABASE_ANON_KEY", self.supabase_anon_key),
            ("SUPABASE_SERVICE_ROLE_KEY", self.supabase_service_role_key),
            ("STUDENT_PASSWORD_SECRET", self.student_password_secret),
        ) if not val]
        if missing:
            raise ConfigError("Konfigurasi belum lengkap: " + ", ".join(missing) + ". Lihat backend/.env.example.")
        if len(self.student_password_secret) < 32:
            raise ConfigError("STUDENT_PASSWORD_SECRET minimal 32 karakter.")


@lru_cache
def get_settings() -> Settings:
    origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,capacitor://localhost,http://localhost")
    return Settings(
        supabase_url=os.getenv("SUPABASE_URL", "").rstrip("/"),
        supabase_anon_key=os.getenv("SUPABASE_ANON_KEY", ""),
        supabase_service_role_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
        student_password_secret=os.getenv("STUDENT_PASSWORD_SECRET", ""),
        student_email_domain=os.getenv("STUDENT_EMAIL_DOMAIN", "students.royal-adventure.app"),
        admin_api_key=os.getenv("ADMIN_API_KEY", ""),
        cors_origins=tuple(o.strip() for o in origins.split(",") if o.strip()),
        final_question_count=int(os.getenv("FINAL_QUESTION_COUNT", "0") or "0"),
        final_time_limit_seconds=int(os.getenv("FINAL_TIME_LIMIT_SECONDS", "0") or "0"),
    )
