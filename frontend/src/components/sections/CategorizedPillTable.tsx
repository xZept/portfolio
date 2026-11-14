"use client";

import * as React from "react";
import { findSkillNodeForPill, type SkillCategoryGroup, type SkillNode } from "@/data/resume";

export interface CategorizedPillTableProps {
  categories: SkillCategoryGroup[];
  selectedNode: SkillNode | null;
  onSelectSkill: (skillId: string | null) => void;
}

export function CategorizedPillTable({
  categories,
  selectedNode,
  onSelectSkill,
}: CategorizedPillTableProps) {
  return (
    <div
      tabIndex={0}
      role="region"
      aria-labelledby="skills-table-caption"
      className="table-wrapper border-2 border-[#0F172A] bg-[#FFFFFF] shadow-[4px_4px_0px_#0F172A]"
    >
      <table className="skills-table">
        <caption id="skills-table-caption" className="sr-only">
          Categorized Resume Skills and Engineering Practices
        </caption>
        <thead>
          <tr className="border-b-2 border-[#0F172A] bg-[#F8FAFC] text-left">
            <th
              scope="col"
              className="w-60 border-b-2 border-r-2 border-[#0F172A] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#0F172A]"
            >
              Category
            </th>
            <th
              scope="col"
              className="border-b-2 border-[#0F172A] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#0F172A]"
            >
              Verified Resume Skills &amp; Practices
            </th>
          </tr>
        </thead>
        <tbody>
          {categories.map((group) => (
            <tr
              key={group.category}
              className="border-b-2 border-[#0F172A] last:border-b-0"
            >
              <th
                scope="row"
                className="border-r-2 border-[#0F172A] bg-[#F8FAFC] px-5 py-4 text-left align-top text-sm font-black text-[#0F172A]"
              >
                {group.category}
              </th>
              <td className="bg-[#FFFFFF] px-5 py-4 align-top">
                <div className="flex flex-wrap gap-2.5">
                  {group.items.map((pill) => {
                    const matchedNode = findSkillNodeForPill(pill);
                    const isHighlighted =
                      selectedNode !== null &&
                      selectedNode.pillMatchLabels.some(
                        (label) => label.toLowerCase() === pill.toLowerCase(),
                      );

                    return (
                      <button
                        key={pill}
                        type="button"
                        data-highlighted={isHighlighted ? "true" : "false"}
                        aria-pressed={isHighlighted}
                        onClick={() => {
                          if (!matchedNode) return;
                          onSelectSkill(
                            selectedNode?.id === matchedNode.id ? null : matchedNode.id,
                          );
                        }}
                        className={`border-2 border-[#0F172A] px-3 py-1.5 text-xs sm:text-sm font-bold transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F172A] ${
                          isHighlighted
                            ? "bg-[#38BDF8] text-[#0F172A] shadow-[4px_4px_0px_#0F172A]"
                            : "bg-[#FFFFFF] text-[#0F172A] hover:bg-[#0284C7] hover:text-[#FFFFFF]"
                        }`}
                      >
                        {pill}
                      </button>
                    );
                  })}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
