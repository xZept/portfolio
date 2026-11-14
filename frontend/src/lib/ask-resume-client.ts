import {
  CERTIFICATION_RECORDS,
  EDUCATION_RECORD,
  EXPERIENCE_ENTRIES,
  PROFILE_SUMMARY,
  SKILL_CATEGORIES,
  type ExperienceId,
} from "@/data/resume";

export const ALLEN_CONTACT_EMAIL = "allenjames.laxamana@gmail.com";

export type AskResumeMode = "gemini-rag" | "local-fallback" | "guardrail-refusal";

export type CitationBadgeLabel =
  | "[Work: Orani Suhay Foundation]"
  | "[Work: DACON Corp]"
  | "[Project: FitQuest]"
  | "[Education: BPSU]"
  | "[Certifications]";

export type TargetSectionId =
  | "experience"
  | "about"
  | "skills"
  | "education"
  | "certifications"
  | "contact";

export type TargetCardId =
  | "card-work-suhay"
  | "card-work-dacon"
  | "card-project-fitquest"
  | "card-education-bpsu"
  | "card-certifications";

export interface ResumeCitation {
  section: string;
  snippet: string;
  badge_label: CitationBadgeLabel;
  target_section_id: TargetSectionId;
  target_card_id: TargetCardId;
}

export interface AskResumeRequestPayload {
  question: string;
  context_project_id?: ExperienceId | null;
}

export interface AskResumeResponsePayload {
  answer: string;
  citations: ResumeCitation[];
  mode: AskResumeMode;
  is_off_topic: boolean;
  model_used: string;
  suggested_followups: string[];
}

export interface AskResumeStreamCallbacks {
  onToken?: (delta: string, accumulated: string) => void;
  signal?: AbortSignal;
}

export interface AskResumeRequestOptions {
  apiUrl?: string;
  timeoutMs?: number;
  localChunkDelayMs?: number;
}

export class AskResumeStreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AskResumeStreamError";
  }
}

export const STARTER_PROMPTS: string[] = [
  "How did Allen architect SuhayCore in .NET 10 & Blazor?",
  "Tell me about his RAG AI chatbot and FastAPI work at DACON.",
  "What certifications and database experience does he hold?",
];

export const CANONICAL_BADGE_TARGETS: Record<
  CitationBadgeLabel,
  {
    badge_label: CitationBadgeLabel;
    target_section_id: TargetSectionId;
    target_card_id: TargetCardId;
    section: string;
  }
> = {
  "[Work: Orani Suhay Foundation]": {
    badge_label: "[Work: Orani Suhay Foundation]",
    target_section_id: "experience",
    target_card_id: "card-work-suhay",
    section: "Work Experience - Orani Suhay Foundation",
  },
  "[Work: DACON Corp]": {
    badge_label: "[Work: DACON Corp]",
    target_section_id: "experience",
    target_card_id: "card-work-dacon",
    section: "Work Experience - DACON Corporation",
  },
  "[Project: FitQuest]": {
    badge_label: "[Project: FitQuest]",
    target_section_id: "experience",
    target_card_id: "card-project-fitquest",
    section: "Projects - FitQuest",
  },
  "[Education: BPSU]": {
    badge_label: "[Education: BPSU]",
    target_section_id: "education",
    target_card_id: "card-education-bpsu",
    section: "Education",
  },
  "[Certifications]": {
    badge_label: "[Certifications]",
    target_section_id: "certifications",
    target_card_id: "card-certifications",
    section: "Certifications",
  },
};

const SECTION_CITATION_DEFAULTS: Record<
  string,
  {
    badge_label: CitationBadgeLabel;
    target_section_id: TargetSectionId;
    target_card_id: TargetCardId;
  }
> = {
  Summary: {
    badge_label: "[Work: Orani Suhay Foundation]",
    target_section_id: "about",
    target_card_id: "card-work-suhay",
  },
  "Work Experience - Orani Suhay Foundation": {
    badge_label: "[Work: Orani Suhay Foundation]",
    target_section_id: "experience",
    target_card_id: "card-work-suhay",
  },
  "Work Experience - DACON Corporation": {
    badge_label: "[Work: DACON Corp]",
    target_section_id: "experience",
    target_card_id: "card-work-dacon",
  },
  "Projects - FitQuest": {
    badge_label: "[Project: FitQuest]",
    target_section_id: "experience",
    target_card_id: "card-project-fitquest",
  },
  Education: {
    badge_label: "[Education: BPSU]",
    target_section_id: "education",
    target_card_id: "card-education-bpsu",
  },
  Certifications: {
    badge_label: "[Certifications]",
    target_section_id: "certifications",
    target_card_id: "card-certifications",
  },
  Skills: {
    badge_label: "[Work: Orani Suhay Foundation]",
    target_section_id: "skills",
    target_card_id: "card-work-suhay",
  },
};

