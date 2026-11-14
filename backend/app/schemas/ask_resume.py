from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator

ProjectContextId = Literal["suhaycore", "dan", "fitquest"]
ResumeSectionName = Literal[
    "Summary",
    "Work Experience - Orani Suhay Foundation",
    "Work Experience - DACON Corporation",
    "Projects - FitQuest",
    "Education",
    "Certifications",
    "Skills",
]


class AskResumeRequest(BaseModel):
    """Validated visitor query payload for POST /api/v1/ask-resume."""

    model_config = ConfigDict(extra="forbid")

    question: str = Field(
        ...,
        min_length=2,
        max_length=500,
        description="Visitor question about Allen James Laxamana's resume",
    )
    context_project_id: ProjectContextId | None = Field(
        default=None,
        description="Optional project slug when invoked from an Experience card",
    )

    @field_validator("question", mode="before")
    @classmethod
    def strip_question(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class ResumeCitation(BaseModel):
    """Source citation anchored to a section of docs/resume.md."""

    model_config = ConfigDict(extra="forbid")

    section: ResumeSectionName
    snippet: str = Field(..., min_length=1)


class AskResumeResponse(BaseModel):
    """Grounded response payload for POST /api/v1/ask-resume."""

    model_config = ConfigDict(extra="forbid")

    answer: str = Field(..., min_length=1)
    citations: list[ResumeCitation] = Field(..., min_length=1)
    mode: Literal["gemini-rag", "local-fallback"]
    model_used: str = Field(..., min_length=1)
    suggested_followups: list[str] = Field(default_factory=list, max_length=3)


class HealthResponse(BaseModel):
    """Service readiness payload for GET /api/v1/health."""

    model_config = ConfigDict(extra="forbid")

    status: Literal["ok"] = "ok"
    service: str = "allen-portfolio-rag-api"
    version: str = "1.0.0"
    rag_ready: bool
    model: str = "gemini-3.5-flash-lite"
    embedding_model: str = "gemini-embedding-2"
