import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StickyHeader } from "@/components/sections/StickyHeader";
import { metadata } from "@/app/layout";

describe("004-update-logo-favicon: Sticky Header Logo & Browser Favicon", () => {
  it("US1: renders /images/others/logo.png inside the 32x32 Neo-Brutalist badge without 'AJ' and preserves #top link accessible name", () => {
    const { container } = render(
      <StickyHeader
        activeSection="experience"
        onSelectSection={vi.fn()}
        onOpenAskResume={vi.fn()}
      />,
    );

    const header = screen.getByRole("banner");
    const brandLink = within(header).getByRole("link", {
      name: "Allen James Laxamana",
    });
    expect(brandLink).toHaveAttribute("href", "#top");
    expect(within(header).queryByText("AJ")).toBeNull();

    const logoImg = container.querySelector('a[href="#top"] img');
    expect(logoImg).not.toBeNull();
    const decodedSrc = decodeURIComponent(logoImg?.getAttribute("src") ?? "");
    expect(decodedSrc).toContain("/images/others/logo.png");
    expect(logoImg).toHaveAttribute("width", "32");
    expect(logoImg).toHaveAttribute("height", "32");
    expect(logoImg?.className).toContain("object-contain");

    const badgeContainer = logoImg?.parentElement;
    expect(badgeContainer).toHaveAttribute("aria-hidden", "true");
    expect(badgeContainer?.className).toContain("h-8");
    expect(badgeContainer?.className).toContain("w-8");
    expect(badgeContainer?.className).toContain("border-2");
    expect(badgeContainer?.className).toContain("border-[#0F172A]");
    expect(badgeContainer?.className).toContain("shadow-[4px_4px_0px_#0F172A]");
    expect(badgeContainer?.className).toContain("overflow-hidden");
  });

  it("US2: configures RootLayout metadata.icons (icon, shortcut, apple) to /images/others/logo.png while preserving title and description", () => {
    expect(metadata.title).toBe(
      "Allen James Laxamana | Junior .NET / Full-Stack Developer",
    );
    expect(metadata.description).toContain("Portfolio of Allen James Laxamana");
    expect(metadata.icons).toEqual({
      icon: "/images/others/logo.png",
      shortcut: "/images/others/logo.png",
      apple: "/images/others/logo.png",
    });
  });
});
