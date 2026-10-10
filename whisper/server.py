"""Petit service de transcription : faster-whisper derrière une API de jobs.

POST /jobs  (file, language?, prompt?)  -> {"id": ...}
GET  /jobs/{id}                         -> statut, progression, segments
"""

import os
import tempfile
import threading
import time
import uuid

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from faster_whisper import WhisperModel

MODEL_NAME = os.getenv("WHISPER_MODEL", "small")
CPU_THREADS = int(os.getenv("WHISPER_THREADS", "0"))  # 0 = auto

app = FastAPI()

_model: WhisperModel | None = None
_model_lock = threading.Lock()
# Une seule transcription à la fois : le CPU est le facteur limitant.
_run_lock = threading.Lock()
_jobs: dict[str, dict] = {}


def get_model() -> WhisperModel:
    global _model
    with _model_lock:
        if _model is None:
            _model = WhisperModel(
                MODEL_NAME, device="cpu", compute_type="int8", cpu_threads=CPU_THREADS
            )
        return _model


def run_job(job_id: str, path: str, language: str | None, prompt: str | None) -> None:
    job = _jobs[job_id]
    try:
        with _run_lock:
            job["status"] = "running"
            started = time.time()
            model = get_model()
            segments, info = model.transcribe(
                path,
                language=language,
                initial_prompt=prompt or None,
                vad_filter=True,
                beam_size=5,
            )
            job["language"] = info.language
            job["duration"] = info.duration
            out = []
            for seg in segments:
                out.append(
                    {"start": round(seg.start, 2), "end": round(seg.end, 2), "text": seg.text.strip()}
                )
                job["segments"] = out
                if info.duration:
                    job["progress"] = min(1.0, seg.end / info.duration)
            job["progress"] = 1.0
            job["elapsed"] = round(time.time() - started, 1)
            job["status"] = "done"
    except Exception as e:  # noqa: BLE001 - on remonte l'erreur au client
        job["status"] = "error"
        job["error"] = str(e)
    finally:
        try:
            os.remove(path)
        except OSError:
            pass


@app.get("/health")
def health():
    return {"ok": True, "model": MODEL_NAME}


@app.post("/jobs")
async def create_job(
    file: UploadFile = File(...),
    language: str | None = Form(None),
    prompt: str | None = Form(None),
):
    suffix = os.path.splitext(file.filename or "")[1] or ".audio"
    fd, path = tempfile.mkstemp(suffix=suffix)
    with os.fdopen(fd, "wb") as out:
        while chunk := await file.read(1024 * 1024):
            out.write(chunk)

    lang = None if language in (None, "", "auto") else language
    job_id = uuid.uuid4().hex
    _jobs[job_id] = {
        "id": job_id,
        "status": "queued",
        "progress": 0.0,
        "model": MODEL_NAME,
        "segments": [],
    }
    threading.Thread(target=run_job, args=(job_id, path, lang, prompt), daemon=True).start()
    return {"id": job_id}


@app.get("/jobs/{job_id}")
def get_job(job_id: str):
    job = _jobs.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job introuvable")
    # Les segments ne sont renvoyés qu'à la fin, pour garder les réponses légères.
    if job["status"] != "done":
        return {k: v for k, v in job.items() if k != "segments"}
    return job
