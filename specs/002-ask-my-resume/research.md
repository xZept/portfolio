# Phase 0 Research: Ask My Resume AI Assistant Drawer & Supabase `pgvector` Design

**Feature Branch**: `002-ask-my-resume`  
**Date**: 2026-11-14  
**Spec**: `specs/002-ask-my-resume/spec.md`

---

## 1. Live Supabase MCP Database Inspection & `pgvector` Availability

- **Decision**: Target Supabase project `iixpswqqkxfghbujdnha` (`portfolio`, `ap-southeast-2`), enable `vector` (`0.8.2`) in schema `extensions` and `pg_cron` (`1.6.4`), and author the initial migration in `apps/api/migrations/001_resume_chunks_and_rpc.sql` (mirrored in `supabase/migrations/001_resume_rag.sql`) before applying via `supabase_mcp` `apply_migration`.
- **Rationale**:
  - Direct inspection via `supabase_mcp` confirmed:
    - `list_projects`: Project `iixpswqqkxfghbujdnha` (`portfolio`) is `ACTIVE_HEALTHY` on PostgreSQL `17.11.0.019`.
    - `list_tables`: `public` schema currently has `0` tables (`{"tables": []}`).
    - `list_migrations`: `0` migrations applied (`{"migrations": []}`).
    - `list_extensions` & `execute_sql`:
      - `vector` (`pgvector`) is available at `default_version: "0.8.2"` (`installed_version: null`), providing the `vector` data type and both `hnsw` and `ivfflat` index access methods, plus `pgvector 0.8.0+` iterative index scans for filtered queries.
      - `pg_cron` is available at `default_version: "1.6.4"` (`installed_version: null`).
      - `pgcrypto` (`1.3`) and `uuid-ossp` (`1.1`) are already installed in schema `extensions`.
  - Enabling `vector` with `CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;` aligns with Supabase's official AI guide and prevents polluting `public` with extension operator/support functions.
- **Alternatives Considered**:
  - *Installing `vector` directly in `public`*: Rejected because Supabase's `extension_in_public` security advisor flags extensions installed in the exposed `public` schema; placing `vector` in `extensions` and setting `search_path = public, extensions` on RPC functions satisfies Supabase security advisors cleanly.

---

## 2. Vector Index Selection: HNSW vs. IVFFlat on `public.resume_chunks`

- **Decision**: Use an **HNSW** index (`USING hnsw (embedding extensions.vector_cosine_ops) WITH (m = 16, ef_construction = 64)`) as the primary production index on `public.resume_chunks(embedding)`, while documenting the **IVFFlat** index (`USING ivfflat (embedding extensions.vector_cosine_ops) WITH (lists = 10)`) as the alternative reference pattern.
- **Rationale**:
  1. **Migration-Time Safety (Empty Table Compatibility)**: Per Constitution Principle V, DDL migrations are applied to the database *before* runtime data seeding. `HNSW` is a graph-based index that can be created on an empty table and incrementally maintains high recall as chunks are inserted or updated. By contrast, `IVFFlat` runs k-means clustering over existing rows at `CREATE INDEX` time; creating an `IVFFlat` index on an empty `resume_chunks` table produces degenerate centroids and poor recall until `REINDEX` is run after seeding.
  2. **Query Speed & Recall for 768-Dimensional `gemini-embedding-2` Vectors**: With `pgvector 0.8.2`, HNSW achieves `> 0.99` recall and sub-millisecond index traversal on small-to-medium knowledge bases without requiring session-level `SET ivfflat.probes` tuning.
  3. **Filtered Vector Search Support**: `pgvector 0.8.2` supports iterative HNSW index scans when `match_resume_chunks` combines vector ordering (`embedding <=> query_embedding`) with `WHERE project_id = filter_project_id` or `metadata @> filter_metadata`.
  4. **Operator Class Selection (`vector_cosine_ops` / `<=>`)**: Cosine distance (`<=>`) is scale-invariant and directly yields normalized cosine similarity via `1 - (embedding <=> query_embedding)`.
