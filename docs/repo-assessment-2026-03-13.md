# Repository Assessment: TheCollector

**Assessed:** 2026-03-13  
**Assessor:** Staff Engineer (read-only audit — no changes made)

---

## Executive Summary

TheCollector is a well-engineered, solo/small-team Manifest V3 Chrome/Edge extension at version 1.9.68. The repository demonstrates a level of process discipline that significantly exceeds what is typical for individual-developer extension projects: it has a multi-stage CI pipeline, AST-based network-sink analysis, permission-drift guards, Playwright visual regression tests, 12 accepted ADRs, a rollback runbook, and a help-documentation freshness gate. The single most impactful area for improvement is hardening the GitHub Actions supply chain by replacing floating action version tags (`@v4`, `@v3`) with immutable SHA pins, and completing the currently partial CodeQL upload configuration so that security findings are actually surfaced in the repository's Security tab.

---

## Readiness Score

| Dimension                   | Score (1–5) | Confidence |
| --------------------------- | ----------- | ---------- |
| Repository professionalism  | 5           | High       |
| GitHub configuration        | 4           | High       |
| CI/CD pipelines             | 4           | High       |
| Code quality & architecture | 4           | High       |
| Testing                     | 4           | High       |
| Documentation               | 5           | High       |
| Security                    | 4           | High       |
| Developer experience        | 4           | High       |
| **Overall**                 | **4 / 5**   | High       |

---

## Findings

### 1. Repository Professionalism

**[Suggestion] Coverage badge is static / hardcoded**

> Evidence: `README.md` line 6 — `[![Coverage Gate](https://img.shields.io/badge/Coverage%20Gate-90%25%20lines-brightgreen)](./package.json)`
> The badge image is a static Shields.io label hardcoded to "90% lines". It does not reflect actual CI coverage results and will remain green even if the threshold is lowered or coverage drops. Consider using a dynamic coverage badge generated from actual run artifacts (e.g., Codecov, Coveralls, or a CI-published badge).

**[Minor] Micro-versioning pace obscures meaningful release history**

> Evidence: `CHANGELOG.md` lines 3–120 — versions 1.9.60 through 1.9.68 were all released on 2026-03-12 (nine versions in a single day).
> While the CHANGELOG entries are detailed and accurate, the high-frequency version bumping compresses individual changes to the point where release tags lose navigational value. Consider batching same-day changes into a single release or adopting a release-branch model that separates "integration checkpoints" from "published releases."

---

### 2. GitHub Configuration

**[Minor] No ISSUE_TEMPLATE or PULL_REQUEST_TEMPLATE defined**

> Evidence: `.github/` directory — only `CODEOWNERS`, `dependabot.yml`, and `workflows/` are present. No `ISSUE_TEMPLATE/` subdirectory or `PULL_REQUEST_TEMPLATE.md` was found.
> Without templates, contributors have no structured guidance when filing bugs or opening PRs. A minimal bug-report template and a PR checklist (linking to the pre-commit check sequence in `CONTRIBUTING.md`) would reduce maintenance friction as the contributor base grows.

**[Minor] CodeQL upload is gated behind an unset repository variable**

> Evidence: `.github/workflows/codeql.yml` line 49 — `upload: ${{ vars.CODEQL_UPLOAD_RESULTS == 'true' }}`
> The CodeQL analysis job runs, but its findings are not uploaded to the repository's Security tab unless the `CODEQL_UPLOAD_RESULTS` repository variable is explicitly set to `true`. ADR 0003 lists "CodeQL analysis" as a release-blocking CI gate, but if findings are not surfaced, the gate only verifies that the analysis completes without erroring, not that it reports no issues. The variable appears to not be set by default.

**[Suggestion] CODEOWNERS coverage could be more granular**

> Evidence: `.github/CODEOWNERS` lines 1–7 — global `* @palisades-berlin` with specific overrides for `.github/workflows/`, `scripts/`, and `manifest.json`.
> The global wildcard is appropriate for a sole-owner repository. If/when additional contributors are added, adding explicit patterns for `src/shared/` (the security-critical shared layer) and `src/background/` would make ownership intent clearer in PR review notifications.

---

### 3. CI/CD Pipelines

**[Major] GitHub Actions versions are tag-pinned, not SHA-pinned**

