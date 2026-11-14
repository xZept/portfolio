from __future__ import annotations

import logging
import re
import time
from dataclasses import dataclass

from app.config import Settings, get_settings
from app.schemas.ask_resume import (
    AskResumeRequest,
    AskResumeResponse,
    ProjectContextId,
    ResumeCitation,
    ResumeSectionName,
)

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ResumeKnowledgeChunk:
    section: ResumeSectionName
    project_id: ProjectContextId | None
    keywords: tuple[str, ...]
    snippet: str
    summary_answer: str


RESUME_CHUNKS: tuple[ResumeKnowledgeChunk, ...] = (
    ResumeKnowledgeChunk(
        section="Summary",
        project_id=None,
        keywords=(
            "allen",
            "summary",
            "bio",
            "background",
            "who",
            "role",
            "seeking",
            "developer",
            "headline",
            "overview",
            "contact",
            "email",
            "phone",
            "location",
        ),
        snippet=(
            "Junior .NET / Full-Stack Developer | C#, ASP.NET Core, Blazor, PostgreSQL, REST APIs. "
            "Computer Science graduate (BPSU, 2026) who independently built SuhayCore, a C# (.NET 10) / "
            "Blazor / PostgreSQL web application now in staff user acceptance testing, during a project-based internship. "
            "Also built a Python/FastAPI backend and web dashboard in a systems internship. Seeking an entry-level .NET or full-stack developer role."
        ),
        summary_answer=(
            "Allen James Laxamana is a Junior .NET / Full-Stack Developer and BS Computer Science graduate "
            "(Bataan Peninsula State University, 2026) based in Balanga, Bataan. He independently built SuhayCore "
            "in C# (.NET 10), Blazor (MudBlazor), and PostgreSQL (currently in staff UAT) and previously built a "
            "Python/FastAPI backend, monitoring dashboard, and enterprise RAG AI chatbot (DAN) during his internship at DACON Corporation."
        ),
    ),
    ResumeKnowledgeChunk(
        section="Work Experience - Orani Suhay Foundation",
        project_id="suhaycore",
        keywords=(
            "suhaycore",
            "orani",
            "suhay",
            "foundation",
            "c#",
            ".net",
            "dotnet",
            "blazor",
            "mudblazor",
            "scholarship",
            "rbac",
            "uat",
            "calendar",
            "notification",
            "document",
            "verification",
            "render",
            "march",
        ),
        snippet=(
            "Independently designed and developed SuhayCore, a full-stack web application using C# (.NET 10), "
            "Blazor (MudBlazor), and PostgreSQL to centralize scholarship workflows and departmental activity tracking. "
            "Built an administrative dashboard, secure document upload and verification, an interactive calendar, "
            "a notification system, Role-Based Access Control (RBAC), and server-side validation; deployed staging on Render for staff UAT."
        ),
        summary_answer=(
            "At Orani Suhay Foundation, Inc. (March 2026 – Present, Remote), Allen is a Full-Stack Web Developer Intern "
            "(Project-Based) who independently designed and built SuhayCore using C# (.NET 10), Blazor (MudBlazor), and PostgreSQL. "
            "He implemented an administrative dashboard, secure document upload and verification, an interactive calendar, "
            "a notification system, Role-Based Access Control (RBAC), and server-side validation, deployed staging on Render for staff UAT, "
            "and prepared deployment configurations and technical documentation for on-premises production handover."
        ),
    ),
    ResumeKnowledgeChunk(
        section="Work Experience - DACON Corporation",
        project_id="dan",
        keywords=(
            "dacon",
            "dan",
            "rag",
            "ai",
            "chatbot",
            "python",
            "fastapi",
            "supabase",
            "pg_cron",
            "jinja2",
            "gemini",
            "langchain",
            "botpress",
            "makati",
            "dashboard",
            "monitoring",
            "plantation",
            "enrollment",
        ),
        snippet=(
            "Built and deployed a secure Python/FastAPI backend on Render, connected to a Supabase (PostgreSQL) "
            "database with automated pg_cron 30-day data archival. Developed a custom, authenticated web dashboard "
            "(HTML/CSS/JS/Jinja2) from scratch for real-time chat monitoring. Engineered an end-to-end RAG AI chatbot "
            "querying internal corporate policies using Google Gemini, LangChain, and Botpress."
        ),
        summary_answer=(
            "As a Systems Developer Intern at DACON Corporation in Makati City (February 2026 – March 2026), Allen built and deployed "
            "a Python/FastAPI backend on Render connected to Supabase PostgreSQL with automated pg_cron 30-day archival, developed a "
            "custom authenticated HTML/CSS/JS/Jinja2 dashboard for real-time chat monitoring, engineered the DAN end-to-end RAG AI "
            "chatbot using Google Gemini, LangChain, and Botpress to query internal corporate policies, and delivered tech stack "
            "modernization recommendations for DACON's Plantation Management System and Client Enrollment workflows."
        ),
    ),
    ResumeKnowledgeChunk(
        section="Projects - FitQuest",
        project_id="fitquest",
        keywords=(
            "fitquest",
            "android",
            "kotlin",
            "room",
            "sqlite",
            "fooddata",
            "nutrition",
            "food",
            "offline",
            "mobile",
            "rest",
            "2025",
        ),
        snippet=(
            "Integrated the FoodData Central REST API into an Android application and implemented structured API parsing in Kotlin, "
            "expanding the local dataset to millions of verified food records. Used Room Database for local persistence to reduce "
            "redundant API calls and improve offline access."
        ),
        summary_answer=(
            "In FitQuest (2025), Allen integrated the FoodData Central REST API into an Android application with structured API "
            "parsing in Kotlin, expanding the local dataset to millions of verified food records, and used Room Database for local "
            "persistence to reduce redundant API calls and improve offline access."
        ),
    ),
    ResumeKnowledgeChunk(
        section="Education",
        project_id=None,
        keywords=(
            "education",
            "school",
            "university",
            "college",
            "bpsu",
            "bataan",
            "degree",
            "computer science",
            "graduate",
            "2022",
            "2026",
            "balanga",
        ),
        snippet=(
            "Bataan Peninsula State University (BPSU) - Bachelor of Science, Computer Science (2022 – 2026, Balanga, Bataan)."
        ),
        summary_answer=(
            "Allen is completing a Bachelor of Science in Computer Science at Bataan Peninsula State University (BPSU) in "
            "Balanga, Bataan (2022 – 2026)."
        ),
    ),
    ResumeKnowledgeChunk(
        section="Certifications",
        project_id=None,
        keywords=(
            "certifications",
            "certificate",
            "certiport",
            "pearson",
            "microsoft",
            "cisco",
            "cybersecurity",
            "cyber threat",
            "javascript",
            "html",
            "software development",
            "2024",
            "2025",
        ),
        snippet=(
            "Certiport (Pearson VUE): IT Specialist in JavaScript (2026), Cybersecurity (2025), HTML & CSS (2024), "
            "Software Development (2024). Cisco: Cyber Threat Management (2025)."
        ),
        summary_answer=(
            "Allen holds five verified certifications: IT Specialist in JavaScript (2026), IT Specialist in Cybersecurity (2025), "
            "IT Specialist in HTML & CSS (2024), and IT Specialist in Software Development (2024) from Certiport / Pearson VUE, "
            "plus Cisco Cyber Threat Management (2025)."
        ),
    ),
    ResumeKnowledgeChunk(
        section="Skills",
        project_id=None,
        keywords=(
            "skills",
            "stack",
            "tech",
            "technologies",
            "languages",
            "frameworks",
            "databases",
            "infrastructure",
            "practices",
            "postgresql",
            "asp.net",
            "git",
            "linux",
            "sdlc",
            "waterfall",
            "java",
            "sql",
        ),
        snippet=(
            "Languages & Core: C#, SQL, JavaScript, HTML/CSS, Python, Java, Kotlin. "
            "Frameworks & Web: ASP.NET Core, Blazor (MudBlazor), FastAPI, Jinja2, REST APIs, Android (Kotlin, Room). "
            "Data & Infrastructure: PostgreSQL, Supabase, SQLite, pg_cron, Render, Git, Linux. "
            "Engineering Practices: SDLC, Modified Waterfall, Role-Based Access Control (RBAC), UAT, Requirement Analysis, Relational DB Design."
        ),
        summary_answer=(
            "Allen's resume technical skills cover Languages & Core (C#, SQL, JavaScript, HTML/CSS, Python, Java, Kotlin), "
            "Frameworks & Web (ASP.NET Core, Blazor/MudBlazor, FastAPI, Jinja2, REST APIs, Android Kotlin/Room), Data & Infrastructure "
            "(PostgreSQL, Supabase, SQLite, pg_cron, Render, Git, Linux), and Engineering Practices (SDLC, Modified Waterfall, RBAC, UAT, "
            "Requirement Analysis, Relational DB Design)."
        ),
    ),
)

