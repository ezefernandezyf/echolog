import crypto from 'node:crypto';
import request from 'supertest';
import app from '../src/index.js';

describe('boards membership hardening', () => {
  it('returns 401 when listing boards without auth', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    // Register user and create workspace
    await agent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await agent.post('/api/workspaces').send({ name: 'Board Auth Workspace' });
    const workspaceId: string = wsRes.body.id;

    // Anonymous request → 401
    const anonRes = await request(app).get(`/api/workspaces/${workspaceId}/boards`);
    expect(anonRes.status).toBe(401);
  });

  it('returns 403 when listing boards as non-member', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner: creates workspace
    const ownerAgent = request.agent(app);
    await ownerAgent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'Private WS' });
    const workspaceId: string = wsRes.body.id;

    // Create a board so the workspace has content
    await ownerAgent.post(`/api/workspaces/${workspaceId}/boards`).send({ name: 'General' });

    // Intruder: registers but is NOT a member of the workspace
    const intruderAgent = request.agent(app);
    await intruderAgent.post('/api/auth/register').send({
      email: `intruder-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Intruder',
    });

    // Intruder tries to list boards → 403
    const listRes = await intruderAgent.get(`/api/workspaces/${workspaceId}/boards`);
    expect(listRes.status).toBe(403);
  });

  it('returns 200 when listing boards as a workspace member', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    // Register and create workspace (becomes OWNER = member)
    await agent.post('/api/auth/register').send({
      email: `member-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Member User',
    });
    const wsRes = await agent.post('/api/workspaces').send({ name: 'Member List WS' });
    const workspaceId: string = wsRes.body.id;

    // Create a board so the workspace has content
    await agent.post(`/api/workspaces/${workspaceId}/boards`).send({ name: 'General' });

    // List boards as member → 200
    const listRes = await agent.get(`/api/workspaces/${workspaceId}/boards`);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBeGreaterThanOrEqual(1);
  });

  it('returns 403 when creating board as non-member', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner creates workspace
    const ownerAgent = request.agent(app);
    await ownerAgent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'Secret WS' });
    const workspaceId: string = wsRes.body.id;

    // Intruder registers
    const intruderAgent = request.agent(app);
    await intruderAgent.post('/api/auth/register').send({
      email: `intruder-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Intruder',
    });

    // Intruder tries to create a board → 403
    const createRes = await intruderAgent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'Hacked Board' });
    expect(createRes.status).toBe(403);
  });
});
