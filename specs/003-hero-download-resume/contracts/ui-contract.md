# UI & Asset Contract: Hero Download Resume Button

**Feature**: `003-hero-download-resume` | **Date**: 2026-11-15

## 1. Static Asset Endpoint

- **URL**: `GET /resume/Laxamana_Resume_DotNet_FullStack.pdf`
- **Host**: Next.js static file server (`frontend/public/resume/Laxamana_Resume_DotNet_FullStack.pdf`)
- **Success Response**: `200 OK`, `Content-Type: application/pdf`
- **Failure Handling**: Any non-2xx response or network error MUST NOT trigger the `"Downloaded"` confirmation state.

## 2. `HeroSection` Component Contract

- **File**: `frontend/src/components/sections/HeroSection.tsx`
- **Props**: Unchanged (`HeroSectionProps`: `onSelectExperience`, `onOpenAskResume`).
- **Action Group Order** (inside `#top` Hero CTA container):
  1. `"See my experience →"` (`<a>` link to `#experience`)
  2. `"Ask My Resume"` (`<Button variant="secondary" size="lg">`)
  3. `"Download Resume"` (`<Button variant="secondary" size="lg">` using existing `Button` tokens)

## 3. Button States & Accessibility Contract

| State | Visible Label | Icon (`aria-hidden`) | Visual Tokens | Live Announcement (`aria-live="polite"`) |
| :--- | :--- | :--- | :--- | :--- |
| `idle` | `Download Resume` | `Download` | `Button` `variant="secondary"` (`#FFFFFF` bg, `2px solid #0F172A`, `4px 4px 0px #0F172A`) | `""` |
| `downloading` | `Downloading...` | `Download` | `Button` `variant="secondary"`, `disabled` | `"Downloading resume"` |
| `downloaded` | `Downloaded` | `Check` | Neo-Brutalist Sky Blue (`#38BDF8` bg, `#0F172A` text, `2px solid #0F172A`, `4px 4px 0px #0F172A`) | `"Resume downloaded"` |
| `error` | `Resume Unavailable` | `AlertCircle` or `Download` | `Button` `variant="secondary"` | `"Resume file is currently unavailable"` |

- **Keyboard**: Focusable via `Tab`, activatable via `Enter` or `Space`, with visible `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F172A]`.
- **Responsive**: Container uses `flex flex-wrap items-center gap-4 pt-2` so buttons wrap cleanly on `320px–480px` viewports with zero horizontal overflow.
