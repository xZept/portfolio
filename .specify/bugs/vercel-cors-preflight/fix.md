# Bug Fix: Vercel Production and Preview CORS Preflight 400 Bad Request

- **Slug**: vercel-cors-preflight
- **Fixed**: 2026-11-18T18:32:20+08:00
- **Status**: applied

## Summary

Updated FastAPI `CORSMiddleware` configuration and default CORS origins so browser `OPTIONS` preflight requests from Vercel production (`https://portfolio-seven-ashen-14.vercel.app`), Vercel preview deployments (`https://portfolio-*.vercel.app`), and `http://localhost:3000` succeed with `200 OK` and `Access-Control-Allow-Origin` on `/api/v1/contact` and `/api/v1/ask-resume/stream`.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `backend/app/main.py` | modified | Set `allow_headers=["*"]` and added `allow_origin_regex=r"^https://portfolio-.*\.vercel\.app$"` alongside `allow_origins=settings.cors_origin_list` in `create_app()`. |
| `backend/app/config.py` | modified | Included `https://portfolio-seven-ashen-14.vercel.app` alongside `http://localhost:3000` and `http://127.0.0.1:3000` in `Settings.cors_origins` default and `cors_origin_list` fallback; preserved whitespace/trailing-slash normalization. |
| `backend/tests/test_cors_preflight.py` | modified | Updated default origin assertion and added `test_cors_preflight_allows_vercel_production_preview_and_localhost_with_arbitrary_headers` covering production Vercel, preview Vercel, and `localhost:3000` origins on both endpoints. |

## Tests Added or Updated

- `backend/tests/test_cors_preflight.py::test_cors_preflight_allows_localhost_and_loopback_by_default` — verifies default `cors_origin_list` includes production Vercel, `localhost:3000`, and `127.0.0.1:3000` and allows preflight `OPTIONS`.
- `backend/tests/test_cors_preflight.py::test_cors_preflight_allows_vercel_production_preview_and_localhost_with_arbitrary_headers` — verifies `OPTIONS` returns `200` with `Access-Control-Allow-Origin` for production Vercel, preview Vercel, and `http://localhost:3000` with arbitrary `Access-Control-Request-Headers`.
- `backend/tests/test_cors_preflight.py::test_cors_preflight_rejects_disallowed_origin` — verifies disallowed origins including `https://evil.vercel.app` still return `400`.

## Local Verification

- Commands run: `backend\.venv\Scripts\python.exe -m pytest backend\tests -v` → 25 passed in 1.10s.
- Constraints verified via `git status --short`: `frontend/src/app/api/notify-discord/route.ts`, `automation/n8n/workflows/`, and HMAC webhook verification were untouched.

## Deviations from Assessment

Applied directly from the bug specification provided in the `/speckit-bug-fix` prompt; recorded under `vercel-cors-preflight` to avoid overwriting `.specify/bugs/api-issue/fix.md`.
