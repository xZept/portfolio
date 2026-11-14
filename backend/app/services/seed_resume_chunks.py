from __future__ import annotations

import argparse
import json
import logging
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx
import psycopg
from google import genai
from google.genai import types

# Allow running directly as `python backend/app/services/seed_resume_chunks.py`
_BACKEND_DIR = Path(__file__).resolve().parents[2]
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from app.config import Settings, get_settings

logger = logging.getLogger(__name__)

EMBEDDING_DIMENSIONS = 768
DEFAULT_RESUME_PATH = _BACKEND_DIR.parent / "docs" / "resume.md"


@dataclass(frozen=True)
class SeedChunk:
    """Grounded resume chunk ready for embedding and upsert into public.resume_chunks."""

    chunk_key: str
    section: str
    badge_label: str
    target_section_id: str
    target_card_id: str
    project_id: str | None
    content: str
    metadata: dict[str, Any]


@dataclass(frozen=True)
class _SectionSpec:
    chunk_key: str
    section: str
    badge_label: str
    target_section_id: str
    target_card_id: str
    project_id: str | None
    metadata: dict[str, Any]


_SECTION_SPECS: dict[str, _SectionSpec] = {
    "summary": _SectionSpec(
        chunk_key="summary-profile",
        section="Summary",
        badge_label="[Work: Orani Suhay Foundation]",
        target_section_id="about",
        target_card_id="card-work-suhay",
        project_id=None,
        metadata={
            "role": "Junior .NET / Full-Stack Developer",
            "location": "Balanga, Bataan",
            "email": "allenjames.laxamana@gmail.com",
            "tech_tags": ["C#", "ASP.NET Core", "Blazor", "PostgreSQL", "Python", "FastAPI", "REST APIs"],
        },
    ),
    "suhaycore": _SectionSpec(
        chunk_key="work-suhaycore",
        section="Work Experience - Orani Suhay Foundation",
        badge_label="[Work: Orani Suhay Foundation]",
        target_section_id="experience",
        target_card_id="card-work-suhay",
        project_id="suhaycore",
        metadata={
            "role": "Full-Stack Web Developer Intern (Project-Based)",
            "organization": "Orani Suhay Foundation, Inc.",
            "date_range": "March 2026 - Present",
            "location": "Remote",
            "tech_tags": ["C#", ".NET 10", "Blazor", "MudBlazor", "PostgreSQL", "RBAC", "Render"],
        },
    ),
    "dacon": _SectionSpec(
        chunk_key="work-dacon",
        section="Work Experience - DACON Corporation",
        badge_label="[Work: DACON Corp]",
        target_section_id="experience",
        target_card_id="card-work-dacon",
        project_id="dan",
        metadata={
            "role": "Systems Developer Intern",
            "organization": "DACON Corporation",
            "date_range": "February 2026 - March 2026",
            "location": "Makati City, Metro Manila",
            "tech_tags": ["Python", "FastAPI", "Supabase", "PostgreSQL", "pg_cron", "Jinja2", "Google Gemini", "LangChain", "Botpress", "Render"],
        },
    ),
    "fitquest": _SectionSpec(
        chunk_key="project-fitquest",
        section="Projects - FitQuest",
        badge_label="[Project: FitQuest]",
        target_section_id="experience",
        target_card_id="card-project-fitquest",
        project_id="fitquest",
        metadata={
            "project": "FitQuest",
            "date_range": "2025",
            "tech_tags": ["Android", "Kotlin", "Room Database", "SQLite", "FoodData Central REST API", "Git"],
        },
    ),
    "education": _SectionSpec(
        chunk_key="education-bpsu",
        section="Education",
        badge_label="[Education: BPSU]",
        target_section_id="education",
        target_card_id="card-education-bpsu",
        project_id=None,
        metadata={
            "institution": "Bataan Peninsula State University (BPSU)",
            "degree": "Bachelor of Science, Computer Science",
            "date_range": "2022 - 2026",
            "location": "Balanga, Bataan",
        },
    ),
    "certifications": _SectionSpec(
        chunk_key="certifications-all",
        section="Certifications",
        badge_label="[Certifications]",
        target_section_id="certifications",
        target_card_id="card-certifications",
        project_id=None,
        metadata={
            "issuers": ["Certiport (Pearson VUE)", "Cisco"],
            "certifications": [
                "IT Specialist in JavaScript (2026)",
                "IT Specialist in Cybersecurity (2025)",
                "IT Specialist in HTML & CSS (2024)",
                "IT Specialist in Software Development (2024)",
                "Cisco Cyber Threat Management (2025)",
            ],
        },
    ),
    "skills": _SectionSpec(
        chunk_key="skills-technical",
        section="Skills",
        badge_label="[Work: Orani Suhay Foundation]",
        target_section_id="skills",
        target_card_id="card-work-suhay",
        project_id=None,
        metadata={
            "categories": ["Languages & Core", "Frameworks & Web", "Data & Infrastructure", "Engineering Practices"],
            "tech_tags": [
                "C#", "SQL", "JavaScript", "HTML/CSS", "Python", "Java", "Kotlin",
                "ASP.NET Core", "Blazor", "MudBlazor", "FastAPI", "Jinja2", "REST APIs",
                "Android", "Room", "PostgreSQL", "Supabase", "SQLite", "pg_cron", "Render", "Git", "Linux",
            ],
        },
    ),
}


