"use client";

import * as React from "react";
import { CalendarDays, Milestone } from "lucide-react";
import { MILESTONE_ITEMS, PROFILE_SUMMARY } from "@/data/resume";
import { Card } from "@/components/ui/card";

export function AboutSection() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="nb-section-divider bg-[#FFFFFF] py-14 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <span className="inline-block border-2 border-[#0F172A] bg-[#38BDF8] px-3 py-1 text-xs font-black uppercase tracking-wider text-[#0F172A] shadow-[4px_4px_0px_#0F172A]">
            02 / About &amp; Journey
          </span>
          <h2
            id="about-heading"
            className="mt-4 text-3xl font-black tracking-tight text-[#0F172A] sm:text-4xl"
          >
            From BPSU Computer Science to Production Systems
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-6 space-y-5">
            {PROFILE_SUMMARY.aboutNarrative.map((paragraph, index) => (
              <p
                key={index}
                className="text-base leading-relaxed text-[#0F172A] sm:text-[1.05rem]"
              >
                {paragraph}
              </p>
            ))}
          </div>

          <div className="lg:col-span-6">
            <Card tone="white" className="overflow-hidden">
              <div className="flex items-center justify-between border-b-2 border-[#0F172A] bg-[#38BDF8] px-5 py-3.5">
                <h3 className="flex items-center gap-2 text-base font-black uppercase tracking-wide text-[#0F172A]">
                  <Milestone className="h-5 w-5" aria-hidden="true" />
                  <span>Timeline / Milestones</span>
                </h3>
                <span className="font-mono text-xs font-black text-[#0F172A]">
                  2025 – 2026
                </span>
              </div>

              <ol className="divide-y-2 divide-[#0F172A] bg-[#FFFFFF]">
                {MILESTONE_ITEMS.map((item) => (
                  <li key={item.id} className="p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 border-2 border-[#0F172A] bg-[#F8FAFC] px-2.5 py-0.5 font-mono text-xs font-black text-[#0F172A]">
                        <CalendarDays className="h-3.5 w-3.5 text-[#0284C7]" aria-hidden="true" />
                        {item.dateLabel}
                      </span>
                      <h4 className="text-base font-black text-[#0F172A]">{item.title}</h4>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[#0F172A]">
                      {item.description}
                    </p>
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
