import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: 1,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    extraHTTPHeaders: {
      Authorization: `Bearer ${process.env.ADMIN_BEARER_TOKEN || ''}`,
      'Content-Type': 'application/json',
    },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