def _clean_markdown_text(text: str) -> str:
    """Normalize whitespace and markdown escapes while preserving factual text."""
    cleaned = text.replace("\\_", "_").replace("\\|", "|")
    lines = [re.sub(r"\s+", " ", line).strip() for line in cleaned.splitlines()]
    return "\n".join(line for line in lines if line)


def _classify_section(heading_or_text: str) -> str:
    lower = heading_or_text.lower()
    if "orani suhay" in lower or "suhaycore" in lower:
        return "suhaycore"
    if "dacon" in lower:
        return "dacon"
    if "fitquest" in lower:
        return "fitquest"
    if "education" in lower or "bataan peninsula" in lower:
        return "education"
    if "certification" in lower:
        return "certifications"
    if "skill" in lower:
        return "skills"
    return "summary"


def parse_resume_markdown(markdown_text: str) -> list[SeedChunk]:
    """Parse docs/resume.md into deterministic, grounded SeedChunk records."""
    lines = markdown_text.splitlines()
    buckets: dict[str, list[str]] = {key: [] for key in _SECTION_SPECS}
    current_key = "summary"

    for raw_line in lines:
        stripped = raw_line.strip()
        if not stripped:
            continue
        if stripped.startswith("###") or stripped.startswith("**WORK EXPERIENCE**"):
            current_key = _classify_section(stripped)
        buckets[current_key].append(stripped)

    chunks: list[SeedChunk] = []
    for key, spec in _SECTION_SPECS.items():
        raw_lines = buckets.get(key, [])
        content = _clean_markdown_text("\n".join(raw_lines))
        if not content:
            continue
        chunks.append(
            SeedChunk(
                chunk_key=spec.chunk_key,
                section=spec.section,
                badge_label=spec.badge_label,
                target_section_id=spec.target_section_id,
                target_card_id=spec.target_card_id,
                project_id=spec.project_id,
                content=content,
                metadata=spec.metadata,
            )
        )
    return chunks


def generate_embeddings(
    chunks: list[SeedChunk],
    api_key: str,
    model: str = "gemini-embedding-2",
) -> list[list[float]]:
    """Generate 768-dim embeddings for each resume chunk via Google GenAI SDK."""
    if not api_key.strip():
        raise ValueError("GEMINI_API_KEY is required to generate embeddings.")
    if not chunks:
        return []

    client = genai.Client(api_key=api_key)
    embeddings: list[list[float]] = []
    for chunk in chunks:
        response = client.models.embed_content(
            model=model,
            contents=chunk.content,
            config=types.EmbedContentConfig(output_dimensionality=EMBEDDING_DIMENSIONS),
        )
        if not response.embeddings:
            raise ValueError(f"No embedding returned for chunk '{chunk.chunk_key}'.")
        values = list(response.embeddings[0].values or [])
        if len(values) != EMBEDDING_DIMENSIONS:
            raise ValueError(
                f"Expected {EMBEDDING_DIMENSIONS}-dim embedding for '{chunk.chunk_key}', got {len(values)} dimensions."
            )
        embeddings.append(values)
    return embeddings


def _format_pgvector(values: list[float]) -> str:
    return "[" + ",".join(f"{v:.8f}" for v in values) + "]"


