# Visual Exception Register

This register tracks temporary visual snapshot tolerances above the default target (`maxDiffPixels <= 2`).

| Snapshot              | Current Tolerance | Reason                                                                   | Planned Reduction |
| --------------------- | ----------------- | ------------------------------------------------------------------------ | ----------------- |
| `shared-primitives-matrix.png` | `13000` | Chromium text/anti-alias rendering still varies between local macOS and GitHub macOS runners. | `<= 5000` |
| `shared-primitives-matrix-dark.png` | `4000` | Dark-theme glyph rasterization remains inconsistent across runner environments. | `<= 1500` |
| `popup-capture-default.png` | `10000` | Popup header + primary action text rendering drifts on GitHub macOS parity node. | `<= 3000` |
| `history-default.png` | `5600`            | History header/filter row still has platform font/rendering variance.    | `<= 100`          |
| `history-empty.png`   | `220`             | Empty state vertical rhythm still differs slightly across platforms.     | `<= 100`          |
| `history-loading.png` | `220`             | Skeleton/loading gradients vary across render backends and antialiasing. | `<= 100`          |
| `preview-error.png` | `17000` | Preview error state typography and callout contrast rasterize differently on hosted macOS runners. | `<= 5000` |

Active reduction tasks for these temporary exceptions are tracked in `docs/todo-list.md`.

Reduction policy:

1. Exceptions are temporary and reviewed every UX/UI calibration pass.
2. New exceptions require an explicit reason and target.
3. Remove exception rows once snapshots pass at the default target.
