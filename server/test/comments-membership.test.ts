import crypto from 'node:crypto';
import request from 'supertest';
import app from '../src/index.js';
import { prisma } from '../src/infra/prisma.js';

describe('comments membership hardening', () => {
  it('returns 403 when creating comment as non-member', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner creates workspace + board + post
    const ownerAgent = request.agent(app);
    await ownerAgent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'Comment WS' });
    const workspaceId: string = wsRes.body.id;
    const boardRes = await ownerAgent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'General' });
    const boardId: string = boardRes.body.id;
    const postRes = await ownerAgent
      .post(`/api/boards/${boardId}/posts`)
      .send({ title: 'Public Post', body: 'Everyone can see this... or can they?' });
    const postId: string = postRes.body.id;

    // Intruder registers (not a member)
    const intruderAgent = request.agent(app);
    await intruderAgent.post('/api/auth/register').send({
      email: `intruder-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Intruder',
    });

    // Intruder tries to comment → 403
    const commentRes = await intruderAgent
      .post(`/api/posts/${postId}/comments`)
      .send({ body: 'Nice post!' });
    expect(commentRes.status).toBe(403);
  });

  it('allows author to delete their own comment (200)', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner creates workspace + board + post
    const ownerAgent = request.agent(app);
    await ownerAgent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'Author WS' });
    const workspaceId: string = wsRes.body.id;
    const boardRes = await ownerAgent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'General' });
    const boardId: string = boardRes.body.id;
    const postRes = await ownerAgent
      .post(`/api/boards/${boardId}/posts`)
      .send({ title: 'Author Post', body: 'Testing author deletion' });
    const postId: string = postRes.body.id;

    // Owner comments
    const commentRes = await ownerAgent
      .post(`/api/posts/${postId}/comments`)
      .send({ body: 'My own comment' });
    expect(commentRes.status).toBe(201);
    const commentId: string = commentRes.body.id;

    // Author (owner) deletes own comment → 200
    const deleteRes = await ownerAgent.delete(`/api/posts/${postId}/comments/${commentId}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
  });

  it("allows OWNER to delete another user's comment (200)", async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner creates workspace
    const ownerAgent = request.agent(app);
    await ownerAgent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'Owner WS' });
    const workspaceId: string = wsRes.body.id;

    // Register another user (member) and add them to workspace
    const memberAgent = request.agent(app);
    const regRes = await memberAgent.post('/api/auth/register').send({
      email: `member-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Member',
    });
    const memberId: string = regRes.body.user.id;

    // Add member to workspace via prisma
    await prisma.workspaceMember.create({
      data: { userId: memberId, workspaceId, role: 'MEMBER' },
    });

    // Owner creates board + post
    const boardRes = await ownerAgent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'General' });
    const boardId: string = boardRes.body.id;
    const postRes = await ownerAgent
      .post(`/api/boards/${boardId}/posts`)
      .send({ title: 'Post', body: 'Testing' });
    const postId: string = postRes.body.id;

    // Member creates a comment
    const commentRes = await memberAgent
      .post(`/api/posts/${postId}/comments`)
      .send({ body: 'Member comment' });
    expect(commentRes.status).toBe(201);
    const commentId: string = commentRes.body.id;

    // Owner deletes member's comment → 200
    const deleteRes = await ownerAgent.delete(`/api/posts/${postId}/comments/${commentId}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
  });

  it("allows ADMIN to delete another user's comment (200)", async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner creates workspace
    const ownerAgent = request.agent(app);
    await ownerAgent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'Admin WS' });
    const workspaceId: string = wsRes.body.id;

    // Register another user (will be ADMIN)
    const adminAgent = request.agent(app);
    const regRes = await adminAgent.post('/api/auth/register').send({
      email: `admin-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Admin',
    });
    const adminId: string = regRes.body.user.id;

    // Add admin to workspace with ADMIN role via prisma
    await prisma.workspaceMember.create({
      data: { userId: adminId, workspaceId, role: 'ADMIN' },
    });

    // Owner creates board + post
    const boardRes = await ownerAgent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'General' });
    const boardId: string = boardRes.body.id;
    const postRes = await ownerAgent
      .post(`/api/boards/${boardId}/posts`)
      .send({ title: 'Post', body: 'Testing admin deletion' });
    const postId: string = postRes.body.id;

    // Owner creates a comment
    const commentRes = await ownerAgent
      .post(`/api/posts/${postId}/comments`)
      .send({ body: 'Owner comment' });
    expect(commentRes.status).toBe(201);
    const commentId: string = commentRes.body.id;

    // Admin deletes owner's comment → 200
    const deleteRes = await adminAgent.delete(`/api/posts/${postId}/comments/${commentId}`);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
  });

  it('returns 201 when member creates a comment', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner creates workspace
    const ownerAgent = request.agent(app);
    await ownerAgent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'Member Comment WS' });
    const workspaceId: string = wsRes.body.id;

    // Register another user (member) and add them to workspace
    const memberAgent = request.agent(app);
    const regRes = await memberAgent.post('/api/auth/register').send({
      email: `member-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Member',
    });
    const memberId: string = regRes.body.user.id;

    // Add member to workspace via prisma
    await prisma.workspaceMember.create({
      data: { userId: memberId, workspaceId, role: 'MEMBER' },
    });

    // Owner creates board + post
    const boardRes = await ownerAgent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'General' });
    const boardId: string = boardRes.body.id;
    const postRes = await ownerAgent
      .post(`/api/boards/${boardId}/posts`)
      .send({ title: 'Post', body: 'Testing member comment creation' });
    const postId: string = postRes.body.id;

    // Member creates a comment → 201
    const commentRes = await memberAgent
      .post(`/api/posts/${postId}/comments`)
      .send({ body: 'Member comment from the people' });
    expect(commentRes.status).toBe(201);
    expect(commentRes.body.body).toBe('Member comment from the people');
    expect(commentRes.body.id).toBeDefined();
  });

  it("returns 403 when non-privileged user tries to delete another user's comment", async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner creates workspace
    const ownerAgent = request.agent(app);
    await ownerAgent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'Shared WS' });
    const workspaceId: string = wsRes.body.id;

    // Register user A (regular member) and add to workspace
    const userAAgent = request.agent(app);
    const regA = await userAAgent.post('/api/auth/register').send({
      email: `userA-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'User A',
    });
    const userIdA: string = regA.body.user.id;

    await prisma.workspaceMember.create({
      data: { userId: userIdA, workspaceId, role: 'MEMBER' },
    });

    // Register user B (another regular member) and add to workspace
    const userBAgent = request.agent(app);
    const regB = await userBAgent.post('/api/auth/register').send({
      email: `userB-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'User B',
    });
    const userIdB: string = regB.body.user.id;

    await prisma.workspaceMember.create({
      data: { userId: userIdB, workspaceId, role: 'MEMBER' },
    });

    // Owner creates board + post
    const boardRes = await ownerAgent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'General' });
    const boardId: string = boardRes.body.id;
    const postRes = await ownerAgent
      .post(`/api/boards/${boardId}/posts`)
      .send({ title: 'Post', body: 'Testing 403' });
    const postId: string = postRes.body.id;

    // User A creates a comment
    const commentRes = await userAAgent
      .post(`/api/posts/${postId}/comments`)
      .send({ body: 'User A comment' });
    expect(commentRes.status).toBe(201);
    const commentId: string = commentRes.body.id;

    // User B (not author, not admin, not owner) tries to delete → 403
    const deleteRes = await userBAgent.delete(`/api/posts/${postId}/comments/${commentId}`);
    expect(deleteRes.status).toBe(403);
  });
});
