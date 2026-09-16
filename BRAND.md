# أبو عز — Brand Lock

Locked visual identity for **موقع أبو عز**. Do not use SEDRA / honey assets, or prior Pinterest / violet DesignerAssets directions.

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
| Favicon / Apple touch | Same JPEG |

**Do not** use `logo-sedra-ref.jpg`, `sedra-logo.jpeg`, or any honey/SEDRA asset on this site.

## Color system

| Role | Hex | Notes |
|------|-----|--------|
| Primary red | `#E42C23` | Brand primary (sitewide UI) |
| Logo red (reference) | ~`#E42410` | From wordmark; keep `#E42C23` as UI primary |
| Canvas / background | `#FFFFFF` | Pure white |
| Surface | `#FFFFFF` | Cards on white |
| Text | `#1A1A1A` | Near-black |
| Text secondary / muted | `#6B6B6B` | Soft gray |
| Border | `#E8E8EA` | Soft gray border |
| Border strong | `#D4D4D8` | Inputs / dividers |
| Red soft (tints) | `rgba(228, 44, 35, 0.08)` | Selection / soft fills |
| Red dark (press) | `#C71F18` | Active / pressed CTA |

Neutrals only around **red + white**. No violet, purple, or Pinterest accent palettes.

## Layout & UX rules

- Arabic **RTL**, mobile-first (iPhone Safari)
- Clean, premium, editorial — **not** masonry / Pinterest feed
- Uniform gallery cards (fixed aspect ratio), generous white space
- Routes: `#/` (home/gallery), `#/order`, `#/pay`, `#/orders`, `#/admin`

## Product scope

Design-services site: gallery → request design (order wizard) → my orders → simple admin. Demo storage via `localStorage`.