> Evidence: `.github/workflows/ci.yml` lines 12, 16, 68, 100, etc. — `actions/checkout@v4`, `actions/setup-node@v4`, `actions/cache@v4`, `actions/upload-artifact@v4`; `.github/workflows/codeql.yml` lines 28, 32, 44 — `github/codeql-action/init@v3`, `github/codeql-action/analyze@v3`; `.github/workflows/release-assets.yml` line 14 — `actions/checkout@v4`.
> Mutable version tags like `@v4` can be silently redirected by a compromised action maintainer. For a project that validates supply-chain hygiene in its own source code (AST-based network-sink analysis, permission drift checks), using SHA-pinned action references (e.g., `actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2`) is the consistent posture. This is especially important for the `release-assets.yml` workflow, which has `contents: write` permission.

**[Minor] `ci.yml` lacks a top-level `permissions:` block**

> Evidence: `.github/workflows/ci.yml` — no `permissions:` key at the workflow or job level (compare to `codeql.yml` which has an explicit block at lines 11–14).
> Without explicit permissions, GitHub Actions inherits the repository's default token permissions. `codeql.yml` and `release-assets.yml` both define scoped permissions, demonstrating awareness of the pattern. Applying `permissions: contents: read` at the `ci.yml` top level would ensure least-privilege defaults for all jobs in that workflow.

**[Suggestion] CI parallelism is not exploited within the `test:unit` script**

> Evidence: `package.json` line 13 — `test:unit` is a single shell command chaining 23 individual `node tests/*.test.mjs` invocations with `&&`.
> Because the chain uses `&&`, the first failing test file stops all subsequent tests from running, obscuring the full failure picture. A test runner (even a lightweight one) or a parallel execution wrapper would improve both fault visibility and overall CI wall-clock time. This is a developer-experience issue as much as a CI one.

---

### 4. Code Quality & Architecture

**[Suggestion] No TypeScript — JSDoc typedefs are baseline only**

> Evidence: `src/shared/types.js` — the file contains only `@typedef` declarations and exports `{}` with no runtime behavior. `src/background/service-worker.js` line 21 references `@typedef {import('../shared/types.js').UserSettings}`.
> The project uses plain JavaScript with JSDoc type hints for documentation and minimal tooling help. This is a deliberate choice (no TypeScript configuration exists anywhere in the repo), and the typedef module is a meaningful step toward formalising contracts. The absence of TypeScript limits static analysis depth, particularly across the multi-context extension message protocol, where type safety would catch payload mismatches at author time.

**[Minor] `getCurrentTier()` in `capabilities.js` retains deprecated legacy settings fields**

> Evidence: `src/shared/capabilities.js` lines 53–54 — `if (settings.ultraEnabled === true) return CAPABILITY_TIER.ULTRA; if (settings.proEnabled === true) return CAPABILITY_TIER.PRO;`
> ADR 0001 explicitly deprecates `proEnabled` and `ultraEnabled`, and `src/shared/types.js` still includes both in the `UserSettings` typedef. The backward-compat shim has no expiry condition and no logged migration warning, meaning it will persist indefinitely without a migration path. This is a low-risk debt item but should be scheduled for removal once sufficient upgrade time has passed.

**[Suggestion] Non-fatal logging is debug-flag-gated but the debug flag is undocumented**

> Evidence: `src/background/service-worker.js` lines 29–32 — `if (globalThis?.THE_COLLECTOR_DEBUG_NON_FATAL !== true) return;`
> The debug flag is used correctly (suppressed in production), but neither `README.md`, `CONTRIBUTING.md`, nor `docs/dev-workflow.md` document how to set it. Developers debugging captures locally may not discover this mechanism. A brief mention in `docs/dev-workflow.md` would improve the developer debugging experience.

---

### 5. Testing

**[Major] Runtime and preview-export coverage thresholds are very low**

> Evidence: `package.json` lines 15–16 — `test:coverage:runtime` sets `--lines 18 --functions 0 --branches 15 --statements 18` for `src/background/service-worker.js` and `src/offscreen/offscreen.js`; `test:coverage:preview-export` sets `--lines 20 --functions 20 --branches 15` for `src/preview/preview-export.js`.
> The 18–20% coverage floors mean that 80%+ of the lines in the capture service worker and the offscreen stitching document are untested. These are the most critical and failure-prone paths in the extension (capture orchestration, tile stitching, PDF export). While acknowledging the browser-context challenge for unit testing these modules, raising this floor — even incrementally via integration harnesses — should be a near-term priority.

**[Minor] Visual regression tolerances are very wide for several surfaces**

