# Visual Exception Register

This register tracks temporary visual snapshot tolerances above the default target (`maxDiffPixels <= 2`).

| Snapshot              | Current Tolerance | Reason                                                                   | Planned Reduction |
| --------------------- | ----------------- | ------------------------------------------------------------------------ | ----------------- |
| `history-default.png` | `300`             | History header/filter row still has platform font/rendering variance.    | `<= 100`          |
| `history-empty.png`   | `250`             | Empty state vertical rhythm still differs slightly across platforms.     | `<= 100`          |
| `history-loading.png` | `250`             | Skeleton/loading gradients vary across render backends and antialiasing. | `<= 100`          |

Reduction policy:

1. Exceptions are temporary and reviewed every UX/UI calibration pass.
2. New exceptions require an explicit reason and target.
3. Remove exception rows once snapshots pass at the default target.
