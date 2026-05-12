import crypto from 'node:crypto';
import request from 'supertest';
import app from '../src/index.js';

describe('comments CRUD', () => {
  it('allows a user to create and list comments on a post, and rejects empty body', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    // Register user
    const regRes = await agent.post('/api/auth/register').send({
      email: `commenter-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Commenter',
    });
    expect(regRes.status).toBe(201);

    // Create workspace
    const wsRes = await agent.post('/api/workspaces').send({
      name: 'Comments Workspace',
      slug: `comments-ws-${suffix}`,
    });
    expect(wsRes.status).toBe(201);
    const workspaceId: string = wsRes.body.id;

    // Create board
    const boardRes = await agent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'General', slug: `general-${suffix}` });
    expect(boardRes.status).toBe(201);
    const boardId: string = boardRes.body.id;

    // Create post
    const postRes = await agent
      .post(`/api/boards/${boardId}/posts`)
      .send({ title: 'Hello world', body: 'This is a test post.' });
    expect(postRes.status).toBe(201);
    const postId: string = postRes.body.id;

    // Test: create a comment → 201
    const commentRes = await agent
      .post(`/api/posts/${postId}/comments`)
      .send({ body: 'This is a great post!' });
    expect(commentRes.status).toBe(201);
    expect(commentRes.body.body).toBe('This is a great post!');

    // Test: list comments → 200, returns array with the created comment
    const listRes = await agent.get(`/api/posts/${postId}/comments`);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBe(1);
    expect(listRes.body[0].body).toBe('This is a great post!');

    // Test: create comment with empty body → 400 (validation)
    const emptyRes = await agent
      .post(`/api/posts/${postId}/comments`)
      .send({ body: '' });
    expect(emptyRes.status).toBe(400);
  });
});
