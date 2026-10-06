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
      await expect(node).toHaveCount(1, { timeout: 120_000 });
      await expect(node).toContainText(name);
      await expect(node).toBeVisible();
    }
  }

  async runPipelineAndExpectSuccess(): Promise<void> {
    await this.page.getByRole('tab', { name: 'Canvas' }).click();
    await this.page.getByTestId('run-pipeline').click();

    // success is asserted from the customer-visible execution receipt
    const successReceipt = this.page
      .getByRole('status')
      .filter({ hasText: /pipeline.*(success|completed)|completed successfully/i });
    await expect(successReceipt).toBeVisible({ timeout: 180_000 });
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
