"""Entry point Vercel (Python serverless) untuk backend FastAPI ROYAL ADVENTURE.

Vercel menjalankan file ini untuk semua request /api/*; aplikasinya sendiri ada di backend/app.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.main import app  # noqa: E402,F401
