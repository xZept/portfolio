"use client";

import * as React from "react";
import {
  AlertTriangle,
  BookOpenCheck,
  Bot,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Mail,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { ExperienceId } from "@/data/resume";
import {
  ALLEN_CONTACT_EMAIL,
  CANONICAL_BADGE_TARGETS,
  STARTER_PROMPTS,
  type CitationBadgeLabel,
  type ResumeCitation,
} from "@/lib/ask-resume-client";
import {
  useAskResumeSession,
  type ChatMessage,
} from "@/lib/use-ask-resume-session";
import { NeoDialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface AskResumeDrawerProps {
  open: boolean;
  initialQuestion?: string;
  contextProjectId?: ExperienceId | null;
  onClose: () => void;
}

const PROJECT_LABELS: Record<ExperienceId, string> = {
  suhaycore: "SuhayCore (.NET 10 / Blazor)",
  dan: "DAN (Enterprise RAG AI / FastAPI)",
  fitquest: "FitQuest (Android / Kotlin)",
};

const INLINE_BADGE_PATTERN =
  /(\[Work: Orani Suhay Foundation\]|\[Work: DACON Corp\]|\[Project: FitQuest\]|\[Education: BPSU\]|\[Certifications\])/g;

const GMAIL_COMPOSE_URL = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(ALLEN_CONTACT_EMAIL)}`;

function isBadgeToken(segment: string): segment is CitationBadgeLabel {
  return segment in CANONICAL_BADGE_TARGETS;
}

function resolveCitationForBadge(
  badgeLabel: CitationBadgeLabel,
  citations: ResumeCitation[],
): ResumeCitation {
  const matched = citations.find((item) => item.badge_label === badgeLabel);
  if (matched) return matched;
  const target = CANONICAL_BADGE_TARGETS[badgeLabel];
  return {
    section: target.section,
    snippet: "",
    badge_label: target.badge_label,
    target_section_id: target.target_section_id,
    target_card_id: target.target_card_id,
  };
}

function getModeBadgeText(message: ChatMessage): string {
  if (message.mode === "gemini-rag") {
    return `Live Gemini RAG (${message.modelUsed ?? "gemini-3.5-flash-lite"})`;
  }
  if (message.mode === "guardrail-refusal" || message.isOffTopic) {
    return "Resume Scope Guardrail";
  }
  return "Grounded in docs/resume.md (Local Fallback)";
}

export function AskResumeDrawer({
  open,
  initialQuestion = "",
  contextProjectId = null,
  onClose,
}: AskResumeDrawerProps) {
  const {
    remainingMessages,
    maxMessages,
    isCapReached,
    isStreaming,
    messages,
    submitQuestion,
    retryFailedMessage,
    clearChat,
  } = useAskResumeSession();

  const [questionInput, setQuestionInput] = React.useState("");
  const [activeContextId, setActiveContextId] = React.useState<ExperienceId | null>(
    contextProjectId,
  );
  const [validationHint, setValidationHint] = React.useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = React.useState(false);

  const wasOpenRef = React.useRef(false);
  const scrollTokenRef = React.useRef(0);
  const activeHighlightRef = React.useRef<{
    element: HTMLElement;
    timerId: number;
  } | null>(null);
  const copyTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (activeHighlightRef.current) {
        window.clearTimeout(activeHighlightRef.current.timerId);
        activeHighlightRef.current.element.removeAttribute("data-highlighted");
        activeHighlightRef.current = null;
      }
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
        copyTimerRef.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }

    const justOpened = !wasOpenRef.current;
    wasOpenRef.current = true;

    if (justOpened) {
      setActiveContextId(contextProjectId);
      setValidationHint(null);
      const trimmed = initialQuestion.trim();
      if (trimmed.length >= 2) {
        setQuestionInput("");
        void submitQuestion(trimmed, contextProjectId);
      }
    }
  }, [open, initialQuestion, contextProjectId, submitQuestion]);

  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handleCitationClick = React.useCallback(
    async (citation: ResumeCitation) => {
      const scrollToken = ++scrollTokenRef.current;

      if (typeof window !== "undefined" && window.innerWidth < 768) {
        onClose();
      }

      if (typeof document === "undefined") return;
      const targetElement =
        document.getElementById(citation.target_card_id) ??
        document.getElementById(citation.target_section_id);
      if (!targetElement) return;

      if (activeHighlightRef.current) {
        window.clearTimeout(activeHighlightRef.current.timerId);
        if (activeHighlightRef.current.element !== targetElement) {
          activeHighlightRef.current.element.removeAttribute("data-highlighted");
        }
      }

      await targetElement.scrollIntoView({ behavior: "smooth", block: "center" });

      if (scrollToken !== scrollTokenRef.current) return;

      targetElement.setAttribute("data-highlighted", "true");
      const timerId = window.setTimeout(() => {
        targetElement.removeAttribute("data-highlighted");
        if (activeHighlightRef.current?.element === targetElement) {
          activeHighlightRef.current = null;
        }
      }, 2500);
      activeHighlightRef.current = { element: targetElement, timerId };
    },
    [onClose],
  );

  const handleCopyEmail = React.useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(ALLEN_CONTACT_EMAIL);
      }
    } catch {
      // Confirmation still highlights email for direct use
    }
    setCopiedEmail(true);
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(() => {
      setCopiedEmail(false);
    }, 2500);
  }, []);

  const submitCurrentInput = React.useCallback(async () => {
    if (isStreaming || isCapReached) return;
    const trimmed = questionInput.trim();
    if (trimmed.length === 0) {
      setValidationHint(null);
      return;
    }
    if (trimmed.length < 2) {
      setValidationHint("Please enter at least 2 characters to ask about Allen's resume.");
      return;
    }

    setValidationHint(null);
    setQuestionInput("");
    await submitQuestion(trimmed, activeContextId);
  }, [activeContextId, isCapReached, isStreaming, questionInput, submitQuestion]);

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitCurrentInput();
  };

  const handleTextareaKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitCurrentInput();
    }
  };

  const handleStarterPromptClick = (prompt: string) => {
    if (isStreaming || isCapReached) return;
    setValidationHint(null);
    void submitQuestion(prompt, activeContextId);
  };

  const renderAssistantBody = (message: ChatMessage) => {
    if (message.status === "streaming") {
      return (
        <div className="space-y-2.5">
          <div
            data-testid="ask-resume-streaming-indicator"
            className="inline-flex items-center gap-2 border-2 border-[#0F172A] bg-[#38BDF8] px-2.5 py-1 text-xs font-black text-[#0F172A]"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            <span>Streaming response...</span>
          </div>
          {message.content ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#0F172A]">
              {message.content}
            </p>
          ) : null}
        </div>
      );
    }

    const segments = message.content.split(INLINE_BADGE_PATTERN);
    const renderedInlineBadges = new Set<CitationBadgeLabel>();

    const inlineContent = (
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#0F172A]">
        {segments.map((segment, index) => {
          if (isBadgeToken(segment)) {
            if (renderedInlineBadges.has(segment)) {
              return (
                <span
                  key={`${message.id}-inline-badge-repeat-${index}`}
                  className="mx-0.5 inline-flex items-center border-2 border-[#0F172A] bg-[#F8FAFC] px-2 py-0.5 font-mono text-xs font-black text-[#0F172A]"
                >
                  {segment}
                </span>
              );
            }
            renderedInlineBadges.add(segment);
            const citation = resolveCitationForBadge(segment, message.citations);
            return (
              <button
                key={`${message.id}-inline-badge-${index}`}
                type="button"
                data-testid="ask-resume-citation-badge"
                onClick={() => void handleCitationClick(citation)}
                className="mx-0.5 inline-flex items-center border-2 border-[#0F172A] bg-[#38BDF8]/30 px-2 py-0.5 font-mono text-xs font-black text-[#0F172A] hover:bg-[#38BDF8] cursor-pointer"
              >
                {segment}
              </button>
            );
          }
          return <React.Fragment key={`${message.id}-text-${index}`}>{segment}</React.Fragment>;
        })}
      </p>
    );

    const remainingCitations = message.citations.filter(
      (cite) => !renderedInlineBadges.has(cite.badge_label),
    );
    const uniqueRemainingBadges: ResumeCitation[] = [];
    const seenRemaining = new Set<CitationBadgeLabel>();
    for (const cite of remainingCitations) {
      if (!seenRemaining.has(cite.badge_label)) {
        seenRemaining.add(cite.badge_label);
        uniqueRemainingBadges.push(cite);
      }
    }

    return (
      <div className="space-y-3">
        {inlineContent}

        {uniqueRemainingBadges.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {uniqueRemainingBadges.map((cite) => (
              <button
                key={`${message.id}-badge-${cite.badge_label}`}
                type="button"
                data-testid="ask-resume-citation-badge"
                onClick={() => void handleCitationClick(cite)}
                className="inline-flex items-center border-2 border-[#0F172A] bg-[#38BDF8]/30 px-2 py-0.5 font-mono text-xs font-black text-[#0F172A] hover:bg-[#38BDF8] cursor-pointer"
              >
                {cite.badge_label}
              </button>
            ))}
          </div>
        ) : null}

        {message.citations.length > 0 ? (
          <div className="space-y-2 border-t-2 border-[#0F172A] pt-3">
            <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#0284C7]">
              <BookOpenCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Resume Citations</span>
            </p>
            <ul className="space-y-2">
              {message.citations.map((cite, idx) => (
                <li
                  key={`${cite.section}-${idx}`}
                  className="border border-[#0F172A] bg-[#F8FAFC] p-2.5 text-xs leading-relaxed"
                >
                  <span className="font-black text-[#0F172A]">{cite.section}: </span>
                  <span>{cite.snippet}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <NeoDialog
      open={open}
      onClose={onClose}
      titleId="ask-resume-dialog-title"
      title="Ask My Resume"
      subtitle="Grounded strictly in docs/resume.md via FastAPI + Gemini RAG with offline fallback"
      layout="drawer"
    >
      <div className="flex flex-col gap-4 bg-[#F8FAFC] p-4 border-2 border-[#0F172A] text-[#0F172A]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#0F172A] pb-3">
          <span
            data-testid="ask-resume-quota-counter"
            className={`inline-flex items-center border-2 border-[#0F172A] px-2.5 py-1 font-mono text-xs font-black ${
              isCapReached ? "bg-[#38BDF8] text-[#0F172A]" : "bg-[#FFFFFF] text-[#0F172A]"
            }`}
          >
            {remainingMessages} / {maxMessages} messages remaining
          </span>

          <button
            type="button"
            data-testid="ask-resume-clear-chat"
            disabled={isStreaming}
            onClick={clearChat}
            className="inline-flex items-center gap-1.5 border-2 border-[#0F172A] bg-[#FFFFFF] px-3 py-1 text-xs font-black text-[#0F172A] shadow-[4px_4px_0px_#0F172A] hover:bg-[#0284C7] hover:text-[#FFFFFF] disabled:opacity-60 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Clear Chat</span>
          </button>
        </div>

        {activeContextId ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-2 border-[#0F172A] bg-[#FFFFFF] px-3 py-2 text-xs font-bold">
            <span>
              Scoped Project:{" "}
              <strong className="text-[#0284C7]">{PROJECT_LABELS[activeContextId]}</strong>
            </span>
            <button
              type="button"
              onClick={() => setActiveContextId(null)}
              className="border border-[#0F172A] bg-[#F8FAFC] px-2 py-0.5 text-xs font-bold hover:bg-[#38BDF8] cursor-pointer"
            >
              Clear Scope
            </button>
          </div>
        ) : null}

        {isCapReached ? (
          <div
            role="status"
            data-testid="ask-resume-cap-banner"
            className="space-y-3 border-2 border-[#0F172A] bg-[#38BDF8] p-4 text-[#0F172A] shadow-[4px_4px_0px_#0F172A]"
          >
            <p className="text-sm font-black leading-snug">
              Session cap reached — email Allen directly at {ALLEN_CONTACT_EMAIL}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                data-testid="cap-banner-copy-email"
                onClick={() => void handleCopyEmail()}
                className="inline-flex items-center gap-1.5 border-2 border-[#0F172A] bg-[#FFFFFF] px-3 py-1.5 text-xs font-black text-[#0F172A] shadow-[4px_4px_0px_#0F172A] hover:bg-[#0284C7] hover:text-[#FFFFFF] cursor-pointer"
              >
                {copiedEmail ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{copiedEmail ? "Copied!" : "Copy Email"}</span>
              </button>

              <a
                data-testid="cap-banner-open-gmail"
                href={GMAIL_COMPOSE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 border-2 border-[#0F172A] bg-[#FFFFFF] px-3 py-1.5 text-xs font-black text-[#0F172A] shadow-[4px_4px_0px_#0F172A] hover:bg-[#0284C7] hover:text-[#FFFFFF]"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Open in Gmail</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>
          </div>
        ) : null}

        {messages.length === 0 ? (
          <div className="space-y-3">
            <div className="border-2 border-[#0F172A] bg-[#FFFFFF] p-4 shadow-[4px_4px_0px_#0F172A] text-sm text-[#0F172A]">
              <div className="flex items-center gap-2 font-black">
                <Bot className="h-4 w-4 text-[#0284C7]" aria-hidden="true" />
                <span>Ready to answer recruiter &amp; technical questions</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed">
                Select a starter prompt below or ask any question about SuhayCore (.NET 10), DAN (DACON RAG AI), FitQuest, BPSU, or Allen&apos;s certifications.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
                Starter Prompts
              </p>
              <div className="flex flex-col gap-2">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    data-testid="ask-resume-starter-chip"
                    disabled={isStreaming || isCapReached}
                    onClick={() => handleStarterPromptClick(prompt)}
                    className="border-2 border-[#0F172A] bg-[#FFFFFF] px-3 py-2 text-left text-xs font-bold text-[#0F172A] shadow-[4px_4px_0px_#0F172A] hover:bg-[#0284C7] hover:text-[#FFFFFF] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <div className="space-y-3" aria-live="polite">
          {messages.map((msg) => {
            if (msg.role === "user") {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div
                    data-testid="ask-resume-user-bubble"
                    className="max-w-[90%] border-2 border-[#0F172A] bg-[#38BDF8] px-3.5 py-2.5 text-sm font-bold text-[#0F172A] shadow-[4px_4px_0px_#0F172A]"
                  >
                    {msg.content}
                  </div>
                </div>
              );
            }

            if (msg.status === "error") {
              return (
                <div
                  key={msg.id}
                  role="alert"
                  data-testid="ask-resume-inline-error"
                  className="border-2 border-[#0F172A] bg-[#FFFFFF] p-4 shadow-[4px_4px_0px_#0F172A] space-y-3"
                >
                  <div className="flex items-start gap-2 text-xs font-bold text-[#0F172A]">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#0284C7]" aria-hidden="true" />
                    <p>{msg.errorMessage ?? "Unable to complete response stream."}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      data-testid="ask-resume-retry-button"
                      disabled={isStreaming || isCapReached}
                      onClick={() => void retryFailedMessage(msg.id)}
                      className="inline-flex items-center gap-1.5 border-2 border-[#0F172A] bg-[#38BDF8] px-3 py-1.5 text-xs font-black text-[#0F172A] shadow-[4px_4px_0px_#0F172A] hover:bg-[#0284C7] hover:text-[#FFFFFF] disabled:opacity-60 cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Retry</span>
                    </button>
                    <a
                      href={`mailto:${ALLEN_CONTACT_EMAIL}`}
                      className="inline-flex items-center gap-1.5 border-2 border-[#0F172A] bg-[#FFFFFF] px-3 py-1.5 text-xs font-black text-[#0F172A] shadow-[4px_4px_0px_#0F172A] hover:bg-[#0284C7] hover:text-[#FFFFFF]"
                    >
                      <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{ALLEN_CONTACT_EMAIL}</span>
                    </a>
                  </div>
                </div>
              );
            }

            const isComplete = msg.status === "complete";
            return (
              <article
                key={msg.id}
                data-testid={
                  isComplete ? "ask-resume-answer-card" : "ask-resume-streaming-card"
                }
                className="border-2 border-[#0F172A] bg-[#FFFFFF] p-4 shadow-[4px_4px_0px_#0F172A] space-y-3"
              >
                {isComplete ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#0F172A] pb-2">
                    <span
                      data-testid="ask-resume-mode-badge"
                      className={`inline-flex items-center gap-1 border-2 border-[#0F172A] px-2 py-0.5 font-mono text-[11px] font-black ${
                        msg.mode === "gemini-rag"
                          ? "bg-[#38BDF8] text-[#0F172A]"
                          : "bg-[#F8FAFC] text-[#0F172A]"
                      }`}
                    >
                      <Sparkles className="h-3 w-3" aria-hidden="true" />
                      {getModeBadgeText(msg)}
                    </span>
                  </div>
                ) : null}

                {renderAssistantBody(msg)}
              </article>
            );
          })}
        </div>

        <form
          onSubmit={handleFormSubmit}
          className="space-y-3 border-2 border-[#0F172A] bg-[#FFFFFF] p-4 shadow-[4px_4px_0px_#0F172A]"
        >
          <label
            htmlFor="ask-resume-input"
            className="block text-xs font-black uppercase tracking-wider"
          >
            Ask a question about Allen&apos;s experience, stack, or credentials
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <textarea
              id="ask-resume-input"
              data-testid="ask-resume-input"
              rows={2}
              value={questionInput}
              disabled={isCapReached}
              onChange={(event) => setQuestionInput(event.target.value)}
              onKeyDown={handleTextareaKeyDown}
              placeholder={
                isCapReached
                  ? "Session cap reached — email Allen directly below"
                  : "e.g., How did Allen implement RBAC in SuhayCore?"
              }
              maxLength={500}
              className="flex-1 resize-none border-2 border-[#0F172A] bg-[#FFFFFF] px-3 py-2 text-sm font-medium text-[#0F172A] focus:outline-2 focus:outline-[#0284C7] disabled:bg-[#F8FAFC] disabled:opacity-60"
            />
            <Button
              type="submit"
              data-testid="ask-resume-submit"
              variant="primary"
              size="md"
              disabled={isStreaming || isCapReached}
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{isStreaming ? "Streaming..." : "Send"}</span>
            </Button>
          </div>
          {validationHint ? (
            <p
              role="alert"
              className="border border-[#0F172A] bg-[#38BDF8] px-2.5 py-1.5 text-xs font-bold text-[#0F172A]"
            >
              {validationHint}
            </p>
          ) : null}
        </form>
      </div>
    </NeoDialog>
  );
}
