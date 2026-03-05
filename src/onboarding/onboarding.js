import { applySavedTheme } from '../shared/theme.js';

await applySavedTheme();

document.getElementById('openOptions')?.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('src/options/options.html') });
});

document.getElementById('openHistory')?.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('src/history/history.html') });
});

document.getElementById('done')?.addEventListener('click', () => {
  window.close();
});
