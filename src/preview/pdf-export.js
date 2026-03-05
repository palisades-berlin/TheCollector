const PDF_PAGE = {
  a4: { w: 595.276, h: 841.89 },
  letter: { w: 612, h: 792 },
};

export async function buildPdfFromCanvas(canvas, pageSize, canvasToBlob) {
  if (pageSize === 'auto') {
    const jpeg = await canvasToBlob(canvas, 'image/jpeg', 0.9);
    const bytes = new Uint8Array(await jpeg.arrayBuffer());
    return buildPdfDocument([singleAutoPage(canvas.width, canvas.height, bytes)]);
  }

  const page = PDF_PAGE[pageSize];
  const margin = 24;
  const availW = page.w - margin * 2;
  const availH = page.h - margin * 2;
  const pxPerPage = Math.max(1, Math.floor((availH / availW) * canvas.width));
  const breaks = computeSmartBreaks(canvas, pxPerPage);

  const pages = [];
  let startY = 0;
  for (const endY of breaks) {
    const sliceH = endY - startY;
    if (sliceH <= 0) continue;
    const slice = document.createElement('canvas');
    slice.width = canvas.width;
    slice.height = sliceH;
    slice
      .getContext('2d')
      .drawImage(canvas, 0, startY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

    const jpeg = await canvasToBlob(slice, 'image/jpeg', 0.9);
    const bytes = new Uint8Array(await jpeg.arrayBuffer());
    const drawW = availW;
    const drawH = (sliceH / canvas.width) * drawW;
    pages.push({
      pageW: page.w,
      pageH: page.h,
      drawW,
      drawH,
      drawX: margin,
      drawY: page.h - margin - drawH,
      imgW: slice.width,
      imgH: slice.height,
      bytes,
    });
    startY = endY;
  }

  return buildPdfDocument(pages);
}

function singleAutoPage(imgW, imgH, bytes) {
  const maxSide = 14400;
  const scale = Math.min(1, maxSide / Math.max(imgW, imgH));
  return {
    pageW: imgW * scale,
    pageH: imgH * scale,
    drawW: imgW * scale,
    drawH: imgH * scale,
    drawX: 0,
    drawY: 0,
    imgW,
    imgH,
    bytes,
  };
}

function computeSmartBreaks(canvas, targetSliceH) {
  const maxY = canvas.height;
  const search = Math.max(24, Math.floor(targetSliceH * 0.16));
  const minSlice = Math.max(40, Math.floor(targetSliceH * 0.55));
  const ink = sampleRowInk(canvas);
  const out = [];
  let y = 0;

  while (y < maxY) {
    const target = y + targetSliceH;
    if (target >= maxY) {
      out.push(maxY);
      break;
    }
    const lo = Math.max(y + minSlice, target - search);
    const hi = Math.min(maxY - 1, target + search);

    let bestY = target;
    let bestScore = Number.POSITIVE_INFINITY;
    for (let i = lo; i <= hi; i++) {
      const dist = Math.abs(i - target) / search;
      const score = ink[i] + dist * 0.12;
      if (score < bestScore) {
        bestScore = score;
        bestY = i;
      }
    }

    out.push(bestY);
    y = bestY;
  }

  return out;
}

function sampleRowInk(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const { width, height } = canvas;
  const stepX = Math.max(1, Math.floor(width / 700));
  const bandH = 24;
  const out = new Array(height);

  for (let y0 = 0; y0 < height; y0 += bandH) {
    const h = Math.min(bandH, height - y0);
    const data = ctx.getImageData(0, y0, width, h).data;

    for (let ly = 0; ly < h; ly++) {
      let dark = 0;
      let total = 0;
      const rowOffset = ly * width * 4;

      for (let x = 0; x < width; x += stepX) {
        const i = rowOffset + x * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        if (lum < 242) dark++;
        total++;
      }

      out[y0 + ly] = dark / Math.max(1, total);
    }
  }
  return out;
}

function buildPdfDocument(pages) {
  const text = new TextEncoder();
  const parts = [];
  const offsets = [0];
  let len = 0;
  const appendText = (s) => {
    const bytes = text.encode(s);
    parts.push(bytes);
    len += bytes.length;
  };
  const appendBytes = (bytes) => {
    parts.push(bytes);
    len += bytes.length;
  };
  const pushObj = (num, body) => {
    offsets[num] = len;
    appendText(`${num} 0 obj\n${body}\nendobj\n`);
  };

  appendText('%PDF-1.4\n');

  const pageCount = pages.length;
  const firstPageObj = 3;
  const firstImgObj = firstPageObj + pageCount;
  const firstContentObj = firstImgObj + pageCount;
  const totalObjs = 2 + pageCount * 3;

  pushObj(1, '<< /Type /Catalog /Pages 2 0 R >>');

  const kids = [];
  for (let i = 0; i < pageCount; i++) kids.push(`${firstPageObj + i} 0 R`);
  pushObj(2, `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${pageCount} >>`);

  for (let i = 0; i < pageCount; i++) {
    const p = pages[i];
    const pageObj = firstPageObj + i;
    const imgObj = firstImgObj + i;
    const contentObj = firstContentObj + i;
    pushObj(
      pageObj,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${fmt(p.pageW)} ${fmt(p.pageH)}] /Resources << /XObject << /Im0 ${imgObj} 0 R >> >> /Contents ${contentObj} 0 R >>`
    );
  }

  for (let i = 0; i < pageCount; i++) {
    const p = pages[i];
    const imgObj = firstImgObj + i;
    offsets[imgObj] = len;
    appendText(
      `${imgObj} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${p.imgW} /Height ${p.imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.bytes.length} >>\nstream\n`
    );
    appendBytes(p.bytes);
    appendText('\nendstream\nendobj\n');
  }

  for (let i = 0; i < pageCount; i++) {
    const p = pages[i];
    const contentObj = firstContentObj + i;
    const content = `q
${fmt(p.drawW)} 0 0 ${fmt(p.drawH)} ${fmt(p.drawX)} ${fmt(p.drawY)} cm
/Im0 Do
Q
`;
    pushObj(
      contentObj,
      `<< /Length ${text.encode(content).length} >>\nstream\n${content}endstream`
    );
  }

  const xrefOffset = len;
  appendText(`xref\n0 ${totalObjs + 1}\n0000000000 65535 f \n`);
  for (let i = 1; i <= totalObjs; i++) {
    appendText(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  }
  appendText(`trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return new Blob(parts, { type: 'application/pdf' });
}

function fmt(n) {
  return Number(n.toFixed(3)).toString();
}
