# Tools

Local developer utilities that are not part of extension runtime logic.

- `icons/create_icons.py`: icon generation helper for extension assets.

Rules:

- Keep tool scripts deterministic and local-only.
- Do not import tool scripts from runtime `src/` modules.
- Prefer invoking tools manually or from explicit maintenance workflows.
