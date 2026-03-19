const SHIM_STORAGE_PREFIX = 'the-collector-browser-shim';

function safeJsonParse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function readStore(areaName) {
  const key = `${SHIM_STORAGE_PREFIX}:${areaName}`;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? safeJsonParse(raw, {}) : {};
  } catch {
    return globalThis.__theCollectorShimStore?.[areaName] || {};
  }
}

function writeStore(areaName, value) {
  const key = `${SHIM_STORAGE_PREFIX}:${areaName}`;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    globalThis.__theCollectorShimStore ||= {};
    globalThis.__theCollectorShimStore[areaName] = value;
  }
}

function normalizeKeys(keys) {
  if (keys == null) return null;
  if (typeof keys === 'string') return [keys];
  if (Array.isArray(keys)) return keys.filter((key) => typeof key === 'string');
  if (typeof keys === 'object') return Object.keys(keys);
  return [];
}

function mergeDefaults(target, defaults) {
  if (!defaults || typeof defaults !== 'object' || Array.isArray(defaults)) return target;
  return { ...defaults, ...target };
}

function createStorageArea(areaName) {
  return {
    async get(keys = null, callback) {
      const store = readStore(areaName);
      let out = {};
      if (keys == null) {
        out = { ...store };
      } else if (typeof keys === 'string' || Array.isArray(keys)) {
        const normalized = normalizeKeys(keys);
        for (const key of normalized) {
          if (key in store) out[key] = store[key];
        }
      } else if (typeof keys === 'object') {
        out = mergeDefaults({}, keys);
        for (const key of Object.keys(keys)) {
          if (key in store) out[key] = store[key];
        }
      }
      if (typeof callback === 'function') callback(out);
      return out;
    },
    async set(items = {}, callback) {
      const store = readStore(areaName);
      const next = { ...store, ...(items && typeof items === 'object' ? items : {}) };
      writeStore(areaName, next);
      if (typeof callback === 'function') callback();
    },
    async remove(keys = [], callback) {
      const store = readStore(areaName);
      for (const key of normalizeKeys(keys) || []) {
        delete store[key];
      }
      writeStore(areaName, store);
      if (typeof callback === 'function') callback();
    },
    async clear(callback) {
      writeStore(areaName, {});
      if (typeof callback === 'function') callback();
    },
  };
}

function createTabsFallback() {
  return {
    async query() {
      return [];
    },
    /**
     * @param {{url?: string}} [options]
     */
    async create(options = {}) {
      const url = options?.url;
      if (typeof url === 'string' && url) {
        try {
          window.location.assign(url);
        } catch {
          // Ignore navigation failures in browser preview mode.
        }
      }
      return { id: 0, url: typeof url === 'string' ? url : '' };
    },
  };
}

function createRuntimeFallback() {
  return {
    lastError: null,
    getURL(path = '') {
      const cleaned = String(path || '').replace(/^\//, '');
      return new URL(cleaned, `${window.location.origin}/`).toString();
    },
    async sendMessage() {
      return { ok: true };
    },
    openOptionsPage() {
      window.location.href = new URL(
        'src/options/options.html',
        `${window.location.origin}/`
      ).toString();
    },
    onMessage: {
      addListener() {},
      removeListener() {},
    },
  };
}

function createActionFallback() {
  return {
    async openPopup() {},
    async setBadgeText() {},
  };
}

function createPermissionsFallback() {
  return {
    async contains() {
      return false;
    },
    async request() {
      return false;
    },
    async remove() {
      return false;
    },
    onAdded: {
      addListener() {},
      removeListener() {},
    },
    onRemoved: {
      addListener() {},
      removeListener() {},
    },
  };
}

function installChromeShim() {
  /** @type {any} */
  const existing = globalThis.chrome || {};
  if (!existing.storage) existing.storage = {};
  if (!existing.storage.local) existing.storage.local = createStorageArea('local');
  if (!existing.storage.sync) existing.storage.sync = createStorageArea('sync');
  if (!existing.storage.session) existing.storage.session = createStorageArea('session');
  if (!existing.permissions) existing.permissions = createPermissionsFallback();
  else {
    if (!existing.permissions.contains)
      existing.permissions.contains = createPermissionsFallback().contains;
    if (!existing.permissions.request)
      existing.permissions.request = createPermissionsFallback().request;
    if (!existing.permissions.remove)
      existing.permissions.remove = createPermissionsFallback().remove;
    if (!existing.permissions.onAdded) {
      existing.permissions.onAdded = createPermissionsFallback().onAdded;
    }
    if (!existing.permissions.onRemoved) {
      existing.permissions.onRemoved = createPermissionsFallback().onRemoved;
    }
  }
  if (!existing.tabs) existing.tabs = createTabsFallback();
  if (!existing.runtime) existing.runtime = createRuntimeFallback();
  else {
    if (!existing.runtime.getURL) existing.runtime.getURL = createRuntimeFallback().getURL;
    if (!existing.runtime.sendMessage)
      existing.runtime.sendMessage = createRuntimeFallback().sendMessage;
    if (!existing.runtime.openOptionsPage) {
      existing.runtime.openOptionsPage = createRuntimeFallback().openOptionsPage;
    }
    if (!existing.runtime.onMessage) {
      existing.runtime.onMessage = { addListener() {}, removeListener() {} };
    }
    if (typeof existing.runtime.lastError === 'undefined') existing.runtime.lastError = null;
  }
  if (!existing.action) existing.action = createActionFallback();
  else {
    if (!existing.action.openPopup) existing.action.openPopup = createActionFallback().openPopup;
    if (!existing.action.setBadgeText)
      existing.action.setBadgeText = createActionFallback().setBadgeText;
  }
  globalThis.chrome = existing;
}

installChromeShim();
