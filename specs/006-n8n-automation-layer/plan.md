# Implementation Plan: n8n Automation Layer for Asynchronous Background Workflows

**Branch**: `006-n8n-automation-layer` | **Date**: 2026-11-16 | **Spec**: `specs/006-n8n-automation-layer/spec.md`

**Input**: Feature specification from `specs/006-n8n-automation-layer/spec.md`

## Summary

Deliver the **n8n 2.47 Automation Layer** (`automation/n8n/`), its authenticated FastAPI 0.162.5 + Pydantic 2.14.3 callback endpoints (`backend/`), Neo-Brutalist Contact Inquiry submission flow (`frontend/`), and Supabase PostgreSQL schema extensions (`apps/api/migrations/002_automation_layer.sql`) powering three asynchronous background workflows:

1. **GitHub-to-RAG Documentation Sync (P1)**: Listens for GitHub `main` branch push events, filters strictly for `README.md` and `docs/**/*.md` changes (ignoring non-documentation commits and non-`main` branches), re-indexes added/modified markdown files into `public.resume_chunks` using `gemini-embedding-2` (`768` dimensions), deactivates/removes vector chunks for deleted files, and deduplicates webhook retries idempotently via `public.doc_sync_events` (`delivery_id` + `commit_sha` + `content_hash`).
2. **Asynchronous Contact Lead Triage & Instant Notification (P2)**: Adds a non-blocking `POST /api/v1/contact` endpoint and Neo-Brutalist Sky Blue inquiry form in `ContactSection.tsx` that persists inquiries into `public.contact_inquiries` (`triage_status = 'pending'`) and returns `< 1s` confirmation to the visitor while asynchronously firing the n8n triage workflow (`BackgroundTasks`). n8n classifies each inquiry into `recruiter`, `freelance project`, or `general inquiry` (using `gemini-3.5-flash-lite` with deterministic fallback), dispatches a formatted Discord webhook alert (`DISCORD_WEBHOOK_URL`), and updates the inquiry record via a signed callback to `POST /api/v1/automation/contact-triage`.
3. **Scheduled Weekly Health & Index Watchdog (P3)**: Runs weekly (`0 9 * * 1` in n8n) to verify frontend and backend availability, calls the authenticated `POST /api/v1/automation/watchdog/cleanup` endpoint to automatically purge stale/orphaned vector chunks (`is_active = false` or superseded file revisions) from `public.resume_chunks`, records an audit log in `public.watchdog_runs`, and dispatches a Discord alert whenever an endpoint degrades or stale chunks are cleaned.
4. **Cryptographic Callback Security**: Every `/api/v1/automation/*` endpoint verifies `X-Automation-Timestamp` (`±300s` replay window; `401 Unauthorized` if missing/expired) and `X-Automation-Signature` (`HMAC-SHA256` over `{timestamp}.{raw_body}`; `403 Forbidden` if invalid) before validating payloads with strict Pydantic 2.14.3 schemas (`extra="forbid"`, `422 Unprocessable Entity` on malformed inputs).

## Technical Context

**Language/Version**: Python 3.13 (Backend API), TypeScript 5.8 (Frontend: React 19.3 + Next.js 16.4.5 Active LTS), n8n 2.47 (Docker workflow automation), SQL / PL/pgSQL (Supabase PostgreSQL)

**Primary Dependencies**:
- **Automation Layer**: `n8nio/n8n:2.47.0` (`automation/n8n/docker-compose.yml`), exported workflow definitions (`automation/n8n/workflows/*.workflow.json`)
- **Backend**: `fastapi==0.162.5`, `pydantic==2.14.3`, `google-genai` (`gemini-3.5-flash-lite`, `gemini-embedding-2`), `langchain==0.3.*`, `langchain-google-genai`, `psycopg[binary]`, `httpx`
- **Frontend**: `next@16.4.5`, `react@19.3.0`, `tailwindcss@4.1`, `lucide-react`
- **Database & Vector Store**: Supabase PostgreSQL (`pgvector` `0.8.2` + `pg_cron` `1.6.4`) managed via `supabase_mcp`

**Storage**:
- **Supabase PostgreSQL (`iixpswqqkxfghbujdnha`)**:
  - Extended `public.resume_chunks` (`source_path`, `commit_sha`, `content_hash`, `is_active`)
  - `public.doc_sync_events` (idempotent webhook delivery ledger by `delivery_id`)
  - `public.contact_inquiries` (visitor contact submissions + async triage state)
  - `public.watchdog_runs` (weekly health & stale-chunk cleanup audit log)

