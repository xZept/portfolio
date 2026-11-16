# Database Contracts: n8n Automation Layer (`002_automation_layer.sql`)

**Feature**: `006-n8n-automation-layer`  
**Canonical Migration Path**: `apps/api/migrations/002_automation_layer.sql`  
**Mirrored Supabase CLI Path**: `supabase/migrations/002_automation_layer.sql`  
**Governance**: Constitution Principle V (*Git-First Database Migrations via Supabase MCP*)

---

## 1. Migration DDL Specification (`002_automation_layer.sql`)

```sql
-- Migration: 002_automation_layer.sql
-- Purpose: Extend public.resume_chunks with source_path, commit_sha, content_hash, and is_active;
--          update public.match_resume_chunks RPC to filter active chunks;
--          create public.doc_sync_events, public.contact_inquiries, and public.watchdog_runs
--          with Row-Level Security (RLS) and pg_cron retention policies.

-- 1. Extend public.resume_chunks for GitHub-to-RAG Sync & Watchdog Hygiene
ALTER TABLE public.resume_chunks
  ADD COLUMN IF NOT EXISTS source_path TEXT NOT NULL DEFAULT 'docs/resume.md',
  ADD COLUMN IF NOT EXISTS commit_sha TEXT NULL DEFAULT 'initial-seed',
  ADD COLUMN IF NOT EXISTS content_hash TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.resume_chunks
  DROP CONSTRAINT IF EXISTS resume_chunks_source_path_check;

ALTER TABLE public.resume_chunks
  ADD CONSTRAINT resume_chunks_source_path_check
  CHECK (source_path = 'README.md' OR source_path LIKE 'docs/%.md');

CREATE INDEX IF NOT EXISTS idx_resume_chunks_source_path
  ON public.resume_chunks (source_path);

CREATE INDEX IF NOT EXISTS idx_resume_chunks_stale
  ON public.resume_chunks (is_active, updated_at)
  WHERE is_active = false;

-- Update public read policy so visitors only read active chunks
DROP POLICY IF EXISTS "resume_chunks_public_read" ON public.resume_chunks;
CREATE POLICY "resume_chunks_public_read"
  ON public.resume_chunks
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- 2. Update public.match_resume_chunks RPC to exclude inactive/stale chunks
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
  WHERE rc.is_active = true
    AND (filter_project_id IS NULL OR rc.project_id = filter_project_id)
    AND (filter_metadata = '{}'::jsonb OR rc.metadata @> filter_metadata)
    AND (1 - (rc.embedding <=> query_embedding)) >= match_threshold
  ORDER BY rc.embedding <=> query_embedding ASC
  LIMIT LEAST(GREATEST(match_count, 1), 20);
$$;

-- 3. Table: public.doc_sync_events (Idempotent GitHub Push Sync Ledger)
CREATE TABLE IF NOT EXISTS public.doc_sync_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id TEXT NOT NULL UNIQUE CHECK (char_length(btrim(delivery_id)) > 0),
  commit_sha TEXT NOT NULL CHECK (char_length(btrim(commit_sha)) >= 7),
  branch TEXT NOT NULL DEFAULT 'main' CHECK (branch = 'main'),
  upserted_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
  removed_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
  chunks_upserted INTEGER NOT NULL DEFAULT 0 CHECK (chunks_upserted >= 0),
  chunks_deactivated INTEGER NOT NULL DEFAULT 0 CHECK (chunks_deactivated >= 0),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_sync_events_commit_sha
  ON public.doc_sync_events (commit_sha);

ALTER TABLE public.doc_sync_events ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.doc_sync_events TO service_role;

-- 4. Table: public.contact_inquiries (Contact Form Lead & Asynchronous Triage Store)
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 120),
  email TEXT NOT NULL CHECK (char_length(btrim(email)) BETWEEN 5 AND 254),
  subject TEXT NULL CHECK (subject IS NULL OR char_length(subject) <= 200),
  message TEXT NOT NULL CHECK (char_length(btrim(message)) BETWEEN 2 AND 4000),
  triage_status TEXT NOT NULL DEFAULT 'pending' CHECK (triage_status IN ('pending', 'classified', 'failed')),
  intent_category TEXT NULL CHECK (
    intent_category IN ('recruiter', 'freelance project', 'general inquiry')
    OR intent_category IS NULL
  ),
  triage_summary TEXT NULL,
  notification_sent BOOLEAN NOT NULL DEFAULT false,
  notified_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_inquiries_triage_status
  ON public.contact_inquiries (triage_status, created_at DESC);

ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.contact_inquiries TO service_role;

-- 5. Table: public.watchdog_runs (Weekly Health & Vector Index Cleanup Audit Log)
CREATE TABLE IF NOT EXISTS public.watchdog_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  frontend_healthy BOOLEAN NOT NULL,
  backend_healthy BOOLEAN NOT NULL,
  frontend_latency_ms INTEGER NULL CHECK (frontend_latency_ms IS NULL OR frontend_latency_ms >= 0),
  backend_latency_ms INTEGER NULL CHECK (backend_latency_ms IS NULL OR backend_latency_ms >= 0),
  stale_chunks_found INTEGER NOT NULL DEFAULT 0 CHECK (stale_chunks_found >= 0),
  stale_chunks_deleted INTEGER NOT NULL DEFAULT 0 CHECK (stale_chunks_deleted >= 0),
  deleted_chunk_keys JSONB NOT NULL DEFAULT '[]'::jsonb,
  alert_required BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'cleaned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_watchdog_runs_created_at
  ON public.watchdog_runs (created_at DESC);

ALTER TABLE public.watchdog_runs ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.watchdog_runs TO service_role;

-- 6. Scheduled pg_cron retention: purge watchdog_runs and doc_sync_events older than 90 days
SELECT cron.schedule(
  'purge-old-automation-audit-logs',
  '15 3 * * 0',
  $$DELETE FROM public.watchdog_runs WHERE created_at < now() - INTERVAL '90 days';
    DELETE FROM public.doc_sync_events WHERE created_at < now() - INTERVAL '90 days';$$
);
```

---

## 2. Security & RLS Verification Rules

1. **Row-Level Security (RLS)**: Enabled on `public.resume_chunks`, `public.doc_sync_events`, `public.contact_inquiries`, and `public.watchdog_runs`.
2. **Role Grants**:
   - `public.doc_sync_events`, `public.contact_inquiries`, and `public.watchdog_runs` grant access exclusively to `service_role` (zero public `anon` or `authenticated` exposure via PostgREST).
   - `public.resume_chunks` restricts `anon` and `authenticated` `SELECT` strictly to `USING (is_active = true)`.
3. **Function Security**: `public.match_resume_chunks` uses `SECURITY INVOKER` and explicitly sets `search_path = public, extensions` to satisfy Supabase security advisor checks.
