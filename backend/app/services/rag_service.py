from __future__ import annotations

import logging
import re
import time
from collections.abc import Iterator
from dataclasses import dataclass
from urllib.parse import urlsplit

from pydantic import ValidationError

from app.config import Settings, get_settings
from app.schemas.ask_resume import (
    AskResumeRequest,
    AskResumeResponse,
    AskResumeStreamDoneEvent,
    AskResumeStreamErrorEvent,
    AskResumeStreamEvent,
    AskResumeStreamTokenEvent,
    CitationBadgeLabel,
    ProjectContextId,
    ResumeCitation,
    ResumeSectionName,
    TargetCardId,
    TargetSectionId,
)

logger = logging.getLogger(__name__)

ALLEN_CONTACT_EMAIL = "allenjames.laxamana@gmail.com"

DEFAULT_FOLLOWUPS: list[str] = [
    "How did Allen architect SuhayCore in .NET 10 & Blazor?",
    "Tell me about his RAG AI chatbot and FastAPI work at DACON.",
    "What certifications and database experience does he hold?",
]

GROUNDING_SYSTEM_PROMPT = (
    "You are Allen James Laxamana's portfolio assistant. Answer visitor questions strictly and "
    "concisely using ONLY the provided factual excerpts from docs/resume.md. "
    "Attach one or more canonical inline source citation badges directly to factual claims using ONLY "
    "these exact badge strings: [Work: Orani Suhay Foundation], [Work: DACON Corp], "
    "[Project: FitQuest], [Education: BPSU], [Certifications]. "
    "Never fabricate employers, dates, metrics, certifications, or skills. "
    "If a requested skill, role, or detail is not listed in the provided resume excerpts, "
    "explicitly state that it is not listed in Allen's resume and suggest emailing "
    f"{ALLEN_CONTACT_EMAIL} for clarification."
)


@dataclass(frozen=True)
class ResumeKnowledgeChunk:
    section: ResumeSectionName
    project_id: ProjectContextId | None
    badge_label: CitationBadgeLabel
    target_section_id: TargetSectionId
    target_card_id: TargetCardId
    keywords: tuple[str, ...]
    snippet: str
    summary_answer: str


RESUME_CHUNKS: tuple[ResumeKnowledgeChunk, ...] = (
    ResumeKnowledgeChunk(
        section="Summary",
        project_id=None,
        badge_label="[Work: Orani Suhay Foundation]",
        target_section_id="about",
        target_card_id="card-work-suhay",
        keywords=(
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
            "in C# (.NET 10), Blazor (MudBlazor), and PostgreSQL (currently in staff UAT) [Work: Orani Suhay Foundation] "
            "and previously built a Python/FastAPI backend, monitoring dashboard, and enterprise RAG AI chatbot (DAN) "
            "during his internship at DACON Corporation [Work: DACON Corp]."
        ),
    ),
    ResumeKnowledgeChunk(
        section="Work Experience - Orani Suhay Foundation",
        project_id="suhaycore",
        badge_label="[Work: Orani Suhay Foundation]",
        target_section_id="experience",
        target_card_id="card-work-suhay",
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
            "and prepared deployment configurations and technical documentation for on-premises production handover. "
            "[Work: Orani Suhay Foundation]"
        ),
    ),
    ResumeKnowledgeChunk(
        section="Work Experience - DACON Corporation",
        project_id="dan",
        badge_label="[Work: DACON Corp]",
        target_section_id="experience",
        target_card_id="card-work-dacon",
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
            "modernization recommendations for DACON's Plantation Management System and Client Enrollment workflows. "
            "[Work: DACON Corp]"
        ),
    ),
    ResumeKnowledgeChunk(
        section="Projects - FitQuest",
        project_id="fitquest",
        badge_label="[Project: FitQuest]",
        target_section_id="experience",
        target_card_id="card-project-fitquest",
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
            "persistence to reduce redundant API calls and improve offline access. [Project: FitQuest]"
        ),
    ),
    ResumeKnowledgeChunk(
        section="Education",
        project_id=None,
        badge_label="[Education: BPSU]",
        target_section_id="education",
        target_card_id="card-education-bpsu",
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
            "Balanga, Bataan (2022 – 2026). [Education: BPSU]"
        ),
    ),
    ResumeKnowledgeChunk(
        section="Certifications",
        project_id=None,
        badge_label="[Certifications]",
        target_section_id="certifications",
        target_card_id="card-certifications",
        keywords=(
            "certifications",
            "certification",
            "certificate",
            "certificates",
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
            "2026",
        ),
        snippet=(
            "Certiport (Pearson VUE): IT Specialist in JavaScript (2026), Cybersecurity (2025), HTML & CSS (2024), "
            "Software Development (2024). Cisco: Cyber Threat Management (2025)."
        ),
        summary_answer=(
            "Allen holds five verified certifications: IT Specialist in JavaScript (2026), IT Specialist in Cybersecurity (2025), "
            "IT Specialist in HTML & CSS (2024), and IT Specialist in Software Development (2024) from Certiport / Pearson VUE, "
            "plus Cisco Cyber Threat Management (2025). [Certifications]"
        ),
    ),
    ResumeKnowledgeChunk(
        section="Skills",
        project_id=None,
        badge_label="[Work: Orani Suhay Foundation]",
        target_section_id="skills",
        target_card_id="card-work-suhay",
        keywords=(
            "skills",
            "skill",
            "stack",
            "tech",
            "technologies",
            "languages",
            "frameworks",
            "database",
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
            "Requirement Analysis, Relational DB Design). [Work: Orani Suhay Foundation]"
        ),
    ),
)

