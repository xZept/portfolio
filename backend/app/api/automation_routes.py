from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, status

from app.config import Settings, get_settings
from app.schemas.automation import (
    ContactSubmissionRequest,
    ContactSubmissionResponse,
    ContactTriageCallbackRequest,
    ContactTriageCallbackResponse,
    DocsSyncCallbackRequest,
    DocsSyncCallbackResponse,
    WatchdogCleanupCallbackRequest,
    WatchdogCleanupCallbackResponse,
)
from app.services.automation_security import verify_automation_signature
from app.services.automation_service import (
    process_docs_sync_event,
    record_contact_triage_result,
    run_watchdog_cleanup,
    submit_contact_inquiry,
)

automation_router = APIRouter(tags=["portfolio-automation"])


@automation_router.post(
    "/contact",
    response_model=ContactSubmissionResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_contact(
    payload: ContactSubmissionRequest,
    background_tasks: BackgroundTasks,
    settings: Settings = Depends(get_settings),
) -> ContactSubmissionResponse:
    """Persist visitor contact inquiry immediately and schedule async n8n lead triage."""
    return submit_contact_inquiry(
        payload=payload,
        background_tasks=background_tasks,
        settings=settings,
    )


@automation_router.post(
    "/automation/docs-sync",
    response_model=DocsSyncCallbackResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(verify_automation_signature)],
)
def sync_documentation(
    payload: DocsSyncCallbackRequest,
    settings: Settings = Depends(get_settings),
) -> DocsSyncCallbackResponse:
    """Idempotently re-index README.md and docs/**/*.md updates into public.resume_chunks."""
    return process_docs_sync_event(payload=payload, settings=settings)


@automation_router.post(
    "/automation/contact-triage",
    response_model=ContactTriageCallbackResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(verify_automation_signature)],
)
def update_contact_triage(
    payload: ContactTriageCallbackRequest,
    settings: Settings = Depends(get_settings),
) -> ContactTriageCallbackResponse:
    """Record classified intent and Discord notification status for a contact inquiry."""
    return record_contact_triage_result(payload=payload, settings=settings)


@automation_router.post(
    "/automation/watchdog/cleanup",
    response_model=WatchdogCleanupCallbackResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(verify_automation_signature)],
)
def cleanup_watchdog(
    payload: WatchdogCleanupCallbackRequest,
    settings: Settings = Depends(get_settings),
) -> WatchdogCleanupCallbackResponse:
    """Inspect and delete stale vector chunks and log a weekly health watchdog run."""
    return run_watchdog_cleanup(payload=payload, settings=settings)
