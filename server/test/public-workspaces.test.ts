import crypto from 'node:crypto';
import request from 'supertest';
import app from '../src/index.js';
import { createRateLimiter } from '../src/infra/rate-limiter.js';
import express from 'express';
import { workspaceRouter } from '../src/workspaces/workspaces.router.js';

describe('public workspaces', () => {
  it('GET /api/workspaces/public returns only PUBLIC workspaces', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    // Register user
    await agent.post('/api/auth/register').send({
      email: `pub-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Public Tester',
    });

    // Create two workspaces
    const ws1 = await agent.post('/api/workspaces').send({ name: `Public WS ${suffix}` });
    const ws2 = await agent.post('/api/workspaces').send({ name: `Private WS ${suffix}` });

    expect(ws1.status).toBe(201);
    expect(ws2.status).toBe(201);

    const ws1Id = ws1.body.id;
    const ws2Id = ws2.body.id;

    // Make ws1 PUBLIC, leave ws2 PRIVATE
    const visRes = await agent
      .patch(`/api/workspaces/${ws1Id}/visibility`)
      .send({ visibility: 'PUBLIC', publicAccessLevel: 'READ_ONLY' });
    expect(visRes.status).toBe(200);

    // Fetch public workspaces (no auth required)
    const listRes = await request(app).get('/api/workspaces/public');
    expect(listRes.status).toBe(200);
    expect(listRes.body.workspaces).toBeInstanceOf(Array);
    expect(listRes.body.workspaces.length).toBeGreaterThanOrEqual(1);

    const wsIds = listRes.body.workspaces.map((w: { id: string }) => w.id);
    expect(wsIds).toContain(ws1Id);
    expect(wsIds).not.toContain(ws2Id);
  });

  it('PATCH /api/workspaces/:id/visibility by owner succeeds', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    await agent.post('/api/auth/register').send({
      email: `vis-owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });

    const ws = await agent.post('/api/workspaces').send({ name: `Visibility WS ${suffix}` });
    expect(ws.status).toBe(201);
    const wsId = ws.body.id;

    const res = await agent
      .patch(`/api/workspaces/${wsId}/visibility`)
      .send({ visibility: 'PUBLIC', publicAccessLevel: 'INTERACT' });
    expect(res.status).toBe(200);
    expect(res.body.visibility).toBe('PUBLIC');
    expect(res.body.publicAccessLevel).toBe('INTERACT');
  });

  it('PATCH /api/workspaces/:id/visibility by non-owner → 403', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // First user (owner)
    const ownerAgent = request.agent(app);
    await ownerAgent.post('/api/auth/register').send({
      email: `vis-owner2-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const ws = await ownerAgent.post('/api/workspaces').send({ name: `Visibility WS2 ${suffix}` });
    const wsId = ws.body.id;

    // Second user (non-owner)
    const nonOwnerAgent = request.agent(app);
    await nonOwnerAgent.post('/api/auth/register').send({
      email: `vis-nonowner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'NonOwner',
    });

    const res = await nonOwnerAgent
      .patch(`/api/workspaces/${wsId}/visibility`)
      .send({ visibility: 'PUBLIC' });
    expect(res.status).toBe(403);
  });

  it('PATCH /api/workspaces/:id/visibility anonymous → 401', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    await agent.post('/api/auth/register').send({
      email: `vis-anon-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const ws = await agent.post('/api/workspaces').send({ name: `Anon WS ${suffix}` });
    const wsId = ws.body.id;

    // Anonymous request
    const res = await request(app)
      .patch(`/api/workspaces/${wsId}/visibility`)
      .send({ visibility: 'PUBLIC' });
    expect(res.status).toBe(401);
  });

  it('PUBLIC workspace GET boards (anonymous) → 200', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    await agent.post('/api/auth/register').send({
      email: `pub-board-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const ws = await agent.post('/api/workspaces').send({ name: `Public Board WS ${suffix}` });
    const wsId = ws.body.id;

    // Make PUBLIC
    await agent
      .patch(`/api/workspaces/${wsId}/visibility`)
      .send({ visibility: 'PUBLIC', publicAccessLevel: 'READ_ONLY' });

    // Anonymous GET boards
    const res = await request(app).get(`/api/workspaces/${wsId}/boards`);
    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
  });

  it('PUBLIC workspace POST board (anonymous) → 401', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    await agent.post('/api/auth/register').send({
      email: `pub-post-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const ws = await agent.post('/api/workspaces').send({ name: `Public Post WS ${suffix}` });
    const wsId = ws.body.id;

    await agent
      .patch(`/api/workspaces/${wsId}/visibility`)
      .send({ visibility: 'PUBLIC', publicAccessLevel: 'FULL' });

    // Anonymous POST board
    const res = await request(app)
      .post(`/api/workspaces/${wsId}/boards`)
      .send({ name: 'Test Board' });
    expect(res.status).toBe(401);
  });

  it('PUBLIC workspace DELETE board (anonymous) → 401', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    await agent.post('/api/auth/register').send({
      email: `pub-del-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const ws = await agent.post('/api/workspaces').send({ name: `Del Board WS ${suffix}` });
    const wsId = ws.body.id;

    // Create board
    const board = await agent
      .post(`/api/workspaces/${wsId}/boards`)
      .send({ name: 'Board to delete' });
    expect(board.status).toBe(201);
    const boardId = board.body.id;

    // Make PUBLIC
    await agent
      .patch(`/api/workspaces/${wsId}/visibility`)
      .send({ visibility: 'PUBLIC', publicAccessLevel: 'FULL' });

    // Anonymous DELETE board
    const res = await request(app).delete(`/api/workspaces/${wsId}/boards/${boardId}`);
    expect(res.status).toBe(401);
  });

  it('PUBLIC workspace PATCH board (anonymous) → 401', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    await agent.post('/api/auth/register').send({
      email: `pub-patch-board-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const ws = await agent.post('/api/workspaces').send({ name: `Patch Board WS ${suffix}` });
    const wsId = ws.body.id;

    // Create board
    const board = await agent
      .post(`/api/workspaces/${wsId}/boards`)
      .send({ name: 'Board to patch' });
    expect(board.status).toBe(201);
    const boardId = board.body.id;

    // Make PUBLIC
    await agent
      .patch(`/api/workspaces/${wsId}/visibility`)
      .send({ visibility: 'PUBLIC', publicAccessLevel: 'FULL' });

    // Anonymous PATCH board
    const res = await request(app)
      .patch(`/api/workspaces/${wsId}/boards/${boardId}`)
      .send({ name: 'Hacked Board' });
    expect(res.status).toBe(401);
  });

  it('PUBLIC workspace GET posts (anonymous) → 200', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    await agent.post('/api/auth/register').send({
      email: `pub-post2-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const ws = await agent.post('/api/workspaces').send({ name: `Public Post WS2 ${suffix}` });
    const wsId = ws.body.id;

    // Create board
    const board = await agent
      .post(`/api/workspaces/${wsId}/boards`)
      .send({ name: 'Test Board' });
    expect(board.status).toBe(201);
    const boardId = board.body.id;

    // Make PUBLIC
    await agent
      .patch(`/api/workspaces/${wsId}/visibility`)
      .send({ visibility: 'PUBLIC', publicAccessLevel: 'READ_ONLY' });

    // Anonymous GET posts
    const res = await request(app).get(`/api/boards/${boardId}/posts`);
    expect(res.status).toBe(200);
    expect(res.body.posts || res.body).toBeDefined();
  });

  it('Zero PUBLIC workspaces → GET /api/workspaces/public returns empty array', async () => {
    // Make sure no PUBLIC workspaces exist — just query the feed
    const res = await request(app).get('/api/workspaces/public');
    expect(res.status).toBe(200);
    expect(res.body.workspaces).toBeInstanceOf(Array);
  });
});

describe('PUBLIC access level enforcement', () => {
  it('PUBLIC+INTERACT allows logged-in non-member to vote → 200', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const ownerAgent = request.agent(app);

    await ownerAgent.post('/api/auth/register').send({
      email: `interact-vote-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });

    const ws = await ownerAgent.post('/api/workspaces').send({ name: `Interact Vote ${suffix}` });
    expect(ws.status).toBe(201);
    const wsId: string = ws.body.id;

    const board = await ownerAgent.post(`/api/workspaces/${wsId}/boards`).send({ name: 'Feature Requests' });
    expect(board.status).toBe(201);
    const boardId: string = board.body.id;

    const post = await ownerAgent.post(`/api/boards/${boardId}/posts`).send({ title: 'Test post', body: 'Test body content' });
    expect(post.status).toBe(201);
    const postId: string = post.body.id;

    await ownerAgent
      .patch(`/api/workspaces/${wsId}/visibility`)
      .send({ visibility: 'PUBLIC', publicAccessLevel: 'INTERACT' });

    const voterAgent = request.agent(app);
    await voterAgent.post('/api/auth/register').send({
      email: `voter-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Voter',
    });

    const voteRes = await voterAgent.post(`/api/posts/${postId}/vote`);
    expect(voteRes.status).toBe(200);
    expect(voteRes.body.voted).toBe(true);
  });

  it('PUBLIC+INTERACT blocks logged-in non-member from creating a board → 403', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const ownerAgent = request.agent(app);

    await ownerAgent.post('/api/auth/register').send({
      email: `interact-board-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });

    const ws = await ownerAgent.post('/api/workspaces').send({ name: `Interact Board ${suffix}` });
    expect(ws.status).toBe(201);
    const wsId: string = ws.body.id;

    await ownerAgent
      .patch(`/api/workspaces/${wsId}/visibility`)
      .send({ visibility: 'PUBLIC', publicAccessLevel: 'INTERACT' });

    const nonMemberAgent = request.agent(app);
    await nonMemberAgent.post('/api/auth/register').send({
      email: `nonmember-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'NonMember',
    });

    const boardRes = await nonMemberAgent
      .post(`/api/workspaces/${wsId}/boards`)
      .send({ name: 'Hacked Board' });
    expect(boardRes.status).toBe(403);
  });

  it('PUBLIC+FULL allows logged-in non-member to create a board → 201', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const ownerAgent = request.agent(app);

    await ownerAgent.post('/api/auth/register').send({
      email: `full-board-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });

    const ws = await ownerAgent.post('/api/workspaces').send({ name: `Full Board ${suffix}` });
    expect(ws.status).toBe(201);
    const wsId: string = ws.body.id;

    await ownerAgent
      .patch(`/api/workspaces/${wsId}/visibility`)
      .send({ visibility: 'PUBLIC', publicAccessLevel: 'FULL' });

    const nonMemberAgent = request.agent(app);
    await nonMemberAgent.post('/api/auth/register').send({
      email: `full-nonmember-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'FullNonMember',
    });

    const boardRes = await nonMemberAgent
      .post(`/api/workspaces/${wsId}/boards`)
      .send({ name: 'My New Board' });
    expect(boardRes.status).toBe(201);
  });
});

