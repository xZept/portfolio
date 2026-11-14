# Phase 0 Research: Neo-Brutalist Single-Page Portfolio Application

**Feature Branch**: `001-single-page-portfolio`  
**Date**: 2026-11-14  
**Spec**: `specs/001-single-page-portfolio/spec.md`

---

## 1. Monorepo Architecture & Directory Layout

- **Decision**: Organize the repository as a multi-service monorepo with `frontend/` (Next.js 16.4.5 + React 19.3 + TypeScript 5.8 + Tailwind CSS v4.1), `backend/` (Python 3.13 + FastAPI 0.162.5 + Pydantic 2.14.3 + LangChain v0.3), `supabase/` (PostgreSQL 18 + `pgvector` + `pg_cron` SQL migrations & seed scripts), and `automation/` (n8n 2.47 Docker configuration), while keeping `docs/resume.md` and `images/` synced into `frontend/public/images/`.
- **Rationale**: Satisfies Principle I (Pinned Monorepo Stack Discipline) of the Constitution while isolating Node.js/TypeScript build tooling (`tsc --noEmit`, `next lint`) from the Python 3.13 virtual environment (`pytest`, Pydantic 2.14.3 validation gates) and independent deployment targets (Vercel for `frontend/`, Render for `backend/`).
- **Alternatives Considered**:
  - *Next.js API Routes only (no Python backend)*: Rejected because Principle I and Clarification #1 explicitly mandate a Python 3.13 + FastAPI 0.162.5 + Pydantic 2.14.3 backend for the "Ask My Resume" RAG pipeline.
  - *Single root-level mixed Python/Node directory*: Rejected because mixing `package.json`, `tsconfig.json`, and `pyproject.toml` at the repository root complicates Vercel and Render root-directory deployment configurations.

---

## 2. Interactive 3D Tech Globe Implementation (Section 4)

- **Decision**: Implement the Section 4 Interactive 3D Tech Globe using a custom TypeScript 3D Fibonacci-Sphere Projection & Quaternion Drag Engine rendered on an HTML5 `<canvas>` (for the `#38BDF8` sky-blue wireframe latitude/longitude sphere and node connection vectors on the `#0B1120` midnight-navy surface) paired with hardware-accelerated (`translate3d`), depth-sorted interactive DOM skill nodes for the 22 resume skills.
- **Rationale**:
  1. **React 19.3 Compatibility**: Zero third-party WebGL reconciler peer-dependency conflicts with React 19.3 and Next.js 16.4.5.
  2. **Neo-Brutalist Visual Fidelity**: Allows each 3D node to render crisp `2px solid` borders, high-contrast typography, hover scaling, and selected-node states without blurry WebGL texture anti-aliasing—strictly upholding Principle II & Principle III.
  3. **Accessibility & Fallback**: Because the 22 skill nodes are backed by accessible buttons synchronized with the 3D projection matrix, keyboard navigation (`Tab` / `Enter`), `prefers-reduced-motion: reduce` (pauses auto-rotation while keeping drag/click active), and 2D fallback (if Canvas 2D context initialization fails) work out of the box.
  4. **Bidirectional Pill Table Sync**: Clicking any of the 22 nodes updates a shared React state (`selectedSkillId`), immediately rendering the selected-skill summary badge inside the `#0B1120` globe card (displaying its category and resume usage context) and highlighting the corresponding skill pill in the Categorized Pill Table below.
- **Alternatives Considered**:
  - *Three.js + `@react-three/fiber` + `@react-three/drei`*: Rejected due to React 19.3 reconciler version friction, ~150KB+ gzipped bundle overhead for a single wireframe sphere, and difficulty rendering crisp neo-brutalist CSS borders inside WebGL sprite textures.
  - *TagCanvas jQuery/legacy script*: Rejected due to lack of strict TypeScript 5.8 definitions, imperative DOM mutations, and poor support for custom neo-brutalist node badges.

---

## 3. Neo-Brutalist Sky Blue Design Tokens in Tailwind CSS v4.1 & shadcn/ui

