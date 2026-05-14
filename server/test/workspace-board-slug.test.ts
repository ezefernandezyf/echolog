import crypto from 'node:crypto';
import request from 'supertest';
import app from '../src/index.js';

describe('workspace & board create — server-side slug', () => {
  it('derives slug from name on workspace create', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    // Register user
    const regRes = await agent.post('/api/auth/register').send({
      email: `slug-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Slug Tester',
    });
    expect(regRes.status).toBe(201);

    // Create workspace without slug — server should derive it
    const createRes = await agent.post('/api/workspaces').send({
      name: 'My Test Workspace',
    });
    expect(createRes.status).toBe(201);
    expect(createRes.body.name).toBe('My Test Workspace');
    expect(createRes.body.slug).toBe('my-test-workspace');
    expect(createRes.body.role).toBe('OWNER');

    const workspaceId: string = createRes.body.id;

    // Create board without slug
    const boardRes = await agent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'Feature Board' });
    expect(boardRes.status).toBe(201);
    expect(boardRes.body.name).toBe('Feature Board');
    expect(boardRes.body.slug).toBe('feature-board');
  });

  it('returns 409 on duplicate workspace name', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    // Register user
    const regRes = await agent.post('/api/auth/register').send({
      email: `dup-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Dup Tester',
    });
    expect(regRes.status).toBe(201);

    // Create first workspace
    const first = await agent.post('/api/workspaces').send({
      name: 'Duplicate Name',
    });
    expect(first.status).toBe(201);

    // Create second workspace with same name (will derive same slug)
    const second = await agent.post('/api/workspaces').send({
      name: 'Duplicate Name',
    });
    expect(second.status).toBe(409);
    expect(second.body.message).toBe('Workspace slug already exists');
  });
});
