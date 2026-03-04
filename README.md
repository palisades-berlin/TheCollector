# screen-collector

Full-page screenshot Chrome extension (Manifest V3). One click captures the entire scrollable page.

## Loading the Extension

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select this `screen-collector/` folder
4. The camera icon appears in the toolbar

## Usage

- **Click the toolbar icon** → "Capture Full Page" button
- **Keyboard shortcut:** `Alt+Shift+P` (customisable at `chrome://extensions/shortcuts`)
- A preview tab opens automatically when capture completes
- In the preview tab: click image to zoom, PNG/JPG download buttons in toolbar

## How It Works

1. Content script injected → measures full page dimensions
2. Fixed/sticky elements hidden to avoid repeating headers
3. Page scrolled tile-by-tile; each viewport captured via `captureVisibleTab`
4. Tiles stitched in an offscreen document using HTML Canvas
5. Result saved to IndexedDB (local only, never uploaded)
6. Preview tab opened with the assembled image

## File Structure

```
screen-collector/
├── manifest.json
├── src/
│   ├── background/service-worker.js   # Orchestrates capture
│   ├── content/capture-agent.js       # Injected: scrolling + metrics
│   ├── offscreen/offscreen.js         # Canvas stitching + IDB save
│   ├── popup/                         # Toolbar popup UI
│   ├── preview/                       # Full preview tab
│   ├── history/                       # Browse & delete past captures
│   └── shared/                        # db.js, messages.js, constants.js
└── assets/icons/
```

## Known Limitations

- Fixed elements are hidden (not repositioned) during capture — they appear in the first tile only once page is restored
- Pages taller/wider than 16 000 px fail with an error (multi-image fallback planned)
- Cross-origin iFrames are not captured
- PDF export not yet implemented
