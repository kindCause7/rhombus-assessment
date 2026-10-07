import { expect, type Page } from '@playwright/test';

export class DashboardPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/dashboard');
    await expect(this.page).toHaveURL(/\/dashboard(?:$|[?#])/);
    await expect(this.page.getByRole('tab', { name: 'Overview', exact: true })).toBeVisible();
  }

  async createProject(name: string): Promise<string> {
    await this.page.getByRole('button', { name: 'New Project', exact: true }).click();
    await this.page.getByRole('textbox', { name: 'Project Name', exact: true }).fill(name);
    await this.page.getByRole('button', { name: 'Create', exact: true }).click();

    // The uniquely named project is present in project navigation and opens
    // its own persisted workflow URL.
    const projectLink = this.page.getByTestId('project-card').filter({ hasText: name });
    await expect(projectLink).toHaveText(name);
    await projectLink.click();
    await expect(this.page).toHaveURL(/\/workflow\/\d+(?:$|[?#])/);
    return this.page.url();
  }

  async waitForSuccessfulExecutionCount(
    projectName: string,
    minimumCount: number,
    timeout = 15_000,
  ): Promise<void> {
    await expect
      .poll(
        async () => {
          await this.page.goto('/dashboard');
          await this.page.getByRole('tab', { name: 'Executions', exact: true }).click();
          return this.page
            .getByRole('tabpanel', { name: 'Executions', exact: true })
            .getByRole('row')
            .filter({ hasText: projectName })
            .filter({ hasText: /\b(success|succeeded)\b/i })
            .count();
        },
        {
          timeout,
          intervals: [1_000, 2_000, 5_000],
          message: `at least ${minimumCount} successful executions for ${projectName}`,
        },
      )
      .toBeGreaterThanOrEqual(minimumCount);
  }

  async waitForSuccessfulExecution(projectName: string, timeout: number): Promise<void> {
    await expect
      .poll(
        async () => {
          await this.page.goto('/dashboard');
          await this.page.getByRole('tab', { name: 'Executions' }).click();
          const panel = this.page.getByRole('tabpanel', { name: 'Executions', exact: true });
          const matchingExecution = panel
            .getByRole('row')
            .filter({ hasText: projectName })
            .filter({ hasText: /\bscheduled\b/i })
            .filter({ hasText: /\b(success|succeeded)\b/i });
          return (await matchingExecution.count()) === 1;
        },
        {
          timeout,
          intervals: [1_000, 2_000, 5_000],
          message: `a successful execution for ${projectName} to appear on the dashboard`,
        },
      )
      .toBe(true);
  }
}
