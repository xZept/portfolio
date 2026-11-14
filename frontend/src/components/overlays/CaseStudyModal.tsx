"use client";

import * as React from "react";
import { Building2, Calendar, CheckCircle2, MapPin, MessageSquareText, ShieldCheck } from "lucide-react";
import type { ExperienceEntry } from "@/data/resume";
import { NeoDialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface CaseStudyModalProps {
  entry: ExperienceEntry | null;
  onClose: () => void;
  onAskAiAboutProject: (entry: ExperienceEntry) => void;
}

export function CaseStudyModal({
  entry,
  onClose,
  onAskAiAboutProject,
}: CaseStudyModalProps) {
  return (
    <NeoDialog
      open={entry !== null}
      onClose={onClose}
      titleId="case-study-dialog-title"
      title={entry ? `${entry.title} — Case Study` : "Case Study"}
      subtitle={entry ? `${entry.role} · ${entry.organization}` : undefined}
      layout="modal"
    >
      {entry ? (
        <div className="space-y-6 text-[#0F172A]">
          <div className="flex flex-wrap items-center gap-3 border-2 border-[#0F172A] bg-[#F8FAFC] p-3 text-xs font-bold">
            <span className="inline-flex items-center gap-1.5 border-2 border-[#0F172A] bg-[#38BDF8] px-2.5 py-1 uppercase">
              {entry.statusBadge}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
              {entry.organization}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              {entry.dateRange}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {entry.location}
            </span>
          </div>

          <section className="space-y-2">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#0F172A]">
              Problem &amp; Objective
            </h3>
            <p className="text-sm leading-relaxed text-[#0F172A]">{entry.caseStudy.problemSummary}</p>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#0F172A]">
              Architecture &amp; Key Deliverables
            </h3>
            <ul className="space-y-2">
              {entry.caseStudy.architectureHighlights.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0284C7]" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2 border-2 border-[#0F172A] bg-[#F8FAFC] p-4">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-[#0F172A]">
              <ShieldCheck className="h-4 w-4 text-[#0284C7]" aria-hidden="true" />
              Security &amp; Data Architecture
            </h3>
            <ul className="space-y-2">
              {entry.caseStudy.securityAndData.map((item) => (
                <li key={item} className="text-sm leading-relaxed">
                  • {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#0F172A]">
              Delivery Status
            </h3>
            <p className="text-sm font-semibold leading-relaxed text-[#0F172A]">
              {entry.caseStudy.deliveryStatus}
            </p>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-[#0F172A] pt-4">
            <div className="flex flex-wrap gap-1.5">
              {entry.techTags.map((tag) => (
                <span
                  key={tag}
                  className="border-2 border-[#0F172A] bg-[#FFFFFF] px-2 py-0.5 text-xs font-bold"
                >
                  {tag}
                </span>
              ))}
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                onClose();
                onAskAiAboutProject(entry);
              }}
            >
              <MessageSquareText className="h-4 w-4" aria-hidden="true" />
              <span>Ask AI about this</span>
            </Button>
          </div>
        </div>
      ) : null}
    </NeoDialog>
  );
}
