# Feature Specification: Hero Download Resume Button

**Feature Branch**: `003-hero-download-resume`

**Created**: 2026-11-15

**Status**: Draft

**Input**: User description : "Add a \"Download Resume\" Neo-Brutalist button next to \"Ask My Resume\" in the Hero section that downloads Laxamana_Resume_DotNet_FullStack.pdf with a clean filename and shows a brief \"Downloaded\" confirmation state."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Direct Resume Download from Hero Section (Priority: P1)

A recruiter, hiring manager, or portfolio visitor lands on the portfolio's Hero section and wants to save a copy of the owner's resume for offline review or applicant tracking. Right next to the "Ask My Resume" call-to-action, they see a clearly labeled "Download Resume" button styled in the portfolio's Neo-Brutalist visual language. Clicking it immediately downloads `Laxamana_Resume_DotNet_FullStack.pdf` with a clean filename without navigating them away from the page.

**Why this priority**: Providing immediate, one-click access to the resume PDF in the Hero section is the core value of this feature and directly supports recruiter and hiring workflows.

**Independent Test**: Can be fully tested by loading the portfolio home page, locating the "Download Resume" button next to "Ask My Resume" in the Hero section, activating it, and verifying that a file named `Laxamana_Resume_DotNet_FullStack.pdf` is downloaded while the user remains on the page.

**Acceptance Scenarios**:

1. **Given** a visitor is viewing the Hero section on desktop or mobile, **When** they look at the primary action area, **Then** a "Download Resume" button is displayed directly adjacent to the "Ask My Resume" button with Neo-Brutalist styling (`2px solid #0F172A` border, zero-blur `4px 4px 0px #0F172A` offset shadow, no blurry shadows or glassmorphism).
2. **Given** a visitor activates the "Download Resume" button (via click, tap, or keyboard), **When** the download action executes, **Then** the browser initiates a file download of the resume PDF saved with the clean filename `Laxamana_Resume_DotNet_FullStack.pdf`, and the visitor remains on the portfolio page.

---

### User Story 2 - Brief "Downloaded" Confirmation Feedback (Priority: P2)

Immediately after activating the "Download Resume" button, the visitor sees a brief, unmistakable "Downloaded" confirmation state on the button so they know their click registered and the file download started, before the button automatically returns to its default "Download Resume" state.

**Why this priority**: Browser download indicators can be subtle or out of the user's immediate line of sight; inline confirmation prevents redundant clicks and builds confidence that the action succeeded.

**Independent Test**: Can be tested independently by clicking the "Download Resume" button and observing the button label/state change to "Downloaded", then waiting briefly to confirm it automatically resets to "Download Resume".

**Acceptance Scenarios**:

1. **Given** the button is in its default "Download Resume" state, **When** the visitor triggers a successful download, **Then** the button immediately transitions to display a "Downloaded" confirmation state.
2. **Given** the button is in the "Downloaded" confirmation state, **When** a brief confirmation period (2–3 seconds) elapses, **Then** the button automatically reverts to its default "Download Resume" state and can be used again.

---

### User Story 3 - Responsive & Accessible Hero Action Layout (Priority: P3)

Visitors using keyboard navigation, screen readers, or smaller mobile viewports can easily locate, focus, and activate the "Download Resume" button alongside "Ask My Resume" without layout overlap, clipping, or horizontal scrolling.

**Why this priority**: Ensures the Hero action group remains usable, legible, and visually balanced across all devices and assistive technologies.

**Independent Test**: Can be tested independently by resizing the viewport across mobile and desktop breakpoints and navigating the Hero actions using only keyboard controls and a screen reader.

**Acceptance Scenarios**:

1. **Given** a visitor views the Hero section on a narrow mobile viewport, **When** the "Ask My Resume" and "Download Resume" buttons are rendered, **Then** both buttons remain fully visible, properly spaced, and free of text clipping or horizontal overflow.
2. **Given** a visitor navigates the Hero section using a keyboard, **When** they tab to the "Download Resume" button and press Enter or Space, **Then** the button shows a clear focus indicator, triggers the download, and exposes the state change to assistive technologies.

---

### Edge Cases

- **Unavailable or missing resume file**: If the resume PDF cannot be retrieved or is unavailable at the time of click, the button MUST NOT display a misleading "Downloaded" confirmation state and should remain usable or provide clear, non-intrusive feedback.
- **Rapid repeated clicks**: If a visitor clicks the button multiple times in quick succession while the "Downloaded" state is active, the UI must remain stable without overlapping timers, broken layout, or stuck confirmation states.
- **Pop-up or download blockers / in-app browsers**: If a user's browser environment restricts programmatic downloads, the action should still degrade gracefully without crashing the Hero section.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Hero section MUST display a "Download Resume" button positioned next to the existing "Ask My Resume" button.
- **FR-002**: The "Download Resume" button MUST conform to the portfolio's Neo-Brutalist Sky Blue visual system, featuring a `2px solid #0F172A` border, a hard zero-blur `4px 4px 0px #0F172A` offset shadow, interactive hover/active feedback, and zero blurry drop-shadows, glassmorphism, or unapproved gradients.
- **FR-003**: Activating the "Download Resume" button MUST trigger a download of `Laxamana_Resume_DotNet_FullStack.pdf` with the clean filename `Laxamana_Resume_DotNet_FullStack.pdf` (free of random hashes, query parameters, or encoded artifacts) without navigating away from the current page.
- **FR-004**: Upon initiating the download, the button MUST transition to a brief "Downloaded" confirmation state for a short, predictable duration (2–3 seconds) before automatically returning to its default "Download Resume" state.
- **FR-005**: The Hero action group containing "Ask My Resume" and "Download Resume" MUST adapt cleanly across desktop and mobile viewports with no element overlap, clipping, or horizontal page overflow.
- **FR-006**: The "Download Resume" button MUST be fully keyboard-operable, display a visible focus state, and communicate its label and "Downloaded" state change to assistive technologies.
- **FR-007**: If the resume file is unavailable or fails to download, the button MUST NOT falsely display the "Downloaded" confirmation state.

### Key Entities *(include if feature involves data)*

- **Resume Document**: The static downloadable PDF artifact (`Laxamana_Resume_DotNet_FullStack.pdf`) presented to visitors with a clean, human-readable filename.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of visitors on supported desktop and mobile browsers can initiate and complete the download of `Laxamana_Resume_DotNet_FullStack.pdf` in a single click or tap from the Hero section.
- **SC-002**: The downloaded file is saved with the exact clean filename `Laxamana_Resume_DotNet_FullStack.pdf` on 100% of successful downloads.
- **SC-003**: Visual confirmation ("Downloaded") appears immediately (within 100ms of activation) and automatically resets to "Download Resume" within 2–3 seconds.
- **SC-004**: Zero layout overlap, text truncation, or horizontal overflow occurs between "Ask My Resume" and "Download Resume" across standard mobile (320px–480px) and desktop (1024px+) viewports.
- **SC-005**: The button passes 100% of keyboard navigation and focus-visibility checks as well as Neo-Brutalist visual system compliance checks.

## Assumptions

- The PDF file `Laxamana_Resume_DotNet_FullStack.pdf` is already (or will be) provided as a static downloadable asset in the portfolio's public assets.
- `Laxamana_Resume_DotNet_FullStack.pdf` itself is the desired clean download filename (preserving exact casing and underscores without hashes or extraneous suffixes).
- No download analytics tracking, email gating, or backend database persistence is required for this feature.
- The "Ask My Resume" button remains the primary Hero CTA, and "Download Resume" is placed alongside it as a complementary Neo-Brutalist action button.
