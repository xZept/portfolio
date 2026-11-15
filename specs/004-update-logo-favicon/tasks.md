# Tasks: Update Sticky Top Bar Logo and Favicon

**Input**: Design documents from `/specs/004-update-logo-favicon/`
**Prerequisites**: `plan.md` (required), `spec.md` (required for user stories), `research.md`, `data-model.md`, `contracts/ui-and-metadata-contract.md`, `quickstart.md`

**Tests**: Targeted Vitest verification tasks are included to satisfy Constitution Principle IV and validate the UI & metadata contract.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `frontend/src/`, `frontend/public/`, `frontend/tests/`
- **Root Assets**: `images/others/logo.png`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure the approved brand logo asset is available as a Next.js static asset for both the sticky top bar and browser favicon.

- [X] T001 Copy source brand asset `images/others/logo.png` (500×500 PNG RGBA, 1:1 aspect ratio) byte-identically to `frontend/public/images/others/logo.png` so Next.js serves it at `/images/others/logo.png`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Blocking prerequisites before user story implementation.

**⚠️ CRITICAL**: No user story work can begin until `T001` in Phase 1 is complete. No additional foundational scaffolding is required for this feature.

**Checkpoint**: Static asset `/images/others/logo.png` is in place — User Story 1 and User Story 2 can now proceed in parallel.

---

## Phase 3: User Story 1 - Updated Brand Logo in Sticky Top Bar (Priority: P1) 🎯 MVP

**Goal**: Replace the `AJ` monogram badge in the sticky top bar with `images/others/logo.png` while preserving the Neo-Brutalist Sky Blue border/shadow, header height, alignment, and `#top` navigation behavior.

**Independent Test**: Render `StickyHeader` and verify `/images/others/logo.png` renders inside the `32px × 32px` (`h-8 w-8`) Neo-Brutalist container with `object-contain`, `AJ` is absent, and the `#top` brand link retains its accessible name `"Allen James Laxamana"`.

### Implementation for User Story 1

- [X] T002 [P] [US1] Import `Image` from `next/image` and replace the `AJ` text inside the `h-8 w-8 shrink-0` Neo-Brutalist badge (`border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] overflow-hidden`, `aria-hidden="true"`) with `<Image src="/images/others/logo.png" alt="" width={32} height={32} className="h-full w-full object-contain" priority />` in `frontend/src/components/sections/StickyHeader.tsx`
- [X] T003 [P] [US1] Add Vitest component test verifying `StickyHeader` renders `/images/others/logo.png` with `object-contain`, does not render `AJ`, and preserves the `#top` link accessible name in `frontend/tests/logo-and-favicon.test.tsx`

**Checkpoint**: User Story 1 is complete and independently testable (MVP).

---

## Phase 4: User Story 2 - Updated Browser Favicon (Priority: P2)

**Goal**: Configure the browser favicon and standard page icon metadata in `RootLayout` using `/images/others/logo.png`.

**Independent Test**: Inspect `metadata.icons` exported by `frontend/src/app/layout.tsx` to verify `icon`, `shortcut`, and `apple` all reference `/images/others/logo.png` while `title` and `description` remain unchanged.

### Implementation for User Story 2

- [X] T004 [P] [US2] Add `icons: { icon: "/images/others/logo.png", shortcut: "/images/others/logo.png", apple: "/images/others/logo.png" }` to `export const metadata: Metadata` while preserving `title` and `description` in `frontend/src/app/layout.tsx`
- [X] T005 [US2] Add Vitest metadata assertion verifying `metadata.icons` (`icon`, `shortcut`, `apple`) points to `/images/others/logo.png` and `title`/`description` remain unchanged in `frontend/tests/logo-and-favicon.test.tsx` (depends on T003, T004)

**Checkpoint**: User Stories 1 AND 2 both work independently.

---

## Phase 5: User Story 3 - Unchanged Page Content, Styling, and Behavior (Priority: P3)

**Goal**: Verify strict scope isolation (FR-006) — zero unintended changes to any other portfolio section, copy, visual token, or interactive feature.

**Independent Test**: Run all existing Vitest suites alongside the new test and inspect `git diff` to confirm only the sticky top bar logo slot, favicon metadata, static logo copy, and new test file were touched.

### Verification for User Story 3

- [X] T006 [US3] Run full Vitest suite (`npm test -- --run` in `frontend/`) to verify all existing tests (`sections-us1`, `sections-us3`, `skills-globe`, `visual-system`, `hero-download-resume`, `ask-resume-drawer`, `ask-resume-and-contact`) and `frontend/tests/logo-and-favicon.test.tsx` pass
- [X] T007 [US3] Verify via `git status` and `git diff` that no application files outside `frontend/public/images/others/logo.png`, `frontend/src/components/sections/StickyHeader.tsx`, `frontend/src/app/layout.tsx`, and `frontend/tests/logo-and-favicon.test.tsx` were modified

**Checkpoint**: All user stories verified with strict scope isolation.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final Constitution Principle IV quality gates and quickstart validation.

- [X] T008 [P] Run TypeScript type check (`npx tsc --noEmit` in `frontend/`) and verify zero errors
- [X] T009 [P] Run ESLint (`npm run lint` in `frontend/`) and verify zero errors and zero warnings
- [X] T010 Run production build (`npm run build` in `frontend/`) and complete validation checks per `specs/004-update-logo-favicon/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: `T001` starts immediately.
- **Foundational (Phase 2)**: Complete once `T001` finishes.
- **User Story 1 (Phase 3 - P1)** & **User Story 2 (Phase 4 - P2)**: Both depend on `T001` and can proceed in parallel (`T002`, `T003`, `T004` modify different files; `T005` appends to `frontend/tests/logo-and-favicon.test.tsx` after `T003` and `T004`).
- **User Story 3 (Phase 5 - P3)**: Depends on User Stories 1 and 2 (`T002`–`T005`).
- **Polish (Phase 6)**: Depends on all user stories (`T006`–`T007`).

### Parallel Opportunities

- After `T001`:
  - `T002` (`StickyHeader.tsx`), `T003` (`logo-and-favicon.test.tsx` US1 block), and `T004` (`layout.tsx`) can run in parallel.
- In Phase 6:
  - `T008` (`npx tsc --noEmit`) and `T009` (`npm run lint`) can run in parallel.

---

## Parallel Example: User Story 1 & User Story 2

```bash
# After T001 completes, run in parallel:
Task T002: "Replace AJ badge with next/image in frontend/src/components/sections/StickyHeader.tsx"
Task T003: "Add StickyHeader logo test in frontend/tests/logo-and-favicon.test.tsx"
Task T004: "Add metadata.icons in frontend/src/app/layout.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete `T001` (copy `images/others/logo.png` to `frontend/public/images/others/logo.png`).
2. Complete `T002` and `T003` (User Story 1).
3. Validate `StickyHeader` renders the new logo cleanly.

### Incremental Delivery

1. `T001` → Asset ready.
2. `T002`–`T003` → Sticky top bar logo updated and tested (MVP).
3. `T004`–`T005` → Browser favicon metadata updated and tested.
4. `T006`–`T010` → Scope isolation, full test suite, TypeScript, ESLint, and production build gates verified.
