"use client";

import * as React from "react";
import Image from "next/image";
import { Calendar, FileText, MapPin, MessageSquareText } from "lucide-react";
import { EXPERIENCE_ENTRIES, type ExperienceEntry } from "@/data/resume";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ExperienceSectionProps {
  onOpenCaseStudy: (entry: ExperienceEntry) => void;
  onAskAiAboutProject: (entry: ExperienceEntry) => void;
}

const EXPERIENCE_CARD_IDS: Record<ExperienceEntry["id"], string> = {
  suhaycore: "card-work-suhay",
  dan: "card-work-dacon",
  fitquest: "card-project-fitquest",
};

export function ExperienceSection({
  onOpenCaseStudy,
  onAskAiAboutProject,
}: ExperienceSectionProps) {
  return (
    <section
      id="experience"
      aria-labelledby="experience-heading"
      className="nb-section-divider bg-[#F8FAFC] py-14 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-block border-2 border-[#0F172A] bg-[#38BDF8] px-3 py-1 text-xs font-black uppercase tracking-wider text-[#0F172A] shadow-[4px_4px_0px_#0F172A]">
              01 / Experience &amp; Projects
            </span>
            <h2
              id="experience-heading"
              className="mt-4 text-3xl font-black tracking-tight text-[#0F172A] sm:text-4xl"
            >
              Shipped Systems &amp; Internships
            </h2>
          </div>
          <p className="max-w-md text-sm font-medium text-[#0F172A]">
            Production-bound .NET 10 platforms, enterprise RAG AI systems, and offline-first Android applications.
          </p>
        </div>

        <div
          data-testid="experience-bento-grid"
          className="grid grid-cols-1 gap-6 pb-2 pr-1 sm:gap-8 lg:grid-cols-12"
        >
          {EXPERIENCE_ENTRIES.map((entry) => {
            const isHorizontalSplit = entry.bento.cardLayout === "horizontal-split";
            return (
              <Card
                key={entry.id}
                id={EXPERIENCE_CARD_IDS[entry.id]}
                tone="white"
                className={`flex min-w-0 max-w-full flex-col overflow-hidden transition-shadow data-[highlighted=true]:ring-4 data-[highlighted=true]:ring-[#38BDF8] ${entry.bento.colSpan} ${entry.bento.rowSpan} ${
                  isHorizontalSplit ? "lg:grid lg:grid-cols-12" : ""
                }`}
              >
                <div
                  className={`relative min-w-0 max-w-full overflow-hidden border-b-2 border-[#0F172A] bg-[#F8FAFC] ${
                    isHorizontalSplit
                      ? "lg:col-span-6 lg:flex lg:flex-col lg:border-b-0 lg:border-r-2"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between border-b-2 border-[#0F172A] bg-[#FFFFFF] px-4 py-2.5">
                    <Badge
                      variant={entry.statusBadge === "In UAT" ? "sky" : "white"}
                      className="shadow-none"
                    >
                      {entry.statusBadge}
                    </Badge>
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#0F172A]">
                      <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                      {entry.dateRange}
                    </span>
                  </div>

                  <div
                    data-testid={`bento-media-stage-${entry.id}`}
                    className={`relative aspect-video w-full min-w-0 max-w-full overflow-hidden bg-[#F8FAFC] bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:16px_16px] ${
                      isHorizontalSplit ? "lg:my-auto" : ""
                    }`}
                  >
                    <Image
                      src={entry.previewImage}
                      alt={`${entry.title} visual preview`}
                      fill
                      unoptimized={entry.isAnimatedGif}
                      sizes={entry.bento.imageSizes}
                      className="object-contain p-2 sm:p-3"
                    />
                  </div>
                </div>

                <div
                  className={`flex min-w-0 max-w-full flex-1 flex-col justify-between overflow-hidden p-5 sm:p-6 ${
                    isHorizontalSplit ? "lg:col-span-6" : ""
                  }`}
                >
                  <div className="space-y-4">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold uppercase tracking-wide text-[#0284C7]">
                        <span>{entry.organization}</span>
                        <span className="inline-flex items-center gap-1 text-[#0F172A]">
                          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                          {entry.location}
                        </span>
                      </div>
                      <h3 className="mt-1.5 text-2xl font-black tracking-tight text-[#0F172A]">
                        {entry.title}
                      </h3>
                      <p className="text-sm font-bold text-[#0F172A]">{entry.role}</p>
                    </div>

                    <ul className="space-y-2 text-sm leading-relaxed text-[#0F172A]">
                      {entry.impactBullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2">
                          <span
                            aria-hidden="true"
                            className="mt-1.5 h-2 w-2 shrink-0 border border-[#0F172A] bg-[#38BDF8]"
                          />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 space-y-4 border-t-2 border-[#0F172A] pt-4">
                    <div className="flex flex-wrap gap-1.5" aria-label={`${entry.title} technologies`}>
                      {entry.techTags.map((tag) => (
                        <span
                          key={tag}
                          className="border-2 border-[#0F172A] bg-[#F8FAFC] px-2.5 py-1 text-xs font-bold text-[#0F172A]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => onOpenCaseStudy(entry)}
                      >
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        <span>View Case Study</span>
                      </Button>

                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => onAskAiAboutProject(entry)}
                      >
                        <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                        <span>Ask AI about this</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
