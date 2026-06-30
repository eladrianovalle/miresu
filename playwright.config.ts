import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests/playwright',
  fullyParallel: true,
  // CI retries absorb the occasional focus-stealing flake in the keyboard-nav
  // a11y tests when projects run in parallel; locally a failure is a failure.
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  // Auto-start the dev server (site + dev-only /admin) for the suite. Locally we
  // reuse a server you already have running; in CI we always start a fresh one.
  // The token-contract (Tier 2) gate runs against a pre-served static export, so
  // its CI step sets PLAYWRIGHT_NO_WEBSERVER=1 to skip the dev server entirely.
  webServer: process.env.PLAYWRIGHT_NO_WEBSERVER
    ? undefined
    : {
        command: 'npm run dev',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    // Functional e2e: the dev-only /admin content editor, a desktop tool — so
    // it runs at a desktop viewport only. The site's mobile behaviour is covered
    // by the accessibility project (which drives its own mobile viewports), and
    // visual has its own project below. Each spec maps to exactly one project so
    // nothing runs twice.
    {
      name: 'desktop',
      testMatch: /admin-editor|theme-toggle|theme-system-pref/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'accessibility',
      testMatch: /accessibility/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'visual',
      testMatch: /visual-baselines/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        screenshot: 'off',
        video: 'off',
      },
    },
    // Theme M0 Tier 2 gate. Runs against the served static export (dist-staging)
    // in CI's build job, not the dev server — see PLAYWRIGHT_NO_WEBSERVER above.
    {
      name: 'token-contract',
      testMatch: /token-contract|theme-no-fouc/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
