"""Endpoint aktivitas belajar: sesi soal/permainan dan penyelesaian misi."""

from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..content.catalog import LEVELS
from ..deps import get_current_user, get_engine
from ..engine import Engine, EngineError

router = APIRouter(prefix="/api", tags=["activities"])


def _run(fn, *args):
    try:
        return fn(*args)
    except EngineError as exc:
        raise HTTPException(exc.status, exc.message) from exc


class StartBody(BaseModel):
    kind: Literal["lesson", "training", "game", "final"]
    ref_id: str = Field(..., max_length=60)
    difficulty: Literal["mudah", "sedang", "sulit"] | None = None
    timed: bool = True


class AnswerBody(BaseModel):
    index: int = Field(..., ge=0, le=100)
    answer: Any
    reason: str | None = Field(default=None, max_length=500)


class HintBody(BaseModel):
    index: int = Field(..., ge=0, le=100)


@router.post("/sessions")
def start_session(body: StartBody, user: dict = Depends(get_current_user), engine: Engine = Depends(get_engine)):
    return _run(engine.start, user["id"], body.kind, body.ref_id,
                {"difficulty": body.difficulty, "timed": body.timed})


@router.get("/sessions/{session_id}")
def get_session(session_id: str, user: dict = Depends(get_current_user), engine: Engine = Depends(get_engine)):
    return _run(engine.get, user["id"], session_id)


@router.post("/sessions/{session_id}/answer")
def answer(session_id: str, body: AnswerBody, user: dict = Depends(get_current_user),
           engine: Engine = Depends(get_engine)):
    return _run(engine.answer, user["id"], session_id, body.index, body.answer, body.reason)


@router.post("/sessions/{session_id}/hint")
def hint(session_id: str, body: HintBody, user: dict = Depends(get_current_user),
         engine: Engine = Depends(get_engine)):
    return _run(engine.hint, user["id"], session_id, body.index)


@router.post("/sessions/{session_id}/finish")
def finish(session_id: str, user: dict = Depends(get_current_user), engine: Engine = Depends(get_engine)):
    return _run(engine.finish, user["id"], session_id)


@router.post("/lessons/{lesson_id}/complete")
def complete_lesson(lesson_id: str, user: dict = Depends(get_current_user), engine: Engine = Depends(get_engine)):
    return _run(engine.complete_lesson, user["id"], lesson_id)


@router.get("/levels")
def levels():
    return LEVELS
