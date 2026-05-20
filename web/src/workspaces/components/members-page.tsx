'use client';

import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { membersApi, invitationsApi } from '../../core/api-client';
import { useAuthStore } from '../../auth/auth-store';
import { Button } from '../../shared/components/ui/button';
import { Badge } from '../../shared/components/ui/badge';
import { ConfirmDialog } from '../../shared/components/ui/confirm-dialog';
import { ErrorAlert } from '../../shared/components/ui/error-alert';
import { PageTitle } from '../../core/page-title';
import { InviteMemberForm } from './invite-member-form';
import { PendingInvitationsList } from './pending-invitations-list';
import type { MemberDTO, WorkspaceRole } from '../../../../shared/contracts/index.js';

const ROLE_BADGE_COLORS: Record<string, string> = {
  OWNER: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  ADMIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  MEMBER: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300',
  VIEWER: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
};

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
  VIEWER: 'Viewer',
};

const ADMIN_ROLES: WorkspaceRole[] = ['ADMIN', 'MEMBER', 'VIEWER'];

export function MembersPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.session?.user?.id);
  const [removeTarget, setRemoveTarget] = useState<MemberDTO | null>(null);

  // Fetch member list
  const membersQuery = useQuery({
    queryKey: ['members', workspaceId],
    queryFn: () => membersApi.list(workspaceId!),
    enabled: !!workspaceId,
  });

  // Fetch pending invitations
  const invitationsQuery = useQuery({
    queryKey: ['invitations', workspaceId],
    queryFn: () => invitationsApi.listPending(workspaceId!),
    enabled: !!workspaceId,
  });

  // Determine current user's role
  const currentMember = Array.isArray(membersQuery.data)
    ? membersQuery.data.find((m) => m.userId === currentUserId)
    : null;
  const isAdmin = currentMember?.role === 'OWNER' || currentMember?.role === 'ADMIN';
  const isOwner = currentMember?.role === 'OWNER';

  // Change role mutation
  const changeRoleMutation = useMutation({
    mutationFn: ({
      targetUserId,
      newRole,
    }: {
      targetUserId: string;
      newRole: WorkspaceRole;
    }) => membersApi.changeRole(workspaceId!, targetUserId, newRole),
    onSuccess: () => {
      toast.success('Role updated');
      queryClient.invalidateQueries({ queryKey: ['members', workspaceId] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update role');
    },
  });

  // Remove member mutation
  const removeMutation = useMutation({
    mutationFn: (targetUserId: string) => membersApi.remove(workspaceId!, targetUserId),
    onSuccess: () => {
      toast.success('Member removed');
      queryClient.invalidateQueries({ queryKey: ['members', workspaceId] });
      setRemoveTarget(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to remove member');
    },
  });

  if (membersQuery.isPending) {
    return (
      <main id="main-content" className="mx-auto w-full max-w-2xl px-4 py-10 animate-fade-in">
        <PageTitle title="Members" />
        <div className="space-y-6">
          <div className="h-8 w-32 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-700" />
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (membersQuery.isError) {
    return (
      <main id="main-content" className="mx-auto w-full max-w-2xl px-4 py-10 animate-fade-in">
        <ErrorAlert
          message="Failed to load members"
          onRetry={() => membersQuery.refetch()}
        />
      </main>
    );
  }

  if (!currentMember) {
    return (
      <main id="main-content" className="mx-auto w-full max-w-2xl px-4 py-10 animate-fade-in">
        <PageTitle title="Members" />
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-white px-6 py-16 text-center dark:border-zinc-800 dark:bg-card">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            You are not a member of this workspace.
          </p>
          <Link
            to="/w"
            className="mt-4 inline-block text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
          >
            Back to workspaces
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="mx-auto w-full max-w-2xl px-4 py-10 animate-fade-in">
      <PageTitle title="Members" />

      <div className="space-y-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
          <Link
            to="/w"
            className="text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Workspaces
          </Link>
          <span className="text-zinc-300 dark:text-zinc-600">/</span>
          <span className="text-zinc-900 dark:text-zinc-100" aria-current="page">
            Members
          </span>
        </nav>

        {/* Invite Form — only for OWNER/ADMIN */}
        {isAdmin ? (
          <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-card">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Invite Member
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Send an invitation link to join this workspace.
              </p>
            </div>
            <InviteMemberForm workspaceId={workspaceId!} />
          </section>
        ) : null}

        {/* Pending Invitations — only for OWNER/ADMIN */}
        {isAdmin ? (
          <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-card">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Pending Invitations
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Invitations that have been sent but not yet accepted.
              </p>
            </div>
            <PendingInvitationsList
              workspaceId={workspaceId!}
              invitations={Array.isArray(invitationsQuery.data) ? invitationsQuery.data.filter((inv) => inv.status === 'PENDING') : []}
              isLoading={invitationsQuery.isPending}
            />
          </section>
        ) : null}

        {/* Members List */}
        <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-card">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Members</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {Array.isArray(membersQuery.data) ? membersQuery.data.length : 0} member
              {Array.isArray(membersQuery.data) && membersQuery.data.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {Array.isArray(membersQuery.data) &&
              membersQuery.data.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  {/* Avatar */}
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                    {getInitials(member.name, member.email)}
                  </div>

                  {/* User Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {member.name ?? member.email}
                    </p>
                    {member.name ? (
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {member.email}
                      </p>
                    ) : null}
                  </div>

                  {/* Role Badge */}
                  <Badge className={ROLE_BADGE_COLORS[member.role] ?? ''}>
                    {ROLE_LABELS[member.role] ?? member.role}
                  </Badge>

                  {/* Admin Actions */}
                  {isAdmin && member.role !== 'OWNER' && member.userId !== currentUserId ? (
                    <>
                      {/* Change Role Dropdown */}
                      <select
                        className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-card dark:text-zinc-300"
                        value={member.role}
                        disabled={changeRoleMutation.isPending}
                        onChange={(e) =>
                          changeRoleMutation.mutate({
                            targetUserId: member.userId,
                            newRole: e.target.value as WorkspaceRole,
                          })
                        }
                      >
                        {ADMIN_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>

                      {/* Remove Button */}
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                        onClick={() => setRemoveTarget(member)}
                      >
                        Remove
                      </Button>
                    </>
                  ) : null}

                  {/* Self-remove for non-OWNER */}
                  {member.userId === currentUserId && !isOwner ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                      onClick={() => setRemoveTarget(member)}
                    >
                      Leave
                    </Button>
                  ) : null}
                </div>
              ))}
          </div>
        </section>
      </div>

      {/* Confirm Remove Dialog */}
      <ConfirmDialog
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => {
          if (removeTarget) {
            removeMutation.mutate(removeTarget.userId);
          }
        }}
        title={
          removeTarget?.userId === currentUserId
            ? 'Leave workspace'
            : 'Remove member'
        }
        message={
          removeTarget?.userId === currentUserId
            ? 'Are you sure you want to leave this workspace? You may lose access to boards and posts.'
            : `Remove ${removeTarget?.name ?? removeTarget?.email} from this workspace? They will lose access to all boards and posts.`
        }
        confirmLabel={removeTarget?.userId === currentUserId ? 'Leave' : 'Remove'}
        variant="danger"
        isLoading={removeMutation.isPending}
      />
    </main>
  );
}

function getInitials(name: string | null, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
}
