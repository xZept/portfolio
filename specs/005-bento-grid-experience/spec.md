# Feature Specification: Responsive CSS Bento Grid for Experience & Projects

**Feature Branch**: `005-bento-grid-experience`  
**Created**: 2026-11-15  
**Status**: Draft  
**Input**: User description: "Refactor the '01 / Experience & Projects' section into a responsive CSS Bento Grid while preserving all existing Neo-Brutalist design tokens (2px solid black borders, hard offset shadows, sky-blue accent palette, typography, and sibling sections). Technical & Layout Constraints: Grid Architecture: Use a 12-column (or 3-column) CSS Grid on desktop (`lg:grid-cols-12`) collapsing to a single column (`grid-cols-1`) on mobile, with explicit `col-span` and `row-span` assignments for featured projects (e.g., SuhayCore, DACON Hybrid RAG Chatbot) vs. experience entries. Media Containment & Bounds: Enforce `min-w-0`, `max-w-full`, and `overflow-hidden` on all grid cells and media wrappers. Render project screenshots/demos inside fixed-aspect-ratio containers (e.g., `aspect-video`) using `object-contain` (with a subtle neutral/grid backdrop) so the entire media frame is visible without cropping or stretching card heights. Shadow & Border Safety: Account for hard offset shadows (e.g., `shadow-[4px_4px_0px_#000]`) within section padding so borders and shadows never clip or trigger horizontal page scroll (`overflow-x`). Scope Isolation: Restrict file modifications strictly to the '01 / Experience & Projects' component(s) and data schema; do not alter global layout wrappers, navigation, color variables, or other portfolio sections."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Responsive 12-Column Bento Grid Hierarchy for Experience & Projects (Priority: P1)

A technical recruiter or hiring manager scrolling to Section `01 / Experience & Projects` on desktop (`>= 1024px`) sees an intentional 12-column Neo-Brutalist Bento Grid (`lg:grid-cols-12`) that visually prioritizes Allen's flagship deliverables (**SuhayCore** and **DAN — Enterprise RAG AI**) relative to his compact project entry (**FitQuest**) using explicit `col-span` and `row-span` assignments. On mobile and tablet viewports (`< 1024px`), the Bento Grid collapses cleanly into a single-column vertical stack (`grid-cols-1`).

**Why this priority**: Replacing the previous uniform 2-column grid (where the smallest 2-bullet project spanned full-width at the bottom while the two flagship internships were cramped into half-width columns) establishes a clear visual hierarchy that matches the engineering complexity and content density of each entry.

**Independent Test**: Can be tested independently by rendering `ExperienceSection` across desktop and mobile viewports and verifying the `grid-cols-1 lg:grid-cols-12` container classes, explicit `lg:col-span-*` and `lg:row-span-*` classes on each Bento card (`#card-work-suhay`, `#card-work-dacon`, `#card-project-fitquest`), and preservation of all factual copy, tags, and action buttons.

**Acceptance Scenarios**:

1. **Given** a visitor views `01 / Experience & Projects` on a desktop viewport (`>= 1024px`), **When** the Bento Grid renders, **Then** the grid container uses a 12-column layout (`lg:grid-cols-12`) and assigns explicit column and row spans from the data schema:
   - **SuhayCore (`#card-work-suhay`)**: Featured flagship Bento cell (`lg:col-span-12 lg:row-span-1`) with an internal desktop 12-column split placing the preview stage and 5 impact bullets side-by-side.
   - **DAN — Enterprise RAG AI (`#card-work-dacon`)**: Featured Asymmetric Bento cell (`lg:col-span-7 lg:row-span-1`) accommodating its 4 impact bullets and 11 tech tags.
   - **FitQuest (`#card-project-fitquest`)**: Compact Project Bento cell (`lg:col-span-5 lg:row-span-1`) paired beside DAN to complete the 12-column row.
