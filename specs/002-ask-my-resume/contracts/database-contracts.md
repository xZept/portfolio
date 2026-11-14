# Database & Supabase MCP Contract: `resume_chunks`, HNSW/IVFFlat Index & `match_resume_chunks` RPC

**Feature Branch**: `002-ask-my-resume`  
**Target Supabase Project**: `iixpswqqkxfghbujdnha` (`portfolio`, `ap-southeast-2`)  
**Migration File Paths**:
- Canonical (Constitution Principle V): `apps/api/migrations/001_resume_chunks_and_rpc.sql`
- Local CLI Mirror: `supabase/migrations/001_resume_rag.sql`

---

## 1. Pre-Design Database Inspection Report (Verified via `supabase_mcp`)

Executed against project `iixpswqqkxfghbujdnha` during `/speckit-plan`:

1. **`list_projects`**:
   - Project `iixpswqqkxfghbujdnha` (`name: "portfolio"`, `region: "ap-southeast-2"`, `status: "ACTIVE_HEALTHY"`, `postgres_engine: "17"`, `version: "17.11.0.019"`).
2. **`list_tables` (`schemas: ["public", "extensions"]`, `verbose: true`)**:
   - Returned `{"tables": []}` (`0` existing tables in `public`).
3. **`list_migrations`**:
   - Returned `{"migrations": []}` (`0` applied migrations).
4. **`list_extensions` & `execute_sql` (`pg_available_extensions`)**:
   - `vector` (`pgvector`): `default_version = "0.8.2"`, `installed_version = null`, comment: `"vector data type and ivfflat and hnsw access methods"`.
   - `pg_cron`: `default_version = "1.6.4"`, `installed_version = null`, comment: `"Job scheduler for PostgreSQL"`.
   - `pgcrypto`: `installed_version = "1.3"` (schema `extensions`).
   - `uuid-ossp`: `installed_version = "1.1"` (schema `extensions`).

---

## 2. Vector Index Architecture: HNSW vs. IVFFlat Specification

| Criterion | **HNSW (Selected Primary Index)** | **IVFFlat (Reference Alternative)** |
| :--- | :--- | :--- |
| **Access Method** | `USING hnsw (embedding extensions.vector_cosine_ops)` | `USING ivfflat (embedding extensions.vector_cosine_ops)` |
| **Storage Parameters** | `WITH (m = 16, ef_construction = 64)` | `WITH (lists = 10)` *(for `< 10k` rows; `sqrt(N)` for `> 10k` rows)* |
| **Empty-Table Migration Safety** | **Safe**: Graph structure builds dynamically as rows are inserted after DDL migration. | **Unsafe on empty table**: Computes k-means centroids during `CREATE INDEX`; requires `REINDEX` after seeding. |
| **Query Recall & Speed (`768d`)** | `> 0.99` recall, `< 2ms` lookup, zero session parameter tuning needed (`ef_search = 40` default). | Lower recall unless `SET LOCAL ivfflat.probes = 3..5` is issued before queries. |
| **Filtered Search (`pgvector 0.8.2`)** | Supports iterative index scans when combined with `WHERE project_id = ...` or `metadata @> ...`. | Post-probe filtering can return fewer than `match_count` rows on selective filters. |

### 2.1 Active HNSW Index DDL (Included in Migration)
```sql
CREATE INDEX IF NOT EXISTS idx_resume_chunks_embedding_hnsw
  ON public.resume_chunks
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

### 2.2 Reference IVFFlat Index DDL (For High-Volume / Low-Memory Swap Only)
```sql
-- Reference only: Use ONLY after seeding >= 1,000 rows if memory-constrained
-- DROP INDEX IF EXISTS public.idx_resume_chunks_embedding_hnsw;
-- CREATE INDEX IF NOT EXISTS idx_resume_chunks_embedding_ivfflat
--   ON public.resume_chunks
--   USING ivfflat (embedding extensions.vector_cosine_ops)
--   WITH (lists = 10);
```

---

## 3. Complete Versioned SQL Migration Contract (`001_resume_chunks_and_rpc.sql`)

 Per Constitution Principle V, this exact SQL MUST be saved to `apps/api/migrations/001_resume_chunks_and_rpc.sql` (and `supabase/migrations/001_resume_rag.sql`) BEFORE calling `supabase_mcp` `apply_migration`:

```sql
-- Migration: 001_resume_chunks_and_rpc.sql
-- Purpose: Enable pgvector (0.8.2) & pg_cron, create public.resume_chunks with HNSW index,
--          create public.match_resume_chunks RPC, create public.resume_query_logs with 30-day
--          pg_cron retention, and enforce Row-Level Security (RLS).

