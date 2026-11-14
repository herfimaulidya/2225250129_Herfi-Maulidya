"""Server TIRUAN Supabase — KHUSUS pengujian end-to-end lokal, BUKAN untuk produksi.

Meniru bagian Supabase yang dipakai ROYAL ADVENTURE:
  * Auth (GoTrue): /auth/v1/token, /auth/v1/user, /auth/v1/logout, /auth/v1/admin/users
  * REST (PostgREST): GET/POST/PATCH/DELETE /rest/v1/<tabel> dengan filter eq, order, limit, select,
    on_conflict + Prefer (merge/ignore duplicates, return=representation/minimal)
  * Emulasi kebijakan RLS dari supabase/migrations/0002_rls.sql:
      - service role: akses penuh
      - siswa (JWT): hanya SELECT baris miliknya; katalog boleh dibaca; quiz_questions & activity_sessions ditolak;
        semua penulisan ditolak
      - anon: ditolak

Jalankan:  python -m uvicorn tests.e2e.mock_supabase:app --port 54321   (dari folder backend)
"""

from __future__ import annotations

import base64
import copy
import hashlib
import hmac
import json
import time
import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from app.content.catalog import ACHIEVEMENTS, GAMES, LESSONS, QUIZZES
from app.content.questions import QUESTIONS

ANON_KEY = "e2e-anon-key"
SERVICE_KEY = "e2e-service-role-key"
JWT_SECRET = b"e2e-jwt-secret"

app = FastAPI(title="Mock Supabase (E2E only)")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
                   expose_headers=["content-range"])


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ----------------------------------------------------------------- tabel
PK = {
    "profiles": ["id"], "lessons": ["id"], "lesson_progress": ["id"], "quizzes": ["id"], "quiz_questions": ["id"],
    "quiz_attempts": ["id"], "games": ["id"], "game_attempts": ["id"], "user_stats": ["user_id"],
    "achievements": ["id"], "user_achievements": ["user_id", "achievement_id"], "activity_logs": ["id"],
    "xp_ledger": ["id"], "activity_sessions": ["id"],
}
UNIQUE = {"lesson_progress": [["user_id", "lesson_id"]], "xp_ledger": [["user_id", "source_key"]],
          "profiles": [["student_code"]], "quiz_attempts": [["session_id"]], "game_attempts": [["session_id"]]}
OWNER_COL = {"profiles": "id", "lesson_progress": "user_id", "quiz_attempts": "user_id", "game_attempts": "user_id",
             "user_stats": "user_id", "user_achievements": "user_id", "activity_logs": "user_id", "xp_ledger": "user_id"}
CATALOG = {"lessons", "quizzes", "games", "achievements"}
_seq = {"n": 0}


def _identity():
    _seq["n"] += 1
    return _seq["n"]


def defaults(table: str) -> dict:
    t = now_iso()
    d = {
        "profiles": {"role": "student", "created_at": t, "class_name": None},
        "lesson_progress": {"id": _identity(), "status": "in_progress", "best_score": 0, "stars": 0, "completed_at": None, "updated_at": t},
        "quiz_attempts": {"id": str(uuid.uuid4()), "submitted_at": t, "details": []},
        "game_attempts": {"id": str(uuid.uuid4()), "played_at": t, "details": [], "difficulty": None},
        "user_stats": {"total_xp": 0, "royal_level": 1, "lessons_completed": 0, "missions_completed": 0, "games_played": 0,
                       "trainings_completed": 0, "best_training_score": None, "best_final_score": None, "updated_at": t},
        "user_achievements": {"earned_at": t},
        "activity_logs": {"id": _identity(), "created_at": t, "status": "completed", "score": None, "ref_id": None},
        "xp_ledger": {"id": _identity(), "created_at": t},
        "activity_sessions": {"id": str(uuid.uuid4()), "options": {}, "responses": {}, "status": "active", "result": None,
                              "started_at": t, "expires_at": None, "finished_at": None},
    }
    return d.get(table, {})


DB: dict[str, list[dict]] = {t: [] for t in PK}
USERS: dict[str, dict] = {}  # id -> {id, email, password, user_metadata}
REFRESH: dict[str, str] = {}  # refresh_token -> user_id


def reset_db():
    for t in DB:
        DB[t] = []
    USERS.clear()
    DB["lessons"] = copy.deepcopy(LESSONS)
    DB["quizzes"] = copy.deepcopy(QUIZZES)
    DB["quiz_questions"] = copy.deepcopy(QUESTIONS)
    DB["games"] = copy.deepcopy(GAMES)
    DB["achievements"] = copy.deepcopy(ACHIEVEMENTS)


reset_db()

CHILDREN = ["lesson_progress", "quiz_attempts", "game_attempts", "user_stats", "user_achievements", "activity_logs",
            "xp_ledger", "activity_sessions"]


def cascade_delete_user(uid: str):
    DB["profiles"] = [r for r in DB["profiles"] if r["id"] != uid]
    for t in CHILDREN:
        DB[t] = [r for r in DB[t] if r.get("user_id") != uid]


