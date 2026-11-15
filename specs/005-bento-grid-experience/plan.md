# Implementation Plan: Responsive CSS Bento Grid for Experience & Projects

**Branch**: `005-bento-grid-experience` | **Date**: 2026-11-15 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-bento-grid-experience/spec.md`

## Summary

Refactor the `"01 / Experience & Projects"` section (`frontend/src/components/sections/ExperienceSection.tsx`) and its backing schema (`frontend/src/data/resume.ts`) from a uniform 2-column grid into a responsive 12-column Neo-Brutalist CSS Bento Grid (`grid-cols-1 lg:grid-cols-12`) with explicit schema-driven `col-span` and `row-span` assignments (`SuhayCore` at `lg:col-span-12 lg:row-span-1`, `DAN` at `lg:col-span-7 lg:row-span-1`, and `FitQuest` at `lg:col-span-5 lg:row-span-1`). Enforce `min-w-0 max-w-full overflow-hidden` on all grid cells and media wrappers, render all project previews inside fixed `aspect-video` containers using `object-contain` over a subtle Neo-Brutalist neutral dot-grid backdrop so no screenshot or portrait GIF is cropped, reserve padding clearance (`pb-2 pr-1`) for `4px 4px 0px #0F172A` hard offset shadows, and maintain strict scope isolation without touching global layout wrappers, navigation, `globals.css`, or sibling portfolio sections.

## Technical Context

**Language/Version**: TypeScript 5.8.3, React 19.3.0, Next.js 16.4.5 (App Router)  
**Primary Dependencies**: `next/image`, `lucide-react`, Tailwind CSS v4.1.18  
**Storage**: Static TypeScript data module (`frontend/src/data/resume.ts`) and existing project media assets (`frontend/public/images/projects/{suhaycore.png,dan.png,fitquest.gif}`)  
**Testing**: Vitest 3.1.3 + `@testing-library/react` 16.3.0 (`npm test -- --run`), `npx tsc --noEmit`, `npm run lint`, `npm run build`  
**Target Platform**: Web browsers across mobile (`375px`), tablet (`768px`), and desktop (`1024px–1440px+`) viewports  
**Project Type**: Web application (monorepo `frontend/` Next.js application)  
**Performance Goals**: Zero Cumulative Layout Shift (`CLS = 0`) on media load via fixed `aspect-video` sizing; zero horizontal overflow (`overflow-x`) across all breakpoints  
**Constraints**:
- **Grid Architecture**: `grid-cols-1` on mobile/tablet collapsing from `lg:grid-cols-12` on desktop with explicit `col-span` and `row-span` classes per entry.
- **Media Containment & Bounds**: `min-w-0 max-w-full overflow-hidden` on all grid cells and media wrappers; `aspect-video` containers with `object-contain` and subtle neutral/grid backdrop.
- **Shadow & Border Safety**: Preserve `2px solid #0F172A` borders and `4px 4px 0px #0F172A` hard offset shadows with shadow-safe grid padding so shadows never clip or cause horizontal scroll.
- **Scope Isolation**: Modify strictly `frontend/src/components/sections/ExperienceSection.tsx` and `frontend/src/data/resume.ts` (plus unit tests in `frontend/tests/`).  
**Scale/Scope**: 2 source files (`frontend/src/data/resume.ts`, `frontend/src/components/sections/ExperienceSection.tsx`) and 1 dedicated test suite (`frontend/tests/bento-grid-experience.test.tsx` / updates to `frontend/tests/sections-us1.test.tsx`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
| :--- | :--- | :--- |
| **I. Pinned Monorepo Stack Discipline** | PASS | Uses pinned React 19.3, Next.js 16.4.5, TypeScript 5.8, and Tailwind CSS v4.1. Zero new dependencies introduced. |
| **II. Neo-Brutalist Sky Blue Visual System** | PASS | Preserves `#F8FAFC` section canvas, `#FFFFFF` card surfaces, `2px solid #0F172A` borders (`border-2 border-[#0F172A]`), `4px 4px 0px #0F172A` zero-blur hard offset shadows (`shadow-[4px_4px_0px_#0F172A]`), `#38BDF8` primary accents, and `#0284C7` interactive hover states. |
| **III. Anti-Vibe-Coding Visual Discipline (NON-NEGOTIABLE)** | PASS | Zero blurry shadows (`shadow-sm..2xl`), zero glassmorphism (`backdrop-blur`), and zero purple/pink gradients. |
| **IV. Strict Type Safety & Validation Gates (NON-NEGOTIABLE)** | PASS | Explicit `ExperienceBentoLayout` TypeScript types in `resume.ts`; validated via `npx tsc --noEmit`, `npm run lint`, and Vitest unit tests. |
| **V. Git-First Database Migrations via Supabase MCP (NON-NEGOTIABLE)** | PASS (N/A) | Frontend-only layout refactoring; no database schema changes. |

*Post-Phase 1 Design Re-check*: All five Core Principles pass with zero violations.

## Project Structure

### Documentation (this feature)

```text
specs/005-bento-grid-experience/
├── spec.md                              # Feature specification
├── plan.md                              # This file (/speckit-plan command output)
├── research.md                          # Phase 0 output (grid topology, media containment, shadow clearance)
├── data-model.md                        # Phase 1 output (ExperienceBentoLayout & ExperienceEntry schema)
├── quickstart.md                        # Phase 1 output (validation & verification commands)
├── contracts/
│   └── bento-grid-ui-contract.md        # Phase 1 output (DOM, Tailwind class, and visual contract)
└── tasks.md                             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   │   └── sections/
│   │       └── ExperienceSection.tsx    # Refactored 12-column CSS Bento Grid & aspect-video object-contain stage
│   └── data/
│       └── resume.ts                    # Extended ExperienceEntry schema with ExperienceBentoLayout (colSpan/rowSpan)
└── tests/
    ├── sections-us1.test.tsx            # Existing US1 integration tests
    └── bento-grid-experience.test.tsx   # Targeted Bento Grid, media containment, and shadow safety tests
```

**Structure Decision**: Restrict modifications strictly to `frontend/src/data/resume.ts` and `frontend/src/components/sections/ExperienceSection.tsx` (with test coverage in `frontend/tests/`), leaving global layout wrappers (`layout.tsx`, `page.tsx`, `globals.css`) and all sibling portfolio sections untouched per FR-006.

## Complexity Tracking

No Constitution Check violations; no complexity justification required.