**Testing**:
- **Backend**: `pytest` + `httpx` (`backend/tests/test_automation_validation.py` and `backend/tests/test_ask_resume_validation.py`) covering HMAC-SHA256 `401`/`403` rejection, Pydantic 2.14.3 `422` validation, idempotent doc sync, non-blocking contact submission + triage callback, and watchdog stale-chunk cleanup
- **Frontend**: `tsc --noEmit`, `next lint`, Vitest + React Testing Library (`frontend/tests/ask-resume-and-contact.test.tsx`, `frontend/tests/visual-system.test.tsx`)
- **Database**: Supabase MCP (`list_tables`, `apply_migration`, `execute_sql`, `get_advisors`)

**Target Platform**: Linux containers on Render (FastAPI backend & n8n 2.47 Docker service), Vercel (Next.js frontend), and Supabase (`ap-southeast-2`).

**Project Type**: Full-stack web application & workflow automation monorepo (`automation/n8n/`, `backend/`, `frontend/`, `apps/api/migrations/`, `supabase/migrations/`).

**Performance Goals**:
- Visitor contact form submission (`POST /api/v1/contact`) returns confirmation in `< 1000ms` p95 (`SC-003`), completely decoupled from n8n triage and Discord notification latency.
- GitHub push documentation sync completes within `< 120s` of push (`SC-001`) with `0` duplicate chunks on repeated webhook deliveries (`SC-002`).
- Weekly watchdog probe + stale chunk cleanup executes within `< 5 minutes` and alerts immediately on failure or cleanup (`SC-006`).

**Constraints**:
- All `/api/v1/automation/*` callbacks MUST verify HMAC-SHA256 signatures (`X-Automation-Timestamp` + `X-Automation-Signature`) and reject unsigned/expired (`401`), invalidly signed (`403`), or schema-invalid (`422`) requests before mutating state (`FR-010`, `FR-011`, `SC-005`).
- All UI additions in `ContactSection.tsx` MUST strictly obey Neo-Brutalist Sky Blue tokens (`#F8FAFC`, `#FFFFFF`, `2px solid #0F172A`, `4px 4px 0px #0F172A`, `#38BDF8`, `#0284C7`; zero blur, zero glassmorphism, zero purple/pink gradients) (Principles II & III).
- Database schema changes MUST be committed to `apps/api/migrations/002_automation_layer.sql` before applying via `supabase_mcp` (Principle V).

**Scale/Scope**: 3 n8n 2.47 workflow JSON definitions, 4 new FastAPI endpoints (`POST /api/v1/contact`, `POST /api/v1/automation/docs-sync`, `POST /api/v1/automation/contact-triage`, `POST /api/v1/automation/watchdog/cleanup`), 3 new database tables + 1 extended table in `002_automation_layer.sql`, and 1 enhanced frontend Contact section form with full unit/integration test coverage.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Constitution Principle | Pre-Research Check | Post-Design Check | Evidence / Enforcement Mechanism |
| :--- | :--- | :--- | :--- |
| **I. Pinned Monorepo Stack Discipline** | PASS | PASS | Uses n8n `2.47.0` (`automation/n8n/docker-compose.yml`), Python 3.13 + FastAPI `0.162.5` + Pydantic `2.14.3` (`backend/`), Gemini `gemini-3.5-flash-lite` + `gemini-embedding-2`, React `19.3` + Next.js `16.4.5` + TypeScript `5.8` + Tailwind CSS `v4.1` (`frontend/`), and Supabase PostgreSQL + `pgvector` + `pg_cron`. |
| **II. Neo-Brutalist Sky Blue Visual System** | PASS | PASS | Contact inquiry form in `ContactSection.tsx` uses `#FFFFFF` / `#F8FAFC` surfaces, `2px solid #0F172A` borders, `4px 4px 0px #0F172A` hard offset shadows, `#38BDF8` (`sky-400`) primary CTAs, and `#0284C7` (`sky-600`) hover states (`contracts/ui-contracts.md`). |
| **III. Anti-Vibe-Coding Visual Discipline (NON-NEGOTIABLE)** | PASS | PASS | Zero `backdrop-blur`, zero blurred shadows (`shadow-sm`..`shadow-2xl`), and zero purple/pink gradients; enforced by `frontend/tests/visual-system.test.tsx`. |
| **IV. Strict Type Safety & Validation Gates (NON-NEGOTIABLE)** | PASS | PASS | Explicit Pydantic 2.14.3 schemas (`ConfigDict(extra="forbid")`) in `backend/app/schemas/automation.py` with automated `pytest` tests (`backend/tests/test_automation_validation.py`), plus `tsc --noEmit` and `next lint` with zero errors/warnings. |
| **V. Git-First Database Migrations via Supabase MCP (NON-NEGOTIABLE)** | PASS | PASS | Live Supabase project `iixpswqqkxfghbujdnha` inspected via `supabase_mcp` (`list_tables`, `list_migrations`). Full DDL authored for `apps/api/migrations/002_automation_layer.sql` (and mirrored in `supabase/migrations/002_automation_layer.sql`) prior to `apply_migration`, preserving backward compatibility for `match_resume_chunks` callers. n8n's internal persistence (`n8n_data` Docker volume) is strictly isolated from Supabase PostgreSQL. |

