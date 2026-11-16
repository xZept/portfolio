---

description: "Actionable, dependency-ordered task list for implementing the n8n Automation Layer"
---

# Tasks: n8n Automation Layer for Asynchronous Background Workflows

**Input**: Design documents from `/specs/006-n8n-automation-layer/`  
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: Included per Constitution Principle IV (*Strict Type Safety & Validation Gates*), requiring automated Pydantic 2.14.3 validation tests for every FastAPI endpoint and `tsc --noEmit` / `next lint` / Vitest verification on frontend changes.

**Organization**: Tasks are grouped by user story (`US1`, `US2`, `US3`) to enable independent implementation and testing of each increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`)
- Every task includes exact repository-relative file paths and explicit schema/validation constraints

---

## Phase 1: Setup (Shared Infrastructure & Environment)

**Purpose**: Configure n8n 2.47 Docker service environment variables and extend FastAPI settings for automation webhooks and Discord notifications.

- [X] T001 Create n8n environment template with `N8N_HOST`, `N8N_PORT`, `N8N_PROTOCOL`, `GENERIC_TIMEZONE`, `BACKEND_API_BASE_URL`, `FRONTEND_PUBLIC_URL`, `AUTOMATION_WEBHOOK_SECRET`, `DISCORD_WEBHOOK_URL`, `GEMINI_API_KEY`, and `GITHUB_RAW_BASE_URL` in `automation/n8n/.env.example`
- [X] T002 Update n8n 2.47 Docker Compose definition to pass `BACKEND_API_BASE_URL`, `FRONTEND_PUBLIC_URL`, `AUTOMATION_WEBHOOK_SECRET`, `DISCORD_WEBHOOK_URL`, `GEMINI_API_KEY`, and `GITHUB_RAW_BASE_URL` into `n8nio/n8n:2.47.0`, keep n8n's internal persistence isolated in the local `n8n_data` volume (never sharing Supabase Postgres), and mount `./workflows:/home/node/workflows:ro` in `automation/n8n/docker-compose.yml`
- [X] T003 [P] Add `AUTOMATION_WEBHOOK_SECRET`, `N8N_CONTACT_WEBHOOK_URL`, `DISCORD_WEBHOOK_URL`, `FRONTEND_PUBLIC_URL`, and `BACKEND_PUBLIC_URL` placeholders to `backend/.env.example`
- [X] T004 [P] Extend `Settings` in `backend/app/config.py` with `automation_webhook_secret`, `n8n_contact_webhook_url`, `discord_webhook_url`, `frontend_public_url`, and `backend_public_url` fields (defaulting safely to `""`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish Git-first database schema extensions via Supabase MCP, HMAC-SHA256 callback authentication, and strict Pydantic 2.14.3 request/response schemas before any user story endpoints are implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 Author versioned SQL migration `002_automation_layer.sql` extending `public.resume_chunks` (`source_path` CHECK `source_path = 'README.md' OR source_path LIKE 'docs/%.md'`, `commit_sha`, `content_hash`, `is_active`), updating `public.match_resume_chunks` to filter `rc.is_active = true`, creating `public.doc_sync_events`, `public.contact_inquiries`, and `public.watchdog_runs` with RLS (`service_role`-only on new tables, `is_active = true` public read on `resume_chunks`), and scheduling `pg_cron` 90-day retention in `apps/api/migrations/002_automation_layer.sql`
- [X] T006 [P] Mirror identical SQL migration DDL to `supabase/migrations/002_automation_layer.sql`
- [X] T007 Apply `apps/api/migrations/002_automation_layer.sql` to Supabase project `iixpswqqkxfghbujdnha` via `supabase_mcp` (`apply_migration`) and verify table creation and security/performance lints via `list_tables` and `get_advisors` (depends on T005)
- [X] T008 [P] Implement HMAC-SHA256 timestamped signature verification dependency `verify_automation_signature` in `backend/app/services/automation_security.py` failing closed when `AUTOMATION_WEBHOOK_SECRET` is unconfigured (`503`/`401`), checking `X-Automation-Timestamp` (`±300` seconds window, `401 Unauthorized` on missing/non-integer/expired), and verifying `X-Automation-Signature` (`sha256=<hex>` over `f"{timestamp}.{raw_body}"` via `hmac.compare_digest`, `401 Unauthorized` if missing, `403 Forbidden` on mismatch)
- [X] T009 [P] Define strict Pydantic 2.14.3 schemas (`ConfigDict(extra="forbid")`) for `DocFilePayload` (`file_path` regex `^(README\.md|docs/[A-Za-z0-9_./-]+\.md)$` with `..` traversal rejection, `content` `0..200000` chars), `DocsSyncCallbackRequest`/`Response` (`branch: Literal["main"]`, `delivery_id` `3..128`, `commit_sha` `7..64`), `ContactSubmissionRequest`/`Response` (`name` `2..120`, `email` `5..254`, `subject <= 200`, `message` `2..4000`), `ContactTriageCallbackRequest`/`Response` (`intent_category: Literal["recruiter", "freelance project", "general inquiry"]`, `triage_summary` `1..1000`), and `WatchdogCleanupCallbackRequest`/`Response` in `backend/app/schemas/automation.py`
- [X] T010 Create FastAPI router `automation_router` in `backend/app/api/automation_routes.py` and mount it into the `/api/v1` API router in `backend/app/api/routes.py` (and ensure `backend/app/main.py` CORS allows `POST` and `OPTIONS`)

**Checkpoint**: Foundation ready — database schema, HMAC-SHA256 guard, Pydantic 2.14.3 schemas, and router wiring are in place.

---

## Phase 3: User Story 1 - Automated Knowledge Base Synchronization on Documentation Updates (Priority: P1) 🎯 MVP

**Goal**: Automatically re-index added/modified `README.md` and `docs/**/*.md` files pushed to `main` into `public.resume_chunks`, deactivate/remove chunks for deleted files, and handle duplicate webhook deliveries idempotently while rejecting unsigned or malformed callbacks.

**Independent Test**: Run `pytest backend/tests/test_automation_validation.py -k docs_sync` and simulate a GitHub push webhook to `automation/n8n/workflows/github-rag-sync.workflow.json` verifying: (1) `README.md` / `docs/**/*.md` updates upsert chunks cleanly, (2) non-doc or non-`main` pushes are ignored, (3) duplicate `delivery_id` replays return `duplicate_ignored` with `chunks_upserted = 0`, and (4) unsigned/malformed callbacks return `401`/`403`/`422`.

### Tests for User Story 1

- [X] T011 [P] [US1] Write Pydantic 2.14.3 validation, HMAC-SHA256 auth (`401`/`403`), path-traversal/branch rejection (`422`), and idempotent `delivery_id` deduplication tests for `POST /api/v1/automation/docs-sync` in `backend/tests/test_automation_validation.py`

### Implementation for User Story 1

- [X] T012 [US1] Extend `backend/app/services/seed_resume_chunks.py` with reusable helpers to parse general markdown (`README.md` and `docs/**/*.md`) into deterministic `SeedChunk` records with SHA-256 `content_hash` and `source_path` metadata while preserving the 5 canonical portfolio citation badges for `docs/resume.md` (mapping non-resume doc chunks to valid `CHECK`-constrained defaults: `target_section_id="about"` and canonical `badge_label` inferred by content or defaulting to `"[Work: Orani Suhay Foundation]"` / `"[Project: FitQuest]"` so inserts satisfy `resume_chunks` constraints)
- [X] T013 [US1] Implement `process_docs_sync_event` in `backend/app/services/automation_service.py` to check `public.doc_sync_events` by `delivery_id` for idempotency (`status = 'completed'` → return `duplicate_ignored`; `status = 'failed'` → allow retry), compute `content_hash` diffs, embed all changed/new chunks via `gemini-embedding-2` (`768` dims) before DB mutation (marking `doc_sync_events` `status = 'failed'` on embedding error), upsert into `public.resume_chunks` with `is_active = true`, mark removed/superseded/empty-file chunks as `is_active = false`, and record the completed `doc_sync_events` row
- [X] T014 [US1] Implement `POST /api/v1/automation/docs-sync` endpoint protected by `Depends(verify_automation_signature)` in `backend/app/api/automation_routes.py`
- [X] T015 [US1] Author exportable n8n 2.47 workflow `automation/n8n/workflows/github-rag-sync.workflow.json` with GitHub push webhook trigger, `refs/heads/main` + `^(README\.md|docs\/.+\.md)$` filter node, raw markdown content fetcher, HMAC-SHA256 signer (`X-Automation-Timestamp` + `X-Automation-Signature`), and `POST /api/v1/automation/docs-sync` HTTP Request node

**Checkpoint**: User Story 1 (MVP) is complete and independently testable via `pytest` and n8n webhook replay.

---

## Phase 4: User Story 2 - Asynchronous Contact Lead Triage & Instant Notification (Priority: P2)

**Goal**: Provide a Neo-Brutalist Sky Blue contact inquiry form and `POST /api/v1/contact` endpoint that persists inquiries immediately (`< 1s` p95), triggers n8n triage asynchronously via `BackgroundTasks`, classifies intent into `recruiter`, `freelance project`, or `general inquiry`, dispatches a Discord webhook notification, and updates `public.contact_inquiries` via an authenticated callback.

**Independent Test**: Submit a contact inquiry via `POST /api/v1/contact` (both with n8n reachable and unreachable) to confirm `201 Created` returns immediately with `triage_status = "pending"`, run `pytest backend/tests/test_automation_validation.py -k contact`, and run `npm test -- --run` in `frontend/` to verify `ContactSection.tsx` form submission and existing direct-email tests pass.

### Tests for User Story 2

- [X] T016 [P] [US2] Add `POST /api/v1/contact` (`201 Created`, `422` validation, non-blocking dispatch even when n8n times out) and `POST /api/v1/automation/contact-triage` (`401`/`403`/`422` + `intent_category` persistence) tests to `backend/tests/test_automation_validation.py`
- [X] T017 [P] [US2] Add React Testing Library tests for the Neo-Brutalist Contact inquiry form submission, non-blocking confirmation banner (`data-testid="contact-form-success"`), and validation states while preserving all existing email/copy tests in `frontend/tests/ask-resume-and-contact.test.tsx`

### Implementation for User Story 2

- [X] T018 [US2] Implement `submit_contact_inquiry`, `dispatch_contact_to_n8n` (3s `httpx` timeout with 1 retry after 1s backoff and logged exception guard marking `triage_status = 'failed'` on exhaustion), and `record_contact_triage_result` in `backend/app/services/automation_service.py`
- [X] T019 [US2] Implement public `POST /api/v1/contact` (`201 Created` using FastAPI `BackgroundTasks`) and HMAC-protected `POST /api/v1/automation/contact-triage` endpoints in `backend/app/api/automation_routes.py`
- [X] T020 [P] [US2] Create typed frontend API client `submitContactInquiry` calling `POST ${NEXT_PUBLIC_API_BASE_URL}/api/v1/contact` in `frontend/src/lib/contact-client.ts`
- [X] T021 [US2] Add Neo-Brutalist Sky Blue contact inquiry form (`#FFFFFF` / `#F8FAFC`, `2px solid #0F172A`, `4px 4px 0px #0F172A`, `#38BDF8` CTA, `#0284C7` hover, zero blur/gradients) with accessible labels and non-blocking confirmation state to `frontend/src/components/sections/ContactSection.tsx` (depends on T020)
- [X] T022 [US2] Author exportable n8n 2.47 workflow `automation/n8n/workflows/contact-lead-triage.workflow.json` with Webhook trigger (`POST /webhook/contact-triage`), immediate `202` response, `gemini-3.5-flash-lite` + deterministic keyword fallback intent classifier (`recruiter`, `freelance project`, `general inquiry`), Discord webhook notification (`DISCORD_WEBHOOK_URL`), and HMAC-SHA256 signed callback to `POST /api/v1/automation/contact-triage`

