# Implementation Plan: Neo-Brutalist Single-Page Portfolio Application

**Branch**: `001-single-page-portfolio` | **Date**: 2026-11-14 | **Spec**: `specs/001-single-page-portfolio/spec.md`

**Input**: Feature specification from `specs/001-single-page-portfolio/spec.md`

## Summary

Build Allen James Laxamana's single-page developer portfolio following the neo-brutalist layout geometry of `bugblazer.dev`, styled exclusively with the **Neo-Brutalist Sky Blue** visual system (`#F8FAFC` canvas, `#FFFFFF` cards, `#0B1120` 3D Globe card, `#38BDF8` sky-400 accents, `#0284C7` sky-600 hover states, `2px solid #0F172A` borders, and hard `4px 4px 0px #0F172A` offset shadows), and populated 100% from the factual contents of `docs/resume.md` and `images/`.

The application spans seven cohesive sections (Sticky Header & 2-Column Hero, Experience & Project Showcase with Case Study modals, About & Milestones Timeline, Interactive 3D Tech Globe with 22 rotating nodes synchronized with a Categorized Pill Table, Education Card, 5-Card Certifications Grid, and High-Contrast Sky Blue Contact Banner) plus an interactive **"Ask My Resume"** drawer powered by a Python 3.13 + FastAPI 0.162.5 + Google Gemini (`gemini-3.5-flash-lite` + `gemini-embedding-2` + Supabase PostgreSQL 18 `pgvector`) RAG endpoint with automatic local resume-grounded fallback when offline.

## Technical Context

**Language/Version**: TypeScript 5.8 (Frontend: React 19.3 + Next.js 16.4.5 Active LTS), Python 3.13 (Backend API)

**Primary Dependencies**:
- **Frontend**: `next@16.4.5`, `react@19.3.0`, `react-dom@19.3.0`, `tailwindcss@4.1`, `shadcn/ui` (Radix UI primitives restyled to Neo-Brutalist Sky Blue tokens), `lucide-react`
- **Backend**: `fastapi==0.162.5`, `pydantic==2.14.3`, `langchain==0.3.*`, `langchain-google-genai`, `psycopg[binary]` / `pgvector`, `uvicorn`
- **Automation**: `n8n` 2.47 (`docker-compose.yml` in `automation/n8n/`)

**Storage**: PostgreSQL 18 (Supabase) with `pgvector` (768-dim `gemini-embedding-2` resume chunk embeddings) and `pg_cron` (30-day query log retention schedule), plus canonical static TypeScript dataset (`frontend/src/data/resume.ts`) derived from `docs/resume.md`.

**Testing**:
- **Frontend**: `tsc --noEmit` (TypeScript 5.8), `next lint`, Vitest + React Testing Library (component, interaction, and Neo-Brutalist visual token compliance tests)
- **Backend**: `pytest` + `httpx` (Pydantic 2.14.3 request/response schema validation and RAG/fallback contract tests)

**Target Platform**: Modern desktop (`1440px`), tablet (`768px`), and mobile (`375px`) web browsers; deployed to Vercel (Next.js frontend) and Render (FastAPI backend & services).

**Project Type**: Full-stack web application monorepo (`frontend/` + `backend/` + `supabase/` + `automation/`).

**Performance Goals**:
- Active sticky navigation pill updates within `< 1000ms` of anchor click or scroll transition (SC-003).
- 60 FPS interactive pointer-drag rotation and hover/click hit-testing on the 22-node 3D Tech Globe without layout shift (`CLS = 0`).
- `< 200ms` local fallback response time and `< 2500ms` p95 live Gemini RAG response time for "Ask My Resume".

**Constraints**:
- Strict adherence to Neo-Brutalist Sky Blue visual tokens; zero blurry drop shadows (`shadow-sm` through `shadow-2xl`), zero glassmorphism (`backdrop-blur-*`), and zero purple/pink gradients (Principles II & III).
- 100% factual grounding in `docs/resume.md` with zero fabricated metrics or unverified claims (FR-002, SC-001).
- Seamless offline/degraded operation for both the 3D Tech Globe (`prefers-reduced-motion` and 2D fallback) and "Ask My Resume" (automatic client/server resume-grounded fallback when cloud credentials or network are unavailable).

