import crypto from 'node:crypto';
import request from 'supertest';
import app from '../src/index.js';

describe('workspace CRUD', () => {
  it('updates workspace name and slug, deletes workspace, and verifies it is gone', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    // Register user
    const regRes = await agent.post('/api/auth/register').send({
      email: `crud-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'CRUD Tester',
    });
    expect(regRes.status).toBe(201);

    // Create workspace
    const createRes = await agent.post('/api/workspaces').send({
      name: 'Original Name',
    });
    expect(createRes.status).toBe(201);
    const workspaceId: string = createRes.body.id;

    // Test: update workspace name → 200, body.name matches new name
    const nameUpdateRes = await agent
      .patch(`/api/workspaces/${workspaceId}`)
      .send({ name: 'Updated Name' });
    expect(nameUpdateRes.status).toBe(200);
    expect(nameUpdateRes.body.name).toBe('Updated Name');

    // Test: update workspace slug → 200, body.slug matches new slug
    const slugUpdateRes = await agent
      .patch(`/api/workspaces/${workspaceId}`)
      .send({ slug: `updated-${suffix}` });
    expect(slugUpdateRes.status).toBe(200);
    expect(slugUpdateRes.body.slug).toBe(`updated-${suffix}`);

    // Test: delete workspace → 204
    const deleteRes = await agent.delete(`/api/workspaces/${workspaceId}`);
    expect(deleteRes.status).toBe(204);

    // Test: verify workspace is gone → GET /api/workspaces returns empty list
    const listRes = await agent.get('/api/workspaces');
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(0);
  });
});
