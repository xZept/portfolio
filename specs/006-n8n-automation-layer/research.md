# Phase 0 Research: n8n Automation Layer for Asynchronous Background Workflows

**Feature**: `006-n8n-automation-layer`  
**Date**: 2026-11-16  
**Spec**: `specs/006-n8n-automation-layer/spec.md`

---

## 1. Live Supabase MCP Database Inspection (Pre-Design Baseline)

Per Constitution Principle V (*Git-First Database Migrations via Supabase MCP*), the live Supabase project `iixpswqqkxfghbujdnha` (`portfolio`) was inspected via `supabase_mcp` (`list_tables`, `list_migrations`):

- **Existing Tables in `public`**:
  1. `public.resume_chunks` (RLS enabled, `7` seeded rows): stores grounded knowledge chunks with `chunk_key` (`UNIQUE`), `section`, `badge_label`, `target_section_id`, `target_card_id`, `project_id`, `content`, `metadata` (`jsonb`), `embedding` (`extensions.vector(768)`), `created_at`, and `updated_at`.
  2. `public.resume_query_logs` (RLS enabled, `2` rows): stores RAG telemetry (`question`, `context_project_id`, `mode`, `latency_ms`, `created_at`) with a daily 30-day `pg_cron` retention job.
- **Migration History**:
  - `apps/api/migrations/001_resume_chunks_and_rpc.sql` (and `supabase/migrations/001_resume_rag.sql`) established the initial RAG schema.
  - All new DDL for the n8n automation layer MUST be authored first as `apps/api/migrations/002_automation_layer.sql` (and mirrored to `supabase/migrations/002_automation_layer.sql`) before applying via `supabase_mcp`.

---

## 2. Research Decisions & Rationale

### Decision 1: Callback Authentication Protocol (HMAC-SHA256 Timestamped Signatures)
- **Decision**: Authenticate all requests from n8n to backend `/api/v1/automation/*` endpoints using a dual-header HMAC-SHA256 scheme:
  - `X-Automation-Timestamp`: Unix epoch timestamp in seconds (e.g., `1794807702`).
  - `X-Automation-Signature`: `sha256=<hex_digest>` where `<hex_digest> = HMAC_SHA256(AUTOMATION_WEBHOOK_SECRET, f"{timestamp}.{raw_body_utf8}")`.
  - Backend FastAPI dependency (`verify_automation_signature`) reads the raw request body bytes, verifies that both headers are present and that `abs(now - timestamp) <= 300` seconds (returning `401 Unauthorized` if missing, non-numeric, or expired), and compares the computed digest using constant-time `hmac.compare_digest` (returning `403 Forbidden` on signature mismatch).
- **Rationale**: Prevents both unauthorized external calls and replay attacks while remaining simple to compute in an n8n `Code` node (`crypto.createHmac('sha256', $env.AUTOMATION_WEBHOOK_SECRET)`) and in Python's standard `hmac` / `hashlib` library without external auth dependencies.
- **Alternatives Considered**:
  - *Static Bearer Token / API Key*: Vulnerable to replay if intercepted; does not bind the signature to the exact request body and timestamp.
  - *Mutual TLS (mTLS)*: Difficult to manage across Render container termination and local Docker Compose development.

---

### Decision 2: Idempotent GitHub-to-RAG Documentation Sync (`README.md` & `docs/**/*.md`)
- **Decision**:
  1. **n8n Filtering & Extraction**: The n8n GitHub Push webhook workflow inspects `body.ref === "refs/heads/main"`. It collects `added`, `modified`, and `removed` file paths across `body.commits[]`, filtering strictly with regex `^(README\.md|docs\/.+\.md)$`. If a file is both modified and later removed in the same push, the final state in the push wins. If zero matching documentation files changed, the workflow exits immediately (`noop`).
  2. **Content Fetching & Callback**: For each added/modified documentation file, n8n fetches the raw markdown content from GitHub (or passes the markdown content provided in the sync payload) and sends a signed `POST /api/v1/automation/docs-sync` request containing `delivery_id` (`X-GitHub-Delivery`), `commit_sha` (`body.after`), `upserted_files` (`[{ file_path, content }]`), and `removed_files` (`[file_path]`).
  3. **Backend Idempotency & Vector Hygiene**:
     - `public.doc_sync_events` records `delivery_id` (`UNIQUE`) and `commit_sha`. If `delivery_id` was already processed with `status = 'completed'`, the backend returns `200 OK` with `status = "duplicate_ignored"` and `chunks_upserted = 0` without re-embedding.
     - `public.resume_chunks` is extended with `source_path TEXT NOT NULL DEFAULT 'docs/resume.md'`, `commit_sha TEXT NULL`, `content_hash TEXT NOT NULL DEFAULT ''`, and `is_active BOOLEAN NOT NULL DEFAULT true`.
     - When a documentation file is synced, the backend parses it into deterministic chunks, computes a SHA-256 `content_hash` per chunk, embeds only chunks whose `content_hash` changed (or that are new) via `gemini-embedding-2` (`768` dimensions), upserts them into `public.resume_chunks` with the current `commit_sha` and `is_active = true`, and marks any prior chunks for that `source_path` that are no longer present in the file (or any chunks belonging to `removed_files`) as `is_active = false` (stale/orphaned) or deletes them immediately.
     - `public.match_resume_chunks` RPC filters `WHERE rc.is_active = true` so removed or superseded documentation chunks never appear in visitor RAG answers.
