import json
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from pydantic import TypeAdapter, ValidationError

from app.config import Settings
from app.main import app
from app.schemas.ask_resume import (
    AskResumeResponse,
    AskResumeStreamDoneEvent,
    AskResumeStreamErrorEvent,
    AskResumeStreamEvent,
    AskResumeStreamTokenEvent,
    HealthResponse,
    ResumeCitation,
)
from app.services import rag_service

client = TestClient(app)

CANONICAL_BADGES = {
    "[Work: Orani Suhay Foundation]",
    "[Work: DACON Corp]",
    "[Project: FitQuest]",
    "[Education: BPSU]",
    "[Certifications]",
}


def test_ask_resume_valid_payload() -> None:
    response = client.post(
        "/api/v1/ask-resume",
        json={
            "question": "What did Allen build during his internship at Orani Suhay Foundation?",
            "context_project_id": "suhaycore",
        },
    )
    assert response.status_code == 200
    body = response.json()
    validated = AskResumeResponse.model_validate(body)
    assert len(validated.answer) > 20
    assert "SuhayCore" in validated.answer
    assert validated.is_off_topic is False
    assert len(validated.citations) >= 1
    assert validated.citations[0].section == "Work Experience - Orani Suhay Foundation"
    assert validated.citations[0].badge_label == "[Work: Orani Suhay Foundation]"
    assert validated.citations[0].target_section_id == "experience"
    assert validated.citations[0].target_card_id == "card-work-suhay"
    assert all(c.badge_label in CANONICAL_BADGES for c in validated.citations)
    assert validated.mode in {"gemini-rag", "local-fallback"}
    assert len(validated.model_used) > 0
    assert len(validated.suggested_followups) <= 3


def test_ask_resume_valid_without_context() -> None:
    response = client.post(
        "/api/v1/ask-resume",
        json={
            "question": "What certifications has Allen earned?",
        },
    )
    assert response.status_code == 200
    body = response.json()
    validated = AskResumeResponse.model_validate(body)
    assert "JavaScript" in validated.answer or "Cisco" in validated.answer
    assert validated.is_off_topic is False
    assert len(validated.citations) >= 1
    assert validated.citations[0].badge_label == "[Certifications]"
    assert validated.citations[0].target_section_id == "certifications"
    assert validated.citations[0].target_card_id == "card-certifications"


def test_ask_resume_rejects_empty_or_whitespace_question() -> None:
    for bad_question in ("", "    ", "\t\n  "):
        for endpoint in ("/api/v1/ask-resume", "/api/v1/ask-resume/stream"):
            response = client.post(
                endpoint,
                json={"question": bad_question},
            )
            assert response.status_code == 422


def test_ask_resume_rejects_too_short_question() -> None:
    response = client.post(
        "/api/v1/ask-resume",
        json={"question": "?"},
    )
    assert response.status_code == 422


def test_ask_resume_rejects_over_max_length_question() -> None:
    response = client.post(
        "/api/v1/ask-resume",
        json={"question": "a" * 501},
    )
    assert response.status_code == 422


def test_ask_resume_rejects_invalid_project_id() -> None:
    response = client.post(
        "/api/v1/ask-resume",
        json={
            "question": "Tell me about an invalid project.",
            "context_project_id": "invalid",
        },
    )
    assert response.status_code == 422


def test_ask_resume_rejects_extra_fields() -> None:
    for endpoint in ("/api/v1/ask-resume", "/api/v1/ask-resume/stream"):
        response = client.post(
            endpoint,
            json={
                "question": "Valid question?",
                "hack": True,
            },
        )
        assert response.status_code == 422

    # Direct Pydantic 2.14.3 schema boundary checks (extra="forbid" + canonical badge enforcement)
    with pytest.raises(ValidationError):
        ResumeCitation(
            section="Education",
            snippet="BPSU BSCS",
            badge_label="[Summary]",  # type: ignore[arg-type]
        )

    with pytest.raises(ValidationError):
        ResumeCitation(
            section="Education",
            snippet="BPSU BSCS",
            extra_field="forbidden",  # type: ignore[call-arg]
        )

    with pytest.raises(ValidationError):
        AskResumeResponse(
            answer="Valid answer",
            citations=[],
            mode="local-fallback",
            is_off_topic=False,
            model_used="deterministic-resume-grounding",
        )

    with pytest.raises(ValidationError):
        AskResumeResponse(
            answer="Valid answer",
            citations=[ResumeCitation(section="Education", snippet="BPSU BSCS")],
            mode="local-fallback",
            is_off_topic=False,
            model_used="deterministic-resume-grounding",
            unexpected="forbidden",  # type: ignore[call-arg]
        )

    with pytest.raises(ValidationError):
        AskResumeStreamTokenEvent(delta="ok", extra_key=1)  # type: ignore[call-arg]

    with pytest.raises(ValidationError):
        AskResumeStreamErrorEvent(message="oops", extra_key=1)  # type: ignore[call-arg]

    valid_citation = ResumeCitation(section="Education", snippet="BPSU BSCS")
    valid_response = AskResumeResponse(
        answer="BPSU BSCS [Education: BPSU]",
        citations=[valid_citation],
        mode="local-fallback",
        model_used="deterministic-resume-grounding",
    )
    with pytest.raises(ValidationError):
        AskResumeStreamDoneEvent(response=valid_response, extra_key=1)  # type: ignore[call-arg]

    with pytest.raises(ValidationError):
        HealthResponse(rag_ready=False, extra_key=1)  # type: ignore[call-arg]