> Evidence: `docs/visual-exception-register.md` — `preview-toolbar-wrap.png` at 25,800 pixels (CI peak: 25,598), `preview-edit-mode.png` at 20,600 pixels, `popup-capture-default.png` at 10,200 pixels.
> The visual parity gate's stated target is `maxDiffPixels <= 2`, but numerous exceptions are an order of magnitude higher. At 25,800 pixel diff, the visual gate for the preview toolbar is effectively checking screen presence, not pixel accuracy. The register documents intended reductions, which is the right approach — but the reduction plan has no timeline or blocking constraint, making it easy to defer indefinitely.

**[Suggestion] No test framework — raw `node:assert` limits developer experience**

> Evidence: All `tests/*.test.mjs` files — tests use a manual `test(name, fn)` wrapper around `node:assert/strict`. No test framework is installed.
> The pattern works and keeps devDependencies minimal. However, it provides no structured output (TAP, JUnit), no watch mode, no test filtering by name, and no parallel execution. As the test suite grows (currently 23+ test files), adopting a lightweight runner such as Node.js's built-in test runner (`node:test`, available since Node 18 and stable in Node 20) would add these capabilities with zero new dependencies.

---

### 6. Documentation

**[Minor] No `CODE_OF_CONDUCT.md` present**

> Evidence: Repository root — no `CODE_OF_CONDUCT.md` file was found. No reference to a code of conduct appears in `CONTRIBUTING.md`.
> The repository has excellent governance documentation but lacks a standard community health file. GitHub's community health score and some store listing reviewers check for this. A minimal Contributor Covenant adoption would complete the standard open-source health file set.

**[Suggestion] Wiki sync is required but not enforced by CI**

> Evidence: `docs/dev-workflow.md` lines 93–126 and `CONTRIBUTING.md` lines 26–43 — both documents mandate that every commit/push must include an update to the GitHub Wiki (`Home.md`). This requirement is procedural only; no CI step verifies wiki state.
> Because the wiki is a separate git repository, enforcement is difficult. The current approach relies entirely on manual discipline. Consider at minimum adding a link-check or "last-synced version" marker in the wiki that CI can validate against `manifest.json`.

---

### 7. Security

**[Major] CodeQL findings not surfaced without repository variable set** _(also noted in GitHub Configuration)_

> Evidence: `.github/workflows/codeql.yml` line 49 — results upload is conditional on `vars.CODEQL_UPLOAD_RESULTS == 'true'`.
> If the variable is not set, CodeQL results are computed but discarded. Vulnerabilities found by CodeQL would not appear in the Security tab and would not block PRs. This undermines the intent of ADR 0003, which lists CodeQL as a blocking gate.

**[Minor] No CSP override in `manifest.json`**

> Evidence: `manifest.json` — no `content_security_policy` key is present. `tests/manifest-security.test.mjs` checks the CSP only if it exists, and does not fail if absent.
> MV3's default extension CSP is restrictive (it already blocks `eval` and remote scripts for extension pages), so the absence of a custom CSP override is not itself a vulnerability. However, explicitly declaring a tight CSP in `manifest.json` would make the security posture self-documenting and verifiable in the manifest security test, rather than relying on implicit browser defaults.

**[Suggestion] `check-security-policies.mjs` uses regex pattern matching; `check-network-sinks.mjs` uses AST analysis — both run together**

> Evidence: `scripts/check-security-policies.mjs` — regex-based patterns for `https?://`, `sendBeacon`, `WebSocket`, `fetch-external-literal`; `scripts/check-network-sinks.mjs` — AST-based detection via `espree`.
> Two complementary tools cover the same security concern with different mechanisms. The regex check can produce false positives on comments and strings; the AST check is accurate for call sites but does not catch string-literal URL injection. This dual-layer approach is sound, but the README and dev-workflow should document why both exist and their respective roles, to prevent future contributors from inadvertently weakening one thinking the other is sufficient.

---

### 8. Developer Experience

**[Minor] No pre-commit hooks configured**

> Evidence: `package.json` — no `prepare` script invoking Husky, lefthook, or similar. No `.husky/`, `.lefthook.yml`, or `.pre-commit-config.yaml` present.
> The project has comprehensive quality checks runnable via `npm run check`, but they must be invoked manually. Contributors can (and the CONTRIBUTING.md workflow assumes they will) run the full check suite before committing, but there is no automated safety net. Adding a pre-commit hook that runs at minimum lint, format-check, and test:docs-policy would catch common mistakes before they reach CI.

**[Suggestion] No devcontainer or Docker Compose for reproducible setup**

