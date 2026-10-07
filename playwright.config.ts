import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

dotenv.config({ path: process.env.ENV_FILE ?? '.env' });

const storageState = path.resolve(
  process.env.RHOMBUS_STORAGE_STATE ?? 'ui-tests/.auth/user.json',
);
const viewport = {
  width: Number(process.env.RHOMBUS_VIEWPORT_WIDTH ?? 1920),
  height: Number(process.env.RHOMBUS_VIEWPORT_HEIGHT ?? 1080),
};

export default defineConfig({
  testDir: './ui-tests/tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.RHOMBUS_BASE_URL ?? 'https://rhombusai.com',
    storageState: fs.existsSync(storageState) ? storageState : undefined,
    viewport,
    launchOptions: {
      args: [
        '--start-maximized',
        `--window-size=${viewport.width},${viewport.height + 120}`,
      ],
    },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  outputDir: 'test-results',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport },
    },
  ],
});
