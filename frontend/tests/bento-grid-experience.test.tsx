import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ExperienceSection } from "@/components/sections/ExperienceSection";
import { EXPERIENCE_ENTRIES } from "@/data/resume";

describe("005-bento-grid-experience: ExperienceSection Bento Grid", () => {
  it("US1: renders a responsive 12-column Bento Grid with explicit colSpan/rowSpan and preserves callbacks", async () => {
    const user = userEvent.setup();
    const onOpenCaseStudy = vi.fn();
    const onAskAiAboutProject = vi.fn();

    render(
      <ExperienceSection
        onOpenCaseStudy={onOpenCaseStudy}
        onAskAiAboutProject={onAskAiAboutProject}
      />,
    );

    const grid = screen.getByTestId("experience-bento-grid");
    expect(grid.className).toContain("grid");
    expect(grid.className).toContain("grid-cols-1");
    expect(grid.className).toContain("lg:grid-cols-12");

    const suhayCard = document.getElementById("card-work-suhay");
    const danCard = document.getElementById("card-work-dacon");
    const fitquestCard = document.getElementById("card-project-fitquest");

    expect(suhayCard).not.toBeNull();
    expect(danCard).not.toBeNull();
    expect(fitquestCard).not.toBeNull();

    expect(suhayCard!.className).toContain("lg:col-span-12");
    expect(suhayCard!.className).toContain("lg:row-span-1");
    expect(suhayCard!.className).toContain("lg:grid");
    expect(suhayCard!.className).toContain("lg:grid-cols-12");

    expect(danCard!.className).toContain("lg:col-span-7");
    expect(danCard!.className).toContain("lg:row-span-1");

    expect(fitquestCard!.className).toContain("lg:col-span-5");
    expect(fitquestCard!.className).toContain("lg:row-span-1");

    // Verify DOM source order matches SuhayCore -> DAN -> FitQuest
    const cardIds = Array.from(grid.children).map((el) => el.id);
    expect(cardIds).toEqual(["card-work-suhay", "card-work-dacon", "card-project-fitquest"]);

    // Verify interactive callbacks fire with the expected entry
    await user.click(within(suhayCard!).getByRole("button", { name: /View Case Study/i }));
    expect(onOpenCaseStudy).toHaveBeenCalledWith(EXPERIENCE_ENTRIES[0]);

    await user.click(within(danCard!).getByRole("button", { name: /Ask AI about this/i }));
    expect(onAskAiAboutProject).toHaveBeenCalledWith(EXPERIENCE_ENTRIES[1]);

    await user.click(within(fitquestCard!).getByRole("button", { name: /View Case Study/i }));
    expect(onOpenCaseStudy).toHaveBeenCalledWith(EXPERIENCE_ENTRIES[2]);
  });

  it("US2: enforces min-w-0 max-w-full overflow-hidden and fixed aspect-video object-contain media stages", () => {
    render(
      <ExperienceSection
        onOpenCaseStudy={vi.fn()}
        onAskAiAboutProject={vi.fn()}
      />,
    );

    const cardIds = ["card-work-suhay", "card-work-dacon", "card-project-fitquest"];
    for (const id of cardIds) {
      const card = document.getElementById(id)!;
      expect(card.className).toContain("min-w-0");
      expect(card.className).toContain("max-w-full");
      expect(card.className).toContain("overflow-hidden");
    }

    for (const entry of EXPERIENCE_ENTRIES) {
      const stage = screen.getByTestId(`bento-media-stage-${entry.id}`);
      expect(stage.className).toContain("aspect-video");
      expect(stage.className).toContain("min-w-0");
      expect(stage.className).toContain("max-w-full");
      expect(stage.className).toContain("overflow-hidden");
      expect(stage.className).not.toContain("aspect-[16/10]");

      const img = within(stage).getByAltText(`${entry.title} visual preview`);
      expect(img.className).toContain("object-contain");
      expect(img.className).not.toContain("object-cover");
      expect(img.getAttribute("src")).toContain(
        entry.previewImage.replace("/images/projects/", ""),
      );
    }
  });

  it("US3: reserves shadow-clearance padding and preserves Neo-Brutalist borders, shadows, and highlight rings", () => {
    render(
      <ExperienceSection
        onOpenCaseStudy={vi.fn()}
        onAskAiAboutProject={vi.fn()}
      />,
    );

    const grid = screen.getByTestId("experience-bento-grid");
    expect(grid.className).toContain("pb-2");
    expect(grid.className).toContain("pr-1");

    const cardIds = ["card-work-suhay", "card-work-dacon", "card-project-fitquest"];
    for (const id of cardIds) {
      const card = document.getElementById(id)!;
      expect(card.className).toContain("border-2");
      expect(card.className).toContain("border-[#0F172A]");
      expect(card.className).toContain("shadow-[4px_4px_0px_#0F172A]");
      expect(card.className).toContain("data-[highlighted=true]:ring-4");
      expect(card.className).toContain("data-[highlighted=true]:ring-[#38BDF8]");
    }
  });
});
