from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.api.automation_routes import automation_router
from app.config import Settings, get_settings
from app.schemas.ask_resume import AskResumeRequest, AskResumeResponse, HealthResponse
from app.services.rag_service import answer_resume_question, stream_resume_question

router = APIRouter(prefix="/api/v1", tags=["portfolio-rag"])
router.include_router(automation_router)


@router.get("/health", response_model=HealthResponse)
def health_check(settings: Settings = Depends(get_settings)) -> HealthResponse:
    """Return service health and Gemini RAG readiness status."""
    return HealthResponse(
        status="ok",
        service=settings.service_name,
        version=settings.service_version,
        rag_ready=settings.rag_configured,
        model=settings.gemini_model,
        embedding_model=settings.embedding_model,
    )


@router.post("/ask-resume", response_model=AskResumeResponse)
def ask_resume(
    payload: AskResumeRequest,
    settings: Settings = Depends(get_settings),
) -> AskResumeResponse:
    """Answer visitor questions strictly grounded in Allen James Laxamana's resume."""
    return answer_resume_question(payload, settings=settings)


@router.post("/ask-resume/stream")
def ask_resume_stream(
    payload: AskResumeRequest,
    settings: Settings = Depends(get_settings),
) -> StreamingResponse:
    """Stream grounded resume answers and citation metadata over Server-Sent Events."""
    return StreamingResponse(
        stream_resume_question(payload, settings=settings),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
