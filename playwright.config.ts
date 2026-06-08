import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/a11y',
  timeout: 30_000,
  retries: 0,
  reporter: 'list',
  use: {
    headless: true,
    baseURL: 'http://localhost:4321',
  },
  // Serve the built marketing site for the a11y specs. Requires a prior
  // `pnpm --filter @oraclous/marketing build` (CI Gate 3 builds before scanning).
  webServer: {
    command: 'pnpm --filter @oraclous/marketing preview --port 4321',
    url: 'http://localhost:4321/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
