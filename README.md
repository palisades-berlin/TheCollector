# SCREEN Collector

Manifest V3 browser extension for Chrome and Edge that captures full-page screenshots, supports local history, provides in-preview editing, and exports to PNG, JPG, and PDF.

Current extension version: `1.0.33`.

## Overview
SCREEN Collector captures a full page by scrolling the active tab, collecting viewport tiles, and stitching them into a final image.  
All capture data is stored locally in extension storage (IndexedDB); there is no backend upload pipeline.

## Core Architecture
The capture pipeline is split across extension contexts:

- `service worker`: capture orchestration, retries/throttling, progress/result events
- `content script`: page metrics, target detection, scrolling, temporary fixed/sticky suppression
- `offscreen document`: tile stitching and final image persistence
- `preview page`: review, editing, and export
- `history page`: stored capture browsing and deletion
- `options page`: export defaults, auto-download behavior, optional permissions

## Features

### Capture
- One-click toolbar capture
- Keyboard shortcut: `Alt+Shift+P`
- Tile-by-tile full-page capture via `chrome.tabs.captureVisibleTab`
- Fixed/sticky element suppression during capture pass
- Capture target detection/locking:
  - page scrolling
  - dominant same-origin iframe mode
  - dominant inner scroll-container mode
- Target mismatch/liveness checks across capture phases
- Per-tab capture mutex to prevent conflicting concurrent runs
- Quota-aware capture throttling and retry/backoff
- Progress/result surfaced in popup UI

### Preview & Editing
- Click-to-zoom preview
- Editing tools:
  - Crop
  - Blur
  - Highlight
  - Text
  - Rectangle shape
  - Emoji markers
- Optional URL + timestamp stamp
- URL in preview sanitized to clickable `http/https` only
- Clipboard copy with optional Docs-limit resize behavior

### Export
- PNG
- JPG
- PDF (`Auto`, `A4`, `Letter`)
- Smart PDF page splitting for `A4`/`Letter` (heuristic break selection)
- In split overview mode, export/edit actions are intentionally disabled

### History & Storage
- Local persistence in IndexedDB
- Open, single delete, and clear-all flows
- No cloud sync or server upload path in current implementation

### Settings
- Default export format
- Default PDF page size
- Auto-download behavior
- Download directory
- Optional `downloads` permission grant/revoke
- Save-As behavior for downloads

## Oversized Capture Behavior
When a capture exceeds safe canvas limits, SCREEN Collector uses oversized fallback handling and split-aware preview behavior for stable rendering and review of large pages.

## Install (Unpacked)
1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this repository folder.
4. Pin the extension if needed.

## Basic Usage
1. Open any page.
2. Trigger capture from the toolbar button or `Alt+Shift+P`.
3. Review/edit in Preview.
4. Export or manage captures in History.

## Security & Privacy
- Captures remain in extension-local storage unless downloaded by the user.
- Deleting from History removes stored records from IndexedDB.
- Uninstalling the extension clears extension storage per browser behavior.
- No backend upload path exists in this codebase.

## Current Constraints
- Cross-origin iframe capture is incomplete.
- Highly custom JavaScript scroll behavior is best-effort.
- Browser storage limits still apply.
- Capture scope depends on active-tab permissions and browser site access.
- Browser PDF documents are not captured by this pipeline.

## Repository Layout
```text
SCREEN Collector/
├── manifest.json
├── assets/icons/
└── src/
   ├── background/      # service worker
   ├── content/         # injected capture agent
   ├── offscreen/       # stitching document
   ├── popup/           # action popup
   ├── preview/         # review/edit/export
   ├── history/         # saved captures UI
   ├── options/         # extension settings
   └── shared/          # constants/messages/db/settings
```

## Near-Term Roadmap
1. Unified merge/synthesis flow for oversized split captures
2. Deeper nested iframe + nested scroll-container traversal
3. Further permission-scope refinement where feasible
