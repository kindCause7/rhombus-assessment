import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

dotenv.config({ path: process.env.ENV_FILE ?? '.env' });

const baseURL = process.env.RHOMBUS_BASE_URL ?? 'https://rhombusai.com';
const statePath = path.resolve(
  process.env.RHOMBUS_STORAGE_STATE ?? 'ui-tests/.auth/user.json',
);
const viewport = {
  width: Number(process.env.RHOMBUS_VIEWPORT_WIDTH ?? 1920),
  height: Number(process.env.RHOMBUS_VIEWPORT_HEIGHT ?? 1080),
};

async function main(): Promise<void> {
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized', `--window-size=${viewport.width},${viewport.height + 120}`],
  });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  console.log('Complete sign-in in the browser window. The state is saved after Dashboard is visible.');
  await page.goto(baseURL);
  await page
    .getByRole('button', { name: 'Dashboard', exact: true })
    .waitFor({ state: 'visible', timeout: 300_000 });
  await fs.mkdir(path.dirname(statePath), { recursive: true });
  await context.storageState({ path: statePath });
  console.log(`Saved authenticated browser state to ${statePath}`);
  await browser.close();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
