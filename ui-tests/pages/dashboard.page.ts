import { expect, type Page } from '@playwright/test';

export class DashboardPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/dashboard');
    await expect(this.page).toHaveURL(/\/dashboard(?:$|[?#])/);
    await expect(this.page.getByRole('tab', { name: 'Overview' })).toBeVisible();
  }

  async createProject(name: string): Promise<string> {
    await this.page.getByRole('button', { name: 'New Project' }).click();
    const dialog = this.page.getByRole('dialog').or(this.page.getByRole('heading', { name: 'Create New Project' }).locator('..'));
    await this.page.getByRole('textbox', { name: 'Project Name' }).fill(name);
    await this.page.getByRole('button', { name: 'Create', exact: true }).click();

    await expect(this.page.getByRole('status')).toContainText('Project created successfully');
    const projectLink = this.page.getByRole('link', { name, exact: true });
    await expect(projectLink).toBeVisible();
    await projectLink.click();
    await expect(this.page).toHaveURL(/\/workflow\/\d+(?:$|[?#])/);
    await expect(dialog).toBeHidden();
    return this.page.url();
  }

  async waitForSuccessfulExecution(projectName: string, timeout: number): Promise<void> {
    await expect
      .poll(
        async () => {
          await this.page.goto('/dashboard');
          await this.page.getByRole('tab', { name: 'Executions' }).click();
          const panel = this.page.getByRole('tabpanel', { name: 'Executions' });
          const text = await panel.innerText().catch(() => this.page.locator('body').innerText());
          return (
            text.includes(projectName) &&
            /\b(success|succeeded)\b/i.test(text) &&
            /\bscheduled\b/i.test(text)
          );
        },
        {
          timeout,
          intervals: [2_000, 5_000, 10_000],
          message: `a successful execution for ${projectName} to appear on the dashboard`,
        },
      )
      .toBe(true);
  }
}