2. **Given** a visitor views `01 / Experience & Projects` on a mobile or tablet viewport (`< 1024px`), **When** the Bento Grid renders, **Then** all cells collapse into a single column (`grid-cols-1`) in chronological/priority source order without horizontal overflow.

---

### User Story 2 - Uncropped Media Containment Inside Fixed `aspect-video` Stage (Priority: P2)

A visitor inspecting the visual previews for **SuhayCore** (`1915×911` wide web UI), **DAN** (`1306×918` dashboard UI), and **FitQuest** (`400×667` portrait Android screen recording GIF) sees the entire screenshot or demo frame inside a fixed `aspect-video` (`16:9`) container using `object-contain` over a subtle neutral Neo-Brutalist grid backdrop, with zero cropping and zero distortion of card heights.

**Why this priority**: Previously, `object-cover` inside `aspect-[16/10]` severely cropped the portrait FitQuest mobile GIF and clipped the edges of the wide SuhayCore screenshot. Using `aspect-video` + `object-contain` + `min-w-0 max-w-full overflow-hidden` guarantees complete visual fidelity across mixed aspect ratios.

**Independent Test**: Can be tested by inspecting each card's media wrapper and `<Image>` element in DOM tests and browser rendering to verify `aspect-video`, `min-w-0`, `max-w-full`, `overflow-hidden`, and `object-contain` classes.

**Acceptance Scenarios**:

1. **Given** any Bento Grid cell and its media wrapper in `01 / Experience & Projects`, **When** inspected in the DOM, **Then** both the grid cell and media container enforce `min-w-0`, `max-w-full`, and `overflow-hidden`, and the preview frame uses `aspect-video` with `object-contain` over a subtle neutral/grid backdrop.
2. **Given** the portrait `fitquest.gif` (`400×667`) and wide `suhaycore.png` (`1915×911`), **When** rendered inside their `aspect-video` containers, **Then** 100% of each image is visible without cropping or stretching the card's vertical layout.

---

### User Story 3 - Hard Offset Shadow Safety & Strict Scope Isolation (Priority: P3)

A visitor or automated test suite verifies that all Neo-Brutalist visual tokens (`2px solid #0F172A` borders, `4px 4px 0px #0F172A` hard offset shadows, `#38BDF8` / `#0284C7` sky-blue accents) are preserved without shadow clipping or horizontal scrollbars, and that no files outside `ExperienceSection.tsx`, `resume.ts`, and tests were modified.

**Why this priority**: Enforces the constitutional Neo-Brutalist Sky Blue design system and honors the user's strict scope isolation constraint.

**Independent Test**: Run `git status` / `git diff` to verify modified file scope, and run Vitest + `tsc --noEmit` + `npm run lint` to verify visual tokens, card IDs, and interactive callbacks ("View Case Study" and "Ask AI about this").

**Acceptance Scenarios**:

1. **Given** the Bento Grid cards render with `shadow-[4px_4px_0px_#0F172A]` and `border-2 border-[#0F172A]`, **When** viewed inside `ExperienceSection`, **Then** section and grid padding reserve clearance for the `4px` bottom/right hard offset shadows so shadows are never clipped and never trigger horizontal page scroll (`overflow-x`).
2. **Given** the completed refactoring, **When** inspecting repository changes, **Then** modifications are restricted strictly to `frontend/src/components/sections/ExperienceSection.tsx`, `frontend/src/data/resume.ts`, and test files—leaving global layout wrappers, navigation, `globals.css`, and all sibling sections untouched.

---

### Edge Cases

