"""Pemeriksaan jawaban untuk semua tipe soal. Seluruh penilaian dilakukan di server."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

MAX_ABS_NUMBER = 10_000_000


class InvalidAnswer(ValueError):
    """Format jawaban tidak valid (bukan salah, tapi tidak bisa dinilai)."""


def to_int(value: Any) -> int:
    if isinstance(value, bool):
        raise InvalidAnswer("Jawaban harus berupa bilangan bulat.")
    if isinstance(value, int):
        n = value
    elif isinstance(value, float):
        if not value.is_integer():
            raise InvalidAnswer("Jawaban harus berupa bilangan bulat, bukan desimal.")
        n = int(value)
    elif isinstance(value, str):
        s = value.strip().replace(" ", "")
        if s == "":
            raise InvalidAnswer("Jawaban belum diisi.")
        if re.fullmatch(r"-?\d+[.,]\d+", s):
            raise InvalidAnswer("Jawaban harus berupa bilangan bulat, bukan desimal.")
        if not re.fullmatch(r"-?\d+", s):
            raise InvalidAnswer("Jawaban harus berupa angka.")
        n = int(s)
    else:
        raise InvalidAnswer("Jawaban harus berupa angka.")
    if abs(n) > MAX_ABS_NUMBER:
        raise InvalidAnswer("Angka terlalu besar.")
    return n


def to_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str) and value.lower() in ("true", "false", "benar", "salah"):
        return value.lower() in ("true", "benar")
    raise InvalidAnswer("Pilih Benar atau Salah.")


def to_option(value: Any, options: list[dict]) -> str:
    ids = {o["id"] for o in options}
    if not isinstance(value, str) or value not in ids:
        raise InvalidAnswer("Pilih salah satu jawaban yang tersedia.")
    return value


@dataclass
class CheckResult:
    correct: bool
    fraction: float  # 0..1 (untuk soal berbagian / rumpang)
    parts: Any = None  # detail per bagian (list/dict of bool)
    normalized: Any = None  # jawaban yang sudah dinormalisasi
    extra: dict = field(default_factory=dict)


def normalize(item: dict, response: Any) -> Any:
    """Validasi & normalisasi jawaban tanpa menilai. Raise InvalidAnswer bila tidak valid."""
    t = item["type"]
    data = item.get("data", {})
    if t == "mc":
        return to_option(response, data.get("options", []))
    if t == "tf":
        return to_bool(response)
    if t == "number":
        return to_int(response)
    if t == "sequence":
        blanks = sum(1 for v in data["display"] if v is None)
        if not isinstance(response, list) or len(response) != blanks:
            raise InvalidAnswer(f"Isi semua {blanks} kotak yang kosong.")
        return [to_int(v) for v in response]
    if t == "multi_select":
        if not isinstance(response, list) or not response:
            raise InvalidAnswer("Pilih minimal satu susunan.")
        ids = {o["id"] for o in data["options"]}
        chosen = []
        for v in response:
            if v not in ids:
                raise InvalidAnswer("Pilihan tidak dikenal.")
            if v not in chosen:
                chosen.append(v)
        return chosen
    if t == "steps":
        if not isinstance(response, dict):
            raise InvalidAnswer("Jawab setiap bagian soal.")
        out = {}
        for part in data["parts"]:
            if part["id"] not in response:
                raise InvalidAnswer("Jawab setiap bagian soal.")
            out[part["id"]] = normalize({"type": part["type"], "data": part}, response[part["id"]])
        return out
    raise InvalidAnswer("Tipe soal tidak dikenal.")


def check(item: dict, response: Any) -> CheckResult:
    value = normalize(item, response)
    t = item["type"]
    answer = item["answer"]
    if t in ("mc", "number"):
        ok = value == answer
        return CheckResult(ok, 1.0 if ok else 0.0, normalized=value)
    if t == "tf":
        ok = value is bool(answer)
        return CheckResult(ok, 1.0 if ok else 0.0, normalized=value)
    if t == "sequence":
        parts = [a == b for a, b in zip(value, answer)]
        frac = sum(parts) / len(parts)
        return CheckResult(all(parts), frac, parts=parts, normalized=value)
    if t == "multi_select":
        correct_set = set(answer)
        chosen = set(value)
        missed = sorted(correct_set - chosen)
        wrong = sorted(chosen - correct_set)
        ok = not missed and not wrong
        hits = len(correct_set & chosen)
        frac = max(0.0, (hits - len(wrong)) / len(correct_set))
        return CheckResult(ok, frac, parts={"missed": missed, "wrong": wrong}, normalized=value)
    if t == "steps":
        parts = {}
        for part in item["data"]["parts"]:
            pid = part["id"]
            parts[pid] = value[pid] == (bool(answer[pid]) if part["type"] == "tf" else answer[pid])
        frac = sum(parts.values()) / len(parts)
        return CheckResult(all(parts.values()), frac, parts=parts, normalized=value)
    raise InvalidAnswer("Tipe soal tidak dikenal.")


ATTEMPT_FACTOR = {1: 1.0, 2: 0.6, 3: 0.4}


def item_score(points: float, fraction: float, attempts: int, hints: int) -> float:
    """Skor satu soal: penuh bila benar di percobaan pertama tanpa petunjuk."""
    if attempts <= 0 or fraction <= 0:
        return 0.0
    factor = ATTEMPT_FACTOR.get(attempts, 0.4)
    hint_factor = max(0.5, 1 - 0.25 * hints)
    return round(points * fraction * factor * hint_factor, 1)


def stars_for(percent: float) -> int:
    if percent >= 100:
        return 3
    if percent >= 80:
        return 2
    if percent >= 50:
        return 1
    return 0
