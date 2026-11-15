# Quickstart & Validation Guide: Hero Download Resume Button

**Feature**: `003-hero-download-resume` | **Date**: 2026-11-15

## Prerequisites

1. Node.js and npm dependencies installed in `frontend/`:
   ```powershell
   cd frontend
   npm install
   ```
2. Place the static resume PDF at:
   `frontend/public/resume/Laxamana_Resume_DotNet_FullStack.pdf`

## Automated Verification Commands

Run from `frontend/`:

```powershell
# 1. Unit & component tests (Vitest + React Testing Library)
npm test -- --run

# 2. TypeScript strict check (Constitution Gate)
npx tsc --noEmit

# 3. ESLint zero-warning check (Constitution Gate)
npm run lint
```

## Manual End-to-End Validation Scenarios

1. **Direct Download (US1)**:
   - Start dev server: `npm run dev` in `frontend/`.
   - Open `http://localhost:3000`.
   - Verify `"Download Resume"` appears next to `"Ask My Resume"` in the Hero section with `2px solid #0F172A` border and hard `4px 4px 0px #0F172A` shadow.
   - Click `"Download Resume"` and confirm the browser downloads `Laxamana_Resume_DotNet_FullStack.pdf` without navigating away from `/`.

2. **Confirmation Feedback (US2)**:
   - Immediately after clicking, verify the button label changes to `"Downloaded"`.
   - Wait ~2.5–3 seconds and verify the button automatically reverts to `"Download Resume"`.

3. **Unavailable File Guard (FR-007)**:
   - Temporarily rename or move `frontend/public/resume/Laxamana_Resume_DotNet_FullStack.pdf`.
   - Click `"Download Resume"` and verify `"Downloaded"` is **not** shown.

4. **Responsive & Keyboard (US3)**:
   - Resize viewport to `320px` and `1280px`; verify zero horizontal overflow and zero button overlap.
   - Tab to `"Download Resume"` and press `Enter` or `Space`; verify visible focus outline and download trigger.
