from __future__ import annotations

import argparse
import hashlib
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
    source_path: str = "docs/resume.md"
    commit_sha: str | None = "initial-seed"
    content_hash: str = ""
    is_active: bool = True


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


def compute_content_hash(content: str) -> str:
    """Return SHA-256 hex digest of normalized chunk content for idempotent sync."""
    normalized = _clean_markdown_text(content)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


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


def _infer_canonical_targets(
    file_path: str,
    heading: str,
    body: str,
) -> tuple[str, str, str, str | None]:
    """Map general documentation chunks to canonical CHECK-constrained citation defaults."""
    combined = f"{file_path} {heading} {body}".lower()
    tokens = set(re.findall(r"[a-z0-9#_.+-]+", combined))
    if "fitquest" in combined:
        return ("[Project: FitQuest]", "experience", "card-project-fitquest", "fitquest")
    if "dacon" in combined or "dan" in tokens:
        return ("[Work: DACON Corp]", "experience", "card-work-dacon", "dan")
    if "education" in combined or "bpsu" in combined:
        return ("[Education: BPSU]", "education", "card-education-bpsu", None)
    if "certification" in combined or "certiport" in combined or "cisco" in combined:
        return ("[Certifications]", "certifications", "card-certifications", None)
    if "suhaycore" in combined or "orani suhay" in combined:
        return ("[Work: Orani Suhay Foundation]", "about", "card-work-suhay", "suhaycore")
    return ("[Work: Orani Suhay Foundation]", "about", "card-work-suhay", None)


def parse_resume_markdown(
    markdown_text: str,
    commit_sha: str = "initial-seed",
) -> list[SeedChunk]:
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
                metadata=dict(spec.metadata),
                source_path="docs/resume.md",
                commit_sha=commit_sha,
                content_hash=compute_content_hash(content),
                is_active=True,
            )
        )
    return chunks


def parse_markdown_document(
    file_path: str,
    markdown_text: str,
    commit_sha: str = "initial-seed",
) -> list[SeedChunk]:
    """Parse README.md or docs/**/*.md into deterministic, DB-constrained SeedChunk records."""
    if file_path == "docs/resume.md":
        return parse_resume_markdown(markdown_text, commit_sha=commit_sha)

    if not _clean_markdown_text(markdown_text):
        return []

    heading_pattern = re.compile(r"^(#{1,4})\s+(.+?)\s*$")
    sections: list[tuple[str, list[str]]] = []
    current_heading = "Overview"
    current_lines: list[str] = []

    for raw_line in markdown_text.splitlines():
        stripped = raw_line.strip()
        if not stripped:
            continue
        match = heading_pattern.match(stripped)
        if match:
            if current_lines:
                sections.append((current_heading, current_lines))
            current_heading = match.group(2).strip()
            current_lines = [stripped]
        else:
            current_lines.append(stripped)

    if current_lines:
        sections.append((current_heading, current_lines))

    used_slugs: dict[str, int] = {}
    chunks: list[SeedChunk] = []
    for heading_title, section_lines in sections:
        content = _clean_markdown_text("\n".join(section_lines))
        if not content:
            continue
        base_slug = re.sub(r"[^a-z0-9]+", "-", heading_title.lower()).strip("-") or "overview"
        count = used_slugs.get(base_slug, 0) + 1
        used_slugs[base_slug] = count
        slug = base_slug if count == 1 else f"{base_slug}-{count}"
        badge_label, target_section_id, target_card_id, project_id = _infer_canonical_targets(
            file_path,
            heading_title,
            content,
        )
        chunks.append(
            SeedChunk(
                chunk_key=f"{file_path}::{slug}",
                section=f"{file_path} - {heading_title}",
                badge_label=badge_label,
                target_section_id=target_section_id,
                target_card_id=target_card_id,
                project_id=project_id,
                content=content,
                metadata={
                    "source_path": file_path,
                    "commit_sha": commit_sha,
                    "heading": heading_title,
                },
                source_path=file_path,
                commit_sha=commit_sha,
                content_hash=compute_content_hash(content),
                is_active=True,
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
            source_path,
            commit_sha,
            content_hash,
            is_active,
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
            %(source_path)s,
            %(commit_sha)s,
            %(content_hash)s,
            %(is_active)s,
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
            source_path = EXCLUDED.source_path,
            commit_sha = EXCLUDED.commit_sha,
            content_hash = EXCLUDED.content_hash,
            is_active = EXCLUDED.is_active,
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
                content_hash = chunk.content_hash or compute_content_hash(chunk.content)
                cur.execute(
                    sql,
                    {
                        "chunk_key": chunk.chunk_key,
                        "source_path": chunk.source_path,
                        "commit_sha": chunk.commit_sha,
                        "content_hash": content_hash,
                        "is_active": chunk.is_active,
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
            "source_path": chunk.source_path,
            "commit_sha": chunk.commit_sha,
            "content_hash": chunk.content_hash or compute_content_hash(chunk.content),
            "is_active": chunk.is_active,
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
