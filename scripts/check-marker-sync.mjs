#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateMarkerSync } from './marker-sync-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { errors } = validateMarkerSync(root);

if (errors.length > 0) {
  console.error('FAIL marker sync policy');
  for (const err of errors) {
    console.error(`- ${err}`);
  }
  process.exit(1);
}

console.log('PASS marker sync policy');
