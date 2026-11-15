# Implementation Plan: Hero Download Resume Button

**Branch**: `003-hero-download-resume` | **Date**: 2026-11-15 | **Spec**: [spec.md](file:///c:/Users/allen/Documents/portfolio/specs/003-hero-download-resume/spec.md)

**Input**: Feature specification from `/specs/003-hero-download-resume/spec.md`

## Summary

Serve `Laxamana_Resume_DotNet_FullStack.pdf` statically from `frontend/public/resume/Laxamana_Resume_DotNet_FullStack.pdf` (URL `/resume/Laxamana_Resume_DotNet_FullStack.pdf`) and add a `"Download Resume"` button next to `"Ask My Resume"` in `frontend/src/components/sections/HeroSection.tsx` using the existing Neo-Brutalist `Button` tokens (`@/components/ui/button`). Activating the button fetches the static PDF as a `Blob` to verify availability before triggering a clean-filename download (`Laxamana_Resume_DotNet_FullStack.pdf`), transitions to a `"Downloaded"` state for `2500ms`, and reverts automatically without navigating away from the page.

## Technical Context

**Language/Version**: TypeScript 5.8.3, React 19.3.0, Next.js 16.4.5  
**Primary Dependencies**: `lucide-react` (`Download`, `Check` icons), Tailwind CSS v4.1, existing `@/components/ui/button` (`Button`)  
**Storage**: Static file asset at `frontend/public/resume/Laxamana_Resume_DotNet_FullStack.pdf` (no database)  
**Testing**: Vitest 3.1.3 + `@testing-library/react` 16.3.0 + `@testing-library/user-event` 14.6.1  
**Target Platform**: Modern desktop and mobile web browsers (Vercel Next.js frontend)  
**Project Type**: Web application (`frontend/` Next.js App Router)  
**Performance Goals**: Immediate `"Downloaded"` feedback within 100ms of response completion; zero layout shift  
**Constraints**: Must not navigate away from `/`; must not show `"Downloaded"` if PDF fetch fails (FR-007); must pass `tsc --noEmit` and `npm run lint` (`--max-warnings 0`)  
**Scale/Scope**: Single-component update (`HeroSection.tsx`), one static PDF path (`frontend/public/resume/`), and unit/visual tests in `frontend/tests/`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Pinned Monorepo Stack Discipline**: PASS — Uses existing React 19.3, Next.js 16.4.5, TypeScript 5.8.3, Tailwind CSS v4.1, and `lucide-react`; introduces zero new dependencies.
- **II. Neo-Brutalist Sky Blue Visual System**: PASS — Reuses `@/components/ui/button` (`Button`) with `2px solid #0F172A` borders, `4px 4px 0px #0F172A` hard offset shadows, `#FFFFFF` / `#38BDF8` surfaces, and `#0284C7` hover states.
- **III. Anti-Vibe-Coding Visual Discipline**: PASS — Zero blurry drop-shadows, glassmorphism, or purple/pink gradients; validated by existing `frontend/tests/visual-system.test.tsx`.
- **IV. Strict Type Safety & Validation Gates**: PASS — Frontend changes will be verified with `npx tsc --noEmit`, `npm run lint`, and Vitest unit tests.
- **V. Git-First Database Migrations via Supabase MCP**: N/A — No database schema or backend changes.

*Post-Design Re-Check*: All five principles remain satisfied after Phase 1 design (`data-model.md`, `contracts/ui-contract.md`, `quickstart.md`).

## Project Structure

### Documentation (this feature)

```text
specs/003-hero-download-resume/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── ui-contract.md   # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
frontend/
├── public/
│   └── resume/
│       └── Laxamana_Resume_DotNet_FullStack.pdf   # Static PDF asset
├── src/
│   ├── app/
│   │   └── globals.css                            # Existing Neo-Brutalist tokens (--color-nb-*, .nb-btn-*)
│   ├── components/
│   │   ├── sections/
│   │   │   └── HeroSection.tsx                    # Add "Download Resume" Button + state/timer logic
│   │   └── ui/
│   │       └── button.tsx                         # Existing Neo-Brutalist Button component
└── tests/
    ├── sections-us1.test.tsx                      # Existing Hero tests
    └── visual-system.test.tsx                     # Existing Constitution visual gate tests
```

**Structure Decision**: Web application (`frontend/` only). No backend (`backend/`) changes are required because the resume PDF is served as a static asset from `frontend/public/resume/`.

## Complexity Tracking

No constitution violations; no complexity exemptions required.
