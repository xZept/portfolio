# Feature Specification: Neo-Brutalist Single-Page Portfolio Application

**Feature Branch**: `001-single-page-portfolio`

**Created**: 2026-11-14

**Status**: Draft

**Input**: User description: "Build the single-page portfolio application following the neo-brutalist layout geometry of bugblazer.dev with a sky-blue color palette and factual content from my resume:
- Section 1 (Header & Hero): Sticky top bar with "Allen James Laxamana" on the left, section anchor links on the right (with the active section highlighted in a sky-blue bordered pill), and an "Ask My Resume" trigger button. Below it, a 2-column Hero: left side with my headline (Junior .NET / Full-Stack Developer), a summary bio, and two neo-brutalist CTA buttons (See my experience → and Ask My Resume); right side with my framed profile photo from @[images/others/my-photo.png] and a tilted floating tag badge (Full-Stack & AI)
- Section 2 (Experience): A 2-column neo-brutalist card showcase featuring two internships (Orani Suhay Foundation — SuhayCore and DACON Corporation — DAN an Enterprise RAG AI) plus the FitQuest Android project. Each card needs a status badge at the top (In UAT, Shipped, Android), a visual preview header, impact bullets, tech tags (C#, .NET 10, Blazor, FastAPI, PostgreSQL, etc.), and action buttons. Use the photos from @[images/projects]
- Section 3 (About): A 2-column split: narrative bio on the left (your transition from BPSU CS to building production .NET 10 and AI systems in Bataan and Makati) and a chronological "Timeline / Milestones" bordered card on the right listing dates and milestones (2025 FitQuest, Feb 2026 DACON Systems Internship, Mar 2026 SuhayCore .NET 10 Lead, 2026 BS Computer Science Grad).
- Section 4 (Skills): The Interactive 3D Tech Globe: Housed in a dark midnight-navy neo-brutalist container (#0B1120) with a sky-blue wireframe sphere, rotating 3D nodes for your 22 resume skills (C#, SQL, JavaScript, HTML/CSS, Python, Java, Kotlin, ASP.NET Core, Blazor/MudBlazor, FastAPI, PostgreSQL, Supabase, SQLite, pg_cron, Render, Git, Linux, etc.) that users can drag to rotate, hover to highlight, and click. The Categorized Pill Table: Below the globe, add a structured table with bordered skill pills grouped by exact resume categories: Languages & Core, Frameworks & Web, Data & Infrastructure, and Engineering Practices (SDLC, Modified Waterfall, RBAC, UAT, Requirement Analysis, Relational DB Design).
- Section 5 (Education): A clean neo-brutalist card highlighting Bataan Peninsula State University (BPSU) — Bachelor of Science in Computer Science (2022–2026), location (Balanga, Bataan). Use the photo from @[images/others/bataan-peninsula-state-university.png].
- Section 6 (Certifications): A multi-card grid containing cards. Each card has an issuer pill badge at the top (Certiport / Pearson VUE or Cisco), the certification title (IT Specialist in JavaScript, IT Specialist in Cybersecurity, IT Specialist in HTML & CSS, IT Specialist in Software Development, and Cisco Cyber Threat Management), and the year earned (2024–2026). Use the logos from @[images/certifications].
- Section 7 (Contact): A full-width, high-contrast Sky Blue (#38BDF8) neo-brutalist banner card with thick dark borders and hard offset shadow. Include a bold headline, a primary CTA button, email (allenjames.laxamana@gmail.com) with Copy email and Write email buttons, phone (+63 945-322-7669), location (Balanga, Bataan), and footer links to your LinkedIn and GitHub.
Populate all factual content strictly from @[docs/resume.md]"

## Clarifications

### Session 2026-11-14

- Q: How should the "Ask My Resume" assistant answer visitor questions in this release? → A: Live FastAPI + Gemini RAG endpoint (`gemini-3.5-flash-lite` + `pgvector`) with automatic local resume-grounded fallback if the backend is offline.
- Q: What action buttons should appear on each Experience & Project card (`SuhayCore`, `DAN`, and `FitQuest`)? → A: Two actions per card: "View Case Study" (opens a detail modal with architecture/role breakdown) and "Ask AI about this" (opens Ask My Resume pre-filled with that project).
- Q: What should happen when a visitor clicks one of the 22 skill nodes on the Interactive 3D Tech Globe? → A: Display a selected-skill badge/summary inside the globe container (showing its category and where it was used in the resume) AND highlight the matching pill in the Categorized Pill Table below.
- Q: How should the certification logos in `images/certifications/` (`pearson.png`, `microsoft.png`, `cisco.png`) be assigned to the five certification cards? → A: Use `pearson.png` as the primary issuer logo and `microsoft.png` as a co-brand icon on all 4 IT Specialist cards; use `cisco.png` on the Cisco Cyber Threat Management card.
- Q: What GitHub profile URL should be linked in the Section 7 Contact footer? → A: `https://github.com/xZept` (configurable via environment variable).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - First-Impression Evaluation via Sticky Navigation, Hero & Experience Showcase (Priority: P1)

A technical recruiter or hiring manager visits the portfolio to quickly evaluate Allen James Laxamana's qualifications, core focus, and real-world software engineering deliveries. Upon landing, they see the sticky navigation header, the 2-column Hero introducing Allen as a Junior .NET / Full-Stack Developer with his framed profile photo, and can immediately jump to or scroll through the 2-column Experience & Project showcase featuring SuhayCore, DAN (DACON Corporation), and FitQuest.

**Why this priority**: The Header, Hero, and Experience sections deliver the primary value proposition of the portfolio—proving real-world engineering impact and providing navigation across the entire single-page application.

**Independent Test**: Can be tested independently by loading the portfolio, verifying the sticky header and active section pill highlighting while scrolling, clicking "See my experience →" to navigate smoothly to the Experience section, and verifying all three experience/project cards display their status badges, preview media from `images/projects/`, factual impact bullets from `docs/resume.md`, skill tags, and action buttons.

**Acceptance Scenarios**:

1. **Given** a visitor loads the portfolio at the top of the page, **When** they view Section 1 (Header & Hero), **Then** they see a sticky top bar with "Allen James Laxamana" on the left, section anchor links (`Experience`, `About`, `Skills`, `Education`, `Certifications`, `Contact`) with the active section highlighted in a sky-blue (`#38BDF8`) bordered pill, an "Ask My Resume" trigger button on the right, and a 2-column Hero below featuring the headline "Junior .NET / Full-Stack Developer", the factual resume summary bio, two neo-brutalist CTA buttons ("See my experience →" and "Ask My Resume"), the framed profile photo (`images/others/my-photo.png`), and a tilted floating tag badge reading "Full-Stack & AI".
2. **Given** a visitor is viewing the Hero section, **When** they click "See my experience →" or scroll down to Section 2 (Experience), **Then** the viewport scrolls to Section 2 and the sticky navigation updates the active sky-blue pill to "Experience".
3. **Given** a visitor views Section 2 (Experience), **When** they inspect the 2-column neo-brutalist card showcase, **Then** they see three distinct cards strictly populated from `docs/resume.md`:
   - **Orani Suhay Foundation, Inc. — SuhayCore** (Full-Stack Web Developer Intern, Project-Based, March 2026 – Present, Remote) with status badge `In UAT`, preview image `images/projects/suhaycore.png`, factual impact bullets, displayed tech tags (`C#`, `.NET 10`, `Blazor`, `MudBlazor`, `PostgreSQL`, `RBAC`, `Render`), and card action buttons.
   - **DACON Corporation — DAN (Enterprise RAG AI)** (Systems Developer Intern, February 2026 – March 2026, Makati City, Metro Manila) with status badge `Shipped`, preview image `images/projects/dan.png`, factual impact bullets, displayed tech tags (`Python`, `FastAPI`, `Supabase`, `PostgreSQL`, `pg_cron`, `HTML/CSS/JS`, `Jinja2`, `Google Gemini`, `LangChain`, `Botpress`, `Render`), and card action buttons.
   - **FitQuest** (2025) with status badge `Android`, animated preview `images/projects/fitquest.gif`, factual impact bullets, displayed tech tags (`Kotlin`, `Room Database`, `Git`, `RESTful API`, `FoodData Central API`), and card action buttons.

---

### User Story 2 - Interactive Skill Exploration via 3D Tech Globe & Categorized Pill Table (Priority: P2)

A hiring manager or engineering lead wants to assess the breadth and depth of Allen's technical stack and engineering practices. They navigate to Section 4 (Skills), where they can interactively drag, hover, and click a 3D wireframe globe containing 22 skill nodes inside a midnight-navy container, or scan a structured table of categorized skill pills directly below.

**Why this priority**: Technical evaluators need both an engaging visual showcase of technical craftsmanship (the interactive 3D globe) and a fast, scannable reference table of all resume skills grouped by domain.

**Independent Test**: Can be tested independently by scrolling to Section 4, dragging the 3D globe to rotate it in 3D space, hovering and clicking individual skill nodes to see highlighted/selected states, and verifying that the Categorized Pill Table below renders all four resume skill categories and their exact skill pills.

**Acceptance Scenarios**:

1. **Given** a visitor views Section 4 (Skills), **When** they observe the Interactive 3D Tech Globe container, **Then** they see a dark midnight-navy (`#0B1120`) neo-brutalist card housing a sky-blue (`#38BDF8`) wireframe sphere with 22 rotating 3D skill nodes derived from `docs/resume.md`.
2. **Given** the 3D Tech Globe is visible, **When** the user drags across the globe canvas, hovers over a node, or clicks a skill node, **Then** the globe rotates smoothly in response to drag input, highlights the hovered node with clear visual feedback, and locks/displays selection feedback for the clicked skill (including matching highlight linkage to the Categorized Pill Table).
3. **Given** a visitor views the Categorized Pill Table below the 3D globe, **When** they inspect its rows, **Then** they see a structured neo-brutalist table with bordered skill pills grouped into the exact four resume categories:
   - **Languages & Core**: `C#`, `SQL`, `JavaScript`, `HTML/CSS`, `Python`, `Java`, `Kotlin`
   - **Frameworks & Web**: `ASP.NET Core`, `Blazor (MudBlazor)`, `FastAPI`, `Jinja2`, `REST APIs`, `Android (Kotlin, Room)`
   - **Data & Infrastructure**: `PostgreSQL`, `Supabase`, `SQLite`, `pg_cron`, `Render`, `Git`, `Linux`
   - **Engineering Practices**: `SDLC`, `Modified Waterfall`, `Role-Based Access Control (RBAC)`, `UAT`, `Requirement Analysis`, `Relational DB Design`

---

### User Story 3 - Narrative Background, Academic Credentials & Industry Certifications Verification (Priority: P3)

A recruiter wants to understand Allen's career progression, verify his Computer Science degree, and confirm his industry certifications. They read Section 3 (About), Section 5 (Education), and Section 6 (Certifications).

**Why this priority**: Background narrative, formal education, and verified third-party certifications provide essential credibility and timeline context for entry-level/junior engineering roles.

**Independent Test**: Can be tested independently by scrolling through Sections 3, 5, and 6 and verifying that all dates, locations, institution names, certification titles, issuer badges, and institutional/certification images match `docs/resume.md` and the `images/` directory.

**Acceptance Scenarios**:

1. **Given** a visitor views Section 3 (About), **When** they inspect the 2-column split layout, **Then** the left column displays a factual narrative bio covering Allen's transition from BPSU Computer Science studies to building production .NET 10 and AI systems in Bataan and Makati, and the right column displays a bordered "Timeline / Milestones" card listing chronological entries: `2025` (FitQuest Android Application), `Feb 2026` (DACON Corporation Systems Developer Internship), `Mar 2026` (Orani Suhay Foundation — SuhayCore .NET 10 Full-Stack Lead), and `2026` (BS Computer Science Graduation, BPSU).
2. **Given** a visitor views Section 5 (Education), **When** they inspect the Education card, **Then** they see a neo-brutalist card featuring `images/others/bataan-peninsula-state-university.png`, the institution name "Bataan Peninsula State University (BPSU)", degree "Bachelor of Science in Computer Science", years "2022 – 2026", and location "Balanga, Bataan".
3. **Given** a visitor views Section 6 (Certifications), **When** they inspect the multi-card grid, **Then** they see five neo-brutalist certification cards, each displaying an issuer pill badge at the top, issuer logo from `images/certifications/`, exact certification title, and year earned:
   - `Certiport / Pearson VUE` — **IT Specialist in JavaScript** (`2026`) with logo from `images/certifications/pearson.png` (and/or `microsoft.png` where applicable)
   - `Certiport / Pearson VUE` — **IT Specialist in Cybersecurity** (`2025`) with logo from `images/certifications/pearson.png`
   - `Certiport / Pearson VUE` — **IT Specialist in HTML & CSS** (`2024`) with logo from `images/certifications/pearson.png`
   - `Certiport / Pearson VUE` — **IT Specialist in Software Development** (`2024`) with logo from `images/certifications/pearson.png`
   - `Cisco` — **Cisco Cyber Threat Management** (`2025`) with logo from `images/certifications/cisco.png`

---

### User Story 4 - Direct Outreach & Interactive Resume Inquiry (Priority: P4)

After reviewing the portfolio, a recruiter wants to contact Allen directly via email, phone, or social links, or click "Ask My Resume" to inquire about his experience.

**Why this priority**: Converts visitor interest into actionable hiring outreach via one-click email copying, mail client launch, social profile links, and interactive resume Q&A.

**Independent Test**: Can be tested independently by scrolling to Section 7 (Contact) or clicking "Ask My Resume", testing the "Copy email" button (verifying clipboard contents and confirmation feedback), testing the "Write email" and primary CTA actions, and verifying phone, location, LinkedIn, and GitHub links.

**Acceptance Scenarios**:

1. **Given** a visitor views Section 7 (Contact), **When** they inspect the full-width banner card, **Then** they see a high-contrast Sky Blue (`#38BDF8`) neo-brutalist card with `2px solid #0F172A` borders and hard offset shadow (`4px 4px 0px #0F172A`), containing a bold headline, primary CTA button, email address `allenjames.laxamana@gmail.com` with both "Copy email" and "Write email" buttons, phone number `+63 945-322-7669`, location `Balanga, Bataan`, and footer links to LinkedIn (`https://www.linkedin.com/in/allen-james-laxamana-0673473a5/`) and GitHub (`https://github.com/xZept`).
2. **Given** a visitor is in Section 7 (Contact), **When** they click "Copy email", **Then** `allenjames.laxamana@gmail.com` is copied to the system clipboard and the button displays immediate visual confirmation feedback (e.g., "Copied!") before reverting.
3. **Given** a visitor clicks "Write email" or the primary outreach CTA in Section 7, **When** the action triggers, **Then** the user's default mail client opens addressed to `allenjames.laxamana@gmail.com`.
4. **Given** a visitor clicks either "Ask My Resume" button (in the sticky Header or the Hero section), **When** the button is activated, **Then** an interactive Neo-Brutalist "Ask My Resume" drawer/modal opens allowing the visitor to ask questions or select starter prompts answered strictly from the factual contents of `docs/resume.md`.

---

### Edge Cases

- **Narrow / Mobile Viewports**: When viewed on mobile or tablet viewports (`< 768px`), 2-column layouts (Hero, Experience, About) and multi-card grids (Certifications, Categorized Pill Table) must collapse gracefully into single-column vertical stacks without horizontal overflow, clipped hard shadows, or overlapping sticky navigation items.
- **Reduced Motion / Low-Power or Non-WebGL Environments**: If a visitor has `prefers-reduced-motion: reduce` enabled or their device cannot initialize the 3D canvas context for the Tech Globe, the globe must either pause automatic rotation (while still permitting manual interaction) or degrade gracefully to an interactive 2D node view while the Categorized Pill Table below remains 100% accessible.
- **Clipboard Permission Denied**: If the browser blocks programmatic clipboard access when clicking "Copy email", the interface must provide a visible fallback (such as selecting the email text in place and showing a brief prompt) rather than failing silently.
- **Long Scroll & Rapid Section Switching**: When a user clicks an anchor link in the sticky header, smooth scrolling must not cause the active pill indicator to flicker erratically across intermediate sections, and sticky header height must be accounted for (`scroll-margin-top`) so section headings are never obscured underneath the sticky bar.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (Neo-Brutalist Visual System)**: The application MUST enforce the Neo-Brutalist Sky Blue visual system across all seven sections: `#F8FAFC` page canvas background, `#FFFFFF` card surfaces (except the `#0B1120` 3D Globe container and `#38BDF8` Contact banner), full-width `1px solid #0F172A` section dividers, `2px solid #0F172A` borders on all cards, buttons, and badges, hard zero-blur offset shadows (`4px 4px 0px #0F172A`), primary accent `#38BDF8` (`sky-400`), and interactive hover state `#0284C7` (`sky-600`). Blurry drop shadows, glassmorphism (`backdrop-blur`), and purple/pink gradients are strictly prohibited.
- **FR-002 (Factual Content Grounding)**: All biographical text, roles, dates, organizations, locations, project descriptions, skills, education details, certifications, and contact details MUST be populated strictly from `docs/resume.md` without fabricated metrics, unverified employers, or unrequested skills.
- **FR-003 (Section 1 — Sticky Header)**: The top navigation bar MUST remain sticky at the top of the viewport, displaying "Allen James Laxamana" on the left, section anchor links (`Experience`, `About`, `Skills`, `Education`, `Certifications`, `Contact`) on the right with the currently visible section highlighted inside a `#38BDF8` sky-blue bordered pill (`2px solid #0F172A`), and an "Ask My Resume" trigger button.
- **FR-004 (Section 1 — Hero Layout)**: Below the sticky header, the Hero section MUST render a 2-column layout (following the structural geometry of `bugblazer.dev`):
  - **Left Column**: Headline `"Junior .NET / Full-Stack Developer"`, sub-headline/core stack `"C#, ASP.NET Core, Blazor, PostgreSQL, REST APIs"`, factual summary bio from `docs/resume.md`, and two neo-brutalist CTA buttons: `"See my experience →"` (scrolls to Section 2) and `"Ask My Resume"` (opens the Ask My Resume assistant).
  - **Right Column**: Framed profile photo loaded from `images/others/my-photo.png` inside a neo-brutalist bordered frame with hard offset shadow, accompanied by a tilted floating tag badge reading `"Full-Stack & AI"`.
- **FR-005 (Section 2 — Experience & Project Showcase)**: Section 2 MUST render a 2-column neo-brutalist card grid containing the two internships and one project from `docs/resume.md`. Each card MUST include a top status badge (`In UAT`, `Shipped`, or `Android`), a visual preview header using the designated asset from `images/projects/`, role/title, organization, date range, location, factual impact bullets from `docs/resume.md`, bordered tech tags, and two card action buttons: **"View Case Study"** (opens a neo-brutalist detail modal with architecture/role breakdown from `docs/resume.md`) and **"Ask AI about this"** (opens the "Ask My Resume" assistant pre-filled with a question about that project):
  1. **Orani Suhay Foundation, Inc. — SuhayCore**: Status badge `In UAT`, preview `images/projects/suhaycore.png`, role `Full-Stack Web Developer Intern (Project-Based)`, dates `March 2026 - Present`, location `Remote`, 5 resume impact bullets, tech tags (`C#`, `.NET 10`, `Blazor`, `MudBlazor`, `PostgreSQL`, `RBAC`, `Render`).
  2. **DACON Corporation — DAN (Enterprise RAG AI)**: Status badge `Shipped`, preview `images/projects/dan.png`, role `Systems Developer Intern`, dates `February 2026 – March 2026`, location `Makati City, Metro Manila`, 4 resume impact bullets, tech tags (`Python`, `FastAPI`, `PostgreSQL`, `Supabase`, `pg_cron`, `HTML/CSS/JS`, `Jinja2`, `Google Gemini`, `LangChain`, `Botpress`, `Render`).
  3. **FitQuest**: Status badge `Android`, preview `images/projects/fitquest.gif`, role/year `2025`, 2 resume impact bullets, tech tags (`Kotlin`, `Room Database`, `Git`, `RESTful API`, `FoodData Central API`).
- **FR-006 (Section 3 — About & Milestones)**: Section 3 MUST render a 2-column split layout:
  - **Left Column (Narrative Bio)**: A factual narrative describing Allen's journey from Computer Science studies at Bataan Peninsula State University (BPSU) in Balanga, Bataan to engineering production-bound `.NET 10` (`SuhayCore`) and enterprise RAG AI (`DAN`) systems across Bataan and Makati.
  - **Right Column (Timeline / Milestones Card)**: A neo-brutalist bordered card listing four chronological milestones:
    1. `2025` — **FitQuest**: Built Android nutrition & fitness data app integrating the FoodData Central REST API with Kotlin and Room Database.
    2. `Feb 2026` — **DACON Systems Internship**: Engineered and deployed a Python/FastAPI backend, Supabase (`pg_cron`) archival pipeline, real-time monitoring dashboard, and enterprise RAG AI chatbot (`DAN`) in Makati City.
    3. `Mar 2026` — **SuhayCore .NET 10 Lead**: Independently designed and built `SuhayCore` in C# (`.NET 10`), Blazor (`MudBlazor`), and PostgreSQL for Orani Suhay Foundation, advancing to staff UAT.
    4. `2026` — **BS Computer Science Grad**: Graduating with a Bachelor of Science in Computer Science from Bataan Peninsula State University (BPSU).
- **FR-007 (Section 4 — Interactive 3D Tech Globe)**: The upper portion of Section 4 MUST display an interactive 3D Tech Globe housed inside a dark midnight-navy (`#0B1120`) neo-brutalist container with a `2px solid #0F172A` border and `4px 4px 0px #0F172A` shadow. The globe MUST render a sky-blue (`#38BDF8`) wireframe sphere with 22 rotating 3D skill nodes (`C#`, `SQL`, `JavaScript`, `HTML/CSS`, `Python`, `Java`, `Kotlin`, `ASP.NET Core`, `Blazor / MudBlazor`, `FastAPI`, `Jinja2`, `REST APIs`, `Android / Room`, `PostgreSQL`, `Supabase`, `SQLite`, `pg_cron`, `Render`, `Git`, `Linux`, `RBAC`, `SDLC`) that visitors can drag to rotate in 3D space, hover to highlight, and click. Clicking a node MUST display a selected-skill badge/summary inside the globe container (showing its resume category and where it was used) AND highlight the matching skill pill in the Categorized Pill Table below.
- **FR-008 (Section 4 — Categorized Pill Table)**: Directly below the 3D Tech Globe, Section 4 MUST render a structured neo-brutalist table grouping bordered skill pills into the exact four categories from `docs/resume.md`:
  - **Languages & Core**: `C#`, `SQL`, `JavaScript`, `HTML/CSS`, `Python`, `Java`, `Kotlin`
  - **Frameworks & Web**: `ASP.NET Core`, `Blazor (MudBlazor)`, `FastAPI`, `Jinja2`, `REST APIs`, `Android (Kotlin, Room)`
  - **Data & Infrastructure**: `PostgreSQL`, `Supabase`, `SQLite`, `pg_cron`, `Render`, `Git`, `Linux`
  - **Engineering Practices**: `SDLC`, `Modified Waterfall`, `Role-Based Access Control (RBAC)`, `UAT`, `Requirement Analysis`, `Relational DB Design`
- **FR-009 (Section 5 — Education Card)**: Section 5 MUST render a clean neo-brutalist card highlighting **Bataan Peninsula State University (BPSU)**, degree **Bachelor of Science in Computer Science**, period **2022 – 2026**, location **Balanga, Bataan**, and the university visual asset from `images/others/bataan-peninsula-state-university.png`.
- **FR-010 (Section 6 — Certifications Grid)**: Section 6 MUST render a multi-card neo-brutalist grid displaying all five certifications from `docs/resume.md`. Each card MUST feature an issuer pill badge at the top (`Certiport / Pearson VUE` or `Cisco`), the corresponding logo(s) from `images/certifications/` (`pearson.png` as primary issuer logo with `microsoft.png` as co-brand icon on all 4 Certiport / Pearson VUE IT Specialist cards; `cisco.png` on the Cisco card), the certification title, and the year earned:
  1. **IT Specialist in JavaScript** — `Certiport / Pearson VUE` (`2026`)
  2. **IT Specialist in Cybersecurity** — `Certiport / Pearson VUE` (`2025`)
  3. **IT Specialist in HTML & CSS** — `Certiport / Pearson VUE` (`2024`)
  4. **IT Specialist in Software Development** — `Certiport / Pearson VUE` (`2024`)
  5. **Cisco Cyber Threat Management** — `Cisco` (`2025`)
- **FR-011 (Section 7 — High-Contrast Contact Banner & Footer)**: Section 7 MUST render a full-width, high-contrast Sky Blue (`#38BDF8`) neo-brutalist banner card with `2px solid #0F172A` borders and `4px 4px 0px #0F172A` hard offset shadow. It MUST include a bold call-to-action headline, a primary CTA button, email `allenjames.laxamana@gmail.com` with functional **"Copy email"** (copies to clipboard with visual feedback) and **"Write email"** (`mailto:allenjames.laxamana@gmail.com`) buttons, phone number `+63 945-322-7669`, location `Balanga, Bataan`, and footer links to LinkedIn (`https://www.linkedin.com/in/allen-james-laxamana-0673473a5/`) and GitHub (`https://github.com/xZept`, configurable via environment variable).
- **FR-012 ("Ask My Resume" Interactive Assistant Trigger)**: Clicking "Ask My Resume" in either the sticky Header or the Hero section MUST open a neo-brutalist "Ask My Resume" drawer/modal where visitors can submit natural-language questions or click suggested starter prompts about Allen's experience, skills, education, and certifications. Questions MUST be answered via a live FastAPI + Gemini RAG endpoint (`gemini-3.5-flash-lite` + `pgvector`) strictly grounded in `docs/resume.md`, with automatic local resume-grounded fallback when the backend service is unreachable.

### Key Entities *(include if feature involves data)*

- **ProfileSummary**: Represents Allen James Laxamana's core identity, headline, contact metadata (`allenjames.laxamana@gmail.com`, `+63 945-322-7669`, `Balanga, Bataan`), social links (LinkedIn, GitHub), profile photo (`images/others/my-photo.png`), and narrative bio.
- **ExperienceEntry**: Represents an internship or project showcase item (`SuhayCore`, `DAN`, `FitQuest`), including status badge (`In UAT`, `Shipped`, `Android`), title, organization, date range, location, visual preview path (`images/projects/*`), factual impact bullets, tech tags, and card actions.
- **MilestoneItem**: Represents a chronological entry in the Section 3 Timeline (`2025 FitQuest`, `Feb 2026 DACON Systems Internship`, `Mar 2026 SuhayCore .NET 10 Lead`, `2026 BS Computer Science Grad`).
- **SkillNode & SkillCategory**: Represents the 22 interactive 3D Tech Globe nodes and the 4 categorized groups (`Languages & Core`, `Frameworks & Web`, `Data & Infrastructure`, `Engineering Practices`) displayed in the Categorized Pill Table.
- **EducationRecord**: Represents the BPSU Bachelor of Science in Computer Science credential (`2022–2026`, `Balanga, Bataan`, `images/others/bataan-peninsula-state-university.png`).
- **CertificationRecord**: Represents each of the 5 industry certifications, including issuer badge (`Certiport / Pearson VUE` or `Cisco`), logo path (`images/certifications/*`), certification title, and year earned (`2024–2026`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001 (Factual Accuracy & Completeness)**: 100% of displayed roles, dates, locations, impact bullets, skills, education credentials, certifications, and contact details match `docs/resume.md` verbatim or factually with zero fabricated claims.
- **SC-002 (Section & Asset Coverage)**: All 7 mandated sections and all referenced visual assets (`my-photo.png`, `suhaycore.png`, `dan.png`, `fitquest.gif`, `bataan-peninsula-state-university.png`, `pearson.png`, `microsoft.png`, `cisco.png`) load and display without broken image states across desktop (`1440px`), tablet (`768px`), and mobile (`375px`) viewports.
- **SC-003 (Navigation & Interaction Responsiveness)**: Clicking any sticky header anchor link or the "See my experience →" CTA scrolls to the target section and updates the active sky-blue navigation pill within 1 second; dragging, hovering, or clicking any of the 22 nodes on the 3D Tech Globe responds smoothly without frame drops or layout shifts.
- **SC-004 (Visual System Compliance)**: 100% of cards, buttons, badges, and section dividers adhere to the Neo-Brutalist Sky Blue token specification (`#F8FAFC` canvas, `#FFFFFF` cards, `#0B1120` globe card, `#38BDF8` primary accent, `#0284C7` hover accent, `2px solid #0F172A` borders, `4px 4px 0px #0F172A` zero-blur offset shadows) with zero blurry shadows, glassmorphism, or purple/pink gradients present anywhere in the application.
- **SC-005 (Contact Conversion Actions)**: Visitors can copy `allenjames.laxamana@gmail.com` to their clipboard in a single click with immediate visual confirmation, or trigger their email client via "Write email" in 1 click.

## Assumptions

- **Experience Card Action Buttons**: Since `SuhayCore` (internal foundation staging/UAT system) and `DAN` (internal DACON corporate system) are private/enterprise deliverables without public URLs in `docs/resume.md`, each Experience card's action buttons will open a detailed Neo-Brutalist Case Study / Architecture Breakdown drawer (or link to the corresponding section / Ask My Resume query for that project) so visitors never encounter dead or broken links.
- **GitHub Profile Link**: Because `docs/resume.md` lists only the LinkedIn URL (`https://www.linkedin.com/in/allen-james-laxamana-0673473a5/`), the Section 7 GitHub footer link defaults to `https://github.com/xZept` and is configurable via an environment variable.
- **Certification Logo Mapping**: The four Certiport (Pearson VUE) IT Specialist certifications display `images/certifications/pearson.png` as the primary issuer logo alongside `images/certifications/microsoft.png` as a co-brand icon, and the Cisco Cyber Threat Management certification displays `images/certifications/cisco.png`.
- **"Ask My Resume" Experience**: Clicking "Ask My Resume" opens a Neo-Brutalist slide-over drawer/modal featuring pre-populated quick-ask chips and free-text Q&A grounded in `docs/resume.md`, with seamless fallback to local resume-grounded answers if the backend RAG service is unreachable in local/offline preview.
