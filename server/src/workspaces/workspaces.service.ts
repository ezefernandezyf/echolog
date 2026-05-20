import crypto from 'node:crypto';
import type { InvitationStatus, WorkspaceRole } from '@prisma/client';
import { HttpError } from '../infra/http.js';
import { prisma } from '../infra/prisma.js';
import { slugify } from '../../../shared/lib/slugify.js';
import type {
  CreateWorkspaceDTO,
  InvitationDTO,
  MemberDTO,
  UpdateWorkspaceDTO,
  WorkspaceDTO,
} from '../../../shared/contracts/index.js';

export class WorkspacesService {
  async list(userId: string): Promise<WorkspaceDTO[]> {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true },
    });

    return memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      role: m.role,
    }));
  }

  async getById(workspaceId: string, userId: string) {
    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId },
      include: { workspace: true },
    });

    if (!member) {
      throw new HttpError('Workspace not found', 404);
    }

    return { workspace: member.workspace, role: member.role };
  }

  async create(input: CreateWorkspaceDTO, userId: string): Promise<WorkspaceDTO> {
    const slug = slugify(input.name);

    const existing = await prisma.workspace.findUnique({ where: { slug } });
    if (existing) {
      throw new HttpError('Workspace slug already exists', 409);
    }

    const workspace = await prisma.workspace.create({
      data: {
        name: input.name,
        slug,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
    });

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      role: 'OWNER',
    };
  }

  async update(
    workspaceId: string,
    input: UpdateWorkspaceDTO,
    userId: string,
  ): Promise<WorkspaceDTO> {
    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      throw new HttpError('Forbidden', 403);
    }

    // If slug is being changed, check uniqueness
    if (input.slug) {
      const existing = await prisma.workspace.findUnique({ where: { slug: input.slug } });
      if (existing && existing.id !== workspaceId) {
        throw new HttpError('Workspace slug already exists', 409);
      }
    }

    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.slug !== undefined && { slug: input.slug }),
      },
    });

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      role: membership.role,
    };
  }

  async delete(workspaceId: string, userId: string): Promise<void> {
    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!membership || membership.role !== 'OWNER') {
      throw new HttpError('Forbidden: only the workspace owner can delete it', 403);
    }

    await prisma.workspace.delete({ where: { id: workspaceId } });
  }

  // ── Invitation Methods ──────────────────────────────────────────────

  async createInvitation(
    workspaceId: string,
    invitedEmail: string,
    role: string,
    invitedById: string,
  ): Promise<InvitationDTO> {
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!workspace) {
      throw new HttpError('Workspace not found', 404);
    }

    // Check invited email is not already a member
    const invitedUser = await prisma.user.findUnique({ where: { email: invitedEmail } });
    if (invitedUser) {
      const existingMembership = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: invitedUser.id, workspaceId } },
      });
      if (existingMembership) {
        throw new HttpError('User is already a member of this workspace', 409);
      }
    }

    // Check no existing PENDING invitation for same workspace + email
    const existingInvitation = await prisma.workspaceInvitation.findFirst({
      where: { workspaceId, invitedEmail, status: 'PENDING' },
    });
    if (existingInvitation) {
      throw new HttpError('An invitation for this email is already pending', 409);
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await prisma.workspaceInvitation.create({
      data: {
        workspaceId,
        invitedEmail,
        role: role as WorkspaceRole,
        token,
        expiresAt,
        invitedById,
      },
      include: { workspace: { select: { name: true } } },
    });

    return {
      id: invitation.id,
      workspaceId: invitation.workspaceId,
      workspaceName: invitation.workspace.name,
      invitedEmail: invitation.invitedEmail,
      role: invitation.role as WorkspaceRole,
      status: invitation.status as InvitationStatus,
      token: invitation.token,
      expiresAt: invitation.expiresAt.toISOString(),
    };
  }

  async getInvitationByToken(token: string): Promise<InvitationDTO> {
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token },
      include: { workspace: { select: { name: true } } },
    });

    if (!invitation) {
      throw new HttpError('Invitation not found', 404);
    }

    if (invitation.expiresAt < new Date()) {
      throw new HttpError('Invitation has expired', 410);
    }

    return {
      id: invitation.id,
      workspaceId: invitation.workspaceId,
      workspaceName: invitation.workspace.name,
      invitedEmail: invitation.invitedEmail,
      role: invitation.role as WorkspaceRole,
      status: invitation.status as InvitationStatus,
      token: invitation.token,
      expiresAt: invitation.expiresAt.toISOString(),
    };
  }

  async acceptInvitation(token: string, userId: string): Promise<MemberDTO> {
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new HttpError('Invitation not found', 404);
    }

    if (invitation.status !== 'PENDING') {
      throw new HttpError('Invitation has already been accepted', 409);
    }

    if (invitation.expiresAt < new Date()) {
      throw new HttpError('Invitation has expired', 410);
    }

    // Validate that the authenticated user's email matches the invited email
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new HttpError('You need to register first before accepting this invitation', 400);
    }
    if (user.email !== invitation.invitedEmail) {
      throw new HttpError('This invitation was sent to a different email address', 403);
    }

    // Transaction: create member + update invitation
    const [member] = await prisma.$transaction([
      prisma.workspaceMember.create({
        data: {
          userId,
          workspaceId: invitation.workspaceId,
          role: invitation.role,
        },
      }),
      prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' },
      }),
    ]);

    return {
      userId: member.userId,
      workspaceId: member.workspaceId,
      role: member.role as WorkspaceRole,
      name: user.name,
      email: user.email,
      joinedAt: member.createdAt.toISOString(),
    };
  }

  async declineInvitation(token: string, userId: string): Promise<void> {
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new HttpError('Invitation not found', 404);
    }

    if (invitation.status !== 'PENDING') {
      throw new HttpError('Invitation has already been processed', 409);
    }

    // Validate that the authenticated user's email matches the invited email
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new HttpError('User not found', 404);
    }
    if (user.email !== invitation.invitedEmail) {
      throw new HttpError('This invitation was sent to a different email address', 403);
    }

    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { status: 'CANCELLED' },
    });
  }

  async listWorkspaceInvitations(workspaceId: string): Promise<InvitationDTO[]> {
    const invitations = await prisma.workspaceInvitation.findMany({
      where: { workspaceId },
      include: { workspace: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((inv) => ({
      id: inv.id,
      workspaceId: inv.workspaceId,
      workspaceName: inv.workspace.name,
      invitedEmail: inv.invitedEmail,
      role: inv.role as WorkspaceRole,
      status: inv.status as InvitationStatus,
      token: inv.token,
      expiresAt: inv.expiresAt.toISOString(),
    }));
  }

  // ── Member Methods ──────────────────────────────────────────────────

  async listWorkspaceMembers(workspaceId: string): Promise<MemberDTO[]> {
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return members.map((m) => ({
      userId: m.userId,
      workspaceId: m.workspaceId,
      role: m.role as WorkspaceRole,
      name: m.user.name,
      email: m.user.email,
      joinedAt: m.createdAt.toISOString(),
    }));
  }

  async changeMemberRole(
    workspaceId: string,
    targetUserId: string,
    newRole: string,
    actorUserId: string,
  ): Promise<MemberDTO> {
    if (newRole === 'OWNER') {
      throw new HttpError('Cannot set role to OWNER. Ownership transfer is out of scope.', 403);
    }

    const targetMember = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!targetMember) {
      throw new HttpError('Member not found', 404);
    }

    if (targetMember.role === 'OWNER') {
      throw new HttpError('Cannot change the role of the workspace owner', 403);
    }

    // Check last ADMIN demotion
    if (
      targetMember.role === 'ADMIN' &&
      newRole !== 'ADMIN'
    ) {
      const adminCount = await prisma.workspaceMember.count({
        where: { workspaceId, role: 'ADMIN' },
      });
      if (adminCount <= 1) {
        throw new HttpError('Cannot change the role of the last ADMIN', 403);
      }
    }

    const updated = await prisma.workspaceMember.update({
      where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
      data: { role: newRole as WorkspaceRole },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return {
      userId: updated.userId,
      workspaceId: updated.workspaceId,
      role: updated.role as WorkspaceRole,
      name: updated.user.name,
      email: updated.user.email,
      joinedAt: updated.createdAt.toISOString(),
    };
  }

  async removeMember(
    workspaceId: string,
    targetUserId: string,
    actorUserId: string,
  ): Promise<void> {
    const targetMember = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
    });

    if (!targetMember) {
      throw new HttpError('Member not found', 404);
    }

    if (targetMember.role === 'OWNER') {
      throw new HttpError('Cannot remove the workspace owner', 403);
    }

    // Cannot remove self if OWNER
    if (targetUserId === actorUserId) {
      const actorMember = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: actorUserId, workspaceId } },
      });
      if (actorMember?.role === 'OWNER') {
        throw new HttpError('Transfer ownership before leaving the workspace', 403);
      }
    }

    // Check last ADMIN removal
    if (targetMember.role === 'ADMIN') {
      const adminCount = await prisma.workspaceMember.count({
        where: { workspaceId, role: 'ADMIN' },
      });
      if (adminCount <= 1) {
        throw new HttpError('Cannot remove the last ADMIN', 403);
      }
    }

    await prisma.workspaceMember.delete({
      where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
    });
  }
}

export const workspacesService = new WorkspacesService();
