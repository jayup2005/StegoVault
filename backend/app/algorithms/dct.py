from __future__ import annotations

import io

import numpy as np
from PIL import Image
from scipy.fftpack import dct, idct


MID_FREQS = [(2, 3), (3, 2), (3, 4), (4, 3), (2, 4), (4, 2)]


def _dct2(block: np.ndarray) -> np.ndarray:
    return dct(dct(block.T, norm="ortho").T, norm="ortho")


def _idct2(block: np.ndarray) -> np.ndarray:
    return idct(idct(block.T, norm="ortho").T, norm="ortho")


def _to_bits(data: bytes) -> np.ndarray:
    return np.unpackbits(np.frombuffer(data, dtype=np.uint8))


def _to_bytes(bits: np.ndarray) -> bytes:
    return np.packbits(bits.astype(np.uint8)).tobytes()


def encode_jpeg(image_bytes: bytes, message: bytes) -> bytes:
    image = Image.open(io.BytesIO(image_bytes)).convert("YCbCr")
    y, cb, cr = image.split()
    y_arr = np.array(y, dtype=np.float32)

    h, w = y_arr.shape
    h8, w8 = h - h % 8, w - w % 8
    work = y_arr[:h8, :w8].copy()

    bits = _to_bits(len(message).to_bytes(4, "big") + message)
    capacity = (h8 // 8) * (w8 // 8)
    if bits.size > capacity:
        raise ValueError("Message exceeds DCT capacity")

    bit_idx = 0
    for r in range(0, h8, 8):
        for c in range(0, w8, 8):
            if bit_idx >= bits.size:
                break
            block = work[r : r + 8, c : c + 8] - 128.0
            coeffs = _dct2(block)
            i, j = MID_FREQS[(r // 8 + c // 8) % len(MID_FREQS)]
            coeffs[i, j] = 42.0 if bits[bit_idx] == 1 else -42.0
            work[r : r + 8, c : c + 8] = _idct2(coeffs) + 128.0
            bit_idx += 1
        if bit_idx >= bits.size:
            break

    y_arr[:h8, :w8] = np.clip(work, 0, 255)
    out_image = Image.merge(
        "YCbCr",
        (
            Image.fromarray(y_arr.astype(np.uint8), mode="L"),
            cb,
            cr,
        ),
    ).convert("RGB")

    out = io.BytesIO()
    out_image.save(out, format="PNG")
    return out.getvalue()


def decode_jpeg(image_bytes: bytes) -> bytes:
    image = Image.open(io.BytesIO(image_bytes)).convert("L")
    y_arr = np.array(image, dtype=np.float32)

    h, w = y_arr.shape
    h8, w8 = h - h % 8, w - w % 8

    bits: list[int] = []
    for r in range(0, h8, 8):
        for c in range(0, w8, 8):
            block = y_arr[r : r + 8, c : c + 8] - 128.0
            coeffs = _dct2(block)
            i, j = MID_FREQS[(r // 8 + c // 8) % len(MID_FREQS)]
            bits.append(1 if coeffs[i, j] >= 0 else 0)

    arr = np.array(bits, dtype=np.uint8)
    msg_len = int.from_bytes(_to_bytes(arr[:32]), "big")
    payload_bits = arr[32 : 32 + msg_len * 8]
    return _to_bytes(payload_bits)
