import fs from "node:fs";
import path from "node:path";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

function collectSourceFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectSourceFiles(fullPath));
    } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".css")) {
      results.push(fullPath);
    }
  }
  return results;
}

const PROHIBITED_PATTERNS: RegExp[] = [
  /backdrop-blur/i,
  /backdrop-filter/i,
  /\bshadow-(sm|md|lg|xl|2xl)\b/,
  /\b(from|via|to)-(purple|pink|fuchsia|violet)/i,
  /\bbg-gradient-to\b/,
];

describe("Neo-Brutalist Sky Blue Visual System & Constitution Discipline", () => {
  it("contains zero prohibited blurry shadows, glassmorphism, or purple/pink gradients across src/", () => {
    const srcDir = path.resolve(__dirname, "../src");
    const files = collectSourceFiles(srcDir);
    expect(files.length).toBeGreaterThan(5);

    const fileNames = files.map((file) => path.basename(file));
    expect(fileNames).toContain("FloatingAskTrigger.tsx");
    expect(fileNames).toContain("AskResumeDrawer.tsx");

    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      for (const pattern of PROHIBITED_PATTERNS) {
        expect(
          pattern.test(content),
          `Found prohibited pattern ${pattern.source} in ${file}`,
        ).toBe(false);
      }
    }
  });

  it("defines required Neo-Brutalist Sky Blue tokens in globals.css", () => {
    const globalsPath = path.resolve(__dirname, "../src/app/globals.css");
    const css = fs.readFileSync(globalsPath, "utf-8");

    expect(css).toContain("#F8FAFC");
    expect(css).toContain("#FFFFFF");
    expect(css).toContain("#0B1120");
    expect(css).toContain("#0F172A");
    expect(css).toContain("#38BDF8");
    expect(css).toContain("#0284C7");
    expect(css).toContain("4px 4px 0px #0F172A");
    expect(css).toContain("scroll-margin-top");
  });

  it("renders all 7 mandated sections, deterministic card IDs, floating trigger, and hard offset shadows", () => {
    const { container } = render(<HomePage />);

    for (const sectionId of [
      "top",
      "experience",
      "about",
      "skills",
      "education",
      "certifications",
      "contact",
    ]) {
      expect(container.querySelector(`#${sectionId}`)).not.toBeNull();
    }

    for (const cardId of [
      "card-work-suhay",
      "card-work-dacon",
      "card-project-fitquest",
      "card-education-bpsu",
      "card-certifications",
    ]) {
      expect(container.querySelector(`#${cardId}`)).not.toBeNull();
    }

    expect(
      container.querySelector('[data-testid="floating-ask-resume-trigger"]'),
    ).not.toBeNull();

    const html = container.innerHTML;
    expect(html).toContain("4px_4px_0px_#0F172A");
    expect(html).not.toMatch(/backdrop-blur/);
    expect(html).not.toMatch(/\bshadow-(sm|md|lg|xl|2xl)\b/);
  });
});
