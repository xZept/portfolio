"use client";

import * as React from "react";
import { Check, Copy, ExternalLink, Mail, MapPin, Phone, Send } from "lucide-react";
import { PROFILE_SUMMARY } from "@/data/resume";
import { Card } from "@/components/ui/card";
import { ContactSubmissionError, submitContactInquiry } from "@/lib/contact-client";

type FormFieldName = "name" | "email" | "subject" | "message";

type FieldErrors = Partial<Record<FormFieldName, string>>;

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function validateField(field: FormFieldName, value: string): string | undefined {
  const trimmed = value.trim();
  if (field === "name") {
    if (trimmed.length < 2) return "Please enter your name (at least 2 characters).";
    if (trimmed.length > 120) return "Name must be 120 characters or fewer.";
  } else if (field === "email") {
    if (trimmed.length < 5 || trimmed.length > 254 || !EMAIL_REGEX.test(trimmed)) {
      return "Please enter a valid email address.";
    }
  } else if (field === "subject") {
    if (trimmed.length > 200) return "Subject must be 200 characters or fewer.";
  } else if (field === "message") {
    if (trimmed.length < 2) return "Please include a message (at least 2 characters).";
    if (trimmed.length > 4000) return "Message must be 4000 characters or fewer.";
  }
  return undefined;
}

