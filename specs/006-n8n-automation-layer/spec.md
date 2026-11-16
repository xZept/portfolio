# Feature Specification: n8n Automation Layer for Asynchronous Background Workflows

**Feature Branch**: `006-n8n-automation-layer`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "Add an n8n automation layer to handle asynchronous background workflows for the portfolio:
1. GitHub-to-RAG Sync: Automatically re-index updated README.md and docs/**/*.md files into the portfolio knowledge base whenever commits are pushed to main, ignoring non-documentation changes and handling duplicate webhook deliveries idempotently.
2. Contact Lead Triage: When a visitor submits the portfolio contact form, asynchronously classify inquiry intent (recruiter, freelance project, general inquiry) and dispatch an instant notification without blocking the user's form submission response.
3. Scheduled Health & Index Watchdog: Run a weekly check verifying frontend and backend availability and alerting if endpoints degrade or stale vector chunks need cleanup. 

All automation callbacks into the backend must be authenticated and reject malformed or unsigned requests."

## Clarifications

### Session 2026-11-16

- Q: Which authentication mechanism should n8n use when sending callbacks to the backend? → A: HMAC-SHA256 signature header computed over a timestamp and the raw request body using a shared secret (rejecting missing/expired/invalid signatures with `401 Unauthorized` / `403 Forbidden`).
- Q: When the weekly watchdog detects stale or orphaned vector chunks, how should it handle them? → A: Automatically delete stale/orphaned chunks via an authenticated backend cleanup endpoint and send a summary alert to the portfolio owner.
- Q: Which primary notification channel should n8n use to deliver Contact Lead Triage alerts and Watchdog failure notifications? → A: Discord webhook configured via an environment variable.
- Q: What maximum clock-skew / replay-protection window should the backend enforce for `X-Automation-Timestamp` on `/api/v1/automation/*` callbacks before rejecting a request as expired (`401 Unauthorized`)? → A: `±300` seconds (5 minutes) from server UTC time.
- Q: When a `docs-sync` webhook delivery fails mid-processing (`status = 'failed'`) before completing, how should subsequent retries with the same `delivery_id` be handled? → A: Deduplicate only `completed` deliveries (`duplicate_ignored`); allow retries if prior status is `failed`.
- Q: What HTTP status and timeout thresholds define a "healthy" frontend and backend response during the Weekly Health & Index Watchdog check? → A: HTTP `2xx` within `5000ms` timeout (and `status: "ok"` on backend `/api/v1/health`).
- Q: When a synced `README.md` or `docs/**/*.md` file is empty (0 bytes or whitespace-only) or is a non-resume document, how should the backend index it without violating database `content` and citation constraints? → A: Deactivate prior chunks for empty files; map non-resume doc chunks to canonical `resume_chunks` defaults.
- Q: During Contact Lead Triage, if the Discord webhook fails or rate-limits (`429`) when delivering an alert, how should the n8n workflow and `contact-triage` callback record the inquiry state? → A: Persist `intent_category` via callback with `notification_sent = false` (`notified_at = null`).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automated Knowledge Base Synchronization on Documentation Updates (Priority: P1)

As the portfolio owner, whenever I push updates to `README.md` or any file matching `docs/**/*.md` on the `main` branch, I want the portfolio knowledge base to automatically re-index those updated documents in the background so visitors asking questions via the portfolio assistant always receive answers grounded in the latest project documentation without manual re-seeding.

**Why this priority**: Keeps the portfolio's interactive knowledge base continuously accurate as projects and documentation evolve, eliminating manual re-indexing toil and preventing stale answers to recruiters and visitors.

**Independent Test**: Can be fully tested by simulating a repository push event to `main` containing modified `README.md` or `docs/**/*.md` files and verifying that the knowledge base reflects the updated content, while pushes containing only code changes or duplicate webhook deliveries do not trigger redundant indexing or duplicate knowledge chunks.

**Acceptance Scenarios**:

