"""Mesin sesi: latihan materi, Royal Training, permainan, dan Final Quest.

Alur: start -> answer (berulang) -> [hint] -> finish.
Kunci jawaban disimpan di sesi server dan tidak pernah dikirim sebelum soal selesai.
"""

from __future__ import annotations

import copy
import random
from datetime import datetime, timedelta, timezone
from typing import Any, Callable

from . import gamification as gm
from .generators import DIFFICULTIES, GAME_RULES, generate
from .grading import InvalidAnswer, check, item_score, normalize, stars_for
from .store import Store

KINDS = ("lesson", "training", "game", "final")
TRAINING_LEVELS = ("level-1", "level-2", "level-3")
GRACE_SECONDS = 30

MESSAGES = {
    "correct": ["Wonderful! Kamu berhasil menemukan pola yang tepat!", "Luar biasa, Royal Adventurer!",
                "Tepat sekali! Kilau mahkotamu makin terang!", "Hebat! Analisismu sangat rapi."],
    "retry": ["Hampir benar! Coba perhatikan kembali pola yang sudah kamu temukan.",
              "Don't worry! Baca petunjuknya, lalu coba sekali lagi, ya.",
              "Tidak apa-apa salah — itu bagian dari belajar. Yuk coba lagi!"],
    "reveal": ["Belum tepat, tapi tidak apa-apa. Yuk pelajari pembahasannya langkah demi langkah.",
               "Kita pelajari bersama, ya. Perhatikan setiap langkahnya."],
}


class EngineError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.message = message
        self.status = status


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_ts(value: Any) -> datetime | None:
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    return datetime.fromisoformat(str(value).replace("Z", "+00:00"))


def question_to_item(q: dict) -> dict:
    return {
        "qid": q["id"], "type": q["qtype"], "prompt": q["prompt"], "data": q.get("data") or {},
        "answer": q["answer"], "hint": q.get("hint"), "explanation": q.get("explanation") or [],
        "points": q.get("points", 10), "ask_reason": bool(q.get("ask_reason")),
        "literacy_focus": q.get("literacy_focus"), "difficulty": q.get("difficulty", 1),
    }


PRIVATE_KEYS = ("answer", "explanation", "hint")


def public_item(item: dict) -> dict:
    out = {k: copy.deepcopy(v) for k, v in item.items() if k not in PRIVATE_KEYS}
    out["has_hint"] = bool(item.get("hint"))
    return out


def correct_answer_view(item: dict) -> Any:
    """Kunci jawaban dalam bentuk yang mudah ditampilkan."""
    ans = item["answer"]
    t = item["type"]
    options = {o["id"]: o["label"] for o in item.get("data", {}).get("options", [])}
    if t == "mc":
        return {"id": ans, "label": options.get(ans, ans)}
    if t == "multi_select":
        return [{"id": a, "label": options.get(a, a)} for a in ans]
    if t == "steps":
        out = {}
        for part in item["data"]["parts"]:
            v = ans[part["id"]]
            if part["type"] == "mc":
                v = {"id": v, "label": {o["id"]: o["label"] for o in part["options"]}.get(v, v)}
            out[part["id"]] = v
        return out
    return ans


