# Security Policy

## Supported Versions

THE Collector is maintained on the latest `main` release line.

| Version line                         | Supported        |
| ------------------------------------ | ---------------- |
| Latest (`main` / newest release tag) | Yes              |
| Older tags/releases                  | Best effort only |

## Reporting a Vulnerability

Please use GitHub Security Advisories for private reporting:

- [Report a vulnerability](https://github.com/palisades-berlin/TheCollector/security/advisories/new)

If the advisory flow is unavailable, open a private maintainer contact via repository owner channels and include `[SECURITY]` in the subject.

Please include:

1. Affected version (or commit SHA)
2. Reproduction steps / proof of concept
3. Expected impact and attack preconditions
4. Suggested mitigation (if available)

## Response Targets

- Initial triage acknowledgement: within 3 business days
- Severity assessment and remediation plan: within 7 business days
- Fix publication target:
  - Critical/High: as fast as possible, target 7 days
  - Medium: target 30 days
  - Low: next planned hardening cycle

## Disclosure Expectations

- Coordinate disclosure with maintainers until a fix is released.
- Do not publicly disclose exploit details before maintainers confirm remediation or mitigation.
- Credit will be provided in release notes unless you request anonymous disclosure.

## Scope Notes

- THE Collector is local-first and does not include a backend upload pipeline.
- Findings affecting extension permissions, data exposure, local storage handling, or release artifacts are in scope.