> Evidence: Repository root — no `.devcontainer/` or `docker-compose.yml` found.
> For a browser extension that requires Node.js 20 and Playwright/Chromium, the current setup (`.nvmrc`, `npm ci`, manual `npx playwright install chromium`) is straightforward and `docs/dev-workflow.md` covers it well. A devcontainer is a low-priority gap for this project type but would enable one-click GitHub Codespaces onboarding.

**[Suggestion] `AGENTS.md` and `CLAUDE.md` are AI-agent instruction files committed to the repository**

> Evidence: Repository root — `AGENTS.md` (40+ lines) and `CLAUDE.md` (50+ lines) are tracked source files containing AI agent workflow instructions, CI check sequences, internal project rules, and the Figma file URL.
> Committing AI instruction context files alongside product code conflates two concerns and exposes internal workflow tooling details publicly (assuming this is or will become a public repository). These files are also listed in the version sync requirement, tying product versioning to agent tooling state. Consider whether these files should be gitignored or moved to a non-tracked location.

---

## Prioritised Action Backlog

1. **[Major] Pin GitHub Actions to immutable SHA references** — Replace all `@v4`/`@v3` floating tags in `ci.yml`, `codeql.yml`, and `release-assets.yml` with their SHA equivalents to eliminate supply-chain substitution risk, consistent with the project's own strict local-only and network-sink policies.

2. **[Major] Enable CodeQL result upload unconditionally** — Set the `CODEQL_UPLOAD_RESULTS` repository variable to `true` (or remove the conditional upload gate) so that CodeQL findings are surfaced in the Security tab and function as the actual release-blocking gate that ADR 0003 intends.

3. **[Major] Raise runtime coverage thresholds incrementally** — Improve the coverage floor for `service-worker.js` and `offscreen.js` beyond 18% by adding integration harnesses that exercise the core capture orchestration paths, starting with the most common success and failure branches.

4. **[Minor] Add `permissions: contents: read` to `ci.yml`** — Apply least-privilege token scope to the main CI workflow, matching the pattern already established in `codeql.yml` and `release-assets.yml`.

5. **[Minor] Add issue and PR templates to `.github/`** — Create a minimal bug-report issue template and a PR checklist that references the local quality-check sequence from `CONTRIBUTING.md`, to reduce contributor onboarding friction.

6. **[Minor] Add `CODE_OF_CONDUCT.md`** — Adopt a standard code of conduct (e.g., Contributor Covenant) to complete the community health file set expected by GitHub and Chrome Web Store listing reviewers.

7. **[Minor] Configure pre-commit hooks** — Add Husky or lefthook to run at minimum `npm run lint`, `npm run format:check`, and `npm run test:docs-policy` automatically on commit, to prevent common policy violations from reaching CI.

8. **[Minor] Schedule and enforce reduction of wide visual tolerance exceptions** — Assign a target release milestone to the planned tolerance reductions in `docs/visual-exception-register.md` and add a CI assertion that no exception exceeds a configurable maximum (e.g., 10,000 pixels), blocking new regressions from widening the exceptions further.

9. **[Suggestion] Replace the `test:unit` `&&`-chain with Node.js `node:test` runner** — Migrate from the 23-file manual chain to `node:test` (built-in, no new dependencies) to gain parallel execution, TAP-compatible output, and complete failure visibility when multiple test files fail simultaneously.

10. **[Suggestion] Add an explicit `content_security_policy` declaration to `manifest.json`** — Make the extension's CSP self-documenting and verifiable in the manifest security test, rather than relying on MV3 browser defaults.

11. **[Suggestion] Document the `THE_COLLECTOR_DEBUG_NON_FATAL` debug flag** — Add a brief note in `docs/dev-workflow.md` explaining how to set this flag for local debugging of non-fatal capture errors.

12. **[Suggestion] Plan migration away from legacy `proEnabled`/`ultraEnabled` settings fields** — Define an explicit removal target version for the backward-compatibility shim in `capabilities.js`, with a logged migration warning in the interim, so the debt is bounded.

---

## Strengths

**Multi-layer CI pipeline with strong quality gates.** `.github/workflows/ci.yml` runs seven independent parallel job categories (quality, integration, stability, performance, e2e_smoke, visual_parity, package), each with focused concerns. The `package` job is dependency-blocked on all others and validates release artifact cleanliness at packaging time. This is enterprise-grade CI discipline for a browser extension.

**AST-based network sink analysis.** `scripts/check-network-sinks.mjs` parses every source file's AST using `espree` to detect `fetch`, `WebSocket`, `XMLHttpRequest`, and `sendBeacon` call sites, with an explicit file-level allowlist for legitimate uses. This is a sophisticated, hard-to-bypass guardrail that directly enforces the local-only product promise at the code level.

