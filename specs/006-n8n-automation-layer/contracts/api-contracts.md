# API Contracts: FastAPI Backend & Authenticated Automation Callbacks

**Feature**: `006-n8n-automation-layer`  
**Framework**: FastAPI `0.162.5` + Pydantic `2.14.3` (`ConfigDict(extra="forbid")`)  
**Base Prefix**: `/api/v1`

---

## 1. HMAC-SHA256 Authentication Contract (All `/api/v1/automation/*` Endpoints)

Every request targeting `/api/v1/automation/*` MUST include two headers computed using the shared secret `AUTOMATION_WEBHOOK_SECRET`:

| Header | Format | Validation Rule | Rejection Status |
| :--- | :--- | :--- | :--- |
| `X-Automation-Timestamp` | `<unix_epoch_seconds>` (e.g., `1794807702`) | Must be present, valid base-10 integer, and within `±300` seconds of server UTC time | `401 Unauthorized` (missing, non-integer, or expired timestamp) |
| `X-Automation-Signature` | `sha256=<64_char_hex>` | Computed as `HMAC-SHA256(AUTOMATION_WEBHOOK_SECRET, f"{timestamp}.{raw_body_utf8}")` and verified via `hmac.compare_digest` | `401 Unauthorized` if header is missing; `403 Forbidden` if signature prefix/digest is invalid or mismatched |

**Canonical Signing String**:
```text
{X-Automation-Timestamp}.{raw_utf8_request_body}
```

---

## 2. Endpoint Specifications

### 2.1 `POST /api/v1/automation/docs-sync` (GitHub-to-RAG Sync Callback)
- **Authentication**: Required (`X-Automation-Timestamp` + `X-Automation-Signature`).
- **Purpose**: Re-indexes added/modified `README.md` and `docs/**/*.md` files into `public.resume_chunks`, deactivates/removes chunks for deleted documentation files, and deduplicates repeated webhook deliveries by `delivery_id` (`FR-001`–`FR-004`).
- **Request Body (`DocsSyncCallbackRequest`)**:
  ```json
  {
    "delivery_id": "72d3162e-cc78-11e3-81ab-4c9367dc0958",
    "commit_sha": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
    "branch": "main",
    "upserted_files": [
      {
        "file_path": "docs/resume.md",
        "content": "### **ALLEN JAMES LAXAMANA**\nJunior .NET / Full-Stack Developer..."
      },
      {
        "file_path": "README.md",
        "content": "# Allen James Laxamana Portfolio\nMonorepo architecture..."
      }
    ],
    "removed_files": [
      "docs/legacy-notes.md"
    ]
  }
  ```
- **Validation Rules (`422 Unprocessable Entity` on failure)**:
  - `branch` MUST be `"main"`.
  - Every `file_path` in `upserted_files` and `removed_files` MUST match `^(README\.md|docs/[A-Za-z0-9_./-]+\.md)$` and MUST NOT contain `..`.
  - Unknown fields are rejected (`extra="forbid"`).
- **Response (`200 OK` — `DocsSyncCallbackResponse`)**:
  ```json
  {
    "status": "synced",
    "delivery_id": "72d3162e-cc78-11e3-81ab-4c9367dc0958",
    "commit_sha": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0",
    "chunks_upserted": 8,
    "chunks_removed": 1
  }
  ```
  *(When `delivery_id` has already been processed, returns `200 OK` with `"status": "duplicate_ignored"`, `"chunks_upserted": 0`, `"chunks_removed": 0`.)*

---

### 2.2 `POST /api/v1/contact` (Public Visitor Contact Form Submission)
- **Authentication**: Public (CORS-restricted to `CORS_ORIGINS`).
- **Purpose**: Persists a visitor's contact inquiry in `public.contact_inquiries` (`triage_status = 'pending'`), dispatches a non-blocking background webhook trigger (`BackgroundTasks`) to n8n (`N8N_CONTACT_WEBHOOK_URL`), and immediately returns a confirmation response (`FR-005`, `SC-003`).
- **Request Body (`ContactSubmissionRequest`)**:
  ```json
  {
    "name": "Sarah Jenkins",
    "email": "s.jenkins@techrecruiting.io",
    "subject": ".NET Full-Stack Developer Opening",
    "message": "Hi Allen, we were impressed by SuhayCore and would love to schedule an interview for our Junior .NET Developer role."
  }
  ```
