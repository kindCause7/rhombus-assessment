import type { APIRequestContext } from '@playwright/test';
import { expect, test } from '../fixtures/api.fixture.js';

type JsonRecord = Record<string, unknown>;

// Validate reusable response primitives without assuming mutable business values.
function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function positiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function validDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

// Fetch and validate the execution-history response envelope.
async function executionHistory(api: APIRequestContext): Promise<JsonRecord> {
  const response = await api.get(
    '/api/dataset/analyzer/v2/pipeline/executions/all?page=1&page_size=100',
  );

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');

  const body: unknown = await response.json();
  expect(isRecord(body)).toBe(true);
  return body as JsonRecord;
}

function executionsFrom(history: JsonRecord): unknown[] {
  expect(Array.isArray(history.executions)).toBe(true);
  return history.executions as unknown[];
}

test.describe('execution history', () => {
  test('returns pagination metadata consistent with the requested page', async ({
    authenticatedApi,
  }) => {
    const history = await executionHistory(authenticatedApi);
    const executions = executionsFrom(history);

    expect(history.page).toBe(1);
    expect(history.page_size).toBe(100);
    expect(Number.isInteger(history.total)).toBe(true);
    expect(history.total as number).toBeGreaterThanOrEqual(executions.length);
  });

  test('returns executions with valid identities and project ownership', async ({
    authenticatedApi,
  }) => {
    const executions = executionsFrom(await executionHistory(authenticatedApi));

    for (const [index, value] of executions.entries()) {
      expect(isRecord(value), `execution ${index} must be an object`).toBe(true);
      const execution = value as JsonRecord;

      expect(positiveInteger(execution.id), `execution ${index} must have a positive ID`).toBe(true);
      expect(
        positiveInteger(execution.project_id),
        `execution ${index} must identify its project`,
      ).toBe(true);
    }
  });

  test('does not return duplicate execution identities', async ({ authenticatedApi }) => {
    const executions = executionsFrom(await executionHistory(authenticatedApi));
    const executionIds = new Set<number>();

    for (const [index, value] of executions.entries()) {
      expect(isRecord(value), `execution ${index} must be an object`).toBe(true);
      const id = (value as JsonRecord).id;
      expect(positiveInteger(id), `execution ${index} must have a positive ID`).toBe(true);
      expect(executionIds.has(id as number), `execution ID ${id} must not be duplicated`).toBe(false);
      executionIds.add(id as number);
    }
  });

  test('returns valid triggers and chronologically ordered timestamps', async ({
    authenticatedApi,
  }) => {
    const executions = executionsFrom(await executionHistory(authenticatedApi));

    for (const [index, value] of executions.entries()) {
      expect(isRecord(value), `execution ${index} must be an object`).toBe(true);
      const execution = value as JsonRecord;

      expect(typeof execution.trigger).toBe('string');
      expect((execution.trigger as string).length).toBeGreaterThan(0);
      expect(validDate(execution.started_at), `execution ${index} must have a valid start time`).toBe(
        true,
      );

      if (execution.completed_at !== null) {
        expect(validDate(execution.completed_at)).toBe(true);
        expect(Date.parse(execution.completed_at as string)).toBeGreaterThanOrEqual(
          Date.parse(execution.started_at as string),
        );
      }
    }
  });

  test('returns finite non-negative execution durations', async ({ authenticatedApi }) => {
    const executions = executionsFrom(await executionHistory(authenticatedApi));

    for (const [index, value] of executions.entries()) {
      expect(isRecord(value), `execution ${index} must be an object`).toBe(true);
      const duration = (value as JsonRecord).total_duration_seconds;

      if (duration !== null) {
        expect(typeof duration).toBe('number');
        expect(Number.isFinite(duration)).toBe(true);
        expect(duration as number).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('returns successful executions without contradictory failure state', async ({
    authenticatedApi,
  }) => {
    const executions = executionsFrom(await executionHistory(authenticatedApi));

    for (const [index, value] of executions.entries()) {
      expect(isRecord(value), `execution ${index} must be an object`).toBe(true);
      const execution = value as JsonRecord;

      expect(execution.success === null || typeof execution.success === 'boolean').toBe(true);
      if (execution.success === true) {
        expect(execution.completed_at).not.toBeNull();
        expect(execution.error_message).toBeNull();
        expect(execution.failed_node).toBeNull();
      }
    }
  });
});
