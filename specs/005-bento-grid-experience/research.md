# Phase 0 Research: Responsive CSS Bento Grid for Experience & Projects

**Feature**: `005-bento-grid-experience`  
**Date**: 2026-11-15  
**Spec**: [spec.md](spec.md)

## Research Tasks & Decisions

### 1. Desktop 12-Column Bento Grid Topology (`lg:grid-cols-12`)

- **Decision**: Use a 12-column CSS Grid on desktop (`grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-12`) with explicit schema-driven `colSpan` and `rowSpan` assignments across two balanced rows:
  1. **SuhayCore (`id: "suhaycore"`)**: `colSpan: "lg:col-span-12"`, `rowSpan: "lg:row-span-1"`, `isFeatured: true`, `cardLayout: "horizontal-split"`. Renders as the full-width flagship Bento card on Row 1 with an internal 12-column desktop split (`lg:grid lg:grid-cols-12` — left 6 columns for the `aspect-video` media preview and key metadata, right 6 columns for its 5 factual impact bullets, 7 tech tags, and 2 CTA buttons).
  2. **DAN — Enterprise RAG AI (`id: "dan"`)**: `colSpan: "lg:col-span-7"`, `rowSpan: "lg:row-span-1"`, `isFeatured: true`, `cardLayout: "vertical-stack"`. Renders as the wide asymmetric Bento card on Row 2 (left, 7 of 12 columns), providing ample inline space for its 4 impact bullets and 11 tech tags (`Python`, `FastAPI`, `PostgreSQL`, `Supabase`, `pg_cron`, `HTML/CSS/JS`, `Jinja2`, `Google Gemini`, `LangChain`, `Botpress`, `Render`).
  3. **FitQuest (`id: "fitquest"`)**: `colSpan: "lg:col-span-5"`, `rowSpan: "lg:row-span-1"`, `isFeatured: false`, `cardLayout: "vertical-stack"`. Renders as the compact Bento card on Row 2 (right, 5 of 12 columns), matching its concise 2 impact bullets and 5 tech tags.
- **Rationale**:
  - Previously, `ExperienceSection.tsx` used a 2-column grid (`lg:grid-cols-2`) with `isFullSpanOnDesktop = idx === 2`, which inverted visual priority by giving `FitQuest` (the shortest 2-bullet entry) a full-width card at the bottom while squeezing `SuhayCore` (5 bullets, primary `.NET 10` lead deliverable) and `DAN` (4 bullets, 11 tech tags) into equal half-width cards.
  - Giving `SuhayCore` the 12-column flagship row (`lg:col-span-12 lg:row-span-1`) and splitting Row 2 asymmetrically (`7 + 5 = 12` columns) aligns card width with content volume so `DAN` (7 columns, 4 bullets, 11 tags) and `FitQuest` (5 columns, 2 bullets, 5 tags) achieve near-identical natural heights without empty vertical whitespace.
  - Keeping source order (`SuhayCore` → `DAN` → `FitQuest`) without `grid-auto-flow: dense` or CSS `order` preserves logical keyboard tab order (`modern-web-guidance`: `css-layout` & `card`).
- **Alternatives Considered**:
  - *Left 7-column `lg:row-span-2` card (`SuhayCore`) + two stacked 5-column cards on the right (`DAN` + `FitQuest`)*: Rejected because stacking two cards that each contain an `aspect-video` media header, bullets, tags, and action buttons in a narrow 5-column track produces ~1,250px of vertical height on the right compared to ~750px on the left, stretching `SuhayCore` with ~500px of blank space.
  - *3 equal columns (`lg:grid-cols-3`)*: Rejected because squeezing 5 long resume bullets (`SuhayCore`) and 11 tech tags (`DAN`) into a 1/3-width column creates excessive vertical wrapping and fails to distinguish featured deliverables from smaller projects.

---

### 2. Media Containment & Fixed `aspect-video` Frame with `object-contain`

