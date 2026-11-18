# Bug Assessment: CORS Preflight 400 Bad Request on RAG Chatbot and Contact Form

- **Slug**: api-issue
- **Created**: 2026-11-18T18:00:23+08:00
- **Source**: pasted text
- **Verdict**: valid
- **Severity**: high

## Report (verbatim or summarized)

> Sending messages through the RAG Chatbot and filling up the bottom contact form shows a "OPTIONS /api/v1/ask-resume/stream HTTP/1.1" 400 Bad Request and "OPTIONS /api/v1/contact HTTP/1.1" 400 Bad Request

## Symptom

When a visitor submits a message in the RAG Chatbot (`POST /api/v1/ask-resume/stream`) or submits the bottom contact form (`POST /api/v1/contact`), the browser's CORS preflight `OPTIONS` requests fail with `400 Bad Request` instead of `200 OK` with CORS allow headers, blocking both features from communicating with the FastAPI backend.

## Reproduction

1. Start the FastAPI backend (`backend/app/main.py`) with the default `CORS_ORIGINS=http://localhost:3000` (as in `backend/.env` and `backend/.env.example`).
2. Open the Next.js frontend from a different origin than `http://localhost:3000` — for example `http://127.0.0.1:3000`, another local port (e.g., `http://localhost:3001`), a LAN IP, or a deployed frontend URL not listed in `CORS_ORIGINS`.
3. Send a message in the RAG Chatbot or submit the contact form.
4. Observe the backend logs / browser network tab: `OPTIONS /api/v1/ask-resume/stream HTTP/1.1` and `OPTIONS /api/v1/contact HTTP/1.1` return `400 Bad Request` (`Disallowed CORS origin`).
   - `[NEEDS CLARIFICATION: Confirm the exact browser Origin URL where the 400 was observed (e.g., http://127.0.0.1:3000, another port, or a deployed domain).]`

## Suspected Code Paths

- `backend/app/config.py:21,27,30-33` — `Settings.cors_origins` defaults to `"http://localhost:3000"`, and `cors_origin_list` only splits on `,` and strips whitespace. It does not include `http://127.0.0.1:3000`, does not strip trailing slashes (`rstrip("/")`), and does not include `Settings.frontend_public_url`.
- `backend/app/main.py:21-32` — `CORSMiddleware` is configured with `allow_origins=settings.cors_origin_list` (exact origin match). When Starlette's `CORSMiddleware` receives a preflight `OPTIONS` request whose `Origin` header is not in `allow_origins`, it responds with `400 Disallowed CORS origin`.
- `backend/.env.example:3` (and `backend/.env`) — Sets `CORS_ORIGINS=http://localhost:3000` only.
- `frontend/src/lib/ask-resume-client.ts:917-928` — `askResumeStream()` sends `POST /api/v1/ask-resume/stream` with `Content-Type: application/json` and `Accept: text/event-stream`, triggering a CORS preflight `OPTIONS` request.
- `frontend/src/lib/contact-client.ts:62-74` — `submitContactInquiry()` sends `POST /api/v1/contact` with `Content-Type: application/json`, triggering a CORS preflight `OPTIONS` request.

## Root Cause Hypothesis

Starlette's `CORSMiddleware` in `backend/app/main.py:21-32` rejects `OPTIONS` preflight requests with `400 Bad Request` (`Disallowed CORS origin`) whenever the request's `Origin` header does not exactly match an entry in `settings.cors_origin_list`. Because `backend/app/config.py:21` and `backend/.env` only allow `http://localhost:3000` (and do not include `http://127.0.0.1:3000`, `FRONTEND_PUBLIC_URL`, or normalized origins without trailing slashes), any frontend session accessed from `127.0.0.1:3000`, a non-3000 port, or a deployed origin fails preflight for both `/api/v1/ask-resume/stream` and `/api/v1/contact`. Verified locally with FastAPI `TestClient`: `OPTIONS /api/v1/ask-resume/stream` with `Origin: http://127.0.0.1:3000` returns `400 Disallowed CORS origin`, while `Origin: http://localhost:3000` returns `200`. Confidence: high.

## Proposed Remediation

**Preferred**: Update `Settings.cors_origin_list` in `backend/app/config.py` to normalize configured origins (strip whitespace and trailing `/`), include `http://127.0.0.1:3000` alongside `http://localhost:3000` in the default local development origins, and automatically include `frontend_public_url` (normalized to its scheme + host + port) when set, deduplicating while preserving order. Also update `backend/.env.example` (and `backend/.env` in local dev) to document/include `http://localhost:3000,http://127.0.0.1:3000`.

**Alternatives**:
- Add `allow_origin_regex` (e.g., `r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"`) in `backend/app/main.py` for local development while keeping `allow_origins` for explicit production domains. Trade-off: convenient for arbitrary local ports, but slightly broader than an explicit allowlist if left enabled in production without gating.
- Proxy `/api/v1/*` through Next.js rewrites (`frontend/next.config.ts`) so browser requests are same-origin. Trade-off: avoids CORS preflight altogether, but requires Next.js server/rewrites configuration and changes streaming/API routing topology.

**Files likely to change**:
- `backend/app/config.py`
- `backend/.env.example`
- `backend/tests/test_cors_preflight.py` (or `backend/tests/test_ask_resume_validation.py` / `backend/tests/test_automation_validation.py`)

**Tests to add or update**:
- Add FastAPI `TestClient` tests verifying `OPTIONS /api/v1/ask-resume/stream` and `OPTIONS /api/v1/contact` return `200` with `Access-Control-Allow-Origin` for `http://localhost:3000`, `http://127.0.0.1:3000`, `CORS_ORIGINS` with trailing slashes, and `FRONTEND_PUBLIC_URL`, while still returning `400` for disallowed origins.

## Risks & Considerations

- **Security**: Keep `allow_origins` explicit rather than using `*` because `allow_credentials=True` is set in `backend/app/main.py:24`.
- **Production deployment**: Ensure `CORS_ORIGINS` (or `FRONTEND_PUBLIC_URL`) in the deployed backend environment matches the exact `https://<domain>` of the deployed frontend.

## Open Questions

- [NEEDS CLARIFICATION: Confirm the exact Origin URL (e.g., `http://127.0.0.1:3000`, another local port, or a deployed URL) from which the browser is making requests when the 400 Bad Request occurs.]
