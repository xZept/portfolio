"use client";

import * as React from "react";
import Image from "next/image";
import { Award } from "lucide-react";
import { CERTIFICATION_RECORDS } from "@/data/resume";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function CertificationsSection() {
  return (
    <section
      id="certifications"
      aria-labelledby="certifications-heading"
      className="nb-section-divider bg-[#F8FAFC] py-14 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-block border-2 border-[#0F172A] bg-[#38BDF8] px-3 py-1 text-xs font-black uppercase tracking-wider text-[#0F172A] shadow-[4px_4px_0px_#0F172A]">
              05 / Certifications
            </span>
            <h2
              id="certifications-heading"
              className="mt-4 text-3xl font-black tracking-tight text-[#0F172A] sm:text-4xl"
            >
              Verified Industry Credentials
            </h2>
          </div>
          <p className="max-w-md text-sm font-medium text-[#0F172A]">
            Certiport / Pearson VUE IT Specialist credentials and Cisco Cyber Threat Management (2024–2026).
          </p>
        </div>

        <div
          id="card-certifications"
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 data-[highlighted=true]:ring-4 data-[highlighted=true]:ring-[#38BDF8] p-1"
        >
          {CERTIFICATION_RECORDS.map((cert) => (
            <Card
              key={cert.id}
              tone="white"
              className="flex flex-col justify-between p-5 sm:p-6"
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge
                    variant={cert.issuerBadge === "Cisco" ? "sky" : "white"}
                    className="shadow-none"
                  >
                    {cert.issuerBadge}
                  </Badge>
                  <span className="border-2 border-[#0F172A] bg-[#F8FAFC] px-2.5 py-0.5 font-mono text-xs font-black text-[#0F172A]">
                    {cert.year}
                  </span>
                </div>

                <div className="flex items-center gap-3 border-2 border-[#0F172A] bg-[#F8FAFC] p-3">
                  <div className="relative h-12 w-24 shrink-0 overflow-hidden bg-[#FFFFFF] border border-[#0F172A] p-1.5">
                    <Image
                      src={cert.primaryLogo}
                      alt={`${cert.issuerBadge} logo`}
                      fill
                      sizes="96px"
                      className="object-contain p-1"
                    />
                  </div>
                  {cert.coBrandLogo ? (
                    <div className="relative h-12 w-24 shrink-0 overflow-hidden bg-[#FFFFFF] border border-[#0F172A] p-1.5">
                      <Image
                        src={cert.coBrandLogo}
                        alt="Microsoft IT Specialist co-brand logo"
                        fill
                        sizes="96px"
                        className="object-contain p-1"
                      />
                    </div>
                  ) : null}
                </div>

                <h3 className="text-lg font-black leading-snug text-[#0F172A]">
                  {cert.title}
                </h3>
              </div>

              <div className="mt-5 flex items-center gap-2 border-t-2 border-[#0F172A] pt-3 text-xs font-bold uppercase tracking-wide text-[#0284C7]">
                <Award className="h-4 w-4" aria-hidden="true" />
                <span>Earned {cert.year}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
