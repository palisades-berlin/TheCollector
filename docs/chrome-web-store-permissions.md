# Chrome Web Store Permissions Justification

Use this text as the canonical listing/policy justification for requested permissions.

## Required permissions

### `activeTab`

- Used only after explicit user action (toolbar capture button or keyboard command).
- Grants temporary access to the active page so capture logic can run on that tab.

### `tabs`

- Required to query the active tab in the current window for capture and URL collection actions.
- Required to open extension pages (history/preview/options) in new tabs and manage capture-tab interactions.

### `offscreen`

- Required to create and use the offscreen document for stitching multiple viewport captures into one final image.
- Offscreen processing is local-only and does not transmit user data externally.

### `unlimitedStorage`

- Required to keep large screenshot histories and oversized captures reliable in extension-local storage.
- Used only for local persistence; there is no remote upload pipeline.

## Optional permission

### `downloads` (optional)

- Requested only when the user enables download features in Settings or explicitly exports/downloads assets.
- Can be revoked by the user in Settings; core functionality remains available without it.

## Privacy statement (listing-safe)

- Captured images and URL lists stay in extension-local browser storage unless the user explicitly exports/downloads.
- No background network upload service is implemented in this project.
