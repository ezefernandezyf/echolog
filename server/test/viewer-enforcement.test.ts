import crypto from 'node:crypto';
import request from 'supertest';
import app from '../src/index.js';
import { prisma } from '../src/infra/prisma.js';

describe('viewer enforcement', () => {
  it('returns 403 when VIEWER tries to create a board', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner creates workspace
    const ownerAgent = request.agent(app);
    await ownerAgent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'Viewer Board WS' });
    const workspaceId: string = wsRes.body.id;

    // Register viewer and add as VIEWER
    const viewerAgent = request.agent(app);
    const regRes = await viewerAgent.post('/api/auth/register').send({
      email: `viewer-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Viewer',
    });
    const viewerId: string = regRes.body.user.id;
    await prisma.workspaceMember.create({
      data: { userId: viewerId, workspaceId, role: 'VIEWER' },
    });

    // Viewer tries to create a board → 403
    const createRes = await viewerAgent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'Viewer Board' });
    expect(createRes.status).toBe(403);
  });

  it('returns 200 when VIEWER lists boards', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner creates workspace + board
    const ownerAgent = request.agent(app);
    await ownerAgent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'Viewer List WS' });
    const workspaceId: string = wsRes.body.id;
    await ownerAgent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'General' });

    // Register viewer and add as VIEWER
    const viewerAgent = request.agent(app);
    const regRes = await viewerAgent.post('/api/auth/register').send({
      email: `viewer-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Viewer',
    });
    const viewerId: string = regRes.body.user.id;
    await prisma.workspaceMember.create({
      data: { userId: viewerId, workspaceId, role: 'VIEWER' },
    });

    // Viewer lists boards → 200
    const listRes = await viewerAgent.get(`/api/workspaces/${workspaceId}/boards`);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
  });

  it('returns 403 when VIEWER tries to create a post', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner creates workspace + board
    const ownerAgent = request.agent(app);
    await ownerAgent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'Viewer Post WS' });
    const workspaceId: string = wsRes.body.id;
    const boardRes = await ownerAgent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'General' });
    const boardId: string = boardRes.body.id;

    // Register viewer and add as VIEWER
    const viewerAgent = request.agent(app);
    const regRes = await viewerAgent.post('/api/auth/register').send({
      email: `viewer-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Viewer',
    });
    const viewerId: string = regRes.body.user.id;
    await prisma.workspaceMember.create({
      data: { userId: viewerId, workspaceId, role: 'VIEWER' },
    });

    // Viewer tries to create a post → 403
    const createRes = await viewerAgent
      .post(`/api/boards/${boardId}/posts`)
      .send({ title: 'Viewer Post', body: 'Should be blocked' });
    expect(createRes.status).toBe(403);
  });

  it('returns 200 when VIEWER lists posts', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner creates workspace + board + post
    const ownerAgent = request.agent(app);
    await ownerAgent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'Viewer Post List WS' });
    const workspaceId: string = wsRes.body.id;
    const boardRes = await ownerAgent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'General' });
    const boardId: string = boardRes.body.id;
    await ownerAgent
      .post(`/api/boards/${boardId}/posts`)
      .send({ title: 'Test Post', body: 'Test' });

    // Register viewer and add as VIEWER
    const viewerAgent = request.agent(app);
    const regRes = await viewerAgent.post('/api/auth/register').send({
      email: `viewer-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Viewer',
    });
    const viewerId: string = regRes.body.user.id;
    await prisma.workspaceMember.create({
      data: { userId: viewerId, workspaceId, role: 'VIEWER' },
    });

    // Viewer lists posts → 200
    const listRes = await viewerAgent.get(`/api/boards/${boardId}/posts`);
    expect(listRes.status).toBe(200);
  });

  it('returns 403 when VIEWER tries to create a comment', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner creates workspace + board + post
    const ownerAgent = request.agent(app);
    await ownerAgent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'Viewer Comment WS' });
    const workspaceId: string = wsRes.body.id;
    const boardRes = await ownerAgent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'General' });
    const boardId: string = boardRes.body.id;
    const postRes = await ownerAgent
      .post(`/api/boards/${boardId}/posts`)
      .send({ title: 'Test Post', body: 'Test' });
    const postId: string = postRes.body.id;

    // Register viewer and add as VIEWER
    const viewerAgent = request.agent(app);
    const regRes = await viewerAgent.post('/api/auth/register').send({
      email: `viewer-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Viewer',
    });
    const viewerId: string = regRes.body.user.id;
    await prisma.workspaceMember.create({
      data: { userId: viewerId, workspaceId, role: 'VIEWER' },
    });

    // Viewer tries to create a comment → 403
    const commentRes = await viewerAgent
      .post(`/api/posts/${postId}/comments`)
      .send({ body: 'Viewer comment' });
    expect(commentRes.status).toBe(403);
  });

  it('returns 200 when VIEWER lists comments', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner creates workspace + board + post + comment
    const ownerAgent = request.agent(app);
    await ownerAgent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'Viewer Comment List WS' });
    const workspaceId: string = wsRes.body.id;
    const boardRes = await ownerAgent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'General' });
    const boardId: string = boardRes.body.id;
    const postRes = await ownerAgent
      .post(`/api/boards/${boardId}/posts`)
      .send({ title: 'Test Post', body: 'Test' });
    const postId: string = postRes.body.id;
    await ownerAgent
      .post(`/api/posts/${postId}/comments`)
      .send({ body: 'Owner comment' });

    // Register viewer and add as VIEWER
    const viewerAgent = request.agent(app);
    const regRes = await viewerAgent.post('/api/auth/register').send({
      email: `viewer-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Viewer',
    });
    const viewerId: string = regRes.body.user.id;
    await prisma.workspaceMember.create({
      data: { userId: viewerId, workspaceId, role: 'VIEWER' },
    });

    // Viewer lists comments → 200
    const listRes = await viewerAgent.get(`/api/posts/${postId}/comments`);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
  });

  it('returns 403 when VIEWER tries to vote', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner creates workspace + board + post
    const ownerAgent = request.agent(app);
    await ownerAgent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'Viewer Vote WS' });
    const workspaceId: string = wsRes.body.id;
    const boardRes = await ownerAgent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'General' });
    const boardId: string = boardRes.body.id;
    const postRes = await ownerAgent
      .post(`/api/boards/${boardId}/posts`)
      .send({ title: 'Test Post', body: 'Test' });
    const postId: string = postRes.body.id;

    // Register viewer and add as VIEWER
    const viewerAgent = request.agent(app);
    const regRes = await viewerAgent.post('/api/auth/register').send({
      email: `viewer-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Viewer',
    });
    const viewerId: string = regRes.body.user.id;
    await prisma.workspaceMember.create({
      data: { userId: viewerId, workspaceId, role: 'VIEWER' },
    });

    // Viewer tries to vote → 403
    const voteRes = await viewerAgent.post(`/api/posts/${postId}/vote`);
    expect(voteRes.status).toBe(403);
  });

  it('returns 401 when listing comments without auth', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner creates workspace + board + post
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await agent.post('/api/workspaces').send({ name: 'Comment Auth Gap WS' });
    const workspaceId: string = wsRes.body.id;
    const boardRes = await agent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'General' });
    const boardId: string = boardRes.body.id;
    const postRes = await agent
      .post(`/api/boards/${boardId}/posts`)
      .send({ title: 'Test Post', body: 'Test' });
    const postId: string = postRes.body.id;

    // Anonymous request → 401
    const anonRes = await request(app).get(`/api/posts/${postId}/comments`);
    expect(anonRes.status).toBe(401);
  });
});
