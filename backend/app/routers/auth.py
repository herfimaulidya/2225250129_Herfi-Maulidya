from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from ..auth_gateway import AuthError, AuthGateway, is_valid_code_format, normalize_code
from ..deps import client_ip, get_current_user, get_gateway, get_store, login_limiter
from ..store import Store

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginBody(BaseModel):
    student_code: str = Field(..., max_length=40)


@router.post("/login")
def login(body: LoginBody, request: Request, store: Store = Depends(get_store),
          gateway: AuthGateway = Depends(get_gateway)):
    login_limiter.check(client_ip(request))
    code = normalize_code(body.student_code)
    if not code:
        raise HTTPException(422, "Kode siswa belum diisi.")
    if not is_valid_code_format(code):
        raise HTTPException(422, "Format kode tidak valid. Gunakan 4–20 huruf/angka (boleh tanda -).")
    profile = store.get_profile_by_code(code)
    if not profile:
        raise HTTPException(401, "Kode siswa tidak terdaftar. Periksa kembali kodemu atau tanyakan pada guru.")
    try:
        session = gateway.sign_in(code)
    except AuthError as exc:
        raise HTTPException(exc.status, str(exc)) from exc
    if session.get("user", {}).get("id") != profile["id"]:
        raise HTTPException(409, "Data akun tidak sinkron. Hubungi guru.")
    store.insert_activity({"user_id": profile["id"], "activity_type": "login", "title": "Masuk ke Enchanted Kingdom",
                           "status": "completed"})
    return {
        "access_token": session["access_token"],
        "refresh_token": session["refresh_token"],
        "expires_in": session.get("expires_in"),
        "profile": {k: profile[k] for k in ("id", "student_code", "full_name", "class_name")},
    }


@router.get("/me")
def me(profile: dict = Depends(get_current_user)):
    return {k: profile[k] for k in ("id", "student_code", "full_name", "class_name")}