**Checkpoint**: User Stories 1 AND 2 both work independently without blocking visitor interactions.

---

## Phase 5: User Story 3 - Scheduled Weekly Health & Index Watchdog (Priority: P3)

**Goal**: Execute a weekly scheduled check verifying frontend and backend availability, automatically deleting stale/orphaned vector chunks via an authenticated backend endpoint, recording `public.watchdog_runs` audit entries, and dispatching Discord alerts only when degradation or stale-chunk cleanup occurs.

**Independent Test**: Trigger `POST /api/v1/automation/watchdog/cleanup` with a simulated stale chunk (`is_active = false`) and verify deletion + `alert_required = true`, then re-run with healthy flags and zero stale chunks to verify `alert_required = false`; run `pytest backend/tests/test_automation_validation.py -k watchdog`.

### Tests for User Story 3

- [X] T023 [P] [US3] Add `POST /api/v1/automation/watchdog/cleanup` tests covering HMAC auth (`401`/`403`), Pydantic `422` validation, automatic deletion of stale/orphaned chunks (`status = "cleaned"`, `alert_required = true`), endpoint degradation alerting (`status = "degraded"`), and quiet healthy runs (`status = "healthy"`, `alert_required = false`) in `backend/tests/test_automation_validation.py`

### Implementation for User Story 3

