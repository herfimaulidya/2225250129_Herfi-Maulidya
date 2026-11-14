"""Mendaftarkan siswa dari file CSV (kolom: student_code,full_name,class_name).

Jalankan dari folder backend:  python -m app.scripts.create_students students.example.csv
"""

import csv
import sys

from fastapi import HTTPException

from ..config import get_settings
from ..auth_gateway import SupabaseAuthGateway
from ..routers.admin import StudentBody, create_student
from ..store import SupabaseStore


def main(path: str):
    settings = get_settings()
    store, gateway = SupabaseStore(settings), SupabaseAuthGateway(settings)
    with open(path, newline="", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            body = StudentBody(student_code=row["student_code"], full_name=row["full_name"],
                               class_name=row.get("class_name") or None)
            try:
                create_student(store, gateway, body)
                print(f"✓ {body.student_code} — {body.full_name}")
            except HTTPException as exc:
                print(f"• {body.student_code}: {exc.detail}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("Pemakaian: python -m app.scripts.create_students <file.csv>")
    main(sys.argv[1])
