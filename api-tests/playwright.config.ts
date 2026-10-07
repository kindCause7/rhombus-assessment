import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

dotenv.config({ path: process.env.ENV_FILE ?? '.env' });

const storageState = path.resolve(
  process.env.RHOMBUS_STORAGE_STATE ?? 'ui-tests/.auth/user.json',
);

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  timeout: 30_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/api', open: 'never' }]],
  outputDir: 'test-results/api',
  use: {
    storageState: fs.existsSync(storageState) ? storageState : undefined,
    // API traces include request headers, so do not persist bearer tokens in artifacts.
    trace: 'off',
  },
});
