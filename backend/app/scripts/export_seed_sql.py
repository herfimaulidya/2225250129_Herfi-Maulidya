"""Menghasilkan supabase/seed.sql dari katalog konten.

Jalankan dari folder backend:  python -m app.scripts.export_seed_sql
"""

import json
from pathlib import Path

from ..content.catalog import ACHIEVEMENTS, GAMES, LESSONS, QUIZZES
from ..content.questions import QUESTIONS

OUT = Path(__file__).resolve().parents[3] / "supabase" / "seed.sql"


def lit(v):
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def jlit(v):
    return lit(json.dumps(v, ensure_ascii=False)) + "::jsonb"


def upsert(table, rows, cols, json_cols=(), key="id"):
    lines = []
    for r in rows:
        vals = ", ".join(jlit(r[c]) if c in json_cols else lit(r.get(c)) for c in cols)
        lines.append(f"  ({vals})")
    updates = ", ".join(f"{c} = excluded.{c}" for c in cols if c != key)
    return (f"insert into public.{table} ({', '.join(cols)}) values\n" + ",\n".join(lines)
            + f"\non conflict ({key}) do update set {updates};\n")


def build() -> str:
    parts = ["-- ROYAL ADVENTURE seed data (dihasilkan otomatis oleh app/scripts/export_seed_sql.py)\n",
             "-- Jalankan setelah 0001_schema.sql dan 0002_rls.sql.\n\n"]
    parts.append(upsert("lessons", LESSONS, ["id", "level_no", "region_name", "title", "topic", "xp_reward"]))
    parts.append(upsert("quizzes", QUIZZES, ["id", "kind", "title", "lesson_id", "level_no", "question_count",
                                             "time_limit_seconds", "pass_score"]))
    parts.append(upsert("quiz_questions", QUESTIONS,
                        ["id", "quiz_id", "position", "qtype", "difficulty", "prompt", "data", "answer", "hint",
                         "explanation", "ask_reason", "literacy_focus", "points"],
                        json_cols=("data", "answer", "explanation")))
    parts.append(upsert("games", GAMES, ["id", "title", "mechanic", "description", "rounds", "xp_max"]))
    parts.append(upsert("achievements", ACHIEVEMENTS,
                        ["id", "title", "description", "requirement", "icon", "xp_bonus", "sort_order"]))
    return "\n".join(parts)


if __name__ == "__main__":
    OUT.write_text(build(), encoding="utf-8")
    print(f"Ditulis: {OUT}")