DEFAULT_FOLLOWUPS: list[str] = [
    "What modules did Allen build inside SuhayCore?",
    "How did Allen engineer the DAN RAG AI chatbot at DACON Corporation?",
    "What certifications and education credentials does Allen hold?",
]


def _tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9#_.+-]+", text.lower()))


def _rank_chunks(question: str, context_project_id: ProjectContextId | None) -> list[ResumeKnowledgeChunk]:
    q_lower = question.lower()
    tokens = _tokenize(question)

    scored: list[tuple[int, ResumeKnowledgeChunk]] = []
    for chunk in RESUME_CHUNKS:
        score = 0
        if context_project_id and chunk.project_id == context_project_id:
            score += 20
        for kw in chunk.keywords:
            if kw in q_lower:
                score += 4
            elif kw in tokens:
                score += 3
        scored.append((score, chunk))

    scored.sort(key=lambda pair: pair[0], reverse=True)
    matched = [chunk for score, chunk in scored if score > 0]
    if not matched:
        return [RESUME_CHUNKS[0], RESUME_CHUNKS[1], RESUME_CHUNKS[2]]
    return matched[:3]


def _build_local_fallback_response(payload: AskResumeRequest) -> AskResumeResponse:
    top_chunks = _rank_chunks(payload.question, payload.context_project_id)
    citations = [
        ResumeCitation(section=chunk.section, snippet=chunk.snippet)
        for chunk in top_chunks
    ]

    if len(top_chunks) == 1:
        answer = top_chunks[0].summary_answer
    else:
        answer = " ".join(chunk.summary_answer for chunk in top_chunks[:2])

    return AskResumeResponse(
        answer=answer,
        citations=citations,
        mode="local-fallback",
        model_used="deterministic-resume-grounding",
        suggested_followups=DEFAULT_FOLLOWUPS[:3],
    )


