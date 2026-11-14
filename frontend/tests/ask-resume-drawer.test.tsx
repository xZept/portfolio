import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";
import { ASK_RESUME_SESSION_STORAGE_KEY } from "@/lib/use-ask-resume-session";
import { ALLEN_CONTACT_EMAIL, STARTER_PROMPTS } from "@/lib/ask-resume-client";

function createSseResponse(frames: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const frame of frames) {
        controller.enqueue(encoder.encode(frame));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

describe("Ask My Resume AI Assistant Drawer (US1–US4)", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1280,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    window.sessionStorage.clear();
  });

  it("renders floating Neo-Brutalist trigger, opens drawer with 15/15 quota & 3 starter chips, and closes on Escape", async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    const trigger = screen.getByTestId("floating-ask-resume-trigger");
    expect(trigger).toBeInTheDocument();
    expect(trigger.className).toContain("fixed");
    expect(trigger.className).toContain("bottom-6");
    expect(trigger.className).toContain("right-6");
    expect(trigger.className).toContain("border-2");
    expect(trigger.className).toContain("border-[#0F172A]");
    expect(trigger.className).toContain("bg-[#38BDF8]");
    expect(trigger.className).toContain("shadow-[4px_4px_0px_#0F172A]");

    await user.click(trigger);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("open");
    expect(screen.getByTestId("ask-resume-quota-counter")).toHaveTextContent(
      "15 / 15 messages remaining",
    );

    const chips = screen.getAllByTestId("ask-resume-starter-chip");
    expect(chips).toHaveLength(3);
    expect(chips.map((el) => el.textContent)).toEqual(STARTER_PROMPTS);

    await user.keyboard("{Escape}");
    expect(dialog).not.toHaveAttribute("open");
  });

  it("streams incremental tokens with visible streaming indicator and preserves quota across Clear Chat", async () => {
    const user = userEvent.setup();
    const encoder = new TextEncoder();
    let pushSecondChunk!: () => void;
    const secondChunkGate = new Promise<void>((resolve) => {
      pushSecondChunk = resolve;
    });

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "token", delta: "At DACON Corporation, " })}\n\n`,
          ),
        );
        await secondChunkGate;
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "token",
              delta: "Allen engineered DAN using FastAPI. [Work: DACON Corp]",
            })}\n\n`,
          ),
        );
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "done",
              response: {
                answer:
                  "At DACON Corporation, Allen engineered DAN using FastAPI. [Work: DACON Corp]",
                citations: [
                  {
                    section: "Work Experience - DACON Corporation",
                    snippet: "Built Python/FastAPI backend and DAN RAG AI chatbot.",
                    badge_label: "[Work: DACON Corp]",
                    target_section_id: "experience",
                    target_card_id: "card-work-dacon",
                  },
                ],
                mode: "gemini-rag",
                is_off_topic: false,
                model_used: "gemini-3.5-flash-lite",
                suggested_followups: STARTER_PROMPTS,
              },
            })}\n\n`,
          ),
        );
        controller.close();
      },
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(stream, {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      }),
    );

    render(<HomePage />);
    await user.click(screen.getByTestId("floating-ask-resume-trigger"));

    await user.click(screen.getByRole("button", { name: STARTER_PROMPTS[1] }));

    expect(await screen.findByTestId("ask-resume-streaming-indicator")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/At DACON Corporation,/i)).toBeInTheDocument();
    });

    pushSecondChunk();

    const answerCard = await screen.findByTestId("ask-resume-answer-card");
    expect(within(answerCard).getByTestId("ask-resume-citation-badge")).toHaveTextContent(
      "[Work: DACON Corp]",
    );
    expect(screen.getByTestId("ask-resume-quota-counter")).toHaveTextContent(
      "14 / 15 messages remaining",
    );
    expect(window.sessionStorage.getItem(ASK_RESUME_SESSION_STORAGE_KEY)).toBe(
      JSON.stringify({ usedMessages: 1 }),
    );

    await user.click(screen.getByTestId("ask-resume-clear-chat"));
    expect(screen.queryByTestId("ask-resume-answer-card")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("ask-resume-starter-chip")).toHaveLength(3);
    expect(screen.getByTestId("ask-resume-quota-counter")).toHaveTextContent(
      "14 / 15 messages remaining",
    );
    expect(window.sessionStorage.getItem(ASK_RESUME_SESSION_STORAGE_KEY)).toBe(
      JSON.stringify({ usedMessages: 1 }),
    );
  });

  it("scrolls smoothly and highlights target portfolio card on badge click, collapsing drawer below 768px", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Offline"));

    const scrollIntoViewMock = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;

    render(<HomePage />);
    await user.click(screen.getByTestId("floating-ask-resume-trigger"));

    await user.click(screen.getByRole("button", { name: STARTER_PROMPTS[0] }));
    const answerCard = await screen.findByTestId("ask-resume-answer-card");

    vi.useFakeTimers({ shouldAdvanceTime: true });
    const fakeUser = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    const suhayBadge = within(answerCard).getByRole("button", {
      name: "[Work: Orani Suhay Foundation]",
    });
    await fakeUser.click(suhayBadge);

    const suhayCard = document.getElementById("card-work-suhay");
    expect(suhayCard).not.toBeNull();
    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
    await waitFor(() => {
      expect(suhayCard).toHaveAttribute("data-highlighted", "true");
    });

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("open");

    await act(async () => {
      vi.advanceTimersByTime(2550);
    });
    expect(suhayCard).not.toHaveAttribute("data-highlighted");

    vi.useRealTimers();

    // Narrow/mobile viewport (< 768px) collapses drawer when citation badge is clicked
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 375,
    });
    await user.click(suhayBadge);
    expect(dialog).not.toHaveAttribute("open");
  });

  it("supports custom Enter/Send input, ignores empty input, and preserves Shift+Enter newlines", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Offline"));

    render(<HomePage />);
    await user.click(screen.getByTestId("floating-ask-resume-trigger"));

    const textarea = screen.getByTestId("ask-resume-input");
    await user.type(textarea, "   {Enter}");
    expect(screen.queryByTestId("ask-resume-user-bubble")).not.toBeInTheDocument();
    expect(screen.getByTestId("ask-resume-quota-counter")).toHaveTextContent(
      "15 / 15 messages remaining",
    );

    await user.clear(textarea);
    await user.type(textarea, "Line 1{Shift>}{Enter}{/Shift}Line 2");
    expect(textarea).toHaveValue("Line 1\nLine 2");
    expect(screen.getByTestId("ask-resume-quota-counter")).toHaveTextContent(
      "15 / 15 messages remaining",
    );

    await user.clear(textarea);
    await user.type(textarea, "What did Allen build in FitQuest?{Enter}");

    const answerCard = await screen.findByTestId("ask-resume-answer-card");
    expect(answerCard).toHaveTextContent(/FitQuest/i);
    expect(within(answerCard).getByRole("button", { name: "[Project: FitQuest]" })).toBeInTheDocument();
    expect(screen.getByTestId("ask-resume-quota-counter")).toHaveTextContent(
      "14 / 15 messages remaining",
    );
  });

  it("politely refuses off-topic trivia and unrelated coding prompts without fabricating claims", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Offline"));

    render(<HomePage />);
    await user.click(screen.getByTestId("floating-ask-resume-trigger"));

    const textarea = screen.getByTestId("ask-resume-input");
    await user.type(textarea, "What is the capital of France?{Enter}");

    const firstRefusal = await screen.findByTestId("ask-resume-answer-card");
    expect(within(firstRefusal).getByTestId("ask-resume-mode-badge")).toHaveTextContent(
      /Guardrail/i,
    );
    expect(firstRefusal).toHaveTextContent(ALLEN_CONTACT_EMAIL);
    expect(firstRefusal.textContent).not.toMatch(/Paris/i);
    expect(within(firstRefusal).queryByTestId("ask-resume-citation-badge")).not.toBeInTheDocument();

    await user.type(textarea, "Write me a snake game{Enter}");
    await waitFor(() => {
      expect(screen.getAllByTestId("ask-resume-answer-card")).toHaveLength(2);
    });
    const cards = screen.getAllByTestId("ask-resume-answer-card");
    expect(within(cards[1]).getByTestId("ask-resume-mode-badge")).toHaveTextContent(
      /Guardrail/i,
    );
  });

  it("locks inputs at 0 / 15 messages remaining and shows #38BDF8 cap banner with Copy Email and Open in Gmail", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Offline"));

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    window.sessionStorage.setItem(
      ASK_RESUME_SESSION_STORAGE_KEY,
      JSON.stringify({ usedMessages: 14 }),
    );

    render(<HomePage />);
    await user.click(screen.getByTestId("floating-ask-resume-trigger"));

    expect(screen.getByTestId("ask-resume-quota-counter")).toHaveTextContent(
      "1 / 15 messages remaining",
    );

    await user.click(screen.getByRole("button", { name: STARTER_PROMPTS[2] }));
    await screen.findByTestId("ask-resume-answer-card");

    expect(screen.getByTestId("ask-resume-quota-counter")).toHaveTextContent(
      "0 / 15 messages remaining",
    );
    expect(screen.getByTestId("ask-resume-input")).toBeDisabled();
    expect(screen.getByTestId("ask-resume-submit")).toBeDisabled();

    const capBanner = screen.getByTestId("ask-resume-cap-banner");
    expect(capBanner.className).toContain("bg-[#38BDF8]");
    expect(capBanner).toHaveTextContent(
      `Session cap reached — email Allen directly at ${ALLEN_CONTACT_EMAIL}`,
    );

    const copyBtn = within(capBanner).getByTestId("cap-banner-copy-email");
    await user.click(copyBtn);
    expect(writeText).toHaveBeenCalledWith(ALLEN_CONTACT_EMAIL);
    expect(copyBtn).toHaveTextContent("Copied!");

    const gmailLink = within(capBanner).getByTestId("cap-banner-open-gmail");
    expect(gmailLink).toHaveAttribute(
      "href",
      `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(ALLEN_CONTACT_EMAIL)}`,
    );
    expect(gmailLink).toHaveAttribute("target", "_blank");
    expect(gmailLink).toHaveAttribute("rel", "noopener noreferrer");

    // Clear Chat at 0 / 15 keeps starter chips locked and cap banner visible
    await user.click(screen.getByTestId("ask-resume-clear-chat"));
    expect(screen.getByTestId("ask-resume-cap-banner")).toBeInTheDocument();
    for (const chip of screen.getAllByTestId("ask-resume-starter-chip")) {
      expect(chip).toBeDisabled();
    }
  });

  it("renders inline error state with mailto link and Retry recovery without double-charging quota", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("Service Unavailable", { status: 503 }))
      .mockResolvedValueOnce(
        createSseResponse([
          `data: ${JSON.stringify({
            type: "token",
            delta: "Allen built SuhayCore with .NET 10. [Work: Orani Suhay Foundation]",
          })}\n\n`,
          `data: ${JSON.stringify({
            type: "done",
            response: {
              answer:
                "Allen built SuhayCore with .NET 10. [Work: Orani Suhay Foundation]",
              citations: [
                {
                  section: "Work Experience - Orani Suhay Foundation",
                  snippet: "SuhayCore in .NET 10, Blazor, PostgreSQL.",
                  badge_label: "[Work: Orani Suhay Foundation]",
                  target_section_id: "experience",
                  target_card_id: "card-work-suhay",
                },
              ],
              mode: "gemini-rag",
              is_off_topic: false,
              model_used: "gemini-3.5-flash-lite",
              suggested_followups: STARTER_PROMPTS,
            },
          })}\n\n`,
        ]),
      );

    render(<HomePage />);
    await user.click(screen.getByTestId("floating-ask-resume-trigger"));

    await user.click(screen.getByRole("button", { name: STARTER_PROMPTS[0] }));

    const inlineError = await screen.findByTestId("ask-resume-inline-error");
    expect(screen.getByTestId("ask-resume-quota-counter")).toHaveTextContent(
      "15 / 15 messages remaining",
    );
    expect(
      within(inlineError).getByRole("link", { name: ALLEN_CONTACT_EMAIL }),
    ).toHaveAttribute("href", `mailto:${ALLEN_CONTACT_EMAIL}`);

    const retryButton = within(inlineError).getByTestId("ask-resume-retry-button");
    await user.click(retryButton);

    const answerCard = await screen.findByTestId("ask-resume-answer-card");
    expect(answerCard).toHaveTextContent("Allen built SuhayCore with .NET 10.");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("ask-resume-quota-counter")).toHaveTextContent(
      "14 / 15 messages remaining",
    );
  });

  it("wires all 5 canonical inline citation badges to their deterministic portfolio cards", async () => {
    const user = userEvent.setup();
    const scrollIntoViewMock = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createSseResponse([
        `data: ${JSON.stringify({
          type: "token",
          delta:
            "Summary [Work: Orani Suhay Foundation] [Work: DACON Corp] [Project: FitQuest] [Education: BPSU] [Certifications]",
        })}\n\n`,
        `data: ${JSON.stringify({
          type: "done",
          response: {
            answer:
              "Summary [Work: Orani Suhay Foundation] [Work: DACON Corp] [Project: FitQuest] [Education: BPSU] [Certifications]",
            citations: [
              {
                section: "Work Experience - Orani Suhay Foundation",
                snippet: "SuhayCore",
                badge_label: "[Work: Orani Suhay Foundation]",
                target_section_id: "experience",
                target_card_id: "card-work-suhay",
              },
              {
                section: "Work Experience - DACON Corporation",
                snippet: "DAN RAG AI",
                badge_label: "[Work: DACON Corp]",
                target_section_id: "experience",
                target_card_id: "card-work-dacon",
              },
              {
                section: "Projects - FitQuest",
                snippet: "FitQuest Kotlin",
                badge_label: "[Project: FitQuest]",
                target_section_id: "experience",
                target_card_id: "card-project-fitquest",
              },
              {
                section: "Education",
                snippet: "BPSU BSCS",
                badge_label: "[Education: BPSU]",
                target_section_id: "education",
                target_card_id: "card-education-bpsu",
              },
              {
                section: "Certifications",
                snippet: "Certiport & Cisco",
                badge_label: "[Certifications]",
                target_section_id: "certifications",
                target_card_id: "card-certifications",
              },
            ],
            mode: "gemini-rag",
            is_off_topic: false,
            model_used: "gemini-3.5-flash-lite",
            suggested_followups: STARTER_PROMPTS,
          },
        })}\n\n`,
      ]),
    );

    render(<HomePage />);
    await user.click(screen.getByTestId("floating-ask-resume-trigger"));
    await user.click(screen.getByRole("button", { name: STARTER_PROMPTS[0] }));

    const answerCard = await screen.findByTestId("ask-resume-answer-card");
    const pairs: Array<[string, string]> = [
      ["[Work: Orani Suhay Foundation]", "card-work-suhay"],
      ["[Work: DACON Corp]", "card-work-dacon"],
      ["[Project: FitQuest]", "card-project-fitquest"],
      ["[Education: BPSU]", "card-education-bpsu"],
      ["[Certifications]", "card-certifications"],
    ];

    for (const [badgeLabel, cardId] of pairs) {
      const badgeButton = within(answerCard).getByRole("button", { name: badgeLabel });
      await user.click(badgeButton);
      const targetCard = document.getElementById(cardId);
      expect(targetCard).not.toBeNull();
      await waitFor(() => {
        expect(targetCard).toHaveAttribute("data-highlighted", "true");
      });
    }

    expect(scrollIntoViewMock).toHaveBeenCalledTimes(5);
  });
});
