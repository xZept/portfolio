from typing import Any, Literal, Self
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

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
AskResumeMode = Literal["gemini-rag", "local-fallback", "guardrail-refusal"]

SECTION_CITATION_DEFAULTS: dict[
    ResumeSectionName, tuple[CitationBadgeLabel, TargetSectionId, TargetCardId]
] = {
    "Summary": ("[Work: Orani Suhay Foundation]", "about", "card-work-suhay"),
    "Work Experience - Orani Suhay Foundation": (
        "[Work: Orani Suhay Foundation]",
        "experience",
        "card-work-suhay",
    ),
    "Work Experience - DACON Corporation": (
        "[Work: DACON Corp]",
        "experience",
        "card-work-dacon",
    ),
    "Projects - FitQuest": (
        "[Project: FitQuest]",
        "experience",
        "card-project-fitquest",
    ),
    "Education": ("[Education: BPSU]", "education", "card-education-bpsu"),
    "Certifications": ("[Certifications]", "certifications", "card-certifications"),
    "Skills": ("[Work: Orani Suhay Foundation]", "skills", "card-work-suhay"),
}


class AskResumeRequest(BaseModel):
    """Validated visitor query payload for POST /api/v1/ask-resume and /ask-resume/stream."""

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
    """Source citation anchored to a section of docs/resume.md or synced documentation and portfolio card target."""

    model_config = ConfigDict(extra="forbid")

    section: str = Field(..., min_length=1)
    snippet: str = Field(..., min_length=1)
    badge_label: CitationBadgeLabel
    target_section_id: TargetSectionId
    target_card_id: TargetCardId

    @field_validator("section", mode="before")
    @classmethod
    def strip_section(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value

    @model_validator(mode="before")
    @classmethod
    def populate_canonical_targets(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            return data
        payload = dict(data)
        section = payload.get("section")
        if isinstance(section, str):
            section = section.strip()
            payload["section"] = section
        if isinstance(section, str) and section in SECTION_CITATION_DEFAULTS:
            default_badge, default_section_id, default_card_id = (
                SECTION_CITATION_DEFAULTS[section]  # type: ignore[index]
            )
            if payload.get("badge_label") is None:
                payload["badge_label"] = default_badge
            if payload.get("target_section_id") is None:
                payload["target_section_id"] = default_section_id
            if payload.get("target_card_id") is None:
                payload["target_card_id"] = default_card_id
        return payload


class AskResumeResponse(BaseModel):
    """Grounded response or guardrail refusal payload for Ask My Resume endpoints."""

    model_config = ConfigDict(extra="forbid")

    answer: str = Field(..., min_length=1)
    citations: list[ResumeCitation] = Field(default_factory=list)
    mode: AskResumeMode
    is_off_topic: bool = Field(default=False)
    model_used: str = Field(..., min_length=1)
    suggested_followups: list[str] = Field(default_factory=list, max_length=3)

    @model_validator(mode="after")
    def ensure_grounded_citations(self) -> Self:
        if not self.is_off_topic and self.mode != "guardrail-refusal" and not self.citations:
            raise ValueError("Grounded responses must include at least one citation.")
        return self


class AskResumeStreamTokenEvent(BaseModel):
    """Incremental SSE token delta event."""

    model_config = ConfigDict(extra="forbid")

    type: Literal["token"] = "token"
    delta: str = Field(..., min_length=1)


class AskResumeStreamDoneEvent(BaseModel):
    """Terminal SSE completion event carrying verified citations and response metadata."""

    model_config = ConfigDict(extra="forbid")

    type: Literal["done"] = "done"
    response: AskResumeResponse


class AskResumeStreamErrorEvent(BaseModel):
    """Terminal SSE error event emitted on unrecoverable stream interruption."""

    model_config = ConfigDict(extra="forbid")

    type: Literal["error"] = "error"
    message: str = Field(..., min_length=1)


AskResumeStreamEvent = (
    AskResumeStreamTokenEvent | AskResumeStreamDoneEvent | AskResumeStreamErrorEvent
)


class HealthResponse(BaseModel):
    """Service readiness payload for GET /api/v1/health."""

    model_config = ConfigDict(extra="forbid")

    status: Literal["ok"] = "ok"
    service: str = "allen-portfolio-rag-api"
    version: str = "1.0.0"
    rag_ready: bool
    model: str = "gemini-3.5-flash-lite"
    embedding_model: str = "gemini-embedding-2"
