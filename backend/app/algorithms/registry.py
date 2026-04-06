from __future__ import annotations

from io import BytesIO

from PIL import Image

from app.algorithms import bpcs, dct, lsb, pvd


AlgorithmName = str


def normalize_algorithm(name: str) -> AlgorithmName:
    normalized = name.strip().lower()
    aliases = {
        "lsb": "lsb-1",
        "lsb1": "lsb-1",
        "lsb-1": "lsb-1",
        "lsb2": "lsb-2",
        "lsb-2": "lsb-2",
        "pvd": "pvd",
        "dct": "dct",
        "bpcs": "bpcs",
    }
    return aliases.get(normalized, normalized)


def encode_payload(raw: bytes, payload: bytes, algorithm: str) -> tuple[bytes, str]:
    name = normalize_algorithm(algorithm)
    if name == "lsb-1":
        return lsb.encode_image(raw, payload, mode=1), "image/png"
    if name == "lsb-2":
        return lsb.encode_image(raw, payload, mode=2), "image/png"
    if name == "pvd":
        return pvd.encode_image(raw, payload), "image/png"
    if name == "dct":
        return dct.encode_jpeg(raw, payload), "image/png"
    if name == "bpcs":
        return bpcs.encode_image(raw, payload), "image/png"
    raise ValueError("Unsupported algorithm")


def decode_payload(raw: bytes, algorithm: str) -> bytes:
    name = normalize_algorithm(algorithm)
    if name == "lsb-1":
        return lsb.decode_image(raw, mode=1)
    if name == "lsb-2":
        return lsb.decode_image(raw, mode=2)
    if name == "pvd":
        return pvd.decode_image(raw)
    if name == "dct":
        return dct.decode_jpeg(raw)
    if name == "bpcs":
        return bpcs.decode_image(raw)
    raise ValueError("Unsupported algorithm")


def capacity_for_file(raw: bytes, algorithm: str) -> dict[str, int | str]:
    name = normalize_algorithm(algorithm)
    if name == "lsb-1":
        image = Image.open(BytesIO(raw)).convert("RGB")
        bits = image.width * image.height * 3
        return _capacity_payload(name, bits)
    if name == "lsb-2":
        image = Image.open(BytesIO(raw)).convert("RGB")
        bits = image.width * image.height * 3 * 2
        return _capacity_payload(name, bits)
    if name == "pvd":
        image = Image.open(BytesIO(raw)).convert("L")
        pixels = image.width * image.height
        pair_count = pixels // 2
        # Conservative estimate; actual capacity depends on local variance.
        bits = pair_count * 3
        return _capacity_payload(name, bits)
    if name == "dct":
        image = Image.open(BytesIO(raw)).convert("L")
        blocks = (image.width // 8) * (image.height // 8)
        return _capacity_payload(name, blocks)
    if name == "bpcs":
        return {
            "algorithm": name,
            "available_bytes": bpcs.capacity_bytes(raw),
            "header_bytes": 4,
        }
    raise ValueError("Unsupported algorithm")


def _capacity_payload(name: str, bits: int) -> dict[str, int | str]:
    total_bytes = bits // 8
    return {
        "algorithm": name,
        "available_bytes": max(total_bytes - 4, 0),
        "header_bytes": 4,
    }
