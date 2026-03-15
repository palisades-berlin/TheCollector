import fs from 'node:fs';
import path from 'node:path';

export function normalizeNewlines(text) {
  return text.replace(/\r\n/g, '\n');
}

export function loadContract(rootDir) {
  const contractPath = path.join(rootDir, 'docs', 'marker-sync-contract.json');
  return JSON.parse(fs.readFileSync(contractPath, 'utf8'));
}

export function parseMarkerBlocks(text, relPath) {
  const normalized = normalizeNewlines(text);
  const lines = normalized.split('\n');
  const openMap = new Map();
  const blocks = new Map();

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const openMatch = line.match(/^\s*<!--\s*([A-Z0-9_]+):START\s*-->\s*$/);
    const closeMatch = line.match(/^\s*<!--\s*([A-Z0-9_]+):END\s*-->\s*$/);

    if (openMatch) {
      const id = openMatch[1];
      if (openMap.has(id)) {
        throw new Error(`${relPath}: duplicate START marker for ${id} on line ${i + 1}`);
      }
      if (blocks.has(id)) {
        throw new Error(`${relPath}: duplicate marker id ${id} on line ${i + 1}`);
      }
      openMap.set(id, i);
      continue;
    }

    if (closeMatch) {
      const id = closeMatch[1];
      const openLine = openMap.get(id);
      if (openLine === undefined) {
        throw new Error(`${relPath}: END marker without START for ${id} on line ${i + 1}`);
      }
      const content = lines.slice(openLine + 1, i).join('\n');
      blocks.set(id, {
        id,
        startLine: openLine + 1,
        endLine: i + 1,
        content,
      });
      openMap.delete(id);
    }
  }

  if (openMap.size > 0) {
    const [id, openLine] = openMap.entries().next().value;
    throw new Error(`${relPath}: START marker without END for ${id} on line ${openLine + 1}`);
  }

  return blocks;
}

export function firstDiffLine(aText, bText) {
  const a = normalizeNewlines(aText).trim().split('\n');
  const b = normalizeNewlines(bText).trim().split('\n');
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    if ((a[i] ?? '') !== (b[i] ?? '')) return i + 1;
  }
  return null;
}

export function validateMarkerSync(rootDir) {
  const contract = loadContract(rootDir);
  const allowed = new Set(contract.allowedMarkerIds);
  const parsedByFile = new Map();
  const errors = [];

  for (const [relPath, requiredIds] of Object.entries(contract.requiredMarkersByFile)) {
    const absPath = path.join(rootDir, relPath);
    if (!fs.existsSync(absPath)) {
      errors.push(`Missing required file: ${relPath}`);
      continue;
    }

    let blocks;
    try {
      blocks = parseMarkerBlocks(fs.readFileSync(absPath, 'utf8'), relPath);
    } catch (err) {
      errors.push(err.message);
      continue;
    }
    parsedByFile.set(relPath, blocks);

    for (const id of blocks.keys()) {
      if (!allowed.has(id)) {
        errors.push(`${relPath}: unknown marker id ${id}`);
      }
    }

    for (const id of requiredIds) {
      if (!blocks.has(id)) {
        errors.push(`${relPath}: required marker ${id} not found`);
      }
    }
  }

  for (const mapItem of contract.canonicalMirrors) {
    const { id, canonical, mirrors } = mapItem;
    const canonicalBlocks = parsedByFile.get(canonical);
    if (!canonicalBlocks || !canonicalBlocks.has(id)) {
      errors.push(`${canonical}: canonical marker ${id} not found for mirror check`);
      continue;
    }
    const canonicalContent = normalizeNewlines(canonicalBlocks.get(id).content).trim();

    for (const mirror of mirrors) {
      const mirrorBlocks = parsedByFile.get(mirror);
      if (!mirrorBlocks || !mirrorBlocks.has(id)) {
        errors.push(`${mirror}: mirror marker ${id} not found`);
        continue;
      }
      const mirrorContent = normalizeNewlines(mirrorBlocks.get(id).content).trim();
      if (canonicalContent !== mirrorContent) {
        const line = firstDiffLine(canonicalContent, mirrorContent);
        errors.push(
          `Marker mismatch for ${id}: canonical=${canonical} mirror=${mirror} first_diff_line=${line}`
        );
      }
    }
  }

  return { errors };
}
