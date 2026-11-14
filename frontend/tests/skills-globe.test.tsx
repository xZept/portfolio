import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SkillsSection } from "@/components/sections/SkillsSection";
import { SKILL_CATEGORIES, SKILL_NODES } from "@/data/resume";

describe("User Story 2: Interactive 3D Tech Globe & Categorized Pill Table", () => {
  it("renders the #0B1120 3D Tech Globe container with all 22 skill nodes", () => {
    render(<SkillsSection />);

    const globeCard = screen.getByTestId("tech-globe-container");
    expect(globeCard.className).toContain("bg-[#0B1120]");

    expect(SKILL_NODES).toHaveLength(22);
    for (const node of SKILL_NODES) {
      expect(within(globeCard).getByTestId(`globe-node-${node.id}`)).toBeInTheDocument();
    }
  });

  it("renders all 4 exact resume skill categories and pills in the Categorized Pill Table", () => {
    render(<SkillsSection />);

    const tableRegion = screen.getByRole("region", {
      name: /Categorized Resume Skills and Engineering Practices/i,
    });

    for (const group of SKILL_CATEGORIES) {
      expect(within(tableRegion).getByRole("rowheader", { name: group.category })).toBeInTheDocument();
      for (const pill of group.items) {
        expect(within(tableRegion).getByRole("button", { name: pill })).toBeInTheDocument();
      }
    }
  });

  it("synchronizes selection between a 3D globe node and the Categorized Pill Table", async () => {
    const user = userEvent.setup();
    render(<SkillsSection />);

    const blazorNode = screen.getByTestId("globe-node-blazor-mudblazor");
    await user.click(blazorNode);

    const summary = screen.getByTestId("globe-selected-summary");
    expect(within(summary).getByText("Blazor / MudBlazor")).toBeInTheDocument();
    expect(within(summary).getByText("Frameworks & Web")).toBeInTheDocument();
    expect(within(summary).getByText(/SuhayCore/i)).toBeInTheDocument();

    const tableRegion = screen.getByRole("region", {
      name: /Categorized Resume Skills and Engineering Practices/i,
    });
    const tablePill = within(tableRegion).getByRole("button", { name: "Blazor (MudBlazor)" });
    expect(tablePill).toHaveAttribute("data-highlighted", "true");
    expect(tablePill.className).toContain("bg-[#38BDF8]");

    // Clicking a different pill in the table updates the globe summary badge
    const fastApiPill = within(tableRegion).getByRole("button", { name: "FastAPI" });
    await user.click(fastApiPill);
    expect(within(summary).getByText("FastAPI")).toBeInTheDocument();
    expect(within(summary).getByText(/DACON Corporation/i)).toBeInTheDocument();
  });
});