- **Alternatives Considered**:
  - *IVFFlat as the active index (`USING ivfflat (embedding extensions.vector_cosine_ops) WITH (lists = 10)`)*: Evaluated and documented in `contracts/database-contracts.md`. IVFFlat uses slightly less memory on multi-million-row tables (`100k–10M` vectors), but for a portfolio resume corpus (`10–50` chunks) its sensitivity to pre-seed creation and `lists`/`probes` tuning makes HNSW strictly superior.
  - *Unindexed sequential scan only*: While Postgres can scan `< 50` rows quickly, creating the HNSW index satisfies the explicit architectural requirement, validates `pgvector 0.8.2` index creation via Supabase MCP, and future-proofs the table as detailed case studies and documentation chunks are added.

---

## 3. `public.match_resume_chunks` RPC Function Architecture

- **Decision**: Implement `public.match_resume_chunks` as a `LANGUAGE sql STABLE SECURITY INVOKER` function with `SET search_path = public, extensions` that accepts `(query_embedding extensions.vector(768), match_threshold float DEFAULT 0.35, match_count int DEFAULT 5, filter_project_id text DEFAULT NULL, filter_metadata jsonb DEFAULT '{}'::jsonb)` and returns matched chunks ordered by optional project affinity and cosine distance (`rc.embedding <=> query_embedding ASC`), clamped to `LEAST(GREATEST(match_count, 1), 20)`.
- **Rationale**:
  1. **In-Function Predicate Pushdown**: Per Supabase's official semantic search documentation, filtering via `.eq()` after `.rpc()` applies the filter *after* the `LIMIT` inside the function, which can starve results. Pushing `filter_project_id` and `filter_metadata` (`@>`) into `match_resume_chunks` lets Postgres evaluate filters alongside the HNSW scan.
  2. **Security & Advisor Compliance**: Using `SECURITY INVOKER` (rather than `SECURITY DEFINER`) ensures the function executes with the caller's role permissions and respects Row-Level Security (`resume_chunks_public_read` `SELECT` policy). Pinning `SET search_path = public, extensions` eliminates `function_search_path_mutable` advisor warnings.
  3. **Direct Citation Badge Routing**: Returning `badge_label`, `target_section_id`, and `target_card_id` directly from `match_resume_chunks` allows the backend and frontend to attach the exact 5 clickable inline badges (`[Work: Orani Suhay Foundation]`, `[Work: DACON Corp]`, `[Project: FitQuest]`, `[Education: BPSU]`, `[Certifications]`) without fragile post-hoc string regexes.
- **Alternatives Considered**:
  - *Raw client/backend `SELECT` queries without an RPC function*: Rejected because `match_resume_chunks` encapsulates similarity computation (`1 - (embedding <=> query_embedding)`), threshold gating, metadata containment, and row-limit clamping behind a clean, testable database contract callable via both PostgREST `.rpc('match_resume_chunks', ...)` and `psycopg` `SELECT * FROM public.match_resume_chunks(...)`.

---

## 4. Incremental Token Streaming & Inline Citation Badge Protocol

- **Decision**: Provide a Server-Sent Events (SSE) endpoint `POST /api/v1/ask-resume/stream` (alongside the existing JSON endpoint `POST /api/v1/ask-resume` for backward compatibility with `001-single-page-portfolio` tests) that emits structured JSON lines (`event: token`, `event: citations`, `event: done`, `event: error`), paired with progressive client-side token rendering in `AskResumeDrawer.tsx`.
- **Rationale**:
  - `FR-007` and `SC-002` require incremental token-by-token streaming with a visible typing/streaming indicator within `1.5s`.
  - When live `gemini-3.5-flash-lite` streaming is active, chunks yielded by LangChain `.stream()` are forwarded immediately as SSE `token` events, followed by a `citations` event mapping each factual claim to its canonical badge (`[Work: Orani Suhay Foundation]`, `[Work: DACON Corp]`, `[Project: FitQuest]`, `[Education: BPSU]`, `[Certifications]`) and DOM scroll target (`#card-work-suhay`, `#card-work-dacon`, `#card-project-fitquest`, `#card-education-bpsu`, `#card-certifications`).
  - When operating in deterministic local fallback mode (e.g., offline test environment), the client streams the grounded response token-by-token over a fast animation cadence (`~15ms` per word chunk) so the typing indicator and incremental rendering work identically in offline E2E tests, while supporting explicit simulated error injection for `FR-013` ("Retry" + direct email link verification).
