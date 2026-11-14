# Backend API Contracts: Ask My Resume FastAPI 0.162.5 + Pydantic 2.14.3 + Streaming RAG Service

**Feature Branch**: `002-ask-my-resume`  
**Backend Runtime**: Python 3.13 + FastAPI 0.162.5 + Pydantic 2.14.3  
**Database Integration**: Supabase `public.match_resume_chunks` (`pgvector` `0.8.2` + `gemini-embedding-2`) + `gemini-3.5-flash-lite`

---

## 1. Pydantic 2.14.3 Schema Contracts (`backend/app/schemas/ask_resume.py`)

```python
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator

ProjectContextId = Literal["suhaycore", "dan", "fitquest"]

CitationBadgeLabel = Literal[
    "[Work: Orani Suhay Foundation]",
    "[Work: DACON Corp]",
    "[Project: FitQuest]",
    "[Education: BPSU]",
    "[Certifications]",
]

TargetSectionId = Literal[
    "experience",
    "about",
    "skills",
    "education",
    "certifications",
    "contact",
]

TargetCardId = Literal[
    "card-work-suhay",
    "card-work-dacon",
    "card-project-fitquest",
    "card-education-bpsu",
    "card-certifications",
]
```

### 1.1 `AskResumeRequest`
| Field | Type | Validation Constraints | Rejection Behavior (`422 Unprocessable Entity`) |
| :--- | :--- | :--- | :--- |
| `question` | `str` | Required; stripped via `@field_validator(mode="before")`; `min_length=2`, `max_length=500` | Rejects missing field, `""`, whitespace-only `"   "`, `< 2` chars, or `> 500` chars |
| `context_project_id` | `ProjectContextId \| None` | Optional; defaults to `None` | Rejects unknown project slugs |
| `extra` | `ConfigDict(extra="forbid")` | Strict boundary | Rejects any undeclared JSON keys |

### 1.2 `ResumeCitation`
| Field | Type | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- |
| `section` | `ResumeSectionName` | Required | Canonical resume section |
| `snippet` | `str` | `min_length=1` | Factual excerpt from `docs/resume.md` |
| `badge_label` | `CitationBadgeLabel` | Default mapped from `section` | Exact inline badge label (`[Work: Orani Suhay Foundation]`, `[Work: DACON Corp]`, `[Project: FitQuest]`, `[Education: BPSU]`, `[Certifications]`) |
| `target_section_id` | `TargetSectionId` | Default mapped from `section` | DOM section ID to scroll to (`FR-009`) |
| `target_card_id` | `TargetCardId` | Default mapped from `section` | DOM card ID to highlight (`FR-009`) |

### 1.3 `AskResumeResponse`
| Field | Type | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- |
| `answer` | `str` | `min_length=1` | Grounded response (with inline `[Badge]` citations) or polite guardrail refusal |
| `citations` | `list[ResumeCitation]` | `default_factory=list` (non-empty for grounded answers) | Source citation badge metadata |
| `mode` | `Literal["gemini-rag", "local-fallback", "guardrail-refusal"]` | Required | Execution path indicator |
| `is_off_topic` | `bool` | `default=False` | `True` when `FR-010` guardrails decline off-topic/trivia/private questions |
| `model_used` | `str` | `min_length=1` | e.g., `"gemini-3.5-flash-lite"` or `"deterministic-resume-grounding"` |
| `suggested_followups` | `list[str]` | `max_length=3` | Curated starter/follow-up prompts |

---

## 2. Endpoints

### 2.1 `POST /api/v1/ask-resume` (Standard JSON Response)
Executes `match_resume_chunks` via Supabase `pgvector` (when configured) or deterministic grounding, enforces `FR-010` guardrails, and returns a validated `AskResumeResponse`.

### 2.2 `POST /api/v1/ask-resume/stream` (Incremental SSE Streaming — `FR-007`)
Accepts `AskResumeRequest` and streams `text/event-stream` Server-Sent Events:
1. `data: {"type": "token", "delta": "At Orani Suhay Foundation... "}\n\n` (emitted incrementally per token chunk)
2. `data: {"type": "done", "response": <AskResumeResponse JSON>}\n\n` (emitted upon completion with full verified `citations`, `is_off_topic`, and `mode`)
3. `data: {"type": "error", "message": "Stream interrupted..."}\n\n` (emitted if an unrecoverable upstream error occurs)

---

## 3. Mandatory Pydantic 2.14.3 Validation & Guardrail Test Matrix (`backend/tests/test_ask_resume_validation.py`)

1. `test_ask_resume_valid_payload`: Valid question + `context_project_id="suhaycore"` returns `200 OK` with `[Work: Orani Suhay Foundation]` badge and `card-work-suhay` target.
2. `test_ask_resume_valid_without_context`: Valid question with `context_project_id=None` returns `200 OK`.
3. `test_ask_resume_rejects_empty_or_whitespace_question`: `""` and `"   "` return `422`.
4. `test_ask_resume_rejects_too_short_question`: `"?"` returns `422`.
5. `test_ask_resume_rejects_over_max_length_question`: `"a" * 501` returns `422`.
6. `test_ask_resume_rejects_invalid_project_id`: `context_project_id="invalid"` returns `422`.
7. `test_ask_resume_rejects_extra_fields`: Undeclared fields return `422` (`extra="forbid"`).
8. `test_health_endpoint_schema`: `GET /api/v1/health` conforms to `HealthResponse`.
9. `test_ask_resume_off_topic_guardrail_refusal`: Off-topic trivia (`"What is the capital of France?"`), unrelated coding (`"Write me a snake game in Rust"`), and private personal questions return `is_off_topic=True` and politely steer back to Allen's resume or `allenjames.laxamana@gmail.com`.
10. `test_ask_resume_stream_endpoint_emits_tokens_and_citations`: `POST /api/v1/ask-resume/stream` yields incremental `token` events followed by a `done` event containing clickable citation badge metadata.
