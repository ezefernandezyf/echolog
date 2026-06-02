import crypto from 'node:crypto';
import request from 'supertest';
import app from '../src/index.js';

describe('XSS sanitization through service layer', () => {
  it('sanitizes post title and body', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    // Register as owner, create workspace + board
    await agent.post('/api/auth/register').send({
      email: `xss-post-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'XSS Post Tester',
    });
    const wsRes = await agent.post('/api/workspaces').send({ name: `XSS Post WS ${suffix}` });
    const workspaceId: string = wsRes.body.id;
    const boardRes = await agent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'XSS Board' });
    const boardId: string = boardRes.body.id;

    // Create post with malicious HTML
    const postRes = await agent
      .post(`/api/boards/${boardId}/posts`)
      .send({ title: '<script>alert(1)</script>', body: '<p>Hello <b>World</b></p>' });

    expect(postRes.status).toBe(201);
    expect(postRes.body.title).toBe('');
    expect(postRes.body.body).toBe('Hello World');

    // Verify via GET also returns sanitized content
    const getRes = await agent.get(`/api/posts/${postRes.body.id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.title).toBe('');
    expect(getRes.body.body).toBe('Hello World');
  });

  it('sanitizes comment body', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    // Register as owner, create workspace + board + post
    await agent.post('/api/auth/register').send({
      email: `xss-comment-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'XSS Comment Tester',
    });
    const wsRes = await agent.post('/api/workspaces').send({ name: `XSS Comment WS ${suffix}` });
    const workspaceId: string = wsRes.body.id;
    const boardRes = await agent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'XSS Board' });
    const boardId: string = boardRes.body.id;
    const postRes = await agent
      .post(`/api/boards/${boardId}/posts`)
      .send({ title: 'Comment Post', body: 'A post for comments' });
    const postId: string = postRes.body.id;

    // Create comment with malicious HTML
    const commentRes = await agent
      .post(`/api/posts/${postId}/comments`)
      .send({ body: '<script>alert("xss")</script>Clean comment' });

    expect(commentRes.status).toBe(201);
    expect(commentRes.body.body).toBe('Clean comment');

    // Verify via GET comments
    const getRes = await agent.get(`/api/posts/${postId}/comments`);
    expect(getRes.status).toBe(200);
    const comment = getRes.body.find((c: { id: string }) => c.id === commentRes.body.id);
    expect(comment).toBeDefined();
    expect(comment.body).toBe('Clean comment');
  });

  it('sanitizes workspace name on create', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    await agent.post('/api/auth/register').send({
      email: `xss-ws-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'XSS WS Tester',
    });

    const wsRes = await agent.post('/api/workspaces').send({
      name: '<script>alert(1)</script>Workspace Name',
    });

    expect(wsRes.status).toBe(201);
    expect(wsRes.body.name).toBe('Workspace Name');
  });

  it('sanitizes board name and description on create', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    // Register as owner, create workspace
    await agent.post('/api/auth/register').send({
      email: `xss-board-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'XSS Board Tester',
    });
    const wsRes = await agent.post('/api/workspaces').send({ name: `XSS Board WS ${suffix}` });
    const workspaceId: string = wsRes.body.id;

    // Create board with malicious HTML
    const boardRes = await agent.post(`/api/workspaces/${workspaceId}/boards`).send({
      name: '<b>Board</b> Name',
      description: '<script>alert(1)</script>Board description',
    });

    expect(boardRes.status).toBe(201);
    expect(boardRes.body.name).toBe('Board Name');
    expect(boardRes.body.description).toBe('Board description');
  });
});
