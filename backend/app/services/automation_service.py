from __future__ import annotations

import json
import logging
import time
import uuid
from dataclasses import asdict
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import BackgroundTasks, HTTPException, status

from app.config import Settings, get_settings
from app.schemas.automation import (
    ContactSubmissionRequest,
    ContactSubmissionResponse,
    ContactTriageCallbackRequest,
    ContactTriageCallbackResponse,
    DocsSyncCallbackRequest,
    DocsSyncCallbackResponse,
    IntentCategory,
    WatchdogCleanupCallbackRequest,
    WatchdogCleanupCallbackResponse,
)
from app.services import rag_service, seed_resume_chunks
from app.services.seed_resume_chunks import (
    EMBEDDING_DIMENSIONS,
    SeedChunk,
    compute_content_hash,
    parse_markdown_document,
)

logger = logging.getLogger(__name__)

_RECRUITER_KEYWORDS = (
    "recruiter",
    "recruiting",
    "talent acquisition",
    "hiring",
    "interview",
    "full-time",
    "full time",
    "job opening",
    "position",
    "candidate",
    "compensation",
    "salary",
)
_FREELANCE_KEYWORDS = (
    "freelance",
    "contract",
    "project quote",
    "quote",
    "mvp",
    "consulting",
    "consultant",
    "client project",
    "budget",
    "timeline",
    "build a website",
    "web app",
)

# In-memory store used when Supabase credentials/DB URL are unconfigured (e.g. unit tests)
_MEM_CHUNKS: dict[str, dict[str, Any]] = {}
_MEM_SYNC_EVENTS: dict[str, dict[str, Any]] = {}
_MEM_SYNC_ORDER: list[str] = []
_MEM_INQUIRIES: dict[str, dict[str, Any]] = {}
_MEM_WATCHDOG_RUNS: list[dict[str, Any]] = []


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def reset_automation_state() -> None:
    """Clear in-memory automation state (used by unit test isolation fixtures)."""
    _MEM_CHUNKS.clear()
    _MEM_SYNC_EVENTS.clear()
    _MEM_SYNC_ORDER.clear()
    _MEM_INQUIRIES.clear()
    _MEM_WATCHDOG_RUNS.clear()


def get_in_memory_snapshot() -> dict[str, Any]:
    """Return read-only snapshot of in-memory automation tables for test assertions."""
    return {
        "chunks": dict(_MEM_CHUNKS),
        "sync_events": dict(_MEM_SYNC_EVENTS),
        "inquiries": dict(_MEM_INQUIRIES),
        "watchdog_runs": list(_MEM_WATCHDOG_RUNS),
    }


def seed_in_memory_chunk(
    chunk_key: str,
    source_path: str,
    content: str,
    *,
    commit_sha: str = "initial-seed",
    is_active: bool = True,
) -> None:
    """Insert or overwrite a chunk directly in the in-memory store for test fixtures."""
    _MEM_CHUNKS[chunk_key] = {
        "chunk_key": chunk_key,
        "source_path": source_path,
        "commit_sha": commit_sha,
        "content_hash": compute_content_hash(content),
        "is_active": is_active,
        "section": f"{source_path} - Seeded",
        "badge_label": "[Work: Orani Suhay Foundation]",
        "target_section_id": "about",
        "target_card_id": "card-work-suhay",
        "project_id": None,
        "content": content,
        "metadata": {"source_path": source_path, "commit_sha": commit_sha},
        "embedding": [0.01] * EMBEDDING_DIMENSIONS,
        "updated_at": _utc_now_iso(),
    }


def classify_contact_intent_deterministic(
    subject: str | None,
    message: str,
) -> IntentCategory:
    """Classify inquiry intent deterministically with priority recruiter > freelance project > general inquiry."""
    combined = f"{subject or ''} {message}".lower()
    if any(keyword in combined for keyword in _RECRUITER_KEYWORDS):
        return "recruiter"
    if any(keyword in combined for keyword in _FREELANCE_KEYWORDS):
        return "freelance project"
    return "general inquiry"


def _storage_mode(cfg: Settings) -> str:
    if cfg.supabase_url.strip() and cfg.supabase_service_role_key.strip():
        return "rest"
    if rag_service._is_valid_db_url(cfg.supabase_db_url):
        return "postgres"
    return "memory"


