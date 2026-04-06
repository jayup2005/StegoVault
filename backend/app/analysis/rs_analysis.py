from __future__ import annotations

import numpy as np


def _discriminant(group: np.ndarray) -> int:
    return int(np.sum(np.abs(np.diff(group.astype(np.int16)))))


def _flip_lsb(group: np.ndarray, mask: np.ndarray) -> np.ndarray:
    out = group.copy()
    out[mask == 1] ^= 1
    return out


def rs_payload_estimate(data: np.ndarray, group_size: int = 4) -> dict[str, float]:
    flat = data.astype(np.uint8).reshape(-1)
    n = (flat.size // group_size) * group_size
    groups = flat[:n].reshape(-1, group_size)

    mask = np.array([1 if i % 2 == 0 else 0 for i in range(group_size)], dtype=np.uint8)

    regular = 0
    singular = 0
    for g in groups:
        d1 = _discriminant(g)
        d2 = _discriminant(_flip_lsb(g, mask))
        if d2 > d1:
            regular += 1
        elif d2 < d1:
            singular += 1

    total = max(regular + singular, 1)
    fraction = float(np.clip(abs(regular - singular) / total, 0.0, 1.0))
    return {
        "regular": float(regular),
        "singular": float(singular),
        "estimated_payload_fraction": fraction,
    }
