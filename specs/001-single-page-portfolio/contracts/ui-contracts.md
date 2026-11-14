# Frontend UI & Interaction Contracts: Neo-Brutalist Single-Page Portfolio

**Feature Branch**: `001-single-page-portfolio`  
**Frontend Runtime**: React 19.3 + Next.js 16.4.5 + TypeScript 5.8 + Tailwind CSS v4.1  

---

## 1. Global Visual System Contract (Constitution Principles II & III)

| Token / Rule | Required Value / CSS Rule | Prohibited Alternatives |
| :--- | :--- | :--- |
| **Page Canvas** | `bg-[#F8FAFC]` (`#F8FAFC`) | Dark-mode default canvas, gradients |
| **Card Surface** | `bg-[#FFFFFF]` (`#FFFFFF`) (except Globe `#0B1120` & Contact `#38BDF8`) | Translucent/frosted `bg-white/80`, `backdrop-blur-*` |
| **Section Divider** | Full-width `border-b border-[#0F172A]` (`1px solid #0F172A`) | Soft gray/faded dividers |
| **Component Border** | `border-2 border-[#0F172A]` (`2px solid #0F172A`) on all cards, buttons, badges, pills, modals | `1px` light borders, borderless cards |
| **Hard Offset Shadow** | `shadow-[4px_4px_0px_#0F172A]` (`4px 4px 0px #0F172A`) | `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`, any blur radius `> 0px` |
| **Primary Accent** | `#38BDF8` (`sky-400`) | Purple/pink/indigo gradients |
| **Interactive Hover** | `#0284C7` (`sky-600`) | Opacity-only fades without structural contrast |

---

## 2. Section-by-Section DOM & Interaction Contracts

### Section 1: Sticky Header & 2-Column Hero (`#top` / `HeaderHeroSection`)
- **Sticky Header (`<header role="banner">`)**:
  - Left: Brand link `"Allen James Laxamana"` (scrolls to top).
  - Right: Anchor links (`#experience`, `#about`, `#skills`, `#education`, `#certifications`, `#contact`).
  - Active Section Pill: The currently active section link MUST render inside a `#38BDF8` background pill with `2px solid #0F172A` border.
  - Trigger Button: `"Ask My Resume"` button (`2px solid #0F172A`, `4px 4px 0px #0F172A` shadow) that opens `AskResumeDrawer`.
- **Hero Grid**:
  - Left column: Headline `"Junior .NET / Full-Stack Developer"`, stack line `"C#, ASP.NET Core, Blazor, PostgreSQL, REST APIs"`, summary bio from `docs/resume.md`, primary CTA `"See my experience →"` (scrolls smoothly to `#experience`), secondary CTA `"Ask My Resume"` (opens `AskResumeDrawer`).
  - Right column: Framed photo `/images/others/my-photo.png` with `2px solid #0F172A` border, `4px 4px 0px #0F172A` shadow, and tilted (`-rotate-3` or `rotate-3`) floating badge `"Full-Stack & AI"` (`#38BDF8` background, `2px solid #0F172A` border).

### Section 2: Experience & Project Showcase (`#experience`)
- **Grid**: 2-column responsive neo-brutalist card grid (`grid-cols-1 lg:grid-cols-2`).
- **Cards (`SuhayCore`, `DAN`, `FitQuest`)**:
  - Top status badge: `In UAT` (SuhayCore), `Shipped` (DAN), `Android` (FitQuest).
  - Visual header: `/images/projects/suhaycore.png`, `/images/projects/dan.png`, `/images/projects/fitquest.gif`.
  - Role, organization, date range, location, and exact impact bullets from `docs/resume.md`.
  - Tech tag pills with `2px solid #0F172A` borders.
  - Action Buttons:
    1. `"View Case Study"` → Opens `CaseStudyModal` populated with that card's `ExperienceEntry.caseStudy`.
    2. `"Ask AI about this"` → Opens `AskResumeDrawer` pre-filled and scoped to `context_project_id`.

### Section 3: About & Milestones (`#about`)
- **2-Column Split (`grid-cols-1 lg:grid-cols-12`)**:
  - Left column: Narrative bio paragraphs covering BPSU Computer Science to `.NET 10` (`SuhayCore`) and enterprise RAG AI (`DAN`) across Bataan and Makati.
  - Right column: `"Timeline / Milestones"` bordered card (`#FFFFFF`, `2px solid #0F172A`, `4px 4px 0px #0F172A`) displaying the 4 chronological milestones (`2025 FitQuest`, `Feb 2026 DACON Systems Internship`, `Mar 2026 SuhayCore .NET 10 Lead`, `2026 BS Computer Science Grad`).

### Section 4: Interactive 3D Tech Globe & Categorized Pill Table (`#skills`)
- **Upper Component (`TechGlobe3D`)**:
  - Container: Dark midnight-navy (`#0B1120`) neo-brutalist card with `2px solid #0F172A` border and `4px 4px 0px #0F172A` shadow.
  - Wireframe Sphere: Sky-blue (`#38BDF8`) latitude/longitude wireframe sphere with 22 rotating 3D skill nodes.
  - Interactions:
    - Drag (`onPointerDown` / `onPointerMove` / `onPointerUp`): Rotates the 3D sphere smoothly.
    - Hover: Highlights node in `#38BDF8` / `#0284C7`.
    - Click: Selects the node, displaying a **Selected Skill Summary Badge** inside the `#0B1120` globe card (showing skill name, category, and where it was used in `docs/resume.md`) AND highlighting the matching skill pill(s) in the Categorized Pill Table below.
- **Lower Component (`CategorizedPillTable`)**:
  - Structured 4-row neo-brutalist table (`Languages & Core`, `Frameworks & Web`, `Data & Infrastructure`, `Engineering Practices`) with `2px solid #0F172A` bordered skill pills. Clicking a pill in the table also selects the corresponding 3D globe node.

### Section 5: Education (`#education`)
- Neo-brutalist card featuring `/images/others/bataan-peninsula-state-university.png`, `"Bataan Peninsula State University (BPSU)"`, `"Bachelor of Science in Computer Science"`, `"2022 – 2026"`, and `"Balanga, Bataan"`.

### Section 6: Certifications (`#certifications`)
- Multi-card responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) of 5 neo-brutalist cards:
  - 4 `Certiport / Pearson VUE` IT Specialist cards (`JavaScript 2026`, `Cybersecurity 2025`, `HTML & CSS 2024`, `Software Development 2024`) displaying `/images/certifications/pearson.png` (primary) and `/images/certifications/microsoft.png` (co-brand icon).
  - 1 `Cisco` card (`Cisco Cyber Threat Management`, `2025`) displaying `/images/certifications/cisco.png`.

### Section 7: Contact Banner & Footer (`#contact`)
- Full-width Sky Blue (`#38BDF8`) neo-brutalist banner card (`2px solid #0F172A` border, `4px 4px 0px #0F172A` shadow):
  - Bold headline + primary outreach CTA button.
  - Email `allenjames.laxamana@gmail.com` with **"Copy email"** button (copies to clipboard, changes label to `"Copied!"` for 2.5 seconds, plus selection fallback if clipboard permission is denied) and **"Write email"** button (`mailto:allenjames.laxamana@gmail.com`).
  - Phone `+63 945-322-7669` and Location `Balanga, Bataan`.
  - Footer links to LinkedIn (`https://www.linkedin.com/in/allen-james-laxamana-0673473a5/`) and GitHub (`https://github.com/xZept`).
