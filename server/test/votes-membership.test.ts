import crypto from 'node:crypto';
import request from 'supertest';
import app from '../src/index.js';

describe('votes membership hardening', () => {
  it('returns 401 when voting without auth', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner creates workspace + board + post
    const ownerAgent = request.agent(app);
    await ownerAgent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'Vote Auth WS' });
    const workspaceId: string = wsRes.body.id;
    const boardRes = await ownerAgent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'General' });
    const boardId: string = boardRes.body.id;
    const postRes = await ownerAgent
      .post(`/api/boards/${boardId}/posts`)
      .send({ title: 'Vote Test', body: 'Testing votes' });
    const postId: string = postRes.body.id;

    // Anonymous vote request → 401
    const anonRes = await request(app).post(`/api/posts/${postId}/vote`);
    expect(anonRes.status).toBe(401);
  });

  it('returns 403 when voting as non-member', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner creates workspace + board + post
    const ownerAgent = request.agent(app);
    await ownerAgent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'Vote WS' });
    const workspaceId: string = wsRes.body.id;
    const boardRes = await ownerAgent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'General' });
    const boardId: string = boardRes.body.id;
    const postRes = await ownerAgent
      .post(`/api/boards/${boardId}/posts`)
      .send({ title: 'Secret Post', body: 'Top secret' });
    const postId: string = postRes.body.id;

    // Intruder registers (not a member)
    const intruderAgent = request.agent(app);
    await intruderAgent.post('/api/auth/register').send({
      email: `intruder-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Intruder',
    });

    // Intruder tries to vote → 403
    const voteRes = await intruderAgent.post(`/api/posts/${postId}/vote`);
    expect(voteRes.status).toBe(403);
  });

  it('returns 403 when removing vote as non-member', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner creates workspace + board + post
    const ownerAgent = request.agent(app);
    await ownerAgent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'Vote WS 2' });
    const workspaceId: string = wsRes.body.id;
    const boardRes = await ownerAgent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'General' });
    const boardId: string = boardRes.body.id;
    const postRes = await ownerAgent
      .post(`/api/boards/${boardId}/posts`)
      .send({ title: 'Another Post', body: 'Test' });
    const postId: string = postRes.body.id;

    // Intruder registers (not a member)
    const intruderAgent = request.agent(app);
    await intruderAgent.post('/api/auth/register').send({
      email: `intruder-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Intruder',
    });

    // Intruder tries to remove vote → 403
    const removeRes = await intruderAgent.delete(`/api/posts/${postId}/vote`);
    expect(removeRes.status).toBe(403);
  });
});
