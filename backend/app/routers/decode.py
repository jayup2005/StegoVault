from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.algorithms.registry import decode_payload, normalize_algorithm
from app.utils.crypto import decrypt


router = APIRouter(prefix="/api", tags=["decode"])


@router.post("/decode")
async def decode_file(
    file: UploadFile = File(...),
    algorithm: str = Form(...),
    password: str | None = Form(default=None),
):
    algorithm = normalize_algorithm(algorithm)
    raw = await file.read()

    try:
        payload = decode_payload(raw, algorithm)

        if password:
            payload = decrypt(payload, password)

        message = payload.decode("utf-8")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Decoding failed: {exc}") from exc

    return {"success": True, "algorithm": algorithm, "message": message}
