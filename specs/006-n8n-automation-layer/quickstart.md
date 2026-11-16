# Quickstart & Validation Guide: n8n Automation Layer (`006-n8n-automation-layer`)

**Feature**: `006-n8n-automation-layer`  
**Date**: 2026-11-16  
**References**:
- Data Model: `specs/006-n8n-automation-layer/data-model.md`
- Database Contracts: `specs/006-n8n-automation-layer/contracts/database-contracts.md`
- API Contracts: `specs/006-n8n-automation-layer/contracts/api-contracts.md`
- n8n Workflows Contract: `specs/006-n8n-automation-layer/contracts/n8n-workflows-contract.md`
- UI Contract: `specs/006-n8n-automation-layer/contracts/ui-contracts.md`

---

## 1. Prerequisites & Environment Setup

1. **Database Migration (Git-First via Supabase MCP)**:
   - Ensure `apps/api/migrations/002_automation_layer.sql` (and mirrored `supabase/migrations/002_automation_layer.sql`) is committed to the repository.
   - Apply the migration to Supabase project `iixpswqqkxfghbujdnha` via `supabase_mcp` (`apply_migration`) and verify security/performance lint checks via `get_advisors`.

2. **Backend Environment (`backend/.env`)**:
   Configure the following variables alongside existing Gemini and Supabase settings:
   ```dotenv
   AUTOMATION_WEBHOOK_SECRET=your-32-byte-hmac-shared-secret
   N8N_CONTACT_WEBHOOK_URL=http://localhost:5678/webhook/contact-triage
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-id/your-webhook-token
   FRONTEND_PUBLIC_URL=http://localhost:3000
   BACKEND_PUBLIC_URL=http://localhost:8000
   ```

3. **n8n 2.47 Docker Service (`automation/n8n/`)**:
   Start n8n 2.47 and import the three workflow JSON definitions from `automation/n8n/workflows/`:
   ```powershell
   cd automation/n8n
   docker compose up -d
   ```

---

## 2. Runnable End-to-End Validation Scenarios

### Scenario 1: Verify HMAC-SHA256 Authentication & Schema Validation Gate (`FR-010`, `FR-011`, `SC-005`)
- **Action**: Send unsigned, expired-timestamp, invalid-signature, and malformed-payload requests to `/api/v1/automation/docs-sync`, `/api/v1/automation/contact-triage`, and `/api/v1/automation/watchdog/cleanup`.
- **Command**:
  ```powershell
  cd backend
  .\.venv\Scripts\pytest tests/test_automation_validation.py -v
  ```
- **Expected Outcome**:
  - Missing or expired (> 300s) `X-Automation-Timestamp` returns `401 Unauthorized`.
  - Mismatched `X-Automation-Signature` returns `403 Forbidden`.
  - Valid signature with invalid payload (e.g., non-`main` branch, non-doc file path `src/index.ts`, invalid `intent_category`, or extra fields) returns `422 Unprocessable Entity`.

---

### Scenario 2: Verify Idempotent GitHub-to-RAG Documentation Sync (`US1`, `FR-001`–`FR-004`, `SC-001`, `SC-002`)
- **Action**:
  1. Trigger a signed `POST /api/v1/automation/docs-sync` request with `delivery_id = "test-delivery-001"`, `commit_sha = "abc12345"`, and updated `README.md` / `docs/resume.md` content.
  2. Replay the exact same payload with `delivery_id = "test-delivery-001"`.
  3. Trigger a push payload modifying only `frontend/src/app/page.tsx` via the n8n GitHub-to-RAG workflow.
- **Expected Outcome**:
  - First call returns `200 OK` with `"status": "synced"` and updates `public.resume_chunks` + records `public.doc_sync_events`.
  - Replay call returns `200 OK` with `"status": "duplicate_ignored"` and `"chunks_upserted": 0` (zero duplicate rows in `public.resume_chunks`).
  - Code-only push is ignored with zero re-indexing calls.

---

### Scenario 3: Verify Non-Blocking Contact Submission & Lead Triage (`US2`, `FR-005`–`FR-007`, `SC-003`, `SC-004`)
- **Action**:
  1. Submit a visitor inquiry to `POST /api/v1/contact` (both with n8n reachable and with `N8N_CONTACT_WEBHOOK_URL` unreachable).
  2. Complete the triage callback via `POST /api/v1/automation/contact-triage` (signed with HMAC-SHA256) and inspect `public.contact_inquiries`.
- **Expected Outcome**:
  - `POST /api/v1/contact` responds `201 Created` in `< 1000ms` even when n8n is unreachable.
  - Inquiry is classified into `recruiter`, `freelance project`, or `general inquiry` (with ambiguous/short messages defaulting to `general inquiry`), Discord notification is dispatched, and `public.contact_inquiries.triage_status` transitions from `'pending'` to `'classified'`.

---

### Scenario 4: Verify Scheduled Weekly Watchdog & Stale Chunk Cleanup (`US3`, `FR-008`, `FR-009`, `SC-006`)
- **Action**:
  1. Mark a test chunk in `public.resume_chunks` as `is_active = false` (stale/orphaned).
  2. Trigger `POST /api/v1/automation/watchdog/cleanup` (signed with HMAC-SHA256) with `auto_clean: true`.
  3. Re-run `POST /api/v1/automation/watchdog/cleanup` when all chunks are active and `frontend_healthy = true`, `backend_healthy = true`.
- **Expected Outcome**:
  - First run deletes the stale chunk, records a `public.watchdog_runs` row with `"status": "cleaned"`, and returns `"alert_required": true` with the deleted chunk key summary for Discord alerting.
  - Second run deletes `0` chunks, records `"status": "healthy"`, and returns `"alert_required": false` (no false-positive alert).

---

### Scenario 5: Frontend TypeScript, Linter & Vitest Quality Gates (Constitution Principle IV)
- **Command**:
  ```powershell
  cd frontend
  npx tsc --noEmit
  npm run lint
  npm test -- --run
  ```
- **Expected Outcome**: Zero TypeScript errors, zero ESLint warnings/errors, and all Vitest suites (including `ContactSection` form submission and `visual-system.test.tsx` anti-vibe-coding checks) pass.