_PRIVATE_PERSONAL_PATTERN = re.compile(
    r"\b("
    r"marital\s+status|married|single|girlfriend|boyfriend|wife|husband|spouse|dating|"
    r"relationship\s+status|birthday|birth\s+date|date\s+of\s+birth|how\s+old|"
    r"(?:his|allen'?s)\s+age|religion|religious|church|political|politics|"
    r"party\s+affiliation|parents|mother|father|siblings|children|kids|"
    r"home\s+address|street\s+address|personal\s+address|exact\s+address|"
    r"where\s+does\s+he\s+live|salary|net\s+worth|bank\s+account|credit\s+card|"
    r"ssn|social\s+security|passport|national\s+id|tin\s+number|philhealth|pag-ibig|"
    r"medical|blood\s+type|hobbies|favorite\s+food|favorite\s+movie|favorite\s+color|pets?"
    r")\b",
    re.IGNORECASE,
)

_UNRELATED_TASK_PATTERN = re.compile(
    r"\b("
    r"snake\s+game|fizzbuzz|leetcode|reverse\s+a\s+linked\s+list|"
    r"binary\s+search\s+tree|tell\s+me\s+a\s+joke|recipe\s+for|"
    r"(?:write|create|build|make|code|generate)\s+(?:me\s+)?(?:a|an)\s+"
    r"(?:snake|tetris|chess|pong|tic[\s-]?tac[\s-]?toe|game|calculator|"
    r"poem|haiku|essay|story|song|joke|recipe|rust\s+program|python\s+script)"
    r")\b",
    re.IGNORECASE,
)

_GENERAL_TRIVIA_PATTERN = re.compile(
    r"\b("
    r"capital\s+of|president\s+of|prime\s+minister|weather\s+in|forecast\s+for|"
    r"stock\s+price|bitcoin|crypto|ethereum|world\s+cup|olympics|nba|nfl|"
    r"meaning\s+of\s+life|who\s+invented|distance\s+to\s+the\s+moon|tallest\s+mountain|"
    r"photosynthesis|sourdough"
    r")\b",
    re.IGNORECASE,
)

