from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.progress import progress_hub
from app.routers.analyze import router as analyze_router
from app.routers.decode import router as decode_router
from app.routers.encode import router as encode_router


import os

app = FastAPI(title="StegLab API", version="1.0.0")

# Support multiple origins from an environment variable for deployment
# Set ALLOWED_ORIGINS to '*' for unrestricted access during testing
raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(encode_router)
app.include_router(decode_router)
app.include_router(analyze_router)

DOWNLOADS = Path("/tmp/steg_outputs")
DOWNLOADS.mkdir(parents=True, exist_ok=True)
app.mount("/downloads", StaticFiles(directory=str(DOWNLOADS)), name="downloads")


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.websocket("/ws/progress/{job_id}")
async def progress_socket(websocket: WebSocket, job_id: str) -> None:
    await progress_hub.connect(job_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await progress_hub.disconnect(job_id, websocket)