- **Decision**:
  - Apply `min-w-0 max-w-full overflow-hidden` to every Bento Grid card root (`<Card>`) and to every media wrapper `<div>`.
  - Render all project previews inside a fixed `aspect-video` (`16:9`) container (`relative aspect-video w-full min-w-0 max-w-full overflow-hidden bg-[#F8FAFC]`) with a subtle Neo-Brutalist dot/grid backdrop (`bg-[radial-gradient(#0F172A_1px,transparent_1px)] [background-size:16px_16px]` at subtle opacity or crisp `#E2E8F0` grid lines) and `<Image ... fill className="object-contain p-2 sm:p-3" />`.
- **Rationale**:
  - Inspecting the actual image assets in `frontend/public/images/projects/` revealed three radically different intrinsic dimensions:
    - `suhaycore.png`: `1915 × 911` (`2.10:1` ultra-wide desktop web app)
    - `dan.png`: `1306 × 918` (`1.42:1` standard desktop dashboard)
    - `fitquest.gif`: `400 × 667` (`0.60:1` portrait Android mobile screen recording)
  - Previously, `aspect-[16/10]` with `object-cover object-top` cropped 70%+ of the vertical height of `fitquest.gif` and clipped the horizontal edges of `suhaycore.png`.
  - Switching to `aspect-video` + `object-contain` + a subtle architectural dot-grid stage ensures 100% of every screenshot/GIF is visible without cropping, reserves exact layout space prior to image load (`CLS = 0`, per `modern-web-guidance`: `responsive-design`), and keeps the letterbox/pillarbox regions visually cohesive with the Neo-Brutalist Sky Blue theme.
- **Alternatives Considered**:
  - *`object-cover` with per-image aspect ratios*: Rejected because variable image aspect ratios break horizontal alignment across sibling Bento cells and stretch portrait mobile demos vertically.
  - *Plain white background behind `object-contain`*: Rejected because white-background screenshots (`suhaycore.png`) blend into a plain `#FFFFFF` wrapper when letterboxed; a `#F8FAFC` canvas with a subtle `#CBD5E1` / `#0F172A` architectural dot grid frames both landscape screenshots and portrait mobile GIFs cleanly.

---

### 3. Hard Offset Shadow & Border Clearance (`shadow-[4px_4px_0px_#0F172A]`)

- **Decision**:
  - Maintain the constitutional Neo-Brutalist tokens (`border-2 border-[#0F172A]` and `shadow-[4px_4px_0px_#0F172A]`) on all Bento cards (`<Card>`), while keeping `overflow-hidden` on the card surface (which clips internal media/borders at the card's `2px` border boundary without clipping the card's own external `box-shadow`).
  - Add explicit shadow-safe padding (`pb-2 pr-1`) on the Bento Grid wrapper inside `mx-auto max-w-6xl px-4 sm:px-6 lg:px-8` so the `4px` right and bottom offset shadows never touch viewport edges or trigger horizontal scroll (`overflow-x`).
- **Rationale**:
  - In CSS, `overflow: hidden` on an element clips its *descendants* to its padding box, NOT the element's own outer `box-shadow`. However, if an ancestor wrapper has `overflow-x: hidden` or tight padding, a `4px` right/bottom hard offset shadow can clip at the container edge.
  - Reserving `pb-2 pr-1` on the grid container inside `px-4 sm:px-6 lg:px-8` guarantees at least `16px+` horizontal clearance and `8px+` bottom clearance for `4px 4px 0px #0F172A` across all breakpoints (`320px` to `1440px+`).
- **Alternatives Considered**:
  - *Wrapping each `<Card>` in an outer `overflow-hidden` div*: Rejected because an outer `overflow-hidden` wrapper around `<Card>` WOULD clip `<Card>`'s `4px 4px 0px #0F172A` outer `box-shadow`. Putting `min-w-0 max-w-full overflow-hidden` directly on `<Card>` and its inner media/content wrappers satisfies the containment requirement while keeping the outer hard shadow 100% unclipped.
