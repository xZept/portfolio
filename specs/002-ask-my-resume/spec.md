# Feature Specification: Ask My Resume AI Assistant Drawer

**Feature Branch**: `002-ask-my-resume`

**Created**: 2026-11-14

**Status**: Draft

**Input**: User description: "Create a global trigger and slide-over drawer UI for an interactive "Ask My Resume" AI assistant, accessible from a floating icon button at the bottom right of the viewport from any scroll position. Style the trigger button, drawer surface, message bubbles, chips, and inputs with the exact same Sky-Blue & Navy neo-brutalist borders, typography, and hard zero-blur offset shadows defined in the project constitution.

Core Functional Requirements:
1. Starter Prompts & Custom Input:
   - Display three clickable starter prompt chips when a session starts (and allow returning to them via a "Clear Chat" button):
     1. "How did Allen architect SuhayCore in .NET 10 & Blazor?"
     2. "Tell me about his RAG AI chatbot and FastAPI work at DACON."
     3. "What certifications and database experience does he hold?"
   - Provide a custom text input box with keyboard submit (`Enter`) and send button so visitors or recruiters can ask any question about Allen's work history, projects, education, certifications, and technical skills.
2. Incremental Streaming & Grounded Citations:
   - Stream assistant responses incrementally token-by-token with a visible typing/streaming indicator.
   - Attach clickable inline source badges (`[Work: Orani Suhay Foundation]`, `[Work: DACON Corp]`, `[Project: FitQuest]`, `[Education: BPSU]`, `[Certifications]`) to every factual claim. Clicking a source badge smoothly scrolls the background portfolio to that corresponding section and highlights the relevant card.
3. Guardrails & Off-Topic Refusal:
   - Restrict assistant responses strictly to verified facts from Allen's professional resume and portfolio.
   - Politely decline off-topic, general trivia, or private personal questions outside Allen's professional background, steering the visitor back to his engineering work or direct contact options.
4. Session Rate Limiting & Fallback States:
   - Display a live message counter (e.g., `X / 15 messages remaining`) in the drawer header.
   - Once a visitor hits the 15-message session cap, lock the text input and starter chips, and display a sky-blue neo-brutalist banner reading: `"Session cap reached — email Allen directly at allenjames.laxamana@gmail.com"` paired with two action buttons: **"Copy Email"** (with instant copied confirmation) and **"Open in Gmail"** (opening a pre-addressed Gmail compose window).
   - If the assistant service is temporarily unavailable or a stream fails mid-response, show an inline error state with a **"Retry"** button and Allen's direct email link."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Global Access, Starter Prompts & Custom Resume Q&A (Priority: P1)

A recruiter or hiring manager browsing any section of the portfolio wants to quickly ask targeted questions about Allen James Laxamana's engineering experience without hunting through every card. From any scroll position, they click the floating "Ask My Resume" icon button anchored at the bottom right of the screen to open a slide-over drawer styled in the portfolio's Sky-Blue & Navy neo-brutalist visual system. Inside, they can either click one of three curated starter prompt chips or type their own question and submit with `Enter` or the send button, and reset the conversation view at any time with "Clear Chat".

**Why this priority**: Global discoverability, immediate starter prompts, and custom question input form the core entry point and primary interaction loop of the assistant. Without this, visitors cannot open or converse with the assistant.

**Independent Test**: Can be tested independently by scrolling to multiple positions on the portfolio, clicking the floating bottom-right trigger button to open the drawer, verifying the neo-brutalist styling (solid `#0F172A` `2px` borders, `4px 4px 0px #0F172A` hard offset shadows, `#38BDF8` / `#0284C7` accents, no blur or glassmorphism), clicking each of the three starter prompt chips, submitting a custom question via `Enter` and the send button, and clicking "Clear Chat" to return to the starter prompt view.

**Acceptance Scenarios**:

1. **Given** a visitor is at any scroll position on the portfolio, **When** they view the bottom-right corner of the viewport, **Then** they see a persistent floating "Ask My Resume" icon button with a `2px solid #0F172A` border, hard `4px 4px 0px #0F172A` offset shadow, and Sky-Blue (`#38BDF8`) / Navy (`#0F172A`) neo-brutalist styling.
2. **Given** the drawer is closed, **When** the visitor clicks the floating trigger button (or any page-level "Ask My Resume" trigger), **Then** the slide-over drawer opens smoothly, displaying the drawer header, live message counter, and three clickable starter prompt chips:
   - `"How did Allen architect SuhayCore in .NET 10 & Blazor?"`
   - `"Tell me about his RAG AI chatbot and FastAPI work at DACON."`
   - `"What certifications and database experience does he hold?"`
