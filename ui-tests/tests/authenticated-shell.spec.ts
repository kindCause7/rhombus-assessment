import { expect, test } from '@playwright/test';
import { DashboardPage } from '../pages/dashboard.page.js';

test('an authenticated customer can open the dashboard', async ({ page }) => {
  const dashboard = new DashboardPage(page);
  await dashboard.goto();

  // Customer capabilities establish authenticated dashboard access; no DOM
  // classes, tokens, or implementation state are inspected.
  await expect(page.getByRole('button', { name: 'New Project', exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Executions', exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Schedules', exact: true })).toBeVisible();
});
