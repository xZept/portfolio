# Bug Fix: CORS Preflight 400 Bad Request on RAG Chatbot and Contact Form

- **Slug**: api-issue
- **Fixed**: 2026-11-18T18:05:10+08:00
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Updated `Settings.cors_origins` and `Settings.cors_origin_list` in `backend/app/config.py` to include `http://127.0.0.1:3000` by default alongside `http://localhost:3000`, normalize configured origins by stripping trailing slashes and paths (`scheme://host[:port]`), and automatically include `FRONTEND_PUBLIC_URL` when configured. Added FastAPI `TestClient` preflight tests covering both `/api/v1/ask-resume/stream` and `/api/v1/contact`.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `backend/app/config.py` | modified | Added `http://127.0.0.1:3000` to default `cors_origins`, added `_normalize_origin()`, merged `frontend_public_url` into `cors_origin_list` with order-preserving deduplication |
| `backend/.env.example` | modified | Updated `CORS_ORIGINS` example to `http://localhost:3000,http://127.0.0.1:3000` |
| `backend/tests/test_cors_preflight.py` | added test | Verifies `OPTIONS /api/v1/ask-resume/stream` and `OPTIONS /api/v1/contact` preflight handling for allowed, normalized, and disallowed origins |

## Diff Highlights (optional)

```python
    @staticmethod
    def _normalize_origin(raw_origin: str) -> str:
        """Strip whitespace/trailing slashes and reduce URLs to scheme://host[:port]."""
        cleaned = raw_origin.strip().rstrip("/")
        if not cleaned or cleaned == "*":
            return cleaned
        parsed = urlsplit(cleaned)
        if parsed.scheme and parsed.netloc:
            return f"{parsed.scheme}://{parsed.netloc}"
        return cleaned
```

## Tests Added or Updated

- `backend/tests/test_cors_preflight.py::test_cors_preflight_allows_localhost_and_loopback_by_default` — verifies default `cors_origin_list` and `200` preflight responses for `http://localhost:3000` and `http://127.0.0.1:3000` on `/api/v1/ask-resume/stream` and `/api/v1/contact`.
- `backend/tests/test_cors_preflight.py::test_cors_preflight_normalizes_trailing_slashes_and_frontend_public_url` — verifies trailing-slash normalization and automatic inclusion of `FRONTEND_PUBLIC_URL` (reduced to `scheme://host[:port]`).
- `backend/tests/test_cors_preflight.py::test_cors_preflight_rejects_disallowed_origin` — verifies disallowed origins still return `400 Disallowed CORS origin`.

## Local Verification

- Commands run:
  - `.\.venv\Scripts\python.exe -m pytest tests/test_cors_preflight.py -v` (in `backend/`) → `3 passed in 0.63s`
  - `.\.venv\Scripts\python.exe -m pytest -q` (in `backend/`) → `24 passed in 16.69s`

## Deviations from Assessment

None. Note that `backend/.env` (untracked local environment file) was not modified; if your local `backend/.env` sets `CORS_ORIGINS=http://localhost:3000` explicitly, add `,http://127.0.0.1:3000` (or your deployed frontend origin) there as well.

## Follow-ups

- Update `backend/.env` locally (and production environment variables) if `CORS_ORIGINS` is explicitly set to only `http://localhost:3000` and needs `http://127.0.0.1:3000` or a deployed frontend origin.
- Run `/speckit-bug-test slug=api-issue` to validate the fix.
