import js from '@eslint/js';
import globals from 'globals';

const extensionGlobals = {
  chrome: 'readonly',
  ClipboardItem: 'readonly',
  OffscreenCanvas: 'readonly',
  createImageBitmap: 'readonly',
  indexedDB: 'readonly',
  IDBKeyRange: 'readonly',
};

export default [
  {
    ignores: ['dist/**', 'assets/icons/**'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        ...extensionGlobals,
      },
    },
  },
  {
    files: ['tests/**/*.mjs', 'scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
        ...extensionGlobals,
      },
    },
  },
];
