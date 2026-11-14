"""Lapisan akses data. Produksi memakai SupabaseStore (PostgREST + service role).

Semua method menerima/mengembalikan dict biasa agar mudah diuji.
"""

from __future__ import annotations

from typing import Any, Protocol

import httpx

from .config import Settings


class StoreError(RuntimeError):
    pass


class Store(Protocol):
    # profil
    def get_profile_by_code(self, code: str) -> dict | None: ...
    def get_profile(self, user_id: str) -> dict | None: ...
    def list_profiles(self) -> list[dict]: ...
    def insert_profile(self, row: dict) -> dict: ...
    def delete_profile(self, user_id: str) -> None: ...
    # konten
    def list_lessons(self) -> list[dict]: ...
    def get_quiz(self, quiz_id: str) -> dict | None: ...
    def list_questions(self, quiz_id: str) -> list[dict]: ...
    def get_game(self, game_id: str) -> dict | None: ...
    def list_achievements(self) -> list[dict]: ...
    # progres
    def list_lesson_progress(self, user_id: str) -> list[dict]: ...
    def upsert_lesson_progress(self, row: dict) -> None: ...
    def insert_quiz_attempt(self, row: dict) -> None: ...
    def insert_game_attempt(self, row: dict) -> None: ...
    def list_quiz_attempt_summaries(self, user_id: str) -> list[dict]: ...
    def list_game_attempt_summaries(self, user_id: str) -> list[dict]: ...
    # gamifikasi
    def insert_xp(self, user_id: str, source_key: str, amount: int) -> bool: ...
    def sum_xp(self, user_id: str) -> int: ...
    def list_user_achievement_ids(self, user_id: str) -> list[str]: ...
    def insert_user_achievement(self, user_id: str, achievement_id: str) -> bool: ...
    def upsert_stats(self, row: dict) -> None: ...
    def insert_activity(self, row: dict) -> None: ...
    # sesi
    def insert_session(self, row: dict) -> dict: ...
    def get_session(self, session_id: str) -> dict | None: ...
    def update_session(self, session_id: str, fields: dict, only_if_active: bool = False) -> dict | None: ...
    def has_finished_session(self, user_id: str, kind: str, ref_id: str) -> bool: ...


