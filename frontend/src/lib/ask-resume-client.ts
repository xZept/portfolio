import {
  CERTIFICATION_RECORDS,
  EDUCATION_RECORD,
  EXPERIENCE_ENTRIES,
  PROFILE_SUMMARY,
  SKILL_CATEGORIES,
  type ExperienceId,
} from "@/data/resume";

export type AskResumeMode = "gemini-rag" | "local-fallback";

export interface ResumeCitation {
  section: string;
  snippet: string;
}

export interface AskResumeRequestPayload {
  question: string;
  context_project_id?: ExperienceId | null;
}

export interface AskResumeResponsePayload {
  answer: string;
  citations: ResumeCitation[];
  mode: AskResumeMode;
  model_used: string;
  suggested_followups: string[];
}

export const STARTER_PROMPTS: string[] = [
  "What did Allen build in SuhayCore?",
  "How did Allen engineer the DAN RAG AI chatbot at DACON?",
  "What certifications and skills does Allen have?",
];

interface GroundedKnowledgeBlock {
  section: string;
  projectId?: ExperienceId;
  keywords: string[];
  snippet: string;
  answer: string;
}

const LOCAL_KNOWLEDGE_BLOCKS: GroundedKnowledgeBlock[] = [
  {
    section: "Summary",
    keywords: [
      "allen",
      "summary",
      "bio",
      "background",
      "who",
      "role",
      "developer",
      "seeking",
      "contact",
      "email",
      "phone",
    ],
    snippet: PROFILE_SUMMARY.summaryBio,
    answer: `${PROFILE_SUMMARY.fullName} is a ${PROFILE_SUMMARY.headline} (${PROFILE_SUMMARY.coreStackSubheadline}) based in ${PROFILE_SUMMARY.location}. ${PROFILE_SUMMARY.summaryBio}`,
  },
  {
    section: "Work Experience - Orani Suhay Foundation",
    projectId: "suhaycore",
    keywords: [
      "suhaycore",
      "orani",
      "suhay",
      "foundation",
      "c#",
      ".net",
      "dotnet",
      "blazor",
      "mudblazor",
      "scholarship",
      "rbac",
      "uat",
      "calendar",
      "notification",
      "document",
      "render",
    ],
    snippet: EXPERIENCE_ENTRIES[0].impactBullets.slice(0, 3).join(" "),
    answer: `At ${EXPERIENCE_ENTRIES[0].organization} (${EXPERIENCE_ENTRIES[0].dateRange}, ${EXPERIENCE_ENTRIES[0].location}), Allen serves as ${EXPERIENCE_ENTRIES[0].role}. ${EXPERIENCE_ENTRIES[0].impactBullets.join(" ")}`,
  },
  {
    section: "Work Experience - DACON Corporation",
    projectId: "dan",
    keywords: [
      "dacon",
      "dan",
      "rag",
      "ai",
      "chatbot",
      "python",
      "fastapi",
      "supabase",
      "pg_cron",
      "jinja2",
      "gemini",
      "langchain",
      "botpress",
      "makati",
      "monitoring",
      "dashboard",
      "plantation",
      "enrollment",
    ],
    snippet: EXPERIENCE_ENTRIES[1].impactBullets.slice(0, 3).join(" "),
    answer: `At ${EXPERIENCE_ENTRIES[1].organization} (${EXPERIENCE_ENTRIES[1].dateRange}, ${EXPERIENCE_ENTRIES[1].location}), Allen worked as ${EXPERIENCE_ENTRIES[1].role}. ${EXPERIENCE_ENTRIES[1].impactBullets.join(" ")}`,
  },
  {
    section: "Projects - FitQuest",
    projectId: "fitquest",
    keywords: [
      "fitquest",
      "android",
      "kotlin",
      "room",
      "sqlite",
      "fooddata",
      "nutrition",
      "food",
      "offline",
      "rest",
      "2025",
    ],
    snippet: EXPERIENCE_ENTRIES[2].impactBullets.join(" "),
    answer: `For FitQuest (${EXPERIENCE_ENTRIES[2].dateRange}), Allen built an Android project using Kotlin, Room Database, Git, and RESTful APIs: ${EXPERIENCE_ENTRIES[2].impactBullets.join(" ")}`,
  },
  {
    section: "Education",
    keywords: [
      "education",
      "school",
      "university",
      "bpsu",
      "bataan",
      "degree",
      "computer science",
      "2022",
      "2026",
      "balanga",
    ],
    snippet: `${EDUCATION_RECORD.institution} — ${EDUCATION_RECORD.degree} (${EDUCATION_RECORD.period}, ${EDUCATION_RECORD.location}).`,
    answer: `Allen is earning his ${EDUCATION_RECORD.degree} at ${EDUCATION_RECORD.institution} in ${EDUCATION_RECORD.location} (${EDUCATION_RECORD.period}).`,
  },
  {
    section: "Certifications",
    keywords: [
      "certifications",
      "certificate",
      "certiport",
      "pearson",
      "microsoft",
      "cisco",
      "cybersecurity",
      "cyber threat",
      "javascript",
      "html",
      "software development",
      "2024",
      "2025",
    ],
    snippet: CERTIFICATION_RECORDS.map(
      (cert) => `${cert.title} (${cert.issuerBadge}, ${cert.year})`,
    ).join("; "),
    answer: `Allen holds five certifications: ${CERTIFICATION_RECORDS.map(
      (cert) => `${cert.title} (${cert.issuerBadge}, ${cert.year})`,
    ).join("; ")}.`,
  },
  {
    section: "Skills",
    keywords: [
      "skills",
      "stack",
      "tech",
      "languages",
      "frameworks",
      "databases",
      "infrastructure",
      "practices",
      "postgresql",
      "asp.net",
      "git",
      "linux",
      "sdlc",
      "waterfall",
      "java",
      "sql",
    ],
    snippet: SKILL_CATEGORIES.map((cat) => `${cat.category}: ${cat.items.join(", ")}`).join(" | "),
    answer: `Allen's resume skills span ${SKILL_CATEGORIES.map(
      (cat) => `${cat.category} (${cat.items.join(", ")})`,
    ).join("; ")}.`,
  },
];

