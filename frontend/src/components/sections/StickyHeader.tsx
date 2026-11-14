"use client";

import * as React from "react";
import { Menu, MessageSquareText, X } from "lucide-react";
import { NAV_SECTIONS, PROFILE_SUMMARY } from "@/data/resume";
import type { SectionId } from "@/lib/use-active-section";
import { Button } from "@/components/ui/button";

export interface StickyHeaderProps {
  activeSection: SectionId;
  onSelectSection: (id: SectionId) => void;
  onOpenAskResume: () => void;
}

export function StickyHeader({
  activeSection,
  onSelectSection,
  onOpenAskResume,
}: StickyHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLinkClick = (id: SectionId) => {
    onSelectSection(id);
    setMobileMenuOpen(false);
  };

  return (
    <header
      role="banner"
      className="sticky top-0 z-40 w-full border-b-2 border-[#0F172A] bg-[#FFFFFF]"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 sm:gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <a
          href="#top"
          className="inline-flex min-w-0 items-center gap-2 sm:gap-2.5 font-extrabold tracking-tight text-[#0F172A] hover:text-[#0284C7] transition-colors"
        >
          <span
            aria-hidden="true"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center border-2 border-[#0F172A] bg-[#38BDF8] text-xs font-black text-[#0F172A] shadow-[4px_4px_0px_#0F172A]"
          >
            AJ
          </span>
          <span className="truncate text-sm sm:text-lg">{PROFILE_SUMMARY.fullName}</span>
        </a>

        <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-2">
          <ul className="flex items-center gap-1.5">
            {NAV_SECTIONS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={item.href}
                    aria-current={isActive ? "location" : undefined}
                    data-active={isActive ? "true" : "false"}
                    onClick={() => handleLinkClick(item.id)}
                    className={`inline-flex items-center px-3 py-1.5 text-sm font-bold transition-colors ${
                      isActive
                        ? "bg-[#38BDF8] text-[#0F172A] border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]"
                        : "bg-transparent text-[#0F172A] border-2 border-transparent hover:border-[#0F172A] hover:bg-[#0284C7] hover:text-[#FFFFFF]"
                    }`}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenAskResume}
            className="ml-2"
          >
            <MessageSquareText className="h-4 w-4" aria-hidden="true" />
            <span>Ask My Resume</span>
          </Button>
        </nav>

        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenAskResume}
            className="whitespace-nowrap px-2.5 sm:px-3"
          >
            <MessageSquareText className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
            <span>Ask My Resume</span>
          </Button>
          <button
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center border-2 border-[#0F172A] bg-[#FFFFFF] text-[#0F172A] shadow-[4px_4px_0px_#0F172A] hover:bg-[#0284C7] hover:text-[#FFFFFF] cursor-pointer"
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Menu className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <nav
          id="mobile-nav-menu"
          aria-label="Mobile navigation"
          className="border-t-2 border-[#0F172A] bg-[#F8FAFC] px-4 py-3 lg:hidden"
        >
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {NAV_SECTIONS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={item.href}
                    aria-current={isActive ? "location" : undefined}
                    data-active={isActive ? "true" : "false"}
                    onClick={() => handleLinkClick(item.id)}
                    className={`flex w-full items-center justify-center px-3 py-2 text-sm font-bold border-2 border-[#0F172A] ${
                      isActive
                        ? "bg-[#38BDF8] text-[#0F172A] shadow-[4px_4px_0px_#0F172A]"
                        : "bg-[#FFFFFF] text-[#0F172A] hover:bg-[#0284C7] hover:text-[#FFFFFF]"
                    }`}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
