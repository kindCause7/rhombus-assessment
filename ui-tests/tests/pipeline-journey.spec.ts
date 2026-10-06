import { expect, test } from '@playwright/test';
import { DashboardPage } from '../pages/dashboard.page.js';
import { IntegrationsPage } from '../pages/integrations.page.js';
import { SchedulePage } from '../pages/schedule.page.js';
import { WorkflowPage } from '../pages/workflow.page.js';
import {
  journeyConfig,
  missingJourneyEnvironment,
  uniqueProjectName,
} from '../utils/config.js';

const missing = missingJourneyEnvironment();

test.describe.serial('scheduled S3 to GCS customer journey', () => {
  test.describe.configure({ timeout: 300_000 });
  test.skip(missing.length > 0, `Cloud journey is not configured: ${missing.join(', ')}`);

  const config = missing.length === 0 ? journeyConfig() : undefined;
  const projectName = config ? uniqueProjectName(config.projectPrefix) : 'unconfigured';
  let projectUrl = '';

  test('creates an isolated customer project', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    projectUrl = await dashboard.createProject(projectName);

    await expect(page.getByRole('link', { name: projectName, exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/workflow\/\d+/);
  });

  test('connects the real Amazon S3 source', async ({ page }) => {
    const workflow = new WorkflowPage(page);
    await workflow.goto(projectUrl);

    await new IntegrationsPage(page).connectS3Source({
      bucket: config!.s3Bucket,
      region: config!.s3Region,
      prefix: config!.s3Prefix,
    });
  });

  test('uses only the AI builder to create and run the cleaning pipeline', async ({ page }) => {
    const workflow = new WorkflowPage(page);
    await workflow.goto(projectUrl);

    const sourceKey = [config!.s3Prefix, config!.s3ObjectKey].filter(Boolean).join('/');
    const prompt = [
      `Use ${sourceKey} from the connected Amazon S3 bucket ${config!.s3Bucket} as the Data Input.`,
      'Build the cleaning pipeline on the canvas using standard nodes only.',
      'Remove exact duplicate rows with Remove Duplicates.',
      'Use Text Cleanup to trim whitespace and consistently format customer_name, currency, status, and country.',
      'Do not add an output node yet. Run no manual transformations.',
    ].join(' ');

    await workflow.askPipelineBuilder(prompt);
    await workflow.expectCanvasNodes(['Data Input', 'Remove Duplicates', 'Text Cleanup']);
    await workflow.runPipelineAndExpectSuccess();
  });

  test('configures GCS output and proves a baseline run succeeds', async ({ page }) => {
    const workflow = new WorkflowPage(page);
    await workflow.goto(projectUrl);

    await workflow.askPipelineBuilder(
      'Add one Data Output node after the final cleaning node and connect it. Do not change the existing cleaning rules.',
    );
    await workflow.expectCanvasNodes(['Data Output']);

    await new IntegrationsPage(page).configureGcsDestination({
      bucket: config!.gcsBucket,
      serviceAccountJson: config!.gcsServiceAccountJson,
    });
    await workflow.runPipelineAndExpectSuccess();
  });

  test('activates a recurring schedule and observes a successful scheduled run', async ({ page }) => {
    const workflow = new WorkflowPage(page);
    await workflow.goto(projectUrl);
    await new SchedulePage(page).createCustom(config!.scheduleCron);

    await new DashboardPage(page).waitForSuccessfulExecution(
      projectName,
      config!.scheduleTimeoutMs,
    );
  });
});