const VALID_SECTION_IDS = new Set<TargetSectionId>([
  "experience",
  "about",
  "skills",
  "education",
  "certifications",
  "contact",
]);

const VALID_CARD_IDS = new Set<TargetCardId>([
  "card-work-suhay",
  "card-work-dacon",
  "card-project-fitquest",
  "card-education-bpsu",
  "card-certifications",
]);

function isCitationBadgeLabel(value: unknown): value is CitationBadgeLabel {
  return typeof value === "string" && value in CANONICAL_BADGE_TARGETS;
}

export function normalizeCitation(raw: {
  section?: unknown;
  snippet?: unknown;
  badge_label?: unknown;
  target_section_id?: unknown;
  target_card_id?: unknown;
}): ResumeCitation {
  const section =
    typeof raw.section === "string" && raw.section.trim().length > 0
      ? raw.section
      : "Work Experience - Orani Suhay Foundation";
  const snippet =
    typeof raw.snippet === "string" && raw.snippet.trim().length > 0
      ? raw.snippet
      : PROFILE_SUMMARY.summaryBio;

  const defaults =
    SECTION_CITATION_DEFAULTS[section] ??
    SECTION_CITATION_DEFAULTS["Work Experience - Orani Suhay Foundation"];

  const badgeLabel = isCitationBadgeLabel(raw.badge_label)
    ? raw.badge_label
    : defaults.badge_label;
  const badgeFallback = CANONICAL_BADGE_TARGETS[badgeLabel];

  const targetSectionId =
    typeof raw.target_section_id === "string" &&
    VALID_SECTION_IDS.has(raw.target_section_id as TargetSectionId)
      ? (raw.target_section_id as TargetSectionId)
      : defaults.target_section_id ?? badgeFallback.target_section_id;

  const targetCardId =
    typeof raw.target_card_id === "string" &&
    VALID_CARD_IDS.has(raw.target_card_id as TargetCardId)
      ? (raw.target_card_id as TargetCardId)
      : defaults.target_card_id ?? badgeFallback.target_card_id;

  return {
    section,
    snippet,
    badge_label: badgeLabel,
    target_section_id: targetSectionId,
    target_card_id: targetCardId,
  };
}

interface GroundedKnowledgeBlock {
  section: string;
  projectId?: ExperienceId;
  badgeLabel: CitationBadgeLabel;
  targetSectionId: TargetSectionId;
  targetCardId: TargetCardId;
  keywords: string[];
  snippet: string;
  answer: string;
}

