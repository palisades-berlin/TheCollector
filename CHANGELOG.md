# Changelog

## 1.3.0 - 2026-03-04
- Redesigned the full extension UI with a Liquid Glass visual system across popup, history, options, and preview.
- Added reusable liquid design tokens (`--liquid-blur`, `--liquid-tint`, `--spring-easing`) and shared glass utility classes.
- Implemented lensed/refraction-style overlays, specular highlights, and radial transparency falloff for glass surfaces.
- Added shared interaction engine (`src/shared/liquid.js`) for:
  - adaptive tint initialization
  - scroll-aware shrinking chrome (scale 1 -> 0.7 with spring easing)
  - tilt parallax (DeviceOrientation + pointer fallback)
- Extended accessibility support with reduced-motion, reduced-transparency, and high-contrast handling.

## 1.2.0 - 2026-03-04
- Applied a UX/UI polish pass across popup, history, options, and preview.
- Introduced a shared token expansion for motion, radius, shadow, and glass surfaces in `src/shared/ui.css`.
- Added liquid-glass aesthetics (translucent layered surfaces, backdrop blur, highlight gradients).
- Increased corner roundness hierarchy for cards, buttons, overlays, and controls.
- Added/refined micro-animations for panels, badges, hover/press states, and toasts.
- Added reduced-motion fallbacks in polished page styles.

## 1.1.4 - 2026-03-04
- Hardened popup message handling against missing payloads to prevent runtime UI errors.
- Cached frequently used popup DOM references to reduce repeated lookups.
- Added release packaging script `scripts/package-release.sh`.
- Added README release packaging instructions.

## 1.1.3 - 2026-03-04
- Merged `screen-collector` and `url-collector` into one extension: `Collector`.
- Replaced popup with a two-tab interface: `Capture` and `URLs`.
- Kept full screenshot capture flow (service worker, offscreen stitching, preview, history, options).
- Added URL collection flow in popup:
  - add current tab URL
  - add all tab URLs in current window
  - tracking parameter cleanup
  - dedupe, open, remove, clear
  - copy, TXT export, CSV export, email draft
- Added shared URL utility module at `src/shared/url-utils.js`.
- Added URL utility tests at `tests/url-utils.test.mjs`.
- Unified product naming in UI/docs to `Collector`.
- Updated maintainer docs and README for merged functionality.

## 1.0.33 and earlier
- Legacy SCREEN Collector versions before URL collector merge.
