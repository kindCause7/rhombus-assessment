import { request as playwrightRequest } from '@playwright/test';
import { expect, test } from '../fixtures/api.fixture.js';

const apiUrl = process.env.RHOMBUS_API_BASE_URL ?? 'https://api.rhombusai.com';

test('authenticated profile request returns customer profile data', async ({ authenticatedApi }) => {
  const response = await authenticatedApi.get('/api/accounts/users/profile');

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');

  const profile = await response.json();
  expect(profile).toEqual(expect.any(Object));
  expect(profile).toHaveProperty('first_name');
  expect(profile).toHaveProperty('last_name');
  expect(profile.first_name === null || typeof profile.first_name === 'string').toBe(true);
  expect(profile.last_name === null || typeof profile.last_name === 'string').toBe(true);
});

test('profile request without authentication is rejected without profile data', async () => {
  const unauthenticatedApi = await playwrightRequest.newContext({ baseURL: apiUrl });

  try {
    const response = await unauthenticatedApi.get('/api/accounts/users/profile');
    const body = await response.text();

    expect([401, 403]).toContain(response.status());
    expect(body).toMatch(/auth|credential|unauthorized|forbidden|permission/i);
    expect(body).not.toMatch(/"email"\s*:/i);
  } finally {
    await unauthenticatedApi.dispose();
  }
});