const LOCAL_KNOWLEDGE_BLOCKS: GroundedKnowledgeBlock[] = [
  {
    section: "Summary",
    badgeLabel: "[Work: Orani Suhay Foundation]",
    targetSectionId: "about",
    targetCardId: "card-work-suhay",
    keywords: [
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
      "location",
      "overview",
    ],
    snippet: PROFILE_SUMMARY.summaryBio,
    answer: `${PROFILE_SUMMARY.fullName} is a ${PROFILE_SUMMARY.headline} (${PROFILE_SUMMARY.coreStackSubheadline}) based in ${PROFILE_SUMMARY.location}. ${PROFILE_SUMMARY.summaryBio} [Work: Orani Suhay Foundation]`,
  },
  {
    section: "Work Experience - Orani Suhay Foundation",
    projectId: "suhaycore",
    badgeLabel: "[Work: Orani Suhay Foundation]",
    targetSectionId: "experience",
    targetCardId: "card-work-suhay",
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
      "architect",
      "architecture",
    ],
    snippet: EXPERIENCE_ENTRIES[0].impactBullets.slice(0, 3).join(" "),
    answer: `At ${EXPERIENCE_ENTRIES[0].organization} (${EXPERIENCE_ENTRIES[0].dateRange}, ${EXPERIENCE_ENTRIES[0].location}), Allen serves as ${EXPERIENCE_ENTRIES[0].role}. ${EXPERIENCE_ENTRIES[0].impactBullets.join(" ")} [Work: Orani Suhay Foundation]`,
  },
  {
    section: "Work Experience - DACON Corporation",
    projectId: "dan",
    badgeLabel: "[Work: DACON Corp]",
    targetSectionId: "experience",
    targetCardId: "card-work-dacon",
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
    answer: `At ${EXPERIENCE_ENTRIES[1].organization} (${EXPERIENCE_ENTRIES[1].dateRange}, ${EXPERIENCE_ENTRIES[1].location}), Allen worked as ${EXPERIENCE_ENTRIES[1].role}. ${EXPERIENCE_ENTRIES[1].impactBullets.join(" ")} [Work: DACON Corp]`,
  },
  {
    section: "Projects - FitQuest",
    projectId: "fitquest",
    badgeLabel: "[Project: FitQuest]",
    targetSectionId: "experience",
    targetCardId: "card-project-fitquest",
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
    answer: `For FitQuest (${EXPERIENCE_ENTRIES[2].dateRange}), Allen built an Android project using Kotlin, Room Database, Git, and RESTful APIs: ${EXPERIENCE_ENTRIES[2].impactBullets.join(" ")} [Project: FitQuest]`,
  },
  {
    section: "Education",
    badgeLabel: "[Education: BPSU]",
    targetSectionId: "education",
    targetCardId: "card-education-bpsu",
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
    answer: `Allen is earning his ${EDUCATION_RECORD.degree} at ${EDUCATION_RECORD.institution} in ${EDUCATION_RECORD.location} (${EDUCATION_RECORD.period}). [Education: BPSU]`,
  },
  {
    section: "Certifications",
    badgeLabel: "[Certifications]",
    targetSectionId: "certifications",
    targetCardId: "card-certifications",
    keywords: [
      "certifications",
      "certification",
      "certificate",
      "certificates",
      "credential",
      "credentials",
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
    ).join("; ")}. [Certifications]`,
  },
  {
    section: "Skills",
    badgeLabel: "[Work: Orani Suhay Foundation]",
    targetSectionId: "skills",
    targetCardId: "card-work-suhay",
    keywords: [
      "skills",
      "skill",
      "stack",
      "tech",
      "languages",
      "frameworks",
      "database",
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
    ).join("; ")}. [Work: Orani Suhay Foundation]`,
  },
];

