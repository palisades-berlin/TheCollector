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

## Multi-Machine Workflow

Use this routine when alternating between multiple development machines (2 or 3) on the same repository. GitHub is the single point of truth — all tracked files (including `CLAUDE.md`) are pushed to the private repo and pulled on every machine.

### Session Start (each machine)

```bash
git fetch --all --prune
git switch main
git pull --ff-only
npm ci
```

Optional shell aliases/functions (zsh/bash) to speed up daily sync:

```bash
alias sync-main='git fetch --all --prune && git switch main && git pull --ff-only && npm ci'
handoff-check() {
  git status
  npm run test:docs-policy
  npm run test:repo-hygiene
  npm run test:unit
}
```

### Branching and Sync Rules

1. Never work directly on `main`; create a short-lived branch per task using `codex/<topic>-<date>`.
2. Rebase frequently to keep branch history linear and reduce merge conflicts:

```bash
git fetch origin
git rebase origin/main
```

3. Keep commits small and checkpoint often so work can be resumed safely on any machine.
4. Prefer PR merges over direct branch merges for better CI visibility and conflict detection.

### Machine Handoff Checklist

Before switching machines:

```bash
git status
npm run test:docs-policy
npm run test:repo-hygiene
npm run test:unit
```

Then:

1. Commit and push if work is ready, or create a named stash (`git stash push -m "wip: <topic>"`).
2. Include a short handoff marker in the latest commit message when useful (example: `[handoff-ready]`).
3. On the next machine, start with the Session Start routine above before resuming.

Tip: if you added aliases/functions above on all machines, use `sync-main` at session start and `handoff-check` before switching machines.

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
- `AGENTS.md`
- `CLAUDE.md`
- `CHANGELOG.md`

## Security and Privacy

- Local-only and no-tracking policy is mandatory for roadmap features.
- Do not introduce external network calls without explicit approval and policy updates.
- Respect manifest permission baseline checks.
- Vulnerability reporting path and disclosure expectations are defined in [SECURITY.md](./SECURITY.md).

## Review Standards

- At least one human review is required for merges to `main`.
- All required CI checks must pass.
- Keep docs and wiki synchronized with shipped behavior/policy changes.
