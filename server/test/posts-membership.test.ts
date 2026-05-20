import crypto from 'node:crypto';
import request from 'supertest';
import app from '../src/index.js';

describe('posts membership hardening', () => {
  it('returns 401 when listing posts without auth', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    // Owner creates workspace + board
    await agent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await agent.post('/api/workspaces').send({ name: 'Post Auth WS' });
    const workspaceId: string = wsRes.body.id;
    const boardRes = await agent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'General' });
    const boardId: string = boardRes.body.id;

    // Anonymous request → 401
    const anonRes = await request(app).get(`/api/boards/${boardId}/posts`);
    expect(anonRes.status).toBe(401);
  });

  it('returns 403 when listing posts as non-member', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner creates workspace + board + post
    const ownerAgent = request.agent(app);
    await ownerAgent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'Post WS' });
    const workspaceId: string = wsRes.body.id;
    const boardRes = await ownerAgent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'General' });
    const boardId: string = boardRes.body.id;
    await ownerAgent
      .post(`/api/boards/${boardId}/posts`)
      .send({ title: 'Test Post', body: 'Hello world' });

    // Intruder registers (not a member)
    const intruderAgent = request.agent(app);
    await intruderAgent.post('/api/auth/register').send({
      email: `intruder-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Intruder',
    });

    // Intruder tries to list posts → 403
    const listRes = await intruderAgent.get(`/api/boards/${boardId}/posts`);
    expect(listRes.status).toBe(403);
  });

  it('returns 200 when listing posts as a workspace member', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    // Register and create workspace (becomes OWNER = member)
    await agent.post('/api/auth/register').send({
      email: `member-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Member User',
    });
    const wsRes = await agent.post('/api/workspaces').send({ name: 'Post Member List WS' });
    const workspaceId: string = wsRes.body.id;
    const boardRes = await agent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'General' });
    const boardId: string = boardRes.body.id;

    // Create a post so the board has content
    await agent
      .post(`/api/boards/${boardId}/posts`)
      .send({ title: 'Member Post', body: 'Visible to members' });

    // List posts as member → 200
    const listRes = await agent.get(`/api/boards/${boardId}/posts`);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.posts)).toBe(true);
    expect(listRes.body.posts.length).toBeGreaterThanOrEqual(1);
  });

  it('returns 200 when member gets post by id', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner (member) creates workspace + board + post
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({
      email: `member-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Member',
    });
    const wsRes = await agent.post('/api/workspaces').send({ name: 'Post Member WS' });
    const workspaceId: string = wsRes.body.id;
    const boardRes = await agent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'General' });
    const boardId: string = boardRes.body.id;
    const postRes = await agent
      .post(`/api/boards/${boardId}/posts`)
      .send({ title: 'Member Post', body: 'Visible to members' });
    const postId: string = postRes.body.id;

    // Member gets post by id → 200
    const getRes = await agent.get(`/api/posts/${postId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.id).toBe(postId);
    expect(getRes.body.title).toBe('Member Post');
  });

  it('returns 403 when getting post by id as non-member', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner creates workspace + board + post
    const ownerAgent = request.agent(app);
    await ownerAgent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'Post WS 2' });
    const workspaceId: string = wsRes.body.id;
    const boardRes = await ownerAgent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'General' });
    const boardId: string = boardRes.body.id;
    const postRes = await ownerAgent
      .post(`/api/boards/${boardId}/posts`)
      .send({ title: 'Secret Post', body: 'Top secret content' });
    const postId: string = postRes.body.id;

    // Intruder registers (not a member)
    const intruderAgent = request.agent(app);
    await intruderAgent.post('/api/auth/register').send({
      email: `intruder-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Intruder',
    });

    // Intruder tries to get post by id → 403
    const getRes = await intruderAgent.get(`/api/posts/${postId}`);
    expect(getRes.status).toBe(403);
  });
});
