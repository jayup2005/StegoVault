from __future__ import annotations

import io
import wave

import numpy as np
from PIL import Image

from app.algorithms import audio, dct, lsb, pvd


def _png_bytes(size: int = 256) -> bytes:
    arr = np.random.randint(0, 255, (size, size, 3), dtype=np.uint8)
    im = Image.fromarray(arr, mode="RGB")
    out = io.BytesIO()
    im.save(out, format="PNG")
    return out.getvalue()


def _jpeg_bytes(size: int = 256) -> bytes:
    arr = np.random.randint(0, 255, (size, size, 3), dtype=np.uint8)
    im = Image.fromarray(arr, mode="RGB")
    out = io.BytesIO()
    im.save(out, format="JPEG", quality=100, subsampling=0)
    return out.getvalue()


def _wav_bytes(seconds: float = 2.0, rate: int = 44100) -> bytes:
    t = np.linspace(0, seconds, int(rate * seconds), endpoint=False)
    tone = (0.4 * np.sin(2 * np.pi * 440 * t) * 32767).astype(np.int16)
    out = io.BytesIO()
    with wave.open(out, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(rate)
        wf.writeframes(tone.tobytes())
    return out.getvalue()


def test_lsb_roundtrip() -> None:
    msg = "secret-lsb"
    cover = _png_bytes()
    stego = lsb.encode_image(cover, msg.encode(), mode=2)
    decoded = lsb.decode_image(stego, mode=2).decode()
    assert decoded == msg


def test_dct_roundtrip() -> None:
    msg = "secret-dct"
    cover = _jpeg_bytes()
    stego = dct.encode_jpeg(cover, msg.encode())
    decoded = dct.decode_jpeg(stego).decode()
    assert decoded == msg


def test_pvd_roundtrip() -> None:
    msg = "secret-pvd"
    cover = _png_bytes()
    stego = pvd.encode_image(cover, msg.encode())
    decoded = pvd.decode_image(stego).decode()
    assert decoded == msg


def test_audio_roundtrip() -> None:
    msg = "secret-audio"
    cover = _wav_bytes()
    stego = audio.encode_wav(cover, msg.encode())
    decoded = audio.decode_wav(stego).decode()
    assert decoded == msg
