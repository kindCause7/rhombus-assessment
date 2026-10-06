import { expect, test } from '@playwright/test';
import { DashboardPage } from '../pages/dashboard.page.js';

test('an authenticated customer can open the dashboard', async ({ page }) => {
  const dashboard = new DashboardPage(page);
  await dashboard.goto();

  await expect(page.getByRole('button', { name: 'New Project' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Executions' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Schedules' })).toBeVisible();
});
