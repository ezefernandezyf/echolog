import crypto from 'node:crypto';
import request from 'supertest';
import app from '../src/index.js';
import { prisma } from '../src/infra/prisma.js';

describe('post deletion', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });
  it('allows the post author to delete their own post (204)', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    // Register author
    const regRes = await agent.post('/api/auth/register').send({
      email: `author-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Author',
    });
    expect(regRes.status).toBe(201);

    // Create workspace
    const wsRes = await agent.post('/api/workspaces').send({ name: 'Delete Test WS' });
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
      .send({ title: 'Post to delete', body: 'This post will be deleted.' });
    expect(postRes.status).toBe(201);
    const postId: string = postRes.body.id;

    // Author deletes their own post
    const deleteRes = await agent.delete(`/api/posts/${postId}`);
    expect(deleteRes.status).toBe(204);

    // Verify post is gone
    const getRes = await agent.get(`/api/posts/${postId}`);
    expect(getRes.status).toBe(404);
  });

  // Scenario 2: Workspace admin deletes another user's post → 204
  it('allows a workspace ADMIN to delete another user post (204)', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Register owner
    const ownerAgent = request.agent(app);
    const ownerReg = await ownerAgent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    expect(ownerReg.status).toBe(201);

    // Create workspace
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'Admin WS' });
    expect(wsRes.status).toBe(201);
    const workspaceId: string = wsRes.body.id;

    // Create board
    const boardRes = await ownerAgent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'General' });
    expect(boardRes.status).toBe(201);
    const boardId: string = boardRes.body.id;

    // Register a regular member
    const memberAgent = request.agent(app);
    await memberAgent.post('/api/auth/register').send({
      email: `member-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Member',
    });

    // Register an admin
    const adminAgent = request.agent(app);
    const adminReg = await adminAgent.post('/api/auth/register').send({
      email: `admin-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Admin',
    });
    expect(adminReg.status).toBe(201);

    // Owner invites admin and member (we need the invitation tokens)
    const inviteAdminRes = await ownerAgent
      .post(`/api/workspaces/${workspaceId}/invitations`)
      .send({ email: `admin-${suffix}@test.dev`, role: 'ADMIN' });
    expect(inviteAdminRes.status).toBe(201);

    const inviteMemberRes = await ownerAgent
      .post(`/api/workspaces/${workspaceId}/invitations`)
      .send({ email: `member-${suffix}@test.dev`, role: 'MEMBER' });
    expect(inviteMemberRes.status).toBe(201);

    // Admin accepts invite
    await adminAgent.post(`/api/invitations/${inviteAdminRes.body.token}/accept`);

    // Member accepts invite
    await memberAgent.post(`/api/invitations/${inviteMemberRes.body.token}/accept`);

    // Member creates a post
    const postRes = await memberAgent
      .post(`/api/boards/${boardId}/posts`)
      .send({ title: 'Member post', body: 'Admin can delete this.' });
    expect(postRes.status).toBe(201);
    const postId: string = postRes.body.id;

    // Admin deletes the member's post
    const deleteRes = await adminAgent.delete(`/api/posts/${postId}`);
    expect(deleteRes.status).toBe(204);

    // Verify post is gone
    const getRes = await memberAgent.get(`/api/posts/${postId}`);
    expect(getRes.status).toBe(404);
  });

  // Scenario 3: Non-author, non-admin member → 403
  it('rejects deletion by a non-author member who is not admin (403)', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Register owner
    const ownerAgent = request.agent(app);
    const ownerReg = await ownerAgent.post('/api/auth/register').send({
      email: `owner2-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner2',
    });
    expect(ownerReg.status).toBe(201);

    // Create workspace
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'Reject WS' });
    expect(wsRes.status).toBe(201);
    const workspaceId: string = wsRes.body.id;

    // Create board
    const boardRes = await ownerAgent
      .post(`/api/workspaces/${workspaceId}/boards`)
      .send({ name: 'General' });
    expect(boardRes.status).toBe(201);
    const boardId: string = boardRes.body.id;

    // Register author
    const authorAgent = request.agent(app);
    await authorAgent.post('/api/auth/register').send({
      email: `author2-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Author2',
    });

    // Register another member
    const otherAgent = request.agent(app);
    const otherReg = await otherAgent.post('/api/auth/register').send({
      email: `other-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Other',
    });
    expect(otherReg.status).toBe(201);

    // Invite both as MEMBER
    const inviteAuthorRes = await ownerAgent
      .post(`/api/workspaces/${workspaceId}/invitations`)
      .send({ email: `author2-${suffix}@test.dev`, role: 'MEMBER' });
    expect(inviteAuthorRes.status).toBe(201);

    const inviteOtherRes = await ownerAgent
      .post(`/api/workspaces/${workspaceId}/invitations`)
      .send({ email: `other-${suffix}@test.dev`, role: 'MEMBER' });
    expect(inviteOtherRes.status).toBe(201);

    // Both accept
    await authorAgent.post(`/api/invitations/${inviteAuthorRes.body.token}/accept`);
    await otherAgent.post(`/api/invitations/${inviteOtherRes.body.token}/accept`);

    // Author creates a post
    const postRes = await authorAgent
      .post(`/api/boards/${boardId}/posts`)
      .send({ title: 'Author post', body: 'Only author can delete.' });
    expect(postRes.status).toBe(201);
    const postId: string = postRes.body.id;

    // Other member tries to delete author's post → 403
    const deleteRes = await otherAgent.delete(`/api/posts/${postId}`);
    expect(deleteRes.status).toBe(403);

    // Post still exists
    const getRes = await authorAgent.get(`/api/posts/${postId}`);
    expect(getRes.status).toBe(200);
  });

  // Scenario 4: Missing post → 404
  it('returns 404 when post does not exist', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);
    const agent = request.agent(app);

    // Register user
    const regRes = await agent.post('/api/auth/register').send({
      email: `user-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'User',
    });
    expect(regRes.status).toBe(201);

    // Create workspace (to have auth context for requirePostMember)
    const wsRes = await agent.post('/api/workspaces').send({ name: '404 WS' });
    expect(wsRes.status).toBe(201);

    // Try to delete a non-existent post
    const deleteRes = await agent.delete('/api/posts/nonexistent-post-id');
    expect(deleteRes.status).toBe(404);
  });
});
