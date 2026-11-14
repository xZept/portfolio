"use client";

import * as React from "react";
import { Check, Copy, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { PROFILE_SUMMARY } from "@/data/resume";
import { Card } from "@/components/ui/card";

export function ContactSection() {
  const [copied, setCopied] = React.useState(false);
  const [copyFallbackHint, setCopyFallbackHint] = React.useState(false);
  const emailDisplayRef = React.useRef<HTMLSpanElement | null>(null);
  const resetTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const selectEmailInPlace = () => {
    const el = emailDisplayRef.current;
    if (!el || typeof window === "undefined") return;
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const handleCopyEmail = async () => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(PROFILE_SUMMARY.email);
        setCopyFallbackHint(false);
        setCopied(true);
        resetTimerRef.current = setTimeout(() => {
          setCopied(false);
        }, 2500);
        return;
      }
      throw new Error("Clipboard API unavailable");
    } catch {
      selectEmailInPlace();
      setCopied(false);
      setCopyFallbackHint(true);
      resetTimerRef.current = setTimeout(() => {
        setCopyFallbackHint(false);
      }, 4500);
    }
  };

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="bg-[#F8FAFC] py-14 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Card tone="sky" className="p-6 sm:p-10 lg:p-12">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7 space-y-5">
              <span className="inline-block border-2 border-[#0F172A] bg-[#FFFFFF] px-3 py-1 text-xs font-black uppercase tracking-wider text-[#0F172A] shadow-[4px_4px_0px_#0F172A]">
                06 / Contact
              </span>
              <h2
                id="contact-heading"
                className="text-3xl font-black tracking-tight text-[#0F172A] sm:text-4xl lg:text-[2.65rem] lg:leading-[1.1]"
              >
                Ready to build dependable .NET &amp; full-stack software with your team.
              </h2>
              <p className="max-w-2xl text-base font-semibold leading-relaxed text-[#0F172A]">
                Seeking an entry-level .NET or full-stack developer role. Reach out directly via email or phone, or review my profiles below.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <a
                  href={`mailto:${PROFILE_SUMMARY.email}`}
                  className="inline-flex items-center justify-center gap-2 border-2 border-[#0F172A] bg-[#0F172A] px-6 py-3 text-base font-extrabold text-[#FFFFFF] shadow-[4px_4px_0px_#0F172A] transition-colors duration-150 hover:bg-[#0284C7] hover:text-[#FFFFFF]"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  <span>Get in touch →</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="border-2 border-[#0F172A] bg-[#FFFFFF] p-5 sm:p-6 shadow-[4px_4px_0px_#0F172A] space-y-5">
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-wider text-[#0284C7]">
                    Direct Email
                  </p>
                  <span
                    ref={emailDisplayRef}
                    data-testid="contact-email-text"
                    className="block break-all font-mono text-sm sm:text-base font-black text-[#0F172A]"
                  >
                    {PROFILE_SUMMARY.email}
                  </span>

                  <div className="flex flex-wrap gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="inline-flex items-center gap-1.5 border-2 border-[#0F172A] bg-[#38BDF8] px-3.5 py-2 text-xs font-black text-[#0F172A] shadow-[4px_4px_0px_#0F172A] hover:bg-[#0284C7] hover:text-[#FFFFFF] cursor-pointer"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      <span>{copied ? "Copied!" : "Copy email"}</span>
                    </button>

                    <a
                      href={`mailto:${PROFILE_SUMMARY.email}`}
                      className="inline-flex items-center gap-1.5 border-2 border-[#0F172A] bg-[#FFFFFF] px-3.5 py-2 text-xs font-black text-[#0F172A] shadow-[4px_4px_0px_#0F172A] hover:bg-[#0284C7] hover:text-[#FFFFFF]"
                    >
                      <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Write email</span>
                    </a>
                  </div>

                  {copyFallbackHint ? (
                    <p
                      role="status"
                      data-testid="copy-fallback-hint"
                      className="border border-[#0F172A] bg-[#F8FAFC] px-2.5 py-1.5 text-xs font-bold text-[#0F172A]"
                    >
                      Clipboard access blocked — email selected above. Press Ctrl+C / Cmd+C to copy.
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2.5 border-t-2 border-[#0F172A] pt-4 text-sm font-bold text-[#0F172A]">
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#0284C7]" aria-hidden="true" />
                    <a
                      href={`tel:${PROFILE_SUMMARY.phone.replace(/[^+\d]/g, "")}`}
                      className="hover:text-[#0284C7] underline decoration-2 underline-offset-4"
                    >
                      {PROFILE_SUMMARY.phone}
                    </a>
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#0284C7]" aria-hidden="true" />
                    <span>{PROFILE_SUMMARY.location}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <footer className="mt-10 flex flex-col gap-4 border-t-2 border-[#0F172A] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-black text-[#0F172A]">
              © 2026 {PROFILE_SUMMARY.fullName} · {PROFILE_SUMMARY.location}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={PROFILE_SUMMARY.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 border-2 border-[#0F172A] bg-[#FFFFFF] px-3.5 py-1.5 text-xs font-black text-[#0F172A] shadow-[4px_4px_0px_#0F172A] hover:bg-[#0284C7] hover:text-[#FFFFFF]"
              >
                <span>LinkedIn</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
              <a
                href={PROFILE_SUMMARY.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 border-2 border-[#0F172A] bg-[#FFFFFF] px-3.5 py-1.5 text-xs font-black text-[#0F172A] shadow-[4px_4px_0px_#0F172A] hover:bg-[#0284C7] hover:text-[#FFFFFF]"
              >
                <span>GitHub</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </footer>
        </Card>
      </div>
    </section>
  );
}
