import { expect, type Page } from '@playwright/test';

export class WorkflowPage {
  constructor(private readonly page: Page) {}

  async goto(url: string): Promise<void> {
    await this.page.goto(url);
    await expect(this.page).toHaveURL(/\/workflow\/\d+(?:$|[?#])/);
    await expect(this.page.getByRole('tab', { name: 'AI Builder' })).toBeVisible();
  }

  async askPipelineBuilder(prompt: string): Promise<void> {
    await this.page.getByRole('tab', { name: 'AI Builder' }).click();
    const composer = this.page.getByRole('textbox');
    await composer.fill('/');
    await this.page.getByRole('button', { name: /Pipeline \/pipeline/ }).click();
    await composer.fill(prompt);
    await composer.press('Enter');
  }

  async expectCanvasNodes(names: string[]): Promise<void> {
    await this.page.getByRole('tab', { name: 'Canvas' }).click();
    for (const name of names) {
      const nodeLabel = this.page.getByText(name, { exact: true });
      await expect(nodeLabel).toHaveCount(1, { timeout: 120_000 });
      await expect(nodeLabel).toBeVisible();
    }
  }

  async runPipelineAndExpectSuccess(): Promise<void> {
    await this.page.getByRole('tab', { name: 'Canvas' }).click();
    const runButton = this.page
      .getByRole('button', { name: 'Run Pipeline' })
      .or(this.page.getByTitle('Run Pipeline'));
    if ((await runButton.count()) === 1) {
      await runButton.click();
    } else {
      await this.clickButtonExposedByTooltip('Run Pipeline');
    }

    // User-visible execution receipt, rather than network or component state.
    const successReceipt = this.page
      .getByRole('status')
      .filter({ hasText: /pipeline.*(success|completed)|completed successfully/i });
    await expect(successReceipt).toBeVisible({ timeout: 180_000 });
  }

  private async clickButtonExposedByTooltip(label: string): Promise<void> {
    const buttons = this.page.getByRole('button');
    for (let index = 0; index < (await buttons.count()); index += 1) {
      const button = buttons.nth(index);
      if (!(await button.isVisible())) continue;
      await button.hover();
      const tooltip = this.page.getByText(label, { exact: true });
      const appeared = await tooltip
        .waitFor({ state: 'visible', timeout: 750 })
        .then(() => true)
        .catch(() => false);
      if (appeared) {
        await button.click();
        return;
      }
    }
    throw new Error(`No visible button exposed the tooltip "${label}"`);
  }
}