1. **Given** a commit is pushed to the `main` branch modifying `README.md` or one or more `docs/**/*.md` files, **When** the repository push event is received by the automation workflow, **Then** only the added or modified documentation files are re-indexed into the knowledge base and any removed documentation files have their corresponding knowledge entries removed or marked inactive.
2. **Given** a commit is pushed to the `main` branch modifying only non-documentation files (e.g., source code or configuration files) or pushed to a non-`main` branch, **When** the event is received, **Then** the workflow ignores the non-documentation changes and performs no knowledge base re-indexing.
3. **Given** an identical webhook delivery ID or commit payload is received more than once (e.g., due to webhook retry), **When** the automation workflow and backend process the request, **Then** the operation completes idempotently without creating duplicate knowledge base chunks or failing.
4. **Given** an unauthenticated, unsigned, or malformed indexing callback request is sent to the backend, **When** the backend evaluates the request, **Then** the request is rejected immediately before any knowledge base modification occurs.

---

### User Story 2 - Asynchronous Contact Lead Triage & Instant Notification (Priority: P2)

As a portfolio visitor submitting the contact form, I want my message submission to complete immediately without waiting for downstream triage or notification delivery; and as the portfolio owner, I want each incoming inquiry automatically classified by intent (`recruiter`, `freelance project`, or `general inquiry`) and delivered as an instant notification so I can prioritize high-value outreach promptly.

**Why this priority**: Directly protects the visitor's form submission experience (fast, non-blocking response) while ensuring the portfolio owner never misses time-sensitive recruiter or freelance leads.

**Independent Test**: Can be fully tested by submitting a contact form entry and verifying that the visitor receives an immediate confirmation response even if the automation layer is slow or temporarily unreachable, and that the background workflow subsequently classifies the inquiry into one of the three intent categories and dispatches a formatted alert notification.

**Acceptance Scenarios**:

1. **Given** a visitor submits a valid contact form inquiry on the portfolio, **When** the backend records the inquiry, **Then** the visitor receives an immediate confirmation response without waiting for intent classification or external notification delivery to finish.
2. **Given** a new contact inquiry has been submitted, **When** the asynchronous triage workflow processes the inquiry, **Then** the inquiry is classified into exactly one of `recruiter`, `freelance project`, or `general inquiry`, the classification result is persisted via an authenticated callback to the backend, and an instant notification containing the sender details, classification label, and message summary is dispatched to the portfolio owner.
3. **Given** the background automation service or notification channel is temporarily unavailable when a visitor submits the contact form, **When** the form is submitted, **Then** the visitor's inquiry is still safely saved and the user-facing submission succeeds without error.

---

### User Story 3 - Scheduled Weekly Health & Index Watchdog (Priority: P3)

As the portfolio owner, I want an automated weekly check that verifies both the public frontend and backend services are healthy and inspects the knowledge base for stale or orphaned vector chunks, alerting me immediately if any service degrades or if index cleanup is required.

**Why this priority**: Provides proactive operational visibility into portfolio uptime and vector index hygiene on a low-maintenance schedule, catching silent service degradation or index drift before visitors notice.

**Independent Test**: Can be fully tested by triggering the watchdog workflow on demand and verifying that it checks both frontend and backend health, evaluates knowledge base index freshness/cleanup status via an authenticated backend endpoint, and dispatches an alert when degradation or stale chunks are detected.

**Acceptance Scenarios**:

1. **Given** the weekly schedule triggers the watchdog workflow, **When** both the frontend and backend respond within healthy thresholds and no stale vector chunks exist, **Then** the check records a healthy run status without sending false-positive failure alerts.
2. **Given** the weekly schedule triggers the watchdog workflow, **When** either the frontend or backend is unreachable or reports a degraded status, **Then** the workflow immediately dispatches an alert notification detailing which endpoint failed and the observed error or latency.
3. **Given** the weekly schedule triggers the watchdog workflow, **When** the backend reports stale or orphaned vector chunks requiring cleanup, **Then** the workflow automatically triggers cleanup of those stale/orphaned chunks via an authenticated backend callback and notifies the portfolio owner with a summary of the cleaned chunks.

---

### Edge Cases

