import json
from datetime import datetime, timedelta, timezone

import pytest

from app.engine import Engine, EngineError
from tests.memory_store import MemoryStore

UID = "11111111-1111-1111-1111-111111111111"
OTHER = "22222222-2222-2222-2222-222222222222"


@pytest.fixture
def store():
    s = MemoryStore()
    for uid, code in ((UID, "RA-TEST-1"), (OTHER, "RA-TEST-2")):
        s.insert_profile({"id": uid, "student_code": code, "full_name": "Uji", "class_name": "7A"})
    return s


@pytest.fixture
def engine(store):
    return Engine(store)


def answer_all_correct(engine, store, sid, user=UID):
    s = store.sessions[sid]
    for i, item in enumerate(s["items"]):
        fb = engine.answer(user, sid, i, item["answer"])
        if s["kind"] != "final":
            assert fb["correct"] is True


def complete_lesson(engine, store, lesson_id, user=UID):
    sess = engine.start(user, "lesson", lesson_id)
    answer_all_correct(engine, store, sess["id"], user)
    engine.finish(user, sess["id"])
    return engine.complete_lesson(user, lesson_id)


def test_public_session_never_contains_answer_keys(engine):
    for kind, ref in (("lesson", "princess-castle"), ("training", "level-3"), ("game", "magic-formula-challenge")):
        pub = engine.start(UID, kind, ref)
        dumped = json.dumps(pub)
        assert '"answer"' not in dumped.replace('"responses": {}', "")
        assert '"explanation"' not in dumped and '"hint":' not in dumped


def test_lessons_unlock_in_order(engine, store):
    with pytest.raises(EngineError) as e:
        engine.start(UID, "lesson", "enchanted-garden")
    assert e.value.status == 403
    with pytest.raises(EngineError) as e:
        engine.complete_lesson(UID, "princess-castle")  # belum mengerjakan latihan singkat
    assert e.value.status == 409
    r = complete_lesson(engine, store, "princess-castle")
    assert r["xp_awarded"] == 50 + 20 + 20  # materi + 2 lencana
    assert {b["id"] for b in r["new_badges"]} == {"first-royal-adventure", "princess-explorer"}
    assert r["next_lesson"] == "enchanted-garden"
    engine.start(UID, "lesson", "enchanted-garden")  # sekarang terbuka


def test_lesson_xp_not_awarded_twice(engine, store):
    complete_lesson(engine, store, "princess-castle")
    xp1 = store.sum_xp(UID)
    again = engine.complete_lesson(UID, "princess-castle")
    assert again["already_completed"] and again["xp_awarded"] == 0
    complete_lesson(engine, store, "princess-castle")  # ulang materi
    assert store.sum_xp(UID) == xp1


def test_wrong_answer_gives_hint_then_explanation(engine, store):
    sess = engine.start(UID, "lesson", "princess-castle")
    fb = engine.answer(UID, sess["id"], 0, "a")  # salah (jawaban benar 'b')
    assert fb["correct"] is False and fb["hint"] and fb["attempts_left"] == 1
    assert "correct_answer" not in fb
    fb2 = engine.answer(UID, sess["id"], 0, "c")
    assert fb2["done"] and fb2["correct_answer"]["id"] == "b" and fb2["explanation"]
    with pytest.raises(EngineError):
        engine.answer(UID, sess["id"], 0, "b")


def test_invalid_answer_is_rejected_without_using_attempt(engine, store):
    sess = engine.start(UID, "lesson", "enchanted-garden" if False else "princess-castle")
    with pytest.raises(EngineError) as e:
        engine.answer(UID, sess["id"], 0, "zzz")
    assert e.value.status == 422
    assert store.sessions[sess["id"]]["responses"] == {}


def test_training_scoring_and_tier_xp(engine, store):
    sess = engine.start(UID, "training", "level-1")
    assert len(sess["items"]) == 8
    answer_all_correct(engine, store, sess["id"])
    res = engine.finish(UID, sess["id"])
    assert res["percent"] == 100 and res["stars"] == 3
    assert res["xp_awarded"] == 40
    # Mengulang dengan skor penuh tidak memberi XP lagi
    sess2 = engine.start(UID, "training", "level-1")
    answer_all_correct(engine, store, sess2["id"])
    assert engine.finish(UID, sess2["id"])["xp_awarded"] == 0
    # finish dua kali (mis. refresh) mengembalikan hasil yang sama tanpa XP tambahan
    total = store.sum_xp(UID)
    engine.finish(UID, sess2["id"])
    assert store.sum_xp(UID) == total
    assert len(store.quiz_attempts) == 2


