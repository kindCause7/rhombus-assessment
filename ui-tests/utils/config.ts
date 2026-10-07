export type JourneyConfig = {
  s3Bucket: string;
  s3Region: string;
  s3ObjectKey: string;
  s3Prefix?: string;
  gcsBucket: string;
  gcsServiceAccountJson: string;
  scheduleCron: string;
  scheduleTimeoutMs: number;
  projectPrefix: string;
};

const requiredKeys = [
  'RHOMBUS_S3_BUCKET',
  'RHOMBUS_S3_REGION',
  'RHOMBUS_S3_OBJECT_KEY',
  'RHOMBUS_GCS_BUCKET',
  'RHOMBUS_GCS_SERVICE_ACCOUNT_JSON',
] as const;

export function missingJourneyEnvironment(): string[] {
  return requiredKeys.filter((key) => !process.env[key]?.trim());
}

export function journeyConfig(): JourneyConfig {
  const missing = missingJourneyEnvironment();
  if (missing.length) {
    throw new Error(`Missing end-to-end environment variables: ${missing.join(', ')}`);
  }

  const serviceAccount = process.env.RHOMBUS_GCS_SERVICE_ACCOUNT_JSON!.trim();
  try {
    JSON.parse(serviceAccount);
  } catch {
    throw new Error('RHOMBUS_GCS_SERVICE_ACCOUNT_JSON must contain the complete JSON object.');
  }

  return {
    s3Bucket: process.env.RHOMBUS_S3_BUCKET!,
    s3Region: process.env.RHOMBUS_S3_REGION!,
    s3ObjectKey: process.env.RHOMBUS_S3_OBJECT_KEY!,
    s3Prefix: process.env.RHOMBUS_S3_PREFIX || undefined,
    gcsBucket: process.env.RHOMBUS_GCS_BUCKET!,
    gcsServiceAccountJson: serviceAccount,
    scheduleCron: process.env.RHOMBUS_SCHEDULE_CRON || '* * * * *',
    scheduleTimeoutMs: Number(process.env.RHOMBUS_SCHEDULE_TIMEOUT_MS || 60_000),
    projectPrefix: process.env.RHOMBUS_PROJECT_PREFIX || 'ui-etl',
  };
}

export function uniqueProjectName(prefix: string): string {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  return `${prefix}-${stamp}-${Math.random().toString(36).slice(2, 7)}`;
}