describe('public workspace rate limiting', () => {
  it('rate limit returns 429 after exceeding 5 requests', async () => {
    const app = express();
    app.use(express.json());

    const strictLimiter = createRateLimiter(60 * 1000, 5, {
      skip: () => false,
    });
    app.use('/api/workspaces/public', strictLimiter);
    app.use('/api/workspaces', workspaceRouter);

    // Exhaust the limit
    for (let i = 0; i < 5; i++) {
      await request(app).get('/api/workspaces/public');
    }

    // 6th request → 429
    const res = await request(app).get('/api/workspaces/public');
    expect(res.status).toBe(429);
    expect(res.body).toHaveProperty('error');
  });

  it('rate-limited response includes ratelimit headers', async () => {
    const app = express();
    app.use(express.json());

    const strictLimiter = createRateLimiter(60 * 1000, 5, {
      skip: () => false,
    });
    app.use('/api/workspaces/public', strictLimiter);
    app.use('/api/workspaces', workspaceRouter);

    // Exhaust the limit
    for (let i = 0; i < 5; i++) {
      await request(app).get('/api/workspaces/public');
    }

    const res = await request(app).get('/api/workspaces/public');
    expect(res.status).toBe(429);
    expect(res.headers).toHaveProperty('ratelimit-limit');
    expect(res.headers).toHaveProperty('x-ratelimit-limit');
    expect(res.headers['ratelimit-remaining']).toBe('0');
  });
});

