# Codex Prompt — Help & FAQ HTML Regeneration

## Purpose

This file is the procedure for regenerating the `Help & FAQ` section in
`src/options/options.html` whenever `docs/help-user-guide.md` changes.

Run this procedure in the same work cycle as any change to `docs/help-user-guide.md`
(see Pre-Commit Checklist Rule 5 in `CLAUDE.md` / `AGENTS.md`).

---

## Trigger

Any change to `docs/help-user-guide.md` — content, structure, new section, updated task,
tier change, feature addition or removal.

---

## Source and Target

| Role   | File                                                                                  |
| ------ | ------------------------------------------------------------------------------------- |
| Source | `docs/help-user-guide.md`                                                             |
| Target | `src/options/options.html`                                                            |
| Scope  | `<section data-settings-section="help-faq">` … `</section>` (replace inner HTML only) |

Do not touch anything outside the `data-settings-section="help-faq"` section.

---

## Content Rules

1. **Parity is mandatory.** Every topic covered in `docs/help-user-guide.md` must be
   represented in the HTML section. No topic may be omitted.
2. **Tone differs.** The markdown is instructional; the HTML must be plain and
   goal-oriented — write as if answering "how do I…" rather than describing the feature.
3. **No roadmap content.** Features that are not yet shipped must not appear.
   The docs-policy gate (`npm run test:docs-policy`) enforces this; do not bypass it.
4. **Preserve HTML structure.** The section consists of two `<section class="card sc-card">` blocks:
   - Block 1 — intro paragraphs (`<p class="muted">`)
   - Block 2 — FAQ list: `<div class="faq-list">` containing `<details class="faq-item">` /
     `<summary>` / `<p>` / `<ol><li>` entries
5. **No inline styles.** Use existing CSS classes only (`sc-card`, `faq-list`, `faq-item`,
   `muted`). Do not add new classes.
6. **Escape HTML entities.** Apostrophes → `&apos;`, ampersands → `&amp;`, angle brackets → `&lt;` / `&gt;`.

---

## Codex Prompt (paste to start)

```
Read docs/help-user-guide.md in full.
Read the current <section data-settings-section="help-faq"> block in src/options/options.html.

Your task: regenerate the inner HTML of that section to match the current content of
docs/help-user-guide.md.

Rules:
- Every topic in the markdown must appear as a <details> FAQ entry or intro paragraph.
- Tone must be plain and goal-oriented ("How do I…" answers), not feature-descriptive.
- Do not include any unshipped or roadmap-only features.
- Preserve the two-card structure: intro card first, then FAQ card with <div class="faq-list">.
- Use <details class="faq-item"><summary>…</summary><p>…</p></details> for each FAQ entry.
- Use <ol><li> for numbered steps inside FAQ answers.
- Use existing CSS classes only. No inline styles.
- Escape HTML entities correctly.
- Replace only the content inside <section data-settings-section="help-faq">…</section>.
  Do not touch any other part of options.html.

After editing, run: npm run test:docs-policy
Fix any failures before committing.
```

---

## Verification

After regenerating, confirm:

- [ ] `npm run test:docs-policy` passes (content parity + unshipped phrase check)
- [ ] Every section heading in `docs/help-user-guide.md` maps to at least one FAQ entry or intro line
- [ ] No feature appears in the HTML that is not in the markdown
- [ ] HTML renders correctly in the extension (`chrome://extensions` → load unpacked → open Settings → Help & FAQ)
