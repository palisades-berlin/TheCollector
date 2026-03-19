#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContract, normalizeNewlines, parseMarkerBlocks } from './marker-sync-lib.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');

function replaceMarkerContent(text, markerId, newContent, relPath) {
  const normalized = text.replace(/\r\n/g, '\n');
  const openRe = new RegExp(`^\\s*<!--\\s*${markerId}:START\\s*-->\\s*$`, 'm');
  const closeRe = new RegExp(`^\\s*<!--\\s*${markerId}:END\\s*-->\\s*$`, 'm');

  const openMatch = openRe.exec(normalized);
  const closeMatch = closeRe.exec(normalized);
  if (!openMatch || !closeMatch || closeMatch.index <= openMatch.index) {
    throw new Error(`${relPath}: could not locate valid marker boundaries for ${markerId}`);
  }

  const openLineEnd = normalized.indexOf('\n', openMatch.index);
  if (openLineEnd === -1) {
    throw new Error(`${relPath}: malformed marker block for ${markerId}`);
  }
  const before = normalized.slice(0, openLineEnd + 1);
  const after = normalized.slice(closeMatch.index);
  const normalizedContent = newContent.length > 0 ? `${newContent}\n` : '';
  return `${before}${normalizedContent}${after}`;
}

const contract = loadContract(rootDir);
const parsedByFile = new Map();
const fileTextByPath = new Map();
const updates = [];

for (const relPath of Object.keys(contract.requiredMarkersByFile)) {
  const absPath = path.join(rootDir, relPath);
  if (!fs.existsSync(absPath)) continue;
  const text = fs.readFileSync(absPath, 'utf8');
  fileTextByPath.set(relPath, text);
  parsedByFile.set(relPath, parseMarkerBlocks(text, relPath));
}

for (const { id, canonical, mirrors } of contract.canonicalMirrors) {
  const canonicalBlocks = parsedByFile.get(canonical);
  if (!canonicalBlocks || !canonicalBlocks.has(id)) {
    throw new Error(`${canonical}: canonical marker ${id} not found`);
  }
  const canonicalContent = canonicalBlocks.get(id).content;
  const canonicalComparable = normalizeNewlines(canonicalContent).trim();

  for (const mirror of mirrors) {
    const mirrorBlocks = parsedByFile.get(mirror);
    if (!mirrorBlocks || !mirrorBlocks.has(id)) {
      throw new Error(`${mirror}: mirror marker ${id} not found`);
    }
    const currentContent = mirrorBlocks.get(id).content;
    const currentComparable = normalizeNewlines(currentContent).trim();
    if (currentComparable === canonicalComparable) continue;

    const currentText = fileTextByPath.get(mirror);
    const nextText = replaceMarkerContent(currentText, id, canonicalContent, mirror);
    fileTextByPath.set(mirror, nextText);
    updates.push({ mirror, id });
  }
}

if (updates.length === 0) {
  console.log('No marker updates needed.');
  process.exit(0);
}

if (checkOnly) {
  console.log(`Marker updates required (${updates.length}):`);
  for (const item of updates) {
    console.log(`- ${item.mirror}: ${item.id}`);
  }
  process.exit(1);
}

for (const [relPath, text] of fileTextByPath.entries()) {
  const absPath = path.join(rootDir, relPath);
  fs.writeFileSync(absPath, text, 'utf8');
}

console.log(`Updated marker blocks (${updates.length} changes).`);
for (const item of updates) {
  console.log(`- ${item.mirror}: ${item.id}`);
}
