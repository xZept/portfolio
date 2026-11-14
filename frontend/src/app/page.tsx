"use client";

import * as React from "react";
import { NAV_SECTIONS, type ExperienceEntry, type ExperienceId } from "@/data/resume";
import { useActiveSection } from "@/lib/use-active-section";
import { StickyHeader } from "@/components/sections/StickyHeader";
import { HeroSection } from "@/components/sections/HeroSection";
import { ExperienceSection } from "@/components/sections/ExperienceSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { SkillsSection } from "@/components/sections/SkillsSection";
import { EducationSection } from "@/components/sections/EducationSection";
import { CertificationsSection } from "@/components/sections/CertificationsSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { CaseStudyModal } from "@/components/overlays/CaseStudyModal";
import { AskResumeDrawer } from "@/components/overlays/AskResumeDrawer";
import { FloatingAskTrigger } from "@/components/overlays/FloatingAskTrigger";

const SECTION_IDS = NAV_SECTIONS.map((item) => item.id);

export default function HomePage() {
  const { activeSection, selectSectionWithLock } = useActiveSection(SECTION_IDS);
  const [selectedCaseStudy, setSelectedCaseStudy] = React.useState<ExperienceEntry | null>(null);
  const [askResumeState, setAskResumeState] = React.useState<{
    open: boolean;
    initialQuestion: string;
    contextProjectId: ExperienceId | null;
  }>({
    open: false,
    initialQuestion: "",
    contextProjectId: null,
  });

  const handleOpenAskResume = React.useCallback((entry?: ExperienceEntry) => {
    setAskResumeState({
      open: true,
      initialQuestion: entry?.askAiPrompt ?? "",
      contextProjectId: entry?.id ?? null,
    });
  }, []);

  const handleCloseAskResume = React.useCallback(() => {
    setAskResumeState((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <StickyHeader
        activeSection={activeSection}
        onSelectSection={selectSectionWithLock}
        onOpenAskResume={() => handleOpenAskResume()}
      />
      <main>
        <HeroSection
          onSelectExperience={selectSectionWithLock}
          onOpenAskResume={() => handleOpenAskResume()}
        />
        <ExperienceSection
          onOpenCaseStudy={setSelectedCaseStudy}
          onAskAiAboutProject={(entry) => handleOpenAskResume(entry)}
        />
        <AboutSection />
        <SkillsSection />
        <EducationSection />
        <CertificationsSection />
        <ContactSection />
      </main>
      <CaseStudyModal
        entry={selectedCaseStudy}
        onClose={() => setSelectedCaseStudy(null)}
        onAskAiAboutProject={(entry) => handleOpenAskResume(entry)}
      />
      <FloatingAskTrigger
        onClick={() => handleOpenAskResume()}
        isOpen={askResumeState.open}
      />
      <AskResumeDrawer
        open={askResumeState.open}
        initialQuestion={askResumeState.initialQuestion}
        contextProjectId={askResumeState.contextProjectId}
        onClose={handleCloseAskResume}
      />
    </div>
  );
}
