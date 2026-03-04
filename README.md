# SCREEN Collector

Browser extension (Manifest V3) for full-page screenshots with local history, preview editing, and PNG/JPG/PDF export.
Current extension version: `1.0.25`.

For complete scope and constraints, see [PRODUCT_SPEC.md](PRODUCT_SPEC.md).

## Install (Unpacked)
1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this repository folder.
4. Pin the extension if needed.

## Basic Use
- Click the toolbar icon and choose **Capture Full Page**.
- Or use `Alt+Shift+P`.
- After capture, preview opens automatically.

## Capture Behavior
- Captures the full page by scrolling and stitching multiple viewport tiles.
- Hides fixed/sticky page elements during capture to reduce repeated headers/footers.
- Uses stable handling for long captures, including quota-aware retries.

## Preview Capabilities
- Zoom in/out by clicking the image.
- Edit before export: crop, blur, highlight, text, shape, emoji.
- Optional source URL + capture timestamp stamp.
- Copy image to clipboard from Preview (with optional Docs-limit resizing from settings).
- Export as:
  - PNG
  - JPG
  - PDF (`Auto`, `A4`, `Letter`)

## Oversized Pages
- Pages that exceed single-canvas limits are saved as multiple image parts.
- Preview opens in split overview mode and displays all parts side-by-side.
- Click a part to toggle zoom; `Shift+click` zooms one part and collapses other zoomed parts.
- History remains available for individual part management.

## Settings
Open popup → **Settings** to configure:
- default export format
- default PDF page size
- auto-download on preview load
- optional downloads permission (grant/revoke)

## Storage
- Captures are stored locally in IndexedDB.
- History view supports open, delete, and clear-all.
- No remote upload pipeline exists in this project.

## Repository Layout
```text
SCREEN Collector/
├── manifest.json
├── src/
│   ├── background/      # service worker
│   ├── content/         # injected capture agent
│   ├── offscreen/       # stitching document
│   ├── popup/           # action popup
│   ├── preview/         # review/edit/export page
│   ├── history/         # saved captures UI
│   ├── options/         # extension settings page
│   └── shared/          # constants/messages/db/settings
└── assets/icons/
```

## Current Limitations
- Cross-origin iframe capture is incomplete.
- Highly custom JavaScript scroll implementations are best-effort.
- Split overview is for visual review; edit/export tools are currently disabled in that mode.
