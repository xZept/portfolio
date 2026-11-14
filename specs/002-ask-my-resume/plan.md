# Implementation Plan: Ask My Resume AI Assistant Drawer & Supabase `pgvector` RAG Schema

**Branch**: `002-ask-my-resume` | **Date**: 2026-11-14 | **Spec**: `specs/002-ask-my-resume/spec.md`

**Input**: Feature specification from `specs/002-ask-my-resume/spec.md` and user planning directive:
> "Use Supabase MCP to inspect the current database state and confirm pgvector availability, then design the `resume_chunks` schema, HNSW/IVFFlat index, and `match_resume_chunks` RPC function."

## Summary

Deliver the global **"Ask My Resume"** Neo-Brutalist AI Assistant slide-over drawer and its backing Supabase `pgvector` retrieval layer:
1. **Live Supabase MCP Database Inspection**: Inspected active Supabase project `iixpswqqkxfghbujdnha` (`portfolio`, region `ap-southeast-2`, status `ACTIVE_HEALTHY`, PostgreSQL `17.11.0.019`). Confirmed `public` schema currently has `0` tables, `0` applied migrations, and `0` custom functions, while `vector` (`pgvector` `0.8.2` supporting both `hnsw` and `ivfflat` access methods) and `pg_cron` (`1.6.4`) are available in `pg_available_extensions` and ready to enable.
2. **Database Schema, Vector Index & RPC Design**: Designed the `public.resume_chunks` table (`VECTOR(768)` for `gemini-embedding-2`, citation badge routing columns, RLS policies), evaluated **HNSW** vs **IVFFlat** indexing (selecting `HNSW` with `vector_cosine_ops`, `m = 16`, `ef_construction = 64` as primary index with `IVFFlat` documented as high-scale reference), and designed the `public.match_resume_chunks` SQL RPC function (`SECURITY INVOKER`, pinned `search_path = public, extensions`, inline project/metadata filtering, cosine similarity threshold filtering). All DDL is staged for versioned Git-first migration in `apps/api/migrations/001_resume_chunks_and_rpc.sql` (and mirrored in `supabase/migrations/001_resume_rag.sql`) per Constitution Principle V.
3. **Interactive Drawer & Streaming UX**: Designed the persistent bottom-right floating trigger button, slide-over drawer, 3 curated starter prompt chips, "Clear Chat" control, incremental token-by-token streaming with typing indicator, 5 clickable inline source citation badges (`[Work: Orani Suhay Foundation]`, `[Work: DACON Corp]`, `[Project: FitQuest]`, `[Education: BPSU]`, `[Certifications]`) that smoothly scroll to and highlight the target portfolio card, strict off-topic/hallucination guardrails, a `15 / 15 messages remaining` session counter with a `#38BDF8` session-cap banner ("Copy Email" + "Open in Gmail"), and inline stream error recovery ("Retry" + direct `mailto:` link).

## Technical Context

**Language/Version**: TypeScript 5.8 (Frontend: React 19.3 + Next.js 16.4.5 Active LTS), Python 3.13 (Backend API), SQL / PL/pgSQL (Supabase PostgreSQL)

**Primary Dependencies**:
- **Frontend**: `next@16.4.5`, `react@19.3.0`, `react-dom@19.3.0`, `tailwindcss@4.1`, `shadcn/ui` primitives restyled to Neo-Brutalist Sky Blue tokens, `lucide-react`
- **Backend**: `fastapi==0.162.5`, `pydantic==2.14.3`, `langchain==0.3.*`, `langchain-google-genai`, `google-genai`, `psycopg[binary]`, `uvicorn`
- **Database & Vector Store**: Supabase PostgreSQL (`pgvector 0.8.2` + `pg_cron 1.6.4`) inspected and managed via `supabase_mcp`

**Storage**:
- **Supabase PostgreSQL (`iixpswqqkxfghbujdnha`)**: `public.resume_chunks` (`extensions.vector(768)` with HNSW cosine index `idx_resume_chunks_embedding_hnsw`), `public.resume_query_logs` (with `pg_cron` 30-day retention schedule), and `public.match_resume_chunks(...)` RPC function.
- **Browser Session Storage**: `sessionStorage` key `allen_ask_resume_session_v1` tracking `usedMessages` (`0..15`) across "Clear Chat" actions within a browser tab session.

**Testing**:
- **Frontend**: `tsc --noEmit` (TypeScript 5.8), `next lint`, Vitest + React Testing Library (`frontend/tests/ask-resume-drawer.test.tsx`, `frontend/tests/visual-system.test.tsx`)
- **Backend**: `pytest` + `httpx` (`backend/tests/test_ask_resume_validation.py` covering Pydantic 2.14.3 schemas, off-topic refusal guardrails, SSE streaming, and `match_resume_chunks` RPC integration/fallback)
- **Database**: Supabase MCP `execute_sql` verification queries + `get_advisors` security/performance lint check

**Target Platform**: Desktop (`1440px`), tablet (`768px`), and mobile (`375px`) browsers; deployed on Vercel (frontend), Render (FastAPI backend), and Supabase (`ap-southeast-2`).

