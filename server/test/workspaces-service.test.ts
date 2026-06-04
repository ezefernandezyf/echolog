import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — hoisted by vitest, must be before any imports
// ---------------------------------------------------------------------------
vi.mock('../src/infra/prisma', () => ({
  prisma: {
    workspace: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    workspaceMember: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    workspaceInvitation: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    $transaction: vi.fn((queries: Promise<unknown>[]) => Promise.all(queries)),
  },
}));

vi.mock('../src/notifications/notifications.service', () => ({
  notificationsService: { create: vi.fn() },
}));

vi.mock('../src/email/email.service', () => ({
  emailService: {
    sendInvitationEmail: vi.fn(),
    sendRoleChangedEmail: vi.fn(),
    sendWelcomeEmail: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------
import { workspacesService } from '../src/workspaces/workspaces.service';
import { prisma } from '../src/infra/prisma';
import { notificationsService } from '../src/notifications/notifications.service';
import { emailService } from '../src/email/email.service';
import type { Mock } from 'vitest';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const futureDate = new Date(Date.now() + 86400_000);
const pastDate = new Date(Date.now() - 86400_000);

const mockWorkspace = {
  id: 'ws-1',
  name: 'Test Workspace',
  slug: 'test-workspace',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockMember = {
  userId: 'user-1',
  workspaceId: 'ws-1',
  role: 'OWNER',
  createdAt: new Date('2024-01-01'),
  user: { id: 'user-1', name: 'Alice', email: 'alice@test.com' },
};

const mockMemberAdmin = {
  userId: 'user-2',
  workspaceId: 'ws-1',
  role: 'ADMIN',
  createdAt: new Date('2024-01-01'),
  user: { id: 'user-2', name: 'Bob', email: 'bob@test.com' },
};

const mockMemberViewer = {
  userId: 'user-3',
  workspaceId: 'ws-1',
  role: 'VIEWER',
  createdAt: new Date('2024-01-01'),
  user: { id: 'user-3', name: 'Charlie', email: 'charlie@test.com' },
};

const mockInvitation = {
  id: 'inv-1',
  workspaceId: 'ws-1',
  invitedEmail: 'invited@test.com',
  role: 'MEMBER',
  token: 'valid-token',
  status: 'PENDING',
  expiresAt: futureDate,
  invitedById: 'user-1',
  createdAt: new Date('2024-01-01'),
  workspace: { name: 'Test Workspace' },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('WorkspacesService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // ── list ───────────────────────────────────────────────────────────────
  describe('list', () => {
    it('returns workspace DTOs for the user memberships', async () => {
      vi.mocked(prisma.workspaceMember.findMany).mockResolvedValue([
        {
          workspace: mockWorkspace,
          role: 'OWNER',
          userId: 'user-1',
          workspaceId: 'ws-1',
          createdAt: new Date(),
        },
      ] as any);

      const result = await workspacesService.list('user-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: mockWorkspace.id,
        name: mockWorkspace.name,
        slug: mockWorkspace.slug,
        role: 'OWNER',
      });
    });
  });

  // ── getById ────────────────────────────────────────────────────────────
  describe('getById', () => {
    it('returns workspace and role when user is a member', async () => {
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue({
        workspace: mockWorkspace,
        role: 'MEMBER',
      } as any);

      const result = await workspacesService.getById('ws-1', 'user-1');

      expect(result.workspace.id).toBe('ws-1');
      expect(result.role).toBe('MEMBER');
    });

    it('throws 404 when user is not a member', async () => {
      vi.mocked(prisma.workspaceMember.findFirst).mockResolvedValue(null);

      await expect(workspacesService.getById('ws-1', 'user-1')).rejects.toMatchObject({
        message: 'Workspace not found',
        statusCode: 404,
      });
    });
  });

  // ── create ─────────────────────────────────────────────────────────────
  describe('create', () => {
    it('creates workspace with owner membership on valid data', async () => {
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.workspace.create).mockResolvedValue(mockWorkspace as any);

      const result = await workspacesService.create({ name: 'Test Workspace' }, 'user-1');

      expect(prisma.workspace.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Workspace',
          slug: 'test-workspace',
          members: { create: { userId: 'user-1', role: 'OWNER' } },
        },
      });
      expect(result).toEqual({
        id: 'ws-1',
        name: 'Test Workspace',
        slug: 'test-workspace',
        role: 'OWNER',
      });
    });

    it('throws 409 conflict when slug already exists', async () => {
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue(mockWorkspace as any);

      await expect(
        workspacesService.create({ name: 'Test Workspace' }, 'user-1'),
      ).rejects.toMatchObject({
        message: 'Workspace slug already exists',
        statusCode: 409,
      });
    });

    it('blocks unverified users from creating more than 1 workspace', async () => {
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        emailVerified: false,
      } as any);
      vi.mocked(prisma.workspaceMember.count).mockResolvedValue(1);

      await expect(
        workspacesService.create({ name: 'Second WS' }, 'user-1'),
      ).rejects.toMatchObject({
        message: 'Verify your email to create more workspaces',
        statusCode: 403,
      });
    });

    it('allows unverified users to create their first workspace', async () => {
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        emailVerified: false,
      } as any);
      vi.mocked(prisma.workspaceMember.count).mockResolvedValue(0);
      vi.mocked(prisma.workspace.create).mockResolvedValue(mockWorkspace as any);

      const result = await workspacesService.create({ name: 'First WS' }, 'user-1');

      expect(result.id).toBe('ws-1');
      expect(prisma.workspace.create).toHaveBeenCalled();
    });

    it('blocks verified users from creating more than 20 workspaces', async () => {
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        emailVerified: true,
      } as any);
      vi.mocked(prisma.workspaceMember.count).mockResolvedValue(20);

      await expect(
        workspacesService.create({ name: 'WS 21' }, 'user-1'),
      ).rejects.toMatchObject({
        message: 'Maximum 20 workspaces reached',
        statusCode: 403,
      });
    });

    it('allows verified users to create workspace under limit', async () => {
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        emailVerified: true,
      } as any);
      vi.mocked(prisma.workspaceMember.count).mockResolvedValue(5);
      vi.mocked(prisma.workspace.create).mockResolvedValue(mockWorkspace as any);

      const result = await workspacesService.create({ name: 'WS 6' }, 'user-1');

      expect(result.id).toBe('ws-1');
    });
  });

  // ── update ─────────────────────────────────────────────────────────────
  describe('update', () => {
    it('updates name and slug and returns updated DTO', async () => {
      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        userId: 'user-1',
        workspaceId: 'ws-1',
        role: 'OWNER',
      } as any);
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue(null); // slug check: no conflict
      vi.mocked(prisma.workspace.update).mockResolvedValue({
        ...mockWorkspace,
        name: 'Updated Name',
        slug: 'updated-slug',
      } as any);

      const result = await workspacesService.update(
        'ws-1',
        { name: 'Updated Name', slug: 'updated-slug' },
        'user-1',
      );

      expect(prisma.workspace.update).toHaveBeenCalledWith({
        where: { id: 'ws-1' },
        data: { name: 'Updated Name', slug: 'updated-slug' },
      });
      expect(result).toEqual({
        id: 'ws-1',
        name: 'Updated Name',
        slug: 'updated-slug',
        role: 'OWNER',
      });
    });

    it('throws 404/403 when membership not found (not owner/admin)', async () => {
      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null);

      await expect(
        workspacesService.update('ws-1', { name: 'New' }, 'user-1'),
      ).rejects.toMatchObject({ message: 'Forbidden', statusCode: 403 });
    });

    it('throws 409 when slug already exists on another workspace', async () => {
      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        userId: 'user-1',
        workspaceId: 'ws-1',
        role: 'OWNER',
      } as any);
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue({
        id: 'ws-other',
        name: 'Other',
        slug: 'conflict-slug',
      } as any);

      await expect(
        workspacesService.update('ws-1', { slug: 'conflict-slug' }, 'user-1'),
      ).rejects.toMatchObject({ message: 'Workspace slug already exists', statusCode: 409 });
    });
  });

  // ── delete ─────────────────────────────────────────────────────────────
  describe('delete', () => {
    it('deletes workspace when user is owner', async () => {
      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        userId: 'user-1',
        workspaceId: 'ws-1',
        role: 'OWNER',
      } as any);
      vi.mocked(prisma.workspace.delete).mockResolvedValue(mockWorkspace as any);

      await workspacesService.delete('ws-1', 'user-1');

      expect(prisma.workspace.delete).toHaveBeenCalledWith({ where: { id: 'ws-1' } });
    });

    it('throws 403 when user is not owner', async () => {
      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        userId: 'user-1',
        workspaceId: 'ws-1',
        role: 'MEMBER',
      } as any);

      await expect(workspacesService.delete('ws-1', 'user-1')).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it('throws 403 when membership not found', async () => {
      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null);

      await expect(workspacesService.delete('ws-1', 'user-1')).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  // ── createInvitation ───────────────────────────────────────────────────
  describe('createInvitation', () => {
    it('creates invitation for a non-existing user email', async () => {
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue(mockWorkspace as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null); // invited email not registered
      vi.mocked(prisma.workspaceInvitation.create).mockResolvedValue(mockInvitation as any);

      const result = await workspacesService.createInvitation(
        'ws-1',
        'newuser@test.com',
        'MEMBER',
        'user-1',
      );

      expect(prisma.workspaceInvitation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            invitedEmail: 'newuser@test.com',
            role: 'MEMBER',
            workspaceId: 'ws-1',
          }),
        }),
      );
      expect(result.id).toBe('inv-1');
      // No notification should be sent for non-existing user
      expect(notificationsService.create).not.toHaveBeenCalled();
      // No email should be sent for non-existing user
      expect(emailService.sendInvitationEmail).not.toHaveBeenCalled();
    });

    it('throws 409 when invited email is already a member', async () => {
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue(mockWorkspace as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'existing-user',
        email: 'member@test.com',
        name: 'Member',
      } as any);
      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue({
        userId: 'existing-user',
        workspaceId: 'ws-1',
        role: 'MEMBER',
      } as any);

      await expect(
        workspacesService.createInvitation('ws-1', 'member@test.com', 'MEMBER', 'user-1'),
      ).rejects.toMatchObject({
        message: 'User is already a member of this workspace',
        statusCode: 409,
      });
    });

    it('throws 409 when duplicate pending invitation exists', async () => {
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue(mockWorkspace as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null); // not registered
      vi.mocked(prisma.workspaceInvitation.findFirst).mockResolvedValue(mockInvitation as any);

      await expect(
        workspacesService.createInvitation('ws-1', 'invited@test.com', 'MEMBER', 'user-1'),
      ).rejects.toMatchObject({
        message: 'An invitation for this email is already pending',
        statusCode: 409,
      });
    });

    it('sends notification when invited user exists', async () => {
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue(mockWorkspace as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'target-user',
        email: 'target@test.com',
        name: 'Target',
      } as any);
      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null); // not a member
      vi.mocked(prisma.workspaceInvitation.findFirst).mockResolvedValue(null); // no pending
      vi.mocked(prisma.workspaceInvitation.create).mockResolvedValue(mockInvitation as any);
      // Second user lookup for inviter name
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-1',
        email: 'owner@test.com',
        name: 'Owner',
      } as any);

      await workspacesService.createInvitation('ws-1', 'target@test.com', 'ADMIN', 'user-1');

      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'target-user',
          type: 'INVITE_SENT',
          workspaceId: 'ws-1',
        }),
      );

      // Verify email was sent
      expect(emailService.sendInvitationEmail).toHaveBeenCalledWith(
        expect.any(String),
        'target@test.com',
        'Test Workspace',
        'Owner',
      );
    });

    it('does NOT send email when invited user is not registered', async () => {
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue(mockWorkspace as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null); // invited email not registered
      vi.mocked(prisma.workspaceInvitation.create).mockResolvedValue(mockInvitation as any);

      await workspacesService.createInvitation(
        'ws-1',
        'newuser@test.com',
        'MEMBER',
        'user-1',
      );

      // No notification, no email
      expect(notificationsService.create).not.toHaveBeenCalled();
      expect(emailService.sendInvitationEmail).not.toHaveBeenCalled();
    });
  });

  // ── getInvitationByToken ───────────────────────────────────────────────
  describe('getInvitationByToken', () => {
    it('returns invitation DTO for valid token', async () => {
      vi.mocked(prisma.workspaceInvitation.findUnique).mockResolvedValue(mockInvitation as any);

      const result = await workspacesService.getInvitationByToken('valid-token');

      expect(result.token).toBe('valid-token');
      expect(result.workspaceName).toBe('Test Workspace');
    });

    it('throws 404 when invitation not found', async () => {
      vi.mocked(prisma.workspaceInvitation.findUnique).mockResolvedValue(null);

      await expect(workspacesService.getInvitationByToken('invalid')).rejects.toMatchObject({
        message: 'Invitation not found',
        statusCode: 404,
      });
    });

    it('throws 410 when invitation is expired', async () => {
      vi.mocked(prisma.workspaceInvitation.findUnique).mockResolvedValue({
        ...mockInvitation,
        expiresAt: pastDate,
        workspace: { name: 'Test' },
      } as any);

      await expect(workspacesService.getInvitationByToken('expired')).rejects.toMatchObject({
        message: 'Invitation has expired',
        statusCode: 410,
      });
    });
  });

  // ── acceptInvitation ───────────────────────────────────────────────────
  describe('acceptInvitation', () => {
    it('creates member and accepts invitation for valid token', async () => {
      vi.mocked(prisma.workspaceInvitation.findUnique).mockResolvedValue(mockInvitation as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'invited@test.com',
        name: 'Invited User',
      } as any);
      vi.mocked(prisma.workspaceMember.create).mockResolvedValue(mockMember as any);
      vi.mocked(prisma.workspaceInvitation.update).mockResolvedValue({
        ...mockInvitation,
        status: 'ACCEPTED',
      } as any);

      const result = await workspacesService.acceptInvitation('valid-token', 'user-1');

      expect(prisma.workspaceMember.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            workspaceId: 'ws-1',
            role: 'MEMBER',
          }),
        }),
      );
      expect(prisma.workspaceInvitation.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'ACCEPTED' } }),
      );
      expect(result.userId).toBe('user-1');
    });

    it('throws 404 when invitation not found', async () => {
      vi.mocked(prisma.workspaceInvitation.findUnique).mockResolvedValue(null);

      await expect(workspacesService.acceptInvitation('invalid', 'user-1')).rejects.toMatchObject({
        message: 'Invitation not found',
        statusCode: 404,
      });
    });

    it('throws 409 when invitation is already accepted', async () => {
      vi.mocked(prisma.workspaceInvitation.findUnique).mockResolvedValue({
        ...mockInvitation,
        status: 'ACCEPTED',
      } as any);

      await expect(workspacesService.acceptInvitation('accepted', 'user-1')).rejects.toMatchObject({
        message: 'Invitation has already been accepted',
        statusCode: 409,
      });
    });

    it('throws 410 when invitation is expired', async () => {
      vi.mocked(prisma.workspaceInvitation.findUnique).mockResolvedValue({
        ...mockInvitation,
        expiresAt: pastDate,
      } as any);

      await expect(workspacesService.acceptInvitation('expired', 'user-1')).rejects.toMatchObject({
        message: 'Invitation has expired',
        statusCode: 410,
      });
    });

    it('throws 403 when email does not match', async () => {
      vi.mocked(prisma.workspaceInvitation.findUnique).mockResolvedValue(mockInvitation as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-2',
        email: 'other@test.com',
        name: 'Other',
      } as any);

      await expect(
        workspacesService.acceptInvitation('valid-token', 'user-2'),
      ).rejects.toMatchObject({
        message: 'This invitation was sent to a different email address',
        statusCode: 403,
      });
    });
  });

  // ── declineInvitation ──────────────────────────────────────────────────
  describe('declineInvitation', () => {
    it('cancels invitation when email matches', async () => {
      vi.mocked(prisma.workspaceInvitation.findUnique).mockResolvedValue(mockInvitation as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'invited@test.com',
        name: 'User',
      } as any);
      vi.mocked(prisma.workspaceInvitation.update).mockResolvedValue({
        ...mockInvitation,
        status: 'CANCELLED',
      } as any);

      await workspacesService.declineInvitation('valid-token', 'user-1');

      expect(prisma.workspaceInvitation.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'CANCELLED' } }),
      );
    });

    it('throws 409 when already processed', async () => {
      vi.mocked(prisma.workspaceInvitation.findUnique).mockResolvedValue({
        ...mockInvitation,
        status: 'ACCEPTED',
      } as any);

      await expect(workspacesService.declineInvitation('accepted', 'user-1')).rejects.toMatchObject(
        {
          message: 'Invitation has already been processed',
          statusCode: 409,
        },
      );
    });
  });

  // ── cancelInvitation ───────────────────────────────────────────────────
  describe('cancelInvitation', () => {
    it('cancels a pending invitation', async () => {
      vi.mocked(prisma.workspaceInvitation.findFirst).mockResolvedValue(mockInvitation as any);
      vi.mocked(prisma.workspaceInvitation.update).mockResolvedValue({
        ...mockInvitation,
        status: 'CANCELLED',
      } as any);

      await workspacesService.cancelInvitation('ws-1', 'inv-1', 'user-1');

      expect(prisma.workspaceInvitation.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'CANCELLED' } }),
      );
    });

    it('throws 404 when invitation not found', async () => {
      vi.mocked(prisma.workspaceInvitation.findFirst).mockResolvedValue(null);

      await expect(
        workspacesService.cancelInvitation('ws-1', 'inv-1', 'user-1'),
      ).rejects.toMatchObject({ message: 'Invitation not found', statusCode: 404 });
    });

    it('throws 409 when invitation is not pending', async () => {
      vi.mocked(prisma.workspaceInvitation.findFirst).mockResolvedValue({
        ...mockInvitation,
        status: 'ACCEPTED',
      } as any);

      await expect(
        workspacesService.cancelInvitation('ws-1', 'inv-1', 'user-1'),
      ).rejects.toMatchObject({
        message: 'Cannot cancel an invitation that is not pending',
        statusCode: 409,
      });
    });
  });

  // ── listPendingInvitations ─────────────────────────────────────────────
  describe('listPendingInvitations', () => {
    it('returns pending invitations for the user email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        name: 'User',
      } as any);
      vi.mocked(prisma.workspaceInvitation.findMany).mockResolvedValue([mockInvitation] as any);

      const result = await workspacesService.listPendingInvitations('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].token).toBe('valid-token');
    });

    it('throws 404 when user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(workspacesService.listPendingInvitations('unknown')).rejects.toMatchObject({
        message: 'User not found',
        statusCode: 404,
      });
    });
  });

  // ── listWorkspaceInvitations ───────────────────────────────────────────
  describe('listWorkspaceInvitations', () => {
    it('returns all invitations for workspace', async () => {
      vi.mocked(prisma.workspaceInvitation.findMany).mockResolvedValue([mockInvitation] as any);

      const result = await workspacesService.listWorkspaceInvitations('ws-1');

      expect(result).toHaveLength(1);
      expect(prisma.workspaceInvitation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { workspaceId: 'ws-1' } }),
      );
    });
  });

  // ── listWorkspaceMembers ───────────────────────────────────────────────
  describe('listWorkspaceMembers', () => {
    it('returns members with user info', async () => {
      vi.mocked(prisma.workspaceMember.findMany).mockResolvedValue([
        mockMember,
        mockMemberAdmin,
      ] as any);

      const result = await workspacesService.listWorkspaceMembers('ws-1');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alice');
      expect(result[0].email).toBe('alice@test.com');
    });
  });

  // ── changeMemberRole ───────────────────────────────────────────────────
  describe('changeMemberRole', () => {
    it('changes role for a member', async () => {
      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValueOnce(mockMemberViewer as any);
      vi.mocked(prisma.workspace.findUnique).mockResolvedValue(mockWorkspace as any);
      vi.mocked(prisma.workspaceMember.update).mockResolvedValue({
        ...mockMemberViewer,
        role: 'ADMIN',
        user: { id: 'user-3', name: 'Charlie', email: 'charlie@test.com' },
      } as any);

      const result = await workspacesService.changeMemberRole('ws-1', 'user-3', 'ADMIN', 'user-1');

      expect(result.role).toBe('ADMIN');
      // Verify notification was created
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-3',
          type: 'ROLE_CHANGED',
        }),
      );
      // Verify email was sent
      expect(emailService.sendRoleChangedEmail).toHaveBeenCalledWith(
        'charlie@test.com',
        'Test Workspace',
        'ADMIN',
      );
    });

    it('throws 403 when trying to set role to OWNER', async () => {
      await expect(
        workspacesService.changeMemberRole('ws-1', 'user-3', 'OWNER', 'user-1'),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('throws 404 when target member not found', async () => {
      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null);

      await expect(
        workspacesService.changeMemberRole('ws-1', 'unknown', 'ADMIN', 'user-1'),
      ).rejects.toMatchObject({ message: 'Member not found', statusCode: 404 });
    });

    it('throws 403 when trying to change owner role', async () => {
      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(mockMember as any);

      await expect(
        workspacesService.changeMemberRole('ws-1', 'user-1', 'ADMIN', 'user-1'),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('throws 403 when trying to demote the last ADMIN', async () => {
      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValueOnce(mockMemberAdmin as any);
      vi.mocked(prisma.workspaceMember.count).mockResolvedValue(1); // last admin

      await expect(
        workspacesService.changeMemberRole('ws-1', 'user-2', 'MEMBER', 'user-1'),
      ).rejects.toMatchObject({
        message: 'Cannot change the role of the last ADMIN',
        statusCode: 403,
      });
    });
  });

  // ── removeMember ───────────────────────────────────────────────────────
  describe('removeMember', () => {
    it('removes a member successfully', async () => {
      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValueOnce(mockMemberViewer as any);
      vi.mocked(prisma.workspaceMember.delete).mockResolvedValue(mockMemberViewer as any);

      await workspacesService.removeMember('ws-1', 'user-3', 'user-1');

      expect(prisma.workspaceMember.delete).toHaveBeenCalledWith({
        where: { userId_workspaceId: { userId: 'user-3', workspaceId: 'ws-1' } },
      });
    });

    it('throws 404 when target member not found', async () => {
      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(null);

      await expect(
        workspacesService.removeMember('ws-1', 'unknown', 'user-1'),
      ).rejects.toMatchObject({ message: 'Member not found', statusCode: 404 });
    });

    it('throws 403 when trying to remove the owner', async () => {
      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValue(mockMember as any);

      await expect(
        workspacesService.removeMember('ws-1', 'user-1', 'user-2'),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('throws 403 when owner tries to self-remove without transferring ownership', async () => {
      // First call finds the target (self), second call finds the actor role
      vi.mocked(prisma.workspaceMember.findUnique)
        .mockResolvedValueOnce(mockMember as any) // target = self
        .mockResolvedValueOnce(mockMember as any); // actor = self, role = OWNER

      await expect(
        workspacesService.removeMember('ws-1', 'user-1', 'user-1'),
      ).rejects.toMatchObject({
        message: 'Transfer ownership before leaving the workspace',
        statusCode: 403,
      });
    });

    it('throws 403 when trying to remove the last ADMIN', async () => {
      vi.mocked(prisma.workspaceMember.findUnique).mockResolvedValueOnce(mockMemberAdmin as any); // target is admin
      vi.mocked(prisma.workspaceMember.count).mockResolvedValue(1); // last admin

      await expect(
        workspacesService.removeMember('ws-1', 'user-2', 'user-1'),
      ).rejects.toMatchObject({
        message: 'Cannot remove the last ADMIN',
        statusCode: 403,
      });
    });
  });
});
