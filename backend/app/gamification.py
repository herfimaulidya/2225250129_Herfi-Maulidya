"""Royal Points (XP), Royal Level, dan Princess Badges.

XP dicatat di xp_ledger dengan kunci unik per sumber (mis. 'lesson:princess-castle',
'game:find-the-royal-number:80'), sehingga refresh halaman atau mengulang aktivitas
tidak pernah memberi XP ganda. Mengulang dengan skor lebih tinggi membuka tingkat
XP berikutnya.
"""

from __future__ import annotations

from datetime import datetime, timezone

from .content.catalog import LEVELS
from .store import Store

# Tingkat skor -> XP (diberikan sekali per tingkat)
TRAINING_TIERS = {50: 10, 80: 15, 100: 15}
GAME_TIERS = {50: 15, 80: 15, 100: 10}
FINAL_TIERS = {0: 30, 70: 30, 90: 30}


def level_for(xp: int) -> dict:
    current = LEVELS[0]
    for lv in LEVELS:
        if xp >= lv["min_xp"]:
            current = lv
    nxt = next((lv for lv in LEVELS if lv["min_xp"] > xp), None)
    return {**current, "next_min_xp": nxt["min_xp"] if nxt else None}


def award_tiers(store: Store, user_id: str, prefix: str, percent: float, tiers: dict[int, int]) -> int:
    gained = 0
    for threshold, amount in sorted(tiers.items()):
        if percent >= threshold and store.insert_xp(user_id, f"{prefix}:{threshold}", amount):
            gained += amount
    return gained


def _best(rows: list[dict], key: str) -> dict[str, float]:
    best: dict[str, float] = {}
    for r in rows:
        best[r[key]] = max(best.get(r[key], 0.0), float(r["percent"]))
    return best


def evaluate_badges(store: Store, user_id: str) -> list[dict]:
    """Periksa semua syarat lencana; kembalikan lencana yang BARU diperoleh."""
    owned = set(store.list_user_achievement_ids(user_id))
    completed = {p["lesson_id"] for p in store.list_lesson_progress(user_id) if p["status"] == "completed"}
    quiz_rows = store.list_quiz_attempt_summaries(user_id)
    game_rows = store.list_game_attempt_summaries(user_id)
    quiz_best = _best(quiz_rows, "quiz_id")
    game_best = _best(game_rows, "game_id")
    played_games = {r["game_id"] for r in game_rows}

    rules = {
        "first-royal-adventure": len(completed) >= 1,
        "princess-explorer": "princess-castle" in completed,
        "pattern-detective": game_best.get("complete-the-magic-pattern", 0) >= 70,
        "magic-formula-master": "magic-library" in completed and game_best.get("magic-formula-challenge", 0) >= 70,
        "royal-math-expert": quiz_best.get("training-level-3", 0) >= 70,
        "kingdom-adventurer": "enchanted-kingdom-quest" in played_games,
        "royal-champion": "final" in quiz_best,
    }
    catalog = {a["id"]: a for a in store.list_achievements()}
    new = []
    for aid, ok in rules.items():
        if ok and aid not in owned and aid in catalog and store.insert_user_achievement(user_id, aid):
            badge = catalog[aid]
            store.insert_xp(user_id, f"badge:{aid}", int(badge.get("xp_bonus", 0)))
            store.insert_activity({"user_id": user_id, "activity_type": "badge", "ref_id": aid,
                                   "title": f"Lencana: {badge['title']}", "status": "earned"})
            new.append({"id": aid, "title": badge["title"], "description": badge["description"],
                        "icon": badge.get("icon", "award"), "xp_bonus": badge.get("xp_bonus", 0)})
    return new


def refresh_stats(store: Store, user_id: str) -> dict:
    xp = store.sum_xp(user_id)
    completed = [p for p in store.list_lesson_progress(user_id) if p["status"] == "completed"]
    quiz_rows = store.list_quiz_attempt_summaries(user_id)
    game_rows = store.list_game_attempt_summaries(user_id)
    training = [r for r in quiz_rows if r["quiz_id"].startswith("training-")]
    finals = [float(r["percent"]) for r in quiz_rows if r["quiz_id"] == "final"]
    stats = {
        "user_id": user_id,
        "total_xp": xp,
        "royal_level": level_for(xp)["level"],
        "lessons_completed": len(completed),
        "missions_completed": len(completed),
        "games_played": len(game_rows),
        "trainings_completed": len(training),
        "best_training_score": max((float(r["percent"]) for r in training), default=None),
        "best_final_score": max(finals, default=None),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    store.upsert_stats(stats)
    return stats
