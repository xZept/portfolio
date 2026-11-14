<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0
- Modified principles:
  - None (Principles I–IV unchanged)
- Added principles:
  - V. Git-First Database Migrations via Supabase MCP (NON-NEGOTIABLE)
- Modified sections:
  - Visual Specifications & Quality Gates (added Database Migration Gate)
  - Governance (updated Compliance Review to cover all five Core Principles)
- Removed sections:
  - None
- Follow-up TODOs:
  - None
-->
# Portfolio Monorepo Constitution

## Core Principles

### I. Pinned Monorepo Stack Discipline
All services, packages, and workflows in this monorepo MUST strictly adhere to the designated
technology stack and version baselines:
- **Frontend**: React 19.3 + Next.js 16.4.5 (Active LTS) + TypeScript 5.8.
- **Styling & UI**: Tailwind CSS v4.1 + shadcn/ui (Latest CLI).
- **Backend API**: Python 3.13 + FastAPI 0.162.5 + Pydantic 2.14.3.
- **Database & Vector Store**: PostgreSQL 18 (Supabase) + `pgvector` + `pg_cron`.
- **RAG & AI Engine**: Google Gemini API (`gemini-3.5-flash-lite` + `gemini-embedding-2`) +
  LangChain v0.3 (`langchain-google-genai`).
- **Automation Layer**: n8n 2.47 (Docker).
- **Hosting & DevOps**: Vercel (frontend) + Render (backend/services).

**Rationale**: Pinning exact major/minor baselines across the frontend, backend, database, AI,
and automation layers prevents dependency drift and incompatible SDK patterns.

### II. Neo-Brutalist Sky Blue Visual System
Every user interface view and component MUST implement the **Neo-Brutalist Sky Blue** visual
system using exact token values:
- **Canvas**: `#F8FAFC` page background, `#FFFFFF` card surfaces, and full-width `1px solid #0F172A`
  section dividers.
- **Borders & Shadows**: All cards, buttons, and badges MUST use a `2px solid #0F172A` border and
  a hard zero-blur offset shadow (`4px 4px 0px #0F172A`).
- **Accent Palette**: Primary accent `#38BDF8` (`sky-400`) MUST be used for active navigation
  pills, primary CTAs, and the high-contrast Contact banner card; `#0284C7` (`sky-600`) MUST be
  used for interactive hover states.

**Rationale**: High-contrast structural borders, zero-blur offset shadows, and a disciplined sky-blue
accent palette create an unmistakable, tactile engineering aesthetic with clear visual hierarchy.

### III. Anti-Vibe-Coding Visual Discipline (NON-NEGOTIABLE)
UI implementations MUST NEVER use blurry drop-shadows, glassmorphism (`backdrop-blur` / translucent
frosted surfaces), or generic purple/pink gradients. All elevation and emphasis MUST be achieved
exclusively through crisp `#0F172A` borders, hard `4px 4px 0px #0F172A` offset shadows, solid surface
contrasts, and the approved Sky Blue (`#38BDF8` / `#0284C7`) palette.

**Rationale**: Eliminating cliché AI-generated styling tropes preserves brand intentionality and
visual consistency across the entire portfolio.

### IV. Strict Type Safety & Validation Gates (NON-NEGOTIABLE)
Every backend API endpoint MUST define explicit Pydantic 2.14.3 request/response schemas and MUST
include automated Pydantic validation tests covering both valid payloads and boundary/rejection
cases. Every frontend build MUST pass `tsc --noEmit` and `next lint` with zero errors and zero
warnings before merge or deployment.

**Rationale**: Enforcing schema validation at API boundaries and zero-warning static analysis on
the frontend catches contract mismatches and regressions before production deployment.

### V. Git-First Database Migrations via Supabase MCP (NON-NEGOTIABLE)
All database schema inspections and migrations MUST be executed through the connected Supabase MCP
server (`supabase_mcp`), while preserving full schema reproducibility in Git:
- **Versioned SQL First**: Every schema change MUST be authored and saved as a versioned `.sql`
  migration file in `apps/api/migrations/` BEFORE being applied to the database.
