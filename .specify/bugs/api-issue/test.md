# Bug Verification: CORS Preflight 400 Bad Request on RAG Chatbot and Contact Form

- **Slug**: api-issue
- **Tested**: 2026-11-18T18:08:50+08:00
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

The CORS preflight `400 Bad Request` issue no longer reproduces for default local origins (`http://localhost:3000`, `http://127.0.0.1:3000`) or for the Render deployment configuration (`CORS_ORIGINS=https://portfolio-seven-ashen-14.vercel.app,http://localhost:3000`). All 24 backend tests pass with no regressions.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix, Render `CORS_ORIGINS`) | `TestClient(create_app()).options(...)` with `CORS_ORIGINS="https://portfolio-seven-ashen-14.vercel.app,http://localhost:3000"` | pass | `200` with matching `access-control-allow-origin` on `/api/v1/ask-resume/stream` and `/api/v1/contact` for both origins |
| New / updated tests | `.\.venv\Scripts\python.exe -m pytest tests/test_cors_preflight.py -v` (in `backend/`) | pass | 3 passed (default origins, trailing-slash + `FRONTEND_PUBLIC_URL` normalization, disallowed origin 400) |
| Regression suite | `.\.venv\Scripts\python.exe -m pytest -q` (in `backend/`) | pass | 24 passed in 16.51s |
| Live Render / Vercel E2E | Browser request from Vercel to Render | skipped | Not run in local workspace (no live deployment trigger) |

## Output Excerpts

```text
origins: ['https://portfolio-seven-ashen-14.vercel.app', 'http://localhost:3000']
https://portfolio-seven-ashen-14.vercel.app /api/v1/ask-resume/stream 200 https://portfolio-seven-ashen-14.vercel.app
https://portfolio-seven-ashen-14.vercel.app /api/v1/contact 200 https://portfolio-seven-ashen-14.vercel.app
http://localhost:3000 /api/v1/ask-resume/stream 200 http://localhost:3000
http://localhost:3000 /api/v1/contact 200 http://localhost:3000
```

```text
........................                                                 [100%]
24 passed in 16.51s
```

## Residual Risks

- **Live Render deployment**: Render must be redeployed with the updated backend code and have `CORS_ORIGINS=https://portfolio-seven-ashen-14.vercel.app,http://localhost:3000` (without quotes) set in Render's Environment Variables.
- **Vercel preview URLs**: If you later test from a Vercel preview deployment URL (a different subdomain than `portfolio-seven-ashen-14.vercel.app`), that preview origin must also be added to `CORS_ORIGINS` (or `FRONTEND_PUBLIC_URL`) on Render.
- **Vercel frontend env**: Ensure `NEXT_PUBLIC_API_URL` (and/or `NEXT_PUBLIC_API_BASE_URL` for contact) on Vercel points to your `https://<your-render-service>.onrender.com` URL so requests don't fall back to `http://localhost:8000`.

## Recommendation

Close the bug — verified locally for both default development origins and the exact Render `CORS_ORIGINS` value (`https://portfolio-seven-ashen-14.vercel.app,http://localhost:3000`). Once deployed to Render, test one message in the RAG Chatbot and one contact form submission from `https://portfolio-seven-ashen-14.vercel.app` to confirm end-to-end.
