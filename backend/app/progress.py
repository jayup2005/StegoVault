from __future__ import annotations

import asyncio
from collections import defaultdict
from typing import Any

from fastapi import WebSocket


class ProgressHub:
    def __init__(self) -> None:
        self._sockets: dict[str, set[WebSocket]] = defaultdict(set)
        self._latest: dict[str, dict[str, Any]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, job_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._sockets[job_id].add(websocket)
            latest = self._latest.get(job_id)
        if latest is not None:
            await websocket.send_json(latest)

    async def disconnect(self, job_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            sockets = self._sockets.get(job_id)
            if not sockets:
                return
            sockets.discard(websocket)
            if not sockets:
                self._sockets.pop(job_id, None)

    async def publish(self, job_id: str, progress: int, message: str) -> None:
        payload = {"job_id": job_id, "progress": progress, "message": message}
        async with self._lock:
            self._latest[job_id] = payload
            sockets = list(self._sockets.get(job_id, set()))
        for ws in sockets:
            try:
                await ws.send_json(payload)
            except Exception:
                await self.disconnect(job_id, ws)


progress_hub = ProgressHub()
