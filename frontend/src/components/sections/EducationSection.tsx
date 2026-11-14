"use client";

import * as React from "react";
import Image from "next/image";
import { Calendar, GraduationCap, MapPin } from "lucide-react";
import { EDUCATION_RECORD } from "@/data/resume";
import { Card } from "@/components/ui/card";

export function EducationSection() {
  return (
    <section
      id="education"
      aria-labelledby="education-heading"
      className="nb-section-divider bg-[#FFFFFF] py-14 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <span className="inline-block border-2 border-[#0F172A] bg-[#38BDF8] px-3 py-1 text-xs font-black uppercase tracking-wider text-[#0F172A] shadow-[4px_4px_0px_#0F172A]">
            04 / Education
          </span>
          <h2
            id="education-heading"
            className="mt-4 text-3xl font-black tracking-tight text-[#0F172A] sm:text-4xl"
          >
            Academic Foundation
          </h2>
        </div>

        <Card
          id="card-education-bpsu"
          tone="white"
          className="overflow-hidden data-[highlighted=true]:ring-4 data-[highlighted=true]:ring-[#38BDF8] transition-shadow"
        >
          <div className="grid grid-cols-1 items-center gap-6 p-6 sm:p-8 md:grid-cols-12">
            <div className="md:col-span-4 flex justify-center">
              <div className="relative h-44 w-44 sm:h-48 sm:w-48 overflow-hidden border-2 border-[#0F172A] bg-[#F8FAFC] p-4 shadow-[4px_4px_0px_#0F172A]">
                <Image
                  src={EDUCATION_RECORD.logoPath}
                  alt={`${EDUCATION_RECORD.institution} emblem`}
                  fill
                  sizes="192px"
                  className="object-contain p-3"
                />
              </div>
            </div>

            <div className="md:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 border-2 border-[#0F172A] bg-[#38BDF8] px-3 py-1 font-mono text-xs font-black text-[#0F172A]">
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  {EDUCATION_RECORD.period}
                </span>
                <span className="inline-flex items-center gap-1.5 border-2 border-[#0F172A] bg-[#F8FAFC] px-3 py-1 text-xs font-bold text-[#0F172A]">
                  <MapPin className="h-3.5 w-3.5 text-[#0284C7]" aria-hidden="true" />
                  {EDUCATION_RECORD.location}
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0F172A]">
                  {EDUCATION_RECORD.institution}
                </h3>
                <p className="flex items-center gap-2 text-base sm:text-lg font-bold text-[#0284C7]">
                  <GraduationCap className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>{EDUCATION_RECORD.degree}</span>
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
