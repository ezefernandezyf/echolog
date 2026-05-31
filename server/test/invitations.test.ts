import crypto from 'node:crypto';
import request from 'supertest';
import app from '../src/index.js';
import { prisma } from '../src/infra/prisma.js';

describe('invitation flow', () => {
  it('returns 201 when OWNER creates an invitation', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner registers and creates workspace
    const ownerAgent = request.agent(app);
    await ownerAgent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'Invite WS' });
    const workspaceId: string = wsRes.body.id;

    // Also register the target user so they exist
    const targetAgent = request.agent(app);
    await targetAgent.post('/api/auth/register').send({
      email: `target-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Target',
    });

    // Owner creates invitation → 201
    const inviteRes = await ownerAgent
      .post(`/api/workspaces/${workspaceId}/invitations`)
      .send({ email: `target-${suffix}@test.dev`, role: 'MEMBER' });
    expect(inviteRes.status).toBe(201);
    expect(inviteRes.body.invitedEmail).toBe(`target-${suffix}@test.dev`);
    expect(inviteRes.body.role).toBe('MEMBER');
    expect(inviteRes.body.status).toBe('PENDING');
    expect(inviteRes.body.token).toBeDefined();
  });

  it('returns 403 when MEMBER tries to create an invitation', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner registers and creates workspace
    const ownerAgent = request.agent(app);
    await ownerAgent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'Member Invite WS' });
    const workspaceId: string = wsRes.body.id;

    // Register member and add as MEMBER
    const memberAgent = request.agent(app);
    const regRes = await memberAgent.post('/api/auth/register').send({
      email: `member-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Member',
    });
    const memberId: string = regRes.body.user.id;
    await prisma.workspaceMember.create({
      data: { userId: memberId, workspaceId, role: 'MEMBER' },
    });

    // Member tries to invite → 403
    const inviteRes = await memberAgent
      .post(`/api/workspaces/${workspaceId}/invitations`)
      .send({ email: `guest-${suffix}@test.dev`, role: 'MEMBER' });
    expect(inviteRes.status).toBe(403);
  });

  it('returns 201 when accepting an invitation with matching email', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner registers and creates workspace
    const ownerAgent = request.agent(app);
    await ownerAgent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'Accept Invite WS' });
    const workspaceId: string = wsRes.body.id;

    // Register the target user
    const targetAgent = request.agent(app);
    await targetAgent.post('/api/auth/register').send({
      email: `accepter-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Accepter',
    });

    // Owner creates invitation
    const inviteRes = await ownerAgent
      .post(`/api/workspaces/${workspaceId}/invitations`)
      .send({ email: `accepter-${suffix}@test.dev`, role: 'MEMBER' });
    const token: string = inviteRes.body.token;

    // Target accepts invitation → 200
    const acceptRes = await targetAgent.post(`/api/invitations/${token}/accept`);
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.role).toBe('MEMBER');
    expect(acceptRes.body.workspaceId).toBe(workspaceId);

    // Verify member was created
    const membersRes = await ownerAgent.get(`/api/workspaces/${workspaceId}/members`);
    expect(membersRes.status).toBe(200);
    const emails = membersRes.body.map((m: { email: string }) => m.email);
    expect(emails).toContain(`accepter-${suffix}@test.dev`);
  });

  it('returns 403 when accepting with wrong email', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner registers and creates workspace
    const ownerAgent = request.agent(app);
    await ownerAgent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'Wrong Email WS' });
    const workspaceId: string = wsRes.body.id;

    // Register user A (the invited user)
    await request(app)
      .post('/api/auth/register')
      .send({
        email: `invited-${suffix}@test.dev`,
        password: 'secret12345',
        name: 'Invited',
      });

    // Register user B (the wrong user)
    const wrongAgent = request.agent(app);
    await wrongAgent.post('/api/auth/register').send({
      email: `wrong-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Wrong',
    });

    // Owner creates invitation for user A
    const inviteRes = await ownerAgent
      .post(`/api/workspaces/${workspaceId}/invitations`)
      .send({ email: `invited-${suffix}@test.dev`, role: 'MEMBER' });
    const token: string = inviteRes.body.token;

    // User B (wrong email) tries to accept → 403
    const acceptRes = await wrongAgent.post(`/api/invitations/${token}/accept`);
    expect(acceptRes.status).toBe(403);
  });

  it('returns 410 when accepting an expired invitation', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner registers and creates workspace
    const ownerAgent = request.agent(app);
    await ownerAgent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'Expired Invite WS' });
    const workspaceId: string = wsRes.body.id;

    // Register the target user and keep a logged-in agent
    const targetAgent = request.agent(app);
    await targetAgent.post('/api/auth/register').send({
      email: `expired-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Expired',
    });

    // Owner creates invitation
    const inviteRes = await ownerAgent
      .post(`/api/workspaces/${workspaceId}/invitations`)
      .send({ email: `expired-${suffix}@test.dev`, role: 'MEMBER' });
    const token: string = inviteRes.body.token;

    // Manually expire the invitation in the database
    await prisma.workspaceInvitation.update({
      where: { token },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    // Target tries to accept → 410
    const acceptRes = await targetAgent.post(`/api/invitations/${token}/accept`);
    expect(acceptRes.status).toBe(410);
  });

  it('returns 200 when listing members returns correct roles', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner registers and creates workspace
    const ownerAgent = request.agent(app);
    await ownerAgent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'List Members WS' });
    const workspaceId: string = wsRes.body.id;

    // Register another user and add as ADMIN
    const adminAgent = request.agent(app);
    const regRes = await adminAgent.post('/api/auth/register').send({
      email: `admin-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Admin',
    });
    const adminId: string = regRes.body.user.id;
    await prisma.workspaceMember.create({
      data: { userId: adminId, workspaceId, role: 'ADMIN' },
    });

    // Register another user and add as VIEWER
    const regRes2 = await request(app)
      .post('/api/auth/register')
      .send({
        email: `viewer-${suffix}@test.dev`,
        password: 'secret12345',
        name: 'Viewer',
      });
    const viewerId: string = regRes2.body.user.id;
    await prisma.workspaceMember.create({
      data: { userId: viewerId, workspaceId, role: 'VIEWER' },
    });

    // List members as owner → 200
    const listRes = await ownerAgent.get(`/api/workspaces/${workspaceId}/members`);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBe(3);

    const ownerEntry = listRes.body.find((m: { role: string }) => m.role === 'OWNER');
    expect(ownerEntry).toBeDefined();

    const adminEntry = listRes.body.find((m: { role: string }) => m.role === 'ADMIN');
    expect(adminEntry).toBeDefined();

    const viewerEntry = listRes.body.find((m: { role: string }) => m.role === 'VIEWER');
    expect(viewerEntry).toBeDefined();
  });

  it('returns 200 when changing a member role', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner registers and creates workspace
    const ownerAgent = request.agent(app);
    await ownerAgent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'Change Role WS' });
    const workspaceId: string = wsRes.body.id;

    // Register another user and add as MEMBER
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: `changeme-${suffix}@test.dev`,
        password: 'secret12345',
        name: 'ChangeMe',
      });
    const targetId: string = regRes.body.user.id;
    await prisma.workspaceMember.create({
      data: { userId: targetId, workspaceId, role: 'MEMBER' },
    });

    // Owner changes role to ADMIN → 200
    const changeRes = await ownerAgent
      .patch(`/api/workspaces/${workspaceId}/members/${targetId}`)
      .send({ role: 'ADMIN' });
    expect(changeRes.status).toBe(200);
    expect(changeRes.body.role).toBe('ADMIN');
  });

  it('returns 200 when removing a member', async () => {
    const suffix = crypto.randomUUID().slice(0, 8);

    // Owner registers and creates workspace
    const ownerAgent = request.agent(app);
    await ownerAgent.post('/api/auth/register').send({
      email: `owner-${suffix}@test.dev`,
      password: 'secret12345',
      name: 'Owner',
    });
    const wsRes = await ownerAgent.post('/api/workspaces').send({ name: 'Remove Member WS' });
    const workspaceId: string = wsRes.body.id;

    // Register another user and add as MEMBER
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: `removeme-${suffix}@test.dev`,
        password: 'secret12345',
        name: 'RemoveMe',
      });
    const targetId: string = regRes.body.user.id;
    await prisma.workspaceMember.create({
      data: { userId: targetId, workspaceId, role: 'MEMBER' },
    });

    // Owner removes member → 204
    const removeRes = await ownerAgent.delete(`/api/workspaces/${workspaceId}/members/${targetId}`);
    expect(removeRes.status).toBe(204);

    // Verify member count decreased
    const membersRes = await ownerAgent.get(`/api/workspaces/${workspaceId}/members`);
    expect(membersRes.body.length).toBe(1);
  });
});
