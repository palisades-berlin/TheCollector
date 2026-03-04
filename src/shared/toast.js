let host = null;

function ensureHost() {
  if (host && host.isConnected) return host;
  host = document.createElement('div');
  host.className = 'sc-toast-host';
  host.setAttribute('aria-live', 'polite');
  host.setAttribute('aria-atomic', 'true');
  document.body.appendChild(host);
  return host;
}

export function showToast(message, type = 'info', timeoutMs = 2200) {
  const root = ensureHost();
  const toast = document.createElement('div');
  toast.className = `sc-toast ${type}`;
  toast.textContent = String(message || '');
  root.appendChild(toast);

  const dismiss = () => {
    if (!toast.isConnected) return;
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 180);
  };

  setTimeout(dismiss, Math.max(800, Number(timeoutMs) || 2200));
  return dismiss;
}
