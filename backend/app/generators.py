"""Generator ronde untuk lima permainan Magical Playground.

Setiap ronde dibuat acak di server dan menyimpan kunci jawaban di sesi
(tabel activity_sessions), sehingga permainan bisa diulang dengan soal berbeda.
"""

from __future__ import annotations

import random


GAME_RULES = {
    "princess-square-hunter": {"max_attempts": 1},
    "complete-the-magic-pattern": {"max_attempts": 2},
    "find-the-royal-number": {"max_attempts": 1},
    "magic-formula-challenge": {"max_attempts": 2},
    "enchanted-kingdom-quest": {"max_attempts": 3},
}

DIFFICULTIES = ("mudah", "sedang", "sulit")


def _sq(n: int) -> int:
    return n * n


# --------------------------------------------------------------------------
# GAME 1 — Princess Square Hunter (pilih semua susunan persegi)
# --------------------------------------------------------------------------
def square_hunter(rng: random.Random) -> list[dict]:
    rounds = []
    for r in range(5):
        max_side = 4 if r < 2 else 6
        n_square = rng.choice([2, 3]) if r < 4 else 3
        cards = []
        sides = rng.sample(range(1, max_side + 1), k=min(n_square, max_side))
        for s in sides:
            cards.append((s, s))
        while len(cards) < 6:
            a, b = rng.randint(1, max_side), rng.randint(1, max_side)
            if a != b and (a, b) not in cards:
                cards.append((a, b))
        rng.shuffle(cards)
        options = [{"id": f"k{i}", "label": f"{a} × {b}", "rows": a, "cols": b,
                    "illustration": {"kind": "grid", "rows": a, "cols": b}} for i, (a, b) in enumerate(cards)]
        answer = [o["id"] for o in options if o["rows"] == o["cols"]]
        rounds.append({
            "type": "multi_select",
            "prompt": "Ketuk SEMUA susunan permata yang membentuk persegi.",
            "data": {"options": options, "hide_labels": True},
            "answer": answer,
            "hint": "Persegi: banyak baris sama dengan banyak kolom.",
            "explanation": ["Susunan persegi memiliki baris = kolom."]
                           + [f"{o['rows']} × {o['cols']} = {o['rows'] * o['cols']} permata (persegi)"
                              for o in options if o["rows"] == o["cols"]],
            "points": 10,
        })
    return rounds


# --------------------------------------------------------------------------
# GAME 2 — Complete the Magic Pattern (isi rumpang)
# --------------------------------------------------------------------------
def complete_pattern(rng: random.Random) -> list[dict]:
    rounds = []
    for r in range(6):
        start = rng.randint(1, 3) if r < 2 else rng.randint(2, 9)
        length = 6
        seq = [_sq(start + i) for i in range(length)]
        blanks_n = 2 if r < 3 else 3
        # Jangan kosongkan dua suku pertama sekaligus agar pola tetap terlihat.
        candidates = list(range(1, length))
        blank_idx = sorted(rng.sample(candidates, blanks_n))
        display = [None if i in blank_idx else v for i, v in enumerate(seq)]
        rounds.append({
            "type": "sequence",
            "prompt": "Lengkapi kalung bilangan persegi yang hilang!",
            "data": {"display": display},
            "answer": [seq[i] for i in blank_idx],
            "hint": f"Suku pertama adalah {start}² = {_sq(start)}. Lanjutkan dengan {start + 1}², {start + 2}², dan seterusnya. "
                    "Selisihnya bilangan ganjil berurutan.",
            "explanation": [f"{start + i}² = {seq[i]}" for i in range(length)],
            "points": 10,
        })
    return rounds


# --------------------------------------------------------------------------
# GAME 3 — Find the Royal Number (pilih cepat, berantai, 3 tingkat)
# --------------------------------------------------------------------------
def _choices(rng: random.Random, correct: int, near: list[int]) -> list[dict]:
    pool = []
    for v in near:
        if v > 0 and v != correct and v not in pool:
            pool.append(v)
    while len(pool) < 3:
        v = correct + rng.choice([-3, -2, -1, 1, 2, 3, 4, 5]) * rng.randint(1, 3)
        if v > 0 and v != correct and v not in pool:
            pool.append(v)
    values = [correct] + pool[:3]
    rng.shuffle(values)
    return [{"id": f"g{i}", "label": str(v), "value": v} for i, v in enumerate(values)]