def _rest_headers(cfg: Settings, prefer: str | None = None) -> dict[str, str]:
    headers = {
        "apikey": cfg.supabase_service_role_key.strip(),
        "Authorization": f"Bearer {cfg.supabase_service_role_key.strip()}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    return headers


def _rest_url(cfg: Settings, table: str) -> str:
    return f"{cfg.supabase_url.strip().rstrip('/')}/rest/v1/{table}"


def _postgrest_in_list(values: list[str]) -> str:
    escaped = [f'"{val.replace(chr(34), chr(92) + chr(34))}"' for val in values]
    return f"in.({','.join(escaped)})"


# ---------------------------------------------------------------------------
# Database / REST / Memory adapters
# ---------------------------------------------------------------------------


def _get_sync_event(cfg: Settings, delivery_id: str) -> dict[str, Any] | None:
    mode = _storage_mode(cfg)
    if mode == "memory":
        return _MEM_SYNC_EVENTS.get(delivery_id)
    if mode == "rest":
        res = httpx.get(
            _rest_url(cfg, "doc_sync_events"),
            headers=_rest_headers(cfg),
            params={"delivery_id": f"eq.{delivery_id}", "select": "*"},
            timeout=15.0,
        )
        res.raise_for_status()
        rows = res.json()
        return rows[0] if rows else None

    import psycopg

    with psycopg.connect(cfg.supabase_db_url, connect_timeout=5) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT delivery_id, commit_sha, branch, upserted_paths, removed_paths,
                       chunks_upserted, chunks_deactivated, status, created_at, completed_at
                FROM public.doc_sync_events
                WHERE delivery_id = %s
                """,
                (delivery_id,),
            )
            row = cur.fetchone()
    if not row:
        return None
    return {
        "delivery_id": row[0],
        "commit_sha": row[1],
        "branch": row[2],
        "upserted_paths": row[3],
        "removed_paths": row[4],
        "chunks_upserted": row[5],
        "chunks_deactivated": row[6],
        "status": row[7],
        "created_at": row[8],
        "completed_at": row[9],
    }


def _upsert_sync_event(
    cfg: Settings,
    *,
    delivery_id: str,
    commit_sha: str,
    branch: str,
    upserted_paths: list[str],
    removed_paths: list[str],
    chunks_upserted: int,
    chunks_deactivated: int,
    event_status: str,
) -> None:
    mode = _storage_mode(cfg)
    completed_at = _utc_now_iso() if event_status == "completed" else None

    if mode == "memory":
        if delivery_id not in _MEM_SYNC_EVENTS:
            _MEM_SYNC_ORDER.append(delivery_id)
        _MEM_SYNC_EVENTS[delivery_id] = {
            "delivery_id": delivery_id,
            "commit_sha": commit_sha,
            "branch": branch,
            "upserted_paths": list(upserted_paths),
            "removed_paths": list(removed_paths),
            "chunks_upserted": chunks_upserted,
            "chunks_deactivated": chunks_deactivated,
            "status": event_status,
            "created_at": _MEM_SYNC_EVENTS.get(delivery_id, {}).get("created_at", _utc_now_iso()),
            "completed_at": completed_at,
        }
        return

    if mode == "rest":
        res = httpx.post(
            f"{_rest_url(cfg, 'doc_sync_events')}?on_conflict=delivery_id",
            headers=_rest_headers(cfg, "resolution=merge-duplicates,return=minimal"),
            json=[
                {
                    "delivery_id": delivery_id,
                    "commit_sha": commit_sha,
                    "branch": branch,
                    "upserted_paths": upserted_paths,
                    "removed_paths": removed_paths,
                    "chunks_upserted": chunks_upserted,
                    "chunks_deactivated": chunks_deactivated,
                    "status": event_status,
                    "completed_at": completed_at,
                }
            ],
            timeout=15.0,
        )
        res.raise_for_status()
        return

    import psycopg

    with psycopg.connect(cfg.supabase_db_url, connect_timeout=5) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO public.doc_sync_events (
                    delivery_id, commit_sha, branch, upserted_paths, removed_paths,
                    chunks_upserted, chunks_deactivated, status, completed_at
                )
                VALUES (%s, %s, %s, %s::jsonb, %s::jsonb, %s, %s, %s, %s)
                ON CONFLICT (delivery_id) DO UPDATE SET
                    commit_sha = EXCLUDED.commit_sha,
                    branch = EXCLUDED.branch,
                    upserted_paths = EXCLUDED.upserted_paths,
                    removed_paths = EXCLUDED.removed_paths,
                    chunks_upserted = EXCLUDED.chunks_upserted,
                    chunks_deactivated = EXCLUDED.chunks_deactivated,
                    status = EXCLUDED.status,
                    completed_at = EXCLUDED.completed_at
                """,
                (
                    delivery_id,
                    commit_sha,
                    branch,
                    json.dumps(upserted_paths),
                    json.dumps(removed_paths),
                    chunks_upserted,
                    chunks_deactivated,
                    event_status,
                    completed_at,
                ),
            )
        conn.commit()


