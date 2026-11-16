export interface ContactSubmissionPayload {
  name: string;
  email: string;
  subject?: string | null;
  message: string;
}

export interface ContactSubmissionResult {
  inquiry_id: string;
  status: "received";
  triage_status: "pending";
  message: string;
}

export interface ContactSubmissionOptions {
  apiUrl?: string;
  timeoutMs?: number;
}

export class ContactSubmissionError extends Error {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "ContactSubmissionError";
    this.statusCode = statusCode;
  }
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === "string" && detail.trim()) {
    return detail.trim();
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (first && typeof first === "object" && typeof (first as { msg?: unknown }).msg === "string") {
      return (first as { msg: string }).msg;
    }
  }
  return fallback;
}

export async function submitContactInquiry(
  payload: ContactSubmissionPayload,
  options?: ContactSubmissionOptions,
): Promise<ContactSubmissionResult> {
  const baseUrl =
    options?.apiUrl ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8000";
  const timeoutMs = options?.timeoutMs ?? 8000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const normalizedSubject = payload.subject?.trim();

  try {
    const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/v1/contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: payload.name.trim(),
        email: payload.email.trim(),
        subject: normalizedSubject ? normalizedSubject : null,
        message: payload.message.trim(),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let detail = `Failed to send message (HTTP ${response.status}).`;
      try {
        const parsed = (await response.json()) as unknown;
        detail = extractErrorMessage(parsed, detail);
      } catch {
        // Keep status fallback message when response body is not JSON
      }
      throw new ContactSubmissionError(detail, response.status);
    }

    return (await response.json()) as ContactSubmissionResult;
  } catch (err) {
    if (err instanceof ContactSubmissionError) {
      throw err;
    }
    if (err instanceof Error && err.name === "AbortError") {
      throw new ContactSubmissionError(
        "Request timed out. Please try again or email Allen directly.",
      );
    }
    throw new ContactSubmissionError(
      "Unable to reach the contact service right now. Please try again or email Allen directly.",
    );
  } finally {
    clearTimeout(timer);
  }
}