def _retrieve_pgvector_chunks(
    question: str,
    settings: Settings,
) -> list[tuple[ResumeSectionName, str]]:
    """Retrieve matching resume chunks from Supabase pgvector using gemini-embedding-2."""
    from google import genai
    import psycopg

    client = genai.Client(api_key=settings.gemini_api_key)
    embedding_res = client.models.embed_content(
        model=settings.embedding_model,
        contents=question,
    )
    embeddings = getattr(embedding_res, "embeddings", None) or []
    if not embeddings:
        return []
    vector_values = list(embeddings[0].values)
    vector_literal = "[" + ",".join(f"{val:.6f}" for val in vector_values) + "]"

    valid_sections: set[str] = {
        "Summary",
        "Work Experience - Orani Suhay Foundation",
        "Work Experience - DACON Corporation",
        "Projects - FitQuest",
        "Education",
        "Certifications",
        "Skills",
    }

    rows_out: list[tuple[ResumeSectionName, str]] = []
    with psycopg.connect(settings.supabase_db_url, connect_timeout=3) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT section, content
                FROM public.resume_chunks
                ORDER BY embedding <=> %s::vector
                LIMIT 3
                """,
                (vector_literal,),
            )
            for section, content in cur.fetchall():
                if section in valid_sections and content:
                    rows_out.append((section, str(content)))
    return rows_out


def _log_query_best_effort(
    settings: Settings,
    payload: AskResumeRequest,
    mode: str,
    latency_ms: int,
) -> None:
    if not settings.supabase_db_url.strip():
        return
    try:
        import psycopg

        with psycopg.connect(settings.supabase_db_url, connect_timeout=2) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO public.resume_query_logs (question, context_project_id, mode, latency_ms)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (payload.question, payload.context_project_id, mode, latency_ms),
                )
            conn.commit()
    except Exception as exc:  # pragma: no cover - telemetry failure must never break API
        logger.debug("Skipping query telemetry insert: %s", exc)


def answer_resume_question(
    payload: AskResumeRequest,
    settings: Settings | None = None,
) -> AskResumeResponse:
    """Answer a visitor question using live Gemini RAG when configured, else deterministic grounding."""
    cfg = settings or get_settings()
    start_ms = time.perf_counter()

    if not cfg.rag_configured:
        return _build_local_fallback_response(payload)

    try:
        from langchain_core.messages import HumanMessage, SystemMessage
        from langchain_google_genai import ChatGoogleGenerativeAI

        retrieved = _retrieve_pgvector_chunks(payload.question, cfg)
        if not retrieved:
            ranked = _rank_chunks(payload.question, payload.context_project_id)
            retrieved = [(chunk.section, chunk.snippet) for chunk in ranked]

        context_block = "\n".join(f"[{sec}] {text}" for sec, text in retrieved)
        project_hint = (
            f"Focus especially on project '{payload.context_project_id}' if relevant. "
            if payload.context_project_id
            else ""
        )

        llm = ChatGoogleGenerativeAI(
            model=cfg.gemini_model,
            google_api_key=cfg.gemini_api_key,
            temperature=0.1,
        )
        response = llm.invoke(
            [
                SystemMessage(
                    content=(
                        "You are Allen James Laxamana's portfolio assistant. Answer visitor questions "
                        "strictly and concisely using ONLY the provided factual resume excerpts. "
                        "Never fabricate employers, dates, metrics, or skills. "
                        + project_hint
                    )
                ),
                HumanMessage(
                    content=f"Resume Excerpts:\n{context_block}\n\nQuestion: {payload.question}"
                ),
            ]
        )

        answer_text = (
            response.content.strip()
            if isinstance(response.content, str)
            else str(response.content).strip()
        )
        if not answer_text:
            raise ValueError("Empty response from Gemini model")

        citations = [
            ResumeCitation(section=section, snippet=snippet)
            for section, snippet in retrieved
        ]
        elapsed_ms = int((time.perf_counter() - start_ms) * 1000)
        _log_query_best_effort(cfg, payload, "gemini-rag", elapsed_ms)

        return AskResumeResponse(
            answer=answer_text,
            citations=citations,
            mode="gemini-rag",
            model_used=cfg.gemini_model,
            suggested_followups=DEFAULT_FOLLOWUPS[:3],
        )
    except Exception as exc:
        logger.warning("Live Gemini RAG unavailable (%s); returning local fallback.", exc)
        fallback = _build_local_fallback_response(payload)
        elapsed_ms = int((time.perf_counter() - start_ms) * 1000)
        _log_query_best_effort(cfg, payload, "local-fallback", elapsed_ms)
        return fallback
