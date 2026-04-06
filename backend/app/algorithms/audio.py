from __future__ import annotations

import io

import numpy as np
from pydub import AudioSegment


def _to_bits(data: bytes) -> np.ndarray:
    return np.unpackbits(np.frombuffer(data, dtype=np.uint8))


def _to_bytes(bits: np.ndarray) -> bytes:
    return np.packbits(bits.astype(np.uint8)).tobytes()


def encode_wav(audio_bytes: bytes, message: bytes) -> bytes:
    seg = AudioSegment.from_file(io.BytesIO(audio_bytes), format="wav")
    samples = np.array(seg.get_array_of_samples())

    bits = _to_bits(len(message).to_bytes(4, "big") + message)
    if bits.size > samples.size:
        raise ValueError("Message exceeds audio capacity")

    encoded = samples.copy()
    encoded[: bits.size] = (encoded[: bits.size] & ~1) | bits

    out_seg = seg._spawn(encoded.astype(samples.dtype).tobytes())
    out = io.BytesIO()
    out_seg.export(out, format="wav")
    return out.getvalue()


def decode_wav(audio_bytes: bytes) -> bytes:
    seg = AudioSegment.from_file(io.BytesIO(audio_bytes), format="wav")
    samples = np.array(seg.get_array_of_samples())

    bits = (samples & 1).astype(np.uint8)
    msg_len = int.from_bytes(_to_bytes(bits[:32]), "big")
    payload = bits[32 : 32 + msg_len * 8]
    return _to_bytes(payload)
