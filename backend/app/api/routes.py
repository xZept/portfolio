from fastapi import APIRouter, Depends

from app.config import Settings, get_settings
from app.schemas.ask_resume import AskResumeRequest, AskResumeResponse, HealthResponse
from app.services.rag_service import answer_resume_question

router = APIRouter(prefix="/api/v1", tags=["portfolio-rag"])


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
