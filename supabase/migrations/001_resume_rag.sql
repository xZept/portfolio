-- Migration: 001_resume_rag.sql
-- PostgreSQL 18 (Supabase) + pgvector + pg_cron schema for Ask My Resume RAG service

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE TABLE IF NOT EXISTS public.resume_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding VECTOR(768) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resume_chunks_embedding_hnsw
  ON public.resume_chunks
  USING hnsw (embedding vector_cosine_ops);

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

-- Scheduled pg_cron job: purge query logs older than 30 days daily at 03:00 UTC
SELECT cron.schedule(
  'purge-old-resume-query-logs',
  '0 3 * * *',
  $$DELETE FROM public.resume_query_logs WHERE created_at < now() - INTERVAL '30 days'$$
);
