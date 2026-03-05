module.exports = {
  root: true,
  env: {
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  extends: ['eslint:recommended'],
  ignorePatterns: ['dist/', 'assets/icons/'],
  globals: {
    chrome: 'readonly',
    ClipboardItem: 'readonly',
    OffscreenCanvas: 'readonly',
    createImageBitmap: 'readonly',
    indexedDB: 'readonly',
    IDBKeyRange: 'readonly',
  },
  overrides: [
    {
      files: ['src/**/*.js'],
      env: {
        browser: true,
      },
    },
    {
      files: ['tests/**/*.mjs', 'scripts/**/*.sh'],
      env: {
        node: true,
      },
    },
  ],
};
