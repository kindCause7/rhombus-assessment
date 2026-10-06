import { expect, type Page } from '@playwright/test';

export class IntegrationsPage {
  constructor(private readonly page: Page) {}

  private async openThirdPartyData(): Promise<void> {
    const composer = this.page.getByRole('textbox');
    const composerPanel = composer.locator('xpath=../..');
    const addButton = composerPanel.getByRole('button').first();
    await expect(addButton).toBeVisible();
    await addButton.click();
    const thirdPartySources = this.page.getByRole('menuitem', { name: 'Third party sources' });
    await expect(thirdPartySources).toBeVisible();
    await thirdPartySources.click();
    await expect(this.page.getByRole('heading', { name: 'Third Party Data' })).toBeVisible();
  }

  async connectS3Source(options: {
    bucket: string;
    region: string;
    prefix?: string;
  }): Promise<void> {
    await this.openThirdPartyData();
    await this.page.getByRole('button', { name: 'Add Data Sources' }).click();
    await this.page.getByRole('heading', { name: 'Amazon S3', exact: true }).click();

    await expect(this.page.getByRole('heading', { name: 'Connection details' })).toBeVisible({
      timeout: 30_000,
    });
    await this.page.getByRole('textbox', { name: 'Bucket*', exact: true }).fill(options.bucket);
    await this.page.getByRole('combobox', { name: 'Region*', exact: true }).click();
    await this.page.getByRole('option', { name: new RegExp(`\\(${escapeRegex(options.region)}\\)$`) }).click();

    if (options.prefix) {
      await this.page
        .getByRole('button', { name: /Optional settings.*Folder, source name, and KMS encryption/i })
        .click();
      await this.page.getByRole('textbox', { name: /Folder|path/i }).fill(options.prefix);
    }

    await this.page.getByRole('button', { name: 'Connect S3 source' }).click();

    await this.page.getByRole('button', { name: 'Connected', exact: true }).click();

    // The configured bucket is a connected Amazon S3 source that the customer can browse.
    // Avoid matching incidental s3:// text.
    const sourceName = new RegExp(`^${escapeRegex(options.bucket)}/?$`);
    await expect(this.page.getByRole('heading', { name: sourceName })).toBeVisible({
      timeout: 120_000,
    });
    await expect(this.page.getByRole('button', { name: 'Browse files', exact: true })).toBeVisible();
  }

  async configureGcsDestination(options: {
    bucket: string;
    serviceAccountJson: string;
  }): Promise<void> {
    await this.page.getByText('Data Output', { exact: true }).click();
    await this.page.getByText('Select Destination', { exact: true }).click();
    await this.page.getByRole('button', { name: 'Add New Destination' }).click();
    await this.page.getByText('Google Cloud Storage', { exact: true }).click();

    await this.page.getByRole('textbox', { name: /Service Account JSON/i }).fill(options.serviceAccountJson);
    await this.page.getByRole('textbox', { name: /Bucket Name/i }).fill(options.bucket);
    await this.page.getByRole('button', { name: 'Create Destination' }).click();

    // Real result of destination creation: the named bucket is offered as a
    // selectable destination. Exact matching prevents URI/helper text collisions.
    const destination = this.page.getByText(options.bucket, { exact: true });
    await expect(destination).toBeVisible({ timeout: 60_000 });
    await destination.click();
    await this.page.getByRole('button', { name: 'Apply', exact: true }).click();
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