def _get_chunks_for_source_path(cfg: Settings, source_path: str) -> dict[str, dict[str, Any]]:
    mode = _storage_mode(cfg)
    if mode == "memory":
        return {
            key: dict(val)
            for key, val in _MEM_CHUNKS.items()
            if val.get("source_path") == source_path
        }

    if mode == "rest":
        res = httpx.get(
            _rest_url(cfg, "resume_chunks"),
            headers=_rest_headers(cfg),
            params={
                "source_path": f"eq.{source_path}",
                "select": "chunk_key,source_path,commit_sha,content_hash,is_active",
            },
            timeout=15.0,
        )
        res.raise_for_status()
        return {row["chunk_key"]: row for row in res.json()}

    import psycopg

    with psycopg.connect(cfg.supabase_db_url, connect_timeout=5) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT chunk_key, source_path, commit_sha, content_hash, is_active
                FROM public.resume_chunks
                WHERE source_path = %s
                """,
                (source_path,),
            )
            rows = cur.fetchall()
    return {
        row[0]: {
            "chunk_key": row[0],
            "source_path": row[1],
            "commit_sha": row[2],
            "content_hash": row[3],
            "is_active": row[4],
        }
        for row in rows
    }


def _upsert_chunks_and_embeddings(
    cfg: Settings,
    chunks: list[SeedChunk],
    embeddings: list[list[float]],
) -> int:
    if not chunks:
        return 0
    mode = _storage_mode(cfg)
    if mode == "memory":
        for chunk, vec in zip(chunks, embeddings, strict=True):
            record = asdict(chunk)
            record["embedding"] = vec
            record["updated_at"] = _utc_now_iso()
            _MEM_CHUNKS[chunk.chunk_key] = record
        return len(chunks)
    if mode == "rest":
        return seed_resume_chunks.upsert_resume_chunks_via_rest(
            cfg.supabase_url,
            cfg.supabase_service_role_key,
            chunks,
            embeddings,
        )
    return seed_resume_chunks.upsert_resume_chunks(
        cfg.supabase_db_url,
        chunks,
        embeddings,
    )


def _refresh_unchanged_chunk_commits(
    cfg: Settings,
    chunk_keys: list[str],
    commit_sha: str,
) -> None:
    if not chunk_keys:
        return
    mode = _storage_mode(cfg)
    if mode == "memory":
        for key in chunk_keys:
            if key in _MEM_CHUNKS:
                _MEM_CHUNKS[key]["commit_sha"] = commit_sha
                _MEM_CHUNKS[key]["is_active"] = True
                _MEM_CHUNKS[key]["updated_at"] = _utc_now_iso()
        return
    if mode == "rest":
        res = httpx.patch(
            _rest_url(cfg, "resume_chunks"),
            headers=_rest_headers(cfg, "return=minimal"),
            params={"chunk_key": _postgrest_in_list(chunk_keys)},
            json={"commit_sha": commit_sha, "is_active": True, "updated_at": _utc_now_iso()},
            timeout=15.0,
        )
        res.raise_for_status()
        return

    import psycopg

    with psycopg.connect(cfg.supabase_db_url, connect_timeout=5) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE public.resume_chunks
                SET commit_sha = %s, is_active = true, updated_at = now()
                WHERE chunk_key = ANY(%s)
                """,
                (commit_sha, chunk_keys),
            )
        conn.commit()