_RESUME_DOMAIN_TERMS: frozenset[str] = frozenset(
    {
        "allen",
        "laxamana",
        "resume",
        "cv",
        "portfolio",
        "experience",
        "work",
        "intern",
        "internship",
        "internships",
        "project",
        "projects",
        "education",
        "university",
        "college",
        "degree",
        "school",
        "certification",
        "certifications",
        "certificate",
        "certificates",
        "credential",
        "credentials",
        "skill",
        "skills",
        "stack",
        "tech",
        "technology",
        "technologies",
        "language",
        "languages",
        "framework",
        "frameworks",
        "database",
        "databases",
        "backend",
        "frontend",
        "full-stack",
        "fullstack",
        "developer",
        "engineer",
        "engineering",
        "software",
        "web",
        "mobile",
        "android",
        "api",
        "apis",
        "rest",
        "restful",
        "architect",
        "architecture",
        "dashboard",
        "monitoring",
        "chatbot",
        "rag",
        "ai",
        "llm",
        "gemini",
        "langchain",
        "botpress",
        "pgvector",
        "vector",
        "suhay",
        "suhaycore",
        "orani",
        "dacon",
        "dan",
        "fitquest",
        "bpsu",
        "bataan",
        "balanga",
        "makati",
        "certiport",
        "pearson",
        "cisco",
        "javascript",
        "html",
        "css",
        "c#",
        ".net",
        "dotnet",
        "asp.net",
        "blazor",
        "mudblazor",
        "python",
        "fastapi",
        "jinja2",
        "postgresql",
        "postgres",
        "supabase",
        "pg_cron",
        "sql",
        "sqlite",
        "kotlin",
        "room",
        "java",
        "git",
        "linux",
        "render",
        "sdlc",
        "waterfall",
        "rbac",
        "uat",
        "security",
        "validation",
        "contact",
        "email",
        "linkedin",
        "phone",
        "hire",
        "hiring",
        "role",
        "job",
        "career",
        "background",
        "summary",
        "overview",
        "graduate",
        "graduating",
        "remote",
        "location",
        "2022",
        "2024",
        "2025",
        "2026",
        "scholarship",
        "fooddata",
        "nutrition",
        "plantation",
        "enrollment",
    }
)


def _tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9#_.+-]+", text.lower()))


def classify_off_topic_query(
    question: str,
    context_project_id: ProjectContextId | None = None,
) -> bool:
    """Detect off-topic trivia, unrelated coding tasks, or private personal inquiries before LLM calls."""
    normalized = question.strip()
    if not normalized:
        return True
    if _PRIVATE_PERSONAL_PATTERN.search(normalized):
        return True
    if _UNRELATED_TASK_PATTERN.search(normalized):
        return True
    if _GENERAL_TRIVIA_PATTERN.search(normalized):
        return True

    if context_project_id is None:
        q_lower = normalized.lower()
        tokens = _tokenize(normalized)
        has_domain_signal = any(
            term in tokens or (len(term) >= 4 and term in q_lower)
            for term in _RESUME_DOMAIN_TERMS
        )
        if not has_domain_signal:
            return True

    return False


def _build_guardrail_refusal_response() -> AskResumeResponse:
    return AskResumeResponse(
        answer=(
            "I can only answer questions strictly grounded in Allen James Laxamana's professional "
            "resume and portfolio—such as his .NET 10 & Blazor work on SuhayCore at Orani Suhay Foundation, "
            "his Python/FastAPI and DAN RAG AI chatbot internship at DACON Corporation, his Kotlin/Room "
            "FitQuest project, his BS Computer Science education at BPSU, or his certifications. "
            f"For anything outside his resume or private inquiries, please email him directly at {ALLEN_CONTACT_EMAIL}."
        ),
        citations=[],
        mode="guardrail-refusal",
        is_off_topic=True,
        model_used="deterministic-guardrail-classifier",
        suggested_followups=DEFAULT_FOLLOWUPS[:3],
    )


def _is_valid_db_url(db_url: str) -> bool:
    """Return True only when SUPABASE_DB_URL is a valid Postgres URI without template brackets."""
    cleaned = db_url.strip()
    if not cleaned:
        return False
    if re.search(r":\[[^\]]+\]@", cleaned) or "[YOUR-PASSWORD]" in cleaned:
        return False
    try:
        parsed = urlsplit(cleaned)
    except ValueError:
        return False
    return parsed.scheme in {"postgres", "postgresql"} and bool(parsed.hostname)


