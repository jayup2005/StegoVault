from __future__ import annotations

import io

import numpy as np
from PIL import Image


RANGES = [
    (0, 7, 3),
    (8, 15, 3),
    (16, 31, 4),
    (32, 63, 5),
    (64, 127, 6),
    (128, 255, 7),
]


def _to_bits(data: bytes) -> np.ndarray:
    return np.unpackbits(np.frombuffer(data, dtype=np.uint8))


def _to_bytes(bits: np.ndarray) -> bytes:
    return np.packbits(bits.astype(np.uint8)).tobytes()


def _range_for_diff(diff: int) -> tuple[int, int, int]:
    for low, high, bits in RANGES:
        if low <= diff <= high:
            return low, high, bits
    return RANGES[-1]


def encode_image(image_bytes: bytes, message: bytes) -> bytes:
    image = Image.open(io.BytesIO(image_bytes)).convert("L")
    arr = np.array(image, dtype=np.int16).reshape(-1)

    bits = _to_bits(len(message).to_bytes(4, "big") + message)
    idx = 0

    for i in range(0, arr.size - 1, 2):
        if idx >= bits.size:
            break

        p1, p2 = int(arr[i]), int(arr[i + 1])
        diff = abs(p2 - p1)
        low, _, nbits = _range_for_diff(diff)

        chunk = bits[idx : idx + nbits]
        if chunk.size < nbits:
            chunk = np.pad(chunk, (0, nbits - chunk.size), constant_values=0)
        value = int("".join(chunk.astype(str)), 2)
        target_diff = low + value

        avg = (p1 + p2) // 2
        if p1 >= p2:
            new1 = avg + (target_diff + 1) // 2
            new2 = avg - target_diff // 2
        else:
            new1 = avg - target_diff // 2
            new2 = avg + (target_diff + 1) // 2

        arr[i] = np.clip(new1, 0, 255)
        arr[i + 1] = np.clip(new2, 0, 255)
        idx += nbits

    if idx < bits.size:
        raise ValueError("Message exceeds PVD capacity")

    out = io.BytesIO()
    Image.fromarray(arr.reshape(np.array(image).shape).astype(np.uint8), mode="L").save(
        out, format="PNG"
    )
    return out.getvalue()


def decode_image(image_bytes: bytes) -> bytes:
    image = Image.open(io.BytesIO(image_bytes)).convert("L")
    arr = np.array(image, dtype=np.int16).reshape(-1)

    bits: list[int] = []
    for i in range(0, arr.size - 1, 2):
        p1, p2 = int(arr[i]), int(arr[i + 1])
        diff = abs(p2 - p1)
        low, _, nbits = _range_for_diff(diff)
        value = max(0, diff - low)
        chunk = format(value, f"0{nbits}b")[-nbits:]
        bits.extend(int(ch) for ch in chunk)

    bit_arr = np.array(bits, dtype=np.uint8)
    msg_len = int.from_bytes(_to_bytes(bit_arr[:32]), "big")
    payload = bit_arr[32 : 32 + msg_len * 8]
    return _to_bytes(payload)
