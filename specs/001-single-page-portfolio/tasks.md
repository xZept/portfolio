# Tasks: Neo-Brutalist Single-Page Portfolio Application

**Input**: Design documents from `/specs/001-single-page-portfolio/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/api-contracts.md`, `contracts/ui-contracts.md`, `quickstart.md`

**Tests**: Included where mandated by Constitution Principle IV (Pydantic 2.14.3 API validation tests, Neo-Brutalist visual token compliance tests, `tsc --noEmit`, and `next lint`) and user story verification scenarios.

**Organization**: Tasks are grouped by user story (`US1`–`US4`) so each increment can be implemented and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story mapping (`[US1]`, `[US2]`, `[US3]`, `[US4]`) — used only in User Story phases
- All file paths are relative to the repository root (`c:\Users\allen\Documents\portfolio\`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the pinned monorepo directory structure, frontend/backend packages, static image assets, and automation/database scaffolding.

- [X] T001 Create monorepo directories (`frontend/`, `backend/`, `supabase/migrations/`, `automation/n8n/`) per `specs/001-single-page-portfolio/plan.md`
- [X] T002 Initialize Next.js 16.4.5 + React 19.3 + TypeScript 5.8 + Tailwind CSS v4.1 + `lucide-react` + Vitest/Testing Library dependencies in `frontend/package.json` and `frontend/tsconfig.json`
- [X] T003 [P] Initialize Python 3.13 + FastAPI 0.162.5 + Pydantic 2.14.3 + LangChain v0.3 (`langchain-google-genai`) + `psycopg[binary]` + `pytest` + `httpx` dependencies in `backend/requirements.txt`
- [X] T004 [P] Configure ESLint (`next lint`) and environment templates in `frontend/eslint.config.mjs`, `frontend/.env.example`, and `backend/.env.example`
- [X] T005 [P] Sync all 8 verified visual assets from `images/` (`my-photo.png`, `bataan-peninsula-state-university.png`, `suhaycore.png`, `dan.png`, `fitquest.gif`, `pearson.png`, `microsoft.png`, `cisco.png`) into `frontend/public/images/` preserving subfolder paths
- [X] T006 [P] Create n8n 2.47 Docker service definition in `automation/n8n/docker-compose.yml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core visual design tokens, canonical resume dataset, shared UI primitives, database schema, and backend Pydantic API foundation required before any user story can proceed.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T007 Configure Neo-Brutalist Sky Blue Tailwind v4.1 `@theme` tokens (`#F8FAFC` canvas, `#FFFFFF` card surface, `#0B1120` globe card, `#0F172A` borders/shadows, `#38BDF8` sky-400 primary accent, `#0284C7` sky-600 hover accent, `2px solid #0F172A` borders, `4px 4px 0px #0F172A` zero-blur offset shadows, `1px solid #0F172A` section dividers) and `scroll-margin-top` rules in `frontend/src/app/globals.css`
- [X] T008 [P] Create root App Router layout and metadata in `frontend/src/app/layout.tsx`
- [X] T009 [P] Create strongly-typed canonical resume dataset (`ProfileSummary`, `ExperienceEntry`, `MilestoneItem`, `SkillNode`, `SkillCategoryGroup`, `EducationRecord`, `CertificationRecord`) strictly grounded in `docs/resume.md` in `frontend/src/data/resume.ts`
- [X] T010 [P] Initialize `shadcn/ui` Neo-Brutalist primitives (Button, Badge, Card, Dialog/Drawer restyled with `border-2 border-[#0F172A]` and `shadow-[4px_4px_0px_#0F172A]` and zero blur) in `frontend/src/components/ui/`
- [X] T011 [P] Create PostgreSQL 18 `pgvector` (`resume_chunks` with `VECTOR(768)` HNSW index) and `pg_cron` 30-day `resume_query_logs` archival migration in `supabase/migrations/001_resume_rag.sql`
- [X] T012 [P] Create Pydantic 2.14.3 environment settings in `backend/app/config.py`
- [X] T013 Implement strict Pydantic 2.14.3 schemas (`AskResumeRequest` with `question: str` `min_length=2, max_length=500` stripped via `@field_validator`, `context_project_id: Literal["suhaycore", "dan", "fitquest"] | None = None`, `ConfigDict(extra="forbid")`; `ResumeCitation`; `AskResumeResponse`; `HealthResponse`) in `backend/app/schemas/ask_resume.py`
- [X] T014 Create FastAPI 0.162.5 application entry point with CORS middleware and router registration in `backend/app/main.py`

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - First-Impression Evaluation via Sticky Navigation, Hero & Experience Showcase (Priority: P1) 🎯 MVP

**Goal**: Deliver the sticky top navigation bar with active `#38BDF8` pill highlighting, the 2-column Hero with Allen's framed photo and tilted `"Full-Stack & AI"` badge, and the 2-column Experience & Project Showcase (`SuhayCore`, `DAN`, `FitQuest`) with `"View Case Study"` modal and `"Ask AI about this"` trigger hooks.

**Independent Test**: Load `http://localhost:3000`, verify sticky header brand/links/active pill updates on scroll and `"See my experience →"` click, and verify all 3 Experience cards render `/images/projects/` media, status badges (`In UAT`, `Shipped`, `Android`), factual resume bullets, tech tags, and functional `"View Case Study"` modal.

### Implementation for User Story 1

- [X] T015 [P] [US1] Implement `useActiveSection` `IntersectionObserver` scroll-spy hook with programmatic scroll lock to prevent active pill flicker in `frontend/src/lib/use-active-section.ts`
- [X] T016 [P] [US1] Build Section 1a `StickyHeader` component (`Allen James Laxamana` left, anchor links `Experience`, `About`, `Skills`, `Education`, `Certifications`, `Contact` with `#38BDF8` bordered active pill, and `"Ask My Resume"` trigger button) in `frontend/src/components/sections/StickyHeader.tsx`
- [X] T017 [P] [US1] Build Section 1b `HeroSection` 2-column component (`Junior .NET / Full-Stack Developer` headline, core stack line, factual bio, `"See my experience →"` and `"Ask My Resume"` CTAs, framed `/images/others/my-photo.png`, and tilted `"Full-Stack & AI"` badge) in `frontend/src/components/sections/HeroSection.tsx`
- [X] T018 [P] [US1] Build Neo-Brutalist `CaseStudyModal` displaying `problemSummary`, `architectureHighlights`, `securityAndData`, and `deliveryStatus` for each `ExperienceEntry` in `frontend/src/components/overlays/CaseStudyModal.tsx`
- [X] T019 [US1] Build Section 2 `ExperienceSection` 2-column card showcase (`SuhayCore` `In UAT`, `DAN` `Shipped`, `FitQuest` `Android` with `unoptimized` GIF support, exact bullets, tech tags, `"View Case Study"` modal trigger, and `"Ask AI about this"` callback) in `frontend/src/components/sections/ExperienceSection.tsx`
- [X] T020 [US1] Assemble MVP single-page shell (`StickyHeader`, `HeroSection`, `ExperienceSection`, `CaseStudyModal`) in `frontend/src/app/page.tsx`
- [X] T021 [P] [US1] Write Vitest component tests verifying Section 1 & Section 2 factual content, active pill navigation, and Case Study modal opening in `frontend/tests/sections-us1.test.tsx`

**Checkpoint**: User Story 1 (MVP) is complete and independently testable.

---

## Phase 4: User Story 2 - Interactive Skill Exploration via 3D Tech Globe & Categorized Pill Table (Priority: P2)

**Goal**: Deliver Section 4 featuring the dark midnight-navy (`#0B1120`) Interactive 3D Tech Globe with a `#38BDF8` wireframe sphere and 22 draggable, hoverable, clickable skill nodes synchronized bidirectionally with the 4-category Categorized Pill Table below.

**Independent Test**: Scroll to `#skills`, drag the 3D Tech Globe to rotate, click any of the 22 skill nodes, verify the selected-skill summary badge appears inside `#0B1120` container AND the matching skill pill highlights in the Categorized Pill Table; verify `prefers-reduced-motion` pauses auto-rotation.

### Implementation for User Story 2

- [X] T022 [P] [US2] Implement 3D Fibonacci-sphere coordinate generator, quaternion/Euler rotation math, and depth-sorted projection helpers in `frontend/src/lib/globe-math.ts`
- [X] T023 [US2] Build `TechGlobe3D` component (`#0B1120` container, `#38BDF8` HTML5 `<canvas>` wireframe sphere, 22 depth-sorted interactive skill nodes, pointer drag rotation, `prefers-reduced-motion` / 2D fallback, and selected-skill summary badge) in `frontend/src/components/sections/TechGlobe3D.tsx`
- [X] T024 [P] [US2] Build `CategorizedPillTable` component rendering the exact 4 resume categories (`Languages & Core`, `Frameworks & Web`, `Data & Infrastructure`, `Engineering Practices`) with `2px solid #0F172A` skill pills and click-to-select highlight state in `frontend/src/components/sections/CategorizedPillTable.tsx`
- [X] T025 [US2] Build `SkillsSection` wrapper managing shared `selectedSkillId` state between `TechGlobe3D` and `CategorizedPillTable` in `frontend/src/components/sections/SkillsSection.tsx`
- [X] T026 [US2] Wire `SkillsSection` into `frontend/src/app/page.tsx`
- [X] T027 [P] [US2] Write Vitest tests verifying all 22 globe nodes, all 4 table categories, and bidirectional click-selection synchronization in `frontend/tests/skills-globe.test.tsx`

**Checkpoint**: User Stories 1 and 2 work independently and integrate cleanly.

---

## Phase 5: User Story 3 - Narrative Background, Academic Credentials & Industry Certifications Verification (Priority: P3)

**Goal**: Deliver Section 3 (About 2-column narrative bio + 4-item Timeline/Milestones card), Section 5 (BPSU BS Computer Science Education card), and Section 6 (5-card Certifications grid with Pearson VUE/Microsoft co-branding and Cisco logo).

**Independent Test**: Scroll through `#about`, `#education`, and `#certifications` and verify exact dates, locations, institution names, 4 milestones, BPSU image, and all 5 certification cards with their assigned logos (`pearson.png` + `microsoft.png` on IT Specialist cards, `cisco.png` on Cisco card).

### Implementation for User Story 3

- [X] T028 [P] [US3] Build Section 3 `AboutSection` 2-column split (narrative bio on left, `"Timeline / Milestones"` neo-brutalist card on right listing `2025 FitQuest`, `Feb 2026 DACON Systems Internship`, `Mar 2026 SuhayCore .NET 10 Lead`, `2026 BS Computer Science Grad`) in `frontend/src/components/sections/AboutSection.tsx`
- [X] T029 [P] [US3] Build Section 5 `EducationSection` card featuring `/images/others/bataan-peninsula-state-university.png`, `Bataan Peninsula State University (BPSU)`, `Bachelor of Science in Computer Science`, `2022 – 2026`, and `Balanga, Bataan` in `frontend/src/components/sections/EducationSection.tsx`
- [X] T030 [P] [US3] Build Section 6 `CertificationsSection` 5-card grid (4 `Certiport / Pearson VUE` IT Specialist cards with `pearson.png` + `microsoft.png` co-brand icon; 1 `Cisco` Cyber Threat Management card with `cisco.png`) in `frontend/src/components/sections/CertificationsSection.tsx`
- [X] T031 [US3] Wire `AboutSection`, `EducationSection`, and `CertificationsSection` into `frontend/src/app/page.tsx`
- [X] T032 [P] [US3] Write Vitest tests verifying About milestones, Education card, and all 5 Certification cards + logo assignments in `frontend/tests/sections-us3.test.tsx`

**Checkpoint**: User Stories 1, 2, and 3 are all independently functional.

---

## Phase 6: User Story 4 - Direct Outreach & Interactive Resume Inquiry (Priority: P4)

**Goal**: Deliver Section 7 (high-contrast `#38BDF8` Contact Banner & Footer with Copy email + clipboard fallback, Write email, phone, location, LinkedIn, configurable GitHub link) and the full-stack **"Ask My Resume"** FastAPI + Gemini (`gemini-3.5-flash-lite` + `gemini-embedding-2` + `pgvector`) RAG service with automatic local resume-grounded fallback.

**Independent Test**: Run `pytest -v` in `backend/` to verify all 8 Pydantic 2.14.3 validation tests pass; test `"Copy email"` and `"Write email"` in `#contact`; open `"Ask My Resume"` (from Header, Hero, or `"Ask AI about this"` on any Experience card) and verify grounded answers with citations work both with FastAPI running and when offline.

### Tests for User Story 4 (Mandatory per Constitution Principle IV)

- [X] T033 [P] [US4] Write Pydantic 2.14.3 contract & boundary validation test suite (all 8 test cases from `contracts/api-contracts.md`: valid payload, valid without context, empty/whitespace rejection, min_length `< 2` rejection, max_length `> 500` rejection, invalid `context_project_id` rejection, `extra="forbid"` rejection, health endpoint schema) in `backend/tests/test_ask_resume_validation.py`
- [X] T034 [P] [US4] Write Vitest tests for `ask-resume-client` offline fallback grounding and Section 7 clipboard copy + fallback selection in `frontend/tests/ask-resume-and-contact.test.tsx`

### Implementation for User Story 4

- [X] T035 [P] [US4] Implement LangChain v0.3 (`langchain-google-genai`) + `gemini-embedding-2` + Supabase `pgvector` + `gemini-3.5-flash-lite` RAG service with deterministic `docs/resume.md` fallback in `backend/app/services/rag_service.py`
- [X] T036 [US4] Implement `GET /api/v1/health` and `POST /api/v1/ask-resume` FastAPI routes using `AskResumeRequest` and `AskResumeResponse` in `backend/app/api/routes.py`
- [X] T037 [P] [US4] Implement frontend `askResume` hybrid API client (4000ms timeout + automatic local `docs/resume.md` grounded fallback) in `frontend/src/lib/ask-resume-client.ts`
- [X] T038 [US4] Build Neo-Brutalist `AskResumeDrawer` component with starter prompt chips, pre-filled project context support, citation badges, and mode indicator (`gemini-rag` vs `local-fallback`) in `frontend/src/components/overlays/AskResumeDrawer.tsx`
- [X] T039 [P] [US4] Build Section 7 `ContactSection` full-width `#38BDF8` neo-brutalist banner & footer (`allenjames.laxamana@gmail.com` with `"Copy email"` + clipboard fallback + `"Write email"`, `+63 945-322-7669`, `Balanga, Bataan`, LinkedIn, configurable GitHub `https://github.com/xZept`) in `frontend/src/components/sections/ContactSection.tsx`
- [X] T040 [US4] Wire `ContactSection` and `AskResumeDrawer` (connected to `StickyHeader`, `HeroSection`, and `ExperienceSection` `"Ask AI about this"` triggers) into `frontend/src/app/page.tsx`

**Checkpoint**: All 4 user stories are complete and independently verifiable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Enforce Constitution Principle III & IV quality gates, responsive layout polish across `1440px` / `768px` / `375px`, and end-to-end `quickstart.md` validation.

- [X] T041 [P] Add automated Neo-Brutalist Visual Discipline test scanning stylesheets and components for zero `backdrop-blur-*`, zero blurred `shadow-sm/md/lg/xl/2xl`, and zero purple/pink gradients in `frontend/tests/visual-system.test.tsx`
- [X] T042 [P] Audit responsive collapse (`1440px`, `768px`, `375px`), `scroll-margin-top`, and zero horizontal overflow across all 7 sections in `frontend/src/app/globals.css` and `frontend/src/components/sections/*.tsx`
- [X] T043 Run all mandatory Constitution Principle IV quality gates (`pytest -v` in `backend/`, `npx tsc --noEmit` in `frontend/`, `npm run lint` in `frontend/`, `npm test -- --run` in `frontend/`) and verify all scenarios in `specs/001-single-page-portfolio/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 completion — **BLOCKS** all user stories (`US1`–`US4`).
- **Phase 3 (US1 — Header, Hero & Experience)**: Depends on Phase 2. Delivers the **MVP**.
- **Phase 4 (US2 — 3D Tech Globe & Categorized Pill Table)**: Depends on Phase 2. Independent of US1 (only wires into `frontend/src/app/page.tsx`).
- **Phase 5 (US3 — About, Education & Certifications)**: Depends on Phase 2. Independent of US1/US2.
- **Phase 6 (US4 — Contact & Ask My Resume RAG)**: Depends on Phase 2 (`backend/app/schemas/ask_resume.py`, `backend/app/main.py`, `frontend/src/data/resume.ts`). Connects `AskResumeDrawer` triggers into `StickyHeader`, `HeroSection`, and `ExperienceSection`.
- **Phase 7 (Polish & Gates)**: Depends on Phases 3–6 completion.

### Parallel Opportunities

- **Phase 1**: `T003`, `T004`, `T005`, `T006` can run in parallel after `T001`/`T002`.
- **Phase 2**: `T008`, `T009`, `T010`, `T011`, `T012` can run in parallel while `T007` and `T013` are authored.
- **Phase 3 (US1)**: `T015`, `T016`, `T017`, `T018` can run in parallel before `T019` and `T020`.
- **Phase 4 (US2)**: `T022` and `T024` can run in parallel; `T023` depends on `T022`.
- **Phase 5 (US3)**: `T028`, `T029`, `T030` are completely independent and can run in parallel.
- **Phase 6 (US4)**: `T033`, `T034`, `T035`, `T037`, `T039` can run in parallel before `T036`, `T038`, and `T040`.

---

## Parallel Example: User Story 1 (MVP)

```text
# Launch independent US1 components in parallel:
T015: Implement useActiveSection scroll-spy hook in frontend/src/lib/use-active-section.ts
T016: Build StickyHeader in frontend/src/components/sections/StickyHeader.tsx
T017: Build HeroSection in frontend/src/components/sections/HeroSection.tsx
T018: Build CaseStudyModal in frontend/src/components/overlays/CaseStudyModal.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete **Phase 1 (Setup)** and **Phase 2 (Foundational)**.
2. Complete **Phase 3 (User Story 1)** (`T015`–`T021`).
3. **STOP and VALIDATE**: Verify sticky header navigation, Hero bio/photo, and all 3 Experience cards (`SuhayCore`, `DAN`, `FitQuest`) with `"View Case Study"` modal.

### Incremental Delivery
1. **Setup + Foundational** → Visual tokens, canonical `resume.ts`, and Pydantic 2.14.3 API foundation ready.
2. **+ US1 (P1)** → Sticky Header, Hero, Experience Showcase (MVP!).
3. **+ US2 (P2)** → Interactive 3D Tech Globe + synchronized Categorized Pill Table.
4. **+ US3 (P3)** → About & Milestones, Education, and Certifications Grid.
5. **+ US4 (P4)** → High-Contrast Sky Blue Contact Banner + Live FastAPI/Gemini RAG & Local Fallback.
6. **+ Polish** → Automated Neo-Brutalist visual token check, `tsc --noEmit`, `next lint`, and `pytest` verification.
