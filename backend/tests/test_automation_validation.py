from __future__ import annotations

import json
import time
from collections.abc import Generator
from pathlib import Path
from types import SimpleNamespace

import httpx
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.config import Settings, get_settings
from app.main import app
from app.schemas.ask_resume import ResumeCitation
from app.services import automation_service, rag_service, seed_resume_chunks
from app.services.automation_security import compute_automation_signature

TEST_SECRET = "test-automation-secret-32bytes-hex"


def _make_test_settings(
    *,
    secret: str = TEST_SECRET,
    gemini_api_key: str = "",
    n8n_contact_webhook_url: str = "http://localhost:5678/webhook/contact-triage",
) -> Settings:
    return Settings(
        automation_webhook_secret=secret,
        gemini_api_key=gemini_api_key,
        n8n_contact_webhook_url=n8n_contact_webhook_url,
        supabase_db_url="",
        supabase_url="",
        supabase_service_role_key="",
    )


@pytest.fixture(autouse=True)
def isolated_automation_env() -> Generator[None, None, None]:
    automation_service.reset_automation_state()
    test_cfg = _make_test_settings()
    app.dependency_overrides[get_settings] = lambda: test_cfg
    yield
    app.dependency_overrides.clear()
    automation_service.reset_automation_state()


client = TestClient(app)


def _signed_headers(
    raw_body: bytes,
    *,
    secret: str = TEST_SECRET,
    timestamp: int | str | None = None,
) -> dict[str, str]:
    ts = str(int(time.time()) if timestamp is None else timestamp)
    return {
        "Content-Type": "application/json",
        "X-Automation-Timestamp": ts,
        "X-Automation-Signature": compute_automation_signature(secret, ts, raw_body),
    }


# ---------------------------------------------------------------------------
# Phase 2 / US1: HMAC-SHA256 Security & Pydantic Validation Gates
# ---------------------------------------------------------------------------


def test_docs_sync_rejects_unconfigured_secret_and_bad_hmac() -> None:
    payload = {
        "delivery_id": "deliv-auth-001",
        "commit_sha": "abcdef1234567",
        "branch": "main",
        "upserted_files": [],
        "removed_files": [],
    }
    raw_body = json.dumps(payload).encode("utf-8")

    # Fail closed when AUTOMATION_WEBHOOK_SECRET is empty
    empty_cfg = _make_test_settings(secret="")
    app.dependency_overrides[get_settings] = lambda: empty_cfg
    res_unconfigured = client.post(
        "/api/v1/automation/docs-sync",
        content=raw_body,
        headers=_signed_headers(raw_body, secret="anything"),
    )
    assert res_unconfigured.status_code == 503

    # Restore configured secret
    app.dependency_overrides[get_settings] = lambda: _make_test_settings()

    # Missing timestamp -> 401
    res_no_ts = client.post(
        "/api/v1/automation/docs-sync",
        content=raw_body,
        headers={"Content-Type": "application/json", "X-Automation-Signature": "sha256=deadbeef"},
    )
    assert res_no_ts.status_code == 401

    # Non-integer timestamp -> 401
    res_bad_ts = client.post(
        "/api/v1/automation/docs-sync",
        content=raw_body,
        headers={
            "Content-Type": "application/json",
            "X-Automation-Timestamp": "not-an-int",
            "X-Automation-Signature": "sha256=deadbeef",
        },
    )
    assert res_bad_ts.status_code == 401

    # Expired timestamp (> 300s) -> 401
    expired_ts = int(time.time()) - 360
    res_expired = client.post(
        "/api/v1/automation/docs-sync",
        content=raw_body,
        headers=_signed_headers(raw_body, timestamp=expired_ts),
    )
    assert res_expired.status_code == 401

    # Missing signature -> 401
    res_no_sig = client.post(
        "/api/v1/automation/docs-sync",
        content=raw_body,
        headers={
            "Content-Type": "application/json",
            "X-Automation-Timestamp": str(int(time.time())),
        },
    )
    assert res_no_sig.status_code == 401

    # Mismatched signature -> 403
    res_bad_sig = client.post(
        "/api/v1/automation/docs-sync",
        content=raw_body,
        headers=_signed_headers(raw_body, secret="wrong-secret"),
    )
    assert res_bad_sig.status_code == 403


