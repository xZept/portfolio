import { act, render, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";

const RESUME_PATH = "/resume/Laxamana_Resume_DotNet_FullStack.pdf";
const RESUME_FILENAME = "Laxamana_Resume_DotNet_FullStack.pdf";

describe("Hero Download Resume Button (003-hero-download-resume)", () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:http://localhost:3000/mock-resume-url");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it("renders Download Resume adjacent to Ask My Resume with Neo-Brutalist tokens and responsive wrap", () => {
    render(<HomePage />);

    const heroSection = document.getElementById("top");
    expect(heroSection).not.toBeNull();

    const askButton = within(heroSection as HTMLElement).getByRole("button", {
      name: /Ask My Resume/i,
    });
    const downloadButton = within(heroSection as HTMLElement).getByRole("button", {
      name: "Download Resume",
    });

    expect(downloadButton).toBeInTheDocument();
    expect(downloadButton.parentElement).toBe(askButton.parentElement);
    expect(downloadButton.parentElement?.className).toContain("flex-wrap");
    expect(downloadButton.className).toContain("border-2");
    expect(downloadButton.className).toContain("border-[#0F172A]");
    expect(downloadButton.className).toContain("shadow-[4px_4px_0px_#0F172A]");
    expect(downloadButton.className).toContain("focus-visible:outline-2");
    expect(downloadButton.className).toContain("bg-[#FFFFFF]");
    expect(downloadButton).toHaveAttribute("data-state", "idle");

    const icons = downloadButton.querySelectorAll("svg");
    expect(icons).toHaveLength(1);
    expect(icons[0]).toHaveAttribute("aria-hidden", "true");
  });

  it("fetches PDF as Blob, downloads with clean filename, shows Downloaded confirmation, and resets after 2500ms", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    let capturedHref = "";
    let capturedDownload = "";
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        capturedHref = this.href;
        capturedDownload = this.download;
      });

    const pdfBlob = new Blob(["%PDF-1.4 mock"], { type: "application/pdf" });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve(
        new Response(pdfBlob, {
          status: 200,
          headers: { "Content-Type": "application/pdf" },
        }),
      ),
    );

    render(<HomePage />);

    const heroSection = document.getElementById("top") as HTMLElement;
    const downloadButton = within(heroSection).getByRole("button", {
      name: "Download Resume",
    });

    await user.click(downloadButton);

    expect(fetchSpy).toHaveBeenCalledWith(RESUME_PATH);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(capturedHref).toBe("blob:http://localhost:3000/mock-resume-url");
    expect(capturedDownload).toBe(RESUME_FILENAME);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(
      "blob:http://localhost:3000/mock-resume-url",
    );

    await waitFor(() => {
      expect(downloadButton).toHaveTextContent("Downloaded");
    });
    expect(downloadButton).toHaveAttribute("data-state", "downloaded");
    expect(downloadButton.className).toContain("bg-[#38BDF8]");

    const statusRegion = within(heroSection).getByRole("status");
    expect(statusRegion).toHaveAttribute("aria-live", "polite");
    expect(statusRegion).toHaveTextContent("Resume downloaded");

    // Rapid click while in Downloaded state clears prior timer and restarts 2500ms window
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    expect(downloadButton).toHaveTextContent("Downloaded");

    await user.click(downloadButton);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    await waitFor(() => {
      expect(downloadButton).toHaveTextContent("Downloaded");
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(downloadButton).toHaveTextContent("Downloaded");

    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(downloadButton).toHaveTextContent("Download Resume");
    expect(downloadButton).toHaveAttribute("data-state", "idle");
    expect(statusRegion).toHaveTextContent("");
  });

  it("does not show Downloaded on 404 or network failure and announces unavailability via aria-live", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("Not Found", { status: 404 }))
      .mockRejectedValueOnce(new Error("Network offline"));

    render(<HomePage />);

    const heroSection = document.getElementById("top") as HTMLElement;
    const downloadButton = within(heroSection).getByRole("button", {
      name: "Download Resume",
    });
    const statusRegion = within(heroSection).getByRole("status");

    // 404 response
    await user.click(downloadButton);

    await waitFor(() => {
      expect(downloadButton).toHaveTextContent("Resume Unavailable");
    });
    expect(downloadButton).toHaveAttribute("data-state", "error");
    expect(downloadButton).not.toHaveTextContent("Downloaded");
    expect(statusRegion).toHaveAttribute("aria-live", "polite");
    expect(statusRegion).toHaveTextContent("Resume file is currently unavailable");
    expect(clickSpy).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(2600);
    });
    expect(downloadButton).toHaveTextContent("Download Resume");
    expect(downloadButton).toHaveAttribute("data-state", "idle");

    // Network failure
    await user.click(downloadButton);

    await waitFor(() => {
      expect(downloadButton).toHaveTextContent("Resume Unavailable");
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(downloadButton).not.toHaveTextContent("Downloaded");
    expect(statusRegion).toHaveTextContent("Resume file is currently unavailable");
    expect(clickSpy).not.toHaveBeenCalled();
  });
});