## Project Structure

### Documentation (this feature)

```text
specs/006-n8n-automation-layer/
├── plan.md                                  # This file (/speckit-plan command output)
├── research.md                              # Phase 0 output: MCP baseline, HMAC auth, sync, triage & watchdog decisions
├── data-model.md                            # Phase 1 output: Postgres tables, state transitions & Pydantic 2.14.3 schemas
├── quickstart.md                            # Phase 1 output: End-to-end validation scenarios & commands
├── contracts/                               # Phase 1 output (/speckit-plan command)
│   ├── database-contracts.md                # SQL DDL contract for 002_automation_layer.sql & RLS policies
│   ├── api-contracts.md                     # FastAPI endpoints & HMAC-SHA256 authentication contract
│   ├── n8n-workflows-contract.md            # n8n 2.47 workflow node graphs, env vars & Discord alert payloads
│   └── ui-contracts.md                      # Neo-Brutalist ContactSection inquiry form UI contract
└── tasks.md                                 # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
apps/
└── api/
    └── migrations/
        ├── 001_resume_chunks_and_rpc.sql            # Existing RAG schema migration
        └── 002_automation_layer.sql                 # New Git-first migration for doc sync, contact triage & watchdog

supabase/
└── migrations/
    ├── 001_resume_rag.sql                           # Existing mirrored migration
    └── 002_automation_layer.sql                     # Mirrored Supabase CLI migration

automation/
└── n8n/
    ├── docker-compose.yml                           # n8nio/n8n:2.47.0 service definition + automation env vars
    ├── .env.example                                 # Documented n8n environment variables
    └── workflows/
        ├── github-rag-sync.workflow.json            # US1: GitHub main push -> filter docs -> HMAC callback
        ├── contact-lead-triage.workflow.json        # US2: Contact webhook -> classify intent -> Discord + HMAC callback
        └── weekly-watchdog.workflow.json            # US3: Weekly cron -> health probes -> cleanup callback + Discord alert

backend/                                             # Python 3.13 + FastAPI 0.162.5 + Pydantic 2.14.3
├── .env.example                                     # Updated with AUTOMATION_WEBHOOK_SECRET, N8N_CONTACT_WEBHOOK_URL, DISCORD_WEBHOOK_URL
├── app/
│   ├── config.py                                    # Extended Settings with automation & webhook configuration
│   ├── api/
│   │   ├── routes.py                                # Includes automation & contact routes
│   │   └── automation_routes.py                     # POST /api/v1/contact & HMAC-authenticated /api/v1/automation/* endpoints
│   ├── schemas/
│   │   ├── ask_resume.py                            # Existing Ask My Resume schemas
│   │   └── automation.py                            # Pydantic 2.14.3 schemas for docs-sync, contact, triage & watchdog
│   └── services/
│       ├── automation_security.py                   # HMAC-SHA256 timestamp + signature verification dependency
│       ├── automation_service.py                    # Idempotent doc sync, non-blocking contact dispatch, intent classifier & watchdog cleanup
│       ├── rag_service.py                           # Existing RAG service
│       └── seed_resume_chunks.py                    # Extended chunk parser reusable for README.md & docs/**/*.md
└── tests/
    ├── test_ask_resume_validation.py                # Existing RAG validation & guardrail tests
    └── test_automation_validation.py                # New HMAC auth (401/403), Pydantic (422), idempotency, contact & watchdog tests

frontend/                                            # Next.js 16.4.5 + React 19.3 + TypeScript 5.8 + Tailwind CSS v4.1
├── src/
│   ├── components/
│   │   └── sections/
│   │       └── ContactSection.tsx                   # Enhanced with Neo-Brutalist contact inquiry form + non-blocking submit state
│   └── lib/
│       └── contact-client.ts                        # Typed client for POST /api/v1/contact
└── tests/
    ├── ask-resume-and-contact.test.tsx              # Extended with contact form submission & resilience tests
    └── visual-system.test.tsx                       # Verifies strict Neo-Brutalist visual compliance
```

**Structure Decision**: Extends the existing monorepo layout (`automation/n8n/`, `backend/`, `frontend/`, `apps/api/migrations/`, `supabase/migrations/`) cleanly separating n8n 2.47 workflow JSON exports under `automation/n8n/workflows/`, FastAPI automation schemas/routes/services under `backend/app/`, and versioned SQL migrations under `apps/api/migrations/002_automation_layer.sql`.

## Complexity Tracking

> **No Constitution Check violations exist. All five Core Principles and all four Mandatory Quality Gates are satisfied.**