def _deactivate_chunks_by_keys(cfg: Settings, chunk_keys: list[str]) -> int:
    if not chunk_keys:
        return 0
    mode = _storage_mode(cfg)
    if mode == "memory":
        count = 0
        for key in chunk_keys:
            row = _MEM_CHUNKS.get(key)
            if row and row.get("is_active", True):
                row["is_active"] = False
                row["updated_at"] = _utc_now_iso()
                count += 1
        return count
    if mode == "rest":
        res = httpx.patch(
            _rest_url(cfg, "resume_chunks"),
            headers=_rest_headers(cfg, "return=representation"),
            params={"chunk_key": _postgrest_in_list(chunk_keys), "is_active": "eq.true"},
            json={"is_active": False, "updated_at": _utc_now_iso()},
            timeout=15.0,
        )
        res.raise_for_status()
        return len(res.json())

    import psycopg

    with psycopg.connect(cfg.supabase_db_url, connect_timeout=5) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE public.resume_chunks
                SET is_active = false, updated_at = now()
                WHERE chunk_key = ANY(%s) AND is_active = true
                """,
                (chunk_keys,),
            )
            deactivated = cur.rowcount or 0
        conn.commit()
    return deactivated


def _deactivate_chunks_by_source_paths(cfg: Settings, source_paths: list[str]) -> int:
    if not source_paths:
        return 0
    mode = _storage_mode(cfg)
    if mode == "memory":
        target_paths = set(source_paths)
        count = 0
        for row in _MEM_CHUNKS.values():
            if row.get("source_path") in target_paths and row.get("is_active", True):
                row["is_active"] = False
                row["updated_at"] = _utc_now_iso()
                count += 1
        return count
    if mode == "rest":
        res = httpx.patch(
            _rest_url(cfg, "resume_chunks"),
            headers=_rest_headers(cfg, "return=representation"),
            params={"source_path": _postgrest_in_list(source_paths), "is_active": "eq.true"},
            json={"is_active": False, "updated_at": _utc_now_iso()},
            timeout=15.0,
        )
        res.raise_for_status()
        return len(res.json())

    import psycopg

    with psycopg.connect(cfg.supabase_db_url, connect_timeout=5) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE public.resume_chunks
                SET is_active = false, updated_at = now()
                WHERE source_path = ANY(%s) AND is_active = true
                """,
                (source_paths,),
            )
            deactivated = cur.rowcount or 0
        conn.commit()
    return deactivated


def _embed_chunks_for_sync(chunks: list[SeedChunk], cfg: Settings) -> list[list[float]]:
    if not chunks:
        return []
    if cfg.gemini_api_key.strip():
        return seed_resume_chunks.generate_embeddings(
            chunks=chunks,
            api_key=cfg.gemini_api_key,
            model=cfg.embedding_model,
        )
    return [[0.01] * EMBEDDING_DIMENSIONS for _ in chunks]


# ---------------------------------------------------------------------------
# User Story 1: Idempotent GitHub-to-RAG Sync
# ---------------------------------------------------------------------------


def process_docs_sync_event(
    payload: DocsSyncCallbackRequest,
    settings: Settings | None = None,
) -> DocsSyncCallbackResponse:
    """Idempotently sync README.md and docs/**/*.md updates into public.resume_chunks."""
    cfg = settings or get_settings()
    existing_event = _get_sync_event(cfg, payload.delivery_id)
    if existing_event and existing_event.get("status") == "completed":
        return DocsSyncCallbackResponse(
            status="duplicate_ignored",
            delivery_id=payload.delivery_id,
            commit_sha=payload.commit_sha,
            chunks_upserted=0,
            chunks_removed=0,
        )

    upserted_paths = [item.file_path for item in payload.upserted_files]
    removed_paths = list(dict.fromkeys(payload.removed_files))

    if not upserted_paths and not removed_paths:
        _upsert_sync_event(
            cfg,
            delivery_id=payload.delivery_id,
            commit_sha=payload.commit_sha,
            branch=payload.branch,
            upserted_paths=[],
            removed_paths=[],
            chunks_upserted=0,
            chunks_deactivated=0,
            event_status="completed",
        )
        return DocsSyncCallbackResponse(
            status="noop",
            delivery_id=payload.delivery_id,
            commit_sha=payload.commit_sha,
            chunks_upserted=0,
            chunks_removed=0,
        )

    _upsert_sync_event(
        cfg,
        delivery_id=payload.delivery_id,
        commit_sha=payload.commit_sha,
        branch=payload.branch,
        upserted_paths=upserted_paths,
        removed_paths=removed_paths,
        chunks_upserted=0,
        chunks_deactivated=0,
        event_status="processing",
    )

    chunks_to_embed: list[SeedChunk] = []
    unchanged_keys: list[str] = []
    superseded_keys: list[str] = []

    for doc_file in payload.upserted_files:
        parsed_chunks = parse_markdown_document(
            doc_file.file_path,
            doc_file.content,
            commit_sha=payload.commit_sha,
        )
        existing_by_key = _get_chunks_for_source_path(cfg, doc_file.file_path)
        parsed_keys = {chunk.chunk_key for chunk in parsed_chunks}

        for chunk in parsed_chunks:
            existing = existing_by_key.get(chunk.chunk_key)
            needs_embed = (
                existing is None
                or existing.get("content_hash") != chunk.content_hash
                or not bool(existing.get("is_active", True))
            )
            if needs_embed:
                chunks_to_embed.append(chunk)
            else:
                unchanged_keys.append(chunk.chunk_key)

        for old_key, old_row in existing_by_key.items():
            if old_key not in parsed_keys and bool(old_row.get("is_active", True)):
                superseded_keys.append(old_key)

    # Embed all new/changed chunks BEFORE mutating public.resume_chunks (FR-004, CHK025)
    try:
        embeddings = _embed_chunks_for_sync(chunks_to_embed, cfg)
    except Exception as exc:
        logger.error(
            "Embedding failure during docs-sync delivery_id=%s: %s",
            payload.delivery_id,
            exc,
        )
        _upsert_sync_event(
            cfg,
            delivery_id=payload.delivery_id,
            commit_sha=payload.commit_sha,
            branch=payload.branch,
            upserted_paths=upserted_paths,
            removed_paths=removed_paths,
            chunks_upserted=0,
            chunks_deactivated=0,
            event_status="failed",
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to generate embeddings for documentation sync: {exc}",
        ) from exc

    chunks_upserted = _upsert_chunks_and_embeddings(cfg, chunks_to_embed, embeddings)
    _refresh_unchanged_chunk_commits(cfg, unchanged_keys, payload.commit_sha)

    deactivated_superseded = _deactivate_chunks_by_keys(cfg, superseded_keys)
    deactivated_removed = _deactivate_chunks_by_source_paths(cfg, removed_paths)
    chunks_removed = deactivated_superseded + deactivated_removed

    _upsert_sync_event(
        cfg,
        delivery_id=payload.delivery_id,
        commit_sha=payload.commit_sha,
        branch=payload.branch,
        upserted_paths=upserted_paths,
        removed_paths=removed_paths,
        chunks_upserted=chunks_upserted,
        chunks_deactivated=chunks_removed,
        event_status="completed",
    )

    return DocsSyncCallbackResponse(
        status="synced",
        delivery_id=payload.delivery_id,
        commit_sha=payload.commit_sha,
        chunks_upserted=chunks_upserted,
        chunks_removed=chunks_removed,
    )


