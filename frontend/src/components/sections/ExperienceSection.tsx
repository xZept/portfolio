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

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {EXPERIENCE_ENTRIES.map((entry, idx) => {
            const isFullSpanOnDesktop = idx === 2;
            return (
              <Card
                key={entry.id}
                tone="white"
                className={`flex flex-col overflow-hidden ${
                  isFullSpanOnDesktop ? "lg:col-span-2 lg:grid lg:grid-cols-12" : ""
                }`}
              >
                <div
                  className={`relative border-b-2 border-[#0F172A] bg-[#F8FAFC] ${
                    isFullSpanOnDesktop
                      ? "lg:col-span-5 lg:border-b-0 lg:border-r-2"
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

                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#FFFFFF]">
                    <Image
                      src={entry.previewImage}
                      alt={`${entry.title} visual preview`}
                      fill
                      unoptimized={entry.isAnimatedGif}
                      sizes={
                        isFullSpanOnDesktop
                          ? "(max-width: 1024px) 100vw, 480px"
                          : "(max-width: 1024px) 100vw, 560px"
                      }
                      className="object-cover object-top"
                    />
                  </div>
                </div>

                <div
                  className={`flex flex-1 flex-col justify-between p-5 sm:p-6 ${
                    isFullSpanOnDesktop ? "lg:col-span-7" : ""
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
