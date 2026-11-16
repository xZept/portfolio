# UI Contract: Neo-Brutalist Contact Inquiry Form (`ContactSection.tsx`)

**Feature**: `006-n8n-automation-layer`  
**Component**: `frontend/src/components/sections/ContactSection.tsx`  
**Governance**: Constitution Principles II (*Neo-Brutalist Sky Blue Visual System*) & III (*Anti-Vibe-Coding Visual Discipline*)

---

## 1. Visual Token Compliance

All interactive controls and status banners added to `ContactSection.tsx` MUST strictly adhere to the Neo-Brutalist Sky Blue token set:

- **Outer Banner Card**: `bg-[#38BDF8]` (`Card tone="sky"`), `border-2 border-[#0F172A]`, `shadow-[4px_4px_0px_#0F172A]`.
- **Form Container Card**: `bg-[#FFFFFF]`, `border-2 border-[#0F172A]`, `shadow-[4px_4px_0px_#0F172A]`, `p-5 sm:p-6`.
- **Form Inputs & Textarea (`name`, `email`, `subject`, `message`)**:
  - Surface: `bg-[#F8FAFC]` focusing to `bg-[#FFFFFF]`.
  - Border & Shadow: `border-2 border-[#0F172A]`, `focus:outline-none focus:ring-2 focus:ring-[#0284C7]`.
  - Typography: `text-sm font-bold text-[#0F172A] placeholder:text-[#0F172A]/50`.
- **Submit Button**:
  - Default: `border-2 border-[#0F172A] bg-[#38BDF8] text-[#0F172A] font-black shadow-[4px_4px_0px_#0F172A]`.
  - Hover: `hover:bg-[#0284C7] hover:text-[#FFFFFF]`.
  - Disabled / Submitting: `disabled:opacity-60 disabled:cursor-not-allowed`.
- **Prohibited Styles**: Zero `backdrop-blur-*`, zero soft/blurred shadows (`shadow-sm`..`shadow-2xl`), and zero purple/pink gradients.

---

## 2. Interaction & Accessibility States

1. **Fields & Labels**:
   - `<label htmlFor="contact-name">` (`Name *`, `autoComplete="name"`, `required`, `minLength={2}`, `maxLength={120}`)
   - `<label htmlFor="contact-email">` (`Email *`, `type="email"`, `autoComplete="email"`, `required`, `minLength={5}`, `maxLength={254}`)
   - `<label htmlFor="contact-subject">` (`Subject (Optional)`, `maxLength={200}`)
   - `<label htmlFor="contact-message">` (`Message *`, `required`, `minLength={2}`, `maxLength={4000}`, `rows={4}`)
2. **Non-Blocking Submission Flow (`US2 Acceptance Scenarios 1 & 3`)**:
   - Submitting the form calls `POST ${NEXT_PUBLIC_API_BASE_URL}/api/v1/contact`.
   - When the backend responds `201 Created`, displays a crisp confirmation banner (`role="status"`, `data-testid="contact-form-success"`) inside the card:
     > *"Message received! Allen has been notified and will get back to you shortly."*
   - Resets the form fields and re-enables the submit button.
   - Preserves the existing `Direct Email` display (`data-testid="contact-email-text"`), `Copy email` button, and `Write email` (`mailto:`) link so all existing `frontend/tests/ask-resume-and-contact.test.tsx` and `frontend/tests/sections-us3.test.tsx` tests continue to pass without regression.