- **Decision**: Define all Neo-Brutalist Sky Blue visual tokens in `frontend/src/app/globals.css` using Tailwind CSS v4.1 `@theme` directives and reusable utility primitives (`nb-card`, `nb-btn-primary`, `nb-btn-secondary`, `nb-badge`, `nb-pill-active`, `nb-section-divider`) with automated static/unit test checks verifying zero prohibited classes (`backdrop-blur-*`, `shadow-sm/md/lg/xl/2xl`, or purple/pink gradients).
- **Rationale**: Tailwind CSS v4.1 uses CSS-first configuration via `@theme`. Defining explicit tokens (`--color-nb-canvas: #F8FAFC`, `--color-nb-surface: #FFFFFF`, `--color-nb-ink: #0F172A`, `--color-nb-globe: #0B1120`, `--color-nb-sky: #38BDF8`, `--color-nb-sky-hover: #0284C7`, `--shadow-nb: 4px 4px 0px #0F172A`) guarantees 100% compliance with Principles II and III across all 7 sections, modals, and drawers.
- **Alternatives Considered**:
  - *Ad-hoc inline arbitrary Tailwind classes on every element*: Rejected because centralizing Neo-Brutalist primitives reduces repetition and prevents accidental use of default Tailwind blurred shadows (`shadow-md`) in `shadcn/ui` Dialog/Sheet primitives.

---

## 4. "Ask My Resume" Hybrid FastAPI + Gemini RAG & Offline Fallback Architecture

- **Decision**: Build a two-tier "Ask My Resume" architecture:
  1. **Primary Tier (Live Backend RAG)**: `POST /api/v1/ask-resume` in FastAPI 0.162.5 (Python 3.13) validates requests via Pydantic 2.14.3, embeds the visitor's question with `gemini-embedding-2` via `langchain-google-genai` (LangChain v0.3), queries PostgreSQL 18 (Supabase `pgvector`) for the most relevant resume sections from `docs/resume.md`, and generates a strictly grounded answer with citations using `gemini-3.5-flash-lite`. Includes a `pg_cron` job definition for 30-day chat telemetry archival (mirroring Allen's DACON architecture).
  2. **Resilient Fallback Tier (Client-Side Grounded Engine)**: If `NEXT_PUBLIC_API_URL` is unreachable, times out (`> 4000ms`), or returns `503` (e.g., during offline local preview or cold-start), the frontend automatically resolves the query against a local deterministic keyword/section matcher built over the structured `docs/resume.md` dataset (`frontend/src/data/resume.ts`), badging the response as `"Grounded in docs/resume.md (Local Fallback)"`.
- **Rationale**: Directly fulfills Clarification #1 and FR-012, ensuring that hiring managers and automated E2E tests always receive accurate, zero-hallucination answers grounded strictly in `docs/resume.md` whether or not the cloud RAG backend is online.
- **Alternatives Considered**:
  - *Backend-only with error toast when offline*: Rejected because a portfolio reviewer testing locally without Supabase/Gemini API keys would see a broken feature.
  - *Client-side only without FastAPI*: Rejected because it violates Principle I and Principle IV of the Constitution and Clarification #1.

---

## 5. Sticky Header Scroll-Spy & Smooth Anchor Navigation (Section 1)

- **Decision**: Use an `IntersectionObserver` hook (`useActiveSection`) observing the 6 navigable section IDs (`#experience`, `#about`, `#skills`, `#education`, `#certifications`, `#contact`) with a rootMargin accounting for the sticky header height (`-80px 0px -55% 0px`) and a temporary click-lock ref (`isProgrammaticScroll`) during smooth anchor transitions. Apply `scroll-margin-top: 5rem` (`scroll-mt-20`) to all section elements.
- **Rationale**: Prevents the active `#38BDF8` sky-blue pill indicator in the sticky header from flickering across intermediate sections when a user clicks an anchor link or `"See my experience →"`, addressing Edge Case #4 and SC-003 (`< 1s` update latency).
- **Alternatives Considered**:
  - *Raw `window.onscroll` bounding-rect polling*: Rejected due to unnecessary main-thread layout thrashing during scroll.

---

## 6. Static Asset Handling (`images/` & `docs/resume.md`)

- **Decision**: Expose the verified repository assets (`images/others/my-photo.png`, `images/others/bataan-peninsula-state-university.png`, `images/projects/suhaycore.png`, `images/projects/dan.png`, `images/projects/fitquest.gif`, `images/certifications/pearson.png`, `images/certifications/microsoft.png`, `images/certifications/cisco.png`) under `frontend/public/images/` (mirrored/copied during setup so Next.js static serving resolves `/images/...` deterministically) and use `unoptimized` on `fitquest.gif` so the animated GIF plays continuously without frame stripping.
- **Rationale**: Next.js serves static assets from `public/`. Keeping exact relative paths (`/images/projects/suhaycore.png`, etc.) matches the paths specified in `spec.md` and guarantees zero broken images across `1440px`, `768px`, and `375px` viewports (SC-002).
- **Alternatives Considered**:
  - *External CDN hosting*: Rejected to keep the repository self-contained and offline-testable.
