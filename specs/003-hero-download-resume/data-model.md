# Data Model: Hero Download Resume Button

**Feature**: `003-hero-download-resume` | **Date**: 2026-11-15

This feature is purely client-side and static-asset driven; it introduces no database tables, backend models, or persisted state.

## Entities & Types

### 1. Resume Static Asset
- **Location**: `frontend/public/resume/Laxamana_Resume_DotNet_FullStack.pdf`
- **Public URL**: `/resume/Laxamana_Resume_DotNet_FullStack.pdf`
- **Download Filename**: `Laxamana_Resume_DotNet_FullStack.pdf`
- **MIME Type**: `application/pdf`

### 2. `ResumeDownloadState` (UI Component State)
- **Type**: `"idle" | "downloading" | "downloaded" | "error"`
- **Transitions**:
  - `idle` → `downloading`: User activates `"Download Resume"` button.
  - `downloading` → `downloaded`: `fetch("/resume/Laxamana_Resume_DotNet_FullStack.pdf")` succeeds with `response.ok === true` and blob download is triggered; starts `2500ms` reset timer.
  - `downloading` → `error`: `fetch` rejects or `!response.ok` (e.g., 404 when PDF is missing); starts `2500ms` reset timer to `idle` and does **not** display `"Downloaded"`.
  - `downloaded` → `idle`: `2500ms` confirmation timer elapses.
  - `downloaded` → `downloading`: User clicks again while in `downloaded` state; existing timer is cleared before re-fetching.
  - `error` → `idle`: `2500ms` timer elapses, or user retries.
