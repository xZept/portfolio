from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


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
    assert isinstance(body["answer"], str) and len(body["answer"]) > 20
    assert "SuhayCore" in body["answer"]
    assert isinstance(body["citations"], list) and len(body["citations"]) >= 1
    assert body["citations"][0]["section"] == "Work Experience - Orani Suhay Foundation"
    assert body["mode"] in {"gemini-rag", "local-fallback"}
    assert isinstance(body["model_used"], str) and len(body["model_used"]) > 0
    assert isinstance(body["suggested_followups"], list) and len(body["suggested_followups"]) <= 3


def test_ask_resume_valid_without_context() -> None:
    response = client.post(
        "/api/v1/ask-resume",
        json={
            "question": "What certifications has Allen earned?",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert "JavaScript" in body["answer"] or "Cisco" in body["answer"]
    assert len(body["citations"]) >= 1


def test_ask_resume_rejects_empty_or_whitespace_question() -> None:
    for bad_question in ("", "    ", "\t\n  "):
        response = client.post(
            "/api/v1/ask-resume",
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
    response = client.post(
        "/api/v1/ask-resume",
        json={
            "question": "Valid question?",
            "hack": True,
        },
    )
    assert response.status_code == 422


def test_health_endpoint_schema() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "allen-portfolio-rag-api"
    assert body["version"] == "1.0.0"
    assert isinstance(body["rag_ready"], bool)
    assert body["model"] == "gemini-3.5-flash-lite"
    assert body["embedding_model"] == "gemini-embedding-2"