def test_hint_reduces_score(engine, store):
    sess = engine.start(UID, "game", "enchanted-kingdom-quest")
    sid = sess["id"]
    h = engine.hint(UID, sid, 0)
    assert h["hint"]
    answer_all_correct(engine, store, sid)
    res = engine.finish(UID, sid)
    assert res["score"] == 47.5 and res["max_score"] == 50


def test_other_user_cannot_touch_session(engine):
    sess = engine.start(UID, "training", "level-2")
    for fn, args in ((engine.get, ()), (engine.answer, (0, 1)), (engine.finish, ()), (engine.hint, (0,))):
        with pytest.raises(EngineError) as e:
            fn(OTHER, sess["id"], *args)
        assert e.value.status == 404


def test_final_locked_until_all_lessons(engine, store):
    with pytest.raises(EngineError) as e:
        engine.start(UID, "final", "final")
    assert e.value.status == 403
    for l in ("princess-castle", "enchanted-garden", "magic-library", "royal-challenge-palace"):
        complete_lesson(engine, store, l)
    sess = engine.start(UID, "final", "final")
    assert len(sess["items"]) == 10
    assert sess["feedback_mode"] == "deferred" and sess["expires_at"]
    diffs = [i["difficulty"] for i in sess["items"]]
    assert diffs == sorted(diffs)
    # Saat evaluasi: hanya tersimpan, tanpa kunci/benar-salah; jawaban boleh diganti
    fb = engine.answer(UID, sess["id"], 0, store.sessions[sess["id"]]["items"][0]["answer"])
    assert fb == {"saved": True, "index": 0}
    with pytest.raises(EngineError):
        engine.hint(UID, sess["id"], 0)
    answer_all_correct(engine, store, sess["id"])
    res = engine.finish(UID, sess["id"])
    assert res["percent"] == 100 and all(r["correct"] for r in res["review"])
    assert any(b["id"] == "royal-champion" for b in res["new_badges"])
    assert store.stats[UID]["best_final_score"] == 100


def test_final_unanswered_counts_zero_and_timer(store):
    t0 = datetime(2026, 1, 1, tzinfo=timezone.utc)
    clock = {"now": t0}
    eng = Engine(store, now=lambda: clock["now"])
    for l in ("princess-castle", "enchanted-garden", "magic-library", "royal-challenge-palace"):
        complete_lesson(eng, store, l)
    sess = eng.start(UID, "final", "final")
    clock["now"] = t0 + timedelta(seconds=1200 + 31)
    with pytest.raises(EngineError) as e:
        eng.answer(UID, sess["id"], 0, 1)
    assert e.value.status == 409
    res = eng.finish(UID, sess["id"])
    assert res["percent"] == 0 and res["correct_count"] == 0


def test_final_untimed_option(engine, store):
    for l in ("princess-castle", "enchanted-garden", "magic-library", "royal-challenge-palace"):
        complete_lesson(engine, store, l)
    sess = engine.start(UID, "final", "final", {"timed": False})
    assert sess["expires_at"] is None


def test_all_games_playable_and_badges(engine, store):
    complete_lesson(engine, store, "princess-castle")
    complete_lesson(engine, store, "enchanted-garden")
    complete_lesson(engine, store, "magic-library")
    for game in ("princess-square-hunter", "complete-the-magic-pattern", "find-the-royal-number",
                 "magic-formula-challenge", "enchanted-kingdom-quest"):
        sess = engine.start(UID, "game", game, {"difficulty": "sulit"})
        answer_all_correct(engine, store, sess["id"])
        res = engine.finish(UID, sess["id"])
        assert res["percent"] == 100, game
    owned = set(store.list_user_achievement_ids(UID))
    assert {"pattern-detective", "magic-formula-master", "kingdom-adventurer"} <= owned
    assert store.stats[UID]["games_played"] == 5


def test_level_progression(engine, store):
    from app.gamification import level_for
    assert level_for(0)["level"] == 1
    assert level_for(80)["level"] == 2
    assert level_for(649)["level"] == 5
    assert level_for(10_000)["level"] == 6 and level_for(10_000)["next_min_xp"] is None
