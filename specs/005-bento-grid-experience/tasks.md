# Tasks: Responsive CSS Bento Grid for Experience & Projects

**Input**: Design documents from `/specs/005-bento-grid-experience/`  
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [bento-grid-ui-contract.md](contracts/bento-grid-ui-contract.md), [quickstart.md](quickstart.md)

**Tests**: Targeted Vitest component tests are included for each user story to verify grid spans, media containment (`aspect-video` + `object-contain`), shadow safety, and Neo-Brutalist compliance.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story while maintaining strict scope isolation (`frontend/src/data/resume.ts`, `frontend/src/components/sections/ExperienceSection.tsx`, and `frontend/tests/`).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., `US1`, `US2`, `US3`)
- Exact file paths are included in every task description.

---

## Phase 1: Setup (Baseline & Asset Verification)

**Purpose**: Confirm the existing frontend test suite, TypeScript compiler, and project visual assets are healthy before refactoring.

- [X] T001 Verify baseline frontend checks (`npx tsc --noEmit`, `npm test -- --run`) pass in `frontend/`
- [X] T002 [P] Verify project preview assets exist at `frontend/public/images/projects/suhaycore.png`, `frontend/public/images/projects/dan.png`, and `frontend/public/images/projects/fitquest.gif`

---

## Phase 2: Foundational (Data Schema & Bento Layout Metadata)

**Purpose**: Extend the `ExperienceEntry` TypeScript schema with explicit, statically scannable Bento Grid layout metadata.

**⚠️ CRITICAL**: User Story 1 and User Story 2 depend on `ExperienceBentoLayout` in `frontend/src/data/resume.ts`.

- [X] T003 Define `BentoColSpan`, `BentoRowSpan`, `BentoCardLayout`, and `ExperienceBentoLayout` interfaces and add `bento: ExperienceBentoLayout` to `ExperienceEntry` in `frontend/src/data/resume.ts`
- [X] T004 Populate `bento` metadata on `EXPERIENCE_ENTRIES` in `frontend/src/data/resume.ts`: `suhaycore` (`colSpan: "lg:col-span-12"`, `rowSpan: "lg:row-span-1"`, `isFeatured: true`, `cardLayout: "horizontal-split"`, `imageSizes: "(max-width: 1024px) 100vw, 560px"`), `dan` (`colSpan: "lg:col-span-7"`, `rowSpan: "lg:row-span-1"`, `isFeatured: true`, `cardLayout: "vertical-stack"`, `imageSizes: "(max-width: 1024px) 100vw, 640px"`), and `fitquest` (`colSpan: "lg:col-span-5"`, `rowSpan: "lg:row-span-1"`, `isFeatured: false`, `cardLayout: "vertical-stack"`, `imageSizes: "(max-width: 1024px) 100vw, 460px"`) without altering factual resume copy

**Checkpoint**: `frontend/src/data/resume.ts` compiles cleanly with complete Bento Grid metadata for all three entries.

---

## Phase 3: User Story 1 - Responsive 12-Column Bento Grid Hierarchy (Priority: P1) 🎯 MVP

**Goal**: Refactor `ExperienceSection` into a responsive `grid-cols-1 lg:grid-cols-12` Bento Grid with explicit `col-span` and `row-span` placement for featured deliverables (`SuhayCore`, `DAN`) vs. compact project entries (`FitQuest`).

**Independent Test**: Render `ExperienceSection` and verify `data-testid="experience-bento-grid"` uses `grid-cols-1` and `lg:grid-cols-12`, `#card-work-suhay` uses `lg:col-span-12 lg:row-span-1`, `#card-work-dacon` uses `lg:col-span-7 lg:row-span-1`, `#card-project-fitquest` uses `lg:col-span-5 lg:row-span-1`, and `View Case Study` / `Ask AI about this` callbacks continue to fire.

### Tests for User Story 1

- [X] T005 [P] [US1] Create `frontend/tests/bento-grid-experience.test.tsx` with tests asserting `grid-cols-1 lg:grid-cols-12` on `data-testid="experience-bento-grid"`, explicit `colSpan`/`rowSpan` classes on `#card-work-suhay`, `#card-work-dacon`, and `#card-project-fitquest`, and preserved `onOpenCaseStudy` / `onAskAiAboutProject` interactions

### Implementation for User Story 1

- [X] T006 [US1] Refactor the outer grid container in `frontend/src/components/sections/ExperienceSection.tsx` from `lg:grid-cols-2` to `grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-12` with `data-testid="experience-bento-grid"`, preserving DOM source order (`SuhayCore` → `DAN` → `FitQuest`)
- [X] T007 [US1] Update `<Card>` layout classes in `frontend/src/components/sections/ExperienceSection.tsx` to apply `entry.bento.colSpan`, `entry.bento.rowSpan`, and conditional `lg:grid lg:grid-cols-12` (`lg:col-span-6` media column and `lg:col-span-6` content column when `entry.bento.cardLayout === "horizontal-split"`), preserving `#card-work-suhay`, `#card-work-dacon`, `#card-project-fitquest`, and `data-[highlighted=true]` ring styling

**Checkpoint**: User Story 1 is functional and independently testable; desktop 12-column Bento hierarchy and mobile 1-column collapse work as specified.

---

## Phase 4: User Story 2 - Uncropped Media Containment Inside Fixed `aspect-video` Stage (Priority: P2)

**Goal**: Prevent grid blowout and image cropping by enforcing `min-w-0 max-w-full overflow-hidden` on all Bento cells and media wrappers, and rendering every preview inside a fixed `aspect-video` container with `object-contain` over a subtle neutral dot-grid backdrop.

