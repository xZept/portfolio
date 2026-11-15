# Feature Specification: Update Sticky Top Bar Logo and Favicon

**Feature Branch**: `004-update-logo-favicon`

**Created**: 2026-11-15

**Status**: Draft

**Input**: User description: "Update the logo on the sticky top bar and favicon. Replace the existing one with images/others/logo.png without modifying anything else."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Updated Brand Logo in Sticky Top Bar (Priority: P1)

A recruiter, hiring manager, or portfolio visitor opens the portfolio site and immediately sees the updated brand logo from `images/others/logo.png` in the sticky top navigation bar in place of the existing `AJ` monogram badge. Clicking the brand area continues to return the visitor to the top of the page, while the owner's name, navigation links, active section pill, and "Ask My Resume" trigger remain unchanged.

**Why this priority**: The sticky top bar is the persistent visual anchor visible across every section of the portfolio; replacing the placeholder monogram with the custom brand logo delivers the primary branding update.

**Independent Test**: Can be fully tested by loading the portfolio home page, inspecting the left side of the sticky top bar on both desktop and mobile viewports, confirming that `images/others/logo.png` renders cleanly without distortion or clipping in place of the previous `AJ` badge, and verifying that clicking the brand area scrolls back to the top of the page.

**Acceptance Scenarios**:

1. **Given** a visitor loads the portfolio on desktop or mobile, **When** they view the sticky top bar, **Then** the existing logo badge on the left is replaced by the brand image from `images/others/logo.png` positioned beside the owner's full name ("Allen James Laxamana").
2. **Given** a visitor scrolls down the page and clicks the brand logo or name in the sticky top bar, **When** the click activates, **Then** the page navigates back to the top of the portfolio just as before.
3. **Given** a visitor views the logo across different screen sizes, **When** the sticky top bar renders, **Then** the logo maintains its aspect ratio, remains crisp and legible at compact header dimensions, and does not alter the height or alignment of the sticky top bar.

---

### User Story 2 - Updated Browser Favicon (Priority: P2)

A visitor opens the portfolio in a desktop or mobile browser, pins the tab, or saves a bookmark. The browser tab and bookmark display the updated brand logo derived from `images/others/logo.png` instead of a generic browser icon or previous favicon.

**Why this priority**: A matching favicon reinforces brand identity across browser tabs, bookmarks, and history lists alongside the in-page sticky header logo.

**Independent Test**: Can be tested independently by opening the portfolio in a browser, checking the browser tab icon and bookmark preview, and verifying that the icon loads the brand mark from `images/others/logo.png` with zero broken or missing icon requests.

**Acceptance Scenarios**:

1. **Given** a visitor opens the portfolio in a web browser, **When** the page finishes loading, **Then** the browser tab displays the favicon sourced from `images/others/logo.png`.
2. **Given** a visitor bookmarks the portfolio or views it among multiple open browser tabs, **When** the tab icon is displayed at small icon sizes, **Then** the brand logo remains recognizable and free of missing-image placeholders.

---

### User Story 3 - Unchanged Page Content, Styling, and Behavior (Priority: P3)

A returning visitor or stakeholder verifies that replacing the logo and favicon did not alter any other part of the portfolio. All navigation links, active section highlighting, Hero content and buttons, Experience cards, About timeline, 3D Tech Globe, Skills table, Education, Certifications, Contact banner, and "Ask My Resume" assistant remain identical in appearance and behavior.

**Why this priority**: The user explicitly requested replacing only the sticky top bar logo and favicon without modifying anything else, making strict scope isolation essential.

**Independent Test**: Can be tested independently by comparing all page sections, navigation flows, and interactive controls before and after the update to confirm zero unintended visual, textual, or behavioral changes outside the sticky top bar logo slot and browser favicon.

**Acceptance Scenarios**:

1. **Given** the updated logo and favicon are applied, **When** a visitor navigates through every section of the portfolio on desktop, tablet, and mobile viewports, **Then** all text, images, layout spacing, colors, borders, shadows, and interactive features outside the replaced logo and favicon remain unchanged.

---

### Edge Cases

- **Small-size legibility**: The favicon and compact sticky top bar logo render at small dimensions (such as 16×16 / 32×32 pixels in browser tabs and compact header height); the asset must remain properly centered and proportionally scaled without stretching or awkward cropping.
- **High-DPI / Retina displays**: On high-pixel-density screens, the sticky top bar logo and favicon must appear sharp rather than blurry or pixelated.
- **Mobile viewport widths**: On narrow mobile viewports (320px–480px), the updated logo in the sticky top bar must not squeeze, wrap, or cause horizontal overflow alongside the owner's name, "Ask My Resume" button, and mobile menu toggle.
- **Browser favicon caching**: Returning visitors or reviewers verifying the favicon must receive the updated icon without stale placeholder references in page metadata.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The sticky top navigation bar MUST replace the existing `AJ` monogram logo badge with the image from `images/others/logo.png`.
- **FR-002**: The updated sticky top bar logo MUST preserve proportional aspect ratio, fit cleanly within the existing brand slot beside "Allen James Laxamana", and preserve the sticky top bar's existing height, alignment, and responsiveness across desktop, tablet, and mobile viewports.
- **FR-003**: The updated sticky top bar logo MUST comply with the portfolio's Neo-Brutalist Sky Blue visual rules, using no blurry drop-shadows, glassmorphism, or unapproved gradients.
- **FR-004**: The portfolio MUST configure its browser favicon (and standard page icon metadata) using `images/others/logo.png` in place of any existing or default favicon.
- **FR-005**: The brand area containing the updated logo MUST retain its existing accessible labeling and top-of-page navigation behavior when activated.
- **FR-006**: No other visual elements, copy, sections, navigation items, buttons, assets, or interactive behaviors anywhere in the portfolio MAY be modified as part of this change.

### Key Entities *(include if feature involves data)*

- **Brand Logo Asset**: The graphic emblem stored at `images/others/logo.png`, serving as both the visible brand mark in the sticky top bar and the source graphic for the browser favicon.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of page loads display `images/others/logo.png` in the sticky top bar brand slot with zero broken images and zero aspect-ratio distortion.
- **SC-002**: 100% of browser tab loads display the updated favicon derived from `images/others/logo.png` with zero failed icon requests.
- **SC-003**: Zero layout shifts, element overlaps, or horizontal page overflows occur in the sticky top bar across mobile (320px–480px), tablet (768px), and desktop (1024px–1440px+) viewports.
- **SC-004**: 100% of existing portfolio sections, copy, assets, and interactive features outside the sticky top bar logo slot and browser favicon remain unchanged.

## Assumptions

- `images/others/logo.png` is the final approved graphic asset and requires no further artwork edits beyond standard sizing/formatting needed for web display and browser favicon compatibility.
- Replacing "the existing one" in the sticky top bar refers specifically to the current `AJ` monogram badge next to "Allen James Laxamana", while keeping the owner's full name text ("Allen James Laxamana") and all navigation controls intact.
- Because the portfolio currently has no custom favicon configured, "replace the existing one" for the favicon means setting `images/others/logo.png` as the site's custom favicon so browsers no longer fall back to a default/missing icon.
- No other pages, headers, footers, or external services need logo updates under this specification.
