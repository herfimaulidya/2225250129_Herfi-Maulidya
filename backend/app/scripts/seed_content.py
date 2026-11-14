"""Mengunggah katalog konten (materi, kuis, bank soal, permainan, lencana) ke Supabase.

Jalankan dari folder backend:  python -m app.scripts.seed_content
Alternatif: jalankan supabase/seed.sql di SQL Editor Supabase.
"""

from ..config import get_settings
from ..content.catalog import ACHIEVEMENTS, GAMES, LESSONS, QUIZZES
from ..content.questions import QUESTIONS
from ..store import SupabaseStore


def main():
    store = SupabaseStore(get_settings())
    for table, rows in (("lessons", LESSONS), ("quizzes", QUIZZES), ("quiz_questions", QUESTIONS),
                        ("games", GAMES), ("achievements", ACHIEVEMENTS)):
        store._req("POST", table, params={"on_conflict": "id"}, json=rows,
                   prefer="resolution=merge-duplicates,return=minimal")
        print(f"✓ {table}: {len(rows)} baris")


if __name__ == "__main__":
    main()
