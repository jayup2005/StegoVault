# StegoVault (Full-Stack Steganography App)

Features:
- Encoder
- Decoder
- Steganalysis

No Docker is used anywhere.

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS, Anime.js v3, React Dropzone, Axios, Zustand, Recharts
- Backend: Python 3.11, FastAPI, Uvicorn, Pillow, NumPy, SciPy, pydub, cryptography, python-multipart
- Storage (dev): SQLite + local `/tmp` files
- Storage (prod target): PostgreSQL + Cloudinary (configure via environment/services)

## Project Structure

- `backend/` FastAPI API + algorithms + analysis
- `frontend/` React app

## Setup (Exact Commands)

### 1) Frontend scaffold command (reference)

```bash
npm create vite@latest frontend -- --template react-ts
```

This repository already contains the generated/implemented frontend files.

### 2) Install frontend dependencies

```bash
cd frontend
npm install
npm install tailwindcss postcss autoprefixer animejs react-dropzone axios zustand recharts
```

### 3) Backend environment and dependencies

```bash
cd ../backend
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn pillow numpy scipy pydub cryptography python-multipart sqlalchemy aiofiles pytest
```

## Vite Proxy Configuration

`frontend/vite.config.ts` proxies:
- `/api` -> `http://localhost:8000`
- `/ws` -> `ws://localhost:8000`
- `/downloads` -> `http://localhost:8000`

## Run the App

Open two terminals.

### Terminal 1 (backend)

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

### Terminal 2 (frontend)

```bash
cd frontend
npm run dev
```

Frontend runs at `http://localhost:5173`.

## API Endpoints

- `POST /api/encode`
  - Multipart fields: `file`, `message`, `algorithm`, optional `password`, optional `mode` (for LSB: `1` or `2`)
  - Returns: `job_id`, `algorithm`, `download_url`
- `POST /api/decode`
  - Multipart fields: `file`, `algorithm`, optional `password`, optional `mode`
  - Returns: extracted `message`
- `POST /api/analyze`
  - Multipart field: `file`
  - Returns: `suspicion_score`, chi-square details, RS details, histogram, LSB planes
- `GET /api/health`
- `WS /ws/progress/{job_id}`

## Tests

```bash
cd backend
source venv/bin/activate
pytest
```

Tests cover round-trip encode/decode for:
- LSB
- DCT
- PVD
- Audio LSB

## Notes

- Dev output files are written to `/tmp/steg_outputs` and served via `/downloads/...`.
- Database defaults to SQLite: `sqlite:///./steg.db`.
- Set `DATABASE_URL` in production for PostgreSQL.