const PRIVATE_PERSONAL_PATTERN =
  /\b(marital\s+status|married|single|girlfriend|boyfriend|wife|husband|spouse|dating|relationship\s+status|birthday|birth\s+date|date\s+of\s+birth|how\s+old|(?:his|allen'?s)\s+age|religion|religious|church|political|politics|party\s+affiliation|parents|mother|father|siblings|children|kids|home\s+address|street\s+address|personal\s+address|exact\s+address|where\s+does\s+he\s+live|salary|net\s+worth|bank\s+account|credit\s+card|ssn|social\s+security|passport|national\s+id|tin\s+number|philhealth|pag-ibig|medical|blood\s+type|hobbies|favorite\s+food|favorite\s+movie|favorite\s+color|pets?)\b/i;

const UNRELATED_TASK_PATTERN =
  /\b(snake\s+game|fizzbuzz|leetcode|reverse\s+a\s+linked\s+list|binary\s+search\s+tree|tell\s+me\s+a\s+joke|recipe\s+for|(?:write|create|build|make|code|generate)\s+(?:me\s+)?(?:a|an)\s+(?:snake|tetris|chess|pong|tic[\s-]?tac[\s-]?toe|game|calculator|poem|haiku|essay|story|song|joke|recipe|rust\s+program|python\s+script))\b/i;

const GENERAL_TRIVIA_PATTERN =
  /\b(capital\s+of|president\s+of|prime\s+minister|weather\s+in|forecast\s+for|stock\s+price|bitcoin|crypto|ethereum|world\s+cup|olympics|nba|nfl|meaning\s+of\s+life|who\s+invented|distance\s+to\s+the\s+moon|tallest\s+mountain|photosynthesis|sourdough)\b/i;

const RESUME_DOMAIN_TERMS = new Set<string>([
  "allen",
  "laxamana",
  "resume",
  "cv",
  "portfolio",
  "experience",
  "work",
  "intern",
  "internship",
  "internships",
  "project",
  "projects",
  "education",
  "university",
  "college",
  "degree",
  "school",
  "certification",
  "certifications",
  "certificate",
  "certificates",
  "credential",
  "credentials",
  "skill",
  "skills",
  "stack",
  "tech",
  "technology",
  "technologies",
  "language",
  "languages",
  "framework",
  "frameworks",
  "database",
  "databases",
  "backend",
  "frontend",
  "full-stack",
  "fullstack",
  "developer",
  "engineer",
  "engineering",
  "software",
  "web",
  "mobile",
  "android",
  "api",
  "apis",
  "rest",
  "restful",
  "architect",
  "architecture",
  "dashboard",
  "monitoring",
  "chatbot",
  "rag",
  "ai",
  "llm",
  "gemini",
  "langchain",
  "botpress",
  "pgvector",
  "vector",
  "suhay",
  "suhaycore",
  "orani",
  "dacon",
  "dan",
  "fitquest",
  "bpsu",
  "bataan",
  "balanga",
  "makati",
  "certiport",
  "pearson",
  "cisco",
  "javascript",
  "html",
  "css",
  "c#",
  ".net",
  "dotnet",
  "asp.net",
  "blazor",
  "mudblazor",
  "python",
  "fastapi",
  "jinja2",
  "postgresql",
  "postgres",
  "supabase",
  "pg_cron",
  "sql",
  "sqlite",
  "kotlin",
  "room",
  "java",
  "git",
  "linux",
  "render",
  "sdlc",
  "waterfall",
  "rbac",
  "uat",
  "security",
  "validation",
  "contact",
  "email",
  "linkedin",
  "phone",
  "hire",
  "hiring",
  "role",
  "job",
  "career",
  "background",
  "summary",
  "overview",
  "graduate",
  "graduating",
  "remote",
  "location",
  "2022",
  "2024",
  "2025",
  "2026",
  "scholarship",
  "fooddata",
  "nutrition",
  "plantation",
  "enrollment",
]);

function tokenize(text: string): Set<string> {
  return new Set(text.toLowerCase().split(/[^a-z0-9#_.+-]+/).filter(Boolean));
}

export function classifyOffTopicQuery(
  question: string,
  contextProjectId?: ExperienceId | null,
): boolean {
  const normalized = question.trim();
  if (!normalized) return true;
  if (PRIVATE_PERSONAL_PATTERN.test(normalized)) return true;
  if (UNRELATED_TASK_PATTERN.test(normalized)) return true;
  if (GENERAL_TRIVIA_PATTERN.test(normalized)) return true;

  if (!contextProjectId) {
    const qLower = normalized.toLowerCase();
    const tokens = tokenize(normalized);
    const hasDomainSignal = Array.from(RESUME_DOMAIN_TERMS).some(
      (term) => tokens.has(term) || (term.length >= 4 && qLower.includes(term)),
    );
    if (!hasDomainSignal) return true;
  }

  return false;
}

export function buildGuardrailRefusalResponse(): AskResumeResponsePayload {
  return {
    answer:
      "I can only answer questions strictly grounded in Allen James Laxamana's professional resume and portfolio—such as his .NET 10 & Blazor work on SuhayCore at Orani Suhay Foundation, his Python/FastAPI and DAN RAG AI chatbot internship at DACON Corporation, his Kotlin/Room FitQuest project, his BS Computer Science education at BPSU, or his certifications. " +
      `For anything outside his resume or private inquiries, please email him directly at ${ALLEN_CONTACT_EMAIL}.`,
    citations: [],
    mode: "guardrail-refusal",
    is_off_topic: true,
    model_used: "deterministic-guardrail-classifier",
    suggested_followups: STARTER_PROMPTS,
  };
}

export function buildLocalFallbackAnswer(
  question: string,
  contextProjectId?: ExperienceId | null,
): AskResumeResponsePayload {
  if (classifyOffTopicQuery(question, contextProjectId)) {
    return buildGuardrailRefusalResponse();
  }

  const normalized = question.trim().toLowerCase();
  const tokens = tokenize(question);

  const scored = LOCAL_KNOWLEDGE_BLOCKS.map((block) => {
    let score = 0;
    if (contextProjectId && block.projectId === contextProjectId) {
      score += 20;
    }
    if (block.section === "Summary" && (tokens.has("allen") || tokens.has("laxamana"))) {
      score += 1;
    }
    for (const kw of block.keywords) {
      if (normalized.includes(kw)) score += 4;
      else if (tokens.has(kw)) score += 3;
    }
    return { score, block };
  }).sort((a, b) => b.score - a.score);

  const strongMatches = scored.filter((item) => item.score >= 3);
  const matched = (
    strongMatches.length > 0 ? strongMatches : scored.filter((item) => item.score > 0)
  ).map((item) => item.block);
  const selected = matched.length > 0 ? matched.slice(0, 2) : LOCAL_KNOWLEDGE_BLOCKS.slice(0, 2);

  return {
    answer: selected.map((item) => item.answer).join(" "),
    citations: selected.map((item) => ({
      section: item.section,
      snippet: item.snippet,
      badge_label: item.badgeLabel,
      target_section_id: item.targetSectionId,
      target_card_id: item.targetCardId,
    })),
    mode: "local-fallback",
    is_off_topic: false,
    model_used: "deterministic-resume-grounding",
    suggested_followups: STARTER_PROMPTS,
  };
}

function normalizeResponsePayload(
  raw: Partial<AskResumeResponsePayload>,
  fallbackQuestion: string,
  contextProjectId?: ExperienceId | null,
): AskResumeResponsePayload | null {
  if (typeof raw.answer !== "string" || raw.answer.trim().length === 0) {
    return null;
  }

  const mode: AskResumeMode =
    raw.mode === "gemini-rag" || raw.mode === "local-fallback" || raw.mode === "guardrail-refusal"
      ? raw.mode
      : raw.is_off_topic
        ? "guardrail-refusal"
        : "local-fallback";

  const isOffTopic = Boolean(raw.is_off_topic) || mode === "guardrail-refusal";
  const rawCitations = Array.isArray(raw.citations) ? raw.citations : [];
  const citations = rawCitations.map((item) => normalizeCitation(item));

  if (!isOffTopic && citations.length === 0) {
    return buildLocalFallbackAnswer(fallbackQuestion, contextProjectId);
  }

  return {
    answer: raw.answer,
    citations,
    mode,
    is_off_topic: isOffTopic,
    model_used:
      typeof raw.model_used === "string" && raw.model_used.length > 0
        ? raw.model_used
        : "gemini-3.5-flash-lite",
    suggested_followups: Array.isArray(raw.suggested_followups)
      ? raw.suggested_followups.slice(0, 3)
      : STARTER_PROMPTS,
  };
}

export async function askResume(
  payload: AskResumeRequestPayload,
  options?: { apiUrl?: string; timeoutMs?: number },
): Promise<AskResumeResponsePayload> {
  const trimmedQuestion = payload.question.trim();
  const baseUrl =
    options?.apiUrl ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
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
    const normalized = normalizeResponsePayload(
      data,
      trimmedQuestion,
      payload.context_project_id,
    );
    return normalized ?? buildLocalFallbackAnswer(trimmedQuestion, payload.context_project_id);
  } catch {
    return buildLocalFallbackAnswer(trimmedQuestion, payload.context_project_id);
  } finally {
    clearTimeout(timer);
  }
}

function splitIntoChunks(text: string, maxChunks = 6): string[] {
  const tokens = text.match(/\S+\s*/g) ?? (text ? [text] : []);
  if (tokens.length <= 1) return tokens;
  const wordsPerChunk = Math.max(1, Math.ceil(tokens.length / maxChunks));
  const chunks: string[] = [];
  for (let i = 0; i < tokens.length; i += wordsPerChunk) {
    chunks.push(tokens.slice(i, i + wordsPerChunk).join(""));
  }
  return chunks;
}

function delay(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface ParsedSseLine {
  type?: unknown;
  delta?: unknown;
  message?: unknown;
  response?: unknown;
}

function processSseFrame(
  frame: string,
  state: { accumulated: string; doneResponse: AskResumeResponsePayload | null },
  trimmedQuestion: string,
  contextProjectId: ExperienceId | null | undefined,
  onToken?: (delta: string, accumulated: string) => void,
): void {
  const lines = frame.split(/\r?\n/);
  for (const rawLine of lines) {
    if (!rawLine.startsWith("data:")) continue;
    const jsonText = rawLine.slice(5).trim();
    if (!jsonText) continue;

    let parsed: ParsedSseLine;
    try {
      parsed = JSON.parse(jsonText) as ParsedSseLine;
    } catch {
      continue;
    }

    if (parsed.type === "token" && typeof parsed.delta === "string") {
      state.accumulated += parsed.delta;
      onToken?.(parsed.delta, state.accumulated);
    } else if (parsed.type === "error") {
      const errorMsg =
        typeof parsed.message === "string" && parsed.message.trim().length > 0
          ? parsed.message
          : "Stream interrupted while generating a response.";
      throw new AskResumeStreamError(errorMsg);
    } else if (parsed.type === "done" && parsed.response && typeof parsed.response === "object") {
      const normalized = normalizeResponsePayload(
        parsed.response as Partial<AskResumeResponsePayload>,
        trimmedQuestion,
        contextProjectId,
      );
      if (normalized) {
        state.doneResponse = normalized;
      }
    }
  }
}

async function consumeSseResponse(
  response: Response,
  trimmedQuestion: string,
  contextProjectId: ExperienceId | null | undefined,
  onToken?: (delta: string, accumulated: string) => void,
): Promise<AskResumeResponsePayload> {
  const state = {
    accumulated: "",
    doneResponse: null as AskResumeResponsePayload | null,
  };

  if (response.body && typeof response.body.getReader === "function") {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split(/\r?\n\r?\n/);
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          processSseFrame(frame, state, trimmedQuestion, contextProjectId, onToken);
        }
      }
      buffer += decoder.decode();
      if (buffer.trim().length > 0) {
        processSseFrame(buffer, state, trimmedQuestion, contextProjectId, onToken);
      }
    } catch (error) {
      if (error instanceof AskResumeStreamError) {
        throw error;
      }
      throw new AskResumeStreamError(
        error instanceof Error && error.message
          ? error.message
          : "Stream interrupted before completion.",
      );
    }
  } else {
    const fullText = await response.text();
    const frames = fullText.split(/\r?\n\r?\n/);
    for (const frame of frames) {
      processSseFrame(frame, state, trimmedQuestion, contextProjectId, onToken);
    }
  }

  if (!state.doneResponse) {
    throw new AskResumeStreamError(
      "Response stream ended before completion. Please retry or email Allen directly.",
    );
  }

  return state.doneResponse;
}

const STREAM_FAILURE_HINT = /stream|unavailable|500|502|503|interrupted|service error/i;

export async function askResumeStream(
  payload: AskResumeRequestPayload,
  callbacks?: AskResumeStreamCallbacks,
  options?: AskResumeRequestOptions,
): Promise<AskResumeResponsePayload> {
  const trimmedQuestion = payload.question.trim();
  const baseUrl =
    options?.apiUrl ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const timeoutMs = options?.timeoutMs ?? 8000;
  const localChunkDelayMs = options?.localChunkDelayMs ?? 4;

  const streamFallback = async (): Promise<AskResumeResponsePayload> => {
    const fallback = buildLocalFallbackAnswer(trimmedQuestion, payload.context_project_id);
    const chunks = splitIntoChunks(fallback.answer);
    let accumulated = "";
    for (const chunk of chunks) {
      if (callbacks?.signal?.aborted) {
        throw new AskResumeStreamError("Request was cancelled.");
      }
      accumulated += chunk;
      callbacks?.onToken?.(chunk, accumulated);
      await delay(localChunkDelayMs);
    }
    return fallback;
  };

  if (!baseUrl) {
    return streamFallback();
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const externalSignal = callbacks?.signal;
  const handleExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", handleExternalAbort, { once: true });
    }
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/v1/ask-resume/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        question: trimmedQuestion,
        context_project_id: payload.context_project_id ?? null,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timer);
    if (externalSignal) {
      externalSignal.removeEventListener("abort", handleExternalAbort);
    }
    if (error instanceof AskResumeStreamError) {
      throw error;
    }
    if (error instanceof Error && STREAM_FAILURE_HINT.test(error.message)) {
      throw new AskResumeStreamError(error.message);
    }
    if (externalSignal?.aborted) {
      throw new AskResumeStreamError("Request was cancelled.");
    }
    return streamFallback();
  } finally {
    clearTimeout(timer);
    if (externalSignal) {
      externalSignal.removeEventListener("abort", handleExternalAbort);
    }
  }

  if (!response.ok) {
    if (response.status >= 500) {
      throw new AskResumeStreamError(
        `Assistant service temporarily unavailable (HTTP ${response.status}).`,
      );
    }
    if (response.status === 422) {
      throw new AskResumeStreamError("Please enter a question between 2 and 500 characters.");
    }
    throw new AskResumeStreamError(
      `Assistant request failed (HTTP ${response.status}).`,
    );
  }

  return consumeSseResponse(
    response,
    trimmedQuestion,
    payload.context_project_id,
    callbacks?.onToken,
  );
}
