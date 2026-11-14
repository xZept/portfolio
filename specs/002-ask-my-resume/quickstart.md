# Quickstart & Validation Guide: Ask My Resume AI Assistant Drawer (`002-ask-my-resume`)

**Feature Branch**: `002-ask-my-resume`  
**Spec**: `specs/002-ask-my-resume/spec.md`  
**Contracts**: `specs/002-ask-my-resume/contracts/database-contracts.md`, `specs/002-ask-my-resume/contracts/api-contracts.md`, `specs/002-ask-my-resume/contracts/ui-contracts.md`

---

## 1. Database Migration & `match_resume_chunks` RPC Verification (Constitution Principle V)

1. **Ensure Versioned Migration Exists in Git First**:
   - Confirm `apps/api/migrations/001_resume_chunks_and_rpc.sql` (and `supabase/migrations/001_resume_rag.sql`) exists on disk before applying to Supabase.
2. **Apply Migration via Connected Supabase MCP Server (`supabase_mcp`)**:
   - Target `project_id`: `iixpswqqkxfghbujdnha` (`portfolio`).
   - Apply `001_resume_chunks_and_rpc` using `supabase_mcp` `apply_migration`.
3. **Verify Extensions, HNSW Index & RPC via `supabase_mcp` `execute_sql`**:
   ```sql
   -- 1. Confirm vector (0.8.2) & pg_cron (1.6.4) are installed
   SELECT extname, extversion FROM pg_extension WHERE extname IN ('vector', 'pg_cron');

   -- 2. Confirm HNSW index & RLS on public.resume_chunks
   SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'resume_chunks';

   -- 3. Confirm match_resume_chunks RPC executes cleanly
   SELECT chunk_key, badge_label, target_card_id, similarity
   FROM public.match_resume_chunks(
     array_fill(0.01::real, ARRAY[768])::extensions.vector(768),
     0.0,
     5,
     NULL,
     '{}'::jsonb
   );
   ```
4. **Run Supabase Advisors Gate**:
   - Call `supabase_mcp` `get_advisors` (`type: "security"` and `type: "performance"`) on `iixpswqqkxfghbujdnha` and confirm zero errors on `public.resume_chunks`, `public.resume_query_logs`, and `public.match_resume_chunks`.

---

## 2. Backend Quality Gate (`backend/`)

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest -v
```
- **Expected Outcome**: All 10+ Pydantic 2.14.3 schema, off-topic guardrail refusal (`FR-010`), and SSE streaming (`FR-007`) tests in `backend/tests/test_ask_resume_validation.py` pass with `0` failures.

---

## 3. Frontend Quality Gates (`frontend/`)

```powershell
cd frontend
npx tsc --noEmit
npm run lint
npm test -- --run
```
- **Expected Outcome**:
  - `tsc --noEmit`: `0` errors.
  - `npm run lint`: `0` errors and `0` warnings.
  - `npm test -- --run`: All Vitest suites (`visual-system.test.tsx`, `ask-resume-drawer.test.tsx`, `ask-resume-and-contact.test.tsx`, `sections-us1.test.tsx`, `sections-us3.test.tsx`, `skills-globe.test.tsx`) pass.

---

## 4. End-to-End Verification Scenarios

1. **Global Floating Trigger & Starter Chips (US1)**:
   - Scroll anywhere on `http://localhost:3000` and click the bottom-right floating **"Ask My Resume"** button.
   - Verify the slide-over drawer opens showing `15 / 15 messages remaining` and the 3 exact starter prompt chips.
   - Click `"How did Allen architect SuhayCore in .NET 10 & Blazor?"` and verify incremental streaming begins immediately, then click **"Clear Chat"** to confirm the thread resets to the 3 starter chips while keeping `14 / 15 messages remaining`.
2. **Incremental Streaming & Clickable Inline Source Badges (US2)**:
   - Submit a question and verify tokens stream incrementally with a visible streaming indicator and inline clickable badges (`[Work: Orani Suhay Foundation]`, `[Work: DACON Corp]`, `[Project: FitQuest]`, `[Education: BPSU]`, `[Certifications]`).
   - Click `[Work: DACON Corp]` and confirm the portfolio smoothly scrolls to `#experience` and highlights `#card-work-dacon`.
3. **Off-Topic Refusal Guardrails (US3)**:
   - Ask `"What is the capital of France?"` or `"Write me a snake game"`. Confirm the assistant politely declines without fabricating claims and steers back to Allen's engineering experience or `allenjames.laxamana@gmail.com`.
4. **15-Message Session Cap & Inline Error Recovery (US4)**:
   - Reach `0 / 15 messages remaining` and confirm the input and starter chips lock and the `#38BDF8` banner (`"Session cap reached — email Allen directly at allenjames.laxamana@gmail.com"`) appears with working **"Copy Email"** and **"Open in Gmail"** buttons.
   - Trigger a simulated stream failure and confirm the inline error state renders **"Retry"** (which retries without double-charging quota) and a `mailto:allenjames.laxamana@gmail.com` link.
