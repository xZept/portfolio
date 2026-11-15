# Quickstart & Validation Guide: Responsive CSS Bento Grid (`005-bento-grid-experience`)

## Prerequisites

- Node.js 20+ and npm installed
- Repository dependencies installed in `frontend/` (`cd frontend && npm install`)

## Verification Commands

Run all commands from the `frontend/` workspace directory:

```powershell
cd c:\Users\allen\Documents\portfolio\frontend

# 1. TypeScript static type validation (Zero errors required)
npx tsc --noEmit

# 2. Next.js / ESLint static analysis (Zero warnings & zero errors required)
npm run lint

# 3. Automated unit & integration tests (Vitest)
npm test -- --run

# 4. Production build check
npm run build
```

## End-to-End Validation Scenarios

1. **Bento Grid Structure (`lg:grid-cols-12` & `grid-cols-1`)**:
   - Inspect `section#experience [data-testid="experience-bento-grid"]` and verify it applies `grid-cols-1` for mobile and `lg:grid-cols-12` for desktop.
   - Verify `#card-work-suhay` has `lg:col-span-12 lg:row-span-1`, `#card-work-dacon` has `lg:col-span-7 lg:row-span-1`, and `#card-project-fitquest` has `lg:col-span-5 lg:row-span-1`.
2. **Media Containment & `aspect-video` + `object-contain`**:
   - Verify each card and its media stage wrapper include `min-w-0`, `max-w-full`, and `overflow-hidden`.
   - Verify each preview image (`suhaycore.png`, `dan.png`, `fitquest.gif`) sits inside an `aspect-video` container and uses `object-contain` so the portrait FitQuest GIF and wide SuhayCore screenshot are completely visible without cropping.
3. **Shadow & Border Safety**:
   - Confirm `document.documentElement.scrollWidth <= document.documentElement.clientWidth` across `375px`, `768px`, `1024px`, and `1440px` viewports, and verify the `4px 4px 0px #0F172A` shadow on every card is unclipped.
4. **Scope Isolation**:
   - Run `git status` from the repository root and confirm that only `frontend/src/data/resume.ts`, `frontend/src/components/sections/ExperienceSection.tsx`, and test/spec files were touched.
