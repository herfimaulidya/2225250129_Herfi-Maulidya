"""Pengelolaan kode siswa oleh guru (dilindungi ADMIN_API_KEY)."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..auth_gateway import AuthError, AuthGateway, is_valid_code_format, normalize_code
from ..deps import get_gateway, get_store, require_admin
from ..store import Store, StoreError

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])


class StudentBody(BaseModel):
    student_code: str = Field(..., max_length=40)
    full_name: str = Field(..., min_length=1, max_length=80)
    class_name: str | None = Field(default=None, max_length=30)


@router.get("/students")
def list_students(store: Store = Depends(get_store)):
    return [{k: p.get(k) for k in ("id", "student_code", "full_name", "class_name", "created_at")}
            for p in store.list_profiles()]


def create_student(store: Store, gateway: AuthGateway, body: StudentBody) -> dict:
    code = normalize_code(body.student_code)
    if not is_valid_code_format(code):
        raise HTTPException(422, "Kode harus 4–20 karakter: huruf, angka, atau tanda -.")
    if store.get_profile_by_code(code):
        raise HTTPException(409, f"Kode {code} sudah terdaftar.")
    try:
        user_id = gateway.create_student_user(code, body.full_name.strip())
    except AuthError as exc:
        raise HTTPException(exc.status, str(exc)) from exc
    try:
        profile = store.insert_profile({"id": user_id, "student_code": code, "full_name": body.full_name.strip(),
                                        "class_name": (body.class_name or "").strip() or None})
        store.upsert_stats({"user_id": user_id})
    except StoreError as exc:
        gateway.delete_user(user_id)
        raise HTTPException(500, f"Gagal menyimpan profil: {exc}") from exc
    return profile


@router.post("/students", status_code=201)
def add_student(body: StudentBody, store: Store = Depends(get_store), gateway: AuthGateway = Depends(get_gateway)):
    return create_student(store, gateway, body)


@router.delete("/students/{user_id}", status_code=204)
def remove_student(user_id: str, store: Store = Depends(get_store), gateway: AuthGateway = Depends(get_gateway)):
    if not store.get_profile(user_id):
        raise HTTPException(404, "Siswa tidak ditemukan.")
    gateway.delete_user(user_id)  # menghapus auth user -> profil & data ikut terhapus (cascade)
    store.delete_profile(user_id)
