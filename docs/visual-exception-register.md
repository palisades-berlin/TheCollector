# Visual Exception Register

This register tracks temporary visual snapshot tolerances above the default target (`maxDiffPixels <= 2`).

| Snapshot                            | Current Tolerance | Reason                                                                                                                                           | Planned Reduction |
| ----------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- |
| `shared-primitives-matrix.png`      | `12800`           | Chromium text/anti-alias rendering still varies between local macOS and GitHub macOS runners (recent CI peak: `12655`).                          | `<= 5000`         |
| `shared-primitives-matrix-dark.png` | `4000`            | Dark-theme glyph rasterization remains inconsistent across runner environments.                                                                  | `<= 1500`         |
| `popup-capture-default.png`         | `10200`           | Popup header + primary action text rendering drifts on GitHub macOS parity node.                                                                 | `<= 3000`         |
| `popup-error-state.png`             | `10400`           | Error toast/badge typography and spacing vary on hosted macOS parity nodes.                                                                      | `<= 3000`         |
| `popup-success-state.png`           | `10400`           | Success-state message row and icon rasterization vary on hosted macOS parity nodes.                                                              | `<= 3000`         |
| `popup-urls-default.png`            | `10400`           | URL tab list layout + font rasterization differ on GitHub macOS visual runner.                                                                   | `<= 3000`         |
| `history-default.png`               | `6300`            | History header/filter row still has platform font/rendering variance.                                                                            | `<= 100`          |
| `history-empty.png`                 | `5800`            | Empty-state card typography and panel spacing drift significantly on hosted macOS parity node.                                                   | `<= 100`          |
| `history-loading.png`               | `4700`            | Skeleton/loading gradients and text antialiasing vary strongly across render backends.                                                           | `<= 100`          |
| `history-modal-open.png`            | `7800`            | Overlay/modal compositing and text antialiasing drift on hosted macOS parity node.                                                               | `<= 1000`         |
| `preview-error.png`                 | `17000`           | Preview error state typography and callout contrast rasterize differently on hosted macOS runners (recent CI peak: `16910`; held for stability). | `<= 5000`         |
| `preview-edit-mode.png`             | `20600`           | Preview editor controls + metadata typography drift on hosted macOS parity node (recent CI peak: `20242`).                                       | `<= 8000`         |
| `preview-toolbar-wrap.png`          | `25800`           | Wrapped toolbar/metadata row in narrow preview viewport is unstable across macOS runner font metrics (recent CI peak: `25598`).                  | `<= 12000`        |

Active reduction tasks for these temporary exceptions are tracked in `docs/todo-list.md`.

Reduction policy:

1. Exceptions are temporary and reviewed every UX/UI calibration pass.
2. New exceptions require an explicit reason and target.
3. Remove exception rows once snapshots pass at the default target.
