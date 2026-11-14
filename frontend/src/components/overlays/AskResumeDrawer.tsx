"use client";

import * as React from "react";
import { BookOpenCheck, Bot, Loader2, Send, Sparkles } from "lucide-react";
import type { ExperienceId } from "@/data/resume";
import {
  askResume,
  STARTER_PROMPTS,
  type AskResumeResponsePayload,
} from "@/lib/ask-resume-client";
import { NeoDialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface AskResumeDrawerProps {
  open: boolean;
  initialQuestion?: string;
  contextProjectId?: ExperienceId | null;
  onClose: () => void;
}

interface ConversationEntry {
  id: string;
  question: string;
  response: AskResumeResponsePayload;
}

const PROJECT_LABELS: Record<ExperienceId, string> = {
  suhaycore: "SuhayCore (.NET 10 / Blazor)",
  dan: "DAN (Enterprise RAG AI / FastAPI)",
  fitquest: "FitQuest (Android / Kotlin)",
};

export function AskResumeDrawer({
  open,
  initialQuestion = "",
  contextProjectId = null,
  onClose,
}: AskResumeDrawerProps) {
  const [questionInput, setQuestionInput] = React.useState(initialQuestion);
  const [activeContextId, setActiveContextId] = React.useState<ExperienceId | null>(
    contextProjectId,
  );
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [history, setHistory] = React.useState<ConversationEntry[]>([]);

  const submitQuestion = React.useCallback(
    async (text: string, projectScope: ExperienceId | null) => {
      const cleaned = text.trim();
      if (cleaned.length < 2) {
        setErrorMessage("Please enter at least 2 characters to ask about Allen's resume.");
        return;
      }

      setErrorMessage(null);
      setLoading(true);
      try {
        const result = await askResume({
          question: cleaned,
          context_project_id: projectScope,
        });
        setHistory((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${prev.length}`,
            question: cleaned,
            response: result,
          },
        ]);
        setQuestionInput("");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    if (!open) return;
    setActiveContextId(contextProjectId);
    if (initialQuestion.trim().length >= 2) {
      setQuestionInput(initialQuestion);
      void submitQuestion(initialQuestion, contextProjectId);
    }
  }, [open, initialQuestion, contextProjectId, submitQuestion]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitQuestion(questionInput, activeContextId);
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
      <div className="flex flex-col gap-5 text-[#0F172A]">
        {activeContextId ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-2 border-[#0F172A] bg-[#F8FAFC] px-3 py-2 text-xs font-bold">
            <span>
              Scoped Project: <strong className="text-[#0284C7]">{PROJECT_LABELS[activeContextId]}</strong>
            </span>
            <button
              type="button"
              onClick={() => setActiveContextId(null)}
              className="border border-[#0F172A] bg-[#FFFFFF] px-2 py-0.5 text-xs font-bold hover:bg-[#38BDF8] cursor-pointer"
            >
              Clear Scope
            </button>
          </div>
        ) : null}

        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
            Starter Prompts
          </p>
          <div className="flex flex-wrap gap-2">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={loading}
                onClick={() => void submitQuestion(prompt, activeContextId)}
                className="border-2 border-[#0F172A] bg-[#FFFFFF] px-3 py-1.5 text-left text-xs font-bold text-[#0F172A] shadow-[4px_4px_0px_#0F172A] hover:bg-[#38BDF8] disabled:opacity-60 cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 border-2 border-[#0F172A] bg-[#F8FAFC] p-4">
          <label htmlFor="ask-resume-input" className="block text-xs font-black uppercase tracking-wider">
            Ask a question about Allen&apos;s experience, stack, or credentials
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="ask-resume-input"
              type="text"
              value={questionInput}
              onChange={(event) => setQuestionInput(event.target.value)}
              placeholder="e.g., How did Allen implement RBAC in SuhayCore?"
              maxLength={500}
              className="flex-1 border-2 border-[#0F172A] bg-[#FFFFFF] px-3 py-2 text-sm font-medium text-[#0F172A] focus:outline-2 focus:outline-[#0284C7]"
            />
            <Button type="submit" variant="primary" size="md" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{loading ? "Thinking..." : "Ask"}</span>
            </Button>
          </div>
          {errorMessage ? (
            <p role="alert" className="text-xs font-bold text-[#0F172A] bg-[#38BDF8] border border-[#0F172A] px-2.5 py-1.5">
              {errorMessage}
            </p>
          ) : null}
        </form>

        <div className="space-y-4" aria-live="polite">
          {history.length === 0 && !loading ? (
            <div className="border-2 border-[#0F172A] bg-[#FFFFFF] p-4 text-sm text-[#0F172A]">
              <div className="flex items-center gap-2 font-black">
                <Bot className="h-4 w-4 text-[#0284C7]" aria-hidden="true" />
                <span>Ready to answer recruiter &amp; technical questions</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed">
                Select a starter prompt above or ask any question about SuhayCore (.NET 10), DAN (DACON RAG AI), FitQuest, BPSU, or Allen&apos;s certifications.
              </p>
            </div>
          ) : null}

          {history.map((item) => (
            <article
              key={item.id}
              data-testid="ask-resume-answer-card"
              className="border-2 border-[#0F172A] bg-[#FFFFFF] p-4 shadow-[4px_4px_0px_#0F172A] space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#0F172A] pb-2">
                <p className="text-xs font-black text-[#0F172A]">Q: {item.question}</p>
                <span
                  data-testid="ask-resume-mode-badge"
                  className={`inline-flex items-center gap-1 border-2 border-[#0F172A] px-2 py-0.5 font-mono text-[11px] font-black ${
                    item.response.mode === "gemini-rag"
                      ? "bg-[#38BDF8] text-[#0F172A]"
                      : "bg-[#F8FAFC] text-[#0F172A]"
                  }`}
                >
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  {item.response.mode === "gemini-rag"
                    ? `Live Gemini RAG (${item.response.model_used})`
                    : "Grounded in docs/resume.md (Local Fallback)"}
                </span>
              </div>

              <p className="text-sm leading-relaxed text-[#0F172A]">{item.response.answer}</p>

              <div className="space-y-2 border-t-2 border-[#0F172A] pt-3">
                <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#0284C7]">
                  <BookOpenCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Resume Citations</span>
                </p>
                <ul className="space-y-2">
                  {item.response.citations.map((cite, idx) => (
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
            </article>
          ))}
        </div>
      </div>
    </NeoDialog>
  );
}
