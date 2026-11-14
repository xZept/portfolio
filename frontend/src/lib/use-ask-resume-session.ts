"use client";

import * as React from "react";
import type { ExperienceId } from "@/data/resume";
import {
  askResumeStream,
  type AskResumeMode,
  type ResumeCitation,
} from "@/lib/ask-resume-client";

export const ASK_RESUME_SESSION_STORAGE_KEY = "allen_ask_resume_session_v1";
export const MAX_SESSION_MESSAGES = 15;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: "streaming" | "complete" | "error";
  citations: ResumeCitation[];
  mode?: AskResumeMode;
  isOffTopic?: boolean;
  modelUsed?: string;
  failedPrompt?: string;
  contextProjectId?: ExperienceId | null;
  errorMessage?: string;
}

export interface SubmitQuestionResult {
  accepted: boolean;
  reason?: "empty" | "too-short" | "locked" | "error";
}

function clampUsedMessages(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  if (value > MAX_SESSION_MESSAGES) return MAX_SESSION_MESSAGES;
  return Math.floor(value);
}

function readUsedMessagesFromStorage(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.sessionStorage.getItem(ASK_RESUME_SESSION_STORAGE_KEY);
    if (!raw) return 0;
    const trimmed = raw.trim();
    if (/^\d+$/.test(trimmed)) {
      return clampUsedMessages(Number(trimmed));
    }
    const parsed = JSON.parse(trimmed) as { usedMessages?: unknown };
    if (typeof parsed?.usedMessages === "number") {
      return clampUsedMessages(parsed.usedMessages);
    }
    return 0;
  } catch {
    return 0;
  }
}

function writeUsedMessagesToStorage(usedMessages: number): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      ASK_RESUME_SESSION_STORAGE_KEY,
      JSON.stringify({ usedMessages: clampUsedMessages(usedMessages) }),
    );
  } catch {
    // Ignore storage quota or restricted context failures
  }
}

let turnSequence = 0;
function nextMessageId(prefix: string): string {
  turnSequence += 1;
  return `${prefix}-${Date.now()}-${turnSequence}`;
}

export function useAskResumeSession() {
  const [usedMessages, setUsedMessages] = React.useState<number>(0);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = React.useState<boolean>(false);

  const usedMessagesRef = React.useRef<number>(0);
  const messagesRef = React.useRef<ChatMessage[]>([]);
  const isStreamingRef = React.useRef<boolean>(false);

  React.useEffect(() => {
    const stored = readUsedMessagesFromStorage();
    usedMessagesRef.current = stored;
    setUsedMessages(stored);
  }, []);

  const commitMessages = React.useCallback(
    (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
      setMessages((prev) => {
        const next = updater(prev);
        messagesRef.current = next;
        return next;
      });
    },
    [],
  );

  const recordCompletedMessage = React.useCallback(() => {
    const nextUsed = clampUsedMessages(usedMessagesRef.current + 1);
    usedMessagesRef.current = nextUsed;
    setUsedMessages(nextUsed);
    writeUsedMessagesToStorage(nextUsed);
  }, []);

  const executeAssistantTurn = React.useCallback(
    async (
      assistantId: string,
      question: string,
      contextProjectId: ExperienceId | null,
    ): Promise<boolean> => {
      isStreamingRef.current = true;
      setIsStreaming(true);

      try {
        const response = await askResumeStream(
          {
            question,
            context_project_id: contextProjectId,
          },
          {
            onToken: (_delta, accumulated) => {
              commitMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId
                    ? { ...msg, content: accumulated, status: "streaming" }
                    : msg,
                ),
              );
            },
          },
        );

        commitMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content: response.answer,
                  status: "complete",
                  citations: response.citations,
                  mode: response.mode,
                  isOffTopic: response.is_off_topic,
                  modelUsed: response.model_used,
                  failedPrompt: undefined,
                  errorMessage: undefined,
                }
              : msg,
          ),
        );

        recordCompletedMessage();
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : "Assistant service is temporarily unavailable. Please retry or email Allen directly.";

        commitMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  status: "error",
                  errorMessage,
                  failedPrompt: question,
                  contextProjectId,
                }
              : msg,
          ),
        );
        return false;
      } finally {
        isStreamingRef.current = false;
        setIsStreaming(false);
      }
    },
    [commitMessages, recordCompletedMessage],
  );

  const submitQuestion = React.useCallback(
    async (
      rawQuestion: string,
      contextProjectId: ExperienceId | null = null,
    ): Promise<SubmitQuestionResult> => {
      const cleaned = rawQuestion.trim();
      if (cleaned.length === 0) {
        return { accepted: false, reason: "empty" };
      }
      if (cleaned.length < 2) {
        return { accepted: false, reason: "too-short" };
      }
      if (isStreamingRef.current || usedMessagesRef.current >= MAX_SESSION_MESSAGES) {
        return { accepted: false, reason: "locked" };
      }

      const userMessage: ChatMessage = {
        id: nextMessageId("user"),
        role: "user",
        content: cleaned,
        status: "complete",
        citations: [],
      };
      const assistantId = nextMessageId("assistant");
      const assistantPlaceholder: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        status: "streaming",
        citations: [],
        contextProjectId,
      };

      commitMessages((prev) => [...prev, userMessage, assistantPlaceholder]);

      const succeeded = await executeAssistantTurn(
        assistantId,
        cleaned,
        contextProjectId,
      );

      return {
        accepted: succeeded,
        reason: succeeded ? undefined : "error",
      };
    },
    [commitMessages, executeAssistantTurn],
  );

  const retryFailedMessage = React.useCallback(
    async (messageId: string): Promise<boolean> => {
      if (isStreamingRef.current || usedMessagesRef.current >= MAX_SESSION_MESSAGES) {
        return false;
      }

      const target = messagesRef.current.find((msg) => msg.id === messageId);
      if (!target || target.status !== "error" || !target.failedPrompt) {
        return false;
      }

      const promptToRetry = target.failedPrompt;
      const scopeToRetry = target.contextProjectId ?? null;

      commitMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                content: "",
                status: "streaming",
                citations: [],
                errorMessage: undefined,
              }
            : msg,
        ),
      );

      return executeAssistantTurn(messageId, promptToRetry, scopeToRetry);
    },
    [commitMessages, executeAssistantTurn],
  );

  const clearChat = React.useCallback(() => {
    if (isStreamingRef.current) return;
    commitMessages(() => []);
  }, [commitMessages]);

  const remainingMessages = Math.max(0, MAX_SESSION_MESSAGES - usedMessages);
  const isCapReached = remainingMessages === 0;

  return {
    usedMessages,
    remainingMessages,
    maxMessages: MAX_SESSION_MESSAGES,
    isCapReached,
    isStreaming,
    messages,
    submitQuestion,
    retryFailedMessage,
    clearChat,
  };
}
