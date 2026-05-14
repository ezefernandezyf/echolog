import crypto from 'node:crypto';
import request from 'supertest';
import app from '../src/index.js';

describe('posts filtering & pagination', () => {
  it('filters posts by status, paginates with limit, and sorts by top', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    // Register user
    const regRes = await agent.post('/api/auth/register').send({
      email: `filter-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Filter Tester',
    });
    expect(regRes.status).toBe(201);

    // Create workspace
    const wsRes = await agent.post('/api/workspaces').send({
      name: 'Filters Workspace',
    });
    expect(wsRes.status).toBe(201);
    const workspaceId: string = wsRes.body.id;

    // Create board
    const boardRes = await agent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'Roadmap' });
    expect(boardRes.status).toBe(201);
    const boardId: string = boardRes.body.id;

    // Create 5 posts (all default to OPEN)
    const posts: Array<{ id: string }> = [];
    for (let i = 0; i < 5; i++) {
      const postRes = await agent
        .post(`/api/boards/${boardId}/posts`)
        .send({ title: `Post ${i + 1}`, body: `Body of post ${i + 1}.` });
      expect(postRes.status).toBe(201);
      posts.push(postRes.body);
    }

    // Vote on the first post so the list can hydrate per-user state
    const voteRes = await agent.post(`/api/posts/${posts[0].id}/vote`);
    expect(voteRes.status).toBe(200);
    expect(voteRes.body.voted).toBe(true);

    // Update post 3 → PLANNED (index 2)
    const plannedRes = await agent
      .patch(`/api/posts/${posts[2].id}/status`)
      .send({ status: 'PLANNED' });
    expect(plannedRes.status).toBe(200);

    // Update post 4 → DONE (index 3)
    const done1Res = await agent
      .patch(`/api/posts/${posts[3].id}/status`)
      .send({ status: 'DONE' });
    expect(done1Res.status).toBe(200);

    // Update post 5 → DONE (index 4)
    const done2Res = await agent
      .patch(`/api/posts/${posts[4].id}/status`)
      .send({ status: 'DONE' });
    expect(done2Res.status).toBe(200);

    // Test: list all posts → 200, returns all 5
    const allRes = await agent.get(`/api/boards/${boardId}/posts?limit=50`);
    expect(allRes.status).toBe(200);
    expect(allRes.body.posts).toHaveLength(5);
    expect(allRes.body.nextCursor).toBeNull();
    expect(allRes.body.posts.find((post: { id: string; isUpvoted?: boolean }) => post.id === posts[0].id)?.isUpvoted).toBe(true);

    const anonRes = await request(app).get(`/api/boards/${boardId}/posts?limit=50`);
    expect(anonRes.status).toBe(200);
    expect(anonRes.body.posts.find((post: { id: string; isUpvoted?: boolean }) => post.id === posts[0].id)?.isUpvoted).toBe(false);

    // Test: filter by status=OPEN → 200, returns 2 posts (all with status OPEN)
    const openRes = await agent.get(`/api/boards/${boardId}/posts?status=OPEN`);
    expect(openRes.status).toBe(200);
    expect(openRes.body.posts).toHaveLength(2);
    for (const post of openRes.body.posts) {
      expect(post.status).toBe('OPEN');
    }

    // Test: filter by status=DONE → 200, returns 2 posts
    const doneRes = await agent.get(`/api/boards/${boardId}/posts?status=DONE`);
    expect(doneRes.status).toBe(200);
    expect(doneRes.body.posts).toHaveLength(2);
    for (const post of doneRes.body.posts) {
      expect(post.status).toBe('DONE');
    }

    // Test: pagination with limit=2 → 200, returns 2 posts + has nextCursor
    const pageRes = await agent.get(`/api/boards/${boardId}/posts?limit=2`);
    expect(pageRes.status).toBe(200);
    expect(pageRes.body.posts).toHaveLength(2);
    expect(pageRes.body.nextCursor).toBeTruthy();

    // Test: sort by top → 200, returns posts (just verify no error)
    const sortRes = await agent.get(`/api/boards/${boardId}/posts?sort=top`);
    expect(sortRes.status).toBe(200);
    expect(Array.isArray(sortRes.body.posts)).toBe(true);
  });
});