- [X] T024 [US3] Implement `run_watchdog_cleanup` in `backend/app/services/automation_service.py` to count active chunks, identify and delete stale/orphaned chunks (`is_active = false`, or chunks whose `source_path` has a newer `completed` `doc_sync_events` entry with a different `commit_sha`), insert an audit record into `public.watchdog_runs`, and compute `status` (precedence: `"degraded"` if `!frontend_healthy or !backend_healthy`, else `"cleaned"` if `stale_chunks_deleted > 0`, else `"healthy"`), `alert_required`, and `alert_reasons`
- [X] T025 [US3] Implement HMAC-protected `POST /api/v1/automation/watchdog/cleanup` endpoint in `backend/app/api/automation_routes.py`
- [X] T026 [US3] Author exportable n8n 2.47 workflow `automation/n8n/workflows/weekly-watchdog.workflow.json` with weekly `Schedule Trigger` (`0 9 * * 1`, `Asia/Manila`) + manual test webhook, frontend & backend `/api/v1/health` HTTP probes (`continueOnFail: true`), HMAC-SHA256 signed call to `POST /api/v1/automation/watchdog/cleanup`, and conditional Discord webhook alert when `alert_required === true`

**Checkpoint**: All three automation user stories (US1, US2, US3) are independently functional and verified.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Run constitutional quality gates, validate n8n workflow JSONs, and verify end-to-end scenarios from `quickstart.md`.

