export async function buildDiffBlob({
  baseBlob,
  compareBlob,
  decodeImageToCanvas,
  canvasToBlob,
  legendFontFamily,
}) {
  const baseCanvas = await decodeImageToCanvas(baseBlob);
  const compareCanvas = await decodeImageToCanvas(compareBlob);
  const width = Math.min(baseCanvas.width, compareCanvas.width);
  const height = Math.min(baseCanvas.height, compareCanvas.height);
  const baseCtx = baseCanvas.getContext('2d', { willReadFrequently: true });
  const compareCtx = compareCanvas.getContext('2d', { willReadFrequently: true });
  const outCanvas = document.createElement('canvas');
  outCanvas.width = width;
  outCanvas.height = height;
  const outCtx = outCanvas.getContext('2d');

  const a = baseCtx.getImageData(0, 0, width, height);
  const b = compareCtx.getImageData(0, 0, width, height);
  const ad = a.data;
  const bd = b.data;
  const boxes = detectDiffBoxes(ad, bd, width, height);

  outCtx.drawImage(compareCanvas, 0, 0, width, height);
  outCtx.save();
  outCtx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  outCtx.fillRect(0, 0, width, height);
  outCtx.restore();
  drawDiffBoxes(outCtx, boxes);
  drawDiffLegend(outCtx, width, height, boxes, legendFontFamily);
  const blob = await canvasToBlob(outCanvas, 'image/png');
  return { blob, width, height };
}

function detectDiffBoxes(ad, bd, width, height) {
  const pixelThreshold = 30;
  const blockSize = 8;
  const cols = Math.ceil(width / blockSize);
  const rows = Math.ceil(height / blockSize);
  const total = new Uint16Array(cols * rows);
  const changed = new Uint16Array(cols * rows);
  const added = new Uint16Array(cols * rows);
  const removed = new Uint16Array(cols * rows);

  for (let y = 0; y < height; y++) {
    const gy = Math.floor(y / blockSize);
    for (let x = 0; x < width; x++) {
      const gx = Math.floor(x / blockSize);
      const gIdx = gy * cols + gx;
      total[gIdx]++;

      const i = (y * width + x) * 4;
      const aAlpha = ad[i + 3];
      const bAlpha = bd[i + 3];
      if (aAlpha === 0 && bAlpha === 0) continue;

      const dr = Math.abs(bd[i] - ad[i]);
      const dg = Math.abs(bd[i + 1] - ad[i + 1]);
      const db = Math.abs(bd[i + 2] - ad[i + 2]);
      const da = Math.abs(bAlpha - aAlpha);
      const delta = Math.max(dr, dg, db, da);
      if (delta < pixelThreshold) continue;

      changed[gIdx]++;
      const lumA = ad[i] * 0.2126 + ad[i + 1] * 0.7152 + ad[i + 2] * 0.0722;
      const lumB = bd[i] * 0.2126 + bd[i + 1] * 0.7152 + bd[i + 2] * 0.0722;
      if (lumB >= lumA) added[gIdx]++;
      else removed[gIdx]++;
    }
  }

  const active = new Uint8Array(cols * rows);
  for (let i = 0; i < active.length; i++) {
    const density = total[i] > 0 ? changed[i] / total[i] : 0;
    if (changed[i] >= 6 && density >= 0.08) active[i] = 1;
  }

  const visited = new Uint8Array(cols * rows);
  const boxes = [];
  const qx = [];
  const qy = [];
  const neighborDx = [-1, 1, 0, 0];
  const neighborDy = [0, 0, -1, 1];

  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const startIdx = gy * cols + gx;
      if (!active[startIdx] || visited[startIdx]) continue;
      qx.length = 0;
      qy.length = 0;
      qx.push(gx);
      qy.push(gy);
      visited[startIdx] = 1;

      let minX = gx;
      let maxX = gx;
      let minY = gy;
      let maxY = gy;
      let changedSum = 0;
      let addedSum = 0;
      let removedSum = 0;

      while (qx.length) {
        const cx = qx.pop();
        const cy = qy.pop();
        const idx = cy * cols + cx;
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);
        changedSum += changed[idx];
        addedSum += added[idx];
        removedSum += removed[idx];

        for (let n = 0; n < 4; n++) {
          const nx = cx + neighborDx[n];
          const ny = cy + neighborDy[n];
          if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
          const nIdx = ny * cols + nx;
          if (!active[nIdx] || visited[nIdx]) continue;
          visited[nIdx] = 1;
          qx.push(nx);
          qy.push(ny);
        }
      }

      if (changedSum < 20) continue;
      const px = minX * blockSize;
      const py = minY * blockSize;
      const pw = Math.min(width - px, (maxX - minX + 1) * blockSize);
      const ph = Math.min(height - py, (maxY - minY + 1) * blockSize);
      const margin = 4;
      boxes.push({
        x: Math.max(0, px - margin),
        y: Math.max(0, py - margin),
        w: Math.min(width - Math.max(0, px - margin), pw + margin * 2),
        h: Math.min(height - Math.max(0, py - margin), ph + margin * 2),
        kind: addedSum >= removedSum ? 'added' : 'removed',
      });
    }
  }

  return mergeNearbyDiffBoxes(boxes);
}

function mergeNearbyDiffBoxes(input) {
  const boxes = [...input];
  if (boxes.length <= 1) return boxes;
  const gap = 10;
  let mergedAny = true;
  while (mergedAny) {
    mergedAny = false;
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        const overlapX = a.x <= b.x + b.w + gap && b.x <= a.x + a.w + gap;
        const overlapY = a.y <= b.y + b.h + gap && b.y <= a.y + a.h + gap;
        if (!overlapX || !overlapY || a.kind !== b.kind) continue;
        const x = Math.min(a.x, b.x);
        const y = Math.min(a.y, b.y);
        const w = Math.max(a.x + a.w, b.x + b.w) - x;
        const h = Math.max(a.y + a.h, b.y + b.h) - y;
        boxes[i] = { x, y, w, h, kind: a.kind };
        boxes.splice(j, 1);
        mergedAny = true;
        break;
      }
      if (mergedAny) break;
    }
  }
  return boxes;
}

function drawDiffBoxes(ctx, boxes) {
  for (const box of boxes) {
    const isAdded = box.kind === 'added';
    ctx.save();
    ctx.fillStyle = isAdded ? 'rgba(46, 204, 113, 0.22)' : 'rgba(231, 76, 60, 0.22)';
    ctx.strokeStyle = isAdded ? 'rgba(46, 204, 113, 0.95)' : 'rgba(231, 76, 60, 0.95)';
    ctx.lineWidth = 2;
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    ctx.restore();
  }
}

function drawDiffLegend(ctx, width, height, boxes, fontFamily) {
  const pad = Math.max(10, Math.round(width / 180));
  const boxW = Math.max(240, Math.round(width * 0.28));
  const boxH = 68;
  const x = Math.max(0, width - boxW - pad);
  const y = Math.max(0, height - boxH - pad);
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.58)';
  ctx.fillRect(x, y, boxW, boxH);
  ctx.font = `600 12px ${fontFamily}`;
  ctx.fillStyle = '#b0bec5';
  ctx.fillText('Visual Diff', x + 10, y + 16);
  ctx.fillStyle = '#2ecc71';
  ctx.fillText('Added / brighter', x + 10, y + 35);
  ctx.fillStyle = '#e74c3c';
  ctx.fillText('Removed / darker', x + 130, y + 35);
  ctx.fillStyle = '#cfd8dc';
  ctx.fillText(`Detected regions: ${boxes.length}`, x + 10, y + 54);
  ctx.restore();
}
