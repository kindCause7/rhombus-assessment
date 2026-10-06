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
    const composer = this.page.getByRole('textbox').last();
    await composer.fill('/');
    await this.page.getByRole('button', { name: /Pipeline \/pipeline/ }).click();
    await composer.fill(prompt);
    await composer.press('Enter');

    await expect(this.page.getByText(prompt, { exact: true })).toBeVisible();
    await expect(composer).toBeEnabled({ timeout: 120_000 });
    await expect(this.page.getByText('Thinking', { exact: true })).toBeHidden();
    await expect(this.page.getByText('Writing response', { exact: true })).toBeHidden();
  }

  async expectCanvasNodes(names: string[]): Promise<void> {
    await this.page.getByRole('tab', { name: 'Canvas' }).click();
    for (const name of names) {
      await expect(this.page.getByText(name, { exact: true }).first()).toBeVisible({ timeout: 60_000 });
    }
  }

  async runPipelineAndExpectSuccess(): Promise<void> {
    await this.page.getByRole('tab', { name: 'Canvas' }).click();
    const runButton = this.page
      .getByRole('button', { name: 'Run Pipeline' })
      .or(this.page.getByTitle('Run Pipeline'));
    if (await runButton.count()) {
      await runButton.first().click();
    } else {
      await this.clickButtonExposedByTooltip('Run Pipeline');
    }

    // Completion is based on the user-visible execution result. No fixed delay.
    const success = this.page
      .getByRole('status')
      .filter({ hasText: /pipeline.*(success|completed)|successfully/i })
      .or(this.page.getByText(/pipeline.*(success|completed)|successfully/i));
    await expect(success.first()).toBeVisible({ timeout: 180_000 });
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
