from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

from app.algorithms.registry import capacity_for_file, encode_payload, normalize_algorithm
from app.utils.crypto import encrypt


router = APIRouter(prefix="/api", tags=["encode"])


@router.post("/encode/capacity")
async def encode_capacity(
    file: UploadFile = File(...),
    algorithm: str = Form(...),
):
    raw = await file.read()
    try:
        result = capacity_for_file(raw, algorithm)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return result


@router.post("/encode")
async def encode_file(
    file: UploadFile = File(...),
    message: str = Form(...),
    algorithm: str = Form(...),
    password: str | None = Form(default=None),
):
    algorithm = normalize_algorithm(algorithm)
    raw = await file.read()

    if not message:
        raise HTTPException(status_code=400, detail="message is required")

    payload = message.encode("utf-8")
    if password:
        payload = encrypt(payload, password)

    try:
        out_bytes, media_type = encode_payload(raw, payload, algorithm)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Encoding failed: {exc}") from exc

    timestamp = datetime.now(timezone.utc).isoformat()
    return Response(
        content=out_bytes,
        media_type=media_type,
        headers={
            "X-Stego-Algorithm": algorithm,
            "X-Stego-Payload-Bytes": str(len(payload)),
            "X-Stego-Encrypted": "true" if password else "false",
            "X-Stego-Timestamp": timestamp,
            "Content-Disposition": 'attachment; filename="stego_output.png"',
        },
    )
