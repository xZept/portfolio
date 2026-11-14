# Backend API Contracts: Portfolio FastAPI + Gemini RAG Service

**Feature Branch**: `001-single-page-portfolio`  
**Backend Runtime**: Python 3.13 + FastAPI 0.162.5 + Pydantic 2.14.3  
**Base URL**: `http://localhost:8000` (Local) / `NEXT_PUBLIC_API_URL` (Render Production)

---

## 1. `GET /api/v1/health`

Returns service health and RAG vector-store readiness.

### Response `200 OK` (`HealthResponse` — Pydantic 2.14.3)
```json
{
  "status": "ok",
  "service": "allen-portfolio-rag-api",
  "version": "1.0.0",
  "rag_ready": true,
  "model": "gemini-3.5-flash-lite",
  "embedding_model": "gemini-embedding-2"
}
```

---

## 2. `POST /api/v1/ask-resume`

Answers visitor questions strictly grounded in `docs/resume.md` using `gemini-embedding-2` + Supabase `pgvector` retrieval + `gemini-3.5-flash-lite` generation, with automatic deterministic fallback if external cloud credentials are unconfigured.

### Request Headers
- `Content-Type: application/json`

### Request Body (`AskResumeRequest` — Pydantic 2.14.3)
```json
{
  "question": "What did Allen build during his internship at Orani Suhay Foundation?",
  "context_project_id": "suhaycore"
}
```

#### Pydantic 2.14.3 Field Validation Rules
| Field | Type | Validation Constraints | Rejection Behavior (`422 Unprocessable Entity`) |
| :--- | :--- | :--- | :--- |
| `question` | `str` | Required; `min_length=2`, `max_length=500` after `.strip()` | Rejects missing field, `""`, whitespace-only `"   "`, single-char `"a"`, or strings `> 500` chars |
| `context_project_id` | `Literal["suhaycore", "dan", "fitquest"] \| None` | Optional; defaults to `None` | Rejects unknown project IDs (e.g. `"unknown_proj"`) |
| `extra` | `ConfigDict(extra="forbid")` | Strict schema boundary | Rejects payloads containing undeclared fields |

### Response `200 OK` (`AskResumeResponse` — Pydantic 2.14.3)
```json
{
  "answer": "During his project-based internship at Orani Suhay Foundation, Inc. (March 2026 – Present, Remote), Allen independently designed and developed SuhayCore, a full-stack web application built with C# (.NET 10), Blazor (MudBlazor), and PostgreSQL to centralize scholarship workflows and departmental activity tracking. He built an administrative dashboard, secure document upload and verification, an interactive calendar, a notification system, and Role-Based Access Control (RBAC), and deployed the staging environment on Render for staff User Acceptance Testing (UAT).",
  "citations": [
    {
      "section": "Work Experience - Orani Suhay Foundation",
      "snippet": "Independently designed and developed SuhayCore, a full-stack web application using C# (.NET 10), Blazor (MudBlazor), and PostgreSQL to centralize scholarship workflows and departmental activity tracking."
    }
  ],
  "mode": "gemini-rag",
  "model_used": "gemini-3.5-flash-lite",
  "suggested_followups": [
    "What modules did Allen build inside SuhayCore?",
    "Tell me about Allen's RAG AI internship at DACON Corporation.",
    "What databases and infrastructure tools does Allen use?"
  ]
}
```

### Error Responses
- **`422 Unprocessable Entity`**: Returned automatically when `AskResumeRequest` fails Pydantic 2.14.3 validation (`question` too short/long, whitespace-only, invalid `context_project_id`, or extra fields).

---

## 3. Mandatory Pydantic 2.14.3 Validation Test Matrix (Constitution Principle IV)

Every backend test run (`pytest backend/tests/`) MUST execute and pass the following contract tests:
1. `test_ask_resume_valid_payload`: Valid `question` + valid `context_project_id` returns `200 OK` conforming to `AskResumeResponse`.
2. `test_ask_resume_valid_without_context`: Valid `question` with `context_project_id=None` returns `200 OK`.
3. `test_ask_resume_rejects_empty_or_whitespace_question`: `""` and `"    "` return `422`.
4. `test_ask_resume_rejects_too_short_question`: `"?"` (1 char) returns `422`.
5. `test_ask_resume_rejects_over_max_length_question`: `"a" * 501` returns `422`.
6. `test_ask_resume_rejects_invalid_project_id`: `context_project_id="invalid"` returns `422`.
7. `test_ask_resume_rejects_extra_fields`: `{"question": "Valid question?", "hack": true}` returns `422` (`extra="forbid"`).
8. `test_health_endpoint_schema`: `GET /api/v1/health` returns `200 OK` conforming to `HealthResponse`.
