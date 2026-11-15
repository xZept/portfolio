# UI & Metadata Contract: Sticky Top Bar Logo & Favicon

**Feature Branch**: `004-update-logo-favicon`  
**Date**: 2026-11-15  
**Spec**: [spec.md](spec.md)

## 1. Sticky Top Bar Brand Slot (`StickyHeader`)

- **Component**: `frontend/src/components/sections/StickyHeader.tsx`
- **Anchor**: `<a href="#top">`
- **Logo Container**:
  - Size: `h-8 w-8 shrink-0` (`32px × 32px`)
  - Styling: `border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] overflow-hidden` (Neo-Brutalist Sky Blue visual system; zero-blur shadow)
  - Accessibility: `aria-hidden="true"` on the decorative emblem container; `<Image alt="" ... />` so the link's accessible name remains `"Allen James Laxamana"`
- **Image Element**:
  - Component: `next/image` (`Image`)
  - `src`: `"/images/others/logo.png"`
  - `width`: `32`, `height`: `32`
  - `className`: `"h-full w-full object-contain"`
  - `priority`: `true` (above-the-fold persistent header)
- **Invariants**:
  - Must NOT render the `AJ` text monogram.
  - Must NOT alter `PROFILE_SUMMARY.fullName`, `NAV_SECTIONS`, `"Ask My Resume"` button, mobile menu toggle, or header height/padding.

## 2. Browser Favicon Metadata (`RootLayout`)

- **Module**: `frontend/src/app/layout.tsx`
- **Export**: `metadata: Metadata`
- **Contract**:
  ```ts
  icons: {
    icon: "/images/others/logo.png",
    shortcut: "/images/others/logo.png",
    apple: "/images/others/logo.png",
  }
  ```
- **Invariants**:
  - `title` and `description` in `metadata` remain unchanged.
  - `RootLayout` DOM structure and body classes remain unchanged.
