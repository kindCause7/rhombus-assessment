import {
  request as playwrightRequest,
  test as base,
  type APIRequestContext,
} from '@playwright/test';

const appUrl = process.env.RHOMBUS_BASE_URL ?? 'https://rhombusai.com';
const apiUrl = process.env.RHOMBUS_API_BASE_URL ?? 'https://api.rhombusai.com';

type ApiFixtures = {
  authenticatedApi: APIRequestContext;
};

export const test = base.extend<ApiFixtures>({
  authenticatedApi: async ({ page }, use) => {
    // Attain auth headers from a authenticated webpage request.

    const observedRequest = page.waitForRequest(
      (candidate) =>
        candidate.url().startsWith(`${apiUrl}/api/`) &&
        Boolean(candidate.headers().authorization) &&
        Boolean(candidate.headers()['x-org-id']),
      { timeout: 15_000 },
    );

    await page.goto(`${appUrl}/dashboard`);
    const headers = await (await observedRequest).allHeaders();
    const authorization = headers.authorization;
    const orgId = headers['x-org-id'];

    if (!authorization || !orgId) {
      throw new Error('Authenticated Rhombus API headers were not observed. Run `yarn ui:auth` first.');
    }

    // Create authenticated API context for authenticated tests
    const api = await playwrightRequest.newContext({
      baseURL: apiUrl,
      extraHTTPHeaders: {
        Authorization: authorization,
        'X-Org-Id': orgId,
        Accept: 'application/json',
      },
    });

    try {
      await use(api);
    } finally {
      await api.dispose();
    }
  },
});

export { expect } from '@playwright/test';