def find_royal_number(rng: random.Random, difficulty: str) -> list[dict]:
    rounds = []
    for _ in range(8):
        if difficulty == "mudah":
            k = rng.randint(1, 6)
            shown = [_sq(k + i) for i in range(4)]
            nxt = _sq(k + 4)
            rule = f"Bilangan persegi berurutan: {k}², {k + 1}², {k + 2}², {k + 3}² → berikutnya {k + 4}² = {nxt}."
            near = [shown[-1] + (shown[-1] - shown[-2]), nxt + 2, nxt - 2]
        elif difficulty == "sedang":
            k = rng.randint(6, 13)
            shown = [_sq(k + i) for i in range(3)]
            nxt = _sq(k + 3)
            rule = f"{k}², {k + 1}², {k + 2}² → berikutnya {k + 3}² = {nxt} (selisih bertambah 2)."
            near = [shown[-1] + (shown[-1] - shown[-2]), nxt + 2, (k + 3) * 2]
        else:
            kind = rng.choice(["ganjil", "genap", "turun", "loncat3"])
            if kind == "ganjil":
                bases = [1, 3, 5, 7]
                b0 = rng.choice([0, 1])
                bases = [b + 2 * b0 for b in bases]
                nxt_base = bases[-1] + 2
                desc = "kuadrat bilangan ganjil"
            elif kind == "genap":
                b0 = rng.choice([2, 4])
                bases = [b0 + 2 * i for i in range(4)]
                nxt_base = bases[-1] + 2
                desc = "kuadrat bilangan genap"
            elif kind == "turun":
                top = rng.randint(9, 14)
                bases = [top - i for i in range(4)]
                nxt_base = bases[-1] - 1
                desc = "bilangan persegi yang menurun"
            else:
                b0 = rng.randint(1, 3)
                bases = [b0 + 3 * i for i in range(4)]
                nxt_base = bases[-1] + 3
                desc = "kuadrat bilangan yang melompat 3"
            shown = [_sq(b) for b in bases]
            nxt = _sq(nxt_base)
            rule = f"Pola {desc}: {', '.join(f'{b}²' for b in bases)} → berikutnya {nxt_base}² = {nxt}."
            near = [shown[-1] + (shown[-1] - shown[-2]), nxt + 1, _sq(nxt_base + 1)]
        options = _choices(rng, nxt, near)
        answer = next(o["id"] for o in options if o["value"] == nxt)
        for o in options:
            o.pop("value")
        rounds.append({
            "type": "mc",
            "prompt": "Permata mana yang melanjutkan pola?",
            "data": {"display": shown, "options": options},
            "answer": answer,
            "hint": "Ubah setiap bilangan menjadi bentuk n². Lihat pola nilai n-nya.",
            "explanation": [rule],
            "points": 10,
        })
    return rounds


# --------------------------------------------------------------------------
# GAME 4 — Magic Formula Challenge (langkah rumus, bertahap)
# --------------------------------------------------------------------------
def magic_formula(rng: random.Random) -> list[dict]:
    rounds = []
    for k in rng.sample(range(3, 10), 2):  # Tahap 1: n -> Un
        rounds.append({
            "type": "steps", "stage": 1,
            "prompt": f"Tahap 1 — Tentukan U{_sub(k)} menggunakan rumus Uₙ = n².",
            "data": {"context": f"Kita ingin mencari suku ke-{k}.",
                     "parts": [{"id": "a", "type": "number", "prompt": "Nilai n adalah"},
                               {"id": "b", "type": "number", "prompt": f"U{_sub(k)} = {k} × {k} ="}]},
            "answer": {"a": k, "b": _sq(k)},
            "hint": f"Suku ke-{k} berarti n = {k}. Lalu kalikan {k} dengan {k}.",
            "explanation": [f"n = {k}", f"U{_sub(k)} = {k}² = {k} × {k} = {_sq(k)}"],
            "points": 10,
        })
    for k in rng.sample(range(5, 13), 2):  # Tahap 2: Un -> n
        rounds.append({
            "type": "steps", "stage": 2,
            "prompt": f"Tahap 2 — Diketahui Uₙ = {_sq(k)}. Temukan n!",
            "data": {"context": "Cari bilangan yang jika dikalikan dirinya sendiri menghasilkan bilangan tersebut.",
                     "parts": [{"id": "a", "type": "number", "prompt": "n ="}]},
            "answer": {"a": k},
            "hint": f"Coba bilangan di sekitar {k - 1} dan {k + 1}: hitung kuadratnya.",
            "explanation": [f"{k} × {k} = {_sq(k)}", f"Jadi n = {k}"],
            "points": 10,
        })
    contexts = [("ubin", "Lantai ruang dansa berbentuk persegi dengan {k} ubin pada setiap sisi."),
                ("lampu", "Lampu kristal disusun persegi dengan {k} lampu pada setiap baris."),
                ("bunga", "Bunga mawar ditanam membentuk persegi, {k} baris dan {k} kolom."),
                ("kursi", "Kursi tamu disusun persegi dengan {k} kursi di setiap baris.")]
    for k, (unit, text) in zip(rng.sample(range(11, 21), 2), rng.sample(contexts, 2)):  # Tahap 3: soal cerita
        rounds.append({
            "type": "steps", "stage": 3,
            "prompt": "Tahap 3 — Royal Story Problem",
            "data": {"context": text.format(k=k) + f" Berapa banyak {unit} seluruhnya?",
                     "parts": [{"id": "a", "type": "number", "prompt": "Panjang sisi (n)"},
                               {"id": "b", "type": "number", "prompt": f"Banyak {unit} = n² =", "unit": unit}]},
            "answer": {"a": k, "b": _sq(k)},
            "hint": f"Sisi persegi = {k}. Banyak {unit} = {k} × {k}.",
            "explanation": [f"n = {k}", f"{k}² = {_sq(k)} {unit}"],
            "points": 10,
        })
    return rounds