**Independent Test**: Inspect every Bento card root, `data-testid="bento-media-stage-${entry.id}"` wrapper, and `<Image>` element in `ExperienceSection` to verify `min-w-0`, `max-w-full`, `overflow-hidden`, `aspect-video`, and `object-contain` are applied with zero `object-cover` or `aspect-[16/10]`.

### Tests for User Story 2

- [X] T008 [P] [US2] Add media containment tests in `frontend/tests/bento-grid-experience.test.tsx` verifying `min-w-0`, `max-w-full`, and `overflow-hidden` on all Bento cells and `data-testid="bento-media-stage-*"` wrappers, `aspect-video` stage sizing, and `object-contain` (with no `object-cover`) on `suhaycore.png`, `dan.png`, and `fitquest.gif`

### Implementation for User Story 2

- [X] T009 [US2] Enforce `min-w-0 max-w-full overflow-hidden` on every `<Card>` root and its internal media/content column wrappers in `frontend/src/components/sections/ExperienceSection.tsx`
- [X] T010 [US2] Replace `aspect-[16/10]` and `object-cover object-top` in `frontend/src/components/sections/ExperienceSection.tsx` with `data-testid={`bento-media-stage-${entry.id}`}` (`relative aspect-video w-full min-w-0 max-w-full overflow-hidden bg-[#F8FAFC] bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:16px_16px]`) and `<Image className="object-contain p-2 sm:p-3" sizes={entry.bento.imageSizes} ... />`

**Checkpoint**: User Story 2 is complete; wide web screenshots and portrait mobile GIFs render uncropped inside uniform `aspect-video` frames.

---

## Phase 5: User Story 3 - Hard Offset Shadow Safety & Strict Scope Isolation (Priority: P3)

**Goal**: Ensure `2px solid #0F172A` borders and `4px 4px 0px #0F172A` hard offset shadows never clip or trigger horizontal overflow, and confirm strict scope isolation.

**Independent Test**: Verify `pb-2 pr-1` shadow-clearance classes on `data-testid="experience-bento-grid"`, verify `visual-system.test.tsx` passes with zero prohibited styles, and confirm `git status` shows only permitted files changed.

### Tests for User Story 3

- [X] T011 [P] [US3] Add shadow-safety and Neo-Brutalist token assertions in `frontend/tests/bento-grid-experience.test.tsx` verifying `pb-2` / `pr-1` clearance on `experience-bento-grid`, `border-2 border-[#0F172A]`, and `shadow-[4px_4px_0px_#0F172A]` on all Bento cards

### Implementation for User Story 3

- [X] T012 [US3] Add `pb-2 pr-1` shadow-clearance padding to `data-testid="experience-bento-grid"` in `frontend/src/components/sections/ExperienceSection.tsx` and verify all Neo-Brutalist border, shadow, and sky-blue accent tokens are intact

**Checkpoint**: All three user stories pass independently with zero shadow clipping and full Neo-Brutalist compliance.

---

## Phase 6: Polish & Verification Gates

**Purpose**: Run full static analysis, test suite, production build, and scope-isolation verification per [quickstart.md](quickstart.md).

- [X] T013 Run `npx tsc --noEmit` and `npm run lint` in `frontend/` and ensure zero errors and zero warnings
- [X] T014 Run `npm test -- --run` and `npm run build` in `frontend/` and confirm all existing and new tests pass
- [X] T015 Run `git status --short` from the repository root to verify strict scope isolation (only `frontend/src/data/resume.ts`, `frontend/src/components/sections/ExperienceSection.tsx`, `frontend/tests/bento-grid-experience.test.tsx`, and `specs/005-bento-grid-experience/` modified)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS** all user story implementation tasks.
- **User Story 1 (Phase 3 - P1)**: Depends on Phase 2 (`ExperienceBentoLayout` in `resume.ts`).
- **User Story 2 (Phase 4 - P2)**: Depends on Phase 2 and builds on `ExperienceSection.tsx` from US1 (test task `T008` can run in parallel).
- **User Story 3 (Phase 5 - P3)**: Depends on US1/US2 structure in `ExperienceSection.tsx` (test task `T011` can run in parallel).
- **Polish (Phase 6)**: Depends on Phases 3, 4, and 5 completion.

### Parallel Opportunities

- `T001` and `T002` in Phase 1 can run in parallel.
- `T005`, `T008`, and `T011` (test authoring in `frontend/tests/bento-grid-experience.test.tsx`) can be authored alongside or ahead of `ExperienceSection.tsx` edits.

---

## Parallel Example: User Story 1 & 2

```bash
# Foundational schema update first:
Task: "T003 Define ExperienceBentoLayout in frontend/src/data/resume.ts"
Task: "T004 Populate bento metadata on EXPERIENCE_ENTRIES in frontend/src/data/resume.ts"

# Then run test creation in parallel with component refactoring:
Task: "T005 [P] [US1] Create Bento Grid layout tests in frontend/tests/bento-grid-experience.test.tsx"
Task: "T006 [US1] Refactor grid container to lg:grid-cols-12 in frontend/src/components/sections/ExperienceSection.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational schema in `frontend/src/data/resume.ts`).
2. Complete Phase 3 (User Story 1 — 12-column Bento Grid hierarchy in `ExperienceSection.tsx`).
3. **STOP and VALIDATE**: Run `npm test -- --run` to confirm US1 passes independently.

### Incremental Delivery

1. Add Phase 4 (User Story 2 — `aspect-video` + `object-contain` + `min-w-0 max-w-full overflow-hidden` media containment).
2. Add Phase 5 (User Story 3 — `pb-2 pr-1` shadow clearance & Neo-Brutalist token verification).
3. Finish with Phase 6 verification gates (`tsc --noEmit`, `npm run lint`, `npm test -- --run`, `npm run build`, and `git status` scope check).
