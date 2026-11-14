"""ROYAL ADVENTURE — FastAPI backend.

Jalankan:  uvicorn app.main:app --reload --port 8000
"""

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings
from .routers import activities, admin, auth
from .store import StoreError

log = logging.getLogger("royal_adventure")

app = FastAPI(title="ROYAL ADVENTURE API", version="1.0.0",
              description="Backend pembelajaran pola bilangan persegi — Enchanted Kingdom.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(get_settings().cors_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "X-Admin-Key"],
)


@app.exception_handler(StoreError)
async def store_error_handler(_: Request, exc: StoreError):
    log.error("Store error: %s", exc)
    return JSONResponse(status_code=502, content={"detail": "Database sedang bermasalah. Coba beberapa saat lagi."})


@app.get("/api/health")
def health():
    s = get_settings()
    return {"status": "ok", "app": "ROYAL ADVENTURE",
            "supabase_configured": bool(s.supabase_url and s.supabase_service_role_key)}


app.include_router(auth.router)
app.include_router(activities.router)
app.include_router(admin.router)
