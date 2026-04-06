from __future__ import annotations

import io

import numpy as np
from PIL import Image


BLOCK_SIZE = 8
COMPLEXITY_THRESHOLD = 0.30


def _to_bits(data: bytes) -> np.ndarray:
    return np.unpackbits(np.frombuffer(data, dtype=np.uint8))


def _to_bytes(bits: np.ndarray) -> bytes:
    return np.packbits(bits.astype(np.uint8)).tobytes()


def _complexity(plane: np.ndarray) -> float:
    horizontal = np.sum(plane[:, :-1] != plane[:, 1:])
    vertical = np.sum(plane[:-1, :] != plane[1:, :])
    max_changes = (plane.shape[0] * (plane.shape[1] - 1)) + ((plane.shape[0] - 1) * plane.shape[1])
    return float((horizontal + vertical) / max(max_changes, 1))


def _checkerboard() -> np.ndarray:
    yy, xx = np.indices((BLOCK_SIZE, BLOCK_SIZE))
    return ((xx + yy) % 2).astype(np.uint8)


def _candidate_positions(arr: np.ndarray) -> list[tuple[int, int, int]]:
    positions: list[tuple[int, int, int]] = []
    for channel in range(arr.shape[2]):
        channel_data = arr[:, :, channel]
        h8 = channel_data.shape[0] - (channel_data.shape[0] % BLOCK_SIZE)
        w8 = channel_data.shape[1] - (channel_data.shape[1] % BLOCK_SIZE)
        for row in range(0, h8, BLOCK_SIZE):
            for col in range(0, w8, BLOCK_SIZE):
                plane = channel_data[row : row + BLOCK_SIZE, col : col + BLOCK_SIZE] & 1
                if _complexity(plane) >= COMPLEXITY_THRESHOLD:
                    positions.append((channel, row, col))
    return positions


def capacity_bytes(image_bytes: bytes) -> int:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    arr = np.array(image, dtype=np.uint8)
    block_count = len(_candidate_positions(arr))
    usable_bits = block_count * 63
    return max((usable_bits // 8) - 4, 0)


def encode_image(image_bytes: bytes, message: bytes) -> bytes:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    arr = np.array(image, dtype=np.uint8)

    bits = _to_bits(len(message).to_bytes(4, "big") + message)
    positions = _candidate_positions(arr)
    capacity = len(positions) * 63
    if bits.size > capacity:
        raise ValueError("Message exceeds BPCS capacity")

    checker = _checkerboard()
    padded_size = int(np.ceil(bits.size / 63.0)) * 63
    padded_bits = np.pad(bits, (0, padded_size - bits.size), constant_values=0)
    chunks = padded_bits.reshape(-1, 63)

    if chunks.shape[0] > len(positions):
        raise ValueError("Message exceeds BPCS capacity")

    for (channel, row, col), chunk in zip(positions, chunks, strict=False):
        plane = np.zeros((BLOCK_SIZE, BLOCK_SIZE), dtype=np.uint8)
        plane.reshape(-1)[1:] = chunk
        conjugated = 0
        if _complexity(plane) < COMPLEXITY_THRESHOLD:
            plane ^= checker
            conjugated = 1
            plane[0, 0] = conjugated
        else:
            plane[0, 0] = conjugated

        block = arr[row : row + BLOCK_SIZE, col : col + BLOCK_SIZE, channel]
        arr[row : row + BLOCK_SIZE, col : col + BLOCK_SIZE, channel] = (block & 0xFE) | plane

    out = io.BytesIO()
    Image.fromarray(arr, mode="RGB").save(out, format="PNG")
    return out.getvalue()


def decode_image(image_bytes: bytes) -> bytes:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    arr = np.array(image, dtype=np.uint8)
    positions = _candidate_positions(arr)
    checker = _checkerboard()

    bits: list[int] = []
    for channel, row, col in positions:
        plane = (arr[row : row + BLOCK_SIZE, col : col + BLOCK_SIZE, channel] & 1).astype(np.uint8)
        if int(plane[0, 0]) == 1:
            plane ^= checker
        bits.extend(int(bit) for bit in plane.reshape(-1)[1:])
        if len(bits) >= 32:
            header = np.array(bits[:32], dtype=np.uint8)
            message_len = int.from_bytes(_to_bytes(header), "big")
            target_bits = 32 + (message_len * 8)
            if len(bits) >= target_bits:
                payload = np.array(bits[32:target_bits], dtype=np.uint8)
                return _to_bytes(payload)

    raise ValueError("No valid BPCS payload found")