3. **Given** the drawer is open on the initial view, **When** the visitor clicks a starter prompt chip, **Then** that prompt is immediately submitted as a user message bubble and the assistant begins responding.
4. **Given** the drawer is open, **When** the visitor types a question in the custom text input box and presses `Enter` (without `Shift`) or clicks the send button, **Then** the message is appended to the conversation thread, the input clears, and the assistant begins responding.
5. **Given** a conversation has one or more messages, **When** the visitor clicks the "Clear Chat" button, **Then** the visible message thread clears and returns to the initial state showing the three starter prompt chips.

---

### User Story 2 - Incremental Streaming Responses & Clickable Portfolio Citations (Priority: P2)

While evaluating Allen's technical claims, a hiring manager wants immediate visual feedback as the answer is generated and needs to verify where each claim comes from in the portfolio. As the assistant answers, text streams in token-by-token alongside a visible typing/streaming indicator. Every factual claim includes clickable inline source badges (such as `[Work: Orani Suhay Foundation]`, `[Work: DACON Corp]`, `[Project: FitQuest]`, `[Education: BPSU]`, or `[Certifications]`). Clicking any badge smoothly scrolls the background portfolio to that section and highlights the corresponding card.

**Why this priority**: Incremental streaming keeps perceived latency low, while grounded clickable citations build trust and connect the conversational UI directly back to the portfolio's visual evidence.

**Independent Test**: Can be tested independently by submitting a question that spans multiple resume areas (e.g., SuhayCore, DACON, FitQuest, BPSU, and Certifications), observing progressive token-by-token rendering with an active streaming indicator, verifying inline source badges appear on factual claims, and clicking each badge to confirm smooth scrolling to the matching section and visible highlight treatment on the target card.

**Acceptance Scenarios**:

1. **Given** a visitor submits a question, **When** the assistant begins generating an answer, **Then** a visible typing/streaming indicator is displayed and response tokens appear incrementally in real time inside the assistant message bubble.
2. **Given** the assistant produces a response containing factual claims about Allen's background, **When** the response completes (or as citations resolve), **Then** every factual claim is accompanied by the corresponding clickable inline source badge(s) from: `[Work: Orani Suhay Foundation]`, `[Work: DACON Corp]`, `[Project: FitQuest]`, `[Education: BPSU]`, and `[Certifications]`.
3. **Given** an assistant message displays a clickable source badge (e.g., `[Work: DACON Corp]`), **When** the visitor clicks that badge, **Then** the background portfolio smoothly scrolls to the corresponding section (`Experience`, `Education`, or `Certifications`) and applies a clear visual highlight to the relevant card.
4. **Given** a visitor on a narrow/mobile viewport clicks a source badge while the drawer covers the background page, **When** the navigation triggers, **Then** the drawer collapses or closes so the scrolled and highlighted portfolio card is clearly visible.

---

### User Story 3 - Factual Grounding Guardrails & Off-Topic Refusal (Priority: P3)

A visitor tests the assistant with either a general trivia question (e.g., "What is the capital of France?"), an unrelated coding task ("Write me a snake game"), or a private personal question not found in Allen's resume. The assistant stays strictly grounded in verified portfolio/resume facts, politely declines the off-topic or private inquiry, and steers the conversation back to Allen's software engineering work or direct contact options.

**Why this priority**: Guardrails prevent hallucinated claims about Allen's credentials and ensure the assistant serves solely as a reliable, professional recruiting tool.

**Independent Test**: Can be tested independently by submitting off-topic trivia, general coding requests, and private personal questions, and verifying the assistant declines without fabricating resume details while offering relevant engineering topics or Allen's contact info.

**Acceptance Scenarios**:

1. **Given** a visitor asks an off-topic question (e.g., general trivia, unrelated coding help, or world news), **When** the assistant responds, **Then** it politely declines the request, does not fabricate information, and steers the visitor back to Allen's projects, experience, skills, or contact options.
2. **Given** a visitor asks a private personal question not covered by Allen's professional resume/portfolio, **When** the assistant responds, **Then** it politely states that it only answers questions grounded in Allen's professional background and suggests emailing Allen directly for other inquiries.
3. **Given** a visitor asks about a skill, role, or project detail that is absent from Allen's resume, **When** the assistant responds, **Then** it accurately states that the detail is not listed in Allen's resume rather than guessing or inventing experience.

---

### User Story 4 - Session Rate Limiting, Direct Email Cap Banner & Error Recovery (Priority: P4)

