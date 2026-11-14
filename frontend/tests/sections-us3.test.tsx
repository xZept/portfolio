import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AboutSection } from "@/components/sections/AboutSection";
import { EducationSection } from "@/components/sections/EducationSection";
import { CertificationsSection } from "@/components/sections/CertificationsSection";

describe("User Story 3: About, Education & Certifications", () => {
  it("renders About narrative bio and all 4 chronological Timeline / Milestones", () => {
    render(<AboutSection />);

    expect(screen.getByText(/Timeline \/ Milestones/i)).toBeInTheDocument();
    expect(screen.getByText("2025")).toBeInTheDocument();
    expect(screen.getByText("FitQuest")).toBeInTheDocument();
    expect(screen.getByText("Feb 2026")).toBeInTheDocument();
    expect(screen.getByText("DACON Systems Internship")).toBeInTheDocument();
    expect(screen.getByText("Mar 2026")).toBeInTheDocument();
    expect(screen.getByText("SuhayCore .NET 10 Lead")).toBeInTheDocument();
    expect(screen.getByText("2026")).toBeInTheDocument();
    expect(screen.getByText("BS Computer Science Grad")).toBeInTheDocument();
  });

  it("renders Education card for BPSU with exact degree, years, location, and emblem image", () => {
    render(<EducationSection />);

    expect(screen.getByText("Bataan Peninsula State University (BPSU)")).toBeInTheDocument();
    expect(screen.getByText("Bachelor of Science in Computer Science")).toBeInTheDocument();
    expect(screen.getByText("2022 – 2026")).toBeInTheDocument();
    expect(screen.getByText("Balanga, Bataan")).toBeInTheDocument();

    const emblem = screen.getByAltText("Bataan Peninsula State University (BPSU) emblem");
    expect(emblem.getAttribute("src")).toContain("bataan-peninsula-state-university.png");
  });

  it("renders all 5 Certifications with assigned Pearson/Microsoft and Cisco logos", () => {
    render(<CertificationsSection />);

    const titles = [
      "IT Specialist in JavaScript",
      "IT Specialist in Cybersecurity",
      "IT Specialist in HTML & CSS",
      "IT Specialist in Software Development",
      "Cisco Cyber Threat Management",
    ];
    for (const title of titles) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }

    const pearsonLogos = screen.getAllByAltText("Certiport / Pearson VUE logo");
    expect(pearsonLogos).toHaveLength(4);
    for (const img of pearsonLogos) {
      expect(img.getAttribute("src")).toContain("pearson.png");
    }

    const microsoftLogos = screen.getAllByAltText("Microsoft IT Specialist co-brand logo");
    expect(microsoftLogos).toHaveLength(4);
    for (const img of microsoftLogos) {
      expect(img.getAttribute("src")).toContain("microsoft.png");
    }

    const ciscoLogo = screen.getByAltText("Cisco logo");
    expect(ciscoLogo.getAttribute("src")).toContain("cisco.png");

    const section = screen.getByRole("region", { name: /Verified Industry Credentials/i });
    expect(within(section).getAllByText("Certiport / Pearson VUE")).toHaveLength(4);
    expect(within(section).getByText("Cisco")).toBeInTheDocument();
  });
});
