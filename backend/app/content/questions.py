"""Bank soal ROYAL ADVENTURE (pola bilangan persegi).

Format setiap soal:
  id, quiz_id, qtype, difficulty, prompt, data, answer, hint, explanation[list],
  ask_reason, literacy_focus, points

qtype:
  mc            -> data.options = [{id, label, illustration?}], answer = id opsi
  tf            -> answer = True/False
  number        -> answer = bilangan bulat; data.unit opsional
  sequence      -> data.display = [1, 4, None, 16, None]; answer = [isi rumpang berurutan]
  multi_select  -> data.options; answer = [id opsi yang benar]
  steps         -> data.context, data.parts = [{id, prompt, type: mc|number, options?, unit?}];
                   answer = {part_id: jawaban}

Ilustrasi: {"kind": "grid", "rows": r, "cols": c} atau {"kind": "pattern", "terms": [1, 2, 3]}
"""


def grid(rows, cols=None):
    return {"kind": "grid", "rows": rows, "cols": cols if cols is not None else rows}


def pattern(*terms):
    return {"kind": "pattern", "terms": list(terms)}


def opt(oid, label, illustration=None):
    o = {"id": oid, "label": label}
    if illustration:
        o["illustration"] = illustration
    return o


def q(id, quiz_id, qtype, prompt, answer, *, difficulty=1, data=None, hint=None,
      explanation=None, ask_reason=False, literacy=None, points=10):
    return {
        "id": id, "quiz_id": quiz_id, "qtype": qtype, "difficulty": difficulty,
        "prompt": prompt, "data": data or {}, "answer": answer, "hint": hint,
        "explanation": explanation or [], "ask_reason": ask_reason,
        "literacy_focus": literacy, "points": points,
    }


PATTERN_PART = {
    "id": "a", "type": "mc", "prompt": "Pola apa yang terbentuk dari banyak benda tersebut?",
    "options": [
        opt("persegi", "Pola bilangan persegi (1, 4, 9, ...)"),
        opt("ganjil", "Pola bilangan ganjil (1, 3, 5, ...)"),
        opt("genap", "Pola bilangan genap (2, 4, 6, ...)"),
    ],
}

