# Release Rollback Runbook

Use this runbook when a production extension release must be rolled back quickly and safely.

## Trigger Conditions

- Critical runtime errors in capture/export core flows
- Security policy regression
- Permission regression or Chrome Web Store policy issue
- High-volume UX breakage in popup/history/options/preview

## Rollback Procedure

1. Identify last known good version from `CHANGELOG.md`.
2. Confirm CI green for that commit/tag.
3. Rebuild release package from the known good commit:

```bash
git checkout <known-good-tag-or-commit>
npm ci
./scripts/package-release.sh
```

4. Validate smoke checks before upload:

```bash
npm run test:e2e:smoke
npm run test:e2e:visual
```

5. Submit previous stable zip to Chrome Web Store.
6. Mark rollback event in `CHANGELOG.md` with reason and impacted versions.
7. Open a follow-up issue for root-cause and forward fix.

## Post-Rollback Verification

- Popup capture and URL collection work end-to-end
- History and preview load without runtime errors
- Settings permissions and saves behave correctly
- No new security-policy violations in CI
