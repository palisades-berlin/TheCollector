# Privacy Policy

**THE Collector** is a local-only browser extension. It does not collect, transmit, or store any data outside your device — ever.

---

## What we collect

Nothing. THE Collector has no servers, no analytics, no telemetry, and no external connections of any kind.

## Where your data lives

All data created by the extension — screenshots, saved URLs, settings — is stored exclusively in your browser's local extension storage (IndexedDB). It never leaves your device unless you explicitly export or download it yourself.

## Tracking

THE Collector does not track you. It does the opposite: when you copy or save a URL, the extension automatically strips common tracking parameters (UTM tags, `gclid`, `fbclid`, and similar) so the URLs you collect are clean.

## Permissions

The extension requests only the permissions it needs to function (e.g. `activeTab`, `tabs`, `downloads`). No permission is used to read browsing history, access other tabs passively, or send data anywhere. A full explanation of each requested permission is in [`docs/chrome-web-store-permissions.md`](docs/chrome-web-store-permissions.md).

## Uninstalling

Uninstalling the extension removes all extension storage per standard browser behavior. Nothing persists after uninstall except files you explicitly downloaded to your device.

## Third parties

There are no third-party SDKs, analytics libraries, crash reporters, or ad networks included in this extension.

## Changes to this policy

This extension has no backend and no user accounts, so there is no mechanism to notify users of policy changes. Any changes will be recorded in [`CHANGELOG.md`](CHANGELOG.md) and reflected here. The core commitment — no data collection, no external transmission, local-only — is a permanent product principle and is not subject to change (see [ADR 0009](docs/adr/0009-always-free-local-only-product-model.md)).

## Contact

Questions or concerns? Open an issue on [GitHub](https://github.com/palisades-berlin/TheCollector) or email the maintainer listed in the repository.
