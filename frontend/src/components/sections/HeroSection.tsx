"use client";

import * as React from "react";
import Image from "next/image";
import {
  AlertCircle,
  Check,
  Download,
  MapPin,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import { PROFILE_SUMMARY } from "@/data/resume";
import type { SectionId } from "@/lib/use-active-section";
import { Button } from "@/components/ui/button";

export type ResumeDownloadState = "idle" | "downloading" | "downloaded" | "error";

const RESUME_PUBLIC_PATH = "/resume/Laxamana_Resume_DotNet_FullStack.pdf";
const RESUME_DOWNLOAD_FILENAME = "Laxamana_Resume_DotNet_FullStack.pdf";
const DOWNLOAD_RESET_DELAY_MS = 2500;

const DOWNLOAD_LABELS: Record<ResumeDownloadState, string> = {
  idle: "Download Resume",
  downloading: "Downloading...",
  downloaded: "Downloaded",
  error: "Resume Unavailable",
};

const DOWNLOAD_ANNOUNCEMENTS: Record<ResumeDownloadState, string> = {
  idle: "",
  downloading: "Downloading resume",
  downloaded: "Resume downloaded",
  error: "Resume file is currently unavailable",
};

export interface HeroSectionProps {
  onSelectExperience: (id: SectionId) => void;
  onOpenAskResume: () => void;
}

export function HeroSection({
  onSelectExperience,
  onOpenAskResume,
}: HeroSectionProps) {
  const [downloadState, setDownloadState] = React.useState<ResumeDownloadState>("idle");
  const resetTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearResetTimeout = React.useCallback(() => {
    if (resetTimeoutRef.current !== null) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    return () => {
      clearResetTimeout();
    };
  }, [clearResetTimeout]);

  const scheduleReset = React.useCallback(() => {
    clearResetTimeout();
    resetTimeoutRef.current = setTimeout(() => {
      setDownloadState("idle");
      resetTimeoutRef.current = null;
    }, DOWNLOAD_RESET_DELAY_MS);
  }, [clearResetTimeout]);

  const handleDownloadResume = async () => {
    if (downloadState === "downloading") {
      return;
    }

    clearResetTimeout();
    setDownloadState("downloading");

    try {
      const response = await fetch(RESUME_PUBLIC_PATH);
      if (!response.ok) {
        throw new Error(`Resume download failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      try {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = RESUME_DOWNLOAD_FILENAME;
        link.rel = "noopener";
        document.body.appendChild(link);
        link.click();
        link.remove();
      } finally {
        URL.revokeObjectURL(objectUrl);
      }

      setDownloadState("downloaded");
      scheduleReset();
    } catch {
      setDownloadState("error");
      scheduleReset();
    }
  };

  const downloadButtonLabel = DOWNLOAD_LABELS[downloadState];
  const downloadLiveAnnouncement = DOWNLOAD_ANNOUNCEMENTS[downloadState];

  return (
    <section
      id="top"
      aria-labelledby="hero-headline"
      className="nb-section-divider bg-[#F8FAFC] py-12 sm:py-16 lg:py-20"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 border-2 border-[#0F172A] bg-[#FFFFFF] px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#0F172A] shadow-[4px_4px_0px_#0F172A]">
              <MapPin className="h-3.5 w-3.5 text-[#0284C7]" aria-hidden="true" />
              {PROFILE_SUMMARY.location}
            </span>
            <span className="inline-flex items-center border-2 border-[#0F172A] bg-[#38BDF8] px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#0F172A] shadow-[4px_4px_0px_#0F172A]">
              BPSU Computer Science &apos;26
            </span>
          </div>

          <div className="space-y-3">
            <h1
              id="hero-headline"
              className="text-4xl font-black tracking-tight text-[#0F172A] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]"
            >
              {PROFILE_SUMMARY.headline}
            </h1>
            <p className="inline-block border-2 border-[#0F172A] bg-[#FFFFFF] px-3 py-1.5 font-mono text-xs sm:text-sm font-bold text-[#0F172A] shadow-[4px_4px_0px_#0F172A]">
              {PROFILE_SUMMARY.coreStackSubheadline}
            </p>
          </div>

          <p className="max-w-2xl text-base leading-relaxed text-[#0F172A] sm:text-lg">
            {PROFILE_SUMMARY.summaryBio}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a
              href="#experience"
              onClick={() => onSelectExperience("experience")}
              className="inline-flex items-center justify-center gap-2 border-2 border-[#0F172A] bg-[#38BDF8] px-6 py-3 text-base font-extrabold text-[#0F172A] shadow-[4px_4px_0px_#0F172A] transition-colors duration-150 hover:bg-[#0284C7] hover:text-[#FFFFFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F172A]"
            >
              <span>See my experience →</span>
            </a>

            <Button
              variant="secondary"
              size="lg"
              onClick={onOpenAskResume}
            >
              <MessageSquareText className="h-4 w-4" aria-hidden="true" />
              <span>Ask My Resume</span>
            </Button>

            <Button
              variant={downloadState === "downloaded" ? "primary" : "secondary"}
              size="lg"
              onClick={handleDownloadResume}
              disabled={downloadState === "downloading"}
              data-state={downloadState}
            >
              {downloadState === "downloaded" ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : downloadState === "error" ? (
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{downloadButtonLabel}</span>
            </Button>

            <span
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="sr-only"
            >
              {downloadLiveAnnouncement}
            </span>
          </div>
        </div>

        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="relative w-full max-w-sm">
            <div className="border-2 border-[#0F172A] bg-[#FFFFFF] p-3 shadow-[4px_4px_0px_#0F172A]">
              <div className="relative aspect-[4/4.2] w-full overflow-hidden border-2 border-[#0F172A] bg-[#F8FAFC]">
                <Image
                  src={PROFILE_SUMMARY.profilePhotoPath}
                  alt="Allen James Laxamana portrait"
                  fill
                  sizes="(max-width: 1024px) 90vw, 384px"
                  className="object-cover object-top"
                  priority
                />
              </div>
              <div className="mt-3 flex items-center justify-between border-t-2 border-[#0F172A] pt-2.5 text-xs font-bold uppercase tracking-wide text-[#0F172A]">
                <span>{PROFILE_SUMMARY.fullName}</span>
                <span className="font-mono text-[#0284C7]">.NET 10 / AI</span>
              </div>
            </div>

            <div
              className="absolute -bottom-4 -right-2 sm:-right-4 -rotate-3 border-2 border-[#0F172A] bg-[#38BDF8] px-3.5 py-2 text-xs sm:text-sm font-black uppercase tracking-wider text-[#0F172A] shadow-[4px_4px_0px_#0F172A]"
            >
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {PROFILE_SUMMARY.heroBadge}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
