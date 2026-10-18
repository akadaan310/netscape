import { defineConfig } from '@playwright/test';

const runId = process.env.VISUAL_RUN_ID ||= new Date().toISOString().replace(/[:.]/g, '-');

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: `./artifacts/browser/${runId}`, 
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 12_000 },
  reporter: [['list'], ['html', { outputFolder: `artifacts/browser-report/${runId}`, open: 'never' }], ['json', { outputFile: `artifacts/reports/visual-playwright-${runId}.json` }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000',
    locale: 'en-US', timezoneId: 'UTC', deviceScaleFactor: 1,
    reducedMotion: 'reduce', colorScheme: 'light',
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--font-render-hinting=none'] },
    screenshot: 'only-on-failure', trace: 'retain-on-failure',
  },
  webServer: process.env.HARNESS_NEGATIVE_ONLY ? undefined : {
    command: 'npm start', url: 'http://127.0.0.1:3000',
    reuseExistingServer: true, timeout: 120_000,
  },
  projects: [
    { name: 'negative-controls', testMatch: /negative-controls\.spec\.ts/ },
    { name: 'chromium', testIgnore: /negative-controls\.spec\.ts/, dependencies: ['negative-controls'] },
  ],
});
