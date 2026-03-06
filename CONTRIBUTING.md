# Contributing to THE Collector

Thanks for contributing. This repository uses strict quality gates and release discipline.

## Development Workflow

1. Create a branch from `main`.
2. Keep changes focused and behavior-safe.
3. Run local checks before opening a PR:

```bash
npm run lint
npm run test:unit
npm run test:coverage
npm run test:coverage:runtime
npm run test:integration
npm run test:security-policy
npm run test:stability
npm run test:performance
npm run test:e2e:smoke
npm run test:e2e:visual
npm run format:check
```

## Pull Requests

- Use clear PR titles (`feat:`, `fix:`, `chore:` style preferred).
- Keep runtime API/message contracts backward-compatible unless explicitly planned.
- Include changelog notes for user-visible or policy-level changes.
- Keep UX/UI aligned with Figma source of truth:
  - `https://www.figma.com/design/sECUN6qSqUygWoG7PhC548/THECollector---UI-Kit---Screens?t=UVQ55HTnnPvLrqyo-0`

## Versioning

For code changes, keep versions synchronized:

- `manifest.json`
- `package.json`
- `README.md`
- `CLAUDE.md`
- `CHANGELOG.md`

## Security and Privacy

- Local-only and no-tracking policy is mandatory for roadmap features.
- Do not introduce external network calls without explicit approval and policy updates.
- Respect manifest permission baseline checks.

## Review Standards

- At least one human review is required for merges to `main`.
- All required CI checks must pass.
- Keep docs and wiki synchronized with shipped behavior/policy changes.
