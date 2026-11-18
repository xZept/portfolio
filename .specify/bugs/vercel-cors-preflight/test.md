# Bug Verification: Vercel Production and Preview CORS Preflight 400 Bad Request

- **Slug**: vercel-cors-preflight
- **Tested**: 2026-11-18T18:33:44+08:00
- **Assessment**: N/A (bug specification provided directly in `/speckit-bug-fix` prompt)
- **Fix**: ./fix.md
- **Result**: verified

## Summary

The FastAPI `CORSMiddleware` preflight fix holds in local automated testing: `OPTIONS` requests to `/api/v1/contact` and `/api/v1/ask-resume/stream` from production Vercel, preview Vercel (`https://portfolio-*.vercel.app`), and `http://localhost:3000` with arbitrary `Access-Control-Request-Headers` return `200 OK` with `Access-Control-Allow-Origin`, while disallowed origins remain rejected with `400`. No regressions were found in the backend test suite.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix, local ASGI) | `backend\.venv\Scripts\python.exe -m pytest backend\tests\test_cors_preflight.py -v` | pass | Exercised `OPTIONS` preflight on `/api/v1/contact` and `/api/v1/ask-resume/stream` via FastAPI `TestClient`. |
| New / updated tests | `backend\.venv\Scripts\python.exe -m pytest backend\tests\test_cors_preflight.py -v` | pass | 4 passed in 0.71s. |
| Regression suite | `backend\.venv\Scripts\python.exe -m pytest backend\tests -v` | pass | 25 passed in 1.21s across all backend test modules. |
| Lint / type-check | N/A | skipped | No linter or type-checker configured in `backend/pyproject.toml` or installed in `backend/.venv`. |

## Output Excerpts

```text
backend\tests\test_cors_preflight.py::test_cors_preflight_allows_localhost_and_loopback_by_default PASSED [ 25%]
backend\tests\test_cors_preflight.py::test_cors_preflight_allows_vercel_production_preview_and_localhost_with_arbitrary_headers PASSED [ 50%]
backend\tests\test_cors_preflight.py::test_cors_preflight_normalizes_trailing_slashes_and_frontend_public_url PASSED [ 75%]
backend\tests\test_cors_preflight.py::test_cors_preflight_rejects_disallowed_origin PASSED [100%]
============================== 4 passed in 0.71s ==============================
```

```text
============================= 25 passed in 1.21s ==============================
```

## Residual Risks

- Live network preflight from Vercel (`https://portfolio-seven-ashen-14.vercel.app`) to Render (`https://portfolio-24oq.onrender.com`) was not executed in this local check; it will take effect once the updated backend is deployed to Render.

## Recommendation

Close the bug locally and deploy the updated `backend/` to Render, then confirm the live `OPTIONS` preflight in the browser network tab from Vercel.