- **Mixed Media Aspect Ratios (`2.10:1` wide web screenshot vs `0.60:1` portrait mobile GIF)**: Handled by a fixed `aspect-video` (`16:9`) wrapper with `object-contain` and a subtle neutral radial/grid dot backdrop so letterboxing looks intentional and Neo-Brutalist rather than empty whitespace.
- **Long Unbreakable Tech Tags or Bullet Strings in Narrow Grid Cells**: Enforcing `min-w-0 max-w-full overflow-hidden` on every Bento Grid cell prevents CSS Grid tracks from expanding beyond their `fr` allocation.
- **3D Skill Globe Cross-Highlighting (`#card-work-suhay`, `#card-work-dacon`, `#card-project-fitquest`)**: Preserving the exact card DOM IDs and `data-[highlighted=true]` styling ensures clicking a skill node in Section 4 continues to highlight the corresponding Bento card in Section 2.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (12-Column Responsive Bento Grid)**: `ExperienceSection` MUST use a 12-column CSS Grid on desktop (`grid grid-cols-1 lg:grid-cols-12`) that collapses to a single column (`grid-cols-1`) on mobile/tablet viewports.
- **FR-002 (Explicit Schema-Driven Span Assignments)**: `ExperienceEntry` in `frontend/src/data/resume.ts` MUST define explicit Bento Grid layout metadata (`colSpan`, `rowSpan`, `isFeatured`, and layout variant) distinguishing featured deliverables (`SuhayCore` at `lg:col-span-12 lg:row-span-1`, `DAN` at `lg:col-span-7 lg:row-span-1`) from compact project entries (`FitQuest` at `lg:col-span-5 lg:row-span-1`).
- **FR-003 (Media Containment & Fixed `aspect-video` Stage)**: Every Bento Grid cell and media wrapper MUST enforce `min-w-0`, `max-w-full`, and `overflow-hidden`. Every project screenshot or animated GIF MUST render inside a fixed `aspect-video` container using `object-contain` over a subtle neutral/grid backdrop so the full frame is visible without cropping or stretching card heights.
- **FR-004 (Neo-Brutalist Token & Shadow Safety)**: All Bento cards, badges, tech tags, and buttons MUST preserve `2px solid #0F172A` borders, `4px 4px 0px #0F172A` hard offset shadows, `#38BDF8` (`sky-400`) primary accents, and `#0284C7` (`sky-600`) hover states, with section/grid padding accounting for the `4px` offset shadow so borders and shadows never clip or cause horizontal scroll (`overflow-x`).
- **FR-005 (Interactive & Anchor Compatibility)**: All existing card DOM IDs (`card-work-suhay`, `card-work-dacon`, `card-project-fitquest`), factual resume fields, and action button callbacks (`View Case Study` and `Ask AI about this`) MUST remain 100% functional.
- **FR-006 (Strict Scope Isolation)**: Code changes MUST be restricted strictly to `frontend/src/components/sections/ExperienceSection.tsx` and `frontend/src/data/resume.ts` (plus unit tests); global layout wrappers, navigation, `globals.css`, and sibling portfolio sections MUST NOT be modified.

### Key Entities

- **ExperienceBentoLayout**: Schema sub-object on `ExperienceEntry` specifying `colSpan` (`"lg:col-span-12" | "lg:col-span-7" | "lg:col-span-5"`), `rowSpan` (`"lg:row-span-1" | "lg:row-span-2"`), `isFeatured` (`boolean`), and `cardLayout` (`"horizontal-split" | "vertical-stack"`).
- **ExperienceEntry**: Existing experience/project record in `frontend/src/data/resume.ts` extended with `bento: ExperienceBentoLayout`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of `ExperienceEntry` items render in a `grid-cols-1 lg:grid-cols-12` Bento Grid with explicit `lg:col-span-*` and `lg:row-span-*` classes and `min-w-0 max-w-full overflow-hidden` containment.
- **SC-002**: 100% of project previews (`suhaycore.png`, `dan.png`, `fitquest.gif`) render inside `aspect-video` containers using `object-contain` with zero image cropping.
- **SC-003**: Zero horizontal overflow or hard-shadow clipping across mobile (`375px`), tablet (`768px`), and desktop (`1024px–1440px+`) viewports.
- **SC-004**: `npx tsc --noEmit`, `npm run lint`, `npm test -- --run`, and `npm run build` pass with zero errors and zero warnings, and zero files outside the permitted scope are modified.