export function buildLocalFallbackAnswer(
  question: string,
  contextProjectId?: ExperienceId | null,
): AskResumeResponsePayload {
  const normalized = question.trim().toLowerCase();
  const tokens = new Set(normalized.split(/[^a-z0-9#_.+-]+/).filter(Boolean));

  const scored = LOCAL_KNOWLEDGE_BLOCKS.map((block) => {
    let score = 0;
    if (contextProjectId && block.projectId === contextProjectId) {
      score += 20;
    }
    for (const kw of block.keywords) {
      if (normalized.includes(kw)) score += 4;
      else if (tokens.has(kw)) score += 3;
    }
    return { score, block };
  }).sort((a, b) => b.score - a.score);

  const matched = scored.filter((item) => item.score > 0).map((item) => item.block);
  const selected = matched.length > 0 ? matched.slice(0, 2) : LOCAL_KNOWLEDGE_BLOCKS.slice(0, 2);

  return {
    answer: selected.map((item) => item.answer).join(" "),
    citations: selected.map((item) => ({
      section: item.section,
      snippet: item.snippet,
    })),
    mode: "local-fallback",
    model_used: "deterministic-resume-grounding",
    suggested_followups: STARTER_PROMPTS,
  };
}

export async function askResume(
  payload: AskResumeRequestPayload,
  options?: { apiUrl?: string; timeoutMs?: number },
): Promise<AskResumeResponsePayload> {
  const trimmedQuestion = payload.question.trim();
  const baseUrl =
    options?.apiUrl ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000";
  const timeoutMs = options?.timeoutMs ?? 4000;

  if (!baseUrl) {
    return buildLocalFallbackAnswer(trimmedQuestion, payload.context_project_id);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/v1/ask-resume`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: trimmedQuestion,
        context_project_id: payload.context_project_id ?? null,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return buildLocalFallbackAnswer(trimmedQuestion, payload.context_project_id);
    }

    const data = (await response.json()) as Partial<AskResumeResponsePayload>;
    if (
      typeof data.answer === "string" &&
      Array.isArray(data.citations) &&
      data.citations.length > 0 &&
      (data.mode === "gemini-rag" || data.mode === "local-fallback")
    ) {
      return {
        answer: data.answer,
        citations: data.citations,
        mode: data.mode,
        model_used: typeof data.model_used === "string" ? data.model_used : "gemini-3.5-flash-lite",
        suggested_followups: Array.isArray(data.suggested_followups)
          ? data.suggested_followups.slice(0, 3)
          : STARTER_PROMPTS,
      };
    }

    return buildLocalFallbackAnswer(trimmedQuestion, payload.context_project_id);
  } catch {
    return buildLocalFallbackAnswer(trimmedQuestion, payload.context_project_id);
  } finally {
    clearTimeout(timer);
  }
}
