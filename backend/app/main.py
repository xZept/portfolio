from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router
from app.config import get_settings


def create_app() -> FastAPI:
    """Create and configure the FastAPI 0.162.5 application."""
    settings = get_settings()

    application = FastAPI(
        title="Allen James Laxamana Portfolio RAG API",
        version=settings.service_version,
        description=(
            "FastAPI + Pydantic 2.14.3 backend powering 'Ask My Resume' via "
            "Google Gemini (gemini-3.5-flash-lite + gemini-embedding-2) and Supabase pgvector."
        ),
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=[
            "Content-Type",
            "Authorization",
            "X-Automation-Timestamp",
            "X-Automation-Signature",
        ],
    )

    application.include_router(api_router)
    return application


app = create_app()
