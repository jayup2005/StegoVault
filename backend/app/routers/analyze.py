from __future__ import annotations

import io

import numpy as np
from fastapi import APIRouter, File, HTTPException, UploadFile
from PIL import Image
from scipy.fftpack import dct

from app.analysis.chi_square import chi_square_lsb
from app.analysis.rs_analysis import rs_payload_estimate


router = APIRouter(prefix="/api", tags=["analyze"])
PVD_RANGES = [(0, 7), (8, 15), (16, 31), (32, 63), (64, 127), (128, 255)]


def _load_image(raw: bytes) -> np.ndarray:
    image = Image.open(io.BytesIO(raw)).convert("RGB")
    return np.array(image, dtype=np.uint8)


def _normalized_entropy(data: np.ndarray) -> float:
    values = data.reshape(-1)
    hist = np.bincount(values, minlength=256).astype(np.float64)
    probs = hist / max(float(hist.sum()), 1.0)
    probs = probs[probs > 0]
    entropy = -np.sum(probs * np.log2(probs))
    return float(entropy / 8.0)


def _lsb_balance(data: np.ndarray) -> float:
    lsb = data.reshape(-1) & 1
    return float(np.mean(lsb))


def _sample_pair_index(data: np.ndarray) -> float:
    values = data.reshape(-1).astype(np.int16)
    if values.size < 2:
        return 0.0
    return float(np.mean(np.abs(np.diff(values))) / 255.0)


def _histogram_variance_score(data: np.ndarray) -> tuple[float, dict[str, float]]:
    hist = np.bincount(data.reshape(-1), minlength=256).astype(np.float64)
    even = hist[0::2]
    odd = hist[1::2]
    pair_delta = np.abs(even - odd)
    ratio = float(np.mean(pair_delta / np.maximum(even + odd, 1.0)))
    score = float(np.clip((1.0 - ratio) * 100.0, 0.0, 100.0))
    return score, {"mean_pair_delta": ratio}


def _pvd_distribution(gray: np.ndarray) -> tuple[list[dict[str, float | str]], float]:
    values = gray.reshape(-1).astype(np.int16)
    diffs = np.abs(values[1::2] - values[0::2])
    total = max(int(diffs.size), 1)
    zones: list[dict[str, float | str]] = []
    fractions: list[float] = []
    for low, high in PVD_RANGES:
        count = int(np.sum((diffs >= low) & (diffs <= high)))
        fraction = count / total
        fractions.append(fraction)
        zones.append({"range": f"{low}-{high}", "fraction": float(fraction), "count": count})
    spread = float(np.std(fractions))
    score = float(np.clip(spread * 400.0, 0.0, 100.0))
    return zones, score


def _dct2(block: np.ndarray) -> np.ndarray:
    return dct(dct(block.T, norm="ortho").T, norm="ortho")


def _dct_metrics(gray: np.ndarray) -> tuple[list[int], float, dict[str, float]]:
    h8 = gray.shape[0] - (gray.shape[0] % 8)
    w8 = gray.shape[1] - (gray.shape[1] % 8)
    coeffs: list[float] = []
    if h8 == 0 or w8 == 0:
        return [0] * 32, 0.0, {"near_zero_fraction": 0.0, "coeff_count": 0.0}

    for row in range(0, h8, 8):
        for col in range(0, w8, 8):
            block = gray[row : row + 8, col : col + 8].astype(np.float32) - 128.0
            transformed = _dct2(block)
            coeffs.extend(transformed.reshape(-1)[1:].tolist())

    coeff_arr = np.array(coeffs, dtype=np.float32)
    clipped = np.clip(coeff_arr, -128, 128)
    hist, _ = np.histogram(clipped, bins=32, range=(-128, 128))
    near_zero_fraction = float(np.mean(np.abs(coeff_arr) < 2.0))
    score = float(np.clip(near_zero_fraction * 100.0, 0.0, 100.0))
    return hist.astype(int).tolist(), score, {
        "near_zero_fraction": near_zero_fraction,
        "coeff_count": float(coeff_arr.size),
    }


def _block_entropies(gray: np.ndarray) -> list[list[float]]:
    rows = np.array_split(gray, min(16, gray.shape[0]))
    grid: list[list[float]] = []
    for row_block in rows:
        cols = np.array_split(row_block, min(16, row_block.shape[1]), axis=1)
        grid_row: list[float] = []
        for cell in cols:
            grid_row.append(_normalized_entropy(cell))
        grid.append(grid_row)
    return grid


