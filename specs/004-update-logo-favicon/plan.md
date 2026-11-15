# Implementation Plan: Update Sticky Top Bar Logo and Favicon

**Branch**: `004-update-logo-favicon` | **Date**: 2026-11-15 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-update-logo-favicon/spec.md`

## Summary

Replace the `AJ` monogram badge in `StickyHeader` (`frontend/src/components/sections/StickyHeader.tsx`) with `images/others/logo.png` (served via `frontend/public/images/others/logo.png`) and configure the browser favicon in `RootLayout` metadata (`frontend/src/app/layout.tsx`) to use `/images/others/logo.png`, while keeping all other portfolio content, styling, and behavior completely unchanged.

## Technical Context

**Language/Version**: TypeScript 5.8.3, React 19.3.0, Next.js 16.4.5 (App Router)  
**Primary Dependencies**: `next/image`, `next` Metadata API, Tailwind CSS v4.1.18  
**Storage**: Static file asset (`frontend/public/images/others/logo.png`, copied from `images/others/logo.png`)  
**Testing**: Vitest 3.1.3 + `@testing-library/react` 16.3.0 (`npm test -- --run`), `tsc --noEmit`, `npm run lint`, `npm run build`  
**Target Platform**: Web browsers (desktop, tablet, mobile viewports `320px–1440px+`)  
**Project Type**: Web application (monorepo `frontend/` Next.js app)  
**Performance Goals**: Zero layout shift (CLS = 0) in sticky header; `priority` loading for above-the-fold header logo; zero failed icon requests  
**Constraints**: Strict scope isolation (FR-006 — no changes outside the sticky top bar logo slot and browser favicon); Neo-Brutalist Sky Blue compliance (`2px solid #0F172A` border, `4px 4px 0px #0F172A` zero-blur shadow)  
**Scale/Scope**: 1 static asset copy, 2 source file updates (`StickyHeader.tsx`, `layout.tsx`), 1 targeted test file (`logo-and-favicon.test.tsx`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
| :--- | :--- | :--- |
| **I. Pinned Monorepo Stack Discipline** | PASS | Uses existing Next.js 16.4.5, React 19.3, TypeScript 5.8, Tailwind CSS v4.1. No new packages added. |
| **II. Neo-Brutalist Sky Blue Visual System** | PASS | Logo container preserves `border-2 border-[#0F172A]` and `shadow-[4px_4px_0px_#0F172A]` hard zero-blur offset shadow. |
| **III. Anti-Vibe-Coding Visual Discipline** | PASS | No blurry drop-shadows, glassmorphism, or unapproved gradients introduced. |
| **IV. Strict Type Safety & Validation Gates** | PASS | Frontend will be verified with `npx tsc --noEmit`, `npm run lint` (`--max-warnings 0`), and Vitest tests. Backend untouched. |
| **V. Git-First Database Migrations via Supabase MCP** | PASS (N/A) | No database schema or migration changes. |

*Post-Phase 1 Re-check*: All five principles remain satisfied with zero violations.

## Project Structure

### Documentation (this feature)

```text
specs/004-update-logo-favicon/
├── plan.md                                  # This file (/speckit-plan command output)
├── research.md                              # Phase 0 output
├── data-model.md                            # Phase 1 output
├── quickstart.md                            # Phase 1 output
├── contracts/
│   └── ui-and-metadata-contract.md          # Phase 1 output
└── tasks.md                                 # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
images/
└── others/
    └── logo.png                             # Source brand logo (500x500 PNG)

frontend/
├── public/
│   └── images/
│       └── others/
│           └── logo.png                     # Copied static asset served at /images/others/logo.png
├── src/
│   ├── app/
│   │   └── layout.tsx                       # Add metadata.icons pointing to /images/others/logo.png
│   └── components/
│       └── sections/
│           └── StickyHeader.tsx             # Replace AJ monogram with <Image src="/images/others/logo.png" ... />
└── tests/
    └── logo-and-favicon.test.tsx            # Verify StickyHeader logo & RootLayout favicon metadata
```

**Structure Decision**: Use the existing `frontend/` Next.js App Router structure, mirroring `images/others/logo.png` into `frontend/public/images/others/logo.png` consistent with all other portfolio images.

## Complexity Tracking

No Constitution Check violations; no complexity justification required.