# ---------------------------------------------------------------------------
# User Story 2: Non-Blocking Contact Form & Asynchronous Triage
# ---------------------------------------------------------------------------


def _insert_contact_inquiry(
    cfg: Settings,
    inquiry_id: str,
    payload: ContactSubmissionRequest,
) -> None:
    mode = _storage_mode(cfg)
    now_iso = _utc_now_iso()
    if mode == "memory":
        _MEM_INQUIRIES[inquiry_id] = {
            "id": inquiry_id,
            "name": payload.name,
            "email": payload.email,
            "subject": payload.subject,
            "message": payload.message,
            "triage_status": "pending",
            "intent_category": None,
            "triage_summary": None,
            "notification_sent": False,
            "notified_at": None,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        return

    if mode == "rest":
        res = httpx.post(
            _rest_url(cfg, "contact_inquiries"),
            headers=_rest_headers(cfg, "return=minimal"),
            json=[
                {
                    "id": inquiry_id,
                    "name": payload.name,
                    "email": payload.email,
                    "subject": payload.subject,
                    "message": payload.message,
                    "triage_status": "pending",
                    "notification_sent": False,
                }
            ],
            timeout=10.0,
        )
        res.raise_for_status()
        return

    import psycopg

    with psycopg.connect(cfg.supabase_db_url, connect_timeout=5) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO public.contact_inquiries (
                    id, name, email, subject, message, triage_status, notification_sent
                )
                VALUES (%s::uuid, %s, %s, %s, %s, 'pending', false)
                """,
                (inquiry_id, payload.name, payload.email, payload.subject, payload.message),
            )
        conn.commit()


def _mark_contact_triage_failed(cfg: Settings, inquiry_id: str) -> None:
    mode = _storage_mode(cfg)
    if mode == "memory":
        if inquiry_id in _MEM_INQUIRIES:
            _MEM_INQUIRIES[inquiry_id]["triage_status"] = "failed"
            _MEM_INQUIRIES[inquiry_id]["updated_at"] = _utc_now_iso()
        return

    try:
        if mode == "rest":
            res = httpx.patch(
                _rest_url(cfg, "contact_inquiries"),
                headers=_rest_headers(cfg, "return=minimal"),
                params={"id": f"eq.{inquiry_id}"},
                json={"triage_status": "failed", "updated_at": _utc_now_iso()},
                timeout=10.0,
            )
            res.raise_for_status()
            return

        import psycopg

        with psycopg.connect(cfg.supabase_db_url, connect_timeout=5) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE public.contact_inquiries
                    SET triage_status = 'failed', updated_at = now()
                    WHERE id = %s::uuid
                    """,
                    (inquiry_id,),
                )
            conn.commit()
    except Exception as exc:  # pragma: no cover - defensive logging in background task
        logger.error("Failed to mark contact inquiry %s as failed: %s", inquiry_id, exc)


