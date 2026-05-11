import crypto from 'node:crypto';
import request from 'supertest';
import app from '../src/index.js';

describe('workspace isolation', () => {
  it('prevents User B from listing workspaces owned by User A', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    const userA = request.agent(app);
    const userB = request.agent(app);

    // Register User A
    const userAReg = await userA.post('/api/auth/register').send({
      email: `alice-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Alice',
    });
    expect(userAReg.status).toBe(201);

    // Create workspace as User A
    const createRes = await userA.post('/api/workspaces').send({
      name: 'Alice Workspace',
      slug: `alice-ws-${suffix}`,
    });
    expect(createRes.status).toBe(201);
    const aliceSlug = createRes.body.slug;

    // Register User B
    const userBReg = await userB.post('/api/auth/register').send({
      email: `bob-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Bob',
    });
    expect(userBReg.status).toBe(201);

    // User B lists workspaces — should NOT include Alice's workspace
    const userBList = await userB.get('/api/workspaces');
    expect(userBList.status).toBe(200);
    const userBWorkspaces: Array<{ slug: string }> = userBList.body;
    const found = userBWorkspaces.find((w) => w.slug === aliceSlug);
    expect(found).toBeUndefined();
  });
});
