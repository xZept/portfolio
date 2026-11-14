"use client";

import * as React from "react";
import { MessageSquareText } from "lucide-react";

export interface FloatingAskTriggerProps {
  onClick: () => void;
  isOpen?: boolean;
}

export function FloatingAskTrigger({
  onClick,
  isOpen = false,
}: FloatingAskTriggerProps) {
  return (
    <button
      type="button"
      data-testid="floating-ask-resume-trigger"
      aria-label="Ask My Resume"
      aria-expanded={isOpen}
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 border-2 border-[#0F172A] bg-[#38BDF8] px-4 py-3 text-sm font-black text-[#0F172A] shadow-[4px_4px_0px_#0F172A] hover:bg-[#0284C7] hover:text-[#FFFFFF] cursor-pointer"
    >
      <MessageSquareText className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span>Ask My Resume</span>
    </button>
  );
}