**Manifest permission drift guard.** `scripts/check-manifest-permissions.mjs` encodes the approved permission set as a sorted array and fails the build if `manifest.json` drifts from it. This prevents silent permission escalation — a common Chrome extension security risk — from reaching production.

**12 accepted, well-structured ADRs.** `docs/adr/` contains numbered, dated records with Context / Decision / Consequences structure covering every major architectural and product-model decision. ADR 0009 explicitly records the "always-free" product model decision to prevent future monetization drift; ADR 0002 records the no-external-network constraint. These are governance artifacts that most projects of this scale do not maintain.

**Help-documentation freshness gate enforced by CI.** `scripts/check-doc-policy.mjs` maintains an `UNSHIPPED_PHRASES` list of planned-but-not-shipped features that must not appear in user-facing help content (`docs/help-user-guide.md` and `src/options/options.html`). This automated gate prevents a class of user-misleading documentation that is nearly universal in growing extension projects.

**Release packaging discipline.** `scripts/package-release.sh` validates version alignment between `manifest.json`, the CHANGELOG, and any exact git tag before creating the release zip. `scripts/publish-release-with-asset.sh` requires `MANUAL_SMOKE_ATTEST=pass` as an environment variable, and the `release-assets.yml` workflow enforces the presence of a `manual-smoke: pass` line in GitHub release notes. This three-layer smoke attestation requirement is unusually rigorous.

**Figma-to-code traceability in visual tests.** `tests/visual/ui-parity.spec.mjs` maintains a `FIGMA_NODE_MAP` and `FIGMA_SNAPSHOT_NODE_MAP` that map every visual regression snapshot to a specific Figma file node. This creates an auditable design-to-implementation parity contract rarely seen in extension projects.

**Protocol validation layer.** `src/shared/protocol-validate.js` validates every inter-context message payload (capture start, queue start, preview download) before dispatch. Combined with the strongly-typed shared `messages.js` constant file, this significantly reduces the risk of silent contract drift between the service worker, popup, content script, and offscreen document contexts.

**Roadmap guardrail module with tests.** `src/shared/roadmap-guardrails.js` provides testable `assertLocalOnlyUrl`, `assertNoTrackingPayload`, and `enforceRoadmapActionPolicy` helpers that must be used by roadmap feature code paths. `tests/roadmap-guardrails.test.mjs` verifies these guarantees comprehensively, including confirming that `fetch` is never called when a tier gate or URL policy fails.

---

## Observations (no action required)

**Very high release frequency with mandatory version sync across six files.** Every code change requires a version bump across `manifest.json`, `package.json`, `README.md`, `CHANGELOG.md`, `AGENTS.md`, and `CLAUDE.md`. This is an unusual but consistent policy that creates a complete per-change paper trail at the cost of versioning overhead and CHANGELOG verbosity.

**The tier model (Basic / Pro / Ultra) is a UX complexity preference, not a paywall.** ADR 0001 and ADR 0009 both explicitly state this. Readers encountering `canUseFeature()` checks in the code should not interpret these as entitlement gates — they control UI surface complexity only, with all features free to all users.

**`docs/project-ruleset.md` is an AI-agent instruction export.** The file's opening line reads "Source import: `codex_rules.txt` (local import source)" and is structured as a normative ruleset for an AI coding assistant. It coexists with the ADR system as the operational rules layer. This is a novel pattern for AI-assisted development workflows and is worth noting for any contributor trying to understand governance authority.

**Visual regression is intentionally run on `macos-latest` for font rendering consistency.** The `visual_parity` job in `ci.yml` runs on `macos-latest` while all other jobs run on `ubuntu-latest`. This is a deliberate choice to reduce cross-platform font rasterization variance in snapshot comparisons, as documented in `docs/visual-exception-register.md`. The remaining wide tolerances are therefore a macOS-runner-to-local-macOS drift issue, not a cross-OS issue.

**`unlimitedStorage` permission is retained for capture dataset reliability.** The README explicitly documents this decision under the Phase A permission audit results. It is a legitimate browser extension permission for IndexedDB-heavy workflows and is not a security concern in the local-only architecture.

**`docs/todo-list.md` serves as the operational backlog for non-roadmap chores.** The project uses a deliberate separation: the roadmap document for product planning and `docs/todo-list.md` for housekeeping tasks. This is a clean governance boundary referenced in `docs/project-ruleset.md`.
