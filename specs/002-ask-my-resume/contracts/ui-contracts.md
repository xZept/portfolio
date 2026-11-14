# Frontend UI & Interaction Contracts: Ask My Resume AI Assistant Drawer

**Feature Branch**: `002-ask-my-resume`  
**Visual System**: Neo-Brutalist Sky Blue (Constitution Principles II & III)

---

## 1. Visual Token Contract (All Assistant Components)

| Token / Element | Required CSS / Tailwind Specification | Prohibited Styles (Principle III) |
| :--- | :--- | :--- |
| **Drawer Canvas / Thread Area** | `bg-[#F8FAFC] text-[#0F172A]` | No `backdrop-blur-*` or translucent frosted backgrounds |
| **Cards, Message Bubbles, Chips, Inputs** | `bg-[#FFFFFF] border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]` | No `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl` |
| **Primary Accent (Floating Trigger, User Bubble, Cap Banner, Active Badge)** | `bg-[#38BDF8] text-[#0F172A] border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]` | No purple/pink gradients (`from-purple-*`, `to-pink-*`, etc.) |
| **Interactive Hover State** | `hover:bg-[#0284C7] hover:text-[#FFFFFF]` | No soft glow or blurred hover elevation |

---

## 2. Component & DOM Contracts

### 2.1 Persistent Floating Trigger (`FloatingAskTrigger.tsx` — `FR-001`)
- **Position**: Fixed at bottom-right of viewport (`fixed bottom-6 right-6 z-40`).
- **Test ID**: `data-testid="floating-ask-resume-trigger"`.
- **Styling**: `border-2 border-[#0F172A] bg-[#38BDF8] text-[#0F172A] shadow-[4px_4px_0px_#0F172A] hover:bg-[#0284C7] hover:text-[#FFFFFF]`.
- **Behavior**: Clicking from any scroll position opens `AskResumeDrawer` (`open = true`).

### 2.2 Drawer Header, Live Quota Counter & Clear Chat (`FR-005`, `FR-011`)
- **Live Message Counter**:
  - Test ID: `data-testid="ask-resume-quota-counter"`
  - Exact text format: `${remainingMessages} / 15 messages remaining` (starts at `15 / 15 messages remaining`, decrements by `1` per completed question down to `0 / 15 messages remaining`).
- **Clear Chat Button**:
  - Test ID: `data-testid="ask-resume-clear-chat"`
  - Clears visible thread (`messages = []`) and restores the 3 starter prompt chips while **preserving** `remainingMessages` in `sessionStorage`.

### 2.3 Curated Starter Prompt Chips (`FR-004`)
Displayed when `messages.length === 0` (initial state and after clicking **"Clear Chat"**). Clicking any chip immediately submits that prompt (disabled when `isStreaming || isCapReached`):
1. `"How did Allen architect SuhayCore in .NET 10 & Blazor?"`
2. `"Tell me about his RAG AI chatbot and FastAPI work at DACON."`
3. `"What certifications and database experience does he hold?"`

### 2.4 Incremental Streaming & Clickable Inline Source Badges (`FR-007`–`FR-009`)
- **Streaming Indicator**: Visible (`data-testid="ask-resume-streaming-indicator"`) while tokens stream incrementally into the assistant message bubble.
- **Inline Source Citation Badges (`data-testid="ask-resume-citation-badge"`)**:
  - Rendered as clickable Neo-Brutalist pill buttons (`border-2 border-[#0F172A] bg-[#38BDF8]/30 hover:bg-[#38BDF8] px-2 py-0.5 font-mono text-xs font-black`).
  - Canonical badge labels & portfolio card targets:
    - `[Work: Orani Suhay Foundation]` → `#experience` / `#card-work-suhay`
    - `[Work: DACON Corp]` → `#experience` / `#card-work-dacon`
    - `[Project: FitQuest]` → `#experience` / `#card-project-fitquest`
    - `[Education: BPSU]` → `#education` / `#card-education-bpsu`
    - `[Certifications]` → `#certifications` / `#card-certifications`
- **Click Action (`FR-009`)**:
  - Smoothly scrolls the target card/section into view (`scrollIntoView({ behavior: "smooth", block: "center" })`).
  - Applies a temporary high-contrast highlight state (`data-highlighted="true"` / `ring-4 ring-[#38BDF8]`) on the target card for `2500ms`.
  - On narrow/mobile viewports (`window.innerWidth < 768`), automatically closes the drawer so the scrolled and highlighted card is unobstructed.

### 2.5 15-Message Session Cap Banner (`FR-012`)
When `remainingMessages === 0` (`0 / 15 messages remaining`):
- Locks/disables the text input (`disabled`), send button (`disabled`), and starter prompt chips (`disabled`).
- Displays a Sky-Blue (`bg-[#38BDF8] border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A]`) banner (`data-testid="ask-resume-cap-banner"`) containing:
  - Exact text: `"Session cap reached — email Allen directly at allenjames.laxamana@gmail.com"`
  - Action Button 1: **"Copy Email"** (`data-testid="cap-banner-copy-email"`) — copies `allenjames.laxamana@gmail.com` to clipboard and shows instant `"Copied!"` confirmation.
  - Action Button 2: **"Open in Gmail"** (`data-testid="cap-banner-open-gmail"`) — opens `https://mail.google.com/mail/?view=cm&fs=1&to=allenjames.laxamana@gmail.com` in a new tab (`target="_blank" rel="noopener noreferrer"`).

### 2.6 Inline Stream Error State & Recovery (`FR-013`)
When the assistant service is unavailable or a stream fails mid-response:
- Does **not** deduct from the 15-message session quota.
- Renders an inline error block (`data-testid="ask-resume-inline-error"`) inside the thread with:
  - **"Retry"** button (`data-testid="ask-resume-retry-button"`) that re-submits the failed prompt without double-charging quota.
  - Direct email link (`href="mailto:allenjames.laxamana@gmail.com"`) displaying `allenjames.laxamana@gmail.com`.
