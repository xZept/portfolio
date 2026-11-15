# Quickstart Validation Guide: Update Sticky Top Bar Logo and Favicon

**Feature Branch**: `004-update-logo-favicon`  
**Date**: 2026-11-15

## Prerequisites

- Node.js & npm installed
- Dependencies installed in `frontend/` (`npm install`)

## Automated Validation Commands

Run from `frontend/`:

```powershell
# 1. TypeScript gate (zero errors)
npx tsc --noEmit

# 2. ESLint gate (zero errors, zero warnings)
npm run lint

# 3. Unit & component tests (including logo and favicon test)
npm test -- --run

# 4. Production build verification
npm run build
```

## Expected Outcomes

1. `npx tsc --noEmit` exits with code `0`.
2. `npm run lint` exits with code `0` with 0 warnings.
3. `npm test -- --run` passes all existing tests plus `tests/logo-and-favicon.test.tsx`, confirming:
   - `StickyHeader` renders an `<img>` pointing to `/images/others/logo.png` and does not render `AJ`.
   - Clicking the brand link still points to `#top`.
   - `metadata.icons` in `src/app/layout.tsx` references `/images/others/logo.png`.
4. `npm run build` succeeds cleanly.

## Manual Visual Verification (Optional)

1. Start the dev server in `frontend/`: `npm run dev`.
2. Open `http://localhost:3000` in a browser.
3. Verify the browser tab displays the favicon from `/images/others/logo.png` (check Network tab for `200 OK` on `/images/others/logo.png`).
4. Verify the sticky top bar shows the logo cleanly beside `"Allen James Laxamana"` at mobile (`375px`), tablet (`768px`), and desktop (`1280px`) widths with zero clipping or horizontal overflow.
5. Scroll down and click the logo/name to confirm smooth return to `#top`, and confirm all other sections remain unchanged.
