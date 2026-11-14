export type ExperienceId = "suhaycore" | "dan" | "fitquest";

export type SkillCategoryName =
  | "Languages & Core"
  | "Frameworks & Web"
  | "Data & Infrastructure"
  | "Engineering Practices";

export interface ProfileSummary {
  fullName: string;
  headline: string;
  coreStackSubheadline: string;
  heroBadge: string;
  summaryBio: string;
  aboutNarrative: string[];
  profilePhotoPath: string;
  email: string;
  phone: string;
  location: string;
  linkedInUrl: string;
  githubUrl: string;
}

export interface CaseStudyDetail {
  problemSummary: string;
  architectureHighlights: string[];
  securityAndData: string[];
  deliveryStatus: string;
}

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
}

export interface MilestoneItem {
  id: string;
  dateLabel: string;
  title: string;
  description: string;
}

export interface SkillNode {
  id: string;
  label: string;
  pillMatchLabels: string[];
  category: SkillCategoryName;
  resumeUsageSummary: string;
  relatedExperienceIds: ExperienceId[];
}

export interface SkillCategoryGroup {
  category: SkillCategoryName;
  items: string[];
}

export interface EducationRecord {
  institution: string;
  degree: string;
  period: string;
  location: string;
  logoPath: string;
}

export interface CertificationRecord {
  id: string;
  title: string;
  issuerBadge: "Certiport / Pearson VUE" | "Cisco";
  year: string;
  primaryLogo: string;
  coBrandLogo: string | null;
}

export interface NavSectionItem {
  id: "experience" | "about" | "skills" | "education" | "certifications" | "contact";
  label: string;
  href: string;
}

export const NAV_SECTIONS: NavSectionItem[] = [
  { id: "experience", label: "Experience", href: "#experience" },
  { id: "about", label: "About", href: "#about" },
  { id: "skills", label: "Skills", href: "#skills" },
  { id: "education", label: "Education", href: "#education" },
  { id: "certifications", label: "Certifications", href: "#certifications" },
  { id: "contact", label: "Contact", href: "#contact" },
];

export const PROFILE_SUMMARY: ProfileSummary = {
  fullName: "Allen James Laxamana",
  headline: "Junior .NET / Full-Stack Developer",
  coreStackSubheadline: "C#, ASP.NET Core, Blazor, PostgreSQL, REST APIs",
  heroBadge: "Full-Stack & AI",
  summaryBio:
    "Computer Science graduate (BPSU, 2026) who independently built SuhayCore, a C# (.NET 10) / Blazor / PostgreSQL web application now in staff user acceptance testing, during a project-based internship. Also built a Python/FastAPI backend and web dashboard in a systems internship. Seeking an entry-level .NET or full-stack developer role.",
  aboutNarrative: [
    "Starting from my Bachelor of Science in Computer Science foundation at Bataan Peninsula State University (BPSU) in Balanga, Bataan (2022–2026), I focused on turning classroom systems design and relational database theory into working software. In 2025, I built FitQuest in Kotlin with Room Database and the FoodData Central REST API to expand local nutrition tracking to millions of verified food records while improving offline access.",
    "In February 2026, I joined DACON Corporation in Makati City as a Systems Developer Intern, where I built and deployed a secure Python/FastAPI backend on Render connected to Supabase PostgreSQL with automated pg_cron 30-day data archival, created a custom authenticated HTML/CSS/JS/Jinja2 real-time chat monitoring dashboard from scratch, and engineered DAN—an end-to-end RAG AI chatbot using Google Gemini, LangChain, and Botpress.",
    "Since March 2026, I have served as a Full-Stack Web Developer Intern (Project-Based) for Orani Suhay Foundation, Inc., independently designing and developing SuhayCore with C# (.NET 10), Blazor (MudBlazor), and PostgreSQL. Core development is complete with RBAC, document verification, an interactive calendar, notifications, and Render staging deployment currently in staff User Acceptance Testing (UAT).",
  ],
  profilePhotoPath: "/images/others/my-photo.png",
  email: "allenjames.laxamana@gmail.com",
  phone: "+63 945-322-7669",
  location: "Balanga, Bataan",
  linkedInUrl: "https://www.linkedin.com/in/allen-james-laxamana-0673473a5/",
  githubUrl: process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/xZept",
};