def _rank_chunks(
    question: str,
    context_project_id: ProjectContextId | None,
) -> list[ResumeKnowledgeChunk]:
    q_lower = question.lower()
    tokens = _tokenize(question)

    scored: list[tuple[int, ResumeKnowledgeChunk]] = []
    for chunk in RESUME_CHUNKS:
        score = 0
        if context_project_id and chunk.project_id == context_project_id:
            score += 20
        if chunk.section == "Summary" and ("allen" in tokens or "laxamana" in tokens):
            score += 1
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


def _chunk_to_citation(chunk: ResumeKnowledgeChunk) -> ResumeCitation:
    return ResumeCitation(
        section=chunk.section,
        snippet=chunk.snippet,
        badge_label=chunk.badge_label,
        target_section_id=chunk.target_section_id,
        target_card_id=chunk.target_card_id,
    )


def _build_local_fallback_response(payload: AskResumeRequest) -> AskResumeResponse:
    top_chunks = _rank_chunks(payload.question, payload.context_project_id)
    citations = [_chunk_to_citation(chunk) for chunk in top_chunks]

    if len(top_chunks) == 1:
        answer = top_chunks[0].summary_answer
    else:
        answer = " ".join(chunk.summary_answer for chunk in top_chunks[:2])

    return AskResumeResponse(
        answer=answer,
        citations=citations,
        mode="local-fallback",
        is_off_topic=False,
        model_used="deterministic-resume-grounding",
        suggested_followups=DEFAULT_FOLLOWUPS[:3],
    )


def _ensure_inline_badge(answer_text: str, citations: list[ResumeCitation]) -> str:
    """Guarantee at least one canonical inline badge appears in grounded answer text."""
    if not citations:
        return answer_text
    if any(citation.badge_label in answer_text for citation in citations):
        return answer_text
    unique_badges = list(dict.fromkeys(citation.badge_label for citation in citations[:2]))
    return f"{answer_text.rstrip()} {' '.join(unique_badges)}"


def _retrieve_pgvector_chunks(
    question: str,
    settings: Settings,
    context_project_id: ProjectContextId | None = None,
) -> list[ResumeCitation]:
    """Retrieve matching resume chunks via Supabase public.match_resume_chunks RPC."""
    if not _is_valid_db_url(settings.supabase_db_url):
        return []

    from google import genai
    from google.genai import types
    import psycopg

    client = genai.Client(api_key=settings.gemini_api_key)
    embedding_res = client.models.embed_content(
        model=settings.embedding_model,
        contents=question,
        config=types.EmbedContentConfig(output_dimensionality=768),
    )
    embeddings = getattr(embedding_res, "embeddings", None) or []
    if not embeddings:
        return []
    vector_values = list(getattr(embeddings[0], "values", None) or [])
    if not vector_values:
        return []
    vector_literal = "[" + ",".join(f"{val:.8f}" for val in vector_values) + "]"

    rpc_sql = """
        SELECT
            section,
            badge_label,
            target_section_id,
            target_card_id,
            project_id,
            content,
            similarity
        FROM public.match_resume_chunks(
            %(query_embedding)s::extensions.vector(768),
            %(match_threshold)s::float,
            %(match_count)s::int,
            %(filter_project_id)s::text,
            %(filter_metadata)s::jsonb
        )
    """

    rows: list[tuple[object, ...]] = []
    with psycopg.connect(settings.supabase_db_url, connect_timeout=3) as conn:
        with conn.cursor() as cur:
            cur.execute(
                rpc_sql,
                {
                    "query_embedding": vector_literal,
                    "match_threshold": 0.35,
                    "match_count": 5,
                    "filter_project_id": context_project_id,
                    "filter_metadata": "{}",
                },
            )
            rows = list(cur.fetchall())
            if not rows and context_project_id is not None:
                cur.execute(
                    rpc_sql,
                    {
                        "query_embedding": vector_literal,
                        "match_threshold": 0.35,
                        "match_count": 5,
                        "filter_project_id": None,
                        "filter_metadata": "{}",
                    },
                )
                rows = list(cur.fetchall())

    citations: list[ResumeCitation] = []
    for row in rows:
        if len(row) < 6:
            continue
        section, badge_label, target_section_id, target_card_id, _project_id, content = row[:6]
        if not isinstance(section, str) or not section.strip() or not content:
            continue
        try:
            citations.append(
                ResumeCitation(
                    section=section.strip(),
                    snippet=str(content),
                    badge_label=badge_label,
                    target_section_id=target_section_id,
                    target_card_id=target_card_id,
                )
            )
        except ValidationError:
            logger.debug("Skipping non-canonical resume chunk row for section '%s'.", section)
    return citations


