let host = null;
let activeToast = null;
let activeToastTimer = null;
let activeToastMessage = '';
let activeToastType = '';

function ensureHost() {
  if (host && host.isConnected) return host;
  host = document.createElement('div');
  host.className = 'sc-toast-host';
  host.setAttribute('aria-live', 'off');
  host.setAttribute('aria-atomic', 'false');
  document.body.appendChild(host);
  return host;
}

export function showToast(message, type = 'info', timeoutMs = 2200) {
  const root = ensureHost();
  const nextMessage = String(message || '');
  const nextType = String(type || 'info');
  const timeout = Math.max(800, Number(timeoutMs) || 2200);

  if (
    activeToast?.isConnected &&
    activeToastMessage === nextMessage &&
    activeToastType === nextType
  ) {
    if (activeToastTimer) clearTimeout(activeToastTimer);
    activeToastTimer = setTimeout(() => dismissActiveToast(), timeout);
    return () => dismissActiveToast();
  }

  dismissActiveToast({ immediate: true });

  const toast = document.createElement('div');
  toast.className = `sc-toast ${nextType}`;
  if (nextType === 'error') {
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
  } else {
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
  }
  toast.setAttribute('aria-atomic', 'true');
  toast.textContent = nextMessage;
  root.appendChild(toast);
  activeToast = toast;
  activeToastMessage = nextMessage;
  activeToastType = nextType;

  const dismiss = () => {
    dismissActiveToast();
  };

  activeToastTimer = setTimeout(dismiss, timeout);
  return dismiss;
}

function dismissActiveToast(options = {}) {
  if (activeToastTimer) {
    clearTimeout(activeToastTimer);
    activeToastTimer = null;
  }

  const toast = activeToast;
  activeToast = null;
  activeToastMessage = '';
  activeToastType = '';
  if (!toast?.isConnected) return;

  if (options.immediate === true) {
    toast.remove();
    return;
  }
  toast.classList.add('leaving');
  setTimeout(() => toast.remove(), 180);
}
