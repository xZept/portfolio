# Phase 1 Data Model: Responsive CSS Bento Grid for Experience & Projects

**Feature**: `005-bento-grid-experience`  
**Date**: 2026-11-15  
**Target File**: `frontend/src/data/resume.ts`

## Entities & TypeScript Interfaces

### 1. `ExperienceBentoLayout` (New Interface in `frontend/src/data/resume.ts`)

Defines the explicit CSS Grid placement and internal card topology for each entry in the 12-column Bento Grid (`lg:grid-cols-12`).

```ts
export type BentoColSpan =
  | "lg:col-span-12"
  | "lg:col-span-8"
  | "lg:col-span-7"
  | "lg:col-span-6"
  | "lg:col-span-5"
  | "lg:col-span-4";

export type BentoRowSpan = "lg:row-span-1" | "lg:row-span-2";

export type BentoCardLayout = "horizontal-split" | "vertical-stack";

export interface ExperienceBentoLayout {
  /** Explicit desktop column span class in the 12-column Bento Grid */
  colSpan: BentoColSpan;
  /** Explicit desktop row span class in the 12-column Bento Grid */
  rowSpan: BentoRowSpan;
  /** Whether the entry is highlighted as a featured flagship deliverable */
  isFeatured: boolean;
  /** Internal card geometry on desktop viewports */
  cardLayout: BentoCardLayout;
  /** Responsive Next/Image sizes hint matching the Bento cell width */
  imageSizes: string;
}
```

### 2. `ExperienceEntry` (Updated Interface in `frontend/src/data/resume.ts`)

Extends the existing `ExperienceEntry` schema with the required `bento` configuration object while keeping all existing fields intact for full backward compatibility with `CaseStudyModal`, `AskResumeDrawer`, and `SkillsSection`.

```ts
export interface ExperienceEntry {
  id: ExperienceId;
  title: string;
  role: string;
  organization: string;
  dateRange: string;
  location: string;
  statusBadge: "In UAT" | "Shipped" | "Android";
  previewImage: string;
  isAnimatedGif: boolean;
  impactBullets: string[];
  techTags: string[];
  caseStudy: CaseStudyDetail;
  askAiPrompt: string;
  bento: ExperienceBentoLayout;
}
```

## Concrete Record Mapping (`EXPERIENCE_ENTRIES`)

| `id` | `title` | `bento.colSpan` | `bento.rowSpan` | `bento.isFeatured` | `bento.cardLayout` | `bento.imageSizes` |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `suhaycore` | `SuhayCore` | `"lg:col-span-12"` | `"lg:row-span-1"` | `true` | `"horizontal-split"` | `"(max-width: 1024px) 100vw, 560px"` |
| `dan` | `DAN (Enterprise RAG AI)` | `"lg:col-span-7"` | `"lg:row-span-1"` | `true` | `"vertical-stack"` | `"(max-width: 1024px) 100vw, 640px"` |
| `fitquest` | `FitQuest` | `"lg:col-span-5"` | `"lg:row-span-1"` | `false` | `"vertical-stack"` | `"(max-width: 1024px) 100vw, 460px"` |

## Validation Rules & Invariants

1. **12-Column Row Completeness**: Desktop column spans across rows sum cleanly to 12 columns (`Row 1 = 12`, `Row 2 = 7 + 5 = 12`), eliminating ragged trailing grid tracks.
2. **Literal Tailwind Class Tokens**: `colSpan` and `rowSpan` store complete, static Tailwind CSS utility strings (never dynamically interpolated substrings like `` `lg:col-span-${n}` ``) so Tailwind v4 static source scanning always generates the corresponding CSS rules.
3. **Zero Factual Mutation**: All factual strings (`title`, `role`, `organization`, `dateRange`, `location`, `statusBadge`, `previewImage`, `impactBullets`, `techTags`, `caseStudy`, `askAiPrompt`) remain 100% unchanged and grounded in `docs/resume.md`.
