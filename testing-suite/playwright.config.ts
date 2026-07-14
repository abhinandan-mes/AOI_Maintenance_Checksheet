import { defineConfig, devices } from '@playwright/test';

/**
 * Enterprise Playwright configuration for SMT AOI Maintenance Checksheet UI.
 * Handles responsive viewport testing, visual regression configurations, and parallel run settings.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],
  use: {
    baseURL: 'http://localhost:3010',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
  },

  /* Configure projects for major browsers and mobile viewports */
  projects: [
    {
      name: 'Chromium Desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 }
      },
    },
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        viewport: { width: 393, height: 851 }
      },
    }
  ],

  /* Setup visual regression configurations */
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100, // Tolerance for dynamic elements like date-time
      threshold: 0.2,    // Sub-pixel color sensitivity
    },
  },
});
