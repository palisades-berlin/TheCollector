# ADR 0014: Four-Part Versioning Policy (`X.Y.Z.W`)

- Status: accepted
- Date: 2026-03-15

## Context

The repository previously used three-part versioning (`X.Y.Z`) with mandatory per-change bumps.
That model made it impossible to express docs/tests-only updates as the smallest possible increment
without increasing the patch segment used for code/runtime work.

The project needs:

1. deterministic lockstep versions across release-critical files;
2. a smaller increment path for docs/tests-only changes;
3. enforceable CI rules so versioning mistakes fail before merge;
4. compatibility with release scripts and tag validation.

## Decision

Versioning policy is standardized as follows:

1. **Format:** all active version pointers use four-part numeric format `X.Y.Z.W`.
2. **Bump matrix:**
   - code/runtime change: increment `Z`, reset `W=0`;
   - docs/tests-only change: increment `W` only;
   - `X`/`Y` changes remain explicit/manual release decisions.
3. **Tag format:** exact release tags use `vX.Y.Z.W`.
4. **Lockstep files:** `manifest.json`, `package.json`, `README.md`, `CHANGELOG.md`, `AGENTS.md`, `CLAUDE.md`.
5. **Gates:** CI quality must run a dedicated version policy checker that validates:
   - four-part format in required files;
   - lockstep equality across required files;
   - top changelog version equals manifest version;
   - exact-tag format and equality;
   - bump-type correctness based on changed-file scope.
6. **Migration baseline:** first four-part baseline is `1.9.92.0`.
7. **Historical preservation:** historical three-part release entries are preserved as-is; only
   active and future policy/docs/tooling use four-part rules.

## Consequences

- Docs/tests-only cycles can ship without consuming patch increments reserved for code/runtime work.
- Versioning behavior becomes auditable and machine-enforced in CI.
- Release automation and tag validation stay deterministic with one canonical format.
- Historical changelog continuity is preserved without rewriting legacy entries.
