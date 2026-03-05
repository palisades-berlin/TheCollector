export async function withObjectUrl(blob, worker) {
  const url = URL.createObjectURL(blob);
  try {
    return await worker(url);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
}

export async function chromeDownloadBlob({ blob, filename, saveAs }) {
  return withObjectUrl(blob, (url) =>
    chrome.downloads.download({ url, filename, saveAs })
  );
}

export async function anchorDownloadBlob({ blob, filename }) {
  return withObjectUrl(blob, (url) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
}