# ----------------------------------------------------------------- JWT
def b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def make_jwt(uid: str, email: str) -> str:
    header = b64(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = b64(json.dumps({"sub": uid, "email": email, "role": "authenticated", "aud": "authenticated",
                              "exp": int(time.time()) + 3600, "iat": int(time.time())}).encode())
    sig = b64(hmac.new(JWT_SECRET, f"{header}.{payload}".encode(), hashlib.sha256).digest())
    return f"{header}.{payload}.{sig}"


def verify_jwt(token: str) -> dict | None:
    try:
        header, payload, sig = token.split(".")
        good = b64(hmac.new(JWT_SECRET, f"{header}.{payload}".encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(sig, good):
            return None
        data = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
        return data if data["exp"] > time.time() else None
    except Exception:
        return None


def user_json(u: dict) -> dict:
    return {"id": u["id"], "aud": "authenticated", "role": "authenticated", "email": u["email"],
            "user_metadata": u.get("user_metadata", {}), "app_metadata": {"provider": "email"},
            "created_at": u["created_at"]}


def session_for(u: dict) -> dict:
    rt = uuid.uuid4().hex
    REFRESH[rt] = u["id"]
    return {"access_token": make_jwt(u["id"], u["email"]), "token_type": "bearer", "expires_in": 3600,
            "expires_at": int(time.time()) + 3600, "refresh_token": rt, "user": user_json(u)}


def err(status: int, msg: str, code: str = "error"):
    return JSONResponse({"code": code, "message": msg, "msg": msg, "error": code, "error_description": msg}, status_code=status)


def bearer(request: Request) -> str:
    a = request.headers.get("authorization", "")
    return a[7:] if a.lower().startswith("bearer ") else ""


def is_service(request: Request) -> bool:
    return bearer(request) == SERVICE_KEY


# ----------------------------------------------------------------- AUTH
@app.post("/auth/v1/token")
async def token(request: Request):
    grant = request.query_params.get("grant_type")
    body = await request.json()
    if grant == "password":
        u = next((u for u in USERS.values() if u["email"] == body.get("email", "").lower()), None)
        if not u or u["password"] != body.get("password"):
            return err(400, "Invalid login credentials", "invalid_grant")
        return session_for(u)
    if grant == "refresh_token":
        uid = REFRESH.pop(body.get("refresh_token", ""), None)
        if not uid or uid not in USERS:
            return err(400, "Invalid Refresh Token", "invalid_grant")
        return session_for(USERS[uid])
    return err(400, "unsupported grant")


@app.get("/auth/v1/user")
async def get_user(request: Request):
    data = verify_jwt(bearer(request))
    if not data or data["sub"] not in USERS:
        return err(401, "invalid JWT", "bad_jwt")
    return user_json(USERS[data["sub"]])


@app.post("/auth/v1/logout")
async def logout():
    return Response(status_code=204)


@app.post("/auth/v1/admin/users")
async def admin_create(request: Request):
    if not is_service(request):
        return err(403, "not admin")
    body = await request.json()
    email = body["email"].lower()
    if any(u["email"] == email for u in USERS.values()):
        return err(422, "A user with this email address has already been registered", "email_exists")
    u = {"id": str(uuid.uuid4()), "email": email, "password": body["password"],
         "user_metadata": body.get("user_metadata", {}), "created_at": now_iso()}
    USERS[u["id"]] = u
    return user_json(u)


@app.get("/auth/v1/admin/users")
async def admin_list(request: Request):
    if not is_service(request):
        return err(403, "not admin")
    page, per = int(request.query_params.get("page", 1)), int(request.query_params.get("per_page", 50))
    users = list(USERS.values())[(page - 1) * per: page * per]
    return {"users": [user_json(u) for u in users]}


@app.put("/auth/v1/admin/users/{uid}")
async def admin_update(uid: str, request: Request):
    if not is_service(request) or uid not in USERS:
        return err(404, "not found")
    body = await request.json()
    if "password" in body:
        USERS[uid]["password"] = body["password"]
    return user_json(USERS[uid])


@app.delete("/auth/v1/admin/users/{uid}")
async def admin_delete(uid: str, request: Request):
    if not is_service(request):
        return err(403, "not admin")
    USERS.pop(uid, None)
    cascade_delete_user(uid)
    return {}


# ----------------------------------------------------------------- REST
def coerce(v: str):
    if v == "null":
        return None
    if v in ("true", "false"):
        return v == "true"
    return v


def matches(row: dict, filters: list[tuple[str, str, str]]) -> bool:
    for col, op, val in filters:
        cell = row.get(col)
        if op == "eq":
            target = coerce(val)
            if isinstance(cell, bool) or isinstance(target, bool) or cell is None or target is None:
                if cell != target:
                    return False
            elif str(cell) != str(target):
                return False
        else:
            raise ValueError(f"operator {op} tidak didukung mock")
    return True


def parse_query(request: Request):
    filters, select, order, limit, on_conflict = [], "*", None, None, None
    for k, v in request.query_params.multi_items():
        if k == "select":
            select = v
        elif k == "order":
            order = v
        elif k == "limit":
            limit = int(v)
        elif k == "on_conflict":
            on_conflict = v.split(",")
        elif k in ("offset", "columns"):
            continue
        else:
            op, _, val = v.partition(".")
            filters.append((k, op, val))
    return filters, select, order, limit, on_conflict


def project(rows: list[dict], select: str) -> list[dict]:
    if select in ("*", ""):
        return [copy.deepcopy(r) for r in rows]
    cols = [c.strip() for c in select.split(",") if c.strip()]
    return [{c: copy.deepcopy(r.get(c)) for c in cols} for r in rows]


def sort_rows(rows: list[dict], order: str | None) -> list[dict]:
    if not order:
        return rows
    for part in reversed(order.split(",")):
        col, _, direction = part.partition(".")
        desc = direction.startswith("desc")
        rows = sorted(rows, key=lambda r: (r.get(col) is None, r.get(col) if r.get(col) is not None else 0), reverse=desc)
    return rows


def access(request: Request, table: str, write: bool):
    """Mengembalikan (ok, owner_uid|None, error_response)."""
    if table not in DB:
        return False, None, err(404, f"relation public.{table} does not exist", "42P01")
    if is_service(request):
        return True, None, None
    data = verify_jwt(bearer(request))
    if not data:
        return False, None, err(401, f"permission denied for table {table}", "42501")
    if write or table in ("quiz_questions", "activity_sessions"):
        return False, None, err(403, f"permission denied for table {table}", "42501")
    if table in CATALOG:
        return True, None, None
    return True, data["sub"], None


def respond(rows, request: Request, status=200):
    accept = request.headers.get("accept", "")
    if "vnd.pgrst.object" in accept:
        if len(rows) != 1:
            return err(406, "JSON object requested, multiple (or no) rows returned", "PGRST116")
        return JSONResponse(rows[0], status_code=status)
    return JSONResponse(rows, status_code=status)


@app.get("/rest/v1/{table}")
async def rest_get(table: str, request: Request):
    ok, owner, e = access(request, table, write=False)
    if not ok:
        return e
    filters, select, order, limit, _ = parse_query(request)
    rows = [r for r in DB[table] if matches(r, filters)]
    if owner:
        rows = [r for r in rows if r.get(OWNER_COL[table]) == owner]
    rows = sort_rows(rows, order)
    if limit is not None:
        rows = rows[:limit]
    return respond(project(rows, select), request)


def find_conflict(table: str, row: dict, cols: list[str]) -> dict | None:
    return next((r for r in DB[table] if all(r.get(c) == row.get(c) for c in cols)), None)


@app.post("/rest/v1/{table}")
async def rest_post(table: str, request: Request):
    ok, _, e = access(request, table, write=True)
    if not ok:
        return e
    _, _, _, _, on_conflict = parse_query(request)
    prefer = request.headers.get("prefer", "")
    body = await request.json()
    rows = body if isinstance(body, list) else [body]
    out = []
    for row in rows:
        conflict_cols = on_conflict or PK[table]
        existing = find_conflict(table, row, conflict_cols)
        if existing is not None:
            if "ignore-duplicates" in prefer:
                continue
            if "merge-duplicates" in prefer:
                existing.update(copy.deepcopy(row))
                out.append(existing)
                continue
            return err(409, f'duplicate key value violates unique constraint "{table}_pkey"', "23505")
        for ucols in UNIQUE.get(table, []):
            if find_conflict(table, row, ucols) is not None:
                if "ignore-duplicates" in prefer:
                    break
                return err(409, f"duplicate key value violates unique constraint on {ucols}", "23505")
        else:
            if table == "profiles" and row.get("id") not in USERS:
                return err(409, "insert violates foreign key constraint profiles_id_fkey", "23503")
            new = {**defaults(table), **copy.deepcopy(row)}
            DB[table].append(new)
            out.append(new)
    status = 201
    if "return=representation" in prefer:
        return JSONResponse(copy.deepcopy(out), status_code=status)
    return Response(status_code=status)


@app.patch("/rest/v1/{table}")
async def rest_patch(table: str, request: Request):
    ok, _, e = access(request, table, write=True)
    if not ok:
        return e
    filters, *_ = parse_query(request)
    body = await request.json()
    out = []
    for r in DB[table]:
        if matches(r, filters):
            r.update(copy.deepcopy(body))
            out.append(r)
    if "return=representation" in request.headers.get("prefer", ""):
        return JSONResponse(copy.deepcopy(out))
    return Response(status_code=204)


@app.delete("/rest/v1/{table}")
async def rest_delete(table: str, request: Request):
    ok, _, e = access(request, table, write=True)
    if not ok:
        return e
    filters, *_ = parse_query(request)
    if table == "profiles":
        for r in [r for r in DB[table] if matches(r, filters)]:
            cascade_delete_user(r["id"])
    DB[table] = [r for r in DB[table] if not matches(r, filters)]
    return Response(status_code=204)


@app.post("/__e2e/reset")
async def e2e_reset():
    reset_db()
    return {"ok": True}
