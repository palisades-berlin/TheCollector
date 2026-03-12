/**
 * Shared JSDoc typedef contracts for cross-surface extension modules.
 * Runtime behavior is unchanged; this module exists for documentation and tooling hints.
 */

/**
 * @typedef {'basic' | 'pro' | 'ultra'} CapabilityTier
 */

/**
 * @typedef {'system' | 'light' | 'dark'} ThemeSetting
 */

/**
 * @typedef {'off' | 'after_preview' | 'skip_preview'} AutoDownloadMode
 */

/**
 * @typedef {'png' | 'jpg' | 'pdf'} ExportFormat
 */

/**
 * @typedef {'auto' | 'a4' | 'letter'} PdfPageSize
 */

/**
 * @typedef {'default' | 'research' | 'interest' | 'private'} CaptureProfileId
 */

/**
 * @typedef {'low' | 'balanced' | 'high'} NotificationCadence
 */

/**
 * @typedef {object} UserSettings
 * @property {ExportFormat} defaultExportFormat
 * @property {PdfPageSize} defaultPdfPageSize
 * @property {AutoDownloadMode} autoDownloadMode
 * @property {string} downloadDirectory
 * @property {boolean} saveAs
 * @property {boolean} fitClipboardToDocsLimit
 * @property {ThemeSetting} theme
 * @property {boolean} nudgesEnabled
 * @property {NotificationCadence} notificationCadence
 * @property {CapabilityTier} capabilityTier
 * @property {CaptureProfileId} defaultCaptureProfileId
 * @property {boolean} proEnabled
 * @property {boolean} ultraEnabled
 */

/**
 * @typedef {'add_current' | 'add_all_tabs' | 'clear_before' | 'restore_last_clear' | 'restore_history' | 'remove_one' | 'unknown'} UrlHistoryActionType
 */

/**
 * @typedef {object} UrlMetaRecord
 * @property {string} normalizedUrl
 * @property {string} url
 * @property {number} createdAt
 * @property {number} updatedAt
 * @property {boolean} starred
 * @property {string[]} tags
 * @property {string} note
 */

/**
 * @typedef {object} UrlHistoryEntryPayload
 * @property {UrlHistoryActionType} [actionType]
 * @property {string[]} urls
 * @property {Record<string, unknown>} [meta]
 */

/**
 * @typedef {object} UrlMutationContext
 * @property {(entries: Array<Record<string, unknown>>) => void} onHistoryChange
 * @property {() => boolean} isHistoryViewOpen
 */

export {};