- **Duplicate or out-of-order webhook deliveries**: If a repository push webhook is delivered multiple times with the same delivery/commit identifier, the system must deduplicate the event so knowledge chunks are never duplicated. If two overlapping `main` branch pushes modify the same `docs/**/*.md` file out of order, `chunk_key` upserts remain atomic per file and `doc_sync_events` records each `delivery_id` independently.
- **Commits deleting or renaming documentation files**: When a `docs/**/*.md` file is deleted or renamed in a commit on `main`, the old file path MUST appear in `removed_files` and any new path in `upserted_files` (with multi-commit pushes evaluated in chronological order so the final state wins); stale chunks belonging to the old file path must be deactivated (`is_active = false`) and subsequently purged so deleted content is no longer returned in search results.
- **Ambiguous or ultra-short contact messages**: When a contact inquiry contains minimal or ambiguous text (e.g., "Hi, let's connect"), the triage classifier must gracefully default to `general inquiry` rather than failing the workflow.
- **Automation service downtime during contact submission**: If the background workflow trigger times out or fails to connect when a visitor submits the contact form, the backend must log the dispatch failure and still return a successful submission response to the visitor.
- **Unsigned, expired, or tampered automation callbacks**: Any request to backend automation endpoints missing valid authentication credentials/signatures or failing payload validation must be rejected with an appropriate client error (`401`/`403` for authentication, `422` for malformed payloads) and logged without mutating data.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an automated workflow that listens for repository push events to the `main` branch and filters changed files using case-sensitive matching to process only root `README.md` and markdown files matching `docs/**/*.md` (including nested subdirectories, while excluding non-`.md` assets and `..` path traversal).
- **FR-002**: System MUST ignore repository push events targeting branches other than `main` as well as commits that contain no changes to `README.md` or `docs/**/*.md`.
- **FR-003**: System MUST re-index added or modified `README.md` and `docs/**/*.md` files into the portfolio knowledge base (chunking by markdown headings with deterministic `chunk_key` values, mapping non-resume doc chunks to valid canonical `resume_chunks` citation defaults, and treating 0-byte or whitespace-only files as having zero chunks while deactivating any prior chunks for that `source_path`), and deactivate (`is_active = false`) vector chunks associated with deleted or renamed-away documentation files from the commit (evaluating multi-commit pushes in chronological order).
- **FR-004**: System MUST handle duplicate webhook deliveries idempotently using a unique delivery identifier (`delivery_id`) so repeated deliveries of an already `completed` sync return `duplicate_ignored` with zero duplicate vector chunks (`chunk_key` + `content_hash`), while deliveries previously marked `failed` (including partial-batch embedding failures before DB commit) remain eligible for retry on the same `delivery_id`.
- **FR-005**: System MUST persist visitor contact inquiries to `public.contact_inquiries` (`triage_status = 'pending'`) *before* triggering contact lead triage asynchronously via `BackgroundTasks` so that the visitor's HTTP `201 Created` response is never blocked by intent classification or notification delivery; if the n8n webhook dispatch fails after a brief retry/backoff, the backend MUST mark `triage_status = 'failed'` for later replay.
- **FR-006**: System MUST classify every triaged contact inquiry into one of three canonical intent categories: `recruiter`, `freelance project`, or `general inquiry` (tie-breaking multi-signal inquiries in priority order `recruiter` > `freelance project` > `general inquiry`, and defaulting to `general inquiry` when intent is ambiguous or signals are absent).
- **FR-007**: System MUST dispatch an instant Discord webhook notification to the portfolio owner for each triaged contact inquiry containing `Name`, `Email`, `Intent Category`, `Subject`, `Summary` (`<= 500` chars), and `Message Excerpt` (`<= 1000` chars to respect Discord embed limits); if Discord delivery fails or rate-limits (`429`) after retries, the triage callback MUST still persist `intent_category` (`triage_status = 'classified'`) while recording `notification_sent = false` (`notified_at = null`).
- **FR-008**: System MUST execute a scheduled watchdog workflow once per week (plus an on-demand manual test trigger) that verifies the availability of both the portfolio frontend and backend `/api/v1/health` endpoints (healthy threshold: HTTP `2xx` within `5000ms` timeout, and `status: "ok"` on backend), checks the knowledge base for stale or orphaned vector chunks (`is_active = false`, or chunks whose `source_path` has a newer `completed` `doc_sync_events` entry with a different `commit_sha`), and automatically deletes confirmed stale/orphaned chunks via an authenticated backend cleanup endpoint.
- **FR-009**: System MUST dispatch a Discord webhook alert notification to the portfolio owner whenever the weekly watchdog detects frontend/backend unavailability, degraded health status, or when stale vector chunks are detected and cleaned up (including endpoint latency/status metadata, `stale_chunks_deleted` count, and a truncated summary of `deleted_chunk_keys`).
- **FR-010**: All backend endpoints receiving callbacks or commands from the automation layer MUST authenticate incoming requests by verifying an HMAC-SHA256 cryptographic signature computed over `{timestamp}.{raw_body}` using a non-empty shared secret (`AUTOMATION_WEBHOOK_SECRET`, failing closed with `401`/`503` if unconfigured), enforcing a `±300` second replay-protection window from server UTC time on `X-Automation-Timestamp` (rejecting missing, non-integer, or expired timestamps and missing `X-Automation-Signature` headers with `401 Unauthorized`, and rejecting invalid or mismatched signatures with `403 Forbidden`).
- **FR-011**: All backend automation callback endpoints MUST strictly validate request payload schemas and reject malformed or incomplete payloads with `422 Unprocessable Entity` before executing any business logic.