def dispatch_contact_to_n8n(
    inquiry_id: str,
    payload: ContactSubmissionRequest,
    settings: Settings | None = None,
) -> None:
    """Asynchronously dispatch contact inquiry to n8n webhook with 70s cold-start timeout & 1 retry."""
    cfg = settings or get_settings()
    webhook_url = cfg.n8n_contact_webhook_url.strip()
    if not webhook_url:
        logger.warning(
            "N8N_CONTACT_WEBHOOK_URL is unconfigured; marking inquiry %s triage_status='failed'.",
            inquiry_id,
        )
        _mark_contact_triage_failed(cfg, inquiry_id)
        return

    body = {
        "inquiry_id": inquiry_id,
        "name": payload.name,
        "email": payload.email,
        "subject": payload.subject,
        "message": payload.message,
        "submitted_at": _utc_now_iso(),
    }

    last_error: Exception | None = None
    for attempt in range(2):
        try:
            response = httpx.post(webhook_url, json=body, timeout=70.0)
            response.raise_for_status()
            return
        except Exception as exc:
            last_error = exc
            logger.warning(
                "n8n contact webhook dispatch attempt %d failed for inquiry %s: %s",
                attempt + 1,
                inquiry_id,
                exc,
            )
            if attempt == 0:
                time.sleep(1.0)

    logger.error(
        "Exhausted n8n contact webhook retries for inquiry %s (%s); marking triage_status='failed'.",
        inquiry_id,
        last_error,
    )
    _mark_contact_triage_failed(cfg, inquiry_id)


def submit_contact_inquiry(
    payload: ContactSubmissionRequest,
    background_tasks: BackgroundTasks,
    settings: Settings | None = None,
) -> ContactSubmissionResponse:
    """Persist visitor contact inquiry immediately and dispatch triage asynchronously."""
    cfg = settings or get_settings()
    inquiry_id = str(uuid.uuid4())
    _insert_contact_inquiry(cfg, inquiry_id, payload)
    background_tasks.add_task(dispatch_contact_to_n8n, inquiry_id, payload, cfg)

    return ContactSubmissionResponse(
        inquiry_id=inquiry_id,
        status="received",
        triage_status="pending",
        message="Thank you for reaching out! Your message has been received and Allen will respond shortly.",
    )


