import crypto from 'node:crypto';
import request from 'supertest';
import app from '../src/index.js';

describe('votes routes', () => {
  it('returns 409 when a user attempts to vote twice on the same post', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    // 1. Register a user
    const regRes = await agent.post('/api/auth/register').send({
      email: `voter-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Voter',
    });
    expect(regRes.status).toBe(201);

    // 2. Create a workspace
    const wsRes = await agent.post('/api/workspaces').send({
      name: 'Voter Workspace',
      slug: `voter-ws-${suffix}`,
    });
    expect(wsRes.status).toBe(201);
    const workspaceId: string = wsRes.body.id;

    // 3. Create a board
    const boardRes = await agent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'Feature Requests', slug: `features-${suffix}` });
    expect(boardRes.status).toBe(201);
    const boardId: string = boardRes.body.id;

    // 4. Create a post
    const postRes = await agent
      .post(`/api/boards/${boardId}/posts`)
      .send({ title: 'Dark mode support', body: 'Please add dark mode to the app.' });
    expect(postRes.status).toBe(201);
    const postId: string = postRes.body.id;

    // 5. First vote — should succeed
    const vote1 = await agent.post(`/api/posts/${postId}/vote`);
    expect(vote1.status).toBe(200);
    expect(vote1.body.voted).toBe(true);
    expect(vote1.body.voteCount).toBeGreaterThanOrEqual(1);

    // 6. Second vote on the same post — should return 409
    const vote2 = await agent.post(`/api/posts/${postId}/vote`);
    expect(vote2.status).toBe(409);
  });
});