To keep usage sustainable while still converting high-intent recruiters, the drawer tracks remaining messages in the header (`X / 15 messages remaining`). Once a visitor reaches 15 messages in a session, the input and starter chips lock and a high-contrast sky-blue neo-brutalist banner offers direct email actions ("Copy Email" and "Open in Gmail"). If the assistant service is temporarily unavailable or a stream drops mid-response, an inline error state provides a "Retry" button and Allen's direct email link.

**Why this priority**: Rate limiting and graceful failure states protect service availability and ensure recruiters always have a frictionless fallback path to reach Allen directly.

**Independent Test**: Can be tested independently by sending 15 messages to observe the header counter decrement from `15 / 15 messages remaining` to `0 / 15 messages remaining`, verifying the input and starter chips lock at 0, testing "Copy Email" (clipboard + instant confirmation) and "Open in Gmail" on the cap banner, and simulating a service outage/mid-stream failure to verify the inline error state with "Retry" and direct email link.

**Acceptance Scenarios**:

1. **Given** a new session starts, **When** the visitor opens the drawer, **Then** the header displays `15 / 15 messages remaining` and decrements by 1 with each completed user question.
2. **Given** the visitor has sent 15 messages in the current session (`0 / 15 messages remaining`), **When** the 15th exchange completes, **Then** the custom text input, send button, and starter prompt chips are locked/disabled, and a sky-blue (`#38BDF8`) neo-brutalist banner appears reading: `"Session cap reached — email Allen directly at allenjames.laxamana@gmail.com"` with **"Copy Email"** and **"Open in Gmail"** action buttons.
3. **Given** the session cap banner is displayed, **When** the visitor clicks **"Copy Email"**, **Then** `allenjames.laxamana@gmail.com` is copied to the clipboard and the button displays an instant copied confirmation state.
4. **Given** the session cap banner is displayed, **When** the visitor clicks **"Open in Gmail"**, **Then** a new browser tab/window opens to a pre-addressed Gmail compose URL for `allenjames.laxamana@gmail.com`.
5. **Given** the assistant service is unavailable or a response stream fails mid-response, **When** the failure occurs, **Then** the drawer displays an inline error state inside the thread containing a **"Retry"** button (which re-submits the failed prompt) and a clickable direct email link to `allenjames.laxamana@gmail.com`.

---

### Edge Cases

- **Empty or Whitespace-Only Input**: Submitting an empty or whitespace-only message via `Enter` or the send button MUST be ignored without consuming a message from the 15-message session quota.
- **Submission While Streaming**: While an assistant response is actively streaming, the send button and starter prompt chips MUST prevent duplicate concurrent submissions until the current stream finishes or errors.
- **Clear Chat After Partial Quota Usage**: Clicking "Clear Chat" resets the visible conversation thread back to the three starter prompt chips, while preserving the remaining session message quota so the 15-message cap cannot be bypassed by clearing the UI.
- **Clear Chat After Hitting Session Cap**: If the session cap (`0 / 15 messages remaining`) has already been reached, clicking "Clear Chat" (if enabled) MUST keep the input/starter chips locked and keep the session cap banner visible.
- **Mid-Stream Failure Quota Handling**: If a request fails before completing a valid response and the user clicks "Retry", retrying that failed turn MUST NOT double-charge the 15-message session quota.
- **Multi-Line Input (`Shift + Enter`)**: Pressing `Enter` submits the message, while pressing `Shift + Enter` inserts a newline without submitting (or if single-line input, `Enter` submits cleanly).
- **Keyboard & Focus Accessibility**: Pressing `Escape` while the drawer is open closes the drawer and returns focus cleanly; interactive controls (trigger, close button, starter chips, source badges, Retry, Copy Email, Open in Gmail) are keyboard-navigable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render a persistent floating "Ask My Resume" icon button fixed at the bottom right of the viewport, accessible from any scroll position across the portfolio.
- **FR-002**: Clicking the floating trigger button (or any existing page-level "Ask My Resume" trigger) MUST open a slide-over drawer UI containing a header, conversation area, and input footer.
- **FR-003**: All drawer UI elements—including the floating trigger button, drawer surface, header, message bubbles, starter prompt chips, source badges, cap banner, buttons, and text input—MUST strictly follow the project's Sky-Blue & Navy neo-brutalist visual tokens (`#F8FAFC` / `#FFFFFF` surfaces, `2px solid #0F172A` borders, `4px 4px 0px #0F172A` zero-blur hard offset shadows, `#38BDF8` primary accent, `#0284C7` hover accent, and zero blurry shadows, glassmorphism, or purple/pink gradients).
- **FR-004**: When a session starts (or after clicking "Clear Chat"), the drawer MUST display three clickable starter prompt chips:
  1. `"How did Allen architect SuhayCore in .NET 10 & Blazor?"`
  2. `"Tell me about his RAG AI chatbot and FastAPI work at DACON."`
  3. `"What certifications and database experience does he hold?"`
