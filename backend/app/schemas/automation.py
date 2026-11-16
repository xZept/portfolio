from __future__ import annotations

import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

DOC_PATH_PATTERN = re.compile(r"^(README\.md|docs/[A-Za-z0-9_./-]+\.md)$")
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

IntentCategory = Literal["recruiter", "freelance project", "general inquiry"]


def _validate_doc_path(value: object) -> str:
    if not isinstance(value, str):
        raise ValueError("file_path must be a string.")
    if value != value.strip():
        raise ValueError("file_path must not contain leading or trailing whitespace.")
    if ".." in value or "//" in value or value.startswith("/"):
        raise ValueError("file_path must not contain path traversal segments.")
    if not DOC_PATH_PATTERN.fullmatch(value):
        raise ValueError("file_path must match README.md or docs/**/*.md.")
    return value


def _strip_required_str(value: object) -> object:
    if isinstance(value, str):
        return value.strip()
    return value


class DocFilePayload(BaseModel):
    """Documentation markdown file payload synced from GitHub main branch."""

    model_config = ConfigDict(extra="forbid")

    file_path: str
    content: str = Field(..., min_length=0, max_length=200_000)

    @field_validator("file_path")
    @classmethod
    def validate_file_path(cls, value: str) -> str:
        return _validate_doc_path(value)


class DocsSyncCallbackRequest(BaseModel):
    """Authenticated callback payload from n8n GitHub-to-RAG Sync workflow."""

    model_config = ConfigDict(extra="forbid")

    delivery_id: str = Field(..., min_length=3, max_length=128)
    commit_sha: str = Field(..., min_length=7, max_length=64)
    branch: Literal["main"] = "main"
    upserted_files: list[DocFilePayload] = Field(default_factory=list, max_length=50)
    removed_files: list[str] = Field(default_factory=list, max_length=50)

    @field_validator("delivery_id", "commit_sha", mode="before")
    @classmethod
    def strip_identifiers(cls, value: object) -> object:
        return _strip_required_str(value)

    @field_validator("removed_files")
    @classmethod
    def validate_removed_files(cls, values: list[str]) -> list[str]:
        return [_validate_doc_path(item) for item in values]


class DocsSyncCallbackResponse(BaseModel):
    """Response summarizing idempotent documentation sync results."""

    model_config = ConfigDict(extra="forbid")

    status: Literal["synced", "duplicate_ignored", "noop"]
    delivery_id: str
    commit_sha: str
    chunks_upserted: int = Field(..., ge=0)
    chunks_removed: int = Field(..., ge=0)


class ContactSubmissionRequest(BaseModel):
    """Public visitor contact form submission payload."""

    model_config = ConfigDict(extra="forbid")

    name: str = Field(..., min_length=2, max_length=120)
    email: str = Field(..., min_length=5, max_length=254)
    subject: str | None = Field(default=None, max_length=200)
    message: str = Field(..., min_length=2, max_length=4000)

    @field_validator("name", "email", "message", mode="before")
    @classmethod
    def strip_text_fields(cls, value: object) -> object:
        return _strip_required_str(value)

    @field_validator("subject", mode="before")
    @classmethod
    def normalize_subject(cls, value: object) -> object:
        if isinstance(value, str):
            stripped = value.strip()
            return stripped if stripped else None
        return value

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, value: str) -> str:
        if not EMAIL_PATTERN.fullmatch(value):
            raise ValueError("Please enter a valid email address.")
        return value


class ContactSubmissionResponse(BaseModel):
    """Non-blocking contact form persistence response."""

    model_config = ConfigDict(extra="forbid")

    inquiry_id: str
    status: Literal["received"] = "received"
    triage_status: Literal["pending"] = "pending"
    message: str


class ContactTriageCallbackRequest(BaseModel):
    """Authenticated n8n callback updating contact inquiry triage classification."""

    model_config = ConfigDict(extra="forbid")

    inquiry_id: str = Field(..., min_length=1, max_length=64)
    intent_category: IntentCategory
    triage_summary: str = Field(..., min_length=1, max_length=1000)
    notification_sent: bool = True

    @field_validator("inquiry_id", "triage_summary", mode="before")
    @classmethod
    def strip_callback_fields(cls, value: object) -> object:
        return _strip_required_str(value)


class ContactTriageCallbackResponse(BaseModel):
    """Response confirming contact triage state update."""

    model_config = ConfigDict(extra="forbid")

    inquiry_id: str
    triage_status: Literal["classified"] = "classified"
    intent_category: IntentCategory
    updated: bool


class WatchdogCleanupCallbackRequest(BaseModel):
    """Authenticated n8n callback reporting endpoint health and requesting stale chunk cleanup."""

    model_config = ConfigDict(extra="forbid")

    frontend_healthy: bool
    backend_healthy: bool
    frontend_latency_ms: int | None = Field(default=None, ge=0)
    backend_latency_ms: int | None = Field(default=None, ge=0)
    auto_clean: bool = True


class WatchdogCleanupCallbackResponse(BaseModel):
    """Watchdog run summary and conditional alerting determination."""

    model_config = ConfigDict(extra="forbid")

    run_id: str
    status: Literal["healthy", "degraded", "cleaned"]
    frontend_healthy: bool
    backend_healthy: bool
    active_chunks_count: int = Field(..., ge=0)
    stale_chunks_found: int = Field(..., ge=0)
    stale_chunks_deleted: int = Field(..., ge=0)
    deleted_chunk_keys: list[str] = Field(default_factory=list)
    alert_required: bool
    alert_reasons: list[str] = Field(default_factory=list)
