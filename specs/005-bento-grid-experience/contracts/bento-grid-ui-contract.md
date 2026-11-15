# UI & Layout Contract: `ExperienceSection` Bento Grid

**Feature**: `005-bento-grid-experience`  
**Component**: `frontend/src/components/sections/ExperienceSection.tsx`  
**Data Source**: `frontend/src/data/resume.ts` (`EXPERIENCE_ENTRIES`)

## 1. Component Props & Public Interface (Unchanged)

```ts
export interface ExperienceSectionProps {
  onOpenCaseStudy: (entry: ExperienceEntry) => void;
  onAskAiAboutProject: (entry: ExperienceEntry) => void;
}
```

## 2. DOM & Landmark Contract

| Element / Role | Selector / Attribute | Required Classes / Tokens | Purpose |
| :--- | :--- | :--- | :--- |
| **Section Landmark** | `section#experience[aria-labelledby="experience-heading"]` | `nb-section-divider bg-[#F8FAFC] py-14 sm:py-16 lg:py-20` | Preserves sticky nav anchor target and section divider |
| **Section Container** | `div.mx-auto.max-w-6xl` | `mx-auto max-w-6xl px-4 sm:px-6 lg:px-8` | Preserves alignment with Hero, About, Skills, Education, Certifications, Contact |
| **Bento Grid Container** | `div[data-testid="experience-bento-grid"]` | `grid grid-cols-1 gap-6 pb-2 pr-1 sm:gap-8 lg:grid-cols-12` | 1-col mobile stack, 12-col desktop Bento Grid, with `pb-2 pr-1` shadow clearance |
| **Bento Card Cell (`suhaycore`)** | `#card-work-suhay` | `min-w-0 max-w-full overflow-hidden lg:col-span-12 lg:row-span-1 lg:grid lg:grid-cols-12` + `border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]` | Featured flagship full-width Bento card with internal 6/6 desktop split |
| **Bento Card Cell (`dan`)** | `#card-work-dacon` | `min-w-0 max-w-full overflow-hidden lg:col-span-7 lg:row-span-1 flex flex-col` + `border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]` | Featured 7-column Bento card for DACON Hybrid RAG Chatbot |
| **Bento Card Cell (`fitquest`)** | `#card-project-fitquest` | `min-w-0 max-w-full overflow-hidden lg:col-span-5 lg:row-span-1 flex flex-col` + `border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]` | Compact 5-column Bento card for FitQuest Android project |
| **Media Stage Wrapper** | `div[data-testid="bento-media-stage-${entry.id}"]` | `relative aspect-video w-full min-w-0 max-w-full overflow-hidden bg-[#F8FAFC] bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:16px_16px]` | Fixed `16:9` media stage with Neo-Brutalist neutral grid backdrop |
| **Preview Image (`next/image`)** | `img[alt="${entry.title} visual preview"]` | `object-contain p-2 sm:p-3` | Ensures 100% of screenshot/GIF frame is visible without cropping or height distortion |

## 3. Visual & Accessibility Invariants

1. **Neo-Brutalist Tokens**:
   - Borders: `border-2 border-[#0F172A]` (`2px solid #0F172A`)
   - Shadows: `shadow-[4px_4px_0px_#0F172A]` (zero-blur hard offset shadow)
   - Accents: `#38BDF8` (`sky-400`) for primary badges/CTAs and `#0284C7` (`sky-600`) for interactive hover states
   - Prohibited: Zero `backdrop-blur`, zero `shadow-sm|md|lg|xl|2xl`, zero purple/pink gradients
2. **Keyboard & Focus Order**:
   - DOM order strictly matches visual reading order (`SuhayCore` → `DAN` → `FitQuest`).
   - No `grid-auto-flow: dense`, `order-*`, or `flex-*-reverse` utilities.
3. **Cross-Section Integration**:
   - Preserves `#card-work-suhay`, `#card-work-dacon`, `#card-project-fitquest`, and `data-[highlighted=true]:ring-4 data-[highlighted=true]:ring-[#38BDF8]` so clicking skill nodes on the 3D Tech Globe in Section 4 highlights the matching Bento card.
