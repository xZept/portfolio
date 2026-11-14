# Tasks: Ask My Resume AI Assistant Drawer & Supabase `pgvector` RAG

**Input**: Design documents from `/specs/002-ask-my-resume/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/database-contracts.md`, `contracts/api-contracts.md`, `contracts/ui-contracts.md`, `quickstart.md`

**Tests**: Included where mandated by Constitution Principle IV (Pydantic 2.14.3 schema/guardrail/streaming tests in `backend/tests/test_ask_resume_validation.py`, Vitest UI/session/citation tests in `frontend/tests/ask-resume-drawer.test.tsx`, Neo-Brutalist visual token compliance in `frontend/tests/visual-system.test.tsx`, `tsc --noEmit`, and `next lint`).

**Organization**: Tasks are grouped by user story (`US1`–`US4`) so each increment can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story mapping (`[US1]`, `[US2]`, `[US3]`, `[US4]`) — used only in User Story phases
- All file paths are relative to the repository root (`c:\Users\allen\Documents\portfolio\`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize migration directory structure and backend configuration needed for Supabase `pgvector` and SSE streaming.

- [X] T001 Create `apps/api/migrations/` directory per Constitution Principle V (`Git-First Database Migrations via Supabase MCP`)
- [X] T002 [P] Verify and update environment templates for `SUPABASE_DB_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `GEMINI_API_KEY` in `backend/.env.example` and `backend/app/config.py`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Versioned `resume_chunks` + HNSW + `match_resume_chunks` RPC migration via Supabase MCP, chunk seeder, updated Pydantic 2.14.3 schemas, and deterministic portfolio card IDs required before any user story can proceed.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 Author versioned SQL migration enabling `vector` (`0.8.2` in `extensions`) and `pg_cron`, creating `public.resume_chunks` (`VECTOR(768)`, `badge_label` check constraint for the 5 citation badges, `target_section_id`, `target_card_id`, `project_id`), `idx_resume_chunks_embedding_hnsw` (`USING hnsw (embedding extensions.vector_cosine_ops) WITH (m = 16, ef_construction = 64)`), `idx_resume_chunks_project_id`, `idx_resume_chunks_metadata_gin`, RLS policy `resume_chunks_public_read`, `public.match_resume_chunks(...)` (`SECURITY INVOKER`, `SET search_path = public, extensions`), and `public.resume_query_logs` + `pg_cron` 30-day purge in `apps/api/migrations/001_resume_chunks_and_rpc.sql`
- [X] T004 [P] Mirror identical SQL DDL into `supabase/migrations/001_resume_rag.sql` for local Supabase CLI parity
- [X] T005 Apply `apps/api/migrations/001_resume_chunks_and_rpc.sql` to project `iixpswqqkxfghbujdnha` via `supabase_mcp` `apply_migration`, then verify `pg_extension`, `pg_indexes`, `match_resume_chunks` smoke query via `execute_sql`, and zero RLS/search_path issues via `get_advisors`
- [X] T006 [P] Implement idempotent resume chunker and `gemini-embedding-2` seeder upserting `docs/resume.md` sections into `public.resume_chunks` (`ON CONFLICT (chunk_key) DO UPDATE`) in `backend/app/services/seed_resume_chunks.py`, and run it (when database & Gemini credentials are configured) to verify non-empty `match_resume_chunks` retrieval
- [X] T007 [P] Extend Pydantic 2.14.3 schemas (`CitationBadgeLabel`, `TargetSectionId`, `TargetCardId`, `ResumeCitation`, `AskResumeRequest` with `min_length=2, max_length=500, extra="forbid"`, `AskResumeResponse` with `is_off_topic: bool = False`, and SSE event models) in `backend/app/schemas/ask_resume.py`
- [X] T008 [P] Add deterministic card IDs (`card-work-suhay`, `card-work-dacon`, `card-project-fitquest`, `card-education-bpsu`, `card-certifications`) and `data-highlighted` visual ring/pulse support in `frontend/src/components/sections/ExperienceSection.tsx`, `frontend/src/components/sections/EducationSection.tsx`, `frontend/src/components/sections/CertificationsSection.tsx`, and `frontend/src/app/globals.css`

**Checkpoint**: Foundation ready — database schema/RPC verified via Supabase MCP, Pydantic contracts updated, and portfolio scroll/highlight targets in place.

---

## Phase 3: User Story 1 - Global Access, Starter Prompts & Custom Resume Q&A (Priority: P1) 🎯 MVP

**Goal**: Deliver the persistent bottom-right floating "Ask My Resume" trigger button and Neo-Brutalist slide-over drawer with the 3 curated starter prompt chips, custom text input (`Enter` / Send button), and "Clear Chat" reset.

**Independent Test**: Scroll to any position on `http://localhost:3000`, click the bottom-right floating trigger button (`data-testid="floating-ask-resume-trigger"`), verify Neo-Brutalist styling (`2px solid #0F172A`, `4px 4px 0px #0F172A`, `#38BDF8` / `#0284C7` accents, zero blur), submit each of the 3 starter prompt chips and a custom question via `Enter` and Send, and click `"Clear Chat"` to return to the starter prompt view.

### Implementation for User Story 1

- [X] T009 [P] [US1] Create persistent bottom-right Neo-Brutalist `FloatingAskTrigger` component (`fixed bottom-6 right-6 z-40`, `border-2 border-[#0F172A]`, `bg-[#38BDF8]`, `shadow-[4px_4px_0px_#0F172A]`, `hover:bg-[#0284C7]`) in `frontend/src/components/overlays/FloatingAskTrigger.tsx`
- [X] T010 [P] [US1] Create `useAskResumeSession` hook managing conversation thread state, `Clear Chat` reset, and `sessionStorage` (`allen_ask_resume_session_v1`) quota tracking (`15 / 15`) in `frontend/src/lib/use-ask-resume-session.ts`
- [X] T011 [US1] Update `AskResumeDrawer` with the 3 exact starter prompt chips (`"How did Allen architect SuhayCore in .NET 10 & Blazor?"`, `"Tell me about his RAG AI chatbot and FastAPI work at DACON."`, `"What certifications and database experience does he hold?"`), `"Clear Chat"` button, `Enter` (without `Shift`) + Send submission, empty/whitespace input guard, and `Escape` close handling in `frontend/src/components/overlays/AskResumeDrawer.tsx`
- [X] T012 [US1] Wire `FloatingAskTrigger` and updated `AskResumeDrawer` into the global page shell (preserving existing Header, Hero, and Experience `"Ask AI about this"` triggers) in `frontend/src/app/page.tsx`

**Checkpoint**: User Story 1 (MVP) is complete and independently testable.

---

## Phase 4: User Story 2 - Incremental Streaming Responses & Clickable Portfolio Citations (Priority: P2)

**Goal**: Stream assistant responses token-by-token via `POST /api/v1/ask-resume/stream` backed by `public.match_resume_chunks` + `gemini-3.5-flash-lite` (with progressive local fallback streaming), and attach clickable inline source badges (`[Work: Orani Suhay Foundation]`, `[Work: DACON Corp]`, `[Project: FitQuest]`, `[Education: BPSU]`, `[Certifications]`) that smoothly scroll to and highlight the matching portfolio card.

**Independent Test**: Submit a question spanning multiple resume areas, observe the visible typing/streaming indicator (`data-testid="ask-resume-streaming-indicator"`) and incremental token rendering, verify clickable inline source badges appear, and click a badge to confirm smooth scrolling and highlight on the target card (and drawer collapse on `< 768px` viewports).

### Implementation for User Story 2

- [X] T013 [P] [US2] Implement `public.match_resume_chunks` RPC retrieval (`query_embedding`, `match_threshold=0.35`, `match_count=5`, `filter_project_id`) and incremental SSE token generator (`stream_resume_question`) using `gemini-3.5-flash-lite` + deterministic fallback streaming in `backend/app/services/rag_service.py`
- [X] T014 [US2] Add `POST /api/v1/ask-resume/stream` (`text/event-stream`) endpoint emitting `token`, `done`, and `error` SSE frames alongside `POST /api/v1/ask-resume` in `backend/app/api/routes.py`
- [X] T015 [P] [US2] Implement SSE streaming client (`askResumeStream`) with progressive local fallback token streaming and canonical citation badge mapping in `frontend/src/lib/ask-resume-client.ts`
- [X] T016 [US2] Render visible streaming indicator (`data-testid="ask-resume-streaming-indicator"`), incremental assistant bubble tokens, and clickable inline citation badges (`data-testid="ask-resume-citation-badge"`) with smooth scroll + `2500ms` card highlight + mobile (`< 768px`) drawer collapse in `frontend/src/components/overlays/AskResumeDrawer.tsx` and `frontend/src/app/page.tsx`

**Checkpoint**: User Stories 1 and 2 work independently and integrate cleanly.

---

## Phase 5: User Story 3 - Factual Grounding Guardrails & Off-Topic Refusal (Priority: P3)

**Goal**: Enforce strict factual grounding in `docs/resume.md` and politely decline off-topic trivia, unrelated coding tasks, or private personal questions while steering visitors back to Allen's engineering work or `allenjames.laxamana@gmail.com`.

**Independent Test**: Submit `"What is the capital of France?"`, `"Write me a snake game"`, and a private personal question; verify the assistant returns `is_off_topic: true`, declines without fabricating resume claims, and offers Allen's engineering topics or email.

### Implementation for User Story 3

- [X] T017 [P] [US3] Implement pre-generation off-topic/private-inquiry classifier and strict `temperature=0.0` grounding system prompt in `backend/app/services/rag_service.py`
- [X] T018 [P] [US3] Mirror off-topic/private-inquiry guardrail handling in local fallback matcher (`buildLocalFallbackAnswer` / `askResumeStream`) in `frontend/src/lib/ask-resume-client.ts`
- [X] T019 [US3] Add Pydantic 2.14.3 schema, off-topic guardrail refusal, and SSE streaming contract tests (all 10 cases from `contracts/api-contracts.md`) in `backend/tests/test_ask_resume_validation.py`

**Checkpoint**: User Stories 1, 2, and 3 are all independently functional and guardrail-verified.

---

## Phase 6: User Story 4 - Session Rate Limiting, Direct Email Cap Banner & Error Recovery (Priority: P4)

**Goal**: Enforce the `15 / 15 messages remaining` live header counter, lock inputs and display the `#38BDF8` session-cap banner (`"Session cap reached — email Allen directly at allenjames.laxamana@gmail.com"` with **"Copy Email"** and **"Open in Gmail"**) at `0 / 15`, and provide inline stream error recovery (**"Retry"** without double-charging quota + `mailto:allenjames.laxamana@gmail.com`).

**Independent Test**: Send 15 messages and verify counter decrements from `15 / 15` to `0 / 15`, `"Clear Chat"` preserves remaining quota, inputs/chips lock at `0` with working **"Copy Email"** and **"Open in Gmail"** buttons, and a simulated mid-stream failure shows **"Retry"** (without double-charging quota) and a `mailto:` link.

### Implementation for User Story 4

- [X] T020 [P] [US4] Finalize `useAskResumeSession` quota enforcement (`15` cap, `sessionStorage` persistence across `Clear Chat`, no quota deduction on empty input or failed/retried turns, concurrent submission lock while streaming) in `frontend/src/lib/use-ask-resume-session.ts`
- [X] T021 [US4] Implement live `X / 15 messages remaining` header badge (`data-testid="ask-resume-quota-counter"`), locked-input `#38BDF8` cap banner (`data-testid="ask-resume-cap-banner"` with `"Copy Email"` clipboard confirmation and `"Open in Gmail"` compose link), and inline error state (`data-testid="ask-resume-inline-error"` with `"Retry"` and `mailto:allenjames.laxamana@gmail.com`) in `frontend/src/components/overlays/AskResumeDrawer.tsx`
- [X] T022 [P] [US4] Write Vitest + React Testing Library test suite covering floating trigger, starter chips, Clear Chat quota preservation, incremental streaming, clickable citation scroll/highlight, off-topic refusal, `15 / 15` cap banner, and inline error Retry recovery in `frontend/tests/ask-resume-drawer.test.tsx`

**Checkpoint**: All 4 user stories are complete and independently verifiable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verify Constitution Principle III & IV compliance across frontend, backend, and Supabase database.

- [X] T023 [P] Update Neo-Brutalist visual discipline test to scan `FloatingAskTrigger.tsx` and updated `AskResumeDrawer.tsx` for zero `backdrop-blur-*`, zero blurred shadows, and zero purple/pink gradients in `frontend/tests/visual-system.test.tsx`
- [X] T024 Run all mandatory Constitution Principle IV & V quality gates (`pytest -v` in `backend/`, `npx tsc --noEmit`, `npm run lint`, and `npm test -- --run` in `frontend/`, plus `supabase_mcp` `execute_sql` row-count/RPC retrieval verification & `get_advisors` checks) and validate all scenarios in `specs/002-ask-my-resume/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS** all user stories (`US1`–`US4`).
- **Phase 3 (US1 — Floating Trigger, Starter Chips & Input)**: Depends on Phase 2. Delivers the **MVP**.
- **Phase 4 (US2 — Streaming & Clickable Citations)**: Depends on Phase 2 (`T005` RPC + `T007` schemas + `T008` card IDs) and integrates into `AskResumeDrawer.tsx` from US1.
- **Phase 5 (US3 — Guardrails & Off-Topic Refusal)**: Depends on Phase 2 (`T007`) and Phase 4 (`T013`–`T015`).
- **Phase 6 (US4 — 15-Message Cap Banner & Error Recovery)**: Depends on Phase 3 (`T010`–`T011`) and Phase 4 (`T016`).
- **Phase 7 (Polish & Gates)**: Depends on Phases 3–6 completion.

### Parallel Opportunities

- **Phase 2**: `T004`, `T006`, `T007`, and `T008` can run in parallel once `T003` is authored; `T005` executes after `T003`.
- **Phase 3 (US1)**: `T009` and `T010` can run in parallel before `T011` and `T012`.
- **Phase 4 (US2)**: `T013` and `T015` can run in parallel before `T014` and `T016`.
- **Phase 5 (US3)**: `T017`, `T018`, and `T019` can run in parallel.
- **Phase 6 (US4)**: `T020` and `T022` (test scaffolding) can run alongside `T021`.

---

## Parallel Example: Foundational & User Story 1

```text
# Phase 2 parallel tasks after T003:
T004: Mirror SQL migration to supabase/migrations/001_resume_rag.sql
T006: Implement idempotent seeder in backend/app/services/seed_resume_chunks.py
T007: Extend Pydantic 2.14.3 schemas in backend/app/schemas/ask_resume.py
T008: Add deterministic card IDs and highlight ring in Experience/Education/Certifications sections

# Phase 3 (US1) parallel tasks:
T009: Build FloatingAskTrigger in frontend/src/components/overlays/FloatingAskTrigger.tsx
T010: Build useAskResumeSession hook in frontend/src/lib/use-ask-resume-session.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete **Phase 1 (Setup)** and **Phase 2 (Foundational)** — including applying `001_resume_chunks_and_rpc.sql` via `supabase_mcp` `apply_migration`.
2. Complete **Phase 3 (User Story 1)** (`T009`–`T012`).
3. **STOP and VALIDATE**: Verify floating trigger visibility across scroll positions, Neo-Brutalist styling, 3 starter prompt chips, custom `Enter`/Send submission, and `"Clear Chat"`.

### Incremental Delivery
1. **Setup + Foundational** → `public.resume_chunks` (HNSW), `public.match_resume_chunks` RPC, Pydantic schemas, and portfolio card IDs ready.
2. **+ US1 (P1)** → Global floating trigger + drawer + starter chips + Clear Chat (MVP!).
3. **+ US2 (P2)** → Live SSE token streaming + clickable inline source citation badges scrolling/highlighting portfolio cards.
4. **+ US3 (P3)** → Strict off-topic/private-inquiry refusal guardrails + backend `pytest` matrix.
5. **+ US4 (P4)** → `15 / 15` session quota counter, `#38BDF8` cap banner ("Copy Email" + "Open in Gmail"), and inline "Retry" error recovery.
6. **+ Polish** → Full `pytest`, `tsc --noEmit`, `next lint`, Vitest, and Supabase advisor verification.