def record_contact_triage_result(
    payload: ContactTriageCallbackRequest,
    settings: Settings | None = None,
) -> ContactTriageCallbackResponse:
    """Persist n8n intent classification and notification state for a contact inquiry."""
    cfg = settings or get_settings()
    mode = _storage_mode(cfg)
    now_iso = _utc_now_iso()
    notified_at = now_iso if payload.notification_sent else None
    updated = False

    if mode == "memory":
        row = _MEM_INQUIRIES.get(payload.inquiry_id)
        if row is not None:
            row["triage_status"] = "classified"
            row["intent_category"] = payload.intent_category
            row["triage_summary"] = payload.triage_summary
            row["notification_sent"] = payload.notification_sent
            row["notified_at"] = notified_at
            row["updated_at"] = now_iso
            updated = True
    elif mode == "rest":
        res = httpx.patch(
            _rest_url(cfg, "contact_inquiries"),
            headers=_rest_headers(cfg, "return=representation"),
            params={"id": f"eq.{payload.inquiry_id}"},
            json={
                "triage_status": "classified",
                "intent_category": payload.intent_category,
                "triage_summary": payload.triage_summary,
                "notification_sent": payload.notification_sent,
                "notified_at": notified_at,
                "updated_at": now_iso,
            },
            timeout=15.0,
        )
        res.raise_for_status()
        updated = len(res.json()) > 0
    else:
        import psycopg

        with psycopg.connect(cfg.supabase_db_url, connect_timeout=5) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE public.contact_inquiries
                    SET triage_status = 'classified',
                        intent_category = %s,
                        triage_summary = %s,
                        notification_sent = %s,
                        notified_at = %s,
                        updated_at = now()
                    WHERE id = %s::uuid
                    """,
                    (
                        payload.intent_category,
                        payload.triage_summary,
                        payload.notification_sent,
                        notified_at,
                        payload.inquiry_id,
                    ),
                )
                updated = (cur.rowcount or 0) > 0
            conn.commit()

    return ContactTriageCallbackResponse(
        inquiry_id=payload.inquiry_id,
        triage_status="classified",
        intent_category=payload.intent_category,
        updated=updated,
    )


# ---------------------------------------------------------------------------
# User Story 3: Weekly Watchdog & Stale Chunk Cleanup
# ---------------------------------------------------------------------------


def _list_chunks_and_latest_commits(
    cfg: Settings,
) -> tuple[list[dict[str, Any]], dict[str, str]]:
    """Return all chunks and the latest completed commit_sha per source_path."""
    mode = _storage_mode(cfg)
    if mode == "memory":
        latest_commit_by_path: dict[str, str] = {}
        for delivery_id in _MEM_SYNC_ORDER:
            ev = _MEM_SYNC_EVENTS.get(delivery_id, {})
            if ev.get("status") != "completed":
                continue
            for path in ev.get("upserted_paths", []):
                latest_commit_by_path[path] = ev["commit_sha"]
        return [dict(row) for row in _MEM_CHUNKS.values()], latest_commit_by_path

    if mode == "rest":
        chunks_res = httpx.get(
            _rest_url(cfg, "resume_chunks"),
            headers=_rest_headers(cfg),
            params={"select": "chunk_key,source_path,commit_sha,is_active"},
            timeout=15.0,
        )
        chunks_res.raise_for_status()
        events_res = httpx.get(
            _rest_url(cfg, "doc_sync_events"),
            headers=_rest_headers(cfg),
            params={
                "status": "eq.completed",
                "select": "commit_sha,upserted_paths,completed_at,created_at",
                "order": "created_at.asc",
            },
            timeout=15.0,
        )
        events_res.raise_for_status()
        latest_commit_by_path = {}
        for ev in events_res.json():
            for path in ev.get("upserted_paths") or []:
                latest_commit_by_path[path] = ev["commit_sha"]
        return chunks_res.json(), latest_commit_by_path

    import psycopg

    with psycopg.connect(cfg.supabase_db_url, connect_timeout=5) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT chunk_key, source_path, commit_sha, is_active FROM public.resume_chunks"
            )
            chunk_rows = [
                {
                    "chunk_key": r[0],
                    "source_path": r[1],
                    "commit_sha": r[2],
                    "is_active": r[3],
                }
                for r in cur.fetchall()
            ]
            cur.execute(
                """
                SELECT commit_sha, upserted_paths
                FROM public.doc_sync_events
                WHERE status = 'completed'
                ORDER BY created_at ASC
                """
            )
            latest_commit_by_path = {}
            for commit_sha, upserted_paths in cur.fetchall():
                for path in upserted_paths or []:
                    latest_commit_by_path[path] = commit_sha
    return chunk_rows, latest_commit_by_path


def _delete_stale_chunks(cfg: Settings, chunk_keys: list[str]) -> int:
    if not chunk_keys:
        return 0
    mode = _storage_mode(cfg)
    if mode == "memory":
        deleted = 0
        for key in chunk_keys:
            if key in _MEM_CHUNKS:
                del _MEM_CHUNKS[key]
                deleted += 1
        return deleted

    if mode == "rest":
        res = httpx.delete(
            _rest_url(cfg, "resume_chunks"),
            headers=_rest_headers(cfg, "return=representation"),
            params={"chunk_key": _postgrest_in_list(chunk_keys)},
            timeout=15.0,
        )
        res.raise_for_status()
        return len(res.json())

    import psycopg

    with psycopg.connect(cfg.supabase_db_url, connect_timeout=5) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM public.resume_chunks WHERE chunk_key = ANY(%s)",
                (chunk_keys,),
            )
            deleted = cur.rowcount or 0
        conn.commit()
    return deleted


def _record_watchdog_run(
    cfg: Settings,
    *,
    run_id: str,
    payload: WatchdogCleanupCallbackRequest,
    stale_chunks_found: int,
    stale_chunks_deleted: int,
    deleted_chunk_keys: list[str],
    alert_required: bool,
    run_status: str,
) -> None:
    mode = _storage_mode(cfg)
    row = {
        "id": run_id,
        "frontend_healthy": payload.frontend_healthy,
        "backend_healthy": payload.backend_healthy,
        "frontend_latency_ms": payload.frontend_latency_ms,
        "backend_latency_ms": payload.backend_latency_ms,
        "stale_chunks_found": stale_chunks_found,
        "stale_chunks_deleted": stale_chunks_deleted,
        "deleted_chunk_keys": deleted_chunk_keys,
        "alert_required": alert_required,
        "status": run_status,
    }
    if mode == "memory":
        row["created_at"] = _utc_now_iso()
        _MEM_WATCHDOG_RUNS.append(row)
        return

    if mode == "rest":
        res = httpx.post(
            _rest_url(cfg, "watchdog_runs"),
            headers=_rest_headers(cfg, "return=minimal"),
            json=[row],
            timeout=15.0,
        )
        res.raise_for_status()
        return

    import psycopg

    with psycopg.connect(cfg.supabase_db_url, connect_timeout=5) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO public.watchdog_runs (
                    id, frontend_healthy, backend_healthy, frontend_latency_ms,
                    backend_latency_ms, stale_chunks_found, stale_chunks_deleted,
                    deleted_chunk_keys, alert_required, status
                )
                VALUES (%s::uuid, %s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s)
                """,
                (
                    run_id,
                    payload.frontend_healthy,
                    payload.backend_healthy,
                    payload.frontend_latency_ms,
                    payload.backend_latency_ms,
                    stale_chunks_found,
                    stale_chunks_deleted,
                    json.dumps(deleted_chunk_keys),
                    alert_required,
                    run_status,
                ),
            )
        conn.commit()


