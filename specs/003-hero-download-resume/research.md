# Research: Hero Download Resume Button

**Feature**: `003-hero-download-resume` | **Date**: 2026-11-15

## 1. Static PDF Serving Path

- **Decision**: Place and serve `Laxamana_Resume_DotNet_FullStack.pdf` from `frontend/public/resume/Laxamana_Resume_DotNet_FullStack.pdf`, accessible at the Next.js static URL `/resume/Laxamana_Resume_DotNet_FullStack.pdf`.
- **Rationale**: Next.js serves files under `frontend/public/` directly at the root URL path with zero filename hashing, no query parameters, and no backend round-trip. Grouping the PDF under `public/resume/` keeps document assets organized separately from `public/images/`.
- **Alternatives Considered**:
  - *FastAPI backend download endpoint*: Introduces unnecessary Render cold-start latency and network failure modes for a static file.
  - *`frontend/public/` root*: Works, but `frontend/public/resume/` was explicitly requested and keeps `public/` clean.
- **Asset Prerequisite**: The repository currently does not contain `frontend/public/resume/Laxamana_Resume_DotNet_FullStack.pdf`; the PDF must be placed at that path before live browser verification.

## 2. Download Mechanism & Unavailable-File Guard (FR-003, FR-007)

- **Decision**: Handle button activation via an async click handler that fetches `/resume/Laxamana_Resume_DotNet_FullStack.pdf`, validates `response.ok`, converts the response to a `Blob`, creates a temporary object URL (`URL.createObjectURL(blob)`), triggers a programmatic `<a download="Laxamana_Resume_DotNet_FullStack.pdf">` click, and revokes the object URL in a `finally` block.
- **Rationale**:
  - A plain `<a href="..." download>` cannot intercept a `404` or failed response before updating UI state, which would violate **FR-007** ("If the resume file is unavailable or fails to download, the button MUST NOT falsely display the 'Downloaded' confirmation state").
  - Fetching as a same-origin `Blob` and triggering `<a download="Laxamana_Resume_DotNet_FullStack.pdf">` ensures the browser saves the file with the exact clean filename without navigating away from the portfolio page (**FR-003**), even in browsers that normally open PDFs inline.
  - If `fetch` throws or `!response.ok`, the button does **not** enter the `"Downloaded"` state and instead surfaces a brief, non-intrusive `"Unavailable"` / error state announced to assistive technology.
- **Alternatives Considered**:
  - *Plain `<a download>`*: Cannot prevent false `"Downloaded"` state on 404 and may open inline PDF viewer in some mobile/in-app browsers.
  - *`HEAD` check followed by `<a download>`*: Still risks inline navigation on mobile/in-app browsers.

## 3. Existing Neo-Brutalist Button Tokens (`NeoButton`)

- **Decision**: Use the existing `Button` component from `frontend/src/components/ui/button.tsx` (`@/components/ui/button`) inside `frontend/src/components/sections/HeroSection.tsx`.
- **Rationale**: The codebase's Neo-Brutalist button tokens are implemented in `frontend/src/components/ui/button.tsx` (`Button` with `variant="primary" | "secondary" | "dark" | "ghost"` and `size="sm" | "md" | "lg"`) and `frontend/src/app/globals.css` (`.nb-btn-primary`, `.nb-btn-secondary`, `--color-nb-*`). Reusing `Button` with `size="lg"` and `variant="secondary"` (matching the adjacent `"Ask My Resume"` button) ensures 100% visual consistency (`2px solid #0F172A`, `4px 4px 0px #0F172A`, `#0284C7` hover, `active:translate-x-[2px] active:translate-y-[2px]`, `focus-visible:outline-2`) with zero duplicated button primitives.
- **Confirmation State Styling**: When in the `"downloaded"` state, apply Neo-Brutalist Sky Blue token overrides (`bg-[#38BDF8] text-[#0F172A]`) or `variant="primary"` styling so the `"Downloaded"` state is unmistakable while remaining compliant with Principles II and III.

## 4. Confirmation Timer & Rapid-Click Stability (FR-004)

- **Decision**: Track state (`"idle" | "downloading" | "downloaded" | "error"`) with a `useRef<ReturnType<typeof setTimeout> | null>(null)` timer. Clear any active timeout before scheduling a `2500ms` reset to `"idle"`, ignore clicks while `"downloading"`, and clear the timeout in a `useEffect` cleanup on unmount.
- **Rationale**: `2500ms` sits squarely in the required 2–3 second window, prevents overlapping timers on rapid clicks, and avoids state updates on unmounted components.

## 5. Responsive Layout & Accessibility (FR-005, FR-006)

- **Decision**: Place the `"Download Resume"` button directly after `"Ask My Resume"` inside the existing `flex flex-wrap items-center gap-4 pt-2` container in `HeroSection.tsx`. Pair `Download` and `Check` icons from `lucide-react` (`aria-hidden="true"`) with explicit text labels (`"Download Resume"` / `"Downloaded"`), and render a visually hidden `aria-live="polite"` status region to announce `"Resume downloaded"` or `"Resume is currently unavailable"` to screen readers.
- **Rationale**: `flex-wrap` with `gap-4` prevents overlap or horizontal overflow on 320px–480px mobile screens, and `aria-live="polite"` communicates state changes without stealing keyboard focus.