def _log_query_best_effort(
    settings: Settings,
    payload: AskResumeRequest,
    mode: str,
    latency_ms: int,
) -> None:
    if not _is_valid_db_url(settings.supabase_db_url):
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


def _chunk_text_for_stream(text: str, words_per_chunk: int = 3) -> list[str]:
    tokens = re.findall(r"\S+\s*", text)
    if not tokens:
        return [text] if text else []
    return [
        "".join(tokens[idx : idx + words_per_chunk])
        for idx in range(0, len(tokens), words_per_chunk)
    ]


def _format_sse(event: AskResumeStreamEvent) -> str:
    return f"data: {event.model_dump_json()}\n\n"


def _extract_chunk_text(part: object) -> str:
    content = getattr(part, "content", "")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        pieces: list[str] = []
        for item in content:
            if isinstance(item, str):
                pieces.append(item)
            elif isinstance(item, dict) and isinstance(item.get("text"), str):
                pieces.append(item["text"])
        return "".join(pieces)
    return ""


def _build_rag_messages(
    payload: AskResumeRequest,
    citations: list[ResumeCitation],
):
    from langchain_core.messages import HumanMessage, SystemMessage

    context_block = "\n".join(
        f"{citation.badge_label} ({citation.section}): {citation.snippet}"
        for citation in citations
    )
    project_hint = (
        f" Prioritize details relevant to project '{payload.context_project_id}' when applicable."
        if payload.context_project_id
        else ""
    )
    return [
        SystemMessage(content=GROUNDING_SYSTEM_PROMPT + project_hint),
        HumanMessage(content=f"Resume Excerpts:\n{context_block}\n\nQuestion: {payload.question}"),
    ]


def answer_resume_question(
    payload: AskResumeRequest,
    settings: Settings | None = None,
) -> AskResumeResponse:
    """Answer a visitor question using pre-generation guardrails, live Gemini RAG, or deterministic grounding."""
    cfg = settings or get_settings()
    start_ms = time.perf_counter()

    if classify_off_topic_query(payload.question, payload.context_project_id):
        refusal = _build_guardrail_refusal_response()
        elapsed_ms = int((time.perf_counter() - start_ms) * 1000)
        _log_query_best_effort(cfg, payload, "guardrail-refusal", elapsed_ms)
        return refusal

    if not cfg.rag_configured or not _is_valid_db_url(cfg.supabase_db_url):
        return _build_local_fallback_response(payload)

    try:
        from langchain_google_genai import ChatGoogleGenerativeAI

        citations = _retrieve_pgvector_chunks(
            payload.question,
            cfg,
            context_project_id=payload.context_project_id,
        )
        if not citations:
            ranked = _rank_chunks(payload.question, payload.context_project_id)
            citations = [_chunk_to_citation(chunk) for chunk in ranked]

        llm = ChatGoogleGenerativeAI(
            model=cfg.gemini_model,
            google_api_key=cfg.gemini_api_key,
            temperature=0.0,
        )
        response = llm.invoke(_build_rag_messages(payload, citations))

        answer_text = (
            response.content.strip()
            if isinstance(response.content, str)
            else str(response.content).strip()
        )
        if not answer_text:
            raise ValueError("Empty response from Gemini model")

        answer_text = _ensure_inline_badge(answer_text, citations)
        elapsed_ms = int((time.perf_counter() - start_ms) * 1000)
        _log_query_best_effort(cfg, payload, "gemini-rag", elapsed_ms)

        return AskResumeResponse(
            answer=answer_text,
            citations=citations,
            mode="gemini-rag",
            is_off_topic=False,
            model_used=cfg.gemini_model,
            suggested_followups=DEFAULT_FOLLOWUPS[:3],
        )
    except Exception as exc:
        logger.warning("Live Gemini RAG unavailable (%s); returning local fallback.", exc)
        fallback = _build_local_fallback_response(payload)
        elapsed_ms = int((time.perf_counter() - start_ms) * 1000)
        _log_query_best_effort(cfg, payload, "local-fallback", elapsed_ms)
        return fallback