def test_docs_sync_rejects_malformed_branch_traversal_and_extra_fields() -> None:
    bad_payloads = [
        {
            "delivery_id": "deliv-bad-branch",
            "commit_sha": "abcdef1234567",
            "branch": "develop",
            "upserted_files": [],
            "removed_files": [],
        },
        {
            "delivery_id": "deliv-bad-ext",
            "commit_sha": "abcdef1234567",
            "branch": "main",
            "upserted_files": [{"file_path": "src/index.ts", "content": "console.log(1)"}],
            "removed_files": [],
        },
        {
            "delivery_id": "deliv-traversal",
            "commit_sha": "abcdef1234567",
            "branch": "main",
            "upserted_files": [{"file_path": "docs/../secrets.md", "content": "secret"}],
            "removed_files": [],
        },
        {
            "delivery_id": "deliv-removed-traversal",
            "commit_sha": "abcdef1234567",
            "branch": "main",
            "upserted_files": [],
            "removed_files": ["docs/../README.md"],
        },
        {
            "delivery_id": "deliv-extra-field",
            "commit_sha": "abcdef1234567",
            "branch": "main",
            "upserted_files": [],
            "removed_files": [],
            "unexpected": True,
        },
    ]

    for payload in bad_payloads:
        raw_body = json.dumps(payload).encode("utf-8")
        res = client.post(
            "/api/v1/automation/docs-sync",
            content=raw_body,
            headers=_signed_headers(raw_body),
        )
        assert res.status_code == 422


# ---------------------------------------------------------------------------
# US1: Idempotent Documentation Sync & Retry Recovery
# ---------------------------------------------------------------------------