def run_watchdog_cleanup(
    payload: WatchdogCleanupCallbackRequest,
    settings: Settings | None = None,
) -> WatchdogCleanupCallbackResponse:
    """Inspect active/stale chunks, optionally purge stale chunks, and record audit log."""
    cfg = settings or get_settings()
    all_chunks, latest_commit_by_path = _list_chunks_and_latest_commits(cfg)

    stale_keys: list[str] = []
    active_count = 0
    for chunk in all_chunks:
        key = chunk["chunk_key"]
        source_path = chunk.get("source_path")
        latest_commit = latest_commit_by_path.get(source_path) if source_path else None
        is_inactive = not bool(chunk.get("is_active", True))
        is_superseded = (
            latest_commit is not None and chunk.get("commit_sha") != latest_commit
        )
        if is_inactive or is_superseded:
            stale_keys.append(key)
        else:
            active_count += 1

    stale_chunks_found = len(stale_keys)
    deleted_chunk_keys: list[str] = []
    stale_chunks_deleted = 0
    if payload.auto_clean and stale_keys:
        stale_chunks_deleted = _delete_stale_chunks(cfg, stale_keys)
        deleted_chunk_keys = stale_keys

    alert_reasons: list[str] = []
    if not payload.frontend_healthy:
        alert_reasons.append(
            f"Frontend health probe failed (latency_ms={payload.frontend_latency_ms})."
        )
    if not payload.backend_healthy:
        alert_reasons.append(
            f"Backend /api/v1/health probe failed (latency_ms={payload.backend_latency_ms})."
        )
    if stale_chunks_deleted > 0:
        alert_reasons.append(
            f"Cleaned {stale_chunks_deleted} stale/orphaned vector chunks from public.resume_chunks."
        )
    elif stale_chunks_found > 0:
        alert_reasons.append(
            f"Detected {stale_chunks_found} stale/orphaned vector chunks awaiting cleanup."
        )

    if not payload.frontend_healthy or not payload.backend_healthy:
        run_status: str = "degraded"
    elif stale_chunks_deleted > 0:
        run_status = "cleaned"
    else:
        run_status = "healthy"

    alert_required = (
        not payload.frontend_healthy
        or not payload.backend_healthy
        or stale_chunks_deleted > 0
        or stale_chunks_found > 0
    )

    run_id = str(uuid.uuid4())
    _record_watchdog_run(
        cfg,
        run_id=run_id,
        payload=payload,
        stale_chunks_found=stale_chunks_found,
        stale_chunks_deleted=stale_chunks_deleted,
        deleted_chunk_keys=deleted_chunk_keys,
        alert_required=alert_required,
        run_status=run_status,
    )

    return WatchdogCleanupCallbackResponse(
        run_id=run_id,
        status=run_status,  # type: ignore[arg-type]
        frontend_healthy=payload.frontend_healthy,
        backend_healthy=payload.backend_healthy,
        active_chunks_count=active_count,
        stale_chunks_found=stale_chunks_found,
        stale_chunks_deleted=stale_chunks_deleted,
        deleted_chunk_keys=deleted_chunk_keys,
        alert_required=alert_required,
        alert_reasons=alert_reasons,
    )
