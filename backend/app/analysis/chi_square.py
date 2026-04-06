from __future__ import annotations

import numpy as np
from scipy.stats import chi2


def chi_square_lsb(data: np.ndarray) -> dict[str, float]:
    flat = data.astype(np.uint8).reshape(-1)
    hist = np.bincount(flat, minlength=256)

    chi_val = 0.0
    for i in range(0, 256, 2):
        o1 = hist[i]
        o2 = hist[i + 1]
        exp = (o1 + o2) / 2.0
        if exp > 0:
            chi_val += ((o1 - exp) ** 2 + (o2 - exp) ** 2) / exp

    dof = 127
    p_value = float(1 - chi2.cdf(chi_val, dof))
    score = float(np.clip((1.0 - p_value) * 100.0, 0.0, 100.0))
    return {"chi_square": float(chi_val), "p_value": p_value, "score": score}