def upsert_resume_chunks(
    db_url: str,
    chunks: list[SeedChunk],
    embeddings: list[list[float]],
) -> int:
    """Idempotently upsert resume chunks and embeddings into public.resume_chunks."""
    if not db_url.strip():
        raise ValueError("SUPABASE_DB_URL is required to upsert resume chunks.")
    if len(chunks) != len(embeddings):
        raise ValueError("Chunks and embeddings lists must have equal length.")

    sql = """
        INSERT INTO public.resume_chunks (
            chunk_key,
            section,
            badge_label,
            target_section_id,
            target_card_id,
            project_id,
            content,
            metadata,
            embedding,
            updated_at
        )
        VALUES (
            %(chunk_key)s,
            %(section)s,
            %(badge_label)s,
            %(target_section_id)s,
            %(target_card_id)s,
            %(project_id)s,
            %(content)s,
            %(metadata)s::jsonb,
            %(embedding)s::extensions.vector(768),
            now()
        )
        ON CONFLICT (chunk_key) DO UPDATE SET
            section = EXCLUDED.section,
            badge_label = EXCLUDED.badge_label,
            target_section_id = EXCLUDED.target_section_id,
            target_card_id = EXCLUDED.target_card_id,
            project_id = EXCLUDED.project_id,
            content = EXCLUDED.content,
            metadata = EXCLUDED.metadata,
            embedding = EXCLUDED.embedding,
            updated_at = now();
    """

    with psycopg.connect(db_url) as conn:
        with conn.cursor() as cur:
            for chunk, vector in zip(chunks, embeddings, strict=True):
                cur.execute(
                    sql,
                    {
                        "chunk_key": chunk.chunk_key,
                        "section": chunk.section,
                        "badge_label": chunk.badge_label,
                        "target_section_id": chunk.target_section_id,
                        "target_card_id": chunk.target_card_id,
                        "project_id": chunk.project_id,
                        "content": chunk.content,
                        "metadata": json.dumps(chunk.metadata),
                        "embedding": _format_pgvector(vector),
                    },
                )
        conn.commit()
    return len(chunks)


def upsert_resume_chunks_via_rest(
    supabase_url: str,
    service_role_key: str,
    chunks: list[SeedChunk],
    embeddings: list[list[float]],
) -> int:
    """Idempotently upsert resume chunks via Supabase PostgREST using service_role."""
    if not supabase_url.strip() or not service_role_key.strip():
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for REST upsert.")
    if len(chunks) != len(embeddings):
        raise ValueError("Chunks and embeddings lists must have equal length.")

    endpoint = f"{supabase_url.rstrip('/')}/rest/v1/resume_chunks?on_conflict=chunk_key"
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    payload = [
        {
            "chunk_key": chunk.chunk_key,
            "section": chunk.section,
            "badge_label": chunk.badge_label,
            "target_section_id": chunk.target_section_id,
            "target_card_id": chunk.target_card_id,
            "project_id": chunk.project_id,
            "content": chunk.content,
            "metadata": chunk.metadata,
            "embedding": _format_pgvector(vector),
        }
        for chunk, vector in zip(chunks, embeddings, strict=True)
    ]

    response = httpx.post(endpoint, headers=headers, json=payload, timeout=30.0)
    response.raise_for_status()
    return len(chunks)


def seed_resume_chunks(
    resume_path: Path = DEFAULT_RESUME_PATH,
    settings: Settings | None = None,
) -> int:
    """Read docs/resume.md, embed all sections, and upsert them into Supabase."""
    cfg = settings or get_settings()
    if not resume_path.exists():
        raise FileNotFoundError(f"Resume markdown not found at {resume_path}")

    markdown_text = resume_path.read_text(encoding="utf-8")
    chunks = parse_resume_markdown(markdown_text)
    if not chunks:
        raise ValueError(f"No resume chunks parsed from {resume_path}")

    embeddings = generate_embeddings(
        chunks=chunks,
        api_key=cfg.gemini_api_key,
        model=cfg.embedding_model,
    )
    if cfg.supabase_url.strip() and cfg.supabase_service_role_key.strip():
        count = upsert_resume_chunks_via_rest(
            supabase_url=cfg.supabase_url,
            service_role_key=cfg.supabase_service_role_key,
            chunks=chunks,
            embeddings=embeddings,
        )
    else:
        count = upsert_resume_chunks(
            db_url=cfg.supabase_db_url,
            chunks=chunks,
            embeddings=embeddings,
        )
    logger.info("Upserted %d resume chunks into public.resume_chunks.", count)
    return count


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    parser = argparse.ArgumentParser(
        description="Idempotently seed docs/resume.md chunks into Supabase public.resume_chunks."
    )
    parser.add_argument(
        "--resume-path",
        type=Path,
        default=DEFAULT_RESUME_PATH,
        help="Path to resume markdown file (default: docs/resume.md).",
    )
    args = parser.parse_args()
    count = seed_resume_chunks(resume_path=args.resume_path)
    print(f"Seeded {count} resume chunks into public.resume_chunks.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