QUESTIONS = [
    # ================= LATIHAN SINGKAT MATERI =================
    # --- Level 1: Princess Castle ---
    q("lc-1", "lesson-princess-castle", "mc", "Perhatikan susunan kotak. Ada berapa kotak seluruhnya?", "b",
      data={"illustration": grid(3), "options": [opt("a", "6"), opt("b", "9"), opt("c", "12"), opt("d", "3")]},
      hint="Hitung banyak baris, lalu banyak kotak di setiap baris.",
      explanation=["Ada 3 baris.", "Setiap baris berisi 3 kotak.", "Banyak kotak = 3 × 3 = 9."],
      literacy="Memahami hubungan susunan persegi dan bilangan"),
    q("lc-2", "lesson-princess-castle", "mc", "Manakah susunan kotak yang membentuk persegi?", "b",
      data={"options": [opt("a", "2 × 3", grid(2, 3)), opt("b", "4 × 4", grid(4)),
                        opt("c", "3 × 5", grid(3, 5)), opt("d", "1 × 4", grid(1, 4))]},
      hint="Susunan persegi memiliki banyak baris yang SAMA dengan banyak kolom.",
      explanation=["Persegi: banyak baris = banyak kolom.", "Hanya 4 × 4 yang barisnya (4) sama dengan kolomnya (4).",
                   "Yang lain berbentuk persegi panjang."]),
    q("lc-3", "lesson-princess-castle", "tf", "Bilangan 16 termasuk bilangan persegi.", True,
      hint="Adakah bilangan yang jika dikalikan dengan dirinya sendiri hasilnya 16?",
      explanation=["4 × 4 = 16.", "16 dapat disusun menjadi persegi 4 baris dan 4 kolom.", "Jadi pernyataan BENAR."]),

    # --- Level 2: Enchanted Garden ---
    q("lg-1", "lesson-enchanted-garden", "number", "1, 4, 9, 16, 25, ...  Bilangan berikutnya adalah?", 36,
      hint="Selisihnya 3, 5, 7, 9, ... Selisih berikutnya 11.",
      explanation=["Selisih antarbilangan: 3, 5, 7, 9.", "Selisih berikutnya: 11.", "25 + 11 = 36 (juga 6 × 6 = 36)."]),
    q("lg-2", "lesson-enchanted-garden", "mc", "Berapa selisih antara 25 dan 36?", "c",
      data={"options": [opt("a", "9"), opt("b", "10"), opt("c", "11"), opt("d", "13")]},
      hint="Kurangkan bilangan yang lebih besar dengan yang lebih kecil.",
      explanation=["36 − 25 = 11.", "11 adalah bilangan ganjil berikutnya setelah 9 — sesuai pola selisih."]),
    q("lg-3", "lesson-enchanted-garden", "sequence", "Lengkapi pola bilangan persegi berikut.", [25, 49],
      data={"display": [9, 16, None, 36, None]},
      hint="9 = 3 × 3, 16 = 4 × 4. Lanjutkan dengan 5 × 5 dan seterusnya.",
      explanation=["9 = 3², 16 = 4², maka berikutnya 5² = 25.", "Setelah 36 = 6², berikutnya 7² = 49."]),

    # --- Level 3: Magic Library ---
    q("ll-1", "lesson-magic-library", "number", "Gunakan rumus Uₙ = n². Berapakah U₇?", 49,
      hint="U₇ artinya n = 7. Hitung 7 × 7.",
      explanation=["Rumus: Uₙ = n².", "U₇ = 7² = 7 × 7.", "U₇ = 49."]),
    q("ll-2", "lesson-magic-library", "mc", "Mengapa rumus pola bilangan persegi adalah Uₙ = n²?", "a",
      data={"options": [
          opt("a", "Karena susunan ke-n memiliki n baris dan n kolom, sehingga banyak kotaknya n × n"),
          opt("b", "Karena setiap suku selalu bertambah 2"),
          opt("c", "Karena suku ke-n sama dengan 2 × n"),
          opt("d", "Karena bilangan persegi selalu genap")]},
      hint="Bayangkan susunan ke-3: ada berapa baris dan berapa kolom?",
      explanation=["Susunan ke-3 memiliki 3 baris dan 3 kolom → 3 × 3 kotak.",
                   "Susunan ke-n memiliki n baris dan n kolom → n × n = n² kotak.",
                   "Selisih antarsuku tidak tetap (3, 5, 7, ...) dan bilangan persegi bisa ganjil (1, 9, 25)."],
      literacy="Menjelaskan alasan"),
    q("ll-3", "lesson-magic-library", "number", "Jika Uₙ = 81, berapakah nilai n?", 9,
      hint="Cari bilangan yang jika dikalikan dengan dirinya sendiri hasilnya 81.",
      explanation=["Kita cari n sehingga n × n = 81.", "9 × 9 = 81.", "Jadi n = 9."]),

    # --- Level 4: Royal Challenge Palace ---
    q("lp-1", "lesson-royal-challenge-palace", "steps",
      "Bunga di taman kerajaan disusun membentuk persegi.", {"a": "persegi", "b": 8, "c": 64},
      data={"context": "Susunan ke-1 berisi 1 bunga, susunan ke-2 berisi 4 bunga, susunan ke-3 berisi 9 bunga. "
                       "Berapa banyak bunga pada susunan ke-8?",
            "illustration": pattern(1, 2, 3),
            "parts": [PATTERN_PART,
                      {"id": "b", "type": "number", "prompt": "Susunan ke berapa yang ditanyakan? (nilai n)"},
                      {"id": "c", "type": "number", "prompt": "Banyak bunga pada susunan tersebut", "unit": "bunga"}]},
      hint="1 = 1², 4 = 2², 9 = 3². Maka susunan ke-8 = 8².",
      explanation=["Diketahui: 1, 4, 9, ... → pola bilangan persegi.", "Ditanya: susunan ke-8, jadi n = 8.",
                   "U₈ = 8² = 64.", "Jadi ada 64 bunga pada susunan ke-8."],
      ask_reason=True, literacy="Mengidentifikasi informasi, memilih strategi, menafsirkan hasil"),
    q("lp-2", "lesson-royal-challenge-palace", "number",
      "Lantai aula istana dipasang ubin membentuk persegi dengan 12 ubin pada setiap sisi. Berapa banyak ubin seluruhnya?",
      144, data={"unit": "ubin"},
      hint="Persegi dengan sisi 12 ubin berarti 12 baris dan 12 kolom.",
      explanation=["Sisi = 12 ubin → 12 baris × 12 kolom.", "Banyak ubin = 12² = 144.", "Jadi ada 144 ubin."]),
    q("lp-3", "lesson-royal-challenge-palace", "mc",
      "Sebanyak 100 kursi tamu kerajaan disusun membentuk persegi. Berapa kursi pada setiap baris?", "b",
      data={"options": [opt("a", "50"), opt("b", "10"), opt("c", "25"), opt("d", "20")]},
      hint="Bilangan berapa jika dikalikan dirinya sendiri hasilnya 100?",
      explanation=["Susunan persegi: baris = kolom = n, dan n × n = 100.", "10 × 10 = 100.",
                   "Jadi setiap baris berisi 10 kursi."]),

    # ================= ROYAL TRAINING — LEVEL 1 (Princess Beginner) =================
    q("t1-1", "training-level-1", "mc", "Berapa banyak kotak pada susunan ini?", "a",
      data={"illustration": grid(2), "options": [opt("a", "4"), opt("b", "2"), opt("c", "6"), opt("d", "8")]},
      hint="Ada 2 baris, setiap baris berisi 2 kotak.",
      explanation=["2 baris × 2 kotak = 4 kotak."]),
    q("t1-2", "training-level-1", "number", "Berapa banyak kotak pada susunan ini?", 25,
      data={"illustration": grid(5), "unit": "kotak"},
      hint="Hitung kotak pada satu baris, lalu kalikan dengan banyak baris.",
      explanation=["Ada 5 baris dan 5 kolom.", "5 × 5 = 25 kotak."]),
    q("t1-3", "training-level-1", "tf", "Susunan 2 baris × 4 kolom membentuk persegi.", False,
      data={"illustration": grid(2, 4)},
      hint="Bandingkan banyak baris dan banyak kolomnya.",
      explanation=["Banyak baris (2) tidak sama dengan banyak kolom (4).", "Susunan itu berbentuk persegi panjang, bukan persegi.",
                   "Jadi pernyataan SALAH."]),
    q("t1-4", "training-level-1", "mc", "Manakah susunan yang membentuk persegi?", "a",
      data={"options": [opt("a", "3 × 3", grid(3)), opt("b", "2 × 4", grid(2, 4)),
                        opt("c", "3 × 4", grid(3, 4)), opt("d", "1 × 5", grid(1, 5))]},
      hint="Cari susunan yang banyak baris dan kolomnya sama.",
      explanation=["Hanya 3 × 3 yang baris dan kolomnya sama (3).", "Susunan lain adalah persegi panjang."]),
    q("t1-5", "training-level-1", "tf", "Bilangan 10 adalah bilangan persegi.", False,
      hint="Coba hitung 3 × 3 dan 4 × 4.",
      explanation=["3 × 3 = 9 dan 4 × 4 = 16.", "Tidak ada bilangan bulat yang dikalikan dirinya sendiri menghasilkan 10.",
                   "Jadi 10 BUKAN bilangan persegi."]),
    q("t1-6", "training-level-1", "mc", "Bilangan persegi adalah bilangan yang ...", "a",
      data={"options": [opt("a", "merupakan hasil perkalian suatu bilangan dengan dirinya sendiri"),
                        opt("b", "merupakan hasil penjumlahan dua bilangan sama"),
                        opt("c", "selalu bilangan genap"),
                        opt("d", "selalu kelipatan 4")]},
      hint="Ingat: 9 = 3 × 3, 16 = 4 × 4.",
      explanation=["Bilangan persegi = n × n.", "Contoh: 1 = 1 × 1, 4 = 2 × 2, 9 = 3 × 3.",
                   "9 dan 25 ganjil, jadi tidak selalu genap; 9 juga bukan kelipatan 4."]),
    q("t1-7", "training-level-1", "number", "Susunan bunga berbentuk persegi memiliki 6 baris dan 6 kolom. Berapa banyak bunganya?", 36,
      data={"unit": "bunga"}, hint="Kalikan banyak baris dengan banyak kolom.",
      explanation=["6 × 6 = 36.", "Jadi ada 36 bunga."]),
    q("t1-8", "training-level-1", "mc", "Manakah yang BUKAN bilangan persegi?", "c",
      data={"options": [opt("a", "1"), opt("b", "4"), opt("c", "8"), opt("d", "9")]},
      hint="Periksa: 1 × 1, 2 × 2, 3 × 3.",
      explanation=["1 = 1², 4 = 2², 9 = 3².", "8 terletak di antara 4 dan 9, tidak bisa disusun menjadi persegi.",
                   "Jadi 8 bukan bilangan persegi."]),
    q("t1-9", "training-level-1", "tf", "Susunan 4 × 4 berisi 16 kotak.", True,
      data={"illustration": grid(4)}, hint="Hitung 4 × 4.",
      explanation=["4 × 4 = 16.", "Jadi pernyataan BENAR."]),
    q("t1-10", "training-level-1", "number", "Sebuah susunan persegi memiliki sisi 7 kotak. Berapa banyak kotaknya?", 49,
      data={"unit": "kotak"}, hint="Sisi 7 kotak artinya 7 baris dan 7 kolom.",
      explanation=["7 × 7 = 49.", "Jadi ada 49 kotak."]),

    # ================= ROYAL TRAINING — LEVEL 2 (Royal Explorer) =================
    q("t2-1", "training-level-2", "sequence", "Lengkapi pola berikut.", [9, 25],
      data={"display": [1, 4, None, 16, None]}, difficulty=2,
      hint="1 = 1², 4 = 2², ... lanjutkan.",
      explanation=["Suku ke-3 = 3² = 9.", "Suku ke-5 = 5² = 25."]),
    q("t2-2", "training-level-2", "number", "Berapa selisih antara 16 dan 25?", 9, difficulty=2,
      hint="Hitung 25 − 16.", explanation=["25 − 16 = 9."]),
    q("t2-3", "training-level-2", "number", "36, 49, 64, ...  Bilangan berikutnya adalah?", 81, difficulty=2,
      hint="36 = 6², 49 = 7², 64 = 8². Berikutnya?",
      explanation=["36 = 6², 49 = 7², 64 = 8².", "Berikutnya 9² = 81.", "Cek selisih: 13, 15, lalu 17 → 64 + 17 = 81."]),
    q("t2-4", "training-level-2", "mc", "Selisih antarbilangan pada pola 1, 4, 9, 16, 25 membentuk pola ...", "a",
      data={"options": [opt("a", "bilangan ganjil berurutan: 3, 5, 7, 9"), opt("b", "bilangan genap: 2, 4, 6, 8"),
                        opt("c", "selalu 3"), opt("d", "kelipatan 3: 3, 6, 9, 12")]}, difficulty=2,
      hint="Hitung 4 − 1, 9 − 4, 16 − 9, 25 − 16.",
      explanation=["4 − 1 = 3, 9 − 4 = 5, 16 − 9 = 7, 25 − 16 = 9.", "Selisihnya 3, 5, 7, 9 → bilangan ganjil berurutan."]),
    q("t2-5", "training-level-2", "sequence", "Lengkapi pola berikut.", [36, 64],
      data={"display": [25, None, 49, None, 81]}, difficulty=2,
      hint="25 = 5², 49 = 7², 81 = 9².",
      explanation=["Di antara 5² dan 7² ada 6² = 36.", "Di antara 7² dan 9² ada 8² = 64."]),
    q("t2-6", "training-level-2", "number", "Pada pola 1, 4, 9, 16, selisih berikutnya adalah 9. Berapakah bilangan berikutnya?", 25,
      difficulty=2, hint="Tambahkan selisih ke bilangan terakhir.",
      explanation=["16 + 9 = 25.", "Cocok dengan 5² = 25."]),
    q("t2-7", "training-level-2", "tf", "Selisih dua bilangan persegi yang berurutan selalu bilangan ganjil.", True,
      difficulty=2, hint="Coba beberapa: 4 − 1, 9 − 4, 16 − 9.",
      explanation=["Selisihnya 3, 5, 7, 9, 11, ...", "Semuanya bilangan ganjil.", "Jadi pernyataan BENAR."]),
    q("t2-8", "training-level-2", "number", "81, 100, 121, ...  Bilangan berikutnya adalah?", 144, difficulty=2,
      hint="81 = 9², 100 = 10², 121 = 11².",
      explanation=["Berikutnya 12² = 144.", "Cek selisih: 19, 21, lalu 23 → 121 + 23 = 144."]),
    q("t2-9", "training-level-2", "mc", "Berapa selisih antara 49 dan 64?", "b",
      data={"options": [opt("a", "13"), opt("b", "15"), opt("c", "17"), opt("d", "11")]}, difficulty=2,
      hint="Hitung 64 − 49.", explanation=["64 − 49 = 15."]),
    q("t2-10", "training-level-2", "sequence", "Lengkapi pola berikut.", [16, 36],
      data={"display": [4, 9, None, 25, None, 49]}, difficulty=2,
      hint="4 = 2², 9 = 3², ...",
      explanation=["Setelah 3² = 9 adalah 4² = 16.", "Setelah 5² = 25 adalah 6² = 36."]),

    # ================= ROYAL TRAINING — LEVEL 3 (Royal Expert) =================
    q("t3-1", "training-level-3", "number", "Tentukan U₉ dari pola bilangan persegi.", 81, difficulty=3,
      hint="U₉ = 9².", explanation=["Uₙ = n².", "U₉ = 9 × 9 = 81."]),
    q("t3-2", "training-level-3", "number", "Tentukan U₁₅ dari pola bilangan persegi.", 225, difficulty=3,
      hint="15 × 15 = 15 × 10 + 15 × 5.", explanation=["U₁₅ = 15².", "15 × 15 = 150 + 75 = 225."]),
    q("t3-3", "training-level-3", "number", "Jika Uₙ = 196, berapakah n?", 14, difficulty=3,
      hint="13² = 169 dan 15² = 225. Coba bilangan di antaranya.",
      explanation=["Cari n sehingga n × n = 196.", "14 × 14 = 196.", "Jadi n = 14."]),
    q("t3-4", "training-level-3", "steps", "Lampu hias istana dinyalakan membentuk persegi.", {"a": "persegi", "b": 100},
      data={"context": "Pada hari ke-1 menyala 1 lampu, hari ke-2 menyala 4 lampu, hari ke-3 menyala 9 lampu. "
                       "Pola ini berlanjut. Berapa lampu yang menyala pada hari ke-10?",
            "illustration": pattern(1, 2, 3),
            "parts": [PATTERN_PART, {"id": "b", "type": "number", "prompt": "Banyak lampu pada hari ke-10", "unit": "lampu"}]},
      difficulty=3, hint="Hari ke-n menyala n² lampu.",
      explanation=["1, 4, 9, ... adalah pola bilangan persegi.", "Hari ke-10 → n = 10.", "U₁₀ = 10² = 100 lampu."],
      ask_reason=True, literacy="Mengidentifikasi informasi dan menggunakan rumus"),
    q("t3-5", "training-level-3", "mc", "Rina ingin mengetahui suku ke-20 pola bilangan persegi. Strategi mana yang paling efisien?", "b",
      data={"options": [opt("a", "Menulis semua suku dari ke-1 sampai ke-20"),
                        opt("b", "Menggunakan rumus Uₙ = n², sehingga U₂₀ = 20² = 400"),
                        opt("c", "Menghitung 20 + 20 = 40"),
                        opt("d", "Menghitung 20 × 2 = 40")]},
      difficulty=3, hint="Strategi mana yang langsung, tanpa menulis banyak suku?",
      explanation=["Menulis 20 suku bisa benar, tetapi lama.", "Rumus Uₙ = n² langsung: U₂₀ = 20 × 20 = 400.",
                   "20 + 20 dan 20 × 2 bukan rumus bilangan persegi."], literacy="Menentukan strategi"),
    q("t3-6", "training-level-3", "tf", "U₁₂ = 24", False, difficulty=3,
      hint="n² artinya n × n, bukan n × 2.",
      explanation=["U₁₂ = 12² = 12 × 12 = 144.", "24 adalah 12 × 2 — kesalahan umum!", "Jadi pernyataan SALAH."]),
    q("t3-7", "training-level-3", "steps", "Kursi pesta dansa kerajaan ditata membentuk persegi.", {"a": 13, "b": 169},
      data={"context": "Ada 13 baris kursi, dan susunannya berbentuk persegi.",
            "parts": [{"id": "a", "type": "number", "prompt": "Berapa kursi pada setiap baris?", "unit": "kursi"},
                      {"id": "b", "type": "number", "prompt": "Berapa banyak kursi seluruhnya?", "unit": "kursi"}]},
      difficulty=3, hint="Pada persegi, banyak kursi per baris = banyak baris.",
      explanation=["Persegi → baris = kolom, jadi tiap baris 13 kursi.", "Total = 13 × 13 = 169 kursi."],
      ask_reason=True, literacy="Memahami hubungan susunan dan bilangan"),
    q("t3-8", "training-level-3", "number", "Berapakah selisih U₁₁ dan U₁₀?", 21, difficulty=3,
      hint="Hitung dulu U₁₁ dan U₁₀.",
      explanation=["U₁₁ = 121, U₁₀ = 100.", "121 − 100 = 21."]),
    q("t3-9", "training-level-3", "mc", "Sebuah taman memiliki 50 tanaman. Bisakah SEMUA tanaman disusun membentuk persegi tanpa sisa?", "a",
      data={"options": [opt("a", "Tidak, karena 7² = 49 dan 8² = 64, sehingga 50 bukan bilangan persegi"),
                        opt("b", "Ya, disusun 5 × 10"), opt("c", "Ya, disusun 25 × 2"), opt("d", "Ya, karena 50 bilangan genap")]},
      difficulty=3, hint="Persegi harus n × n dengan baris = kolom.",
      explanation=["5 × 10 dan 25 × 2 adalah persegi panjang.", "7² = 49 dan 8² = 64; tidak ada n dengan n² = 50.",
                   "Jadi tidak bisa — akan bersisa 1 tanaman jika memakai 7 × 7."], literacy="Menafsirkan hasil"),
    q("t3-10", "training-level-3", "number", "Lantai persegi tersusun dari ubin dengan 20 ubin pada satu sisi. Berapa ubin seluruhnya?", 400,
      data={"unit": "ubin"}, difficulty=3, hint="20 × 20.",
      explanation=["Sisi 20 → 20 baris × 20 kolom.", "20² = 400 ubin."]),

    # ================= THE ROYAL FINAL QUEST =================
    q("f-1", "final", "mc", "Berapa banyak kotak pada susunan ini?", "c",
      data={"illustration": grid(4), "options": [opt("a", "8"), opt("b", "12"), opt("c", "16"), opt("d", "20")]},
      explanation=["4 baris × 4 kolom = 16 kotak."]),
    q("f-2", "final", "tf", "Bilangan 36 adalah bilangan persegi.", True,
      explanation=["6 × 6 = 36, jadi 36 bilangan persegi."]),
    q("f-3", "final", "sequence", "Lengkapi pola bilangan persegi berikut.", [16, 36],
      data={"display": [1, 4, 9, None, 25, None]}, difficulty=2,
      explanation=["Suku ke-4 = 4² = 16.", "Suku ke-6 = 6² = 36."]),
    q("f-4", "final", "number", "Berapa selisih antara 36 dan 49?", 13, difficulty=2,
      explanation=["49 − 36 = 13."]),
    q("f-5", "final", "number", "49, 64, ...  Bilangan berikutnya adalah?", 81, difficulty=2,
      explanation=["49 = 7², 64 = 8², berikutnya 9² = 81."]),
    q("f-6", "final", "number", "Tentukan U₁₁.", 121, difficulty=2,
      explanation=["U₁₁ = 11² = 121."]),
    q("f-7", "final", "number", "Jika Uₙ = 225, berapakah n?", 15, difficulty=3,
      explanation=["15 × 15 = 225, jadi n = 15."]),
    q("f-8", "final", "mc", "Manakah susunan yang membentuk persegi?", "d",
      data={"options": [opt("a", "4 × 5", grid(4, 5)), opt("b", "2 × 5", grid(2, 5)),
                        opt("c", "3 × 6", grid(3, 6)), opt("d", "5 × 5", grid(5))]},
      explanation=["Hanya 5 × 5 yang baris dan kolomnya sama."]),
    q("f-9", "final", "steps", "Tanaman di taman kerajaan disusun membentuk persegi.", {"a": "persegi", "b": 6, "c": 36},
      data={"context": "Pada susunan pertama terdapat 1 tanaman, susunan kedua 4 tanaman, dan susunan ketiga 9 tanaman. "
                       "Tentukan banyak tanaman pada susunan ke-6.",
            "illustration": pattern(1, 2, 3),
            "parts": [PATTERN_PART,
                      {"id": "b", "type": "number", "prompt": "Nilai n yang digunakan"},
                      {"id": "c", "type": "number", "prompt": "Banyak tanaman pada susunan ke-6", "unit": "tanaman"}]},
      difficulty=3, ask_reason=True,
      explanation=["1, 4, 9 → pola bilangan persegi.", "Susunan ke-6 → n = 6.", "U₆ = 6² = 36.",
                   "Jadi banyak tanaman pada susunan ke-6 adalah 36 tanaman."],
      literacy="Mengidentifikasi informasi, menggunakan rumus, menafsirkan hasil"),
    q("f-10", "final", "mc", "Rumus suku ke-n pola bilangan persegi adalah ...", "a",
      data={"options": [opt("a", "Uₙ = n²"), opt("b", "Uₙ = 2n"), opt("c", "Uₙ = n + 2"), opt("d", "Uₙ = n² + 1")]},
      explanation=["Susunan ke-n memiliki n baris dan n kolom → n × n = n²."]),
    q("f-11", "final", "tf", "Selisih U₅ dan U₄ adalah 9.", True, difficulty=2,
      explanation=["U₅ = 25, U₄ = 16.", "25 − 16 = 9, jadi BENAR."]),
    q("f-12", "final", "number", "Lantai istana berbentuk persegi dengan 18 ubin pada setiap sisi. Berapa banyak ubinnya?", 324,
      data={"unit": "ubin"}, difficulty=3,
      explanation=["18² = 18 × 18 = 324 ubin."]),
    q("f-13", "final", "mc", "Sebanyak 144 kursi disusun membentuk persegi. Ada berapa kursi pada setiap baris?", "c",
      data={"options": [opt("a", "72"), opt("b", "14"), opt("c", "12"), opt("d", "24")]}, difficulty=3,
      explanation=["Cari n dengan n × n = 144.", "12 × 12 = 144, jadi tiap baris 12 kursi."]),
    q("f-14", "final", "steps", "Lampu taman menyala membentuk persegi.", {"a": "persegi", "b": 144},
      data={"context": "Malam ke-1 menyala 1 lampu, malam ke-2 menyala 4 lampu, malam ke-3 menyala 9 lampu. "
                       "Berapa lampu yang menyala pada malam ke-12?",
            "parts": [PATTERN_PART, {"id": "b", "type": "number", "prompt": "Banyak lampu pada malam ke-12", "unit": "lampu"}]},
      difficulty=3, ask_reason=True,
      explanation=["Pola 1, 4, 9 → bilangan persegi.", "U₁₂ = 12² = 144 lampu."]),
    q("f-15", "final", "mc", "Bilangan persegi manakah yang terletak di antara 50 dan 100?", "a",
      data={"options": [opt("a", "64 dan 81"), opt("b", "60 dan 80"), opt("c", "49 dan 100"), opt("d", "56 dan 72")]},
      difficulty=2,
      explanation=["8² = 64 dan 9² = 81 berada di antara 50 dan 100.", "49 dan 100 tidak berada DI ANTARA 50 dan 100."]),
    q("f-16", "final", "number", "Tentukan U₂₅.", 625, difficulty=3,
      explanation=["U₂₅ = 25² = 25 × 25 = 625."]),
]

# Posisi berurutan di setiap kuis
_counter = {}
for _q in QUESTIONS:
    _counter[_q["quiz_id"]] = _counter.get(_q["quiz_id"], 0) + 1
    _q["position"] = _counter[_q["quiz_id"]]
