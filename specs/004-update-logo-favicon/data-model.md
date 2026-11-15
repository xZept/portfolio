# Data Model: Update Sticky Top Bar Logo and Favicon

**Feature Branch**: `004-update-logo-favicon`  
**Date**: 2026-11-15  
**Spec**: [spec.md](spec.md)

This feature is purely frontend/static-asset focused and introduces no database tables, API schemas, or persistent user state.

## Entities

### Brand Logo Asset

- **Source Path (Repo Root)**: `images/others/logo.png`
- **Served Path (Next.js Public)**: `frontend/public/images/others/logo.png` → served at `/images/others/logo.png`
- **Format & Dimensions**: PNG (RGBA), `500 × 500` pixels (`1:1` square aspect ratio)
- **Consumers**:
  1. `StickyHeader` (`frontend/src/components/sections/StickyHeader.tsx`): Rendered inside the `32px × 32px` (`h-8 w-8`) Neo-Brutalist brand badge in `<header role="banner">`.
  2. `RootLayout` (`frontend/src/app/layout.tsx`): Referenced by Next.js `Metadata.icons` (`icon`, `shortcut`, `apple`) to emit browser favicon `<link>` tags.
- **Validation Rules**:
  - Asset must exist at `frontend/public/images/others/logo.png` and be byte-identical to `images/others/logo.png`.
  - Rendered dimensions in `StickyHeader` must preserve `1:1` aspect ratio (`object-contain`) without clipping, stretching, or increasing header height.
