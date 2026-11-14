"use client";

import * as React from "react";
import type { NavSectionItem } from "@/data/resume";

export type SectionId = NavSectionItem["id"];

export function useActiveSection(sectionIds: ReadonlyArray<SectionId>) {
  const [activeSection, setActiveSection] = React.useState<SectionId>(
    sectionIds[0] ?? "experience",
  );
  const lockRef = React.useRef<boolean>(false);
  const unlockTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectSectionWithLock = React.useCallback((id: SectionId) => {
    setActiveSection(id);
    lockRef.current = true;
    if (unlockTimerRef.current) {
      clearTimeout(unlockTimerRef.current);
    }
    unlockTimerRef.current = setTimeout(() => {
      lockRef.current = false;
    }, 850);
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (lockRef.current) return;

        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          const id = visible[0].target.id as SectionId;
          if (sectionIds.includes(id)) {
            setActiveSection(id);
          }
        }
      },
      {
        rootMargin: "-88px 0px -55% 0px",
        threshold: [0.1, 0.25, 0.5],
      },
    );

    for (const el of elements) {
      observer.observe(el);
    }

    return () => {
      observer.disconnect();
      if (unlockTimerRef.current) {
        clearTimeout(unlockTimerRef.current);
      }
    };
  }, [sectionIds]);

  return { activeSection, selectSectionWithLock };
}