export const EXPERIENCE_ENTRIES: ExperienceEntry[] = [
  {
    id: "suhaycore",
    title: "SuhayCore",
    role: "Full-Stack Web Developer Intern (Project-Based)",
    organization: "Orani Suhay Foundation, Inc.",
    dateRange: "March 2026 - Present",
    location: "Remote",
    statusBadge: "In UAT",
    previewImage: "/images/projects/suhaycore.png",
    isAnimatedGif: false,
    impactBullets: [
      "Independently designed and developed SuhayCore, a full-stack web application using C# (.NET 10), Blazor (MudBlazor), and PostgreSQL to centralize scholarship workflows and departmental activity tracking.",
      "Built key modules, including an administrative dashboard, secure document upload and verification, an interactive calendar, and a notification system.",
      "Implemented Role-Based Access Control (RBAC) and server-side validation to strengthen application security and data integrity.",
      "Deployed a staging environment on Render for staff User Acceptance Testing (UAT) and prepared deployment configurations and technical documentation for handover to on-premises production servers.",
      "Completed core development; the application is currently undergoing UAT before production deployment.",
    ],
    techTags: ["C#", ".NET 10", "Blazor", "MudBlazor", "PostgreSQL", "RBAC", "Render"],
    caseStudy: {
      problemSummary:
        "Orani Suhay Foundation, Inc. needed a unified internal web platform to centralize scholarship workflows and departmental activity tracking with strict staff authorization and verifiable documentation.",
      architectureHighlights: [
        "Full-stack architecture built independently with C# (.NET 10), ASP.NET Core, and Blazor (MudBlazor) UI components.",
        "Core modules include an administrative dashboard, secure document upload and verification workflow, interactive activity calendar, and notification system.",
        "Prepared deployment configurations and technical handover documentation for transition to on-premises production servers.",
      ],
      securityAndData: [
        "Relational PostgreSQL database backing scholarship records, verification workflows, and departmental tracking.",
        "Role-Based Access Control (RBAC) paired with server-side validation to protect sensitive applicant documents and data integrity.",
      ],
      deliveryStatus:
        "Core development completed; deployed to a Render staging environment and currently undergoing staff User Acceptance Testing (UAT) prior to on-premises production rollout.",
    },
    askAiPrompt:
      "Tell me about Allen's architecture, security controls, and delivery status for SuhayCore at Orani Suhay Foundation.",
  },
  {
    id: "dan",
    title: "DAN (Enterprise RAG AI)",
    role: "Systems Developer Intern",
    organization: "DACON Corporation",
    dateRange: "February 2026 – March 2026",
    location: "Makati City, Metro Manila",
    statusBadge: "Shipped",
    previewImage: "/images/projects/dan.png",
    isAnimatedGif: false,
    impactBullets: [
      "Built and deployed a secure Python/FastAPI backend on Render, connected to a Supabase (PostgreSQL) database with automated pg_cron 30-day data archival.",
      "Developed a custom, authenticated web dashboard (HTML/CSS/JS/Jinja2) from scratch for real-time chat monitoring.",
      "Engineered an end-to-end RAG AI chatbot querying internal corporate policies using Google Gemini, LangChain, and Botpress.",
      "Delivered tech stack architecture recommendations for modernizing the company's Plantation Management System and Client Enrollment processes.",
    ],
    techTags: [
      "Python",
      "FastAPI",
      "PostgreSQL",
      "Supabase",
      "pg_cron",
      "HTML/CSS/JS",
      "Jinja2",
      "Google Gemini",
      "LangChain",
      "Botpress",
      "Render",
    ],
    caseStudy: {
      problemSummary:
        "DACON Corporation needed an enterprise Retrieval-Augmented Generation (RAG) assistant capable of querying internal corporate policies accurately, backed by real-time operational monitoring and automated log retention.",
      architectureHighlights: [
        "Engineered an end-to-end RAG AI chatbot integrating Google Gemini, LangChain, and Botpress for policy question answering.",
        "Built and deployed a Python/FastAPI backend service on Render alongside a custom authenticated HTML/CSS/JS/Jinja2 dashboard for real-time chat monitoring.",
        "Delivered tech stack architecture recommendations to modernize DACON's Plantation Management System and Client Enrollment processes.",
      ],
      securityAndData: [
        "Connected FastAPI to a Supabase (PostgreSQL) database with authenticated monitoring access.",
        "Configured automated pg_cron 30-day data archival jobs for database lifecycle management.",
      ],
      deliveryStatus:
        "Shipped during the February 2026 – March 2026 Systems Developer Internship in Makati City, Metro Manila.",
    },
    askAiPrompt:
      "How did Allen engineer the DAN RAG AI chatbot, FastAPI backend, and monitoring dashboard at DACON Corporation?",
  },
  {
    id: "fitquest",
    title: "FitQuest",
    role: "Android Developer (Project)",
    organization: "FitQuest — Kotlin, Room Database, Git, RESTful API",
    dateRange: "2025",
    location: "Balanga, Bataan",
    statusBadge: "Android",
    previewImage: "/images/projects/fitquest.gif",
    isAnimatedGif: true,
    impactBullets: [
      "Integrated the FoodData Central REST API into an Android application and implemented structured API parsing in Kotlin, expanding the local dataset to millions of verified food records.",
      "Used Room Database for local persistence to reduce redundant API calls and improve offline access.",
    ],
    techTags: ["Kotlin", "Room Database", "Git", "RESTful API", "FoodData Central API"],
    caseStudy: {
      problemSummary:
        "Mobile fitness and nutrition workflows require fast access to verified nutritional data without forcing repetitive network fetches or failing when offline.",
      architectureHighlights: [
        "Built native Android application features in Kotlin with structured REST API response parsing against the FoodData Central REST API.",
        "Version-controlled iterative mobile development cleanly with Git.",
      ],
      securityAndData: [
        "Implemented Android Room Database (SQLite persistence layer) to cache verified food records locally, cutting redundant API calls and strengthening offline usability.",
      ],
      deliveryStatus:
        "Completed in 2025, demonstrating mobile REST integration and offline-first relational persistence.",
    },
    askAiPrompt:
      "What did Allen build in FitQuest using Kotlin, Room Database, and the FoodData Central REST API?",
  },
];