class SupabaseStore:
    """Implementasi Store memakai Supabase REST API dengan service role key.

    Service role melewati RLS, jadi SETIAP query di sini wajib difilter user_id
    yang sudah diverifikasi dari token login.
    """

    def __init__(self, settings: Settings, client: httpx.Client | None = None):
        settings.require_supabase()
        self._base = f"{settings.supabase_url}/rest/v1"
        key = settings.supabase_service_role_key
        self._client = client or httpx.Client(timeout=15.0, headers={
            "apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json",
        })

    # ---- helper ----
    def _req(self, method: str, table: str, *, params: dict | None = None, json: Any = None,
             prefer: str | None = None) -> Any:
        headers = {"Prefer": prefer} if prefer else {}
        try:
            r = self._client.request(method, f"{self._base}/{table}", params=params, json=json, headers=headers)
        except httpx.HTTPError as exc:
            raise StoreError(f"Gagal menghubungi database: {exc}") from exc
        if r.status_code >= 400:
            raise StoreError(f"Database error {r.status_code}: {r.text[:300]}")
        if not r.content:
            return None
        return r.json()

    def _select(self, table: str, **params: str) -> list[dict]:
        params.setdefault("select", "*")
        return self._req("GET", table, params=params) or []

    def _one(self, table: str, **params: str) -> dict | None:
        rows = self._select(table, limit="1", **params)
        return rows[0] if rows else None

    # ---- profil ----
    def get_profile_by_code(self, code: str) -> dict | None:
        return self._one("profiles", student_code=f"eq.{code}")

    def get_profile(self, user_id: str) -> dict | None:
        return self._one("profiles", id=f"eq.{user_id}")

    def list_profiles(self) -> list[dict]:
        return self._select("profiles", order="class_name.asc,full_name.asc")

    def insert_profile(self, row: dict) -> dict:
        return self._req("POST", "profiles", json=row, prefer="return=representation")[0]

    def delete_profile(self, user_id: str) -> None:
        self._req("DELETE", "profiles", params={"id": f"eq.{user_id}"})

    # ---- konten ----
    def list_lessons(self) -> list[dict]:
        return self._select("lessons", order="level_no.asc")

    def get_quiz(self, quiz_id: str) -> dict | None:
        return self._one("quizzes", id=f"eq.{quiz_id}")

    def list_questions(self, quiz_id: str) -> list[dict]:
        return self._select("quiz_questions", quiz_id=f"eq.{quiz_id}", order="position.asc")

    def get_game(self, game_id: str) -> dict | None:
        return self._one("games", id=f"eq.{game_id}")

    def list_achievements(self) -> list[dict]:
        return self._select("achievements", order="sort_order.asc")

    # ---- progres ----
    def list_lesson_progress(self, user_id: str) -> list[dict]:
        return self._select("lesson_progress", user_id=f"eq.{user_id}")

    def upsert_lesson_progress(self, row: dict) -> None:
        self._req("POST", "lesson_progress", params={"on_conflict": "user_id,lesson_id"}, json=row,
                  prefer="resolution=merge-duplicates,return=minimal")

    def insert_quiz_attempt(self, row: dict) -> None:
        self._req("POST", "quiz_attempts", json=row, prefer="return=minimal")

    def insert_game_attempt(self, row: dict) -> None:
        self._req("POST", "game_attempts", json=row, prefer="return=minimal")

    def list_quiz_attempt_summaries(self, user_id: str) -> list[dict]:
        return self._select("quiz_attempts", select="quiz_id,percent", user_id=f"eq.{user_id}")

    def list_game_attempt_summaries(self, user_id: str) -> list[dict]:
        return self._select("game_attempts", select="game_id,percent", user_id=f"eq.{user_id}")

    # ---- gamifikasi ----
    def insert_xp(self, user_id: str, source_key: str, amount: int) -> bool:
        rows = self._req("POST", "xp_ledger", params={"on_conflict": "user_id,source_key"},
                         json={"user_id": user_id, "source_key": source_key, "amount": amount},
                         prefer="resolution=ignore-duplicates,return=representation")
        return bool(rows)

    def sum_xp(self, user_id: str) -> int:
        return sum(r["amount"] for r in self._select("xp_ledger", select="amount", user_id=f"eq.{user_id}"))

    def list_user_achievement_ids(self, user_id: str) -> list[str]:
        return [r["achievement_id"] for r in
                self._select("user_achievements", select="achievement_id", user_id=f"eq.{user_id}")]

    def insert_user_achievement(self, user_id: str, achievement_id: str) -> bool:
        rows = self._req("POST", "user_achievements", params={"on_conflict": "user_id,achievement_id"},
                         json={"user_id": user_id, "achievement_id": achievement_id},
                         prefer="resolution=ignore-duplicates,return=representation")
        return bool(rows)

    def upsert_stats(self, row: dict) -> None:
        self._req("POST", "user_stats", params={"on_conflict": "user_id"}, json=row,
                  prefer="resolution=merge-duplicates,return=minimal")

    def insert_activity(self, row: dict) -> None:
        self._req("POST", "activity_logs", json=row, prefer="return=minimal")

    # ---- sesi ----
    def insert_session(self, row: dict) -> dict:
        return self._req("POST", "activity_sessions", json=row, prefer="return=representation")[0]

    def get_session(self, session_id: str) -> dict | None:
        return self._one("activity_sessions", id=f"eq.{session_id}")

    def update_session(self, session_id: str, fields: dict, only_if_active: bool = False) -> dict | None:
        params = {"id": f"eq.{session_id}"}
        if only_if_active:
            params["status"] = "eq.active"
        rows = self._req("PATCH", "activity_sessions", params=params, json=fields, prefer="return=representation")
        return rows[0] if rows else None

    def has_finished_session(self, user_id: str, kind: str, ref_id: str) -> bool:
        return self._one("activity_sessions", select="id", user_id=f"eq.{user_id}", kind=f"eq.{kind}",
                         ref_id=f"eq.{ref_id}", status="eq.finished") is not None