export function ContactSection() {
  const [copied, setCopied] = React.useState(false);
  const [copyFallbackHint, setCopyFallbackHint] = React.useState(false);
  const emailDisplayRef = React.useRef<HTMLSpanElement | null>(null);
  const resetTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [dirtyFields, setDirtyFields] = React.useState<Partial<Record<FormFieldName, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const nameInputRef = React.useRef<HTMLInputElement | null>(null);
  const emailInputRef = React.useRef<HTMLInputElement | null>(null);
  const subjectInputRef = React.useRef<HTMLInputElement | null>(null);
  const messageInputRef = React.useRef<HTMLTextAreaElement | null>(null);

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

  const handleFieldChange = (field: FormFieldName, nextValue: string) => {
    setDirtyFields((prev) => ({ ...prev, [field]: true }));
    if (submitSuccess) setSubmitSuccess(false);
    if (submitError) setSubmitError(null);

    if (field === "name") setName(nextValue);
    else if (field === "email") setEmail(nextValue);
    else if (field === "subject") setSubject(nextValue);
    else setMessage(nextValue);

    if (fieldErrors[field]) {
      const nextErr = validateField(field, nextValue);
      if (!nextErr) {
        setFieldErrors((prev) => {
          const updated = { ...prev };
          delete updated[field];
          return updated;
        });
      }
    }
  };

  const handleFieldBlur = (field: FormFieldName, value: string) => {
    if (!dirtyFields[field]) return;
    const err = validateField(field, value);
    setFieldErrors((prev) => {
      const updated = { ...prev };
      if (err) updated[field] = err;
      else delete updated[field];
      return updated;
    });
  };

  const handleInquirySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitSuccess(false);
    setSubmitError(null);

    const nextErrors: FieldErrors = {};
    const nameErr = validateField("name", name);
    const emailErr = validateField("email", email);
    const subjectErr = validateField("subject", subject);
    const messageErr = validateField("message", message);

    if (nameErr) nextErrors.name = nameErr;
    if (emailErr) nextErrors.email = emailErr;
    if (subjectErr) nextErrors.subject = subjectErr;
    if (messageErr) nextErrors.message = messageErr;

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      if (nextErrors.name) nameInputRef.current?.focus();
      else if (nextErrors.email) emailInputRef.current?.focus();
      else if (nextErrors.subject) subjectInputRef.current?.focus();
      else if (nextErrors.message) messageInputRef.current?.focus();
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await submitContactInquiry({
        name,
        email,
        subject: subject.trim() || null,
        message,
      });
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setDirtyFields({});
      setSubmitSuccess(true);
    } catch (err) {
      if (err instanceof ContactSubmissionError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Unable to send message right now. Please email Allen directly.");
      }
    } finally {
      setIsSubmitting(false);
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
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-4">
                <span className="inline-block border-2 border-[#0F172A] bg-[#FFFFFF] px-3 py-1 text-xs font-black uppercase tracking-wider text-[#0F172A] shadow-[4px_4px_0px_#0F172A]">
                  06 / Contact
                </span>
                <h2
                  id="contact-heading"
                  className="text-3xl font-black tracking-tight text-[#0F172A] sm:text-4xl lg:text-[2.45rem] lg:leading-[1.1]"
                >
                  Ready to build dependable .NET &amp; full-stack software with your team.
                </h2>
                <p className="max-w-2xl text-base font-semibold leading-relaxed text-[#0F172A]">
                  Seeking an entry-level .NET or full-stack developer role. Send a quick inquiry using the form or reach out directly via email or phone.
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

            <div className="lg:col-span-6">
              <div className="border-2 border-[#0F172A] bg-[#FFFFFF] p-5 sm:p-6 shadow-[4px_4px_0px_#0F172A]">
                <h3
                  id="contact-form-heading"
                  className="text-lg font-black tracking-tight text-[#0F172A]"
                >
                  Send a Message
                </h3>
                <p className="mt-1 text-xs font-bold text-[#0F172A]/80">
                  Inquiries are saved immediately and routed asynchronously for a prompt reply.
                </p>

                <form
                  method="POST"
                  noValidate
                  aria-labelledby="contact-form-heading"
                  onSubmit={handleInquirySubmit}
                  className="mt-5 space-y-4"
                >
                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-black uppercase tracking-wider text-[#0F172A]"
                    >
                      Name <span aria-hidden="true">*</span>
                    </label>
                    <input
                      ref={nameInputRef}
                      id="contact-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      minLength={2}
                      maxLength={120}
                      value={name}
                      onChange={(e) => handleFieldChange("name", e.target.value)}
                      onBlur={(e) => handleFieldBlur("name", e.target.value)}
                      aria-invalid={fieldErrors.name ? "true" : "false"}
                      aria-describedby={fieldErrors.name ? "contact-name-error" : undefined}
                      placeholder="Sarah Jenkins"
                      className="w-full min-h-[48px] border-2 border-[#0F172A] bg-[#F8FAFC] px-3 py-2.5 text-sm font-bold text-[#0F172A] placeholder:text-[#0F172A]/50 focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                    />
                    {fieldErrors.name ? (
                      <p
                        id="contact-name-error"
                        className="text-xs font-bold text-[#B91C1C]"
                      >
                        {fieldErrors.name}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-black uppercase tracking-wider text-[#0F172A]"
                    >
                      Email <span aria-hidden="true">*</span>
                    </label>
                    <input
                      ref={emailInputRef}
                      id="contact-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      required
                      minLength={5}
                      maxLength={254}
                      value={email}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                      onBlur={(e) => handleFieldBlur("email", e.target.value)}
                      aria-invalid={fieldErrors.email ? "true" : "false"}
                      aria-describedby={fieldErrors.email ? "contact-email-error" : undefined}
                      placeholder="you@company.com"
                      className="w-full min-h-[48px] border-2 border-[#0F172A] bg-[#F8FAFC] px-3 py-2.5 text-sm font-bold text-[#0F172A] placeholder:text-[#0F172A]/50 focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                    />
                    {fieldErrors.email ? (
                      <p
                        id="contact-email-error"
                        className="text-xs font-bold text-[#B91C1C]"
                      >
                        {fieldErrors.email}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-subject"
                      className="block text-xs font-black uppercase tracking-wider text-[#0F172A]"
                    >
                      Subject (Optional)
                    </label>
                    <input
                      ref={subjectInputRef}
                      id="contact-subject"
                      name="subject"
                      type="text"
                      maxLength={200}
                      value={subject}
                      onChange={(e) => handleFieldChange("subject", e.target.value)}
                      onBlur={(e) => handleFieldBlur("subject", e.target.value)}
                      aria-invalid={fieldErrors.subject ? "true" : "false"}
                      aria-describedby={fieldErrors.subject ? "contact-subject-error" : undefined}
                      placeholder="Junior .NET / Full-Stack Opportunity"
                      className="w-full min-h-[48px] border-2 border-[#0F172A] bg-[#F8FAFC] px-3 py-2.5 text-sm font-bold text-[#0F172A] placeholder:text-[#0F172A]/50 focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                    />
                    {fieldErrors.subject ? (
                      <p
                        id="contact-subject-error"
                        className="text-xs font-bold text-[#B91C1C]"
                      >
                        {fieldErrors.subject}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="contact-message"
                      className="block text-xs font-black uppercase tracking-wider text-[#0F172A]"
                    >
                      Message <span aria-hidden="true">*</span>
                    </label>
                    <textarea
                      ref={messageInputRef}
                      id="contact-message"
                      name="message"
                      required
                      minLength={2}
                      maxLength={4000}
                      rows={4}
                      value={message}
                      onChange={(e) => handleFieldChange("message", e.target.value)}
                      onBlur={(e) => handleFieldBlur("message", e.target.value)}
                      aria-invalid={fieldErrors.message ? "true" : "false"}
                      aria-describedby={fieldErrors.message ? "contact-message-error" : undefined}
                      placeholder="Tell me about the role, project scope, or how we can collaborate."
                      className="w-full border-2 border-[#0F172A] bg-[#F8FAFC] px-3 py-2.5 text-sm font-bold text-[#0F172A] placeholder:text-[#0F172A]/50 focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                    />
                    {fieldErrors.message ? (
                      <p
                        id="contact-message-error"
                        className="text-xs font-bold text-[#B91C1C]"
                      >
                        {fieldErrors.message}
                      </p>
                    ) : null}
                  </div>

                  {submitSuccess ? (
                    <div
                      role="status"
                      aria-live="polite"
                      data-testid="contact-form-success"
                      className="border-2 border-[#0F172A] bg-[#38BDF8] px-3.5 py-2.5 text-xs font-black text-[#0F172A]"
                    >
                      Message received! Allen has been notified and will get back to you shortly.
                    </div>
                  ) : null}

                  {submitError ? (
                    <div
                      role="alert"
                      aria-live="polite"
                      data-testid="contact-form-error"
                      className="border-2 border-[#0F172A] bg-[#FEE2E2] px-3.5 py-2.5 text-xs font-black text-[#991B1B]"
                    >
                      {submitError}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex w-full min-h-[48px] items-center justify-center gap-2 border-2 border-[#0F172A] bg-[#38BDF8] px-5 py-3 text-sm font-black text-[#0F172A] shadow-[4px_4px_0px_#0F172A] transition-colors duration-150 hover:bg-[#0284C7] hover:text-[#FFFFFF] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Send className="h-4 w-4" aria-hidden="true" />
                    <span>{isSubmitting ? "Sending..." : "Send Message"}</span>
                  </button>
                </form>
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
