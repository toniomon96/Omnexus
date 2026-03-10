import { defineConfig, devices } from '@playwright/test';

const LOCAL_URL = 'http://localhost:4173';

/** Return the env URL only when it looks like a valid http(s) origin. */
function resolvedBaseURL(): string {
  const raw = process.env.E2E_BASE_URL?.trim();
  if (raw) {
    try {
      const u = new URL(raw);
      if ((u.protocol === 'http:' || u.protocol === 'https:') && u.hostname && u.hostname !== 'https') {
        return u.origin;
      }
    } catch { /* invalid URL — fall through */ }
  }
  return LOCAL_URL;
}

const baseURL = resolvedBaseURL();
const isRemote = baseURL.startsWith('https://') || (baseURL.startsWith('http://') && !baseURL.includes('localhost'));

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [
        // In CI: machine-readable JUnit (for GitHub Actions test summary) + HTML archive
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
        ['list'],  // prints each test result to the Actions log in real time
      ]
    : [
        // Locally: interactive HTML report that auto-opens on failure
        ['html', { open: 'on-failure', outputFolder: 'playwright-report' }],
        ['list'],
      ],

  use: {
    baseURL,
    // Capture a full trace on first retry — lets you replay every action
    trace: 'on-first-retry',
    // Always capture a screenshot on failure
    screenshot: 'only-on-failure',
    // Record a video on first retry so you can watch what happened
    video: 'on-first-retry',
    // Add the test name to each action in the trace viewer
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // Serve the production build locally for E2E tests using `vite preview`.
  // This avoids issues with vercel dev's rewrite rules intercepting Vite's
  // internal module routes (/@vite/client, /@react-refresh, etc.).
  // `npm run test:e2e` builds the app first, then this server serves dist/.
  // If E2E_BASE_URL points to a remote deployment (CI Vercel preview), no
  // local server is started.
  webServer: isRemote ? undefined : {
    command: 'npx vite preview',
    url: LOCAL_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