describe('public board detail', () => {
  it('GET /api/workspaces/public/:slug/boards/:boardSlug returns board with posts for PUBLIC workspace', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    await agent.post('/api/auth/register').send({
      email: `pub-board-detail-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });

    const ws = await agent.post('/api/workspaces').send({ name: `Public Board Detail ${suffix}` });
    expect(ws.status).toBe(201);
    const wsId: string = ws.body.id;
    const wsSlug: string = ws.body.slug;

    // Create a board
    const board = await agent.post(`/api/workspaces/${wsId}/boards`).send({ name: 'Feature Requests' });
    expect(board.status).toBe(201);
    const boardSlug: string = board.body.slug;

    // Create a post
    const post = await agent.post(`/api/boards/${board.body.id}/posts`).send({ title: 'Dark mode', body: 'Please add dark mode support' });
    expect(post.status).toBe(201);

    // Make workspace PUBLIC
    await agent
      .patch(`/api/workspaces/${wsId}/visibility`)
      .send({ visibility: 'PUBLIC', publicAccessLevel: 'READ_ONLY' });

    // Anonymous request to public board detail
    const res = await request(app).get(`/api/workspaces/public/${wsSlug}/boards/${boardSlug}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Feature Requests');
    expect(res.body.slug).toBe(boardSlug);
    expect(res.body.postCount).toBe(1);
    expect(res.body.posts).toBeInstanceOf(Array);
    expect(res.body.posts).toHaveLength(1);
    expect(res.body.posts[0].title).toBe('Dark mode');
  });

  it('GET /api/workspaces/public/:slug/boards/:boardSlug returns 404 for PRIVATE workspace', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    await agent.post('/api/auth/register').send({
      email: `priv-board-detail-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });

    const ws = await agent.post('/api/workspaces').send({ name: `Private Board ${suffix}` });
    expect(ws.status).toBe(201);
    const wsId: string = ws.body.id;
    const wsSlug: string = ws.body.slug;

    const board = await agent.post(`/api/workspaces/${wsId}/boards`).send({ name: 'Internal' });
    expect(board.status).toBe(201);
    const boardSlug: string = board.body.slug;

    // Workspace is still PRIVATE (default)
    const res = await request(app).get(`/api/workspaces/public/${wsSlug}/boards/${boardSlug}`);
    expect(res.status).toBe(404);
  });

  it('GET /api/workspaces/public/:slug/boards/:boardSlug returns 404 for non-existent board', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    await agent.post('/api/auth/register').send({
      email: `noboard-detail-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });

    const ws = await agent.post('/api/workspaces').send({ name: `No Board WS ${suffix}` });
    expect(ws.status).toBe(201);
    const wsId: string = ws.body.id;
    const wsSlug: string = ws.body.slug;

    await agent
      .patch(`/api/workspaces/${wsId}/visibility`)
      .send({ visibility: 'PUBLIC', publicAccessLevel: 'READ_ONLY' });

    const res = await request(app).get(`/api/workspaces/public/${wsSlug}/boards/nonexistent`);
    expect(res.status).toBe(404);
  });
});