**Project Type**: Full-stack web application monorepo (`frontend/`, `backend/`, `apps/api/migrations/`, `supabase/migrations/`).

**Performance Goals**:
- First streaming token + visible typing indicator within `< 1500ms` of question submission (SC-002).
- `match_resume_chunks` HNSW vector similarity lookup in `< 10ms` for top-5 chunks over 768-dim embeddings.
- Clicking any inline source badge scrolls to and highlights the target portfolio card within `< 1000ms` (SC-003).

**Constraints**:
- Strict Neo-Brutalist Sky Blue visual tokens (`#F8FAFC` / `#FFFFFF` surfaces, `2px solid #0F172A` borders, `4px 4px 0px #0F172A` zero-blur hard offset shadows, `#38BDF8` primary accent, `#0284C7` hover accent; zero `backdrop-blur`, zero blurred shadows, zero purple/pink gradients) (Principles II & III).
- Versioned `.sql` migration file MUST be committed to `apps/api/migrations/` BEFORE applying via `supabase_mcp` `apply_migration` (Principle V).
- 100% factual grounding in `docs/resume.md` with polite refusal of off-topic, trivia, or private personal prompts (FR-010, SC-004).

**Scale/Scope**: 1 global floating trigger + slide-over drawer component system, 5 canonical portfolio card citation targets, 15-message per-session rate limit, 2 backend endpoints (`POST /api/v1/ask-resume` and `POST /api/v1/ask-resume/stream`), 2 database tables (`resume_chunks`, `resume_query_logs`), 1 HNSW vector index, and 1 SQL RPC function (`match_resume_chunks`).

## Supabase MCP Database Inspection Snapshot (Pre-Design Baseline)

Inspected via `supabase_mcp` (`list_projects`, `list_tables`, `list_extensions`, `list_migrations`, `execute_sql`):

| Attribute | Live Value Confirmed via `supabase_mcp` | Planning Impact |
| :--- | :--- | :--- |
| **Project ID & Name** | `iixpswqqkxfghbujdnha` (`portfolio`) | Target project for `apply_migration` and `execute_sql` |
| **Region & Status** | `ap-southeast-2` — `ACTIVE_HEALTHY` | Low-latency Asia-Pacific database host |
| **Postgres Engine** | `17.11.0.019` (`server_version: 17.11`, GA channel) | Fully supports `pgvector 0.8.2` HNSW iterative scans, `SECURITY INVOKER` SQL functions, and RLS |
| **Existing Tables (`public`)** | `[]` (`0` tables) | Clean slate; `resume_chunks` and `resume_query_logs` will be created via initial migration |
| **Existing Migrations** | `[]` (`0` migrations) | Migration `001_resume_chunks_and_rpc.sql` will be the foundational migration |
| **`vector` (`pgvector`) Extension** | `default_version: "0.8.2"`, `installed_version: null` | Available; enable via `CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;` |
| **`pg_cron` Extension** | `default_version: "1.6.4"`, `installed_version: null` | Available; enable via `CREATE EXTENSION IF NOT EXISTS pg_cron;` for 30-day telemetry cleanup |
| **`pgcrypto` & `uuid-ossp`** | Installed (`1.3` & `1.1` in schema `extensions`) | `gen_random_uuid()` available natively in PostgreSQL 17+ |

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Constitution Principle | Pre-Research Check | Post-Design Check | Evidence / Enforcement Mechanism |
| :--- | :--- | :--- | :--- |
| **I. Pinned Monorepo Stack Discipline** | PASS | PASS | Uses React 19.3 + Next.js 16.4.5 + TS 5.8 + Tailwind CSS v4.1 (`frontend/`), Python 3.13 + FastAPI 0.162.5 + Pydantic 2.14.3 + LangChain v0.3 (`backend/`), Gemini `gemini-3.5-flash-lite` + `gemini-embedding-2`, and Supabase PostgreSQL + `pgvector` + `pg_cron`. *(Note: Live Supabase project `iixpswqqkxfghbujdnha` runs Supabase GA Postgres `17.11.0.019`; all DDL is 100% compatible with Postgres 17 & 18).* |
| **II. Neo-Brutalist Sky Blue Visual System** | PASS | PASS | Floating trigger, drawer shell, message bubbles, starter prompt chips, inline source badges, and session-cap banner use `#F8FAFC` / `#FFFFFF` surfaces, `2px solid #0F172A` borders, `4px 4px 0px #0F172A` offset shadows, `#38BDF8` (`sky-400`) accents, and `#0284C7` (`sky-600`) hover states (`contracts/ui-contracts.md`). |
| **III. Anti-Vibe-Coding Visual Discipline (NON-NEGOTIABLE)** | PASS | PASS | Zero `backdrop-blur`, zero blurred shadows (`shadow-sm`..`shadow-2xl`), and zero purple/pink gradients; enforced by `frontend/tests/visual-system.test.tsx`. |
| **IV. Strict Type Safety & Validation Gates (NON-NEGOTIABLE)** | PASS | PASS | Strict Pydantic 2.14.3 request/response/stream schemas (`extra="forbid"`) with automated `pytest` suite (`backend/tests/test_ask_resume_validation.py`), plus `tsc --noEmit` and `next lint` with zero warnings/errors. |
| **V. Git-First Database Migrations via Supabase MCP (NON-NEGOTIABLE)** | PASS | PASS | Database inspected via `supabase_mcp` (`list_tables`, `list_extensions`, `list_migrations`, `execute_sql`). Full DDL for `resume_chunks`, HNSW index, RLS, and `match_resume_chunks` RPC is specified for `apps/api/migrations/001_resume_chunks_and_rpc.sql` prior to `apply_migration`. |

