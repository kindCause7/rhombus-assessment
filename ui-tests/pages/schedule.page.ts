import { expect, type Page } from '@playwright/test';

export class SchedulePage {
  constructor(private readonly page: Page) {}

  async createCustom(cron: string): Promise<void> {
    await this.page.getByRole('tab', { name: 'Schedule' }).click();
    const add = this.page.getByRole('button', { name: 'Add Schedule' });
    const first = this.page.getByRole('button', { name: 'Create your first schedule' });
    if (await add.isVisible()) {
      await add.click();
    } else {
      await first.click();
    }

    await expect(this.page.getByRole('heading', { name: 'Create Schedule' })).toBeVisible();
    await this.page.getByRole('combobox').click();
    await this.page.getByRole('option', { name: 'Custom', exact: true }).click();
    await this.page.getByRole('textbox', { name: 'Custom Cron Expression' }).fill(cron);
    await this.page.getByRole('button', { name: 'Create', exact: true }).click();

    // The persisted card is the outcome: active recurrence plus a computed next run.
    await expect(this.page.getByText(cron, { exact: true })).toBeVisible();
    await expect(this.page.getByText('Active', { exact: true })).toBeVisible();
    await expect(this.page.getByText(/Next run/i)).toBeVisible();
  }
}