- **Alternatives Considered**:
  - *WebSockets*: Rejected because SSE over standard HTTP `POST` (`fetch` + `ReadableStream`) works statelessly on Render and Vercel without sticky-session WebSocket proxies.

---

## 5. Factual Grounding Guardrails & Off-Topic Refusal (`FR-010` & `SC-004`)

- **Decision**: Implement a two-stage guardrail pipeline:
  1. **Pre-Generation Relevance & Off-Topic Classifier**: Checks whether the query is off-topic (general trivia, unrelated coding tasks like "write a snake game", politics/weather/news, or private personal inquiries outside `docs/resume.md`) OR has zero matching resume chunks above `match_threshold = 0.35`. When triggered, returns a polite, zero-hallucination refusal response (`is_off_topic: true`) that steers the visitor back to Allen's `.NET 10` (`SuhayCore`), `FastAPI`/RAG (`DAN`), `Kotlin` (`FitQuest`), `BPSU` education, or direct email (`allenjames.laxamana@gmail.com`).
  2. **System Prompt Grounding Enforcement**: Instructs `gemini-3.5-flash-lite` (`temperature=0.0`) to answer strictly from the retrieved `match_resume_chunks` rows, attach inline source badges (`[Work: Orani Suhay Foundation]`, `[Work: DACON Corp]`, `[Project: FitQuest]`, `[Education: BPSU]`, `[Certifications]`), and explicitly state when a requested skill or detail is not listed in Allen's resume.
- **Rationale**: Guarantees 100% refusal accuracy on off-topic/private prompts (`SC-004`) both when connected to live Gemini RAG and when running deterministic local grounding tests.
- **Alternatives Considered**:
  - *Prompt-only guardrails without deterministic pre-check*: Rejected because deterministic pre-checking saves Gemini API tokens on obvious off-topic queries and guarantees identical refusal behavior in offline unit tests.

---

## 6. Session Rate Limiting (`15 / 15` Quota) & Cap Banner (`FR-011` & `FR-012`)

- **Decision**: Track session quota (`MAX_SESSION_MESSAGES = 15`) in a dedicated hook (`useAskResumeSession`) backed by `window.sessionStorage` (`key: "allen_ask_resume_session_v1"`).
- **Rationale**:
  - Decrements remaining messages (`15 - usedCount`) only when a user question completes (or is accepted into the thread), never on empty/whitespace input, and never double-charges when retrying a failed stream (`Edge Cases` #1 & #5).
  - Clicking **"Clear Chat"** clears the `messages` array to return to the 3 starter prompt chips while preserving `usedCount` in `sessionStorage` so visitors cannot bypass the 15-message cap (`Edge Case` #3 & #4).
  - When `remaining === 0`, locks the text input, send button, and starter prompt chips, and renders the sky-blue (`#38BDF8`) Neo-Brutalist cap banner: `"Session cap reached — email Allen directly at allenjames.laxamana@gmail.com"` with **"Copy Email"** (clipboard write + instant `"Copied!"` confirmation) and **"Open in Gmail"** (`https://mail.google.com/mail/?view=cm&fs=1&to=allenjames.laxamana@gmail.com`).
- **Alternatives Considered**:
  - *In-memory React state only*: Rejected because closing/reopening the drawer or hot-reloading would lose session quota state.