**Scale/Scope**: Single-page portfolio application with 7 primary sections, 2 interactive overlays (`CaseStudyModal` and `AskResumeDrawer`), 8 verified visual assets in `images/`, 22 3D globe skill nodes linked to 4 categorized pill rows, and 2 FastAPI REST endpoints (`/api/v1/health`, `/api/v1/ask-resume`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Constitution Principle | Pre-Research Check | Post-Design Check | Evidence / Enforcement Mechanism |
| :--- | :--- | :--- | :--- |
| **I. Pinned Monorepo Stack Discipline** | PASS | PASS | `frontend/` uses React 19.3 + Next.js 16.4.5 + TS 5.8 + Tailwind v4.1 + `shadcn/ui`; `backend/` uses Python 3.13 + FastAPI 0.162.5 + Pydantic 2.14.3 + LangChain v0.3 (`gemini-3.5-flash-lite` + `gemini-embedding-2`); `supabase/` defines PostgreSQL 18 + `pgvector` + `pg_cron`; `automation/` defines n8n 2.47 Docker setup. |
| **II. Neo-Brutalist Sky Blue Visual System** | PASS | PASS | Enforced via `frontend/src/app/globals.css` tokens and `contracts/ui-contracts.md`: `#F8FAFC` canvas, `#FFFFFF` cards (`#0B1120` 3D globe card, `#38BDF8` contact banner), `1px solid #0F172A` full-width section dividers, `2px solid #0F172A` borders, `4px 4px 0px #0F172A` shadows, `#38BDF8` primary accent, `#0284C7` hover state. |
| **III. Anti-Vibe-Coding Visual Discipline (NON-NEGOTIABLE)** | PASS | PASS | Automated test in `frontend/tests/visual-system.test.ts` scans rendered components and stylesheet rules to guarantee zero `backdrop-blur`, zero blurred `box-shadow` utilities, and zero purple/pink gradient classes. |
| **IV. Strict Type Safety & Validation Gates (NON-NEGOTIABLE)** | PASS | PASS | Backend routes enforce strict Pydantic 2.14.3 schemas (`extra="forbid"`, length/enum validators) verified by 8 contract tests in `backend/tests/test_ask_resume_validation.py`; frontend enforces `tsc --noEmit` and `next lint` with zero warnings/errors. |

## Project Structure

### Documentation (this feature)

```text
specs/001-single-page-portfolio/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── api-contracts.md # FastAPI + Pydantic 2.14.3 REST contracts & test matrix
│   └── ui-contracts.md  # Section 1-7 DOM, visual token & interaction contracts
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
docs/
└── resume.md                                  # Canonical factual source of truth

images/                                        # Source visual assets (synced to frontend/public/images/)
├── certifications/
│   ├── cisco.png
│   ├── microsoft.png
│   └── pearson.png
├── others/
│   ├── bataan-peninsula-state-university.png
│   └── my-photo.png
└── projects/
    ├── dan.png
    ├── fitquest.gif
    └── suhaycore.png

frontend/                                      # Next.js 16.4.5 + React 19.3 + TS 5.8 + Tailwind v4.1
├── public/
│   └── images/                                # Static assets served by Next.js
├── src/
│   ├── app/
│   │   ├── globals.css                        # Tailwind v4.1 @theme & Neo-Brutalist Sky Blue primitives
│   │   ├── layout.tsx                         # Root layout, typography, metadata
│   │   └── page.tsx                           # Single-page portfolio assembling Sections 1–7 + overlays
│   ├── components/
│   │   ├── ui/                                # shadcn/ui primitives styled with 2px #0F172A borders & 4px hard shadows
│   │   ├── sections/
│   │   │   ├── StickyHeader.tsx               # Section 1a: Sticky top bar, active #38BDF8 pill, Ask My Resume trigger
│   │   │   ├── HeroSection.tsx                # Section 1b: 2-column Hero, CTAs, framed photo + tilted "Full-Stack & AI" badge
│   │   │   ├── ExperienceSection.tsx          # Section 2: 2-column cards (SuhayCore, DAN, FitQuest) + action triggers
│   │   │   ├── AboutSection.tsx               # Section 3: 2-column narrative bio + 4-item Timeline / Milestones card
│   │   │   ├── SkillsSection.tsx              # Section 4: Hosts TechGlobe3D + CategorizedPillTable with shared selection state
│   │   │   ├── TechGlobe3D.tsx                # Section 4a: #0B1120 container, #38BDF8 wireframe sphere, 22 3D nodes + badge
│   │   │   ├── CategorizedPillTable.tsx       # Section 4b: 4-category structured pill table synchronized with TechGlobe3D
│   │   │   ├── EducationSection.tsx           # Section 5: BPSU BS Computer Science (2022–2026) neo-brutalist card
│   │   │   ├── CertificationsSection.tsx      # Section 6: 5-card grid (4 Pearson/Microsoft IT Specialist + 1 Cisco)
│   │   │   └── ContactSection.tsx             # Section 7: Full-width #38BDF8 banner, Copy/Write email, phone, social links
│   │   └── overlays/
│   │       ├── CaseStudyModal.tsx             # Neo-brutalist architecture & role breakdown modal for SuhayCore, DAN, FitQuest
│   │       └── AskResumeDrawer.tsx            # Neo-brutalist Q&A drawer calling FastAPI RAG with local fallback
│   ├── data/
│   │   └── resume.ts                          # Strongly-typed canonical dataset strictly mirroring docs/resume.md
│   └── lib/
│       ├── ask-resume-client.ts               # Hybrid API client + deterministic local resume fallback matcher
│       ├── globe-math.ts                      # 3D Fibonacci sphere coordinates, rotation matrix & projection utilities
│       └── use-active-section.ts              # IntersectionObserver hook with programmatic scroll lock
└── tests/
    ├── visual-system.test.tsx                 # Verifies Neo-Brutalist tokens & absence of prohibited classes
    ├── sections.test.tsx                      # Verifies Sections 1–7 factual content, globe-table sync & clipboard copy
    └── ask-resume-fallback.test.ts            # Verifies hybrid client & offline fallback grounding

backend/                                       # Python 3.13 + FastAPI 0.162.5 + Pydantic 2.14.3
├── app/
│   ├── __init__.py
│   ├── main.py                                # FastAPI app, CORS, router registration
│   ├── config.py                              # Environment settings (Gemini, Supabase, CORS)
│   ├── api/
│   │   └── routes.py                          # GET /api/v1/health & POST /api/v1/ask-resume
│   ├── schemas/
│   │   └── ask_resume.py                      # Pydantic 2.14.3 request/response schemas & field validators
│   └── services/
│       └── rag_service.py                     # LangChain v0.3 + gemini-3.5-flash-lite + gemini-embedding-2 + local fallback
├── tests/
│   └── test_ask_resume_validation.py          # Mandatory Pydantic 2.14.3 validation & boundary test suite
└── requirements.txt

supabase/
└── migrations/
    └── 001_resume_rag.sql                     # PostgreSQL 18 pgvector resume_chunks table + pg_cron 30-day log cleanup

automation/
└── n8n/
    └── docker-compose.yml                     # Pinned n8n 2.47 workflow automation service definition
```

**Structure Decision**: Multi-service web application monorepo (`frontend/`, `backend/`, `supabase/`, `automation/`) chosen to satisfy Constitution Principle I (Pinned Monorepo Stack Discipline) and Principle IV (independent TypeScript/ESLint and Python/Pydantic validation gates) while preserving root-level `docs/resume.md` and `images/` as the canonical content sources.

## Complexity Tracking

> **No Constitution Check violations exist. All stack layers and quality gates align 100% with `.specify/memory/constitution.md`.**
