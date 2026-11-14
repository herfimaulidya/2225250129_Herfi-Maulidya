"""Implementasi Store in-memory KHUSUS untuk pengujian otomatis (bukan untuk produksi)."""

import copy
import uuid

from app.content.catalog import ACHIEVEMENTS, GAMES, LESSONS, QUIZZES
from app.content.questions import QUESTIONS


class MemoryStore:
    def __init__(self):
        self.profiles: dict[str, dict] = {}
        self.lessons = copy.deepcopy(LESSONS)
        self.quizzes = {q["id"]: copy.deepcopy(q) for q in QUIZZES}
        self.questions = copy.deepcopy(QUESTIONS)
        self.games = {g["id"]: copy.deepcopy(g) for g in GAMES}
        self.achievements = copy.deepcopy(ACHIEVEMENTS)
        self.progress: dict[tuple, dict] = {}
        self.quiz_attempts: list[dict] = []
        self.game_attempts: list[dict] = []
        self.xp: dict[tuple, int] = {}
        self.user_achievements: set[tuple] = set()
        self.stats: dict[str, dict] = {}
        self.activity: list[dict] = []
        self.sessions: dict[str, dict] = {}

    def get_profile_by_code(self, code):
        return next((p for p in self.profiles.values() if p["student_code"] == code), None)

    def get_profile(self, user_id):
        return self.profiles.get(user_id)

    def list_profiles(self):
        return list(self.profiles.values())

    def insert_profile(self, row):
        self.profiles[row["id"]] = dict(row)
        return dict(row)

    def delete_profile(self, user_id):
        self.profiles.pop(user_id, None)

    def list_lessons(self):
        return sorted(self.lessons, key=lambda l: l["level_no"])

    def get_quiz(self, quiz_id):
        return self.quizzes.get(quiz_id)

    def list_questions(self, quiz_id):
        return [copy.deepcopy(q) for q in self.questions if q["quiz_id"] == quiz_id]

    def get_game(self, game_id):
        return self.games.get(game_id)

    def list_achievements(self):
        return self.achievements

    def list_lesson_progress(self, user_id):
        return [dict(v) for (u, _), v in self.progress.items() if u == user_id]

    def upsert_lesson_progress(self, row):
        key = (row["user_id"], row["lesson_id"])
        cur = self.progress.get(key, {"status": "in_progress", "best_score": 0, "stars": 0})
        cur.update(row)
        self.progress[key] = cur

    def insert_quiz_attempt(self, row):
        self.quiz_attempts.append(dict(row))

    def insert_game_attempt(self, row):
        self.game_attempts.append(dict(row))

    def list_quiz_attempt_summaries(self, user_id):
        return [{"quiz_id": a["quiz_id"], "percent": a["percent"]} for a in self.quiz_attempts if a["user_id"] == user_id]

    def list_game_attempt_summaries(self, user_id):
        return [{"game_id": a["game_id"], "percent": a["percent"]} for a in self.game_attempts if a["user_id"] == user_id]

    def insert_xp(self, user_id, source_key, amount):
        if (user_id, source_key) in self.xp:
            return False
        self.xp[(user_id, source_key)] = amount
        return True

    def sum_xp(self, user_id):
        return sum(v for (u, _), v in self.xp.items() if u == user_id)

    def list_user_achievement_ids(self, user_id):
        return [a for u, a in self.user_achievements if u == user_id]

    def insert_user_achievement(self, user_id, achievement_id):
        if (user_id, achievement_id) in self.user_achievements:
            return False
        self.user_achievements.add((user_id, achievement_id))
        return True

    def upsert_stats(self, row):
        self.stats.setdefault(row["user_id"], {}).update(row)

    def insert_activity(self, row):
        self.activity.append(dict(row))

    def insert_session(self, row):
        row = copy.deepcopy(row)
        row["id"] = str(uuid.uuid4())
        self.sessions[row["id"]] = row
        return copy.deepcopy(row)

    def get_session(self, session_id):
        s = self.sessions.get(session_id)
        return copy.deepcopy(s) if s else None

    def update_session(self, session_id, fields, only_if_active=False):
        s = self.sessions.get(session_id)
        if not s or (only_if_active and s["status"] != "active"):
            return None
        s.update(copy.deepcopy(fields))
        return copy.deepcopy(s)

    def has_finished_session(self, user_id, kind, ref_id):
        return any(s["user_id"] == user_id and s["kind"] == kind and s["ref_id"] == ref_id
                   and s["status"] == "finished" for s in self.sessions.values())


class FakeGateway:
    """Gateway auth palsu KHUSUS test: token 'tok-<user_id>' dianggap valid."""

    def __init__(self, store):
        self.store = store
        self.deleted = []

    def verify_token(self, token):
        from app.auth_gateway import AuthError
        if not token.startswith("tok-"):
            raise AuthError("Sesi login tidak valid atau sudah berakhir. Silakan masuk kembali.")
        return {"id": token[4:]}

    def sign_in(self, code):
        p = self.store.get_profile_by_code(code)
        return {"access_token": f"tok-{p['id']}", "refresh_token": "r", "expires_in": 3600, "user": {"id": p["id"]}}

    def create_student_user(self, code, full_name):
        return str(uuid.uuid4())

    def delete_user(self, user_id):
        self.deleted.append(user_id)