export const MILESTONE_ITEMS: MilestoneItem[] = [
  {
    id: "milestone-fitquest-2025",
    dateLabel: "2025",
    title: "FitQuest",
    description:
      "Integrated the FoodData Central REST API in Kotlin and implemented Room Database persistence to unlock millions of verified food records with offline access.",
  },
  {
    id: "milestone-dacon-feb-2026",
    dateLabel: "Feb 2026",
    title: "DACON Systems Internship",
    description:
      "Built and deployed a Python/FastAPI backend on Render with Supabase PostgreSQL (pg_cron 30-day archival), a Jinja2 real-time monitoring dashboard, and the DAN Gemini/LangChain/Botpress RAG AI chatbot.",
  },
  {
    id: "milestone-suhaycore-mar-2026",
    dateLabel: "Mar 2026",
    title: "SuhayCore .NET 10 Lead",
    description:
      "Independently designed and built SuhayCore with C# (.NET 10), Blazor (MudBlazor), PostgreSQL, and RBAC for Orani Suhay Foundation, Inc., advancing to staff UAT on Render.",
  },
  {
    id: "milestone-bpsu-grad-2026",
    dateLabel: "2026",
    title: "BS Computer Science Grad",
    description:
      "Completing Bachelor of Science in Computer Science (2022–2026) at Bataan Peninsula State University (BPSU) in Balanga, Bataan.",
  },
];

