# Tasks: Hero Download Resume Button

**Input**: Design documents from `/specs/003-hero-download-resume/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/ui-contract.md`, `quickstart.md`

**Organization**: Single-phase task list as requested, organized in dependency order with `[US1]`/`[US2]`/`[US3]` story traceability.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (`US1`, `US2`, `US3`) for story-scoped tasks

## Path Conventions

- **Frontend**: `frontend/src/`, `frontend/public/`, `frontend/tests/`

---

## Phase 1: Implementation & Verification (Single Phase)

- [X] T001 [P] Verify or place the static resume PDF asset at `frontend/public/resume/Laxamana_Resume_DotNet_FullStack.pdf` so Next.js serves it at `/resume/Laxamana_Resume_DotNet_FullStack.pdf` with clean filename `Laxamana_Resume_DotNet_FullStack.pdf`
- [X] T002 [US1] Add the `"Download Resume"` `<Button variant="secondary" size="lg">` next to `"Ask My Resume"` inside the `flex flex-wrap items-center gap-4 pt-2` Hero action group in `frontend/src/components/sections/HeroSection.tsx`, reusing existing Neo-Brutalist `Button` tokens (`border-2 border-[#0F172A]`, `shadow-[4px_4px_0px_#0F172A]`, `#0284C7` hover) and `lucide-react` `Download` icon (`aria-hidden="true"`)
- [X] T003 [US1] Implement the `fetch("/resume/Laxamana_Resume_DotNet_FullStack.pdf")` + `Blob` + `URL.createObjectURL` + programmatic `<a download="Laxamana_Resume_DotNet_FullStack.pdf">` download handler in `frontend/src/components/sections/HeroSection.tsx` (revoking the object URL in `finally` and guarding against `!response.ok` / network errors so unavailable files never trigger `"Downloaded"`)
- [X] T004 [US2] Add `ResumeDownloadState` (`"idle" | "downloading" | "downloaded" | "error"`) and `useRef` timeout management (`2500ms` reset, clearing any active timer on rapid clicks and on unmount) in `frontend/src/components/sections/HeroSection.tsx`, transitioning to `"Downloaded"` with `Check` icon and `#38BDF8` sky-blue surface on success and `"Resume Unavailable"` on failure
- [X] T005 [US3] Add a visually hidden `aria-live="polite"` status region in `frontend/src/components/sections/HeroSection.tsx` announcing `"Downloading resume"`, `"Resume downloaded"`, and `"Resume file is currently unavailable"`, and ensure keyboard focus visibility (`focus-visible:outline-2`) and `flex-wrap` mobile spacing
- [X] T006 [P] [US1] [US2] [US3] Add Vitest render/click tests in `frontend/tests/hero-download-resume.test.tsx` verifying: (a) `"Download Resume"` renders adjacent to `"Ask My Resume"` with Neo-Brutalist border/shadow classes, (b) clicking triggers `fetch("/resume/Laxamana_Resume_DotNet_FullStack.pdf")` and `<a download="Laxamana_Resume_DotNet_FullStack.pdf">`, transitions to `"Downloaded"`, and reverts to `"Download Resume"` after `2500ms`, and (c) a `404`/failed fetch does not show `"Downloaded"` and announces unavailability via `aria-live="polite"`
- [X] T007 Run `npm test -- --run`, `npx tsc --noEmit`, and `npm run lint` from `frontend/` and verify all Vitest suites (including `frontend/tests/hero-download-resume.test.tsx`, `frontend/tests/sections-us1.test.tsx`, and `frontend/tests/visual-system.test.tsx`), TypeScript type-checking, and ESLint (`--max-warnings 0`) pass with zero errors

---

## Dependencies & Execution Order

- **T001** (static PDF placement) can run in parallel with **T002–T005** (component implementation) and **T006** (Vitest unit tests with mocked `fetch`).
- **T002 → T003 → T004 → T005** modify `frontend/src/components/sections/HeroSection.tsx` sequentially.
- **T007** runs after **T001–T006** are complete.

## Implementation Strategy

- **MVP Scope**: T001–T007 form a single cohesive increment delivering US1 (direct download), US2 (`"Downloaded"` confirmation + reset), and US3 (responsive wrap + `aria-live` accessibility) together with automated Vitest, TypeScript, and ESLint verification.
