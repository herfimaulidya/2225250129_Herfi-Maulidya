import math
import random

import pytest

from app.content.catalog import QUIZZES
from app.content.questions import QUESTIONS
from app.generators import generate, GAME_RULES, DIFFICULTIES
from app.grading import InvalidAnswer, check, item_score, normalize, stars_for, to_int
from app.engine import question_to_item


def is_square(n):
    return n >= 0 and math.isqrt(n) ** 2 == n


# ---------------- validasi input angka ----------------
@pytest.mark.parametrize("raw,expected", [("49", 49), (" 64 ", 64), (36, 36), (25.0, 25), ("-4", -4)])
def test_to_int_valid(raw, expected):
    assert to_int(raw) == expected


@pytest.mark.parametrize("raw", ["", "  ", "abc", "4.5", "4,5", 2.5, True, None, [], "1e5"])
def test_to_int_invalid(raw):
    with pytest.raises(InvalidAnswer):
        to_int(raw)


# ---------------- bank soal ----------------
def test_every_quiz_has_enough_questions():
    for quiz in QUIZZES:
        pool = [q for q in QUESTIONS if q["quiz_id"] == quiz["id"]]
        assert len(pool) >= quiz["question_count"], quiz["id"]


def test_question_ids_unique_and_have_explanations():
    ids = [q["id"] for q in QUESTIONS]
    assert len(ids) == len(set(ids))
    for q in QUESTIONS:
        assert q["explanation"], f"{q['id']} tanpa pembahasan"
        if not q["quiz_id"] == "final":
            assert q["hint"], f"{q['id']} tanpa petunjuk"


def test_every_answer_key_is_accepted_by_its_own_checker():
    """Kunci jawaban setiap soal harus dinilai benar oleh mesin penilai."""
    for q in QUESTIONS:
        item = question_to_item(q)
        assert check(item, q["answer"]).correct, q["id"]


def test_sequence_questions_are_real_square_sequences():
    for q in QUESTIONS:
        if q["qtype"] != "sequence":
            continue
        disp = list(q["data"]["display"])
        it = iter(q["answer"])
        full = [v if v is not None else next(it) for v in disp]
        assert all(is_square(v) for v in full), q["id"]
        roots = [math.isqrt(v) for v in full]
        assert all(b - a == 1 for a, b in zip(roots, roots[1:])), q["id"]


def test_mc_grid_option_answers_are_squares():
    for q in QUESTIONS:
        if q["qtype"] == "mc" and all("illustration" in o for o in q["data"].get("options", [])):
            correct = next(o for o in q["data"]["options"] if o["id"] == q["answer"])
            ill = correct["illustration"]
            assert ill["rows"] == ill["cols"], q["id"]
            others = [o for o in q["data"]["options"] if o["id"] != q["answer"]]
            assert all(o["illustration"]["rows"] != o["illustration"]["cols"] for o in others), q["id"]


# ---------------- tipe soal ----------------
def test_sequence_partial_credit():
    item = {"type": "sequence", "data": {"display": [1, None, 9, None]}, "answer": [4, 16]}
    r = check(item, ["4", "15"])
    assert not r.correct and r.fraction == 0.5 and r.parts == [True, False]


def test_steps_partial_and_validation():
    q = next(q for q in QUESTIONS if q["id"] == "f-9")
    item = question_to_item(q)
    r = check(item, {"a": "persegi", "b": 6, "c": 35})
    assert not r.correct and r.parts == {"a": True, "b": True, "c": False}
    with pytest.raises(InvalidAnswer):
        normalize(item, {"a": "persegi"})


def test_multi_select_scoring():
    item = {"type": "multi_select", "data": {"options": [{"id": x, "label": x} for x in "abcd"]}, "answer": ["a", "c"]}
    assert check(item, ["c", "a"]).correct
    r = check(item, ["a", "b"])
    assert not r.correct and r.parts == {"missed": ["c"], "wrong": ["b"]}


def test_tf_and_mc_reject_garbage():
    with pytest.raises(InvalidAnswer):
        normalize({"type": "tf"}, "mungkin")
    with pytest.raises(InvalidAnswer):
        normalize({"type": "mc", "data": {"options": [{"id": "a"}]}}, "z")


def test_item_score_and_stars():
    assert item_score(10, 1, 1, 0) == 10
    assert item_score(10, 1, 2, 0) == 6
    assert item_score(10, 1, 1, 1) == 7.5
    assert item_score(10, 0.5, 1, 0) == 5
    assert item_score(10, 1, 0, 0) == 0
    assert [stars_for(p) for p in (0, 49.9, 50, 80, 100)] == [0, 0, 1, 2, 3]


# ---------------- generator permainan ----------------
@pytest.mark.parametrize("seed", range(40))
def test_game_generators_are_mathematically_correct(seed):
    rng = random.Random(seed)
    for game_id in GAME_RULES:
        diffs = DIFFICULTIES if game_id == "find-the-royal-number" else (None,)
        for d in diffs:
            items = generate(game_id, rng, d)
            assert items
            for it in items:
                assert check(it, it["answer"]).correct, (game_id, it)
                if it["type"] == "multi_select":
                    opts = {o["id"]: o for o in it["data"]["options"]}
                    assert set(it["answer"]) == {i for i, o in opts.items() if o["rows"] == o["cols"]}
                    assert it["answer"], "minimal satu persegi"
                if it["type"] == "sequence":
                    it_ans = iter(it["answer"])
                    full = [v if v is not None else next(it_ans) for v in it["data"]["display"]]
                    roots = [math.isqrt(v) for v in full]
                    assert all(is_square(v) for v in full) and all(b - a == 1 for a, b in zip(roots, roots[1:]))
                if it["type"] == "mc":
                    labels = [o["label"] for o in it["data"]["options"]]
                    assert len(labels) == len(set(labels)) == 4
                    correct = int(next(o["label"] for o in it["data"]["options"] if o["id"] == it["answer"]))
                    assert is_square(correct)
                if it["type"] == "steps":
                    ans = it["answer"]
                    if "b" in ans:
                        assert ans["b"] == ans["a"] ** 2