export const SKILL_NODES: SkillNode[] = [
  {
    id: "csharp",
    label: "C#",
    pillMatchLabels: ["C#"],
    category: "Languages & Core",
    resumeUsageSummary:
      "Core backend and full-stack language used to independently build SuhayCore on .NET 10 for Orani Suhay Foundation, Inc.",
    relatedExperienceIds: ["suhaycore"],
  },
  {
    id: "sql",
    label: "SQL",
    pillMatchLabels: ["SQL"],
    category: "Languages & Core",
    resumeUsageSummary:
      "Used across PostgreSQL, Supabase, and SQLite/Room for relational schema design, RBAC queries, and pg_cron archival.",
    relatedExperienceIds: ["suhaycore", "dan", "fitquest"],
  },
  {
    id: "javascript",
    label: "JavaScript",
    pillMatchLabels: ["JavaScript"],
    category: "Languages & Core",
    resumeUsageSummary:
      "Used to build DACON's custom real-time chat monitoring dashboard; certified IT Specialist in JavaScript (2026).",
    relatedExperienceIds: ["dan"],
  },
  {
    id: "html-css",
    label: "HTML/CSS",
    pillMatchLabels: ["HTML/CSS"],
    category: "Languages & Core",
    resumeUsageSummary:
      "Used for DACON's authenticated Jinja2 web dashboard UI; certified IT Specialist in HTML & CSS (2024).",
    relatedExperienceIds: ["dan"],
  },
  {
    id: "python",
    label: "Python",
    pillMatchLabels: ["Python"],
    category: "Languages & Core",
    resumeUsageSummary:
      "Powered DACON Corporation's FastAPI backend service and Google Gemini + LangChain RAG AI chatbot pipeline.",
    relatedExperienceIds: ["dan"],
  },
  {
    id: "java",
    label: "Java",
    pillMatchLabels: ["Java"],
    category: "Languages & Core",
    resumeUsageSummary:
      "Core object-oriented programming language listed under Allen's Languages & Core foundation from BS Computer Science.",
    relatedExperienceIds: [],
  },
  {
    id: "kotlin",
    label: "Kotlin",
    pillMatchLabels: ["Kotlin", "Android (Kotlin, Room)"],
    category: "Languages & Core",
    resumeUsageSummary:
      "Used to implement structured FoodData Central REST API parsing and Room persistence in the FitQuest Android app (2025).",
    relatedExperienceIds: ["fitquest"],
  },
  {
    id: "aspnet-core",
    label: "ASP.NET Core",
    pillMatchLabels: ["ASP.NET Core"],
    category: "Frameworks & Web",
    resumeUsageSummary:
      "Backend web framework foundation alongside C# (.NET 10) and server-side validation in SuhayCore.",
    relatedExperienceIds: ["suhaycore"],
  },
  {
    id: "blazor-mudblazor",
    label: "Blazor / MudBlazor",
    pillMatchLabels: ["Blazor (MudBlazor)"],
    category: "Frameworks & Web",
    resumeUsageSummary:
      "Built SuhayCore's full-stack administrative dashboard, document verification views, interactive calendar, and notifications.",
    relatedExperienceIds: ["suhaycore"],
  },
  {
    id: "fastapi",
    label: "FastAPI",
    pillMatchLabels: ["FastAPI"],
    category: "Frameworks & Web",
    resumeUsageSummary:
      "Built and deployed DACON Corporation's secure Python/FastAPI backend API on Render connected to Supabase.",
    relatedExperienceIds: ["dan"],
  },
  {
    id: "jinja2",
    label: "Jinja2",
    pillMatchLabels: ["Jinja2"],
    category: "Frameworks & Web",
    resumeUsageSummary:
      "Templated DACON's custom, authenticated real-time chat monitoring web dashboard from scratch.",
    relatedExperienceIds: ["dan"],
  },
  {
    id: "rest-apis",
    label: "REST APIs",
    pillMatchLabels: ["REST APIs"],
    category: "Frameworks & Web",
    resumeUsageSummary:
      "Designed and integrated REST endpoints in FastAPI (DACON) and consumed the FoodData Central REST API in FitQuest.",
    relatedExperienceIds: ["dan", "fitquest"],
  },
  {
    id: "android-room",
    label: "Android / Room",
    pillMatchLabels: ["Android (Kotlin, Room)"],
    category: "Frameworks & Web",
    resumeUsageSummary:
      "Implemented Android Room Database local persistence in FitQuest to reduce redundant API calls and support offline access.",
    relatedExperienceIds: ["fitquest"],
  },
  {
    id: "postgresql",
    label: "PostgreSQL",
    pillMatchLabels: ["PostgreSQL"],
    category: "Data & Infrastructure",
    resumeUsageSummary:
      "Primary relational database for both SuhayCore (Orani Suhay Foundation) and DAN (via Supabase at DACON Corporation).",
    relatedExperienceIds: ["suhaycore", "dan"],
  },
  {
    id: "supabase",
    label: "Supabase",
    pillMatchLabels: ["Supabase"],
    category: "Data & Infrastructure",
    resumeUsageSummary:
      "Hosted PostgreSQL backend for DACON Corporation's FastAPI service and automated pg_cron archival pipeline.",
    relatedExperienceIds: ["dan"],
  },
  {
    id: "sqlite",
    label: "SQLite",
    pillMatchLabels: ["SQLite"],
    category: "Data & Infrastructure",
    resumeUsageSummary:
      "Embedded relational storage powering Room Database offline nutrition caching in FitQuest.",
    relatedExperienceIds: ["fitquest"],
  },
  {
    id: "pg-cron",
    label: "pg_cron",
    pillMatchLabels: ["pg_cron"],
    category: "Data & Infrastructure",
    resumeUsageSummary:
      "Configured automated pg_cron 30-day data archival jobs inside DACON Corporation's Supabase PostgreSQL database.",
    relatedExperienceIds: ["dan"],
  },
  {
    id: "render",
    label: "Render",
    pillMatchLabels: ["Render"],
    category: "Data & Infrastructure",
    resumeUsageSummary:
      "Cloud deployment platform for both SuhayCore's staff UAT staging environment and DACON's FastAPI backend.",
    relatedExperienceIds: ["suhaycore", "dan"],
  },
  {
    id: "git",
    label: "Git",
    pillMatchLabels: ["Git"],
    category: "Data & Infrastructure",
    resumeUsageSummary:
      "Version control workflow used across FitQuest, DACON Corporation systems development, and SuhayCore.",
    relatedExperienceIds: ["suhaycore", "dan", "fitquest"],
  },
  {
    id: "linux",
    label: "Linux",
    pillMatchLabels: ["Linux"],
    category: "Data & Infrastructure",
    resumeUsageSummary:
      "Server and environment administration experience supporting cloud deployments and on-premises handover documentation.",
    relatedExperienceIds: ["suhaycore", "dan"],
  },
  {
    id: "rbac",
    label: "RBAC",
    pillMatchLabels: ["Role-Based Access Control (RBAC)"],
    category: "Engineering Practices",
    resumeUsageSummary:
      "Implemented Role-Based Access Control (RBAC) and server-side validation in SuhayCore to safeguard scholarship data.",
    relatedExperienceIds: ["suhaycore"],
  },
  {
    id: "sdlc",
    label: "SDLC",
    pillMatchLabels: ["SDLC", "Modified Waterfall", "UAT", "Requirement Analysis", "Relational DB Design"],
    category: "Engineering Practices",
    resumeUsageSummary:
      "Applied end-to-end Software Development Life Cycle, Modified Waterfall, Requirement Analysis, Relational DB Design, and UAT handover in SuhayCore.",
    relatedExperienceIds: ["suhaycore", "dan"],
  },
];

