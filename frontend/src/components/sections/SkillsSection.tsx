"use client";

import * as React from "react";
import { SKILL_CATEGORIES, SKILL_NODES } from "@/data/resume";
import { TechGlobe3D } from "@/components/sections/TechGlobe3D";
import { CategorizedPillTable } from "@/components/sections/CategorizedPillTable";

export function SkillsSection() {
  const [selectedSkillId, setSelectedSkillId] = React.useState<string | null>(null);

  const selectedNode = React.useMemo(
    () => SKILL_NODES.find((node) => node.id === selectedSkillId) ?? null,
    [selectedSkillId],
  );

  return (
    <section
      id="skills"
      aria-labelledby="skills-heading"
      className="nb-section-divider bg-[#F8FAFC] py-14 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-block border-2 border-[#0F172A] bg-[#38BDF8] px-3 py-1 text-xs font-black uppercase tracking-wider text-[#0F172A] shadow-[4px_4px_0px_#0F172A]">
              03 / Skills &amp; Architecture
            </span>
            <h2
              id="skills-heading"
              className="mt-4 text-3xl font-black tracking-tight text-[#0F172A] sm:text-4xl"
            >
              Technical Stack &amp; 3D Globe
            </h2>
          </div>
          <p className="max-w-md text-sm font-medium text-[#0F172A]">
            Explore all 22 core technical skills in 3D space or select any skill pill below to inspect where it was applied.
          </p>
        </div>

        <TechGlobe3D
          nodes={SKILL_NODES}
          selectedSkillId={selectedSkillId}
          onSelectSkill={setSelectedSkillId}
        />

        <CategorizedPillTable
          categories={SKILL_CATEGORIES}
          selectedNode={selectedNode}
          onSelectSkill={setSelectedSkillId}
        />
      </div>
    </section>
  );
}
