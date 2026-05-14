import crypto from 'node:crypto';
import request from 'supertest';
import app from '../src/index.js';

describe('comment validation', () => {
  it('rejects empty comment body with structured validation error', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    // Register user
    const regRes = await agent.post('/api/auth/register').send({
      email: `comment-val-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Comment Validator',
    });
    expect(regRes.status).toBe(201);

    // Create workspace
    const wsRes = await agent.post('/api/workspaces').send({
      name: 'Comment Test Workspace',
    });
    expect(wsRes.status).toBe(201);
    const workspaceId: string = wsRes.body.id;

    // Create board
    const boardRes = await agent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'General' });
    expect(boardRes.status).toBe(201);
    const boardId: string = boardRes.body.id;

    // Create post
    const postRes = await agent
      .post(`/api/boards/${boardId}/posts`)
      .send({ title: 'Hello', body: 'Test post body.' });
    expect(postRes.status).toBe(201);
    const postId: string = postRes.body.id;

    // Test: empty body → 400 with structured issues
    const emptyRes = await agent
      .post(`/api/posts/${postId}/comments`)
      .send({ body: '' });
    expect(emptyRes.status).toBe(400);
    expect(emptyRes.body.error).toBe(true);
    expect(emptyRes.body.code).toBe(400);

    // Should have details.issues with path+message for 'body' field
    expect(emptyRes.body.details).toBeDefined();
    expect(emptyRes.body.details.issues).toBeDefined();
    expect(emptyRes.body.details.issues.length).toBeGreaterThan(0);

    const bodyIssue = emptyRes.body.details.issues.find(
      (i: { path: string[]; message: string }) => i.path[0] === 'body',
    );
    expect(bodyIssue).toBeDefined();
    expect(bodyIssue.message).toBe('Comment body is required');
  });

  it('accepts valid comment and returns 201', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    // Register user
    const regRes = await agent.post('/api/auth/register').send({
      email: `comment-ok-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Commenter',
    });
    expect(regRes.status).toBe(201);

    // Create workspace
    const wsRes = await agent.post('/api/workspaces').send({
      name: 'Comment OK Workspace',
    });
    expect(wsRes.status).toBe(201);
    const workspaceId: string = wsRes.body.id;

    // Create board
    const boardRes = await agent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'General' });
    expect(boardRes.status).toBe(201);
    const boardId: string = boardRes.body.id;

    // Create post
    const postRes = await agent
      .post(`/api/boards/${boardId}/posts`)
      .send({ title: 'Hello', body: 'Test post body.' });
    expect(postRes.status).toBe(201);
    const postId: string = postRes.body.id;

    // Test: valid comment → 201
    const commentRes = await agent
      .post(`/api/posts/${postId}/comments`)
      .send({ body: 'This is a great idea!' });
    expect(commentRes.status).toBe(201);
    expect(commentRes.body.body).toBe('This is a great idea!');
  });

  it('rejects whitespace-only comment body', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    // Register user
    await agent.post('/api/auth/register').send({
      email: `comment-ws-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'WS Commenter',
    });

    // Create workspace
    const wsRes = await agent.post('/api/workspaces').send({
      name: 'WS Comment Workspace',
    });
    const workspaceId: string = wsRes.body.id;

    // Create board
    const boardRes = await agent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'General' });
    const boardId: string = boardRes.body.id;

    // Create post
    const postRes = await agent
      .post(`/api/boards/${boardId}/posts`)
      .send({ title: 'Hello', body: 'Test post body.' });
    const postId: string = postRes.body.id;

    // Test: whitespace-only → 400
    const wsRes2 = await agent
      .post(`/api/posts/${postId}/comments`)
      .send({ body: '   ' });
    expect(wsRes2.status).toBe(400);
    expect(wsRes2.body.details.issues.length).toBeGreaterThan(0);
  });
});
