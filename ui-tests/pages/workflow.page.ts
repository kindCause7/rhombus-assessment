import { expect, type Page } from '@playwright/test';

export class WorkflowPage {
  constructor(private readonly page: Page) {}

  async goto(url: string): Promise<void> {
    await this.page.goto(url);
    await expect(this.page).toHaveURL(/\/workflow\/\d+(?:$|[?#])/);
    await expect(this.page.getByTestId('right-sidebar')).toBeVisible();
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
    await this.page.getByRole('tab', { name: 'Canvas', exact: true }).click();
    const canvas = this.page.getByTestId('rf__wrapper');
    for (const name of names) {
      const node = canvas.getByTestId(nodeTestId(name));
      await expect(node).toHaveCount(1, { timeout: 60_000 });
      await expect(node).toContainText(name);
      await expect(node).toBeVisible();
    }
  }

  async expectRunBlocked(): Promise<void> {
    await this.page.getByRole('tab', { name: 'Canvas', exact: true }).click();
    await expect(this.page.getByTestId('run-pipeline')).toBeDisabled({ timeout: 15_000 });
  }

  async expectRunAvailable(): Promise<void> {
    await expect(this.page.getByTestId('run-pipeline')).toBeEnabled({ timeout: 15_000 });
  }

  async runPipeline(): Promise<void> {
    await this.page.getByRole('tab', { name: 'Canvas', exact: true }).click();
    await this.page.getByTestId('run-pipeline').click();
  }

  async runPipelineAndExpectSuccess(): Promise<void> {
    await this.runPipeline();
    await this.page.getByRole('button', { name: 'Logs', exact: true }).click();
    await expect(
      this.page.getByText('Pipeline execution completed successfully.', { exact: true }),
    ).toBeVisible({ timeout: 15_000 });
  }
}

function nodeTestId(name: string): RegExp {
  const ids: Record<string, string> = {
    'Data Input': 'input',
    'Remove Duplicates': 'remove_duplicate',
    'Text Cleanup': 'text_cleanup',
    'Data Output': 'output',
  };
  const id = ids[name];
  if (!id) throw new Error(`No node test id is registered for "${name}"`);
  return new RegExp(`^node-${id}-(selected|unselected)$`);
}