- **MCP Inspection & Execution**: Schema state, existing migrations, and extensions MUST be inspected
  via the connected Supabase MCP server (e.g., `list_tables`, `list_migrations`), and migrations
  MUST be applied through the MCP server (`apply_migration`) using the exact SQL committed in
  `apps/api/migrations/`.
- **No Unrecorded Drift**: Ad-hoc DDL changes directly in the database dashboard or via raw SQL
  without a corresponding versioned file in `apps/api/migrations/` are strictly prohibited.

**Rationale**: Saving versioned `.sql` files in `apps/api/migrations/` prior to applying them via
the Supabase MCP server keeps Git as the single source of truth for database schema history and
ensures environments can be reproduced deterministically.

## Technology Stack & Infrastructure

| Layer | Mandated Technologies & Versions |
| :--- | :--- |
| **Frontend** | React 19.3, Next.js 16.4.5 (Active LTS), TypeScript 5.8 |
| **Styling & UI** | Tailwind CSS v4.1, shadcn/ui (Latest CLI) |
| **Backend API** | Python 3.13, FastAPI 0.162.5, Pydantic 2.14.3 |
| **Database & Vector Store** | PostgreSQL 18 (Supabase), `pgvector`, `pg_cron` |
| **RAG & AI Engine** | Google Gemini API (`gemini-3.5-flash-lite`, `gemini-embedding-2`), LangChain v0.3 (`langchain-google-genai`) |
| **Automation Layer** | n8n 2.47 (Docker) |
| **Hosting & DevOps** | Vercel (Next.js frontend), Render (FastAPI & container services) |

- Unapproved frameworks, alternative ORMs, CSS-in-JS runtimes, or unapproved LLM providers MUST NOT
  be introduced without a formal constitutional amendment.

## Visual Specifications & Quality Gates

### Visual Token Reference
- **Canvas Background**: `#F8FAFC`
- **Card Surface**: `#FFFFFF`
- **Section Divider**: Full-width `1px solid #0F172A`
- **Component Border (Cards, Buttons, Badges)**: `2px solid #0F172A`
- **Hard Offset Shadow (Cards, Buttons, Badges)**: `4px 4px 0px #0F172A` (zero blur)
- **Primary Accent**: `#38BDF8` (`sky-400`) — active nav pills, primary CTAs, high-contrast Contact banner card
- **Interactive Hover Accent**: `#0284C7` (`sky-600`)
- **Prohibited Styles**: Blurry drop-shadows (`shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`, or any CSS `box-shadow` with blur radius > `0px`), glassmorphism (`backdrop-blur-*`), and purple/pink gradients.

### Mandatory Quality Gates
1. **Backend Validation Gate**: Every FastAPI route MUST have corresponding automated tests verifying Pydantic 2.14.3 input/output validation.
2. **TypeScript Gate**: Frontend code MUST pass `tsc --noEmit` with zero type errors.
3. **Linter Gate**: Frontend code MUST pass `next lint` with zero warnings and zero errors.
4. **Database Migration Gate**: Every schema change MUST have a corresponding versioned `.sql` file in `apps/api/migrations/` saved before applying via the connected Supabase MCP server.

## Governance

This Constitution supersedes all other informal practices, style guides, and ad-hoc conventions
within the portfolio monorepo.

- **Amendment Procedure**: Any modification to stack versions, visual tokens, or quality gates
  requires updating `.specify/memory/constitution.md`, documenting the rationale in the Sync Impact
  Report, and updating dependent specifications or plans if affected.
- **Versioning Policy**: This document follows Semantic Versioning (`MAJOR.MINOR.PATCH`):
  - **MAJOR**: Backward-incompatible governance changes, stack replacements, or principle removals/redefinitions.
  - **MINOR**: Addition of new principles, new stack layers, or materially expanded compliance guidance.
  - **PATCH**: Wording clarifications, formatting fixes, or non-semantic refinements.
- **Compliance Review**: Every specification (`/speckit-specify`), implementation plan (`/speckit-plan`),
  task list (`/speckit-tasks`), and pull request MUST verify compliance with all five Core Principles
  before implementation or merge.

**Version**: 1.1.0 | **Ratified**: 2026-11-13 | **Last Amended**: 2026-11-14