- **Rationale**: Guarantees 100% idempotency on duplicate webhook retries (`SC-002`), avoids redundant Gemini embedding API calls when content hashes match, and cleanly supports both `docs/resume.md` and general `README.md` / `docs/**/*.md` files while preserving existing portfolio card citation targets (`badge_label`, `target_section_id`, `target_card_id`).
- **Alternatives Considered**:
  - *Truncating `public.resume_chunks` on every push*: Would cause momentary empty retrieval windows during re-indexing and waste Gemini embedding quota on unchanged files.
  - *Embedding directly inside n8n*: Splits chunking/citation-mapping logic across Python and JavaScript; keeping chunking and `gemini-embedding-2` calls in FastAPI reuses `seed_resume_chunks.py` and enforces Pydantic 2.14.3 validation.

---

### Decision 3: Non-Blocking Contact Form Submission & Lead Triage Pipeline
- **Decision**:
  1. **Visitor Contact Endpoint (`POST /api/v1/contact`)**: Accepts a validated `ContactSubmissionRequest` (`name`, `email`, `message`, optional `subject`), inserts a record into `public.contact_inquiries` (`triage_status = 'pending'`), registers a FastAPI `BackgroundTasks` task (`dispatch_contact_to_n8n`) with a `3.0s` timeout and exception guard, and immediately returns `201 Created` to the browser.
  2. **Neo-Brutalist Contact Form UI (`ContactSection.tsx`)**: Enhances the `06 / Contact` section with an accessible, Neo-Brutalist Sky Blue contact form alongside the existing direct email / copy-email card so visitors can submit inquiries directly on the page while retaining one-click email access.
  3. **n8n Triage & Discord Notification**: The n8n Contact Lead Triage workflow receives the webhook payload, classifies intent into exactly one of `recruiter`, `freelance project`, or `general inquiry` (using Gemini `gemini-3.5-flash-lite` structured classification with a deterministic keyword classifier fallback that defaults ambiguous/short messages to `general inquiry`), posts a rich embed/message to `DISCORD_WEBHOOK_URL`, and calls back `POST /api/v1/automation/contact-triage` (signed with HMAC-SHA256) to update `public.contact_inquiries` with `intent_category`, `triage_status = 'classified'`, and `notified_at`.
- **Rationale**: Decoupling persistence + HTTP response from n8n execution via FastAPI `BackgroundTasks` guarantees `< 1s` p95 form confirmation (`SC-003`) and zero lead loss (`FR-005`) even if n8n or Discord is temporarily unreachable.
- **Alternatives Considered**:
  - *Synchronous n8n call during `POST /api/v1/contact`*: Violates `FR-005` and `SC-003` because LLM classification + Discord webhook latency or n8n downtime would block or fail the visitor's submission.
  - *Frontend posting directly to n8n webhook*: Exposes the n8n webhook URL to browser CORS/abuse and risks losing leads if n8n is down before database persistence.

---

### Decision 4: Weekly Health & Index Hygiene Watchdog with Automated Stale Chunk Cleanup
- **Decision**:
  1. **n8n Schedule & Probes**: An n8n `Schedule Trigger` node runs every 7 days (`0 9 * * 1`, Monday 09:00 `Asia/Manila`). It performs HTTP health checks against `FRONTEND_PUBLIC_URL` and `BACKEND_PUBLIC_URL/api/v1/health` (with `continueOnFail: true` so outages are captured rather than aborting the workflow).
  2. **Authenticated Stale-Chunk Inspection & Cleanup**: n8n invokes `POST /api/v1/automation/watchdog/cleanup` (signed with HMAC-SHA256), passing the observed `frontend_healthy`, `backend_healthy`, `frontend_latency_ms`, `backend_latency_ms`, and `auto_clean: true`. The backend identifies any stale/orphaned chunks in `public.resume_chunks` (rows where `is_active = false`, or rows whose `source_path` has a newer `commit_sha` sync event and mismatched `commit_sha`), deletes them from `public.resume_chunks`, records a row in `public.watchdog_runs`, and returns `stale_chunks_found`, `stale_chunks_deleted`, `deleted_chunk_keys`, and `alert_required`.
  3. **Conditional Discord Alerting**: If `frontend_healthy === false`, `backend_healthy === false`, or `stale_chunks_deleted > 0`, n8n dispatches a formatted alert to `DISCORD_WEBHOOK_URL` summarizing endpoint statuses and cleaned chunk counts (`FR-008`, `FR-009`). If all checks pass and `stale_chunks_deleted === 0`, no Discord alert is sent (`US3 Acceptance Scenario 1`).
- **Rationale**: Consolidates stale-chunk detection, deletion, and audit logging into an atomic, HMAC-authenticated backend operation while allowing n8n to orchestrate the external frontend/backend HTTP probes and Discord alert delivery.
- **Alternatives Considered**:
  - *Direct Postgres connection from n8n to delete chunks*: Bypasses FastAPI Pydantic validation and HMAC callback authentication required by `FR-010` and `FR-011`.