## Project Structure

### Documentation (this feature)

```text
specs/002-ask-my-resume/
├── plan.md                        # This file (/speckit-plan command output)
├── research.md                    # Phase 0 output: MCP inspection, HNSW vs IVFFlat, RPC & streaming decisions
├── data-model.md                  # Phase 1 output: Postgres resume_chunks, RPC, Pydantic & UI session entities
├── quickstart.md                  # Phase 1 output: End-to-end migration, RPC test & UI validation guide
├── contracts/                     # Phase 1 output (/speckit-plan command)
│   ├── database-contracts.md      # SQL DDL contract: resume_chunks, HNSW/IVFFlat index, match_resume_chunks RPC, RLS
│   ├── api-contracts.md           # FastAPI 0.162.5 + Pydantic 2.14.3 REST & SSE streaming contracts
│   └── ui-contracts.md            # Floating trigger, drawer, inline citation badges, 15-cap banner & error states
└── tasks.md                       # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
apps/
└── api/
    └── migrations/
        └── 001_resume_chunks_and_rpc.sql          # Canonical Git-first migration per Constitution Principle V

supabase/
└── migrations/
    └── 001_resume_rag.sql                         # Mirrored Supabase CLI migration for local tooling parity

backend/                                           # Python 3.13 + FastAPI 0.162.5 + Pydantic 2.14.3
├── app/
│   ├── main.py                                    # FastAPI app + CORS
│   ├── config.py                                  # Settings (GEMINI_API_KEY, SUPABASE_DB_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
│   ├── api/
│   │   └── routes.py                              # GET /api/v1/health, POST /api/v1/ask-resume, POST /api/v1/ask-resume/stream
│   ├── schemas/
│   │   └── ask_resume.py                          # Pydantic 2.14.3 schemas (CitationBadgeLabel, AskResumeRequest/Response, SSE events)
│   └── services/
│       ├── rag_service.py                         # match_resume_chunks RPC caller + gemini-3.5-flash-lite + off-topic guardrails
│       └── seed_resume_chunks.py                  # Idempotent chunking + gemini-embedding-2 seeder for public.resume_chunks
└── tests/
    └── test_ask_resume_validation.py              # Pydantic 2.14.3 boundary, guardrail refusal & streaming contract tests

frontend/                                          # Next.js 16.4.5 + React 19.3 + TypeScript 5.8 + Tailwind CSS v4.1
├── src/
│   ├── app/
│   │   ├── globals.css                            # Neo-Brutalist tokens + card highlight pulse animation
│   │   └── page.tsx                               # Connects global FloatingAskTrigger, AskResumeDrawer & card highlight IDs
│   ├── components/
│   │   ├── overlays/
│   │   │   ├── FloatingAskTrigger.tsx             # Fixed bottom-right Neo-Brutalist trigger button (FR-001)
│   │   │   └── AskResumeDrawer.tsx                # Slide-over drawer, X/15 counter, starter chips, streaming bubbles, cap banner
│   │   └── sections/
│   │       ├── ExperienceSection.tsx              # Adds deterministic card IDs (card-work-suhay, card-work-dacon, card-project-fitquest)
│   │       ├── EducationSection.tsx               # Adds deterministic card ID (card-education-bpsu)
│   │       └── CertificationsSection.tsx          # Adds deterministic card ID (card-certifications)
│   └── lib/
│       ├── ask-resume-client.ts                   # Streaming + non-streaming client, off-topic detector & local fallback
│       └── use-ask-resume-session.ts              # 15-message sessionStorage quota hook + Clear Chat & Retry quota protection
└── tests/
    ├── ask-resume-and-contact.test.tsx            # Existing contact & fallback tests
    ├── ask-resume-drawer.test.tsx                 # Unit/integration tests for US1–US4 (trigger, streaming, citations, 15-cap, retry)
    └── visual-system.test.tsx                     # Anti-vibe-coding visual token gate
```

**Structure Decision**: Preserves the existing `frontend/` + `backend/` + `supabase/` monorepo layout from `001-single-page-portfolio` and adds `apps/api/migrations/001_resume_chunks_and_rpc.sql` to strictly satisfy Constitution Principle V (`Git-First Database Migrations via Supabase MCP`).

## Complexity Tracking

> **No Constitution Check violations exist. All five Core Principles and all four Mandatory Quality Gates are satisfied.**