class Engine:
    def __init__(self, store: Store, *, final_question_count: int = 0, final_time_limit_seconds: int = 0,
                 rng_factory: Callable[[], random.Random] = random.Random, now: Callable[[], datetime] = _now):
        self.store = store
        self.final_count = final_question_count
        self.final_time_limit = final_time_limit_seconds
        self.rng_factory = rng_factory
        self.now = now

    # ------------------------------------------------------------------ helpers
    def _lessons_status(self, user_id: str) -> tuple[list[dict], set[str]]:
        lessons = self.store.list_lessons()
        completed = {p["lesson_id"] for p in self.store.list_lesson_progress(user_id) if p["status"] == "completed"}
        return lessons, completed

    @staticmethod
    def _is_unlocked(lesson: dict, lessons: list[dict], completed: set[str]) -> bool:
        if lesson["level_no"] == min(l["level_no"] for l in lessons):
            return True
        prev = [l for l in lessons if l["level_no"] < lesson["level_no"]]
        return max(prev, key=lambda l: l["level_no"])["id"] in completed

    def _load_owned(self, user_id: str, session_id: str) -> dict:
        s = self.store.get_session(session_id)
        if not s or s["user_id"] != user_id:
            raise EngineError("Sesi tidak ditemukan.", 404)
        return s

    def _max_attempts(self, s: dict) -> int:
        return int(s["options"].get("max_attempts", 1))

    def _expired(self, s: dict) -> bool:
        exp = _parse_ts(s.get("expires_at"))
        return bool(exp and self.now() > exp + timedelta(seconds=GRACE_SECONDS))

    def public_session(self, s: dict) -> dict:
        final = s["kind"] == "final"
        responses = {}
        for idx, r in (s.get("responses") or {}).items():
            if final:
                responses[idx] = {"answer": r.get("answer"), "reason": r.get("reason")}
            else:
                responses[idx] = {"answer": r.get("answer"), "attempts": r.get("attempts", 0),
                                  "correct": r.get("correct"), "done": r.get("done", False),
                                  "hints": r.get("hints", 0)}
        return {
            "id": s["id"], "kind": s["kind"], "ref_id": s["ref_id"], "title": s["options"].get("title"),
            "status": s["status"], "feedback_mode": "deferred" if final else "instant",
            "max_attempts": self._max_attempts(s), "difficulty": s["options"].get("difficulty"),
            "items": [public_item(i) for i in s["items"]], "responses": responses,
            "started_at": s["started_at"], "expires_at": s.get("expires_at"),
            "result": s.get("result") if s["status"] == "finished" else None,
        }

    # ------------------------------------------------------------------ start
    def start(self, user_id: str, kind: str, ref_id: str, options: dict | None = None) -> dict:
        options = options or {}
        if kind not in KINDS:
            raise EngineError("Jenis aktivitas tidak dikenal.")
        rng = self.rng_factory()
        expires_at = None
        if kind == "lesson":
            lessons, completed = self._lessons_status(user_id)
            lesson = next((l for l in lessons if l["id"] == ref_id), None)
            if not lesson:
                raise EngineError("Materi tidak ditemukan.", 404)
            if not self._is_unlocked(lesson, lessons, completed):
                raise EngineError("Wilayah ini masih terkunci. Selesaikan wilayah sebelumnya dulu, ya!", 403)
            quiz = self.store.get_quiz(f"lesson-{ref_id}")
            if not quiz:
                raise EngineError("Latihan untuk materi ini belum tersedia.", 404)
            items = [question_to_item(q) for q in self.store.list_questions(quiz["id"])]
            opts = {"title": quiz["title"], "max_attempts": 2, "quiz_id": quiz["id"]}
        elif kind == "training":
            if ref_id not in TRAINING_LEVELS:
                raise EngineError("Level latihan tidak dikenal.", 404)
            quiz = self.store.get_quiz(f"training-{ref_id}")
            if not quiz:
                raise EngineError("Latihan belum tersedia.", 404)
            pool = self.store.list_questions(quiz["id"])
            n = min(quiz["question_count"], len(pool))
            chosen = rng.sample(pool, n)
            chosen.sort(key=lambda q: (q.get("difficulty", 1), q.get("position", 0)))
            items = [question_to_item(q) for q in chosen]
            opts = {"title": quiz["title"], "max_attempts": 2, "quiz_id": quiz["id"]}
        elif kind == "final":
            if ref_id != "final":
                raise EngineError("Evaluasi tidak dikenal.", 404)
            lessons, completed = self._lessons_status(user_id)
            if any(l["id"] not in completed for l in lessons):
                raise EngineError("Final Quest terbuka setelah keempat wilayah kerajaan diselesaikan.", 403)
            quiz = self.store.get_quiz("final")
            if not quiz:
                raise EngineError("Evaluasi belum tersedia.", 404)
            pool = self.store.list_questions("final")
            n = max(1, min(self.final_count or quiz["question_count"], len(pool)))
            items = [question_to_item(q) for q in self._stratified(pool, n, rng)]
            timed = bool(options.get("timed", True))
            limit = self.final_time_limit or quiz.get("time_limit_seconds")
            if timed and limit:
                expires_at = (self.now() + timedelta(seconds=int(limit))).isoformat()
            opts = {"title": quiz["title"], "max_attempts": 1, "quiz_id": "final", "timed": timed,
                    "time_limit_seconds": limit if timed else None}
        else:  # game
            game = self.store.get_game(ref_id)
            if not game or ref_id not in GAME_RULES:
                raise EngineError("Permainan tidak ditemukan.", 404)
            difficulty = options.get("difficulty")
            if ref_id == "find-the-royal-number":
                difficulty = difficulty if difficulty in DIFFICULTIES else "mudah"
            else:
                difficulty = None
            items = generate(ref_id, rng, difficulty)
            opts = {"title": game["title"], "max_attempts": GAME_RULES[ref_id]["max_attempts"],
                    "game_id": ref_id, "difficulty": difficulty}

        if not items:
            raise EngineError("Belum ada soal untuk aktivitas ini.", 404)
        row = self.store.insert_session({
            "user_id": user_id, "kind": kind, "ref_id": ref_id, "options": opts, "items": items,
            "responses": {}, "status": "active", "started_at": self.now().isoformat(), "expires_at": expires_at,
        })
        return self.public_session(row)

    @staticmethod
    def _stratified(pool: list[dict], n: int, rng: random.Random) -> list[dict]:
        """Ambil soal dari setiap tingkat kesulitan secara proporsional, urut mudah -> sulit."""
        buckets: dict[int, list[dict]] = {}
        for q in pool:
            buckets.setdefault(q.get("difficulty", 1), []).append(q)
        chosen: list[dict] = []
        total = len(pool)
        for d in sorted(buckets):
            take = round(n * len(buckets[d]) / total)
            chosen += rng.sample(buckets[d], min(take, len(buckets[d])))
        rest = [q for q in pool if q not in chosen]
        while len(chosen) < n and rest:
            chosen.append(rest.pop(rng.randrange(len(rest))))
        while len(chosen) > n:
            chosen.pop(rng.randrange(len(chosen)))
        chosen.sort(key=lambda q: (q.get("difficulty", 1), q.get("position", 0)))
        return chosen

    # ------------------------------------------------------------------ get
    def get(self, user_id: str, session_id: str) -> dict:
        return self.public_session(self._load_owned(user_id, session_id))

    # ------------------------------------------------------------------ answer
    def answer(self, user_id: str, session_id: str, index: int, response: Any, reason: str | None = None) -> dict:
        s = self._load_owned(user_id, session_id)
        if s["status"] != "active":
            raise EngineError("Sesi ini sudah selesai.", 409)
        items = s["items"]
        if not isinstance(index, int) or not 0 <= index < len(items):
            raise EngineError("Nomor soal tidak valid.")
        item = items[index]
        reason = (reason or "").strip()[:500] or None
        responses = dict(s.get("responses") or {})
        key = str(index)

        try:
            if s["kind"] == "final":
                if self._expired(s):
                    raise EngineError("Waktu evaluasi sudah habis. Kirim jawabanmu untuk melihat hasil.", 409)
                value = normalize(item, response)
                responses[key] = {"answer": value, "reason": reason}
                self.store.update_session(session_id, {"responses": responses})
                return {"saved": True, "index": index}

            prev = responses.get(key, {"attempts": 0, "hints": 0})
            if prev.get("done"):
                raise EngineError("Soal ini sudah selesai dijawab.", 409)
            result = check(item, response)
        except InvalidAnswer as exc:
            raise EngineError(str(exc), 422) from exc

        attempts = prev.get("attempts", 0) + 1
        max_att = self._max_attempts(s)
        done = result.correct or attempts >= max_att
        responses[key] = {**prev, "answer": result.normalized, "attempts": attempts, "correct": result.correct,
                          "fraction": result.fraction, "done": done, "reason": reason or prev.get("reason")}
        self.store.update_session(session_id, {"responses": responses})

        rng = random.Random(f"{session_id}:{index}:{attempts}")
        feedback: dict[str, Any] = {
            "index": index, "correct": result.correct, "fraction": round(result.fraction, 2),
            "parts": result.parts, "attempts": attempts, "attempts_left": max(0, max_att - attempts), "done": done,
        }
        if result.correct:
            feedback["message"] = rng.choice(MESSAGES["correct"])
        elif not done:
            feedback["message"] = rng.choice(MESSAGES["retry"])
            feedback["hint"] = item.get("hint")
        else:
            feedback["message"] = rng.choice(MESSAGES["reveal"])
        if done:
            feedback["explanation"] = item.get("explanation", [])
            feedback["correct_answer"] = correct_answer_view(item)
        return feedback

    # ------------------------------------------------------------------ hint
    def hint(self, user_id: str, session_id: str, index: int) -> dict:
        s = self._load_owned(user_id, session_id)
        if s["kind"] == "final":
            raise EngineError("Petunjuk tidak tersedia saat evaluasi akhir.", 403)
        if s["status"] != "active":
            raise EngineError("Sesi ini sudah selesai.", 409)
        if not 0 <= index < len(s["items"]):
            raise EngineError("Nomor soal tidak valid.")
        item = s["items"][index]
        if not item.get("hint"):
            raise EngineError("Soal ini tidak memiliki petunjuk.", 404)
        responses = dict(s.get("responses") or {})
        r = dict(responses.get(str(index), {"attempts": 0, "hints": 0}))
        if not r.get("done") and r.get("hints", 0) == 0:
            r["hints"] = 1
            responses[str(index)] = r
            self.store.update_session(session_id, {"responses": responses})
        return {"index": index, "hint": item["hint"]}

    # ------------------------------------------------------------------ finish
    def finish(self, user_id: str, session_id: str) -> dict:
        s = self._load_owned(user_id, session_id)
        if s["status"] == "finished":
            return s["result"]
        final = s["kind"] == "final"
        responses = s.get("responses") or {}
        review, total, max_total, correct_count = [], 0.0, 0.0, 0
        for idx, item in enumerate(s["items"]):
            r = responses.get(str(idx), {})
            points = float(item.get("points", 10))
            max_total += points
            answered = "answer" in r and r["answer"] is not None
            if final:
                if answered:
                    res = check(item, r["answer"])
                    correct, fraction, attempts, hints = res.correct, res.fraction, 1, 0
                else:
                    correct, fraction, attempts, hints = False, 0.0, 0, 0
            else:
                correct = bool(r.get("correct"))
                fraction = float(r.get("fraction", 0.0)) if answered else 0.0
                attempts, hints = int(r.get("attempts", 0)), int(r.get("hints", 0))
            score = item_score(points, fraction, attempts, hints)
            total += score
            correct_count += 1 if correct else 0
            review.append({
                "index": idx, "qid": item.get("qid"), "type": item["type"], "prompt": item["prompt"],
                "data": item.get("data", {}), "your_answer": r.get("answer"), "reason": r.get("reason"),
                "answered": answered, "correct": correct, "score": score, "points": points,
                "correct_answer": correct_answer_view(item), "explanation": item.get("explanation", []),
            })
        percent = round(100 * total / max_total, 1) if max_total else 0.0
        result: dict[str, Any] = {
            "session_id": session_id, "kind": s["kind"], "ref_id": s["ref_id"], "title": s["options"].get("title"),
            "score": round(total, 1), "max_score": max_total, "percent": percent,
            "correct_count": correct_count, "total_count": len(s["items"]), "stars": stars_for(percent),
            "review": review, "xp_awarded": 0, "new_badges": [],
        }
        finished_at = self.now().isoformat()
        claimed = self.store.update_session(
            session_id, {"status": "finished", "result": result, "finished_at": finished_at}, only_if_active=True)
        if not claimed:  # sudah diselesaikan oleh permintaan lain
            return (self.store.get_session(session_id) or {}).get("result") or result

        xp = self._record(user_id, s, result, finished_at)
        new_badges = gm.evaluate_badges(self.store, user_id)
        stats = gm.refresh_stats(self.store, user_id)
        result.update({"xp_awarded": xp + sum(b["xp_bonus"] for b in new_badges), "new_badges": new_badges,
                       "stats": stats, "level": gm.level_for(stats["total_xp"])})
        self.store.update_session(session_id, {"result": result})
        return result

    def _record(self, user_id: str, s: dict, result: dict, finished_at: str) -> int:
        kind, ref = s["kind"], s["ref_id"]
        pct = result["percent"]
        details = [{"qid": r["qid"], "correct": r["correct"], "score": r["score"], "answer": r["your_answer"],
                    "reason": r["reason"]} for r in result["review"]]
        base = {"user_id": user_id, "session_id": s["id"], "score": result["score"], "max_score": result["max_score"],
                "percent": pct, "correct_count": result["correct_count"], "total_count": result["total_count"],
                "details": details}
        if kind == "lesson":
            existing = next((p for p in self.store.list_lesson_progress(user_id) if p["lesson_id"] == ref), None)
            best = max(pct, float(existing["best_score"]) if existing else 0.0)
            row = {"user_id": user_id, "lesson_id": ref, "best_score": best, "updated_at": finished_at,
                   "status": existing["status"] if existing else "in_progress"}
            if existing and existing["status"] == "completed":
                row["stars"] = stars_for(best)
            self.store.upsert_lesson_progress(row)
            self.store.insert_activity({"user_id": user_id, "activity_type": "lesson_check", "ref_id": ref,
                                        "title": result["title"], "score": pct, "status": "completed"})
            return 0
        if kind in ("training", "final"):
            self.store.insert_quiz_attempt({**base, "quiz_id": s["options"]["quiz_id"], "started_at": s["started_at"],
                                            "submitted_at": finished_at})
            tiers = gm.FINAL_TIERS if kind == "final" else gm.TRAINING_TIERS
            xp = gm.award_tiers(self.store, user_id, f"{kind}:{ref}", pct, tiers)
            self.store.insert_activity({"user_id": user_id, "activity_type": kind, "ref_id": s["options"]["quiz_id"],
                                        "title": result["title"], "score": pct, "status": "completed"})
            return xp
        # game
        self.store.insert_game_attempt({**base, "game_id": ref, "difficulty": s["options"].get("difficulty"),
                                        "played_at": finished_at})
        xp = gm.award_tiers(self.store, user_id, f"game:{ref}", pct, gm.GAME_TIERS)
        self.store.insert_activity({"user_id": user_id, "activity_type": "game", "ref_id": ref,
                                    "title": result["title"], "score": pct, "status": "completed"})
        return xp

    # ------------------------------------------------------------------ lesson complete
    def complete_lesson(self, user_id: str, lesson_id: str) -> dict:
        lessons, completed = self._lessons_status(user_id)
        lesson = next((l for l in lessons if l["id"] == lesson_id), None)
        if not lesson:
            raise EngineError("Materi tidak ditemukan.", 404)
        if not self._is_unlocked(lesson, lessons, completed):
            raise EngineError("Wilayah ini masih terkunci.", 403)
        nxt = next((l for l in lessons if l["level_no"] > lesson["level_no"]), None)
        if lesson_id in completed:
            return {"already_completed": True, "xp_awarded": 0, "new_badges": [],
                    "next_lesson": nxt["id"] if nxt else None}
        if not self.store.has_finished_session(user_id, "lesson", lesson_id):
            raise EngineError("Kerjakan latihan singkat terlebih dahulu sebelum menyelesaikan misi.", 409)
        existing = next((p for p in self.store.list_lesson_progress(user_id) if p["lesson_id"] == lesson_id), None)
        best = float(existing["best_score"]) if existing else 0.0
        now = self.now().isoformat()
        self.store.upsert_lesson_progress({"user_id": user_id, "lesson_id": lesson_id, "status": "completed",
                                           "best_score": best, "stars": max(1, stars_for(best)),
                                           "completed_at": now, "updated_at": now})
        xp = lesson["xp_reward"] if self.store.insert_xp(user_id, f"lesson:{lesson_id}", lesson["xp_reward"]) else 0
        self.store.insert_activity({"user_id": user_id, "activity_type": "lesson_complete", "ref_id": lesson_id,
                                    "title": f"{lesson['region_name']}: {lesson['title']}", "score": best,
                                    "status": "completed"})
        new_badges = gm.evaluate_badges(self.store, user_id)
        stats = gm.refresh_stats(self.store, user_id)
        return {"already_completed": False, "xp_awarded": xp + sum(b["xp_bonus"] for b in new_badges),
                "new_badges": new_badges, "stats": stats, "level": gm.level_for(stats["total_xp"]),
                "next_lesson": nxt["id"] if nxt else None}
