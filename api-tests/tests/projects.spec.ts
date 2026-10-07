import { expect, test } from '../fixtures/api.fixture.js';

function uniqueProjectName(): string {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  return `api-project-${stamp}-${Math.random().toString(36).slice(2, 7)}`;
}

test('creates a project and returns it from the project collection', async ({ authenticatedApi }) => {
  const name = uniqueProjectName();

  const createResponse = await authenticatedApi.post('/api/dataset/projects/add', {
    multipart: {
      name,
      description: 'Created by the Rhombus API test suite',
      visibility: 'restricted',
      access_json: '[]',
      has_samples: 'False',
    },
  });

  expect(createResponse.status()).toBe(201);
  expect(createResponse.headers()['content-type']).toContain('application/json');
  const createdProject = await createResponse.json();
  expect(createdProject).toEqual(expect.any(Object));

  // Confirm the project creation through a separate read
  const listResponse = await authenticatedApi.get('/api/dataset/projects/all?limit=20&offset=0');
  expect(listResponse.status()).toBe(200);
  expect(listResponse.headers()['content-type']).toContain('application/json');

  const projects = await listResponse.json();
  expect(JSON.stringify(projects)).toContain(name);
});