def test_docs_sync_upserts_deduplicates_deactivates_and_retries_on_failure(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    initial_payload = {
        "delivery_id": "gh-delivery-001",
        "commit_sha": "1111111abcdef",
        "branch": "main",
        "upserted_files": [
            {
                "file_path": "README.md",
                "content": "# Portfolio\n\nBuilt SuhayCore and FitQuest.\n\n## Architecture\nFastAPI + Next.js.",
            },
            {
                "file_path": "docs/notes/architecture.md",
                "content": "## Deployment\nDeployed on Render and Vercel.",
            },
        ],
        "removed_files": [],
    }
    raw_initial = json.dumps(initial_payload).encode("utf-8")
    res_first = client.post(
        "/api/v1/automation/docs-sync",
        content=raw_initial,
        headers=_signed_headers(raw_initial),
    )
    assert res_first.status_code == 200
    body_first = res_first.json()
    assert body_first["status"] == "synced"
    assert body_first["chunks_upserted"] == 3
    assert body_first["chunks_removed"] == 0

    snapshot_after_first = automation_service.get_in_memory_snapshot()
    assert len(snapshot_after_first["chunks"]) == 3
    assert snapshot_after_first["chunks"]["README.md::portfolio"]["is_active"] is True

    # Replay exact same delivery_id -> duplicate_ignored with zero new upserts
    res_replay = client.post(
        "/api/v1/automation/docs-sync",
        content=raw_initial,
        headers=_signed_headers(raw_initial),
    )
    assert res_replay.status_code == 200
    body_replay = res_replay.json()
    assert body_replay["status"] == "duplicate_ignored"
    assert body_replay["chunks_upserted"] == 0
    assert body_replay["chunks_removed"] == 0

    # Empty file + removed file deactivates existing chunks
    deactivate_payload = {
        "delivery_id": "gh-delivery-002",
        "commit_sha": "2222222abcdef",
        "branch": "main",
        "upserted_files": [{"file_path": "README.md", "content": "   \n  "}],
        "removed_files": ["docs/notes/architecture.md"],
    }
    raw_deactivate = json.dumps(deactivate_payload).encode("utf-8")
    res_deactivate = client.post(
        "/api/v1/automation/docs-sync",
        content=raw_deactivate,
        headers=_signed_headers(raw_deactivate),
    )
    assert res_deactivate.status_code == 200
    body_deactivate = res_deactivate.json()
    assert body_deactivate["status"] == "synced"
    assert body_deactivate["chunks_upserted"] == 0
    assert body_deactivate["chunks_removed"] == 3

    # Embedding failure marks delivery failed without mutating chunks; retry with same delivery_id succeeds
    gemini_cfg = _make_test_settings(gemini_api_key="test-gemini-key")
    app.dependency_overrides[get_settings] = lambda: gemini_cfg

    def _fail_embeddings(*_args: object, **_kwargs: object) -> list[list[float]]:
        raise RuntimeError("Simulated Gemini 503")

    monkeypatch.setattr(seed_resume_chunks, "generate_embeddings", _fail_embeddings)

    retry_payload = {
        "delivery_id": "gh-delivery-retry-003",
        "commit_sha": "3333333abcdef",
        "branch": "main",
        "upserted_files": [
            {"file_path": "docs/guide.md", "content": "## Setup\nRun uvicorn."}
        ],
        "removed_files": [],
    }
    raw_retry = json.dumps(retry_payload).encode("utf-8")
    res_failed = client.post(
        "/api/v1/automation/docs-sync",
        content=raw_retry,
        headers=_signed_headers(raw_retry),
    )
    assert res_failed.status_code == 502
    snap_failed = automation_service.get_in_memory_snapshot()
    assert snap_failed["sync_events"]["gh-delivery-retry-003"]["status"] == "failed"
    assert "docs/guide.md::setup" not in snap_failed["chunks"]

    def _ok_embeddings(chunks: list[object], **_kwargs: object) -> list[list[float]]:
        return [[0.02] * 768 for _ in chunks]

    monkeypatch.setattr(seed_resume_chunks, "generate_embeddings", _ok_embeddings)
    res_retried = client.post(
        "/api/v1/automation/docs-sync",
        content=raw_retry,
        headers=_signed_headers(raw_retry),
    )
    assert res_retried.status_code == 200
    assert res_retried.json()["status"] == "synced"
    assert res_retried.json()["chunks_upserted"] == 1


# ---------------------------------------------------------------------------
# US2: Contact Inquiry Submission & Triage Callback
# ---------------------------------------------------------------------------


def test_contact_submission_valid_and_non_blocking_when_n8n_unreachable(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    called_urls: list[str] = []

    def _ok_post(url: str, **_kwargs: object) -> SimpleNamespace:
        called_urls.append(url)
        return SimpleNamespace(status_code=202, raise_for_status=lambda: None)

    monkeypatch.setattr(httpx, "post", _ok_post)

    res_ok = client.post(
        "/api/v1/contact",
        json={
            "name": "Sarah Jenkins",
            "email": "s.jenkins@techrecruiting.io",
            "subject": ".NET Developer Role",
            "message": "We would love to schedule an interview for our .NET role.",
        },
    )
    assert res_ok.status_code == 201
    ok_data = res_ok.json()
    assert ok_data["status"] == "received"
    assert ok_data["triage_status"] == "pending"
    assert len(called_urls) == 1

    # Simulate n8n outage / timeout -> POST /api/v1/contact MUST still succeed with 201
    monkeypatch.setattr(time, "sleep", lambda _s: None)
    attempt_count = 0

    def _timeout_post(*_args: object, **_kwargs: object) -> object:
        nonlocal attempt_count
        attempt_count += 1
        raise httpx.ConnectTimeout("Simulated n8n unreachable")

    monkeypatch.setattr(httpx, "post", _timeout_post)

    res_down = client.post(
        "/api/v1/contact",
        json={
            "name": "Alex Rivera",
            "email": "alex@startup.dev",
            "message": "Need a freelance MVP web app built in Next.js.",
        },
    )
    assert res_down.status_code == 201
    down_data = res_down.json()
    assert down_data["triage_status"] == "pending"
    assert attempt_count == 2  # initial attempt + 1 retry
    snap = automation_service.get_in_memory_snapshot()
    assert snap["inquiries"][down_data["inquiry_id"]]["triage_status"] == "failed"


def test_contact_submission_validation_422_and_triage_callback(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    # Validation rejections on public endpoint
    for bad_body in (
        {"name": "A", "email": "valid@example.com", "message": "Hello there"},
        {"name": "Valid Name", "email": "not-an-email", "message": "Hello there"},
        {"name": "Valid Name", "email": "valid@example.com", "message": "x" * 4001},
        {"name": "Valid Name", "email": "valid@example.com", "message": "Hi!", "spam": 1},
    ):
        res_bad = client.post("/api/v1/contact", json=bad_body)
        assert res_bad.status_code == 422

    # Create inquiry first
    monkeypatch.setattr(
        httpx,
        "post",
        lambda *_a, **_kw: SimpleNamespace(status_code=202, raise_for_status=lambda: None),
    )
    created = client.post(
        "/api/v1/contact",
        json={
            "name": "Recruiter Jane",
            "email": "jane@corp.com",
            "message": "Hiring for a full-time Junior .NET position.",
        },
    ).json()
    inquiry_id = created["inquiry_id"]

    # Unsigned callback rejected with 401
    triage_payload = {
        "inquiry_id": inquiry_id,
        "intent_category": "recruiter",
        "triage_summary": "Recruiter inquiry for Junior .NET role.",
        "notification_sent": True,
    }
    raw_triage = json.dumps(triage_payload).encode("utf-8")
    assert client.post("/api/v1/automation/contact-triage", content=raw_triage).status_code == 401

    # Invalid intent category rejected with 422
    invalid_intent = json.dumps(
        {
            "inquiry_id": inquiry_id,
            "intent_category": "sales spam",
            "triage_summary": "Invalid category",
            "notification_sent": True,
        }
    ).encode("utf-8")
    assert (
        client.post(
            "/api/v1/automation/contact-triage",
            content=invalid_intent,
            headers=_signed_headers(invalid_intent),
        ).status_code
        == 422
    )

    # Valid signed callback persists classification
    res_triage = client.post(
        "/api/v1/automation/contact-triage",
        content=raw_triage,
        headers=_signed_headers(raw_triage),
    )
    assert res_triage.status_code == 200
    triage_body = res_triage.json()
    assert triage_body["triage_status"] == "classified"
    assert triage_body["intent_category"] == "recruiter"
    assert triage_body["updated"] is True

    # Discord rate-limit / failure preserves intent_category with notification_sent=False
    failed_notify = json.dumps(
        {
            "inquiry_id": inquiry_id,
            "intent_category": "freelance project",
            "triage_summary": "Updated when Discord failed",
            "notification_sent": False,
        }
    ).encode("utf-8")
    res_partial = client.post(
        "/api/v1/automation/contact-triage",
        content=failed_notify,
        headers=_signed_headers(failed_notify),
    )
    assert res_partial.status_code == 200
    snap = automation_service.get_in_memory_snapshot()
    saved_row = snap["inquiries"][inquiry_id]
    assert saved_row["intent_category"] == "freelance project"
    assert saved_row["notification_sent"] is False
    assert saved_row["notified_at"] is None


def test_deterministic_contact_intent_classifier_tie_breaking() -> None:
    assert (
        automation_service.classify_contact_intent_deterministic(
            "Contract & Full-time Hiring",
            "We are recruiting for a full-time role and also need consulting.",
        )
        == "recruiter"
    )
    assert (
        automation_service.classify_contact_intent_deterministic(
            "MVP Build",
            "Looking for a freelance developer quote and timeline for a web app.",
        )
        == "freelance project"
    )
    assert (
        automation_service.classify_contact_intent_deterministic(
            None,
            "Hi, let's connect",
        )
        == "general inquiry"
    )


# ---------------------------------------------------------------------------
# US3: Scheduled Weekly Watchdog & Stale Chunk Cleanup
# ---------------------------------------------------------------------------


def test_watchdog_cleanup_auth_validation_cleaning_degraded_and_healthy() -> None:
    healthy_req = {
        "frontend_healthy": True,
        "backend_healthy": True,
        "frontend_latency_ms": 110,
        "backend_latency_ms": 45,
        "auto_clean": True,
    }
    raw_healthy = json.dumps(healthy_req).encode("utf-8")

    # Auth gates
    assert client.post("/api/v1/automation/watchdog/cleanup", content=raw_healthy).status_code == 401
    assert (
        client.post(
            "/api/v1/automation/watchdog/cleanup",
            content=raw_healthy,
            headers=_signed_headers(raw_healthy, secret="wrong-secret"),
        ).status_code
        == 403
    )

    # Validation 422 gate
    bad_watchdog = json.dumps(
        {
            "frontend_healthy": True,
            "backend_healthy": True,
            "frontend_latency_ms": -5,
            "auto_clean": True,
        }
    ).encode("utf-8")
    assert (
        client.post(
            "/api/v1/automation/watchdog/cleanup",
            content=bad_watchdog,
            headers=_signed_headers(bad_watchdog),
        ).status_code
        == 422
    )

    # Seed one active chunk + one inactive stale chunk + one superseded-commit chunk
    automation_service.seed_in_memory_chunk(
        "README.md::portfolio",
        "README.md",
        "Active README content",
        commit_sha="newsha123",
        is_active=True,
    )
    automation_service.seed_in_memory_chunk(
        "docs/legacy.md::old",
        "docs/legacy.md",
        "Deactivated legacy doc",
        commit_sha="oldsha000",
        is_active=False,
    )
    sync_payload = json.dumps(
        {
            "delivery_id": "deliv-supersede-001",
            "commit_sha": "newsha123",
            "branch": "main",
            "upserted_files": [{"file_path": "docs/arch.md", "content": "## Overview\nCurrent arch"}],
            "removed_files": [],
        }
    ).encode("utf-8")
    assert (
        client.post(
            "/api/v1/automation/docs-sync",
            content=sync_payload,
            headers=_signed_headers(sync_payload),
        ).status_code
        == 200
    )
    automation_service.seed_in_memory_chunk(
        "docs/arch.md::old-section",
        "docs/arch.md",
        "Superseded section from older commit",
        commit_sha="oldsha000",
        is_active=True,
    )

    res_cleaned = client.post(
        "/api/v1/automation/watchdog/cleanup",
        content=raw_healthy,
        headers=_signed_headers(raw_healthy),
    )
    assert res_cleaned.status_code == 200
    cleaned_body = res_cleaned.json()
    assert cleaned_body["status"] == "cleaned"
    assert cleaned_body["active_chunks_count"] == 2
    assert cleaned_body["stale_chunks_found"] == 2
    assert cleaned_body["stale_chunks_deleted"] == 2
    assert set(cleaned_body["deleted_chunk_keys"]) == {
        "docs/legacy.md::old",
        "docs/arch.md::old-section",
    }
    assert cleaned_body["alert_required"] is True

    # Re-run when clean and healthy -> quiet run (alert_required=False)
    res_quiet = client.post(
        "/api/v1/automation/watchdog/cleanup",
        content=raw_healthy,
        headers=_signed_headers(raw_healthy),
    )
    assert res_quiet.status_code == 200
    quiet_body = res_quiet.json()
    assert quiet_body["status"] == "healthy"
    assert quiet_body["stale_chunks_found"] == 0
    assert quiet_body["stale_chunks_deleted"] == 0
    assert quiet_body["alert_required"] is False
    assert quiet_body["alert_reasons"] == []

    # Degraded frontend/backend takes precedence over cleaned/healthy and requires alert
    degraded_req = {
        "frontend_healthy": False,
        "backend_healthy": True,
        "frontend_latency_ms": 5001,
        "backend_latency_ms": 40,
        "auto_clean": True,
    }
    raw_degraded = json.dumps(degraded_req).encode("utf-8")
    res_degraded = client.post(
        "/api/v1/automation/watchdog/cleanup",
        content=raw_degraded,
        headers=_signed_headers(raw_degraded),
    )
    assert res_degraded.status_code == 200
    degraded_body = res_degraded.json()
    assert degraded_body["status"] == "degraded"
    assert degraded_body["alert_required"] is True
    assert len(degraded_body["alert_reasons"]) == 1


def test_parse_markdown_document_canonical_constraints_and_hashes() -> None:
    readme_chunks = seed_resume_chunks.parse_markdown_document(
        "README.md",
        "# Portfolio\n\nFull-stack portfolio.\n\n## FitQuest Mobile\n\nBuilt FitQuest with Kotlin.",
        commit_sha="abc1234",
    )
    assert len(readme_chunks) == 2
    assert readme_chunks[0].chunk_key == "README.md::portfolio"
    assert readme_chunks[0].badge_label == "[Work: Orani Suhay Foundation]"
    assert readme_chunks[0].target_section_id == "about"
    assert len(readme_chunks[0].content_hash) == 64
    assert readme_chunks[1].badge_label == "[Project: FitQuest]"
    assert readme_chunks[1].project_id == "fitquest"

    empty_chunks = seed_resume_chunks.parse_markdown_document("docs/empty.md", "   \n\t  ")
    assert empty_chunks == []


def test_retrieve_pgvector_chunks_returns_synced_doc_chunks_with_canonical_targets(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    class _FakeModels:
        def embed_content(self, **_kwargs: object) -> object:
            return SimpleNamespace(
                embeddings=[SimpleNamespace(values=[0.01] * 768)]
            )

    class _FakeGenAIClient:
        def __init__(self, api_key: str) -> None:
            self.api_key = api_key
            self.models = _FakeModels()

    class _FakeCursor:
        def __enter__(self) -> "_FakeCursor":
            return self

        def __exit__(self, *_args: object) -> None:
            return None

        def execute(self, _sql: str, _params: dict[str, object]) -> None:
            return None

        def fetchall(self) -> list[tuple[object, ...]]:
            return [
                (
                    "README.md - Portfolio",
                    "[Work: Orani Suhay Foundation]",
                    "about",
                    "card-work-suhay",
                    None,
                    "Built SuhayCore and FitQuest.",
                    0.89,
                ),
                (
                    "docs/notes/architecture.md - Deployment",
                    "[Project: FitQuest]",
                    "experience",
                    "card-project-fitquest",
                    "fitquest",
                    "Deployed on Render and Vercel.",
                    0.84,
                ),
                (
                    "docs/bad.md - Bad",
                    "[Invalid Badge]",
                    "about",
                    "card-work-suhay",
                    None,
                    "Should be skipped",
                    0.80,
                ),
            ]

    class _FakeConn:
        def __enter__(self) -> "_FakeConn":
            return self

        def __exit__(self, *_args: object) -> None:
            return None

        def cursor(self) -> _FakeCursor:
            return _FakeCursor()

    import google.genai as genai_module
    import psycopg

    monkeypatch.setattr(genai_module, "Client", _FakeGenAIClient)
    monkeypatch.setattr(psycopg, "connect", lambda *_args, **_kwargs: _FakeConn())

    # Whitespace-only section still fails strict ResumeCitation validation
    with pytest.raises(ValidationError):
        ResumeCitation(
            section="   ",
            snippet="Valid snippet",
            badge_label="[Work: Orani Suhay Foundation]",
            target_section_id="about",
            target_card_id="card-work-suhay",
        )

    test_settings = Settings(
        gemini_api_key="test-gemini-key",
        supabase_db_url="postgresql://postgres:secret@localhost:5432/postgres",
    )
    citations = rag_service._retrieve_pgvector_chunks(
        "How is the portfolio deployed?",
        test_settings,
    )

    assert len(citations) == 2
    assert citations[0].section == "README.md - Portfolio"
    assert citations[0].badge_label == "[Work: Orani Suhay Foundation]"
    assert citations[0].target_section_id == "about"
    assert citations[0].target_card_id == "card-work-suhay"
    assert citations[1].section == "docs/notes/architecture.md - Deployment"
    assert citations[1].badge_label == "[Project: FitQuest]"
    assert citations[1].target_section_id == "experience"
    assert citations[1].target_card_id == "card-project-fitquest"


def test_contact_lead_triage_workflow_discord_retry_configuration() -> None:
    workflow_path = (
        Path(__file__).resolve().parents[2]
        / "automation"
        / "n8n"
        / "workflows"
        / "contact-lead-triage.workflow.json"
    )
    workflow = json.loads(workflow_path.read_text(encoding="utf-8"))
    discord_nodes = [
        node for node in workflow["nodes"] if node.get("name") == "POST Discord Notification"
    ]
    assert len(discord_nodes) == 1
    discord_node = discord_nodes[0]
    assert discord_node.get("retryOnFail") is True
    assert discord_node.get("maxTries") == 3
    assert discord_node.get("waitBetweenTries") == 1000
    assert discord_node.get("continueOnFail") is True
