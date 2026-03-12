import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  timeout: 60_000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 2,
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
  },
  use: {
    viewport: { width: 1280, height: 900 },
    colorScheme: 'light',
    locale: 'en-US',
    timezoneId: 'UTC',
    launchOptions: {
      args: [
        '--force-color-profile=srgb',
        '--disable-font-subpixel-positioning',
        '--disable-lcd-text',
        '--font-render-hinting=none',
      ],
    },
  },
  reporter: [['list']],
});
