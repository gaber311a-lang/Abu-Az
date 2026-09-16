# أبو عز — Brand Lock

This file locks the visual identity for **موقع أبو عز**. Do not drift toward other brands (e.g. SEDRA honey) or prior Pinterest / violet DesignerAssets directions.

## Name

| Field | Value |
|--------|--------|
| Arabic name | **أبو عز** |
| Site title | موقع أبو عز |
| English shorthand (docs only) | Abu Az / Abu Ezz |

## Logo

| Field | Value |
|--------|--------|
| Primary file | `docs/assets/logo-abu-ezz.jpg` |
| Absolute path (workspace) | `/workspace/AbuAz/docs/assets/logo-abu-ezz.jpg` |
| Appearance | Red Arabic wordmark **أبو عز** on white |
| Favicon | Same JPEG via `rel="icon"` |

**Do not** use `logo-sedra-ref.jpg`, `sedra-logo.jpeg`, or any honey/SEDRA asset on this site.

## Color system

| Role | Hex | Notes |
|------|-----|--------|
| Primary red | `#E42C23` | Brand primary (in use sitewide) |
| Logo red (reference) | ~`#E42410` | Approximate from wordmark; keep `#E42C23` as UI primary |
| Canvas / background | `#FFFFFF` | Pure white |
| Surface | `#FFFFFF` | Cards on white |
| Text | `#1A1A1A` | Near-black |
| Text secondary / muted | `#6B6B6B` | Soft gray |
| Border | `#E8E8EA` | Soft gray border |
| Red soft (tints) | `rgba(228, 44, 35, 0.08)` | Selection / soft fills |
| Red dark (press) | `#C71F18` | Active / pressed CTA |

Derive neutrals only around **red + white**. No violet, purple, or Pinterest-style accent palettes.

## Layout & UX rules

- Arabic **RTL**, mobile-first (iPhone Safari)
- Clean, premium, editorial — **not** masonry / Pinterest feed
- Uniform gallery cards (consistent aspect ratio), generous white space
- Routes: `#/` (home/gallery), `#/order`, `#/pay`, `#/orders`, `#/admin`

## Product scope

Design-services site: gallery → request design (order wizard) → my orders → simple admin. Demo storage via `localStorage`.
