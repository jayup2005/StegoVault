from __future__ import annotations

import io

import numpy as np
from PIL import Image


def _bytes_to_bits(data: bytes) -> np.ndarray:
    return np.unpackbits(np.frombuffer(data, dtype=np.uint8))


def _bits_to_bytes(bits: np.ndarray) -> bytes:
    return np.packbits(bits.astype(np.uint8)).tobytes()


def _payload_bits(message: bytes) -> np.ndarray:
    length_header = len(message).to_bytes(4, "big")
    return _bytes_to_bits(length_header + message)


def encode_image(image_bytes: bytes, message: bytes, mode: int = 1) -> bytes:
    if mode not in (1, 2):
        raise ValueError("mode must be 1 or 2")

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    arr = np.array(image, dtype=np.uint8)
    flat = arr.reshape(-1)

    bits = _payload_bits(message)
    capacity = flat.size * mode
    if bits.size > capacity:
        raise ValueError("Message exceeds image capacity")

    if mode == 1:
        flat[: bits.size] = (flat[: bits.size] & 0xFE) | bits
    else:
        required = int(np.ceil(bits.size / 2))
        padded = np.pad(bits, (0, required * 2 - bits.size), constant_values=0)
        pairs = padded.reshape(-1, 2)
        values = (pairs[:, 0] << 1) | pairs[:, 1]
        flat[:required] = (flat[:required] & 0xFC) | values

    out = io.BytesIO()
    Image.fromarray(arr.reshape(arr.shape), mode="RGB").save(out, format="PNG")
    return out.getvalue()


def decode_image(image_bytes: bytes, mode: int = 1) -> bytes:
    if mode not in (1, 2):
        raise ValueError("mode must be 1 or 2")

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    arr = np.array(image, dtype=np.uint8).reshape(-1)

    if mode == 1:
        bitstream = (arr & 0x01).astype(np.uint8)
    else:
        two_bits = (arr & 0x03).astype(np.uint8)
        bitstream = np.empty(two_bits.size * 2, dtype=np.uint8)
        bitstream[0::2] = (two_bits >> 1) & 1
        bitstream[1::2] = two_bits & 1

    header_bits = bitstream[:32]
    payload_len = int.from_bytes(_bits_to_bytes(header_bits), "big")
    total_bits = 32 + payload_len * 8
    payload = bitstream[32:total_bits]
    return _bits_to_bytes(payload)