- [X] T027 [P] Run full backend `pytest` suite (`.\.venv\Scripts\pytest -v` in `backend/`) verifying all existing RAG tests (`test_ask_resume_validation.py`) and new automation tests (`test_automation_validation.py`) pass with zero skipped assertions
- [X] T028 [P] Run frontend TypeScript, ESLint, and Vitest gates (`npx tsc --noEmit`, `npm run lint`, `npm test -- --run` in `frontend/`) confirming zero errors, zero warnings, and strict Neo-Brutalist visual compliance (`visual-system.test.tsx`)
- [X] T029 Validate all three exported n8n workflow JSON files in `automation/n8n/workflows/*.workflow.json` are valid JSON and verify `quickstart.md` scenarios against `supabase_mcp` (`get_advisors`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately (`T001`–`T004`).
- **Foundational (Phase 2)**: Depends on Setup completion — **BLOCKS** all user stories (`T005`–`T010`).
- **User Stories (Phases 3–5)**: All depend on Foundational phase completion (`T005`–`T010`):
  - **US1 (Phase 3 - P1)**, **US2 (Phase 4 - P2)**, and **US3 (Phase 5 - P3)** are independent of each other and can be implemented sequentially (`P1 → P2 → P3`) or in parallel once Phase 2 is done.
- **Polish (Phase 6)**: Depends on completion of all desired user stories (`T027`–`T029`).

### Parallel Opportunities

- **Phase 1**: `T003` (`backend/.env.example`) and `T004` (`backend/app/config.py`) can run in parallel with `T001`–`T002` (`automation/n8n/`).
- **Phase 2**: `T006` (mirrored SQL), `T008` (`automation_security.py`), and `T009` (`schemas/automation.py`) can run in parallel.
- **Phase 4 (US2)**: Frontend tasks `T017`, `T020`, `T021` can run in parallel with backend tasks `T016`, `T018`, `T019` and n8n workflow authoring `T022`.
- **Phase 6**: `T027` (backend `pytest`) and `T028` (frontend `tsc` / `lint` / `vitest`) can run in parallel.

---

## Parallel Example: User Story 2

```bash
# Run backend & frontend tests + client creation in parallel:
Task: "Add POST /api/v1/contact and /api/v1/automation/contact-triage tests in backend/tests/test_automation_validation.py"
Task: "Add React Testing Library tests for Contact inquiry form in frontend/tests/ask-resume-and-contact.test.tsx"
Task: "Create typed frontend API client in frontend/src/lib/contact-client.ts"
Task: "Author n8n workflow in automation/n8n/workflows/contact-lead-triage.workflow.json"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete **Phase 1: Setup** (`T001`–`T004`).
2. Complete **Phase 2: Foundational** (`T005`–`T010`) — commits & applies `002_automation_layer.sql` via `supabase_mcp` and sets up HMAC-SHA256 + Pydantic 2.14.3 validation.
3. Complete **Phase 3: User Story 1** (`T011`–`T015`) — delivers idempotent GitHub-to-RAG documentation sync.
4. **STOP and VALIDATE**: Run `pytest` and replay a test GitHub push webhook before moving to US2.

### Incremental Delivery

1. Setup + Foundational → Database, HMAC auth, and schemas ready.
2. Add **US1 (GitHub-to-RAG Sync)** → Test independently → MVP ready!
3. Add **US2 (Contact Lead Triage)** → Test non-blocking `< 1s` submission & Discord alert → Deploy/Demo.
4. Add **US3 (Weekly Watchdog)** → Test stale chunk cleanup & conditional Discord alert → Deploy/Demo.
5. Run **Phase 6: Polish** → All constitutional quality gates pass.