def test_health_endpoint_schema() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    validated = HealthResponse.model_validate(body)
    assert validated.status == "ok"
    assert validated.service == "allen-portfolio-rag-api"
    assert validated.version == "1.0.0"
    assert isinstance(validated.rag_ready, bool)
    assert validated.model == "gemini-3.5-flash-lite"
    assert validated.embedding_model == "gemini-embedding-2"


def test_ask_resume_off_topic_guardrail_refusal(monkeypatch: pytest.MonkeyPatch) -> None:
    def _fail_if_called(*args: object, **kwargs: object) -> object:
        raise AssertionError("Off-topic queries must decline before invoking Gemini or pgvector.")

    monkeypatch.setattr(rag_service, "_retrieve_pgvector_chunks", _fail_if_called)

    off_topic_prompts = (
        "What is the capital of France?",
        "Write me a snake game in Rust",
        "What is Allen's marital status and personal home address?",
    )
    for prompt in off_topic_prompts:
        response = client.post(
            "/api/v1/ask-resume",
            json={"question": prompt},
        )
        assert response.status_code == 200
        body = response.json()
        validated = AskResumeResponse.model_validate(body)
        assert validated.is_off_topic is True
        assert validated.mode == "guardrail-refusal"
        assert validated.citations == []
        assert "allenjames.laxamana@gmail.com" in validated.answer
        assert "Paris" not in validated.answer

    # Streaming endpoint must also refuse off-topic prompts cleanly without calling RAG
    with client.stream(
        "POST",
        "/api/v1/ask-resume/stream",
        json={"question": "What is the capital of France?"},
    ) as stream_res:
        assert stream_res.status_code == 200
        events = [
            TypeAdapter(AskResumeStreamEvent).validate_json(line.removeprefix("data: "))
            for line in stream_res.iter_lines()
            if line.startswith("data: ")
        ]

    assert len(events) >= 2
    assert all(isinstance(ev, AskResumeStreamTokenEvent) for ev in events[:-1])
    done_event = events[-1]
    assert isinstance(done_event, AskResumeStreamDoneEvent)
    assert done_event.response.is_off_topic is True
    assert done_event.response.mode == "guardrail-refusal"
    assert done_event.response.citations == []


def test_ask_resume_stream_endpoint_emits_tokens_and_citations() -> None:
    with client.stream(
        "POST",
        "/api/v1/ask-resume/stream",
        json={
            "question": "Tell me about his RAG AI chatbot and FastAPI work at DACON.",
            "context_project_id": "dan",
        },
    ) as response:
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/event-stream")
        raw_lines = [line for line in response.iter_lines() if line.startswith("data: ")]

    assert len(raw_lines) >= 2
    adapter = TypeAdapter(AskResumeStreamEvent)
    events = [adapter.validate_json(line.removeprefix("data: ")) for line in raw_lines]

    token_events = [ev for ev in events[:-1] if isinstance(ev, AskResumeStreamTokenEvent)]
    assert len(token_events) == len(events) - 1
    assert len(token_events) >= 2

    done_event = events[-1]
    assert isinstance(done_event, AskResumeStreamDoneEvent)
    streamed_text = "".join(ev.delta for ev in token_events)
    assert streamed_text == done_event.response.answer
    assert done_event.response.is_off_topic is False
    assert len(done_event.response.citations) >= 1
    assert done_event.response.citations[0].badge_label == "[Work: DACON Corp]"
    assert done_event.response.citations[0].target_section_id == "experience"
    assert done_event.response.citations[0].target_card_id == "card-work-dacon"


def test_match_resume_chunks_rpc_invocation(monkeypatch: pytest.MonkeyPatch) -> None:
    executed_calls: list[tuple[str, dict[str, object]]] = []
    embed_calls: list[dict[str, object]] = []

    class _FakeModels:
        def embed_content(self, **kwargs: object) -> object:
            embed_calls.append(kwargs)
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

        def execute(self, sql: str, params: dict[str, object]) -> None:
            executed_calls.append((sql, params))

        def fetchall(self) -> list[tuple[object, ...]]:
            return [
                (
                    "Work Experience - Orani Suhay Foundation",
                    "[Work: Orani Suhay Foundation]",
                    "experience",
                    "card-work-suhay",
                    "suhaycore",
                    "Independently designed and developed SuhayCore using C# (.NET 10), Blazor (MudBlazor), and PostgreSQL.",
                    0.91,
                )
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
    monkeypatch.setattr(psycopg, "connect", lambda *args, **kwargs: _FakeConn())

    # Malformed template DB URLs must fail fast without calling Gemini or Postgres
    assert (
        rag_service._is_valid_db_url(
            "postgresql://postgres:[DXek4bEEqVUmZc5k]@db.iixpswqqkxfghbujdnha.supabase.co:5432/postgres"
        )
        is False
    )

    test_settings = Settings(
        gemini_api_key="test-gemini-key",
        supabase_db_url="postgresql://postgres:secret@localhost:5432/postgres",
    )
    citations = rag_service._retrieve_pgvector_chunks(
        "How did Allen architect SuhayCore?",
        test_settings,
        context_project_id="suhaycore",
    )

    assert len(embed_calls) == 1
    assert embed_calls[0]["model"] == "gemini-embedding-2"
    assert len(executed_calls) == 1
    sql_text, params = executed_calls[0]
    assert "public.match_resume_chunks" in sql_text
    assert params["match_threshold"] == 0.35
    assert params["match_count"] == 5
    assert params["filter_project_id"] == "suhaycore"
    assert json.loads(str(params["filter_metadata"])) == {}
    assert len(citations) == 1
    assert citations[0].badge_label == "[Work: Orani Suhay Foundation]"
    assert citations[0].target_card_id == "card-work-suhay"
