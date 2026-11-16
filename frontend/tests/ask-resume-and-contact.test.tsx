import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";
import { askResume, buildLocalFallbackAnswer } from "@/lib/ask-resume-client";

describe("User Story 4: Contact Section & Ask My Resume Hybrid RAG", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders Contact banner with email, Copy email, Write email, phone, location, LinkedIn, and GitHub", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<HomePage />);

    const contactSection = screen.getByRole("region", {
      name: /Ready to build dependable/i,
    });
    expect(within(contactSection).getByText("allenjames.laxamana@gmail.com")).toBeInTheDocument();
    expect(within(contactSection).getByText("+63 945-322-7669")).toBeInTheDocument();
    expect(within(contactSection).getByText("Balanga, Bataan")).toBeInTheDocument();

    const writeEmailLink = within(contactSection).getByRole("link", { name: /Write email/i });
    expect(writeEmailLink).toHaveAttribute("href", "mailto:allenjames.laxamana@gmail.com");

    const linkedIn = within(contactSection).getByRole("link", { name: /LinkedIn/i });
    expect(linkedIn).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/allen-james-laxamana-0673473a5/",
    );

    const github = within(contactSection).getByRole("link", { name: /GitHub/i });
    expect(github).toHaveAttribute("href", "https://github.com/xZept");

    const copyBtn = within(contactSection).getByRole("button", { name: /Copy email/i });
    await user.click(copyBtn);

    expect(writeText).toHaveBeenCalledWith("allenjames.laxamana@gmail.com");
    expect(await within(contactSection).findByRole("button", { name: /Copied!/i })).toBeInTheDocument();
  });

  it("shows selection fallback hint when clipboard access is denied", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockRejectedValue(new Error("Permission denied")),
      },
    });

    render(<HomePage />);
    const copyBtn = screen.getByRole("button", { name: /Copy email/i });
    await user.click(copyBtn);

    expect(await screen.findByTestId("copy-fallback-hint")).toBeInTheDocument();
  });

  it("falls back to local resume grounding when FastAPI backend is offline", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network offline"));

    const result = await askResume({
      question: "What did Allen build in SuhayCore?",
      context_project_id: "suhaycore",
    });

    expect(result.mode).toBe("local-fallback");
    expect(result.answer).toContain("SuhayCore");
    expect(result.answer).toContain(".NET 10");
    expect(result.citations.length).toBeGreaterThanOrEqual(1);
    expect(result.citations[0].section).toBe("Work Experience - Orani Suhay Foundation");
  });

  it("builds deterministic local answers for DAN and FitQuest", () => {
    const danAnswer = buildLocalFallbackAnswer("Tell me about DAN at DACON", "dan");
    expect(danAnswer.answer).toContain("DACON Corporation");
    expect(danAnswer.answer).toContain("FastAPI");

    const fitquestAnswer = buildLocalFallbackAnswer("What is FitQuest?", "fitquest");
    expect(fitquestAnswer.answer).toContain("FoodData Central");
    expect(fitquestAnswer.answer).toContain("Room Database");
  });

  it("opens Ask My Resume drawer pre-filled when clicking Ask AI about this on an Experience card", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Offline"));

    render(<HomePage />);

    const askAiButtons = screen.getAllByRole("button", { name: /Ask AI about this/i });
    await user.click(askAiButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId("ask-resume-answer-card")).toBeInTheDocument();
    });
    expect(screen.getByTestId("ask-resume-mode-badge")).toHaveTextContent(/Local Fallback/i);
  });

  it("submits the Contact inquiry form to POST /api/v1/contact and displays non-blocking confirmation", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        inquiry_id: "c4b9c8e2-901a-4b77-9214-35b1bc8e0f11",
        status: "received",
        triage_status: "pending",
        message: "Thank you for reaching out!",
      }),
    } as Response);

    render(<HomePage />);

    const nameInput = screen.getByLabelText(/^Name/i);
    const emailInput = screen.getByLabelText(/^Email/i);
    const subjectInput = screen.getByLabelText(/^Subject/i);
    const messageInput = screen.getByLabelText(/^Message/i);

    expect(nameInput).toHaveAttribute("aria-invalid", "false");
    expect(emailInput).toHaveAttribute("aria-invalid", "false");
    expect(messageInput).toHaveAttribute("aria-invalid", "false");

    await user.type(nameInput, "Sarah Jenkins");
    await user.type(emailInput, "s.jenkins@techrecruiting.io");
    await user.type(subjectInput, ".NET Full-Stack Role");
    await user.type(messageInput, "We would love to schedule an interview.");

    await user.click(screen.getByRole("button", { name: /Send Message/i }));

    expect(await screen.findByTestId("contact-form-success")).toHaveTextContent(
      /Message received! Allen has been notified and will get back to you shortly\./i,
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [requestUrl, requestInit] = fetchSpy.mock.calls[0];
    expect(String(requestUrl)).toMatch(/\/api\/v1\/contact$/);
    expect(requestInit?.method).toBe("POST");
    expect(JSON.parse(String(requestInit?.body))).toEqual({
      name: "Sarah Jenkins",
      email: "s.jenkins@techrecruiting.io",
      subject: ".NET Full-Stack Role",
      message: "We would love to schedule an interview.",
    });

    expect(nameInput).toHaveValue("");
    expect(emailInput).toHaveValue("");
    expect(subjectInput).toHaveValue("");
    expect(messageInput).toHaveValue("");
  });

  it("validates Contact inquiry fields on submit, sets aria-invalid, and shows server error gracefully", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ detail: "Service temporarily unavailable" }),
    } as Response);

    render(<HomePage />);

    const submitBtn = screen.getByRole("button", { name: /Send Message/i });
    await user.click(submitBtn);

    const nameInput = screen.getByLabelText(/^Name/i);
    expect(nameInput).toHaveAttribute("aria-invalid", "true");
    expect(nameInput).toHaveFocus();
    expect(screen.getByText(/Please enter your name/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();

    await user.type(nameInput, "Alex Rivera");
    await user.type(screen.getByLabelText(/^Email/i), "alex@example.com");
    await user.type(screen.getByLabelText(/^Message/i), "Interested in collaborating.");
    await user.click(submitBtn);

    expect(await screen.findByTestId("contact-form-error")).toHaveTextContent(
      /Service temporarily unavailable/i,
    );
  });
});
