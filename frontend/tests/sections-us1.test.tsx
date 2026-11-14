import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("User Story 1: Sticky Header, Hero & Experience Showcase", () => {
  it("renders sticky header with brand, anchor links, active sky-blue pill, and Ask My Resume trigger", async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    const header = screen.getByRole("banner");
    expect(within(header).getByText("Allen James Laxamana")).toBeInTheDocument();

    const primaryNav = within(header).getByRole("navigation", { name: "Primary navigation" });
    for (const label of [
      "Experience",
      "About",
      "Skills",
      "Education",
      "Certifications",
      "Contact",
    ]) {
      expect(within(primaryNav).getByRole("link", { name: label })).toBeInTheDocument();
    }

    const experienceLink = within(primaryNav).getByRole("link", { name: "Experience" });
    expect(experienceLink).toHaveAttribute("data-active", "true");
    expect(experienceLink.className).toContain("bg-[#38BDF8]");

    const skillsLink = within(primaryNav).getByRole("link", { name: "Skills" });
    await user.click(skillsLink);
    expect(skillsLink).toHaveAttribute("data-active", "true");
    expect(skillsLink.className).toContain("bg-[#38BDF8]");

    expect(within(header).getAllByRole("button", { name: /Ask My Resume/i }).length).toBeGreaterThan(0);
  });

  it("renders Hero section with headline, framed photo, Full-Stack & AI badge, and CTAs", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Junior .NET / Full-Stack Developer" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/C#, ASP\.NET Core, Blazor, PostgreSQL, REST APIs/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /See my experience/i })).toHaveAttribute(
      "href",
      "#experience",
    );
    expect(screen.getByText("Full-Stack & AI")).toBeInTheDocument();

    const photo = screen.getByAltText("Allen James Laxamana portrait");
    expect(photo.getAttribute("src")).toContain("my-photo.png");
  });

  it("renders SuhayCore, DAN, and FitQuest cards and opens Case Study modal", async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    const expSection = screen.getByRole("region", {
      name: /Shipped Systems & Internships/i,
    });

    expect(within(expSection).getByText("SuhayCore")).toBeInTheDocument();
    expect(within(expSection).getByText("In UAT")).toBeInTheDocument();
    expect(within(expSection).getByText("DAN (Enterprise RAG AI)")).toBeInTheDocument();
    expect(within(expSection).getByText("Shipped")).toBeInTheDocument();
    expect(within(expSection).getByText("FitQuest")).toBeInTheDocument();
    expect(within(expSection).getByText("Android")).toBeInTheDocument();

    expect(
      within(expSection).getByAltText("SuhayCore visual preview").getAttribute("src"),
    ).toContain("suhaycore.png");
    expect(
      within(expSection).getByAltText("DAN (Enterprise RAG AI) visual preview").getAttribute("src"),
    ).toContain("dan.png");
    expect(
      within(expSection).getByAltText("FitQuest visual preview").getAttribute("src"),
    ).toContain("fitquest.gif");

    const caseStudyButtons = within(expSection).getAllByRole("button", {
      name: /View Case Study/i,
    });
    expect(caseStudyButtons).toHaveLength(3);

    await user.click(caseStudyButtons[0]);
    expect(screen.getByText("SuhayCore — Case Study")).toBeInTheDocument();
    expect(
      screen.getByText(/Orani Suhay Foundation, Inc\. needed a unified internal web platform/i),
    ).toBeInTheDocument();
  });
});