- **Validation Rules (`422 Unprocessable Entity` on failure)**:
  - `name`: stripped string, `2..120` chars.
  - `email`: stripped string, `5..254` chars, valid email pattern (`^[^@\s]+@[^@\s]+\.[^@\s]+$`).
  - `subject`: optional stripped string, `<= 200` chars.
  - `message`: stripped string, `2..4000` chars.
  - Unknown fields rejected (`extra="forbid"`).
- **Response (`201 Created` — `ContactSubmissionResponse`)**:
  ```json
  {
    "inquiry_id": "c4b9c8e2-901a-4b77-9214-35b1bc8e0f11",
    "status": "received",
    "triage_status": "pending",
    "message": "Thank you for reaching out! Your message has been received and Allen will respond shortly."
  }
  ```

---

### 2.3 `POST /api/v1/automation/contact-triage` (Contact Lead Triage Result Callback)
- **Authentication**: Required (`X-Automation-Timestamp` + `X-Automation-Signature`).
- **Purpose**: Called by n8n after classifying a contact inquiry into `recruiter`, `freelance project`, or `general inquiry` and dispatching the Discord webhook notification (`FR-006`, `FR-007`).
- **Request Body (`ContactTriageCallbackRequest`)**:
  ```json
  {
    "inquiry_id": "c4b9c8e2-901a-4b77-9214-35b1bc8e0f11",
    "intent_category": "recruiter",
    "triage_summary": "Recruiter outreach from Sarah Jenkins regarding a Junior .NET Developer interview.",
    "notification_sent": true
  }
  ```
- **Validation Rules (`422 Unprocessable Entity` on failure)**:
  - `intent_category` MUST be one of `"recruiter"`, `"freelance project"`, or `"general inquiry"`.
  - `triage_summary` MUST be `1..1000` chars.
  - Unknown fields rejected (`extra="forbid"`).
- **Response (`200 OK` — `ContactTriageCallbackResponse`)**:
  ```json
  {
    "inquiry_id": "c4b9c8e2-901a-4b77-9214-35b1bc8e0f11",
    "triage_status": "classified",
    "intent_category": "recruiter",
    "updated": true
  }
  ```

---

### 2.4 `POST /api/v1/automation/watchdog/cleanup` (Weekly Watchdog & Stale Chunk Cleanup Callback)
- **Authentication**: Required (`X-Automation-Timestamp` + `X-Automation-Signature`).
- **Purpose**: Called by the weekly n8n watchdog workflow after probing frontend and backend health. Inspects `public.resume_chunks` for stale or orphaned vector chunks (`is_active = false` or superseded revision), deletes them when `auto_clean = true`, records a `public.watchdog_runs` audit log, and returns whether an owner Discord alert is required (`FR-008`, `FR-009`).
- **Request Body (`WatchdogCleanupCallbackRequest`)**:
  ```json
  {
    "frontend_healthy": true,
    "backend_healthy": true,
    "frontend_latency_ms": 142,
    "backend_latency_ms": 68,
    "auto_clean": true
  }
  ```
- **Response (`200 OK` — `WatchdogCleanupCallbackResponse`)**:
  ```json
  {
    "run_id": "9f81c2b0-4d12-4e8a-819b-0e1122334455",
    "status": "cleaned",
    "frontend_healthy": true,
    "backend_healthy": true,
    "active_chunks_count": 7,
    "stale_chunks_found": 2,
    "stale_chunks_deleted": 2,
    "deleted_chunk_keys": [
      "docs/legacy-notes.md::overview",
      "docs/legacy-notes.md::details"
    ],
    "alert_required": true,
    "alert_reasons": [
      "Cleaned 2 stale/orphaned vector chunks from public.resume_chunks."
    ]
  }
  ```
  *(When both endpoints are healthy and `stale_chunks_found == 0`, returns `"status": "healthy"`, `"alert_required": false`, `"alert_reasons": []`.)*
  *(Status precedence: `"degraded"` if either endpoint is unhealthy, else `"cleaned"` if `stale_chunks_deleted > 0`, else `"healthy"`.)*