# --------------------------------------------------------------------------
# GAME 5 — Enchanted Kingdom Quest (lima gerbang cerita)
# --------------------------------------------------------------------------
def kingdom_quest(rng: random.Random) -> list[dict]:
    g1 = rng.randint(3, 5)
    s2 = rng.randint(3, 6)
    seq2 = [_sq(s2 + i) for i in range(4)]
    d3 = rng.randint(4, 8)
    n4 = rng.randint(7, 12)
    n5 = rng.randint(9, 15)
    return [
        {"type": "number", "gate": "Gerbang Kastel",
         "story": "Gerbang kastel terkunci oleh ubin ajaib. Kunci terbuka bila kamu menyebutkan banyak ubin di pintunya.",
         "prompt": f"Pintu kastel dihiasi ubin yang tersusun {g1} × {g1}. Berapa banyak ubinnya?",
         "data": {"illustration": {"kind": "grid", "rows": g1, "cols": g1}, "unit": "ubin"},
         "answer": _sq(g1), "hint": f"Ada {g1} baris dan {g1} kolom.",
         "explanation": [f"{g1} × {g1} = {_sq(g1)} ubin."], "points": 10},
        {"type": "number", "gate": "Jembatan Taman",
         "story": "Jembatan menuju taman ajaib hanya muncul jika batu loncatan berikutnya diketahui.",
         "prompt": f"Batu loncatan bertuliskan {', '.join(map(str, seq2))}, ... Bilangan berikutnya?",
         "data": {}, "answer": _sq(s2 + 4),
         "hint": f"{seq2[0]} = {s2}². Lanjutkan sampai suku berikutnya.",
         "explanation": [f"Berikutnya {s2 + 4}² = {_sq(s2 + 4)}."], "points": 10},
        {"type": "number", "gate": "Hutan Berbisik",
         "story": "Pohon-pohon di hutan berbisik: 'Berapa jarak antara dua bilangan persegi bersebelahan?'",
         "prompt": f"Berapa selisih antara {_sq(d3 + 1)} dan {_sq(d3)}?",
         "data": {}, "answer": _sq(d3 + 1) - _sq(d3),
         "hint": "Kurangkan bilangan yang lebih besar dengan yang lebih kecil.",
         "explanation": [f"{_sq(d3 + 1)} − {_sq(d3)} = {_sq(d3 + 1) - _sq(d3)} (bilangan ganjil)."], "points": 10},
        {"type": "number", "gate": "Perpustakaan Sihir",
         "story": "Buku mantra terbuka di halaman rumus. Ucapkan hasil mantranya!",
         "prompt": f"Gunakan rumus Uₙ = n². Berapakah U{_sub(n4)}?",
         "data": {}, "answer": _sq(n4), "hint": f"U{_sub(n4)} = {n4} × {n4}.",
         "explanation": [f"U{_sub(n4)} = {n4}² = {_sq(n4)}."], "points": 10},
        {"type": "number", "gate": "Aula Mahkota",
         "story": "Pintu terakhir menuju Aula Mahkota! Para tamu kerajaan sudah menunggu.",
         "prompt": f"{_sq(n5)} kursi tamu disusun membentuk persegi. Berapa kursi pada setiap baris?",
         "data": {"unit": "kursi"}, "answer": n5,
         "hint": f"Cari bilangan yang jika dikuadratkan menjadi {_sq(n5)}.",
         "explanation": [f"{n5} × {n5} = {_sq(n5)}, jadi setiap baris {n5} kursi."], "points": 10},
    ]


_SUB = str.maketrans("0123456789", "₀₁₂₃₄₅₆₇₈₉")


def _sub(n: int) -> str:
    return str(n).translate(_SUB)


def generate(game_id: str, rng: random.Random, difficulty: str | None = None) -> list[dict]:
    if game_id == "princess-square-hunter":
        return square_hunter(rng)
    if game_id == "complete-the-magic-pattern":
        return complete_pattern(rng)
    if game_id == "find-the-royal-number":
        return find_royal_number(rng, difficulty if difficulty in DIFFICULTIES else "mudah")
    if game_id == "magic-formula-challenge":
        return magic_formula(rng)
    if game_id == "enchanted-kingdom-quest":
        return kingdom_quest(rng)
    raise KeyError(game_id)