-- 1. Extensions
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Table: public.resume_chunks
CREATE TABLE IF NOT EXISTS public.resume_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_key TEXT NOT NULL UNIQUE,
  section TEXT NOT NULL,
  badge_label TEXT NOT NULL CHECK (
    badge_label IN (
      '[Work: Orani Suhay Foundation]',
      '[Work: DACON Corp]',
      '[Project: FitQuest]',
      '[Education: BPSU]',
      '[Certifications]'
    )
  ),
  target_section_id TEXT NOT NULL CHECK (
    target_section_id IN (
      'experience',
      'about',
      'skills',
      'education',
      'certifications',
      'contact'
    )
  ),
  target_card_id TEXT NOT NULL,
  project_id TEXT NULL CHECK (
    project_id IN ('suhaycore', 'dan', 'fitquest') OR project_id IS NULL
  ),
  content TEXT NOT NULL CHECK (char_length(btrim(content)) > 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding extensions.vector(768) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.resume_chunks IS
  'Grounded resume knowledge chunks from docs/resume.md with 768-dim gemini-embedding-2 vectors and portfolio citation targets.';

-- 3. Indexes on public.resume_chunks
CREATE INDEX IF NOT EXISTS idx_resume_chunks_embedding_hnsw
  ON public.resume_chunks
  USING hnsw (embedding extensions.vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_resume_chunks_project_id
  ON public.resume_chunks (project_id)
  WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_resume_chunks_metadata_gin
  ON public.resume_chunks
  USING gin (metadata);

-- 4. Row-Level Security (RLS) on public.resume_chunks
ALTER TABLE public.resume_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "resume_chunks_public_read" ON public.resume_chunks;
CREATE POLICY "resume_chunks_public_read"
  ON public.resume_chunks
  FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON TABLE public.resume_chunks TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.resume_chunks TO service_role;

-- 5. RPC Function: public.match_resume_chunks
CREATE OR REPLACE FUNCTION public.match_resume_chunks(
  query_embedding extensions.vector(768),
  match_threshold float DEFAULT 0.35,
  match_count int DEFAULT 5,
  filter_project_id text DEFAULT NULL,
  filter_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  id uuid,
  chunk_key text,
  section text,
  badge_label text,
  target_section_id text,
  target_card_id text,
  project_id text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, extensions
AS $$
  SELECT
    rc.id,
    rc.chunk_key,
    rc.section,
    rc.badge_label,
    rc.target_section_id,
    rc.target_card_id,
    rc.project_id,
    rc.content,
    rc.metadata,
    (1 - (rc.embedding <=> query_embedding))::float AS similarity
  FROM public.resume_chunks AS rc
  WHERE (filter_project_id IS NULL OR rc.project_id = filter_project_id)
    AND (filter_metadata = '{}'::jsonb OR rc.metadata @> filter_metadata)
    AND (1 - (rc.embedding <=> query_embedding)) >= match_threshold
  ORDER BY rc.embedding <=> query_embedding ASC
  LIMIT LEAST(GREATEST(match_count, 1), 20);
$$;

COMMENT ON FUNCTION public.match_resume_chunks(extensions.vector(768), float, int, text, jsonb) IS
  'Performs cosine similarity search over public.resume_chunks using HNSW index with optional project_id and JSONB metadata predicates.';

GRANT EXECUTE ON FUNCTION public.match_resume_chunks(extensions.vector(768), float, int, text, jsonb)
  TO anon, authenticated, service_role;

-- 6. Table: public.resume_query_logs (Telemetry + 30-day pg_cron archival)
CREATE TABLE IF NOT EXISTS public.resume_query_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  context_project_id TEXT NULL,
  mode TEXT NOT NULL,
  latency_ms INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resume_query_logs_created_at
  ON public.resume_query_logs (created_at);

ALTER TABLE public.resume_query_logs ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.resume_query_logs TO service_role;

-- 7. Scheduled pg_cron job: purge query logs older than 30 days daily at 03:00 UTC
SELECT cron.schedule(
  'purge-old-resume-query-logs',
  '0 3 * * *',
  $$DELETE FROM public.resume_query_logs WHERE created_at < now() - INTERVAL '30 days'$$
);
```

---

## 4. Verification Queries (Post-Migration Gate)

After applying `001_resume_chunks_and_rpc.sql` via `supabase_mcp` `apply_migration`, the implementation workflow MUST execute:
1. **Extension & Index Check (`execute_sql`)**:
   ```sql
   SELECT extname, extversion FROM pg_extension WHERE extname IN ('vector', 'pg_cron');
   SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'resume_chunks';
   ```
2. **RPC Smoke Check (`execute_sql`)**:
   ```sql
   SELECT chunk_key, badge_label, target_card_id, round(similarity::numeric, 4) AS sim
   FROM public.match_resume_chunks(
     array_fill(0.01::real, ARRAY[768])::extensions.vector(768),
     0.0,
     3,
     'suhaycore',
     '{}'::jsonb
   );
   ```
3. **Supabase Security & Performance Advisors (`get_advisors`)**:
   - Verify `0` missing-RLS errors on `public.resume_chunks` and `public.resume_query_logs` and `0` mutable `search_path` warnings on `public.match_resume_chunks`.