### Key Entities *(include if feature involves data)*

- **Documentation Sync Event**: Represents a repository push notification for `main`, including the delivery identifier, commit SHA, timestamp, list of added/modified/removed documentation file paths (`README.md`, `docs/**/*.md`), and processing status.
- **Knowledge Base Document Chunk**: Represents an indexed segment of a documentation file stored in the vector knowledge base, linked to its source file path, content hash or commit SHA, embedding vector, and last-indexed timestamp used to identify stale chunks.
- **Contact Inquiry & Triage Record**: Represents a visitor's contact form submission including sender name, email, message body, submission timestamp, asynchronous triage status (`pending`, `classified`, `failed`), classified intent (`recruiter`, `freelance project`, `general inquiry`), and notification delivery status.
- **Watchdog Health Report**: Represents the outcome of a weekly scheduled check, capturing frontend availability status, backend health status, count of stale or orphaned vector chunks detected/cleaned, and whether an owner alert was triggered.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of commits pushed to `main` that modify `README.md` or `docs/**/*.md` are reflected in the portfolio knowledge base within 2 minutes of the push event (measured from `doc_sync_events.created_at` to `completed_at`) without manual intervention.
- **SC-002**: 100% of duplicate webhook deliveries for the same commit and documentation state produce zero duplicate knowledge base chunks (enforced by `chunk_key` uniqueness, `content_hash` comparison, and `delivery_id` ledger).
- **SC-003**: Contact form submissions return a confirmation response to the visitor in under 1 second (p95), completely decoupled from the execution time or availability of background intent classification and notification delivery.
- **SC-004**: 95% of triaged contact inquiries trigger an owner notification with an assigned intent category (`recruiter`, `freelance project`, or `general inquiry`) within 60 seconds of form submission during normal operation (when n8n, Gemini API, and Discord webhook are reachable without upstream outage or rate-limiting).
- **SC-005**: 100% of unsigned, unauthenticated, or malformed callback requests to backend automation endpoints are rejected before modifying any application state.
- **SC-006**: Weekly watchdog checks run automatically on a 7-day cadence and dispatch an owner alert within 5 minutes during normal operation whenever frontend availability, backend health, or vector index freshness checks fail.

## Assumptions

- The portfolio repository is hosted on GitHub and can emit standard push webhooks (or be polled/triggered on `main` branch pushes) containing commit metadata and changed file paths; raw markdown fetches from `main` use `GITHUB_RAW_BASE_URL` (with optional `GITHUB_TOKEN` header if the repository is private, or inline `upserted_files` payloads).
- Contact form submissions are persisted by the backend first before firing a non-blocking webhook/event to the automation layer, ensuring zero lead loss even if the automation workflow or notification service is temporarily down; public `POST /api/v1/contact` abuse is mitigated by strict Pydantic length bounds, `extra="forbid"`, CORS origin restrictions, and upstream proxy/Render rate limiting.
- Instant notifications for contact lead triage and watchdog alerts will be delivered via a Discord incoming webhook URL configured as an environment variable in the automation environment.
- Vector chunks are considered "stale" when `is_active = false` (from deletion or empty-file deactivation) or when their `source_path` has a newer `completed` `doc_sync_events` entry with a different `commit_sha`.
- Audit logs in `public.doc_sync_events` and `public.watchdog_runs` are automatically purged after 90 days via `pg_cron`, while `public.contact_inquiries` lead records are retained indefinitely unless manually deleted.