export const SKILL_CATEGORIES: SkillCategoryGroup[] = [
  {
    category: "Languages & Core",
    items: ["C#", "SQL", "JavaScript", "HTML/CSS", "Python", "Java", "Kotlin"],
  },
  {
    category: "Frameworks & Web",
    items: [
      "ASP.NET Core",
      "Blazor (MudBlazor)",
      "FastAPI",
      "Jinja2",
      "REST APIs",
      "Android (Kotlin, Room)",
    ],
  },
  {
    category: "Data & Infrastructure",
    items: ["PostgreSQL", "Supabase", "SQLite", "pg_cron", "Render", "Git", "Linux"],
  },
  {
    category: "Engineering Practices",
    items: [
      "SDLC",
      "Modified Waterfall",
      "Role-Based Access Control (RBAC)",
      "UAT",
      "Requirement Analysis",
      "Relational DB Design",
    ],
  },
];

export const EDUCATION_RECORD: EducationRecord = {
  institution: "Bataan Peninsula State University (BPSU)",
  degree: "Bachelor of Science in Computer Science",
  period: "2022 – 2026",
  location: "Balanga, Bataan",
  logoPath: "/images/others/bataan-peninsula-state-university.png",
};

export const CERTIFICATION_RECORDS: CertificationRecord[] = [
  {
    id: "it-specialist-js",
    title: "IT Specialist in JavaScript",
    issuerBadge: "Certiport / Pearson VUE",
    year: "2026",
    primaryLogo: "/images/certifications/pearson.png",
    coBrandLogo: "/images/certifications/microsoft.png",
  },
  {
    id: "it-specialist-cybersecurity",
    title: "IT Specialist in Cybersecurity",
    issuerBadge: "Certiport / Pearson VUE",
    year: "2025",
    primaryLogo: "/images/certifications/pearson.png",
    coBrandLogo: "/images/certifications/microsoft.png",
  },
  {
    id: "it-specialist-html-css",
    title: "IT Specialist in HTML & CSS",
    issuerBadge: "Certiport / Pearson VUE",
    year: "2024",
    primaryLogo: "/images/certifications/pearson.png",
    coBrandLogo: "/images/certifications/microsoft.png",
  },
  {
    id: "it-specialist-software-dev",
    title: "IT Specialist in Software Development",
    issuerBadge: "Certiport / Pearson VUE",
    year: "2024",
    primaryLogo: "/images/certifications/pearson.png",
    coBrandLogo: "/images/certifications/microsoft.png",
  },
  {
    id: "cisco-cyber-threat-mgmt",
    title: "Cisco Cyber Threat Management",
    issuerBadge: "Cisco",
    year: "2025",
    primaryLogo: "/images/certifications/cisco.png",
    coBrandLogo: null,
  },
];

export function findSkillNodeForPill(pillLabel: string): SkillNode | undefined {
  const normalized = pillLabel.trim().toLowerCase();
  return SKILL_NODES.find(
    (node) =>
      node.label.toLowerCase() === normalized ||
      node.pillMatchLabels.some((match) => match.toLowerCase() === normalized),
  );
}
