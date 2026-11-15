# Research: Update Sticky Top Bar Logo and Favicon

**Feature Branch**: `004-update-logo-favicon`  
**Date**: 2026-11-15  
**Spec**: [spec.md](spec.md)

## Research Tasks & Findings

### 1. Asset Location & Next.js Static Serving

- **Finding**: The source asset `images/others/logo.png` exists at the repository root as a `500x500` RGBA PNG image. The Next.js application resides in `frontend/` and serves public static files from `frontend/public/`. Existing portfolio images follow a mirrored structure (`frontend/public/images/others/my-photo.png`, `frontend/public/images/others/bataan-peninsula-state-university.png`, etc.).
- **Decision**: Copy `images/others/logo.png` to `frontend/public/images/others/logo.png` so Next.js serves it at `/images/others/logo.png`.
- **Rationale**: Matches the existing asset convention in `frontend/public/images/` and allows both `next/image` and `<link rel="icon">` metadata to reference `/images/others/logo.png` without custom webpack/Next config changes.
- **Alternatives considered**:
  - Importing from `../../images/others/logo.png` outside `frontend/`: Rejected because Next.js `public/` is the standard static serving root for both `next/image` string paths and favicon URLs, and keeps `frontend/` self-contained for Vercel deployment.

### 2. Sticky Top Bar Logo Replacement (`StickyHeader.tsx`)

- **Finding**: In `frontend/src/components/sections/StickyHeader.tsx` (lines 33–44), the brand link `<a href="#top">` contains a `32px × 32px` (`h-8 w-8 shrink-0`) Neo-Brutalist badge `<span>` with `border-2 border-[#0F172A] bg-[#38BDF8] shadow-[4px_4px_0px_#0F172A]` displaying the text `AJ`, followed by `<span className="truncate text-sm sm:text-lg">{PROFILE_SUMMARY.fullName}</span>`.
- **Decision**: Replace the `AJ` text inside the `h-8 w-8 shrink-0` badge container with `next/image` (`<Image src="/images/others/logo.png" alt="" width={32} height={32} className="h-full w-full object-contain" priority />`), keeping the `h-8 w-8 shrink-0`, `border-2 border-[#0F172A]`, `shadow-[4px_4px_0px_#0F172A]`, and `overflow-hidden` classes on the container.
- **Rationale**:
  - Preserves exact header height, alignment, and mobile responsiveness (`320px–480px` through `1440px+`).
  - `500x500` square PNG scales cleanly to `32x32` CSS pixels with `object-contain` and zero aspect-ratio distortion, while `next/image` provides crisp high-DPI rendering.
  - Preserves the Neo-Brutalist Sky Blue border and hard zero-blur offset shadow (`Constitution Principle II & III`).
  - Keeping `aria-hidden="true"` on the badge container and `alt=""` on `Image` preserves the existing accessible link name (`"Allen James Laxamana"`) without redundant screen-reader announcements.
- **Alternatives considered**:
  - Rendering a raw `<img>` tag: Rejected because the rest of the portfolio (`HeroSection.tsx`, `EducationSection.tsx`, `ExperienceSection.tsx`, `CertificationsSection.tsx`) consistently uses `next/image`.
  - Removing the Neo-Brutalist border/shadow around the logo: Rejected to maintain visual consistency with Constitution Principle II (`2px solid #0F172A` border + `4px 4px 0px #0F172A` hard shadow on badges).

### 3. Browser Favicon Configuration (`layout.tsx`)

- **Finding**: `frontend/src/app/layout.tsx` exports `metadata: Metadata` with `title` and `description`, and currently has no `icons` field and no `app/icon.*` or `public/favicon.ico` file.
- **Decision**: Add `icons` to `export const metadata: Metadata` in `frontend/src/app/layout.tsx`:
  ```ts
  icons: {
    icon: "/images/others/logo.png",
    shortcut: "/images/others/logo.png",
    apple: "/images/others/logo.png",
  },
  ```
- **Rationale**: Next.js 16 App Router's Metadata API automatically injects standard `<link rel="icon">`, `<link rel="shortcut icon">`, and `<link rel="apple-touch-icon">` tags into `<head>` referencing `/images/others/logo.png`. It requires zero extra build tooling, avoids duplicating the image binary in `src/app/`, and is directly verifiable in Vitest unit tests by inspecting `metadata.icons`.
- **Alternatives considered**:
  - Adding `frontend/src/app/icon.png` file convention: Works in Next.js, but duplicates the asset outside `public/images/others/` and is harder to assert in Vitest without a full Next build. Using `metadata.icons` pointing to `/images/others/logo.png` is explicit and single-source.

### 4. Scope Isolation & Regression Verification

- **Finding**: Searching `frontend/src/` and `frontend/tests/` for `AJ` confirmed `StickyHeader.tsx` line 41 is the only occurrence. Existing Vitest suites (`frontend/tests/*.test.tsx`) test sections, visual system tokens, hero download resume, and ask-resume drawer.
- **Decision**: Limit edits strictly to:
  1. `frontend/public/images/others/logo.png` (new static asset copied from `images/others/logo.png`)
  2. `frontend/src/components/sections/StickyHeader.tsx` (replace `AJ` badge content with `<Image>`)
  3. `frontend/src/app/layout.tsx` (add `metadata.icons`)
  4. `frontend/tests/logo-and-favicon.test.tsx` (new targeted test verifying logo rendering and favicon metadata)
- **Rationale**: Guarantees 100% compliance with FR-006 ("No other visual elements, copy, sections, navigation items, buttons, assets, or interactive behaviors anywhere in the portfolio MAY be modified as part of this change").