def _histograms(rgb: np.ndarray) -> dict[str, list[int]]:
    luminance = np.clip(
        0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2],
        0,
        255,
    ).astype(np.uint8)
    return {
        "r": np.bincount(rgb[:, :, 0].reshape(-1), minlength=256).astype(int).tolist(),
        "g": np.bincount(rgb[:, :, 1].reshape(-1), minlength=256).astype(int).tolist(),
        "b": np.bincount(rgb[:, :, 2].reshape(-1), minlength=256).astype(int).tolist(),
        "luminance": np.bincount(luminance.reshape(-1), minlength=256).astype(int).tolist(),
    }


def _lsb_planes(green: np.ndarray) -> list[dict[str, int | list[list[int]]]]:
    planes: list[dict[str, int | list[list[int]]]] = []
    for bit in range(8):
        plane = ((green >> bit) & 1).astype(int).tolist()
        planes.append(
            {
                "plane": bit,
                "width": int(green.shape[1]),
                "height": int(green.shape[0]),
                "data": plane,
            }
        )
    return planes


def _score_entropy(entropy: float) -> float:
    return float(np.clip((1.0 - entropy) * 100.0, 0.0, 100.0))


def _score_lsb_balance(ratio: float) -> float:
    return float(np.clip(abs(0.5 - ratio) * 220.0, 0.0, 100.0))


def _score_sample_pairs(sample_pair: float) -> float:
    return float(np.clip(sample_pair * 100.0, 0.0, 100.0))


def _interpretation(score: float) -> str:
    if score < 40:
        return "Low anomaly level"
    if score < 70:
        return "Moderate anomaly level"
    return "High anomaly level"


@router.post("/analyze")
async def analyze_file(file: UploadFile = File(...)):
    raw = await file.read()

    try:
        rgb = _load_image(raw)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Unsupported image: {exc}") from exc

    gray = np.clip(
        0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2],
        0,
        255,
    ).astype(np.uint8)
    green = rgb[:, :, 1]

    chi = chi_square_lsb(green)
    rs = rs_payload_estimate(green)
    entropy = _normalized_entropy(gray)
    lsb_ratio = _lsb_balance(green)
    sample_pair = _sample_pair_index(gray)
    histogram_score, histogram_details = _histogram_variance_score(green)
    pvd_zones, pvd_score = _pvd_distribution(gray)
    dct_histogram, dct_score, dct_details = _dct_metrics(gray)

    methods = [
        {
            "name": "Chi-Square",
            "score": chi["score"],
            "interpretation": _interpretation(chi["score"]),
            "details": chi,
        },
        {
            "name": "RS Analysis",
            "score": float(np.clip(rs["estimated_payload_fraction"] * 100.0, 0.0, 100.0)),
            "interpretation": _interpretation(float(rs["estimated_payload_fraction"] * 100.0)),
            "details": rs,
        },
        {
            "name": "Entropy",
            "score": _score_entropy(entropy),
            "interpretation": _interpretation(_score_entropy(entropy)),
            "details": {"entropy_norm": entropy},
        },
        {
            "name": "LSB Balance",
            "score": _score_lsb_balance(lsb_ratio),
            "interpretation": _interpretation(_score_lsb_balance(lsb_ratio)),
            "details": {"lsb_one_ratio": lsb_ratio},
        },
        {
            "name": "Sample Pair",
            "score": _score_sample_pairs(sample_pair),
            "interpretation": _interpretation(_score_sample_pairs(sample_pair)),
            "details": {"sample_pair_index": sample_pair},
        },
        {
            "name": "Histogram Pairing",
            "score": histogram_score,
            "interpretation": _interpretation(histogram_score),
            "details": histogram_details,
        },
        {
            "name": "PVD Distribution",
            "score": pvd_score,
            "interpretation": _interpretation(pvd_score),
            "details": {"zone_count": len(pvd_zones)},
        },
        {
            "name": "DCT Coefficients",
            "score": dct_score,
            "interpretation": _interpretation(dct_score),
            "details": dct_details,
        },
    ]

    suspicion_score = float(np.mean([method["score"] for method in methods]))
    if suspicion_score < 40:
        verdict = "LIKELY_CLEAN"
    elif suspicion_score < 70:
        verdict = "MODERATE"
    else:
        verdict = "HIGH_SUSPICION"

    return {
        "suspicion_score": suspicion_score,
        "verdict": verdict,
        "methods": methods,
        "lsb_planes": _lsb_planes(green),
        "histograms": _histograms(rgb),
        "pvd_zones": pvd_zones,
        "dct_histogram": dct_histogram,
        "block_entropies": _block_entropies(gray),
    }