def stream_resume_question(
    payload: AskResumeRequest,
    settings: Settings | None = None,
) -> Iterator[str]:
    """Stream SSE token, done, and error events for POST /api/v1/ask-resume/stream."""
    cfg = settings or get_settings()
    start_ms = time.perf_counter()

    try:
        if classify_off_topic_query(payload.question, payload.context_project_id):
            refusal = _build_guardrail_refusal_response()
            elapsed_ms = int((time.perf_counter() - start_ms) * 1000)
            _log_query_best_effort(cfg, payload, "guardrail-refusal", elapsed_ms)
            for delta in _chunk_text_for_stream(refusal.answer):
                yield _format_sse(AskResumeStreamTokenEvent(delta=delta))
            yield _format_sse(AskResumeStreamDoneEvent(response=refusal))
            return

        if cfg.rag_configured and _is_valid_db_url(cfg.supabase_db_url):
            emitted_any_token = False
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI

                citations = _retrieve_pgvector_chunks(
                    payload.question,
                    cfg,
                    context_project_id=payload.context_project_id,
                )
                if not citations:
                    ranked = _rank_chunks(payload.question, payload.context_project_id)
                    citations = [_chunk_to_citation(chunk) for chunk in ranked]

                llm = ChatGoogleGenerativeAI(
                    model=cfg.gemini_model,
                    google_api_key=cfg.gemini_api_key,
                    temperature=0.0,
                )
                accumulated: list[str] = []
                for part in llm.stream(_build_rag_messages(payload, citations)):
                    delta = _extract_chunk_text(part)
                    if delta:
                        emitted_any_token = True
                        accumulated.append(delta)
                        yield _format_sse(AskResumeStreamTokenEvent(delta=delta))

                answer_text = "".join(accumulated).strip()
                if not answer_text:
                    raise ValueError("Empty streamed response from Gemini model")

                updated_answer = _ensure_inline_badge(answer_text, citations)
                if updated_answer != answer_text:
                    badge_suffix = updated_answer[len(answer_text) :]
                    if badge_suffix:
                        yield _format_sse(AskResumeStreamTokenEvent(delta=badge_suffix))

                elapsed_ms = int((time.perf_counter() - start_ms) * 1000)
                _log_query_best_effort(cfg, payload, "gemini-rag", elapsed_ms)
                final_response = AskResumeResponse(
                    answer=updated_answer,
                    citations=citations,
                    mode="gemini-rag",
                    is_off_topic=False,
                    model_used=cfg.gemini_model,
                    suggested_followups=DEFAULT_FOLLOWUPS[:3],
                )
                yield _format_sse(AskResumeStreamDoneEvent(response=final_response))
                return
            except Exception as exc:
                if emitted_any_token:
                    logger.warning("Gemini stream interrupted mid-response: %s", exc)
                    yield _format_sse(
                        AskResumeStreamErrorEvent(
                            message=(
                                "Stream interrupted while generating response. "
                                f"Please retry or email {ALLEN_CONTACT_EMAIL}."
                            )
                        )
                    )
                    return
                logger.warning(
                    "Live Gemini RAG stream unavailable (%s); falling back to local streaming.",
                    exc,
                )

        fallback = _build_local_fallback_response(payload)
        elapsed_ms = int((time.perf_counter() - start_ms) * 1000)
        _log_query_best_effort(cfg, payload, "local-fallback", elapsed_ms)
        for delta in _chunk_text_for_stream(fallback.answer):
            yield _format_sse(AskResumeStreamTokenEvent(delta=delta))
        yield _format_sse(AskResumeStreamDoneEvent(response=fallback))
    except Exception as exc:
        logger.exception("Unhandled error during ask-resume stream: %s", exc)
        yield _format_sse(
            AskResumeStreamErrorEvent(
                message=(
                    "Assistant service encountered an unexpected error. "
                    f"Please retry or email {ALLEN_CONTACT_EMAIL}."
                )
            )
        )