- **FR-005**: System MUST provide a **"Clear Chat"** button in the drawer that clears the displayed conversation messages and returns the view to the three starter prompt chips (preserving the current session's remaining message count).
- **FR-006**: System MUST provide a custom text input box with both keyboard submit (`Enter`) and a send button, ignoring empty/whitespace-only submissions and preventing overlapping submissions while a response is streaming.
- **FR-007**: System MUST stream assistant responses incrementally token-by-token with a visible typing/streaming indicator while generation is in progress.
- **FR-008**: System MUST attach clickable inline source badges (`[Work: Orani Suhay Foundation]`, `[Work: DACON Corp]`, `[Project: FitQuest]`, `[Education: BPSU]`, `[Certifications]`) to every factual claim in assistant responses.
- **FR-009**: Clicking any inline source badge MUST smoothly scroll the background portfolio to the corresponding section and visually highlight the relevant card (and on narrow viewports where the drawer covers the page, collapse/close the drawer so the highlighted card is visible).
- **FR-010**: System MUST restrict assistant responses strictly to verified facts from Allen's professional resume and portfolio, and MUST politely decline off-topic, general trivia, or private personal questions while steering the visitor back to Allen's engineering work or direct contact options.
- **FR-011**: System MUST display a live message counter in the drawer header in the format `X / 15 messages remaining`, updating as messages are used.
- **FR-012**: Upon reaching the 15-message session cap (`0 / 15 messages remaining`), System MUST lock the custom text input, send button, and starter prompt chips, and MUST display a sky-blue (`#38BDF8`) neo-brutalist banner reading `"Session cap reached — email Allen directly at allenjames.laxamana@gmail.com"` with **"Copy Email"** (providing instant copied confirmation) and **"Open in Gmail"** (opening a pre-addressed Gmail compose window) action buttons.
- **FR-013**: If the assistant service is unavailable or a stream fails mid-response, System MUST display an inline error state with a **"Retry"** button (to re-attempt the failed prompt) and a direct email link to `allenjames.laxamana@gmail.com`.

### Key Entities *(include if feature involves data)*

- **Chat Session**: Represents a visitor's active assistant interaction, tracking remaining message quota (out of 15), lock status, and current message thread.
- **Chat Message**: Represents a single turn in the drawer (`user` or `assistant`), containing text content, streaming/error status, and associated source citations.
- **Source Citation Badge**: Represents a grounded reference linking a factual claim to one of five portfolio targets (`[Work: Orani Suhay Foundation]`, `[Work: DACON Corp]`, `[Project: FitQuest]`, `[Education: BPSU]`, `[Certifications]`), including its scroll target section and card highlight identifier.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Visitors can open the "Ask My Resume" drawer from any scroll position in 1 click and submit either a starter prompt or a custom question in under 5 seconds.
- **SC-002**: Assistant responses begin displaying incremental tokens and a visible streaming indicator within 1.5 seconds of submission under normal service conditions.
- **SC-003**: 100% of factual claims in assistant responses include at least one clickable inline source badge, and clicking any badge scrolls to and highlights the matching portfolio card within 1 second.
- **SC-004**: 100% of off-topic, trivia, or private personal test prompts are politely declined without fabricating unverified facts about Allen.
- **SC-005**: The live header counter accurately reflects remaining messages from `15 / 15` down to `0 / 15`, locks all prompt inputs at `0`, and provides working one-click "Copy Email" confirmation and "Open in Gmail" actions.
- **SC-006**: Simulated service unavailability or mid-stream interruption consistently renders the inline error state with functional "Retry" recovery and direct email fallback.

## Assumptions

- **Session Persistence Scope**: The 15-message session cap applies per browser session so that clicking "Clear Chat" resets the visible thread without resetting the remaining message quota.
- **Responsive Drawer Behavior**: On desktop viewports, the drawer slides in from the right without obscuring the majority of the portfolio; on narrow/mobile viewports where the drawer fills the screen width, clicking a source badge closes/minimizes the drawer after triggering the scroll so the user can see the highlighted card.
- **Direct Email Link Behavior**: "Open in Gmail" targets Gmail's web compose URL pre-filled with `allenjames.laxamana@gmail.com` in a new tab/window, while the inline error state's direct email link uses a standard `mailto:allenjames.laxamana@gmail.com` link.
- **Existing Trigger Integration**: Existing "Ask My Resume" and "Ask AI about this" triggers defined in `001-single-page-portfolio` will open this same global drawer (optionally pre-filling a project question when triggered from a card).
